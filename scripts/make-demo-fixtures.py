"""Generate small, fictional QA/demo fixtures; requires reportlab and pypdfium2."""
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
import pypdfium2 as pdfium

root = Path(__file__).resolve().parents[1]
out = root / 'output' / 'pdf'
out.mkdir(parents=True, exist_ok=True)
clauses = [
    ('Data Sharing', 'We may share information about you with our advertising and analytics partners to improve our services and show relevant content.'),
    ('Automatic Renewal', 'Your paid subscription will automatically renew for another monthly term unless you cancel at least 48 hours before the renewal date.'),
    ('Cancellation', 'You may cancel from account settings before your next billing date. Payments already made are non-refundable except where required by law.'),
    ('Account Termination', 'We may suspend or terminate your account if you materially breach these terms or misuse the service.'),
    ('Your Content', 'You grant us a worldwide, non-exclusive, royalty-free license to host and display content you submit only for operating and improving the service.'),
]
pdf = canvas.Canvas(str(out / 'demo-text-policy.pdf'), pagesize=(612, 792))
pdf.setTitle('Acme Service Terms - Demo Policy')
pdf.setFont('Helvetica-Bold', 21)
pdf.drawString(48, 735, 'Acme Service Terms')
pdf.setFont('Helvetica', 10)
pdf.drawString(48, 710, 'Fictional document for TermsWatch demonstrations. Not a real agreement.')
y = 664
for heading, text in clauses:
    pdf.setFont('Helvetica-Bold', 13)
    pdf.drawString(48, y, heading)
    y -= 23
    pdf.setFont('Helvetica', 11)
    for line in simpleSplit(text, 'Helvetica', 11, 516):
        pdf.drawString(48, y, line)
        y -= 17
    y -= 27
pdf.setFont('Helvetica', 9)
pdf.drawString(48, 38, 'TermsWatch demo fixture | Page 1')
pdf.save()
document = pdfium.PdfDocument(str(out / 'demo-text-policy.pdf'))
page = document[0]
bitmap = page.render(scale=2)
image = bitmap.to_pil()
image.save(out / 'demo-policy.png')
image.save(out / 'demo-policy.jpg', quality=95)
bitmap.close()
page.close()
document.close()
scan = canvas.Canvas(str(out / 'demo-scanned-policy.pdf'), pagesize=(612, 792))
scan.setTitle('Acme Scanned Policy - Demo')
scan.drawImage(str(out / 'demo-policy.png'), 0, 0, width=612, height=792)
scan.save()
web = root / 'public' / 'demo'
web.mkdir(parents=True, exist_ok=True)
html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Acme Service Terms - Demo Policy</title><style>body{max-width:760px;margin:50px auto;padding:24px;font:18px/1.6 system-ui;color:#17202b}h1{font-size:34px}h2{margin-top:32px;font-size:22px}.note{color:#637082}</style><main><h1>Acme Service Terms</h1><p class="note">Fictional TermsWatch demo. Not a real agreement.</p>'
html += ''.join(f'<section><h2>{escape(h)}</h2><p>{escape(t)}</p></section>' for h,t in clauses)
html += '</main></html>'
(web / 'policy.html').write_text(html, encoding='utf-8')
print('Created demo text PDF, image-only PDF, PNG/JPEG, and public/demo/policy.html')
