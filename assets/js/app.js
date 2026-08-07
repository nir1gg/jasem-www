/*  آقا جاسم — landing behaviour (toybox era).
 *
 *  This file is a module: if it cannot load, the .js class is never set and
 *  the page stays fully static and fully functional. Every device here is
 *  decoration or acceleration — nothing the page *says* depends on it.
 *  The scan demo without JS is a picture of a result; with JS it is a show.
 */

/* Analytics is deferred with the behaviour module instead of inflating the
 * critical HTML. This is PostHog's queueing bootstrap; the SDK stays async. */
!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="Ji Yi init fn mn Hr pn bn cn capture calculateEventProperties Sn register register_once register_for_session unregister unregister_for_session In getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Mn identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty Cn xn createPersonProfile setInternalOrTestUser Tn hn Pn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing debug Ur wt getPageViewId captureTraceFeedback captureTraceMetric an".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
window.posthog.init("phc_kJbr7zje6hXYZ6iqzGRzAx5gmEnuRtKxEZjobepA4iLk", {
  api_host: "https://eu.i.posthog.com",
  defaults: "2026-05-30",
  person_profiles: "always",
});

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");

/* ── the scroll engine ───────────────────────────────────────────────────────
 *  One rAF loop for the whole page, one write per element per frame. Two jobs:
 *
 *    · parallax — `[data-parallax]` gets a `transform`, because that is the
 *      only property both offset and depth need to share;
 *    · scenes — `[data-scene]` gets `--p`, 0 as it enters the viewport and 1 as
 *      it leaves, and CSS does every bit of the interpolation from there.
 *
 *  Splitting it that way is what keeps the choreography readable: adding a
 *  scroll-driven effect is a CSS declaration, not another listener. Under
 *  reduced motion this loop never starts, `--p` keeps whatever toy.css declared
 *  as its default, and every scene reads as a finished still.
 */

const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
const scenes = [...document.querySelectorAll("[data-scene]")];
const reelTrack = document.getElementById("reel-track");
const reelSection = reelTrack && reelTrack.closest(".reel");
const masthead = document.getElementById("masthead");
const rideStops = [...document.querySelectorAll(".ride__stop")];
const ride = document.getElementById("ride");

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

function sceneProgress(rect, vh, fromTop) {
  /* A section that starts at the top of the document can never be "entering"
     from below the fold, so the hero measures how far it has *left* instead —
     otherwise it would sit at --p: 0 until you had already scrolled past it. */
  if (fromTop) return clamp01(-rect.top / Math.max(rect.height, 1));
  return clamp01((vh - rect.top) / (vh + rect.height));
}

let ticking = false;

function frame() {
  ticking = false;
  const vh = innerHeight;

  for (const el of parallaxEls) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) { el.style.transform = ""; continue; }
    const center = r.top + r.height / 2 - vh / 2;
    const speed = parseFloat(el.dataset.speed || "0.10");
    const scale = el.dataset.scale ? ` scale(${el.dataset.scale})` : "";
    el.style.transform = `translateY(${(-center * speed).toFixed(1)}px)${scale}`;
  }

  for (const el of scenes) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    el.style.setProperty(
      "--p",
      sceneProgress(r, vh, el.dataset.sceneFrom === "top").toFixed(3),
    );
  }

  if (reelSection && reelTrack) {
    const r = reelSection.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const off = r.top + r.height / 2 - vh / 2;
      reelTrack.style.transform = `translateX(${(off * 0.35).toFixed(1)}px)`;
    }
  }

  /* The three stops light in order as he covers the ground, and each one is
     worth a chime — the sound is the feedback that the ride is *going*
     somewhere, so it fires on the crossing, never on every frame. */
  if (ride && rideStops.length) {
    const progress = parseFloat(ride.style.getPropertyValue("--p") || "0");
    rideStops.forEach((stop, index) => {
      const lit = progress > 0.22 + index * 0.2;
      if (lit === stop.classList.contains("is-lit")) return;
      stop.classList.toggle("is-lit", lit);
      if (lit) blip(1400 + index * 260);
    });
  }

  if (masthead) masthead.classList.toggle("is-scrolled", scrollY > 8);
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(frame); }
}

if (!reduced) {
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();
} else if (masthead) {
  /* Reduced motion still wants to know the page has moved; a shadow is not
     motion. */
  addEventListener("scroll", () => {
    masthead.classList.toggle("is-scrolled", scrollY > 8);
  }, { passive: true });
}

/* ── sound: a switch, not a surprise ────────────────────────────────────────
 *  Everything is synthesized with Web Audio — no bundled files, nothing to
 *  download, nothing to wait for. Three rules it never breaks:
 *
 *    1. No AudioContext until a real gesture. Browsers enforce it; we mean it.
 *    2. The preference is remembered (`localStorage`), and it defaults to *off*
 *       for anyone who asked for reduced motion — someone who turned motion
 *       down did not ask for chimes either.
 *    3. Sound is never the only carrier of anything. Mute the page and the
 *       scan still shows its result, the stops still light, the button still
 *       says what it did.
 */

const SOUND_KEY = "jsm.sound";
const soundBtn = document.getElementById("sound");

function readPreference() {
  try {
    const saved = localStorage.getItem(SOUND_KEY);
    if (saved === "on") return true;
    if (saved === "off") return false;
  } catch (_) { /* private mode: fall through to the default */ }
  return !reduced;
}

let soundOn = readPreference();
let actx = null;

function paint() {
  if (soundBtn) soundBtn.setAttribute("aria-pressed", String(soundOn));
}
paint();

function ensureAudio() {
  if (actx || !soundOn) return actx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  } catch (_) { actx = null; }
  return actx;
}

/* One shared gain stage, so muting is one ramp instead of a hunt for live
   oscillators — and so the whole page can never get louder than this. */
const LEVEL = 0.5;
let bus = null;
function output() {
  const ctx = ensureAudio();
  if (!ctx) return null;
  if (!bus) {
    bus = ctx.createGain();
    bus.gain.value = LEVEL;
    bus.connect(ctx.destination);
  }
  return bus;
}

/* A short sine note with an attack/release envelope. Sine because every other
   waveform in a browser oscillator reads as a 1990s alert.

   `soundOn` is checked here rather than trusted to the bus gain: once a context
   exists it is never torn down, so a muted page must refuse to schedule notes
   at all. Leaving that to the gain stage is how a "muted" toggle starts making
   noise again the moment anything resets it. */
function tone(freq, at, dur, vol) {
  if (!soundOn) return;
  const ctx = actx;
  const out = output();
  if (!ctx || !out) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function blip(freq = 2200) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(freq, t, 0.06, 0.10);
  tone(freq * 0.82, t + 0.09, 0.06, 0.08);
}

function chime() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(880, t, 0.10, 0.08);
  tone(1320, t + 0.08, 0.12, 0.06);
  tone(1760, t + 0.18, 0.14, 0.04);
}

function tap() {
  const ctx = ensureAudio();
  if (!ctx) return;
  tone(320, ctx.currentTime, 0.05, 0.07);
}

/* Suspended contexts are the norm on iOS until a gesture lands inside the
   page, so every entry point resumes before it plays. */
function wake() {
  const ctx = ensureAudio();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}
["pointerdown", "keydown", "touchstart"].forEach((ev) =>
  addEventListener(ev, wake, { passive: true }));

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    paint();
    try { localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off"); } catch (_) {}
    if (soundOn) {
      if (bus && actx) bus.gain.setTargetAtTime(LEVEL, actx.currentTime, 0.02);
      wake();
      chime();
    } else if (bus && actx) {
      /* Ramp, do not cut: a hard gain change on a live oscillator clicks. This
         silences whatever is already sounding; `tone()` refuses to schedule
         anything new. */
      bus.gain.setTargetAtTime(0.0001, actx.currentTime, 0.02);
    }
  });
}

document.querySelectorAll("[data-click]").forEach((el) => {
  el.addEventListener("click", tap);
});

/* ── the fake scan — a show, honest about being one ─────────────────────── */

const demo = document.getElementById("demo");
const scanBtn = document.getElementById("scan-btn");
const results = document.getElementById("demo-results");

function runScan() {
  results.classList.remove("shown");
  demo.classList.remove("scanning");
  /* Force a reflow so a rescan replays the sweep from the top. */
  void demo.offsetWidth;
  demo.classList.add("scanning");
  scanBtn.disabled = true;
  blip();
  setTimeout(() => {
    demo.classList.remove("scanning");
    results.classList.add("shown");
    scanBtn.disabled = false;
    scanBtn.textContent = "دوباره اسکن کن";
    chime();
  }, reduced ? 0 : 1900);
}

if (demo && scanBtn && results) {
  scanBtn.addEventListener("click", runScan);
  /* It also runs itself, once, the first time it is properly on screen: a
     reader who only scrolls should still see the thing the section promises.
     The button then owns every replay. */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        self.disconnect();
        runScan();
      }
    }, { threshold: 0.6 });
    io.observe(demo);
  }
}

/* ── reveals: sections arrive like toys dropped on the rug ──────────────── */

const revealables = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduced) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.18 });
  revealables.forEach((el) => observer.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("in"));
}

/* The step cards' drawn objects animate on `.in`, and under reduced motion the
   reveal observer never runs — so mark them arrived directly, or their ticks
   would sit undrawn forever. */
if (reduced) {
  document.querySelectorAll(".step").forEach((el) => el.classList.add("in"));
}

/* ── the magnet CTA: he leans toward your cursor ────────────────────────── */

document.querySelectorAll("[data-magnet]").forEach((el) => {
  if (reduced || !matchMedia("(pointer: fine)").matches) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.style.translate = `${x * 6}px ${y * 5}px`;
  });
  el.addEventListener("pointerleave", () => { el.style.translate = ""; });
});

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
    blip(760);
    badge.addEventListener("animationend", (ev) => {
      if (ev.animationName === "jsm-soon-out") badge.remove();
    });
  });
});
