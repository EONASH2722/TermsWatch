# TermsWatch v1.0.0 release notes

## Added

- Standalone website with pasted-policy analysis, optional document title, verified sources, shared PDF/image/Ask/history flows and extension installation/download page.
- One-command website + extension packaging (`npm run build:web`), a separate static `dist-web` output and SHA-256 hashes.
- Source-grounded Ask with local retrieval, exact-quote validation and reliable no-download fallback.
- Optional cached SmolLM2-360M q8 WASM worker with opt-in download progress, cancellation and bounded inference.
- Shared Android Capacitor project, native ShareInbox, PDF/image/text/URL intake and multi-page camera UI.
- Versioned, bounded analysis cache; Reanalyze and document clearing.
- Confidentiality, employment restriction, intellectual-property and obligation rules.
- True saved-text source viewer and OLD/NEW policy demo.
- Demo script, project description, QA matrix, submission checklist and fictional PDF/image/web fixtures.
- Repeatable release packaging with version/stale-APK checks and SHA-256 hashes.

## Hardened

- PDF.js pinned to security-patched 6.2.108; the legacy/polyfilled worker and API are paired for broader browser compatibility. Cleanup uses the PDF loading task, including load failure.
- Website/extension detection keeps active-tab scanning out of ordinary browser mode.
- Pasted input rejects empty/oversized documents; renewal detection includes “renews automatically”.
- Webpage source highlighting verifies current text before selecting a DOM element.
- PDF extraction runs in a packaged worker; viewer tasks/documents are cleaned up.
- PDF partial-line source matching and heading detection improved.
- Optional-model cancellation cannot resurrect a stale initialization.
- File/image size limits, bounded native URL fetching and honest failure messages.
- Rules use conservative descriptions; rule match is not presented as legal risk or calibrated certainty.
- Accurate local-first/privacy disclosure, OCR caveat and explicit cached-model deletion guidance.
- Bounded saved-version and reanalysis storage checks; clearer errors when history is unavailable.
- Correct singular page labels, resilient old-URL history display and cleaner upload accessibility.
- Shipped bundles omit source maps while retaining required third-party license notices.
- Synonym-aware Ask retrieval handles account-ban/suspension wording and boosts verified clause categories without treating an absent specific cause as evidence.
- Finding cards and summaries now use the matched clause's facts; a payment finding cites its payment sentence rather than a neighbouring cancellation sentence.

## Main new files

`src/ai/{provider,validation,modelConfig,model.worker,localModel,index.test,validation.test}.ts`; `src/core/retrieval/*`; `src/core/analysis/cache*`; `src/core/evidence/location*`; `src/core/pdf/runtime.ts`; `src/components/{AskView,CaptureView,TextSourceViewer}.tsx`; `src/services/{documents,platform}.ts`; `src/content/index.test.ts`; `capacitor.config.ts`; `apps/android`; `scripts/{make-demo-fixtures.py,package-release.ps1}`; `public/demo`; `public/licenses`; `fixtures`; `docs/{DEMO_SCRIPT,DEVPOST,QA,RELEASE_NOTES}.md`.

## Main modified files

`src/App.tsx`; AI entry point; document types; rule engine; IndexedDB storage; PDF/OCR services; extension adapter/content script; home/navigation/results/settings/source viewers; demo policy; styles; manifest; build script; package/lock files; lint configuration; `.gitignore`; README.

## Distribution

`release/TermsWatch-v1.0.0-extension.zip`, `release/TermsWatch-v1.0.0-website.zip`, `release/TermsWatch-v1.0.0-source.zip`, `release/TermsWatch-v1.0.0-debug.apk`, and `release/SHA256SUMS.txt`. The APK is debug-signed for demonstration, not store submission. Model weights are downloaded only on opt-in and are not inside these artifacts. The website is not automatically published by a local build.

The core Android demo, Ask, PDF import and OCR flows passed on a connected phone. Camera, real third-party Share and installed-extension behavior still need the manual checks in `QA.md`.
