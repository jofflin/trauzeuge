import "./style.css";
import { CONFIG, QUIZ, URTEILE } from "./config";
import captions from "../captions.json";

type Caption = { caption: string; date: string; order: number };
const CAPTIONS = captions as Record<string, Caption>;

// All photos in src/photos/ – Vite emits them as hashed assets and gives us the URLs.
const photoUrls = import.meta.glob("./photos/*.jpg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

/* ---------- Basics ---------- */
const heute = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
document.querySelectorAll<HTMLElement>("[data-c]").forEach((el) => {
  const key = el.dataset.c as keyof typeof CONFIG;
  el.textContent = CONFIG[key] ?? "";
});
for (const id of ["datum", "datum2", "datum3"]) byId(id).textContent = heute;
byId("az").textContent = CONFIG.aktenzeichen;
byId("az2").textContent = CONFIG.aktenzeichen;
byId("bearbeiter").textContent = CONFIG.bearbeiter;

/* ---------- Anlage 1: Fotos ---------- */
const photos = Object.entries(photoUrls)
  .map(([path, src]) => {
    const file = path.split("/").pop()!;
    const meta = CAPTIONS[file] ?? { caption: "Aus dem Archiv", date: "undatiert", order: 99999999 };
    return { file, src, ...meta };
  })
  .sort((a, b) => a.order - b.order || a.file.localeCompare(b.file));

const akten = byId("akten");
if (!photos.length) {
  akten.innerHTML = '<p class="keine-fotos">Keine Belege eingereicht. Bilder nach src/photos/ legen.</p>';
}
photos.forEach((ph, i) => {
  const fig = document.createElement("figure");
  fig.className = "beleg";
  fig.innerHTML = `<span class="tape"></span><span class="clip">Beleg ${String(i + 1).padStart(2, "0")}</span>
    <img src="${ph.src}" alt="${ph.caption}" loading="lazy" decoding="async">
    <figcaption><b>${ph.caption}</b><span>${ph.date}</span></figcaption>`;
  akten.appendChild(fig);
});

/* ---------- Formblatt B: Quiz ---------- */
const fragen = byId("fragen");
let beantwortet = 0;
let punkte = 0;
QUIZ.forEach((f, i) => {
  const box = document.createElement("div");
  box.className = "frage";
  box.innerHTML = `<div class="label">Frage ${i + 1} von ${QUIZ.length}</div><h3>${f.q}</h3>
    <div class="opts">${f.a.map((t, j) => `<button type="button" class="opt" data-j="${j}">${t}</button>`).join("")}</div>
    <div class="kommentar"></div>`;
  box.querySelectorAll<HTMLButtonElement>(".opt").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (box.classList.contains("done")) return;
      box.classList.add("done");
      const j = Number(btn.dataset.j);
      const hit = j === f.correct;
      btn.classList.add(hit ? "right" : "wrong");
      if (!hit) box.querySelector(`[data-j="${f.correct}"]`)!.classList.add("right");
      box.querySelector(".kommentar")!.textContent = hit ? f.ok : f.nope;
      if (hit) punkte++;
      beantwortet++;
      if (beantwortet === QUIZ.length) {
        byId("score").textContent = String(punkte);
        byId("max").textContent = String(QUIZ.length);
        const idx = punkte === QUIZ.length ? 3 : punkte >= QUIZ.length - 1 ? 2 : punkte >= 2 ? 1 : 0;
        byId("urteil").textContent = URTEILE[idx];
        byId("ergebnis").classList.add("show");
      }
    }),
  );
  fragen.appendChild(box);
});

/* ---------- Unterschriften ---------- */
function pad(canvas: HTMLCanvasElement, opts: { locked?: boolean; onDraw?: (signed: boolean) => void } = {}) {
  const ctx = canvas.getContext("2d")!;
  const r = canvas.getBoundingClientRect();
  const s = devicePixelRatio || 1;
  canvas.width = r.width * s;
  canvas.height = r.height * s;
  ctx.scale(s, s);
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1f2f6b";
  if (opts.locked) return { clear() {} };

  let drawing = false;
  let last: [number, number] = [0, 0];
  let strokes = 0;
  const pos = (e: PointerEvent): [number, number] => {
    const b = canvas.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };
  canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    last = pos(e);
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(...last);
    ctx.lineTo(...p);
    ctx.stroke();
    last = p;
    strokes++;
    if (strokes === 6) opts.onDraw?.(true);
  });
  const up = () => (drawing = false);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  return {
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes = 0;
      opts.onDraw?.(false);
    },
  };
}

pad(byId<HTMLCanvasElement>("sig-ag"), { locked: true });
const wrap = byId("sig-wrap");
const btn = byId<HTMLButtonElement>("annehmen");
const note = byId("note");
const NOTE_DEFAULT = "Unterschrift oben erforderlich. Reihenfolge ist dem Amt wichtig.";
let signed = false;
const an = pad(byId<HTMLCanvasElement>("sig-an"), {
  onDraw(v) {
    signed = v;
    wrap.classList.toggle("signed", v);
    note.textContent = v ? "Unterschrift liegt vor. Das Amt wartet." : NOTE_DEFAULT;
  },
});
byId("sig-clear").addEventListener("click", () => an.clear());

/* ---------- Bescheid + Kronkorken ---------- */
btn.addEventListener("click", () => {
  if (!signed) {
    note.textContent = "Ohne Unterschrift kein Bescheid. Wir sind hier nicht bei Freunden. Doch, aber trotzdem.";
    wrap.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  btn.disabled = true;
  btn.textContent = "Angenommen";
  note.textContent = "Vorgang abgeschlossen.";
  const b = byId("bescheid");
  b.classList.add("show");
  setTimeout(() => b.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  kronkorken();
});

function kronkorken() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = byId<HTMLCanvasElement>("konfetti");
  c.hidden = false;
  const ctx = c.getContext("2d")!;
  const s = devicePixelRatio || 1;
  c.width = innerWidth * s;
  c.height = innerHeight * s;
  ctx.scale(s, s);
  const cols = ["#d39a2f", "#e8b84a", "#a8731a", "#f1dfae", "#b7332b"];
  type Cap = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; col: string; life: number };
  const caps: Cap[] = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.6,
    y: innerHeight * 0.75,
    vx: (Math.random() - 0.5) * 14,
    vy: -(9 + Math.random() * 13),
    r: 6 + Math.random() * 7,
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.3,
    col: cols[(Math.random() * cols.length) | 0],
    life: 1,
  }));
  const t0 = performance.now();
  const drawCap = (k: Cap) => {
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.rot);
    ctx.globalAlpha = Math.max(0, k.life);
    ctx.beginPath();
    for (let i = 0; i < 21; i++) {
      const a = (i / 21) * Math.PI * 2;
      const rr = k.r * (i % 2 ? 1 : 0.86);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = k.col;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, k.r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.fill();
    ctx.restore();
  };
  const frame = (t: number) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    for (const k of caps) {
      k.vy += 0.42;
      k.x += k.vx;
      k.y += k.vy;
      k.vx *= 0.992;
      k.rot += k.vr;
      if (t - t0 > 1800) k.life -= 0.02;
      if (k.life > 0 && k.y < innerHeight + 30) {
        alive = true;
        drawCap(k);
      }
    }
    if (alive) requestAnimationFrame(frame);
    else c.hidden = true;
  };
  requestAnimationFrame(frame);
}
