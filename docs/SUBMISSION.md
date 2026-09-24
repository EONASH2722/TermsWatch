# Hackathon submission checklist

TermsWatch v1.0.0 has three runnable formats. Submit the formats your hackathon accepts; they are separate deliverables, not three folders to merge.

| Deliverable | File or folder | How judges use it |
| --- | --- | --- |
| Website | [Live GitHub Pages site](https://eonash2722.github.io/TermsWatch/) and `release/TermsWatch-v1.0.0-website.zip` | Send judges the live URL. The ZIP is a portable backup; upload its **contents** if a separate static host is required. |
| Browser extension | `release/TermsWatch-v1.0.0-extension.zip` | Extract, then load the folder containing `manifest.json` through Chrome/Edge Developer mode → Load unpacked. This is not a store-published extension. |
| Android app | `release/TermsWatch-v1.0.0-debug.apk` | Install directly on an Android test device. It is debug-signed for demonstration, not a Play Store release. |
| Source code | `release/TermsWatch-v1.0.0-source.zip` | Rebuildable project source, including `src/`, `public/`, `scripts/`, `docs/`, Android native source and build configuration. |
| Checksums | `release/SHA256SUMS.txt` | SHA-256 for all four files above; useful after upload. |

For a typical submission form, provide the [public HTTPS website URL](https://eonash2722.github.io/TermsWatch/), the extension ZIP, the APK, the source ZIP or [repository URL](https://github.com/EONASH2722/TermsWatch), and a short demo video. The `.github/workflows/pages.yml` workflow publishes the site after a successful build and test run on `main`.

Use `docs/DEVPOST.md` for the written description, `docs/DEMO_SCRIPT.md` for a walkthrough, and `docs/QA.md` for tested-versus-pending details. Fictional test files are under `fixtures/`; include them only if judges need repeatable OCR/PDF examples. Do not upload `node_modules/`, `dist/`, `dist-web/`, `apps/android/**/build/`, emulator logs, personal scans or device screenshots by default. The release ZIPs already contain the required runtime files and third-party notices.

The safest live demo starts with **Try demo policy**, then asks about renewal and opens the cited source. Leave the optional 365 MB model off initially; the core workflow does not require it. The updated APK still needs an in-place install and exact Spotify-PDF question retest on the phone. Camera, real third-party Android Share and a manually loaded extension side panel also need hands-on checks before claiming those flows passed.
