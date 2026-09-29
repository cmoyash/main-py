/* =========================================================
   YOUR LINKS — fill these in and every button updates
   ========================================================= */
const CONFIG = {
  email: "",      // e.g. "you@example.com"
  instagram: "",  // e.g. "https://instagram.com/your_handle"
  whatsapp: "",   // e.g. "919876543210" (country code + number, no + or spaces)
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

/* ---------- Header fade + active nav / index links ---------- */
const header = document.querySelector(".header");
const pillLinks = [...document.querySelectorAll(".pill-nav a")];
const tocLinks = [...document.querySelectorAll(".toc a")];

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
}

let scrollQueued = false;
function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    header.classList.toggle("scrolled", window.scrollY > 20);
    markActive(pillLinks);
    markActive(tocLinks);
    scrollQueued = false;
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

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
  if (href) {
    a.href = href;
  } else {
    a.href = "#contact";
    a.removeAttribute("target");
  }
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
