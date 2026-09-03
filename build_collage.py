#!/usr/bin/env python3
"""Build the printable A4-landscape collage.

  .venv/bin/python build_collage.py          -> dist/collage.html (+ collage-a4.jpg / .pdf via headless Chrome)
  .venv/bin/python build_collage.py --no-render   (only the HTML)

Uses the same photos/ + captions.json as build.py. 300 dpi A4 landscape = 3508 x 2480 px.
"""
import base64, io, json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageOps
import build  # reuse default_meta

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
PORTRAIT = "--portrait" in sys.argv
W, H = (2480, 3508) if PORTRAIT else (3508, 2480)   # A4 @300dpi
M = 110                    # outer margin
GAP = 30                   # gap between photos
SUFFIX = "hoch" if PORTRAIT else "quer"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CONFIG = dict(bewerber="Philipp", auftraggeber="Jonas", partner="Lisa",
              hochzeit="2027 oder 2028, Termin folgt", aktenzeichen="TZ-2026/001")

def load_photos():
    captions = json.loads((ROOT / "captions.json").read_text()) if (ROOT / "captions.json").exists() else {}
    out = []
    for p in sorted(x for x in (ROOT / "photos").iterdir() if x.suffix.lower() in {".jpg", ".jpeg", ".png"}):
        meta = build.default_meta(p.name); meta.update(captions.get(p.name, {}))
        im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
        im.thumbnail((1600, 1600))
        buf = io.BytesIO(); im.save(buf, "JPEG", quality=85, optimize=True)
        out.append({**meta, "file": p.name, "ar": im.width / im.height,
                    "src": "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()})
    out.sort(key=lambda x: (x["order"], x["file"]))
    return out

def split_rows(photos, n):
    """Split into n rows with roughly equal summed aspect ratio (keeps chronological order)."""
    total = sum(p["ar"] for p in photos); target = total / n
    rows, cur, acc = [], [], 0.0
    for p in photos:
        if cur and acc + p["ar"] / 2 > target and len(rows) < n - 1:
            rows.append(cur); cur, acc = [], 0.0
        cur.append(p); acc += p["ar"]
    rows.append(cur)
    return rows

def layout(photos, x0, y0, avail_w, avail_h):
    # most rows that still fit at full width -> biggest photos without side gaps
    best = None
    for n in range(2, 8):
        rows = split_rows(photos, n)
        heights = [(avail_w - GAP * (len(r) - 1)) / sum(p["ar"] for p in r) for r in rows]
        total_h = sum(heights) + GAP * (len(rows) - 1)
        if total_h <= avail_h: best = (rows, heights, total_h)
    rows, heights, total_h = best
    scale = 1.0
    boxes, y = [], y0 + (avail_h - total_h * scale) / 2
    for r, h in zip(rows, heights):
        h *= scale; row_w = sum(p["ar"] * h for p in r) + GAP * (len(r) - 1)
        x = x0 + (avail_w - row_w) / 2
        for p in r:
            w = p["ar"] * h
            boxes.append((p, x, y, w, h)); x += w + GAP
        y += h + GAP
    return boxes

def main():
    photos = load_photos()
    for i, p in enumerate(photos, 1): p["nr"] = i
    head_h, foot_h = 330, 150
    boxes = layout(photos, M, M + head_h, W - 2 * M, H - 2 * M - head_h - foot_h)

    imgs = "".join(
        f'<figure style="left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;height:{h:.0f}px">'
        f'<img src="{p["src"]}" alt=""><figcaption><span>{p["nr"]:02d}</span>{p["date"]}</figcaption></figure>'
        for p, x, y, w, h in boxes)

    c = CONFIG
    html = f"""<title>Anlage 1, Belegsammlung</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  :root{{--paper:#f4f3ef;--ink:#161a1e;--ink-2:#3d444b;--muted:#7b8590;--red:#b7332b;--amber:#d39a2f;--rule:#b9c0c7;
        --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;--display:"Bricolage Grotesque","Helvetica Neue",Arial,sans-serif}}
  html,body{{margin:0;background:#cfd5db;color:var(--ink)}}
  body.raw{{background:var(--paper)}}
  .stage{{position:relative;width:{W}px;height:{H}px;transform-origin:0 0}}
  .sheet{{position:absolute;inset:0;background:var(--paper);overflow:hidden}}
  .kopf{{position:absolute;left:{M}px;right:{M}px;top:{M}px;display:flex;justify-content:space-between;align-items:flex-start;
        border-bottom:5px solid var(--ink);padding-bottom:22px;font-family:var(--mono);font-size:30px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}}
  .kopf b{{color:var(--ink);font-weight:500}}
  h1{{position:absolute;left:{M}px;top:{M + 100}px;margin:0;font-family:var(--display);font-weight:800;font-size:{118 if PORTRAIT else 150}px;line-height:.95;letter-spacing:-.03em}}
  h1 small{{display:block;font-family:var(--mono);font-weight:400;font-size:30px;letter-spacing:.12em;text-transform:uppercase;color:var(--red);margin-bottom:18px}}
  .stempel{{position:absolute;right:{M + 40}px;top:{M + 120}px;transform:rotate(-8deg);font-family:var(--display);font-weight:800;text-transform:uppercase;
           letter-spacing:.08em;color:var(--red);border:9px double var(--red);padding:18px 40px 14px;font-size:64px;line-height:1.05;text-align:center;opacity:.9;mix-blend-mode:multiply}}
  .stempel small{{display:block;font-family:var(--mono);font-weight:400;font-size:24px;letter-spacing:.14em;margin-top:8px}}
  figure{{position:absolute;margin:0;background:#fff;padding:14px 14px 42px;box-sizing:border-box;box-shadow:0 3px 8px rgba(0,0,0,.14),0 18px 40px -22px rgba(0,0,0,.4)}}
  figure img{{display:block;width:100%;height:100%;object-fit:cover;background:#e8e6e0}}
  figcaption{{position:absolute;left:14px;right:14px;bottom:10px;font-family:var(--mono);font-size:19px;color:var(--muted);display:flex;gap:14px;white-space:nowrap;overflow:hidden}}
  figcaption span{{color:var(--ink);font-weight:500}}
  .fuss{{position:absolute;left:{M}px;right:{M}px;bottom:{M}px;border-top:3px solid var(--ink);padding-top:22px;display:flex;justify-content:space-between;gap:40px;
        font-family:var(--mono);font-size:27px;color:var(--ink-2);line-height:1.45}}
  .fuss b{{color:var(--ink);font-weight:500}}
  .fuss .r{{text-align:right;white-space:nowrap}}
</style>
<div class="stage" id="stage"><div class="sheet">
  <div class="kopf"><div><b>Amt für Trauzeugenangelegenheiten</b> · Anlage 1 · Nachweise über langjährige Zusammenarbeit</div><div>Az. {c['aktenzeichen']}</div></div>
  <h1><small>Öffentliche Stellenausschreibung</small>Trauzeuge (m) gesucht.</h1>
  <div class="stempel">Einziger<br>Bewerber<small>{c['bewerber']} · Verfahren nicht öffentlich</small></div>
  {imgs}
  <div class="fuss">
    <div><b>Bewerber:</b> {c['bewerber']} &nbsp;·&nbsp; <b>Auftraggeber:</b> {c['auftraggeber']} &nbsp;·&nbsp; <b>Gegenstand:</b> Hochzeit {c['auftraggeber']} &amp; {c['partner']}, {c['hochzeit']}<br>
    Dem Amt liegen {len(photos)} Belege vor. Echtheit nicht geprüft, Frisuren sprechen für sich. Eignung war nie die Frage.</div>
    <div class="r">Beginn: sofort.<br>Spätestens nach diesem Bier.</div>
  </div>
</div></div>
<script>
  // Artifact view: scale the A4 sheet to the viewport. Headless render (?raw) keeps 1:1.
  if (location.search.includes("raw")) document.body.classList.add("raw");
  else {{
    const st = document.getElementById("stage");
    const fit = () => {{ const s = Math.min(innerWidth / {W}, innerHeight / {H}) * .96; st.style.transform = `scale(${{s}})`;
      document.body.style.height = {H} * s + 24 + "px"; st.style.margin = `12px ${{Math.max(0, (innerWidth - {W} * s) / 2)}}px`; }};
    fit(); addEventListener("resize", fit);
  }}
</script>
"""
    DIST.mkdir(exist_ok=True)
    out = DIST / f"collage-{SUFFIX}.html"; out.write_text(html)
    print(f"{len(photos)} Fotos, {len(set(round(b[2]) for b in boxes))} Reihen, {SUFFIX} -> {out} ({out.stat().st_size/1e6:.1f} MB)")

    if "--no-render" in sys.argv: return
    png = DIST / f"collage-a4-{SUFFIX}.png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
                    "--virtual-time-budget=8000", f"--screenshot={png}", f"file://{out.resolve()}?raw"],
                   check=True, capture_output=True)
    im = Image.open(png).convert("RGB")
    im.save(DIST / f"collage-a4-{SUFFIX}.jpg", "JPEG", quality=92, dpi=(300, 300))
    im.save(DIST / f"collage-a4-{SUFFIX}.pdf", "PDF", resolution=300)
    png.unlink()
    print(f"gerendert -> dist/collage-a4-{SUFFIX}.jpg + .pdf ({im.size[0]}x{im.size[1]} px, 300 dpi)")

if __name__ == "__main__":
    main()
