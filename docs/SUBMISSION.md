# Hackathon submission checklist

TermsWatch v1.0.0 has three runnable formats. Submit the formats your hackathon accepts; they are separate deliverables, not three folders to merge.

| Deliverable | File or folder | How judges use it |
| --- | --- | --- |
| Website | `release/TermsWatch-v1.0.0-website.zip` | Upload its **contents** to a static HTTPS host. `index.html` must be at the hosted root. The ZIP includes the extension download. |
| Browser extension | `release/TermsWatch-v1.0.0-extension.zip` | Extract, then load the folder containing `manifest.json` through Chrome/Edge Developer mode → Load unpacked. This is not a store-published extension. |
| Android app | `release/TermsWatch-v1.0.0-debug.apk` | Install directly on an Android test device. It is debug-signed for demonstration, not a Play Store release. |
| Source code | `release/TermsWatch-v1.0.0-source.zip` | Rebuildable project source, including `src/`, `public/`, `scripts/`, `docs/`, Android native source and build configuration. |
| Checksums | `release/SHA256SUMS.txt` | SHA-256 for all four files above; useful after upload. |

For a typical submission form, provide **one public HTTPS website URL**, the extension ZIP, the APK, the source ZIP or repository URL, and a short demo video. The website is only built locally so far; `http://127.0.0.1:4188/` is not a public judge link. Hosting it is still required if the form asks for a working site.

Use `docs/DEVPOST.md` for the written description, `docs/DEMO_SCRIPT.md` for a walkthrough, and `docs/QA.md` for tested-versus-pending details. Fictional test files are under `fixtures/`; include them only if judges need repeatable OCR/PDF examples. Do not upload `node_modules/`, `dist/`, `dist-web/`, `apps/android/**/build/`, emulator logs, personal scans or device screenshots by default. The release ZIPs already contain the required runtime files and third-party notices.

The safest live demo starts with **Try demo policy**, then asks about renewal and opens the cited source. Leave the optional 365 MB model off initially; the core workflow does not require it. Camera, real third-party Android Share and a manually loaded extension side panel still need final hands-on checks before claiming those flows passed.
