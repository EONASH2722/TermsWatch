package app.termswatch.mobile;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Queue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ShareInbox")
public class ShareInboxPlugin extends Plugin {
    private static final Queue<Intent> inbox = new ArrayDeque<>();
    private static ShareInboxPlugin current;
    private static final int MAX_FILE_BYTES = 25 * 1024 * 1024;
    private final ExecutorService io = Executors.newFixedThreadPool(2);

    public static synchronized void enqueue(Intent intent) {
        if (intent == null || !(Intent.ACTION_SEND.equals(intent.getAction()) || Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction()))) return;
        inbox.add(new Intent(intent));
        intent.setAction(Intent.ACTION_MAIN); // Do not re-import after activity recreation.
        if (current != null) current.notifyListeners("shareReceived", new JSObject(), true);
    }
    @Override public void load() { current = this; }
    @Override protected void handleOnDestroy() { if (current == this) current = null; io.shutdownNow(); }

    private static byte[] readLimited(InputStream stream, int limit) throws Exception {
        if (stream == null) throw new Exception("The shared file is no longer accessible.");
        try (InputStream input = stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) {
                if (output.size() + count > limit) throw new Exception("The shared content is too large. Limit: 25 MB per file; 5 MB for webpages.");
                output.write(buffer, 0, count);
            }
            return output.toByteArray();
        }
    }

    @SuppressWarnings("deprecation")
    @PluginMethod public void consume(PluginCall call) {
        Intent intent;
        synchronized (ShareInboxPlugin.class) { intent = inbox.poll(); }
        if (intent == null) { call.resolve(new JSObject()); return; }
        io.execute(() -> {
            try {
                JSObject result = new JSObject();
                CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
                if (text != null) result.put("text", text.toString());
                ArrayList<Uri> uris = new ArrayList<>();
                if (Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction())) {
                    ArrayList<Uri> multiple = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                    if (multiple != null) uris.addAll(multiple);
                } else {
                    Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                    if (uri != null) uris.add(uri);
                }
                if (uris.isEmpty() && intent.getClipData() != null) {
                    for (int i = 0; i < intent.getClipData().getItemCount(); i++) {
                        Uri uri = intent.getClipData().getItemAt(i).getUri();
                        if (uri != null) uris.add(uri);
                    }
                }
                if (uris.size() > 20) throw new Exception("Share at most 20 images at a time.");
                JSArray files = new JSArray(); int total = 0;
                for (Uri uri : uris) {
                    if (!"content".equals(uri.getScheme())) throw new Exception("This app did not share a readable content file. Use Android Files to share it.");
                    String mime = getContext().getContentResolver().getType(uri);
                    if (mime == null) mime = intent.getType();
                    if (mime == null || !(mime.startsWith("image/") || mime.equals("application/pdf"))) throw new Exception("Share a PDF or a document image.");
                    String name = mime.equals("application/pdf") ? "shared.pdf" : "shared.jpg";
                    try (Cursor cursor = getContext().getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                        if (cursor != null && cursor.moveToFirst()) name = cursor.getString(0);
                    }
                    byte[] bytes = readLimited(getContext().getContentResolver().openInputStream(uri), MAX_FILE_BYTES);
                    total += bytes.length;
                    if (total > 50 * 1024 * 1024) throw new Exception("Share at most 50 MB at a time.");
                    JSObject file = new JSObject();
                    file.put("name", name); file.put("mimeType", mime); file.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP)); files.put(file);
                }
                result.put("files", files); call.resolve(result);
            } catch (Exception error) {
                JSObject result = new JSObject(); result.put("error", error.getMessage()); call.resolve(result);
            }
        });
    }

    @PluginMethod public void fetchPage(PluginCall call) {
        String value = call.getString("url");
        io.execute(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(value);
                for (int redirects = 0; redirects < 6; redirects++) {
                    if (!(url.getProtocol().equals("https") || url.getProtocol().equals("http")) || url.getUserInfo() != null) throw new Exception("Only HTTP/HTTPS webpage links without embedded credentials are supported.");
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setConnectTimeout(12000); connection.setReadTimeout(15000); connection.setInstanceFollowRedirects(false);
                    connection.setRequestProperty("User-Agent", "TermsWatch/1.0 (Android; user-requested document reader)");
                    connection.setRequestProperty("Accept", "text/html,text/plain");
                    int status = connection.getResponseCode();
                    if (status >= 300 && status < 400) {
                        String location = connection.getHeaderField("Location");
                        connection.disconnect();
                        if (location == null) throw new Exception("The webpage returned an invalid redirect.");
                        url = new URL(url, location); continue;
                    }
                    if (status != 200) throw new Exception("The webpage could not be read (HTTP " + status + "). Share selected text, a PDF, or a screenshot instead.");
                    String type = connection.getContentType();
                    if (type == null || !type.toLowerCase().contains("text/html")) throw new Exception("This link is not a readable HTML page. Download the PDF or image and share that file.");
                    String html = new String(readLimited(connection.getInputStream(), 5 * 1024 * 1024), StandardCharsets.UTF_8);
                    JSObject result = new JSObject(); result.put("html", html); result.put("url", url.toString()); call.resolve(result); return;
                }
                throw new Exception("The webpage redirected too many times.");
            } catch (Exception error) { call.reject("Could not retrieve this webpage. " + error.getMessage()); }
            finally { if (connection != null) connection.disconnect(); }
        });
    }
}
