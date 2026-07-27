/*  آقا جاسم — the WebGL poster wall.
 *
 *  Loaded lazily by app.js, and only after every gate passed (reduced motion,
 *  save-data, slow links, narrow viewports, low-memory devices). The scene is
 *  aria-hidden decoration: a wall of poster planes in depth whose textures are
 *  GENERATED at runtime from the brand palette — no image downloads.
 *
 *  The fragment shader reproduces the print system — coarse halftone, paper
 *  grain, RGB misregistration — so the 3D layer looks like the same pressroom,
 *  not like a WebGL demo bolted onto a print identity.
 */

import * as THREE from "../vendor/three.module.min.js";

const css = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* Deterministic pseudo-random: the wall is composed, not shuffled per visit. */
const rand = (() => {
  let s = 7;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
})();

const VERT = /* glsl */ `
  uniform float uPeel;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float c = pow(max(uv.x + uv.y - 1.0, 0.0), 2.0);   /* corner curl */
    p.z += uPeel * c * 1.7;
    p.y -= uPeel * c * 0.25;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOff;
  uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    float r = texture2D(uMap, vUv + vec2(uOff, 0.0)).r;
    float g = texture2D(uMap, vUv).g;
    float b = texture2D(uMap, vUv - vec2(uOff, 0.0)).b;
    vec3 col = vec3(r, g, b);
    vec2 grid = fract(vUv * vec2(64.0, 88.0)) - 0.5;   /* countable halftone */
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col *= 1.0 - smoothstep(0.44, 0.36, length(grid)) * (1.0 - lum) * 0.22;
    col += (hash(vUv * 700.0 + uSeed) - 0.5) * 0.06;   /* paper grain */
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ── runtime poster textures ────────────────────────────────────────────── */

function posterTexture(kind) {
  const inks = {
    kaghaz: css("--jsm-color-ink-kaghaz"),
    morakkab: css("--jsm-color-ink-morakkab"),
    shangarf: css("--jsm-color-ink-shangarf"),
    surati: css("--jsm-color-ink-surati"),
    sabz: css("--jsm-color-ink-sabz"),
    limu: css("--jsm-color-ink-limu"),
    lajvardi: css("--jsm-color-ink-lajvardi"),
    narenji: css("--jsm-color-ink-narenji"),
  };
  // Grounds paired with a type ink that passes at poster scale. نارنجی takes
  // مرکب only; لیمویی only ever sits on dark inks. Same rules as the page.
  const pairs = [
    [inks.kaghaz, inks.morakkab],
    [inks.shangarf, inks.kaghaz],
    [inks.sabz, inks.limu],
    [inks.lajvardi, inks.limu],
    [inks.narenji, inks.morakkab],
    [inks.morakkab, inks.limu],
    [inks.surati, inks.kaghaz],
  ];
  const [bg, fg] = pairs[(rand() * pairs.length) | 0];

  const c = document.createElement("canvas");
  c.width = 256; c.height = 340;
  const x = c.getContext("2d");
  x.fillStyle = bg;
  x.fillRect(0, 0, 256, 340);
  // The double rule of a newspaper ad.
  x.strokeStyle = fg;
  x.lineWidth = 8;
  x.strokeRect(10, 10, 236, 320);
  x.lineWidth = 2;
  x.strokeRect(22, 22, 212, 296);

  x.fillStyle = fg;
  x.textAlign = "center";
  x.direction = "rtl";
  if (kind % 3 === 0) {
    x.font = "96px Jomhuria, Tahoma, sans-serif";
    x.fillText("ارزون!", 128, 150);
    x.font = "44px Jomhuria, Tahoma, sans-serif";
    x.fillText("گرون نخر", 128, 240);
  } else if (kind % 3 === 1) {
    x.font = "72px Jomhuria, Tahoma, sans-serif";
    x.fillText("آقا جاسم", 128, 130);
    // The rosette, printed under the words.
    x.beginPath();
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28 - Math.PI / 2;
      const r = i % 2 ? 44 : 60;
      x[i ? "lineTo" : "moveTo"](128 + r * Math.cos(a), 235 + r * Math.sin(a));
    }
    x.closePath();
    x.fill();
  } else {
    // Awning stripes — the shopfront, not a message.
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) x.fillRect(28 + i * 25, 28, 25, 284);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ── scene ──────────────────────────────────────────────────────────────── */

export function mount(el) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return;                      /* no WebGL: the CSS wall stays, complete */
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(el.clientWidth, el.clientHeight);
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45, el.clientWidth / el.clientHeight, 0.1, 60);
  camera.position.z = 10;

  const posters = [];
  for (let i = 0; i < 16; i++) {
    const geo = new THREE.PlaneGeometry(3, 4, 12, 16);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: posterTexture(i) },
        uOff: { value: 0.0035 + rand() * 0.003 },
        uSeed: { value: rand() * 10 },
        uPeel: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (rand() - 0.5) * 17,
      (rand() - 0.5) * 9,
      -1 - rand() * 5.5,
    );
    mesh.rotation.z = (rand() - 0.5) * 0.12;
    mesh.userData = { lift: 0, baseZ: mesh.position.z };
    posters.push(mesh);
    scene.add(mesh);
  }

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);         /* off-screen until moved */
  addEventListener("pointermove", (ev) => {
    const r = el.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }, { passive: true });

  /* Pause when the tab hides or the hero scrolls away. */
  let raf = 0, running = false, visible = true, inView = true;
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    schedule();
  });
  io.observe(el);
  document.addEventListener("visibilitychange", () => {
    visible = document.visibilityState === "visible";
    schedule();
  });

  function schedule() {
    const should = visible && inView;
    if (should && !running) { running = true; raf = requestAnimationFrame(tick); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }

  addEventListener("resize", () => {
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(el.clientWidth, el.clientHeight);
  });

  function tick() {
    if (!running) return;
    /* Camera: parallax toward the pointer, dolly with scroll. */
    camera.position.x += (pointer.x * 1.3 - camera.position.x) * 0.05;
    camera.position.y += (pointer.y * 0.8 - camera.position.y) * 0.05;
    camera.position.z = 10 - Math.min(scrollY * 0.004, 2.5);
    camera.lookAt(0, 0, -3);

    /* Posters near the cursor lift and tilt; the nearest one peels. */
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(posters)[0]?.object;
    for (const p of posters) {
      const want = p === hit ? 1 : 0;
      p.userData.lift += (want - p.userData.lift) * 0.08;
      const l = p.userData.lift;
      p.position.z = p.userData.baseZ + l * 0.8;
      p.rotation.x = -pointer.y * 0.08 * l;
      p.rotation.y = pointer.x * 0.1 * l;
      p.material.uniforms.uPeel.value = l;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  /* Jomhuria may still be loading; textures want the real letterforms. */
  const start = () => {
    posters.forEach((p, i) => {
      p.material.uniforms.uMap.value = posterTexture(i);
    });
    el.classList.add("wall--on");
    schedule();
  };
  if (document.fonts?.load) {
    Promise.all([
      document.fonts.load('96px Jomhuria', 'ارزون'),
    ]).then(start, start);
  } else {
    start();
  }
}
