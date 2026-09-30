/* =========================================================
   YOUR LINKS — fill these in and every button updates
   ========================================================= */
const CONFIG = {
  email: "",                                         // e.g. "you@example.com" (Email buttons stay hidden until set)
  instagram: "https://www.instagram.com/yashknowsai/",
  whatsapp: "917020824004",                          // country code + number, no + or spaces
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Live clock (India time) ---------- */
const clock = document.getElementById("clock");
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
function tickClock() { clock.textContent = timeFmt.format(new Date()); }
tickClock();
setInterval(tickClock, 1000);

/* ---------- Header: scroll edge, compact nav, active links ---------- */
const header = document.querySelector(".header");
const pillLinks = [...document.querySelectorAll(".pill-nav a")];
const tocLinks = [...document.querySelectorAll(".toc a")];
const indicator = document.querySelector(".nav-indicator");

// Links are in page order, so the last target above the 40% line is the current one.
function markActive(links) {
  const line = window.innerHeight * 0.4;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let active = null;
  links.forEach((a) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target && target.getBoundingClientRect().top <= line) active = a;
  });
  if (atBottom) active = links[links.length - 1];
  links.forEach((a) => a.classList.toggle("active", a === active));
  return active;
}

// The glass "droplet" that slides between nav items
let indicatorFor = null;
let squishTimer = null;
function moveIndicator(link, instant = false) {
  if (!link) { indicator.classList.remove("ready"); indicatorFor = null; return; }
  const changed = link !== indicatorFor;
  indicatorFor = link;
  if (instant) indicator.style.transition = "none";
  indicator.style.width = `${link.offsetWidth}px`;
  indicator.style.height = `${link.offsetHeight}px`;
  indicator.style.transform = `translate(${link.offsetLeft}px, ${link.offsetTop}px)`;
  if (instant) { void indicator.offsetWidth; indicator.style.transition = ""; }
  indicator.classList.add("ready");
  if (changed && !instant && !reduceMotion) {
    indicator.classList.add("moving");
    clearTimeout(squishTimer);
    squishTimer = setTimeout(() => indicator.classList.remove("moving"), 240);
  }
}

let lastY = window.scrollY;
let scrollQueued = false;
function onScroll(instant = false) {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 20);
    // like iOS: the bar shrinks while you scroll down and grows back when you scroll up
    if (y > lastY + 4 && y > 160) header.classList.add("compact");
    else if (y < lastY - 4 || y <= 160) header.classList.remove("compact");
    lastY = y;
    moveIndicator(markActive(pillLinks), instant === true);
    markActive(tocLinks);
    scrollQueued = false;
  });
}
window.addEventListener("scroll", () => onScroll(), { passive: true });
window.addEventListener("resize", () => onScroll(true));
onScroll(true);
if (document.fonts) document.fonts.ready.then(() => onScroll(true));

/* ---------- Liquid glass: light follows the pointer ---------- */
if (navigator.userAgentData) document.documentElement.classList.add("lg-refract"); // Chromium can refract the backdrop
document.addEventListener("pointermove", (e) => {
  const el = e.target.closest && e.target.closest(".lg");
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}, { passive: true });
document.addEventListener("pointerout", (e) => {
  const el = e.target.closest && e.target.closest(".lg");
  if (el && !el.contains(e.relatedTarget)) {
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
  }
});

/* ---------- Live pink fluid background (WebGL) ---------- */
const FLUID_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uPortrait;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
vec3 pal(float t) {
  vec3 c0 = vec3(0.0), c1 = vec3(0.071, 0.012, 0.047), c2 = vec3(0.275, 0.067, 0.188), c3 = vec3(0.427, 0.102, 0.282);
  vec3 c4 = vec3(0.643, 0.204, 0.424), c5 = vec3(0.863, 0.384, 0.698), c6 = vec3(0.969, 0.580, 0.882), c7 = vec3(0.976, 0.753, 0.902);
  if (t < 0.18) return mix(c0, c1, t / 0.18);
  if (t < 0.32) return mix(c1, c2, (t - 0.18) / 0.14);
  if (t < 0.46) return mix(c2, c3, (t - 0.32) / 0.14);
  if (t < 0.60) return mix(c3, c4, (t - 0.46) / 0.14);
  if (t < 0.74) return mix(c4, c5, (t - 0.60) / 0.14);
  if (t < 0.86) return mix(c5, c6, (t - 0.74) / 0.12);
  return mix(c6, c7, (t - 0.86) / 0.14);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = gl_FragCoord.xy / uRes.y;
  float v = 1.0 - uv.y;
  float t = uTime * 0.16;
  vec2 sp = p * 1.5 + uMouse * 0.08;
  vec2 q = vec2(fbm(sp + vec2(0.0, t)), fbm(sp + vec2(5.2, 1.3) - t * 0.8));
  vec2 r = vec2(fbm(sp + 3.2 * q + vec2(1.7, 9.2) + t * 0.6), fbm(sp + 3.2 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = clamp((fbm(sp + 3.0 * r) - 0.2) / 0.6, 0.0, 1.0);
  float ripple = 0.5 + 0.5 * sin(f * 14.0 + t * 3.0);
  float mask;
  if (uPortrait > 0.5) {
    mask = clamp(1.3 - length(vec2(uv.x * 0.9, v * 1.25)) * 1.3, 0.0, 1.0);
  } else {
    mask = pow(clamp(1.25 - 0.85 * p.x, 0.0, 1.0), 1.3);
    mask = max(mask, clamp(0.5 - 0.35 * p.x - v * 0.35, 0.0, 1.0));
  }
  gl_FragColor = vec4(pal(clamp(mask * (0.5 + 0.42 * f + 0.22 * ripple), 0.0, 1.0)), 1.0);
}`;

function startFluid() {
  const bg = document.querySelector(".bg");
  const canvas = document.getElementById("fluid");
  if (!canvas || reduceMotion) return; // the still image stays as the background
  const gl = canvas.getContext("webgl", { antialias: false, depth: false, stencil: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(gl.VERTEX_SHADER, "attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }");
  const fs = compile(gl.FRAGMENT_SHADER, FLUID_SHADER);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uMouse = gl.getUniformLocation(prog, "uMouse");
  const uPortrait = gl.getUniformLocation(prog, "uPortrait");

  // Rendered at half size and scaled up: the fluid is soft, so this looks the same and stays light on phones.
  function resize() {
    const scale = window.innerWidth < 700 ? 0.4 : 0.5;
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uPortrait, h > w ? 1 : 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let running = true;
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); running = false; bg.classList.remove("live"); });

  const start = performance.now();
  function frame(now) {
    if (!running) return;
    if (!document.hidden) {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, -mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      bg.classList.add("live");
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
startFluid();

/* ---------- Reveal on scroll + counters ---------- */
function animateCount(el) {
  const target = Number(el.dataset.target);
  if (reduceMotion) { el.textContent = target; return; }
  const start = performance.now();
  const duration = 1400;
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      entry.target.querySelectorAll(".count").forEach(animateCount);
      obs.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".testi-grid").forEach((grid) =>
  [...grid.children].forEach((child, i) => { child.style.transitionDelay = `${i * 0.12}s`; })
);
document.querySelectorAll(".hero .reveal").forEach((el, i) => { el.style.transitionDelay = `${i * 0.1}s`; });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Work carousel ---------- */
const slides = [...document.querySelectorAll(".slide")];
const bars = [...document.querySelectorAll("#progress button")];
const progress = document.getElementById("progress");
const workTitle = document.getElementById("work-title");
const workDesc = document.getElementById("work-desc");
const SLIDE_MS = 6000;
let current = 0;
let timer = null;

progress.style.setProperty("--dur", `${SLIDE_MS}ms`);

function showSlide(index) {
  current = (index + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
  bars.forEach((b, i) => {
    b.classList.remove("active");
    b.classList.toggle("done", i < current);
    b.setAttribute("aria-selected", String(i === current));
  });
  // restart the fill animation on the active bar
  void bars[current].offsetWidth;
  bars[current].classList.add("active");

  const { title, desc } = slides[current].dataset;
  workTitle.classList.add("fade-out");
  workDesc.classList.add("fade-out");
  setTimeout(() => {
    workTitle.textContent = title;
    workDesc.textContent = desc;
    workTitle.classList.remove("fade-out");
    workDesc.classList.remove("fade-out");
  }, 250);
}

function restartTimer() {
  clearInterval(timer);
  if (!reduceMotion) timer = setInterval(() => showSlide(current + 1), SLIDE_MS);
}

bars.forEach((b, i) => b.addEventListener("click", () => { showSlide(i); restartTimer(); }));
document.getElementById("slides").addEventListener("click", () => { showSlide(current + 1); restartTimer(); });

// swipe on touch screens
let touchX = null;
const slidesEl = document.getElementById("slides");
slidesEl.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
slidesEl.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) { showSlide(current + (dx < 0 ? 1 : -1)); restartTimer(); }
  touchX = null;
});

// pause while hovered
const showcase = document.getElementById("showcase");
showcase.addEventListener("mouseenter", () => { clearInterval(timer); progress.classList.add("paused"); });
showcase.addEventListener("mouseleave", () => { progress.classList.remove("paused"); restartTimer(); });

showSlide(0);
restartTimer();

/* ---------- Social links ---------- */
const linkTargets = {
  email: CONFIG.email && `mailto:${CONFIG.email}`,
  instagram: CONFIG.instagram,
  whatsapp: CONFIG.whatsapp && `https://wa.me/${CONFIG.whatsapp}`,
};
document.querySelectorAll("[data-link]").forEach((a) => {
  const href = linkTargets[a.dataset.link];
  if (href) a.href = href;
  else a.hidden = true; // no link set yet (e.g. email), so don't show a dead button
});

/* ---------- Contact form ---------- */
const form = document.getElementById("contact-form");
const note = document.getElementById("form-note");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = form.message.value.trim();
  if (!message) return;

  if (CONFIG.whatsapp) {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  } else if (CONFIG.email) {
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("New project enquiry")}&body=${encodeURIComponent(message)}`;
  } else {
    note.textContent = "Thanks! The contact form isn't connected yet. Please try again soon.";
    return;
  }
  note.textContent = "Thanks! Opening your app so you can send the message.";
  form.reset();
});

/* ---------- Footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
