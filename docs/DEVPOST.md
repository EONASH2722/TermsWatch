# TermsWatch

## Short description

Know before you agree. A local-first assistant that turns legal webpages, PDFs and document images into short explanations with exact, inspectable sources.

## Problem

Fine print is long, changes over time, and appears in browser pages, downloads and paper documents. A summary is only useful if users can check where it came from. Plausible but invented references undermine that trust.

## Solution

A PC extension and small Android companion share one TypeScript core. TermsWatch identifies common clauses, limits summaries to five bullets, answers questions from retrieved evidence and opens the original source. Missing evidence produces a refusal.

## How it works

Extracted blocks retain IDs, headings, pages and OCR regions. Local rules create conservative explanations. Ask ranks a few blocks with local keyword/BM25-style scoring. An optional small on-device model selects excerpts; a deterministic extractive path remains available. Every source ID and exact quotation is verified before display.

## Features

- Webpage extraction and original-element highlighting.
- Text PDFs and bundled image/scanned-PDF OCR with paragraph boxes.
- Short summaries, attention labels, source-grounded Ask and insufficient-evidence refusal.
- Manual policy versions with clause matching and word-level changes.
- Local history, bounded analysis cache, reanalysis and clearing controls.
- No-download built-in policy and OLD/NEW demos.
- Android implementation: PDF/image import, multi-page camera capture, Share intake for files, text and URLs.

## Technical implementation

Manifest V3 uses on-demand active-tab access, not continuous browsing surveillance. React/TypeScript are shared with Capacitor Android. PDF.js, Tesseract and ONNX inference use workers; OCR assets are bundled. IndexedDB stores original files and verified results. Native Android code receives content URIs and fetches user-shared HTML without a backend.

Transformers.js 3.8.1 runs optional q8 SmolLM2-360M-Instruct, approximately 365 MB on opt-in. Its role is narrow: evidence selection. Unchecked prose and model-generated location labels never enter the verified UI.

## Challenges

Source identity must survive extraction, OCR, caching and reopening. Coordinates must stay attached to the correct original page. Extension security requires packaged runtime code. Model loading must not block core functionality. Android Share needs explicit file-grant handling, limits and useful errors.

## What we learned

Verification is a product feature, not just a prompt. A dependable local fallback makes the demo useful without downloads or GPU support. Successful Android compilation is not proof of camera/Share behavior, so our QA report distinguishes builds from observed device results.

## What's next

Finish camera, third-party Share and installed-extension testing; evaluate more English documents before public distribution. This release deliberately excludes accounts, cloud sync, crawling, notifications, payments and multilingual support. It does not offer legal advice or jurisdiction-specific expertise.

## Technology stack

TypeScript, React, Tailwind, Vite, Manifest V3, Capacitor, Java, PDF.js, Tesseract.js, Transformers.js, ONNX Runtime Web, SmolLM2, IndexedDB and Vitest.

## Validation disclosure

Read `docs/QA.md` for exact results. Desktop preview tests cover OCR, PDF rendering, source highlights, grounded answers, refusal and optional local-model inference. On a connected Android phone, the built-in demo, Ask, PDF import, image OCR and scanned-PDF OCR passed. Camera, real third-party Share and a loaded extension side panel remain to be checked.

TermsWatch explains document content and does not provide legal advice.
