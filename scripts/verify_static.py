from pathlib import Path
import re, sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

required_files = [
    'index.html','css/tokens.css','css/base.css','css/layout.css','css/components.css','css/motion.css','css/responsive.css',
    'js/app.js','js/content.js','js/utils.js','js/boot.js','js/network.js','js/scroll.js','js/interactions.js'
]
for rel in required_files:
    if not (ROOT / rel).exists():
        errors.append(f'missing required file: {rel}')

html = (ROOT/'index.html').read_text(encoding='utf-8')
for section_id in ['main','phong','focus','work','wins','research','contact']:
    if not re.search(rf'id=["\']{re.escape(section_id)}["\']', html):
        errors.append(f'missing required id: {section_id}')

for needle in ['<meta name="description"','<meta property="og:title"','prefers-reduced-motion','skip-link']:
    haystack = html + ''.join((ROOT/'css').glob('*.css') and [p.read_text(encoding='utf-8') for p in (ROOT/'css').glob('*.css')])
    if needle not in haystack:
        errors.append(f'missing metadata/accessibility feature: {needle}')

# Static HTML references.
refs = re.findall(r'(?:src|href)=["\'](\./[^"\']+)["\']', html)
# JS-local asset references.
for jsfile in (ROOT/'js').glob('*.js'):
    text = jsfile.read_text(encoding='utf-8')
    refs += re.findall(r'["\'](\./assets/[^"\']+)["\']', text)

for ref in sorted(set(refs)):
    clean = ref.split('?',1)[0].split('#',1)[0]
    path = (ROOT / clean[2:]).resolve()
    if not path.exists():
        errors.append(f'broken local reference: {ref}')

# Static img tags require alt attributes.
for tag in re.findall(r'<img\b[^>]*>', html, flags=re.I):
    if not re.search(r'\balt=["\']', tag, flags=re.I):
        errors.append(f'image missing alt: {tag[:100]}')

# Avoid obvious placeholder external links.
for bad in ['href="javascript:', "href='javascript:", 'example.com', 'TODO_URL', 'YOUR_']:
    corpus = html + ''.join(p.read_text(encoding='utf-8') for p in (ROOT/'js').glob('*.js'))
    if bad in corpus:
        errors.append(f'placeholder or unsafe link token found: {bad}')

if errors:
    print('STATIC VERIFY FAILED')
    for error in errors:
        print(' -', error)
    sys.exit(1)
print(f'STATIC VERIFY PASS — {len(set(refs))} local references checked')
