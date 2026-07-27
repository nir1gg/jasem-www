/*  آقا جاسم — landing behaviour.
 *
 *  This file is a module: if it cannot load, the .js class is never set and
 *  the page stays fully static and fully functional. Every device here is
 *  decoration or acceleration — nothing the page *says* depends on it.
 *
 *  The WebGL wall loads from loadWall(), behind every gate the brand book
 *  demands: reduced motion, save-data, slow links, narrow viewports, small
 *  devices. Decoration must never tax the people who can least afford it.
 */

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Styles for JS-only devices load with the JS that makes them exist. Nothing
 * below runs until they have actually arrived — spinning the reels before
 * their clipping styles exist would spill the digit drums across the page. */
const fx = document.createElement("link");
fx.rel = "stylesheet";
fx.href = "./assets/css/fx.css";
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  root.classList.add("js");
  init();
}
fx.addEventListener("load", boot);
fx.addEventListener("error", boot);   /* degrade, but never deadlock */
document.head.appendChild(fx);
setTimeout(boot, 2500);

function init() {

const css = (name) =>
  getComputedStyle(root).getPropertyValue(name).trim();
const INKS = [
  "--jsm-color-ink-shangarf", "--jsm-color-ink-surati", "--jsm-color-ink-sabz",
  "--jsm-color-ink-limu", "--jsm-color-ink-lajvardi", "--jsm-color-ink-narenji",
].map(css);

/* ── paste-up: sheets wait for the viewport ─────────────────────────────── */

const sheetIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("pasted");
      sheetIO.unobserve(e.target);
    }
  }
}, { threshold: 0.15 });
document.querySelectorAll(".sheet").forEach((el) => sheetIO.observe(el));

/* ── confetti — bursts once from the ledger, again only for the easter egg ─ */

function confetti(x, y, count = 60) {
  if (reduced) return;
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("span");
    bit.className = "confetti";
    bit.style.background = INKS[i % INKS.length];
    bit.style.left = x + "px";
    bit.style.top = y + "px";
    bit.style.setProperty("--dx", (Math.random() * 320 - 160).toFixed(0) + "px");
    bit.style.setProperty("--dy", (180 + Math.random() * 320).toFixed(0) + "px");
    bit.style.setProperty("--rot", (Math.random() * 900 - 450).toFixed(0) + "deg");
    bit.style.setProperty("--t", (900 + Math.random() * 700).toFixed(0) + "ms");
    document.body.appendChild(bit);
    bit.addEventListener("animationend", () => bit.remove());
  }
}

/* ── the ledger machine ─────────────────────────────────────────────────── */

const ledger = document.querySelector(".ledger");
const DIGITS = "۰۱۲۳۴۵۶۷۸۹";
let confettiSpent = false;

function buildReel(reel) {
  const target = reel.dataset.price;
  reel.textContent = "";
  [...target].forEach((ch, i) => {
    if (!DIGITS.includes(ch)) {
      reel.appendChild(Object.assign(document.createElement("span"), { textContent: ch }));
      return;
    }
    const col = document.createElement("span");
    col.className = "reel__col";
    const strip = document.createElement("span");
    strip.className = "reel__strip";
    // Two full turns of the drum, then the target digit.
    const run = DIGITS + DIGITS + ch;
    for (const d of run) {
      strip.appendChild(Object.assign(document.createElement("span"), { textContent: d }));
    }
    // Columns stop one after another, like a real machine winding down.
    strip.style.transitionDuration =
      `calc(var(--jsm-motion-duration-reel) + ${i * 120}ms)`;
    col.appendChild(strip);
    reel.appendChild(col);
  });
}

function spinReels() {
  const reels = ledger.querySelectorAll(".reel");
  reels.forEach(buildReel);
  // Next frame, send every strip to its final digit.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    reels.forEach((reel) => {
      reel.querySelectorAll(".reel__strip").forEach((strip) => {
        strip.style.translate = `0 calc(-${strip.childElementCount - 1} * 1.35em)`;
      });
    });
  }));
}

function inkLedger({ spin } = {}) {
  ledger.classList.remove("is-inked");
  if (spin) spinReels();
  const wait = spin ? 1500 : 0;
  setTimeout(() => {
    if (spin) {
      ledger.classList.add("shudder");
      ledger.addEventListener("animationend",
        () => ledger.classList.remove("shudder"), { once: true });
    }
    void ledger.offsetWidth;                      // restart the CSS animations
    ledger.classList.add("is-inked");
    if (!confettiSpent && !reduced) {
      confettiSpent = true;
      const r = ledger.getBoundingClientRect();
      setTimeout(() => confetti(r.left + r.width / 2, r.top + r.height / 2), 800);
    }
  }, wait);
}

/*  Each run of the machine is a fresh errand: pre-formatted price literals
 *  from the markup (never JS-formatted — see CLAUDE.md), and the winner —
 *  circle, sticker, green price — moves to whichever row is cheapest.
 *  Equal-length Persian numerals compare correctly as strings. */
const rows = ledger ? [...ledger.querySelectorAll(".row")] : [];
const scenarios = ledger ? JSON.parse(ledger.dataset.scenarios || "[]") : [];
let scen = 0;
function nextErrand() {
  if (!scenarios.length || !rows.length) return;
  const prices = scenarios[scen++ % scenarios.length];
  let win = 0;
  prices.forEach((v, i) => { if (v < prices[win]) win = i; });
  const circle = ledger.querySelector(".row__circle");
  const sticker = ledger.querySelector(".sticker");
  rows.forEach((row, i) => {
    row.querySelector(".reel").dataset.price = prices[i];
    row.classList.toggle("row--win", i === win);
  });
  rows[win].prepend(circle);
  rows[win].append(sticker);
}

if (ledger) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        nextErrand();
        inkLedger({ spin: true });
        io.disconnect();
      }
    }
  }, { threshold: 0.5 });
  io.observe(ledger);

  const again = document.getElementById("search-again");
  if (again) {
    again.hidden = false;
    again.addEventListener("click", () => {
      nextErrand();
      inkLedger({ spin: true });
    });
  }
}

/* ── oaths: the ticks draw as each row scrolls in ───────────────────────── */

const oathIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("sworn");
      oathIO.unobserve(e.target);
    }
  }
}, { threshold: 0.7 });
document.querySelectorAll(".oath").forEach((el) => oathIO.observe(el));

/* ── magnetic CTA ───────────────────────────────────────────────────────── */

if (!reduced && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll("[data-magnet]").forEach((btn) => {
    const RANGE = 120, PULL = 7;
    addEventListener("pointermove", (ev) => {
      const r = btn.getBoundingClientRect();
      const dx = ev.clientX - (r.left + r.width / 2);
      const dy = ev.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      btn.style.translate = d < RANGE
        ? `${(dx / RANGE) * PULL}px ${(dy / RANGE) * PULL}px`
        : "";
    }, { passive: true });
  });
}

/* ── 3D tilt on the matchbox labels ─────────────────────────────────────── */

if (!reduced && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (ev) => {
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ty", (px * 10).toFixed(2) + "deg");
      card.style.setProperty("--tx", (-py * 8).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tx", "0deg");
      card.style.setProperty("--ty", "0deg");
    });
  });
}

/* ── parallax collage in the لاجوردی block ──────────────────────────────── */

const layers = [...document.querySelectorAll("[data-depth]")];
if (layers.length && !reduced) {
  let ticking = false;
  const drive = () => {
    ticking = false;
    const mid = innerHeight / 2;
    for (const el of layers) {
      const r = el.getBoundingClientRect();
      const off = (r.top + r.height / 2 - mid) * parseFloat(el.dataset.depth);
      el.style.setProperty("--py", (-off).toFixed(1) + "px");
    }
  };
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(drive); }
  }, { passive: true });
  drive();
}

/* ── spray-paint cursor trail, hero only ────────────────────────────────── */

const hero = document.querySelector(".hero");
if (hero && !reduced && matchMedia("(pointer: fine)").matches) {
  let last = 0, live = 0;
  hero.addEventListener("pointermove", (ev) => {
    const now = performance.now();
    if (now - last < 40 || live > 40) return;
    last = now;
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "spray";
      dot.style.background = INKS[(Math.random() * INKS.length) | 0];
      dot.style.left = ev.clientX + (Math.random() * 18 - 9) + "px";
      dot.style.top = ev.clientY + (Math.random() * 18 - 9) + "px";
      dot.style.setProperty("--sx", (Math.random() * 14 - 7).toFixed(0) + "px");
      dot.style.setProperty("--sy", (6 + Math.random() * 10).toFixed(0) + "px");
      live++;
      document.body.appendChild(dot);
      dot.addEventListener("animationend", () => { dot.remove(); live--; });
    }
  }, { passive: true });
}

/* ── the flyers: pick them up, move them, throw them away ───────────────── */

/*  The pinned flyers are loose paper. Drag one somewhere else and it stays;
 *  fling it and it sails with the throw, tilting into the motion, and if it
 *  crosses the hero's edge it is thrown away for good. Direct manipulation
 *  stays under reduced motion — only the inertia is dropped. */
if (hero) {
  document.querySelectorAll(".wall .flyer").forEach((flyer) => {
    const base = parseFloat(getComputedStyle(flyer).rotate) || 0;
    let x = 0, y = 0, vx = 0, vy = 0, tilt = 0;
    let lastX = 0, lastY = 0, lastT = 0, raf = 0, held = false;

    const put = () => {
      flyer.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      flyer.style.rotate = (base + tilt).toFixed(2) + "deg";
    };
    const outside = () => {
      const f = flyer.getBoundingClientRect();
      const h = hero.getBoundingClientRect();
      return f.bottom < h.top || f.top > h.bottom ||
             f.right < h.left || f.left > h.right;
    };
    const sail = () => {
      vx *= 0.95; vy *= 0.95; tilt *= 0.98;
      x += vx; y += vy;
      put();
      if (outside()) {                       /* thrown off the wall: gone */
        flyer.classList.add("is-gone");
        setTimeout(() => flyer.remove(), 650);
        return;
      }
      if (Math.hypot(vx, vy) > 0.3) raf = requestAnimationFrame(sail);
    };

    flyer.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      cancelAnimationFrame(raf);
      flyer.setPointerCapture(ev.pointerId);
      flyer.classList.add("is-held", "is-loose");
      held = true;
      lastX = ev.clientX; lastY = ev.clientY; lastT = performance.now();
      vx = vy = 0;
    });
    flyer.addEventListener("pointermove", (ev) => {
      if (!held) return;
      const now = performance.now();
      const dx = ev.clientX - lastX, dy = ev.clientY - lastY;
      const dt = Math.max(now - lastT, 1);
      lastX = ev.clientX; lastY = ev.clientY; lastT = now;
      x += dx; y += dy;
      /* Velocity in px/frame (16ms), smoothed so a jitter is not a throw. */
      vx = vx * 0.6 + (dx / dt) * 16 * 0.4;
      vy = vy * 0.6 + (dy / dt) * 16 * 0.4;
      tilt = tilt * 0.85 + vx * 0.18;        /* paper leans into the motion */
      put();
    });
    const drop = () => {
      if (!held) return;
      held = false;
      flyer.classList.remove("is-held");
      tilt *= 0.5;
      put();
      if (!reduced && Math.hypot(vx, vy) > 3) sail();
    };
    flyer.addEventListener("pointerup", drop);
    flyer.addEventListener("pointercancel", drop);
  });
}

/* ── the scratch-off coupon ─────────────────────────────────────────────── */

const foil = document.querySelector(".scratch__foil");
if (foil) {
  const panel = foil.parentElement;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const paint = () => {
    foil.width = panel.clientWidth * dpr;
    foil.height = panel.clientHeight * dpr;
    const ctx = foil.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = panel.clientWidth, h = panel.clientHeight;
    ctx.fillStyle = css("--jsm-color-ink-nili");
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = css("--jsm-tint-nili-40");
    for (let i = -h; i < w; i += 14) {             // brushed-foil hatching
      ctx.fillRect(i, 0, 5, h);
    }
    ctx.fillStyle = css("--jsm-color-ink-kaghaz");
    ctx.font = `${Math.min(44, w / 8)}px Jomhuria, Tahoma, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText("بخراش!", w / 2, h / 2 + 4);
    return ctx;
  };
  let ctx = paint();
  let strokes = 0;
  /* First paint can race the webfont; repaint in the real face once loaded. */
  document.fonts?.load("44px Jomhuria", "بخراش").then(() => {
    if (strokes === 0 && !foil.classList.contains("cleared")) ctx = paint();
  }).catch(() => {});
  const scratch = (ev) => {
    if (ev.buttons === 0 && ev.type === "pointermove") return;
    const r = foil.getBoundingClientRect();
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(ev.clientX - r.left, ev.clientY - r.top, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (++strokes % 12 === 0) {                    // occasionally count clear area
      const s = ctx.getImageData(0, 0, foil.width, foil.height).data;
      let holes = 0;
      for (let i = 3; i < s.length; i += 64) if (s[i] === 0) holes++;
      if (holes / (s.length / 64) > 0.45) foil.classList.add("cleared");
    }
  };
  foil.addEventListener("pointerdown", scratch);
  foil.addEventListener("pointermove", scratch);
  addEventListener("resize", () => {
    if (!foil.classList.contains("cleared")) ctx = paint();
  });
}

/* ── the stores: tap one, get the honest surprise ───────────────────────── */

document.querySelectorAll("[data-soon]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (document.querySelector(".soon-badge")) return;
    const r = btn.getBoundingClientRect();
    const badge = document.createElement("p");
    badge.className = "soon-badge";
    badge.textContent = "به‌زودی";
    badge.style.left = r.left + r.width / 2 + "px";
    badge.style.top = r.top + r.height / 2 + "px";
    document.body.appendChild(badge);
    badge.addEventListener("animationend", (ev) => {
      if (ev.animationName === "jsm-soon-out") badge.remove();
    });
    if (!reduced) {
      document.body.classList.add("quake");
      setTimeout(() => document.body.classList.remove("quake"), 550);
    }
  });
});

/* ── the easter egg: tap the hat, wake the fan ──────────────────────────── */

const hat = document.getElementById("hat");
if (hat) {
  let taps = 0, timer = 0;
  hat.addEventListener("click", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; }, 1600);
    if (++taps < 5) return;
    taps = 0;
    const footer = hat.closest(".footer");
    footer.classList.add("party");
    const r = hat.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top, 80);
    setTimeout(() => footer.classList.remove("party"), 6000);
  });
}

/* ── the marquee is a tuning dial: the page scroll turns it ─────────────── */

const tracks = [...document.querySelectorAll(".chant__track")];
if (tracks.length) {
  let ticking2 = false;
  const turn = () => {
    ticking2 = false;
    for (const track of tracks) {
      const half = track.scrollWidth / 2;
      if (!half) continue;
      const dir = track.classList.contains("chant__track--rev") ? -1 : 1;
      /* Stay inside [0, half] — the range the duplicated spans cover. */
      const x = ((scrollY * 0.55 * dir) % half + half) % half;
      track.style.transform = `translateX(${x}px)`;
    }
  };
  addEventListener("scroll", () => {
    if (!ticking2) { ticking2 = true; requestAnimationFrame(turn); }
  }, { passive: true });
  turn();
}

/* ── the نوبت pad: tear a queue ticket off ──────────────────────────────── */

const nobat = document.getElementById("nobat");
if (nobat) {
  nobat.hidden = false;
  const btn = document.getElementById("nobat-tear");
  const num = btn.querySelector(".nobat__num");
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const fa = (n) => String(n).replace(/\d/g, (d) => FA[d]);
  let turn2 = 1;
  btn.addEventListener("click", () => {
    const r = btn.getBoundingClientRect();
    const torn = btn.cloneNode(true);
    torn.className = "nobat__ticket nobat__torn";
    torn.style.left = r.left + "px";
    torn.style.top = r.top + "px";
    torn.style.inlineSize = r.width + "px";
    document.body.appendChild(torn);
    torn.addEventListener("animationend", () => torn.remove());
    num.textContent = fa(++turn2);
    if (turn2 === 20) {                         /* patience is rewarded once */
      confetti(r.left + r.width / 2, r.top, 50);
    }
  });
}

/* ── CRT scroll: the page re-renders coarse while it moves ──────────────── */

/*  Old tube logic: while the page scrolls fast the beam cannot keep up, so
 *  the whole print drops to a coarse dot grid; stop, and it resolves back in
 *  steps, not a fade. The tile size follows scroll velocity. The filter is a
 *  JS-only device, so it is built here, not shipped in the critical HTML.
 *  Skipped for reduced motion and for the devices that can least afford a
 *  full-page filter — same doctrine as the wall. */
function buildCrtFilter() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  const filter = document.createElementNS(NS, "filter");
  filter.id = "jsm-crt";
  filter.setAttribute("color-interpolation-filters", "sRGB");
  /* Dot-grid samples the page; dilate rebuilds each sample as a block. */
  for (const [tag, attrs] of [
    ["feFlood",      { x: 2, y: 2, width: 2, height: 2 }],
    ["feComposite",  { width: 8, height: 8 }],
    ["feTile",       { result: "grid" }],
    ["feComposite",  { in: "SourceGraphic", in2: "grid", operator: "in" }],
    ["feMorphology", { operator: "dilate", radius: 4 }],
  ]) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    filter.appendChild(el);
  }
  svg.appendChild(filter);
  document.body.appendChild(svg);
  return filter;
}

if (!reduced &&
    !(navigator.connection || {}).saveData &&
    (navigator.deviceMemory ?? 8) >= 4) {
  const crt = buildCrtFilter();
  const flood = crt.querySelector("feFlood");
  const tile  = crt.querySelector("feComposite");
  const morph = crt.querySelector("feMorphology");
  let px = 0, lastY = scrollY, lastT = performance.now(), vel = 0, settle = 0;

  const resample = (n) => {
    if (n === px) return;
    px = n;
    if (!n) { root.classList.remove("crt"); return; }
    flood.setAttribute("x", n / 4);
    flood.setAttribute("y", n / 4);
    flood.setAttribute("width", n / 4);
    flood.setAttribute("height", n / 4);
    tile.setAttribute("width", n);
    tile.setAttribute("height", n);
    morph.setAttribute("radius", n / 2);
    root.classList.add("crt");
  };
  const resolve = () => {                    /* step back down, CRT-style */
    resample(px > 8 ? 8 : px > 4 ? 4 : 0);
    if (px) settle = setTimeout(resolve, 90);
  };

  addEventListener("scroll", () => {
    const now = performance.now();
    vel = vel * 0.7 + (Math.abs(scrollY - lastY) / Math.max(now - lastT, 1)) * 0.3;
    lastY = scrollY; lastT = now;
    const want = vel > 2.4 ? 12 : vel > 1.2 ? 8 : vel > 0.5 ? 4 : 0;
    if (want > px) resample(want);
    clearTimeout(settle);
    settle = setTimeout(resolve, 130);
  }, { passive: true });
}

/* ── the WebGL wall, behind every gate ──────────────────────────────────── */

function loadWall() {
  const mount = document.getElementById("wall");
  if (!mount || reduced) return;
  const conn = navigator.connection || {};
  if (conn.saveData || /(^|\b)(slow-)?2g$/.test(conn.effectiveType || "")) return;
  if (innerWidth < 720) return;
  if ((navigator.deviceMemory ?? 8) < 4) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./assets/css/wall.css";
  document.head.appendChild(link);

  import("./wall.js")
    .then((wall) => wall.mount(mount))
    .catch(() => { /* the CSS wall is already on screen; nothing is missing */ });
}
loadWall();
}
