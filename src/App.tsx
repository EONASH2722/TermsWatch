import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ANALYSIS_VERSION, fallbackProvider } from './ai';
import { BrandHeader } from './components/BrandHeader';
import { Disclaimer } from './components/Disclaimer';
import { HistoryView } from './components/HistoryView';
import { HomeView } from './components/HomeView';
import { PasteTextView } from './components/PasteTextView';
import { ExtensionInstallView } from './components/ExtensionInstallView';
import { ImageSourceViewer } from './components/ImageSourceViewer';
import { LoadingState } from './components/LoadingState';
import { Navigation, type NavKey } from './components/Navigation';
import { PdfUploadView } from './components/PdfUploadView';
import { PdfViewer } from './components/PdfViewer';
import { ResultsView } from './components/ResultsView';
import { SettingsView } from './components/SettingsView';
import { AskView } from './components/AskView';
import { CaptureView } from './components/CaptureView';
import { TextSourceViewer } from './components/TextSourceViewer';
import { documentText, sha256 } from './core/extraction/normalize';
import { extractPlainText } from './core/extraction/plainText';
import { buildSemanticDiff } from './core/diff/semantic';
import { getVersionStatus } from './core/diff/versioning';
import { analyzeWithCache } from './core/analysis/cache';
import { withTimeout } from './core/async/withTimeout';
import { verifyEvidence } from './core/evidence/verify';
import { clearDocuments, countDocuments, getDocument, getLatestByUrl, listDocuments, saveDocument } from './core/storage/db';
import { DEMO_POLICY_TITLE, demoPolicyBlocks, demoOldPolicyBlocks } from './data/demoPolicy';
import { highlightWebSource, isBrowserExtension, scanCurrentPage } from './services/extension';
import { isAndroid, ShareInbox, sharedFileToFile, type SharedPayload } from './services/platform';
import { readImages, readPdf, readSharedText, readSharedUrl, type NewDocument } from './services/documents';
import type { AnswerSource, DocumentRecord, PolicyDiff, SourceRegion } from './types/document';

type Screen = NavKey | 'pdf' | 'capture' | 'paste' | 'install';
interface Notice { type: 'success' | 'error'; message: string }
interface SourcePreview { blob: Blob; page?: number; evidence: string; region?: SourceRegion }

export default function App() {
  const [screen, setScreen] = useState<Screen>('scan');
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [record, setRecord] = useState<DocumentRecord>();
  const [loading, setLoading] = useState('');
  const busy = useRef(false);
  const shareQueued = useRef(false);
  const pendingShares = useRef<SharedPayload[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [policyDiff, setPolicyDiff] = useState<PolicyDiff>();
  const [pdfSource, setPdfSource] = useState<SourcePreview>();
  const [imageSource, setImageSource] = useState<SourcePreview>();
  const [textSource, setTextSource] = useState<AnswerSource>();
  const android = isAndroid();
  const website = !android && !isBrowserExtension();

  async function refreshHistory() { const [recent, count] = await Promise.all([listDocuments(), countDocuments()]); setRecords(recent); setRecordCount(count); }
  async function work(message: string, task: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true; setLoading(message); setNotice(undefined);
    try { await task(); }
    catch (error) { setNotice({ type: 'error', message: error instanceof Error ? error.message : 'This document could not be processed.' }); }
    finally {
      busy.current = false; setLoading('');
      if (shareQueued.current || pendingShares.current.length) { shareQueued.current = false; void consumeShare(); }
    }
  }
  async function createAndStore(input: NewDocument, persist = true, previousOverride?: DocumentRecord) {
    const contentHash = await sha256(documentText(input.blocks));
    setLoading('Analyzing document…');
    const analysis = await analyzeWithCache(contentHash, input.blocks);
    setLoading('Preparing results…');
    const url = input.url ? new URL(input.url) : undefined;
    if (url) url.hash = '';
    let previous = previousOverride;
    if (!previous && input.type === 'web' && url) {
      try { previous = await withTimeout(getLatestByUrl(url.href), 2000, 'Saved versions did not respond.'); }
      catch { setNotice({ type: 'error', message: 'This page was analyzed, but saved versions could not be checked for changes.' }); }
    }
    const version = getVersionStatus(contentHash, previous);
    const next: DocumentRecord = { ...input, ...analysis, id: crypto.randomUUID(), url: url?.href, contentHash, createdAt: new Date().toISOString(), previousVersionId: version.previousVersionId, changeDetected: version.changed, analysisVersion: ANALYSIS_VERSION, modelVersion: fallbackProvider.version };
    if (persist) {
      try {
        await withTimeout(saveDocument(next), 3500, 'Local storage did not respond.');
        try { await withTimeout(refreshHistory(), 2000, 'History did not respond.'); }
        catch { setNotice({ type: 'error', message: 'Results are ready and saved, but History could not refresh. Reopen the app to check your saved scans.' }); }
      } catch { setNotice({ type: 'error', message: 'Results are ready, but local storage did not respond. This scan may not be saved; check History before closing the app.' }); }
    }
    setPolicyDiff(previous && version.changed ? buildSemanticDiff(previous, next) : undefined);
    setRecord(next); setScreen('document');
    return next;
  }
  const runPageScan = () => work('Extracting webpage text…', async () => {
    const scan = await scanCurrentPage();
    if (!scan.blocks.length) throw new Error('No readable text was found on this page.');
    await createAndStore({ type: 'web', title: scan.title, url: scan.url, blocks: scan.blocks });
  });
  const runPdf = (file: File) => work('Reading PDF…', async () => { await createAndStore(await readPdf(file, setLoading)); });
  const runText = (text: string, title: string) => work('Reading document text…', async () => { await createAndStore({ type: 'text', title, blocks: extractPlainText(text, 'Pasted text') }); });
  const runImages = (files: File[], captured = false) => work('Reading document images…', async () => { await createAndStore(await readImages(files, captured, setLoading)); });
  const runDemo = (persist = true) => work('Preparing demo…', async () => { await createAndStore({ type: 'demo', title: DEMO_POLICY_TITLE, blocks: demoPolicyBlocks }, persist); });
  const runDiffDemo = () => work('Comparing demo versions…', async () => {
    const previous = await createAndStore({ type: 'demo', title: 'Acme Policy · OLD VERSION', blocks: demoOldPolicyBlocks });
    await createAndStore({ type: 'demo', title: 'Acme Policy · NEW VERSION', blocks: demoPolicyBlocks }, true, previous);
  });
  const reanalyze = () => work('Reanalyzing document…', async () => {
    if (!record) return;
    const analysis = await analyzeWithCache(record.contentHash, record.blocks, true);
    const next = { ...record, ...analysis, analysisVersion: ANALYSIS_VERSION, modelVersion: fallbackProvider.version };
    setRecord(next);
    try {
      await withTimeout(saveDocument(next), 3500, 'Local storage did not respond.');
      await withTimeout(refreshHistory(), 2000, 'History did not respond.');
    } catch { setNotice({ type: 'error', message: 'Updated results are ready, but History may not contain them. Check History before closing the app.' }); }
  });

  async function consumeShare() {
    if (busy.current) { shareQueued.current = true; return; }
    let shared: SharedPayload;
    try { shared = pendingShares.current.shift() ?? await ShareInbox.consume(); }
    catch (error) { setNotice({ type: 'error', message: error instanceof Error ? error.message : 'The shared document could not be opened.' }); return; }
    if (!shared.error && !shared.files?.length && !shared.text?.trim()) return;
    if (busy.current) { pendingShares.current.unshift(shared); shareQueued.current = true; return; }
    await work('Opening shared document…', async () => {
      if (shared.error) throw new Error(shared.error);
      const files = (shared.files ?? []).map(sharedFileToFile);
      if (files.length && files.every((file) => file.type.startsWith('image/'))) {
        await createAndStore(await readImages(files, files.length > 1, setLoading));
      } else if (files.length) {
        for (const file of files) {
          if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) await createAndStore(await readPdf(file, setLoading));
          else if (file.type.startsWith('image/')) await createAndStore(await readImages([file], false, setLoading));
          else throw new Error('This shared file type is not supported. Share a PDF or image.');
        }
      } else if (shared.text?.trim()) {
        const text = shared.text.trim();
        const url = text.match(/https?:\/\/[^\s]+/i)?.[0];
        await createAndStore(url && text.length - url.length < 150 ? await readSharedUrl(url, setLoading) : readSharedText(text));
      }
    });
  }
  useEffect(() => {
    void refreshHistory().catch(() => setNotice({ type: 'error', message: 'Local history could not be opened.' }));
    if (new URLSearchParams(location.search).get('preview') === 'results') void runDemo(false);
    if (!android) return;
    let listener: { remove: () => Promise<void> } | undefined;
    let disposed = false;
    void ShareInbox.addListener('shareReceived', () => { void consumeShare(); }).then((handle) => { if (disposed) void handle.remove(); else listener = handle; });
    void consumeShare();
    const resume = () => { if (document.visibilityState === 'visible') void consumeShare(); };
    document.addEventListener('visibilitychange', resume);
    return () => { disposed = true; void listener?.remove(); document.removeEventListener('visibilitychange', resume); };
    // Native inbox handlers are mounted once and use only stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), 12000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function showSource(source: AnswerSource) {
    if (!record || verifyEvidence(source.sourceBlockId, source.evidenceText, record.blocks).status !== 'verified') return;
    const block = record.blocks.find((candidate) => candidate.id === source.sourceBlockId)!;
    if (record.type === 'pdf' && record.pdfBlob && block.page) {
      setPdfSource({ blob: record.pdfBlob, page: block.page, evidence: source.evidenceText, region: block.sourceRegion }); return;
    }
    const imageBlob = block.capturedPage ? record.capturedImages?.[block.capturedPage - 1] : record.imageBlob;
    if (imageBlob) { setImageSource({ blob: imageBlob, evidence: source.evidenceText, region: block.sourceRegion }); return; }
    if (record.type === 'web' && isBrowserExtension()) {
      try { await highlightWebSource(source, block.domSelector, record.url); return; }
      catch { setNotice({ type: 'success', message: 'Showing the saved source snapshot. Open the original page to highlight it live.' }); }
    }
    setTextSource(source);
  }
  function changeNavigation(next: NavKey) { if (busy.current) return; setScreen(next); }
  async function openRecord(selected: DocumentRecord) {
    await work('Opening saved document…', async () => {
      let previous: DocumentRecord | undefined;
      if (selected.previousVersionId) {
        try { previous = await withTimeout(getDocument(selected.previousVersionId), 2000, 'Saved version did not respond.'); }
        catch { setNotice({ type: 'error', message: 'Document opened, but its previous version could not be loaded for comparison.' }); }
      }
      setPolicyDiff(previous && selected.changeDetected ? buildSemanticDiff(previous, selected) : undefined);
      setRecord(selected); setScreen('document');
    });
  }
  async function clearHistory() {
    if (!window.confirm('Remove all local scans, source files, and cached analyses? This cannot be undone.')) return;
    await work('Clearing local history…', async () => { await clearDocuments(); setRecords([]); setRecordCount(0); setRecord(undefined); setPolicyDiff(undefined); setTextSource(undefined); });
  }

  let content;
  if (loading) content = <LoadingState message={loading} />;
  else if (screen === 'document' && record) content = <ResultsView key={record.id} record={record} policyDiff={policyDiff} onBack={() => setScreen('scan')} onShowSource={(source) => void showSource(source)} onAsk={() => setScreen('ask')} onReanalyze={() => void reanalyze()} />;
  else if (screen === 'ask') content = <AskView key={record?.id ?? 'empty'} record={record} onShowSource={(source) => void showSource(source)} onDemo={() => void runDemo()} />;
  else if (screen === 'capture') content = <CaptureView onAnalyze={(files) => void runImages(files, true)} onBack={() => setScreen('scan')} />;
  else if (screen === 'pdf') content = <PdfUploadView onChoose={(file) => void runPdf(file)} onBack={() => setScreen('scan')} />;
  else if (screen === 'paste') content = <PasteTextView onAnalyze={(text, title) => void runText(text, title)} onBack={() => setScreen('scan')} />;
  else if (screen === 'install') content = <ExtensionInstallView onBack={() => setScreen('scan')} />;
  else if (screen === 'history') content = <HistoryView records={records} onOpen={(selected) => void openRecord(selected)} />;
  else if (screen === 'settings') content = <SettingsView recordCount={recordCount} onClear={() => void clearHistory()} />;
  else if (screen === 'document') content = <main className="px-5 py-8"><h1 className="text-xl font-semibold">No document open</h1><p className="mt-2 text-xs text-muted">Open a PDF, image, saved scan, or demo to begin.</p><button className="action-button mt-5" onClick={() => void runDemo()}>Try demo policy</button><button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-xs font-semibold text-muted hover:text-cyan" onClick={() => setScreen('scan')}>Back to Home</button></main>;
  else content = <HomeView recent={records} android={android} website={website} onPaste={() => setScreen('paste')} onInstall={() => setScreen('install')} onScan={() => void runPageScan()} onPdf={() => setScreen('pdf')} onImage={(file) => void runImages([file])} onCapture={() => setScreen('capture')} onDemo={() => void runDemo()} onDiffDemo={() => void runDiffDemo()} onOpenRecent={(selected) => void openRecord(selected)} />;
  return <div className="app-shell mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-ink text-slate-100">
    <BrandHeader /><Navigation active={screen === 'pdf' || screen === 'capture' || screen === 'paste' || screen === 'install' ? 'scan' : screen} onChange={changeNavigation} /><div className="flex-1">{content}</div><Disclaimer />
    {notice && <div role="status" className={`fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-[490px] items-start gap-2 rounded-xl border p-3 text-xs shadow-2xl ${notice.type === 'error' ? 'border-rose-400/35 bg-rose-950 text-rose-100' : 'border-cyan/30 bg-[#09252a] text-cyan'}`}>{notice.type === 'error' ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}<span className="flex-1 leading-relaxed">{notice.message}</span><button aria-label="Dismiss message" onClick={() => setNotice(undefined)}><X className="size-4" /></button></div>}
    {pdfSource && <PdfViewer blob={pdfSource.blob} pageNumber={pdfSource.page!} evidenceText={pdfSource.evidence} sourceRegion={pdfSource.region} onClose={() => setPdfSource(undefined)} />}
    {imageSource && <ImageSourceViewer blob={imageSource.blob} evidenceText={imageSource.evidence} region={imageSource.region} onClose={() => setImageSource(undefined)} />}
    {textSource && record && <TextSourceViewer record={record} source={textSource} onClose={() => setTextSource(undefined)} />}
  </div>;
}
