#!/usr/bin/env python3
"""Build dist/index.html: embeds all photos from photos/ as data URIs into src/template.html.

Usage:
  .venv/bin/python build.py            # build page
  .venv/bin/python build.py --qr URL   # additionally write dist/qr.png for the given URL

Captions: optional captions.json  { "<filename>": {"caption": "...", "date": "ca. 1999", "order": 1} }
Missing entries get a caption derived from the filename.
"""
import base64, io, json, re, sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).parent
PHOTOS = ROOT / "photos"
DIST = ROOT / "dist"
MAX_EDGE = 1400
QUALITY = 78

def default_meta(name: str):
    m = re.match(r"(\d\d)-(\d\d)-(\d\d)", name)
    if m:
        yy, mo, dd = m.groups()
        return {"caption": "Feldstudie, Sommer 20" + yy if mo in "060708" else "Feldstudie", "date": f"{dd}.{mo}.20{yy}", "order": int("20" + yy + mo + dd)}
    if name.lower().startswith("oma"):
        return {"caption": "Aus dem Archiv", "date": "Frühe Phase, undatiert", "order": 0}
    return {"caption": "Aus dem Archiv", "date": "undatiert", "order": 1}

def encode(path: Path) -> str:
    im = Image.open(path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    im.thumbnail((MAX_EDGE, MAX_EDGE))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

def main():
    captions = {}
    cj = ROOT / "captions.json"
    if cj.exists():
        captions = json.loads(cj.read_text())

    files = sorted(p for p in PHOTOS.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".heic"})
    photos = []
    for p in files:
        meta = default_meta(p.name)
        meta.update(captions.get(p.name, {}))
        photos.append({**meta, "src": encode(p), "file": p.name})
        print(f"  {p.name:40s} -> {meta['date']}")
    photos.sort(key=lambda x: (x["order"], x["file"]))
    for i, ph in enumerate(photos, 1):
        ph["nr"] = i

    tpl = (ROOT / "src" / "template.html").read_text()
    html = tpl.replace("/*__PHOTOS__*/[]", json.dumps(photos, ensure_ascii=False))
    DIST.mkdir(exist_ok=True)
    out = DIST / "index.html"
    out.write_text(html)
    print(f"\n{len(photos)} Fotos -> {out} ({out.stat().st_size/1e6:.1f} MB)")

    if "--qr" in sys.argv:
        import qrcode
        url = sys.argv[sys.argv.index("--qr") + 1]
        img = qrcode.make(url, border=2, box_size=12)
        img.save(DIST / "qr.png")
        print(f"QR -> {DIST/'qr.png'}  ({url})")

if __name__ == "__main__":
    main()
