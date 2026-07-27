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
  const c = document.createElement("canvas");
  c.width = 256; c.height = 340;
  const x = c.getContext("2d");
  x.textAlign = "center";
  x.direction = "rtl";

  const frame = (fg) => {
    x.strokeStyle = fg;
    x.lineWidth = 8;
    x.strokeRect(10, 10, 236, 320);
    x.lineWidth = 2;
    x.strokeRect(22, 22, 212, 296);
  };
  const rays = (cx, cy, color, n = 16, r0 = 34, r1 = 150) => {
    x.strokeStyle = color;
    x.lineWidth = 10;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      x.beginPath();
      x.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a));
      x.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
      x.stroke();
    }
  };

  // The wall carries era ads — the things Jasem pinned up — not the brand
  // repeated. Each obeys the ink rules: مرکب on نارنجی, لیمویی on darks.
  const kindN = kind % 4;
  if (kindN === 0) {
    // The 1961 soda sheet: rays, a roundel, black lettering on orange.
    x.fillStyle = inks.narenji;
    x.fillRect(0, 0, 256, 340);
    rays(128, 108, inks.limu, 14, 40, 130);
    x.fillStyle = inks.limu;
    x.beginPath(); x.arc(128, 108, 44, 0, Math.PI * 2); x.fill();
    x.fillStyle = inks.morakkab;
    x.font = "40px Jomhuria, Tahoma, sans-serif";
    x.fillText("جدید", 128, 122);
    x.font = "88px Jomhuria, Tahoma, sans-serif";
    x.fillText("نوشابه", 128, 268);
    frame(inks.morakkab);
  } else if (kindN === 1) {
    // The Film-Farsi one-sheet: لاجوردی night, لیمویی burst, red title.
    x.fillStyle = inks.lajvardi;
    x.fillRect(0, 0, 256, 340);
    rays(128, 130, inks.limu, 18, 30, 160);
    x.fillStyle = inks.limu;
    x.beginPath(); x.arc(128, 130, 36, 0, Math.PI * 2); x.fill();
    x.font = "84px Jomhuria, Tahoma, sans-serif";
    x.lineWidth = 3;
    x.strokeStyle = inks.kaghaz;
    x.fillStyle = inks.shangarf;
    x.strokeText("سینما", 128, 286);
    x.fillText("سینما", 128, 286);
    frame(inks.limu);
  } else if (kindN === 2) {
    // The grocer's sign: awning stripes over bottle green.
    x.fillStyle = inks.sabz;
    x.fillRect(0, 0, 256, 340);
    x.fillStyle = inks.kaghaz;
    for (let i = 0; i < 8; i += 2) x.fillRect(10 + i * 30, 10, 30, 52);
    x.font = "64px Jomhuria, Tahoma, sans-serif";
    x.fillText("میوهٔ تازه", 128, 210);
    x.font = "44px Jomhuria, Tahoma, sans-serif";
    x.fillText("سبزی · لبنیات", 128, 280);
    frame(inks.kaghaz);
  } else {
    // کبریت توکلی at wall scale: paper ground, صورتی plate.
    x.fillStyle = inks.kaghaz;
    x.fillRect(0, 0, 256, 340);
    x.fillStyle = inks.surati;
    x.fillRect(40, 66, 176, 190);
    x.fillStyle = inks.kaghaz;
    x.font = "66px Jomhuria, Tahoma, sans-serif";
    x.fillText("کبریت", 128, 180);
    x.fillStyle = inks.morakkab;
    x.font = "34px Jomhuria, Tahoma, sans-serif";
    x.fillText("۵۰ عددی", 128, 300);
    frame(inks.morakkab);
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
    mesh.userData = {
      lift: 0,
      baseZ: mesh.position.z,
      rotZ: mesh.rotation.z,
      flying: false,
      vel: new THREE.Vector3(),
    };
    posters.push(mesh);
    scene.add(mesh);
  }

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);         /* off-screen until moved */
  let overWall = false;              /* pointer is on bare hero, not on copy */
  const toNDC = (ev) => {
    const r = el.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  };
  const heroEl = el.parentElement;                 /* .hero — the hit surface */
  addEventListener("pointermove", (ev) => {
    toNDC(ev);
    overWall = ev.target === heroEl;
  }, { passive: true });

  /* ── grabbing: the deep posters are loose paper too ─────────────────────
   *  The canvas never takes pointer events (the copy above must stay
   *  clickable), so grabbing rides window events: a press on the bare hero
   *  raycasts into the wall. Drag moves the poster on its own depth plane;
   *  release with speed throws it, and past the frame it is gone. */
  let grabbed = null;
  const vGrab = new THREE.Vector3();
  const vTmp = new THREE.Vector3();

  /* The pointer ray, cut at the plane of depth z. */
  function pointerWorld(out, z) {
    out.set(pointer.x, pointer.y, 0.5).unproject(camera);
    out.sub(camera.position).normalize();
    return out.multiplyScalar((z - camera.position.z) / out.z)
              .add(camera.position);
  }
  function discard(p) {
    scene.remove(p);
    p.material.uniforms.uMap.value.dispose();
    p.material.dispose();
    p.geometry.dispose();
    posters.splice(posters.indexOf(p), 1);
  }
  addEventListener("pointerdown", (ev) => {
    /* Never a link, a button, a copy sheet, or a CSS flyer — those own
       their pointer. Touch keeps scrolling the page. */
    if (ev.pointerType === "touch" || ev.target !== heroEl) return;
    toNDC(ev);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(posters)[0]?.object;
    if (!hit) return;
    ev.preventDefault();
    grabbed = hit;
    grabbed.userData.flying = false;
    vGrab.set(0, 0, 0);
    heroEl.style.cursor = "grabbing";
  });
  const release = () => {
    if (!grabbed) return;
    const m = grabbed;
    grabbed = null;
    heroEl.style.cursor = "";
    if (vGrab.length() > 0.12) {                  /* a real throw: it sails */
      m.userData.flying = true;
      m.userData.vel.copy(vGrab);
    } else {                                      /* put down where it is */
      m.userData.baseZ = m.position.z;
      m.userData.rotZ = m.rotation.z;
    }
  };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);

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

    /* The held poster follows the hand on its own depth plane, leaning
       into the motion; its velocity is smoothed so a jitter is not a throw. */
    if (grabbed) {
      /* Capped so repeated grabs cannot float a poster into the camera. */
      pointerWorld(vTmp, Math.min(grabbed.userData.baseZ + 1.0, -1.2));
      vTmp.sub(grabbed.position).multiplyScalar(0.45);
      vGrab.lerp(vTmp, 0.5);
      grabbed.position.add(vTmp);
      grabbed.rotation.z = grabbed.userData.rotZ +
        Math.max(-0.3, Math.min(0.3, -vGrab.x * 0.6));
    }

    /* Posters near the cursor lift and tilt; the nearest one peels. */
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(posters)[0]?.object;
    if (!grabbed) {
      heroEl.style.cursor = hit && overWall ? "grab" : "";
    }
    for (let i = posters.length - 1; i >= 0; i--) {
      const p = posters[i];
      if (p.userData.flying) {                    /* thrown: it sails away */
        p.userData.vel.multiplyScalar(0.97);
        p.position.add(p.userData.vel);
        p.rotation.z += p.userData.vel.x * 0.03;
        if (Math.abs(p.position.x) > 18 || Math.abs(p.position.y) > 11) {
          discard(p);                             /* off the wall: gone */
        } else if (p.userData.vel.length() < 0.01) {
          p.userData.flying = false;
          p.userData.baseZ = p.position.z;
          p.userData.rotZ = p.rotation.z;
        }
        continue;
      }
      if (p === grabbed) {
        p.material.uniforms.uPeel.value += (1 - p.material.uniforms.uPeel.value) * 0.15;
        continue;
      }
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
      document.fonts.load('96px Jomhuria', 'نوشابه سینما'),
    ]).then(start, start);
  } else {
    start();
  }
}
