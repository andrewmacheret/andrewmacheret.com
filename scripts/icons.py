#!/usr/bin/env python3
"""Draws every favicon file in www/ from www/favicon.svg. Needs Google Chrome."""
import base64, html, json, re, struct, subprocess, tempfile, urllib.parse
from pathlib import Path

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
WWW = Path(__file__).resolve().parent.parent / 'www'
# name, size, background
# iOS turns see-through corners black, so the apple icon gets a solid background
FILES = [
    ('favicon-16x16.png', 16, None),
    ('favicon-32x32.png', 32, None),
    ('favicon-48x48.png', 48, None),
    ('android-icon-192x192.png', 192, None),
    ('apple-icon-180x180.png', 180, '#0b0d0c'),
]
# favicon.ico holds several sizes in one file. The 48px one isn't saved on its own
ICO = ['favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png']
ICO_ONLY = 'favicon-48x48.png'

svg = 'data:image/svg+xml,' + urllib.parse.quote((WWW / 'favicon.svg').read_text())
page = f"""<body><script>
const img = new Image();
img.onload = () => {{
  const out = {{}};
  for (const [name, size, bg] of {json.dumps(FILES)}) {{
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (bg) {{
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    }}
    ctx.drawImage(img, 0, 0, size, size);
    out[name] = canvas.toDataURL();
  }}
  document.body.textContent = JSON.stringify(out);
}};
img.src = {json.dumps(svg)};
</script></body>"""

with tempfile.NamedTemporaryFile('w', suffix='.html') as f:
    f.write(page)
    f.flush()
    dom = subprocess.run([CHROME, '--headless', '--dump-dom', '--virtual-time-budget=3000', 'file://' + f.name],
                         capture_output=True, text=True, check=True).stdout

body = html.unescape(re.search(r'<body>(.*)</body>', dom, re.S).group(1))
pngs = {name: base64.b64decode(url.split(',', 1)[1]) for name, url in json.loads(body).items()}
for name, data in pngs.items():
    if name != ICO_ONLY:
        (WWW / name).write_bytes(data)

ico = struct.pack('<HHH', 0, 1, len(ICO))
offset = 6 + 16 * len(ICO)
for name in ICO:
    size = dict((n, s) for n, s, _ in FILES)[name]
    ico += struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(pngs[name]), offset)
    offset += len(pngs[name])
(WWW / 'favicon.ico').write_bytes(ico + b''.join(pngs[name] for name in ICO))
