# TermsWatch - 2 minute 30 second demonstration

## Preflight

Load the extension. Serve `/demo/policy.html` with `npm run dev`. Have `fixtures/demo-scanned-policy.pdf` and `fixtures/demo-policy.png` ready. Keep the optional model off for a deterministic no-download presentation, or pre-download it and rehearse the exact question. Never download 365 MB live on stage.

Use the installed APK on the tested main Android profile. The connected-phone demo, Ask, PDF import, image OCR, scanned-PDF OCR and PDF source passed on 23 September 2026. Camera and real third-party Share flows still require the `QA.md` checks before they are shown as proven. Do not present mock screens as a live app.

## Timed script

| Time | Action | Narration |
| --- | --- | --- |
| 0:00-0:15 | Open the fictional Acme page. | “Nobody has time to read every line of fine print. But one sentence can change when you pay, what you share, or how you leave.” |
| 0:15-0:35 | Open TermsWatch → **Scan current page**. | “TermsWatch reads this page locally and gives me a short summary, plus clauses worth reviewing. These are attention labels, not legal risk scores.” |
| 0:35-0:50 | Expand Data sharing → **Show source**. Point to the highlighted original. | “Every explanation has an exact source. The app verifies the quote and controls the reference. I can inspect the original instead of trusting an unsupported answer.” |
| 0:50-1:10 | Import the scanned PDF or image. Open its source. | “Fine print also lives on paper. Bundled OCR reads this scan and preserves its page and paragraph box. OCR can make mistakes, so the original stays one click away.” |
| 1:10-1:30 | **Ask this document** → **Does this renew automatically?** → source. | “Ask retrieves relevant blocks first. Here it finds the exact renewal clause, including the 48-hour deadline. The local fallback works even without downloading a model.” |
| 1:30-1:43 | Ask about earthquake insurance. | “When this document has no evidence, TermsWatch says so. It does not invent a page or a promise.” |
| 1:43-2:02 | Home → **Try policy-history demo**. Expand renewal. | “This OLD/NEW example changes the cancellation deadline from 24 to 48 hours and broadens sharing. Clause matching and word highlights make the change visible.” |
| 2:02-2:20 | On the tested Android device, Home → **Open Image** → select `TermsWatch-demo-policy.png` from Downloads. | “Android reuses the same OCR, evidence and Ask logic. This image was read on the device, and its original source remains available.” |
| 2:20-2:30 | Return Home. | “Local-first. Short explanations. Sources you can check. TermsWatch: Know before you agree.” |

## Honest fallbacks

- Website inaccessible: use **Try demo policy** and name it as the built-in example.
- Model loading/error: use the supported local-rules path.
- Android unavailable during presentation: show the real-device screenshots in `output/` and say they were captured during device QA, not live. Omit unverified Camera/Share claims until those manual checks pass.
- Poor photo: retake in better light. Never conceal OCR errors behind the verified-source label.
