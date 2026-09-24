# TermsWatch v1.0.0 - release validation

Validation updated: **24 September 2026**. This report separates automated/build checks, desktop preview observations and real-device checks.

## Release gate

**Full cross-platform demo sign-off: NOT COMPLETE.** The release artifacts build, desktop document/Ask/OCR flows work, and the connected Android phone now passes the core document flow. The following still need manual checks:

1. Camera/multi-page capture, real third-party Share targets, shared URL handling, and the optional local model have not yet been exercised on the phone. A synthetic warm-start Android PDF `ACTION_SEND` did succeed.
2. Only the in-app browser is connected. It cannot exercise a real Chrome/Edge extension side panel and its active-tab permissions. Web extraction/highlighting have automated coverage; actual loaded-extension/MV3 and optional-model-in-extension QA remain pending.

No OS virtualization settings, security controls, user browser installations, or existing Android app data were cleared. The physical phone was tested in its current main profile; a separate Guest profile also has TermsWatch installed, but that profile's app data and reported failure were not inspected or cleared. For external browser QA, use a real Chrome/Edge extension installation and the checklist below.

## Automated/build results

| Check | Result |
| --- | --- |
| `npm test` | **PASS: 52 tests, 19 files**; includes stalled-cache/model fallback, synonym retrieval, irrelevant-citation rejection, specific explanations and recent-scan display coverage |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS; large-chunk warning from bundled PDF/ML runtime, not a build error |
| `npm run build:web` | PASS; separate static website + extension ZIP; website ZIP includes the identical extension download (SHA-256 equality checked) |
| `npm run android:sync` | PASS; Capacitor core + Camera plugin assets synced |
| Android `assembleDebug` with JDK 21 / SDK 36 | PASS |
| Release source package | PASS: 173 source/configuration files; generated folders, local properties, logs and maps excluded |
| APK identity/version | `app.termswatch.mobile`, code `1`, name `1.0.0`, target API 36 |
| APK signing verification | PASS; Android Debug signer, not production signing |

Focused tests cover exact evidence, nonexistent IDs, malformed/invented model output, rejection of mixed-validity answers, refusal, model-loading/error fallback, retrieval, OCR boxes/page mapping, PDF text-item highlights, cache version separation/rebinding/force refresh, semantic and word diffs, and stale live-page source rejection.

The 24 September regression reproduces the reported question, “What all can cause my Spotify account to get banned,” against the exact suspension sentence shown in the user's screenshot. It now retrieves the account-termination block, answers with breaches, service changes and legal requirements, and verifies the source ID and quotation. Tests also cover cancellation, data sharing, retention, content ownership, renewal and payment synonyms. An unsupported specific cause still yields an insufficient-evidence refusal. This is an automated reproduction; the same saved Spotify PDF has **not yet been re-tested on the phone** because it is currently disconnected.

The Android release check now also verifies that the APK contains the uncompressed OCR language asset and worker. Android packaging expands the original `.gz` file and removes its suffix; the OCR adapter selects the matching asset path on Android. JavaScript source maps are disabled in shipped builds; third-party license notices remain included.

Additional website coverage: ordinary Chrome stubs cannot enable extension mode; website/extension/Android primary actions stay distinct; pasted text retains paragraph evidence, rejects empty/oversized input and treats markup as text; PDF loading tasks are released after success and failure; “renews automatically” is recognized.

## Website delivery and regression pass

The production website is live at **https://eonash2722.github.io/TermsWatch/** through the GitHub Pages workflow. Local `dist-web` previews were also exercised in the in-app browser; use `npm run preview:web` to restart a local preview.

- PASS: website shows Paste document text/PDF/image controls and no unusable Scan current page action.
- PASS: custom-title pasted policy → findings → Ask renewal question → exact 48-hour quotation → saved original source. Empty input disables submit; oversized input is covered by tests.
- PASS: absent earthquake-insurance evidence yields refusal without sources.
- PASS: saved pasted policy remains visible after reload.
- PASS: installation instructions render and the download link was clicked. The packaged download matches the release extension ZIP. Actual manual installation/side-panel behavior remains pending.
- PASS: security-patched PDF.js 6.2.108 with paired legacy API/worker re-tested using text and image-only PDFs: seven findings, visible original text-PDF highlights, OCR around 96% on the fictional scan and source access.
- PASS: no relevant console errors/warnings or framework overlay in these flows.
- PASS (24 September): narrow website result cards show actual source-specific facts, and Ask shows a grounded answer with a separate verified source after the retrieval update. Three fictional-demo screenshots are in `docs/screenshots/`.
- PASS (24 September): published site loaded over HTTPS and its demo policy/results/Ask controls worked in the in-app browser. A live ban-question check revealed an unrelated cancellation citation; the retrieval gate was tightened and a regression test added. This final correction must be rechecked on the published site after the next deployment.

Website primary workflow is publicly testable now. This does **not** certify every browser, an installed extension, or the Android device workflows.

### Dependency security check

The installed PDF.js 5.7.284 was flagged by [Mozilla's advisory](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j); the release now pins patched **6.2.108**. The polyfilled build follows [Mozilla's browser support guidance](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#which-browsersenvironments-are-supported).

`npm audit --omit=dev` still reports **two high-severity dependency entries**, Sharp and its parent Transformers.js, from the Node image-processing dependency. TermsWatch imports Transformers' **web** export and runs inference in a browser worker; Sharp is a Node-only path, not the deployed image/OCR implementation. This is not a clean dependency audit. Do not repurpose this dependency tree for server-side untrusted image processing without updating it. Full audit also reports six moderate development-tool entries; no forced major dependency upgrade was applied during the deadline sprint.

## PC live QA

Production builds were exercised in a local browser preview using the visible controls and file chooser. Fixtures contain fictional Acme terms. The optional model was downloaded and initialized during the earlier desktop check; its response was observed, not simulated.

| Requested flow | Result / scope |
| --- | --- |
| Legal webpage | Extraction/message/highlight automated tests PASS. Real extension-window scan **NOT TESTED** (no connected external browser). |
| Text PDF | PASS: imported `demo-text-policy.pdf`, seven clause findings after heading refinement; original page rendered and cited text highlighted. |
| Scanned PDF | PASS: imported image-only PDF, bundled OCR completed; original page and paragraph box rendered. |
| Document image | PASS: PNG imported using bundled OCR, seven findings and original-image source box. Fixture OCR confidence displayed about 96%; this is not an accuracy guarantee. |
| Policy diff | PASS: built-in OLD/NEW shows three updated clauses, including renewal 24 → 48 hours, broader sharing and license scope. |
| Ask: evidence present | PASS: renewal answer quotes the exact 48-hour sentence with application-owned source. |
| Ask: evidence absent | PASS: earthquake-insurance question produces the exact insufficient-evidence message without sources. |
| Source highlighting | PASS in demo snapshot, text PDF, scanned PDF and image viewers. Live original webpage highlighting is covered by automated tests only. |
| AI unavailable | PASS: model off still supports summary/Ask; automated tests cover loading, invalid IDs and thrown inference errors. |
| Local model | PASS in desktop preview: SmolLM2 q8 downloaded, initialized with WASM (no WebGPU dependency), and selected a quotation that passed source verification. Android/extension-origin execution not tested. |
| Reload/reopen | PASS: fresh image scan reappeared in History after reload, and its saved original image/source remained available. Existing v0.2 scans were visible after the IndexedDB v2 upgrade. |
| Cache/reanalysis | Unit tests PASS for unchanged-content reuse, ID/location rebinding, model/analysis version separation and forced fresh analysis. Live repeated equivalent document showed a cache-hit label. |
| Console | No errors/warnings observed during the successful PDF/OCR/model preview flows. |

## Android QA

Connected device: OnePlus Nord AC2001, Android 12/API 31, Android System WebView 154. Tests below ran in the phone's current main profile using v1.0.0 debug builds. Updates were installed with `adb install -r`, preserving app data. The app had originally been installed only in a separate Guest profile; it was enabled for the main profile without touching Guest data. The reported Guest-profile spinner is not claimed as reproduced or fixed in that profile.

The previous v1.0.0 APK was reinstalled in place on 23 September after the polish changes. A fresh launch, built-in demo and Ask check completed again on the connected phone; the answer included the 48-hour quotation and verified source, without the earlier endless spinner. This smoke test did not repeat camera or third-party Share flows. The 24 September retrieval/answer-quality build has **not** been installed or tested on the phone because ADB currently lists no connected device.

Two real Android issues were found and corrected during this pass: returning from the system file picker could race with an empty Share-inbox check, silently dropping the selected file; and Android expanded `eng.traineddata.gz` to `eng.traineddata` inside the APK, causing a 404 and stalled image OCR. Both fixes were re-tested on the physical device. Local cache writes/reads and optional-model answers now have bounded fallbacks, so a stalled optional service cannot hold the result or Ask button indefinitely.

| Flow | Status |
| --- | --- |
| Native project compilation, web-asset sync, in-place install and cold launch | PASS |
| Built-in demo → results → typed Ask | PASS: quoted the exact 48-hour renewal sentence with a verified source |
| PDF system picker/import | PASS: `TermsWatch-demo-text-policy.pdf` opened into seven findings; repeated selection after the picker-race fix succeeded |
| Image system picker/import | PASS: `TermsWatch-demo-policy.png` completed on-device OCR, displayed 96% fixture confidence and seven findings |
| Scanned PDF system picker/import | PASS: `TermsWatch-demo-scanned-policy.pdf` completed OCR and opened findings |
| Original scanned-PDF source | PASS: View source opened page 1 with cyan-highlighted source area and quote |
| Ask on imported PDF | PASS: typed renewal question returned the exact 48-hour sentence |
| History after reopening | PASS in the current profile; saved demo/PDF entries remained visible after app restarts and APK updates |
| Camera capture and multiple pages | Implemented; live device test still pending |
| Share PDF | Synthetic warm-start `ACTION_SEND` with the test PDF PASS; real Files/browser share UI and cold launch pending |
| Share image / text / URL | Native handlers implemented and compiled; live device test pending |
| Optional on-device model | Desktop runtime verified; Android memory/performance and WebView compatibility NOT TESTED |

Test fixtures left in phone Downloads: `TermsWatch-demo-text-policy.pdf`, `TermsWatch-demo-policy.png`, and `TermsWatch-demo-scanned-policy.pdf`. They are fictional policies made by this project, not the user's personal documents. Device screenshots are in `output/android-pdf-result.png`, `output/android-image-ocr-result.png`, `output/android-ask-result.png`, and `output/android-scanned-pdf-source.png`.

### Repeatable final device checklist

1. Open the already installed APK in the main profile, or install the packaged debug APK. Keep Android System WebView/Chrome current. Do not clear app data unless you intentionally want to erase local scans.
2. Tap **Try demo policy**, then **Ask this document**; type “Does this renew automatically?” and tap **Ask**. Confirm the 48-hour answer and a source. If the phone is in Guest instead of the tested main profile, report that explicitly.
3. Home → **Open PDF** → Downloads → `TermsWatch-demo-text-policy.pdf`; inspect seven findings, Ask about renewal, then open the PDF source.
4. Home → **Open Image** → photo picker menu → **Browse…** → Downloads → `TermsWatch-demo-policy.png`; check OCR confidence, source box and original image.
5. Capture two pages with different clauses. Confirm page numbering, remove/retake one, analyze and verify the correct captured image opens for each source. Test camera cancellation/denial without a crash.
6. Share PDF, image and selected text from Files/browser into TermsWatch. Test both cold launch and already-open app. Share two images together and verify separate captured-page sources.
7. Share a public HTML terms URL and verify the saved source. Then share a non-HTML/inaccessible URL: require a clear error, no fake analysis.
8. Ask one present and one absent question. Leave the optional model off; then optionally enable it on a sufficiently capable device.
9. Kill/reopen the app after saving and verify History/source access. Unanalysed camera pages are intentionally transient.
10. On a disposable test installation, clear history with the explicit confirmation. Verify document files/analysis cache disappear; downloaded model weights require app/site-data clearing separately.

### Repeatable final PC extension checklist

1. Load the release ZIP's extracted directory through Chrome/Edge Developer mode. Open the toolbar side panel.
2. Serve `/demo/policy.html` using `npm run dev` and scan that page. Inspect source highlighting in the original tab, not only the saved snapshot.
3. Modify the fixture in a separate copy and rescan the same URL to verify actual stored-version comparison. Do not change this project's canonical demo merely to rehearse.
4. Change/remove a previously scanned clause; a stale source must not highlight unrelated text. Navigate to another tab; source should fall back to the saved snapshot.
5. Import text PDF, scanned PDF and image into the installed extension. Check worker/runtime assets under MV3 CSP.
6. Enable the optional model and test a verified answer; also confirm all core flows work without it.

## Visual verification / fidelity ledger

The user requested preservation of the existing dark/cyan design, not a redesign. References: `docs/concepts/home.png` and `docs/concepts/results.png`. Browser-rendered screenshots were used for real interaction checks, and the latest implementation was compared with the concept using `view_image`. Narrow layout tested at 390 CSS px; the original concept is a larger presentation mockup, not the actual side-panel viewport.

| Comparison point | Evidence and disposition |
| --- | --- |
| Palette | Dark ink surfaces, cyan actions/source highlights, muted slate text and attention rails retained. No replacement theme. |
| Component layout | Brand header, compact navigation, document card, summary and stacked clause cards preserved; no landing-page rewrite. |
| Typography/spacing | Short headings, compact labels, readable source quotes and consistent rounded panels retained; mobile flow inspected without horizontal overflow. |
| Navigation/copy | Intentional user-requested changes: Home, Document, Ask, History, Settings; new Ask/reanalysis/history-demo controls. |
| Claims and labels | Intentional safety changes: Local explanation, Rule match, local-first wording and OCR caveat; no unsupported generative-AI or privacy claim. |
| Source treatment | Original PDFs/images stay visible under cyan highlights; controls remain real code-native UI, not screenshots. |

Core interactions were browser-tested. The real-phone screenshots listed above verify the main Android result, Ask and scanned-PDF source surfaces; camera and optional-model visual sign-off remain pending. Temporary comparison screenshots are not release content.
