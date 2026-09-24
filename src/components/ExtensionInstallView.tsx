import { ArrowLeft, Download, Puzzle } from 'lucide-react';

export function ExtensionInstallView({ onBack }: { onBack: () => void }) {
  return <main className="px-5 py-6">
    <button className="mb-5 flex items-center gap-1.5 text-xs text-muted hover:text-cyan" onClick={onBack}><ArrowLeft className="size-4" />Back to Home</button>
    <h1 className="flex items-center gap-2 text-xl font-semibold"><Puzzle className="size-5 text-cyan" />Browser extension</h1>
    <p className="mt-3 text-sm leading-relaxed text-muted">Scan a webpage and highlight clauses right where you found them. Use desktop Chrome or Edge 126 or newer.</p>
    {import.meta.env.PROD ? <a className="action-button action-button-primary mt-6" href="./downloads/TermsWatch-extension.zip" download><Download className="size-5" />Download extension ZIP</a> : <p className="mt-5 text-xs text-muted">Development preview: run npm run build and load the dist folder. The production website includes the downloadable ZIP.</p>}
    <ol className="mt-6 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-slate-200">
      <li>Download and extract the ZIP into a folder you will keep.</li>
      <li>Open <code className="text-cyan">chrome://extensions</code> or <code className="text-cyan">edge://extensions</code>.</li>
      <li>Enable <strong>Developer mode</strong>, choose <strong>Load unpacked</strong>, and select the extracted folder containing manifest.json.</li>
      <li>Pin TermsWatch in the browser toolbar. Open a terms page, click TermsWatch, then choose <strong>Scan current page</strong>.</li>
    </ol>
    <p className="mt-6 rounded-xl border border-line bg-panel p-4 text-xs leading-relaxed text-muted">This is a manually installed hackathon build, not a Chrome Web Store listing. Restricted browser pages cannot be scanned. Website and extension histories are separate and stay local to each installation.</p>
  </main>;
}
