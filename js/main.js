/* =========================================================
   YOUR LINKS — fill these in and the contact section updates
   ========================================================= */
const CONFIG = {
  email: "",      // e.g. "you@example.com"
  instagram: "",  // e.g. "https://instagram.com/your_handle"
  whatsapp: "",   // e.g. "919876543210" (country code + number, no +)
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Navbar: background on scroll + active link ---------- */
const navbar = document.getElementById("navbar");
const navLinks = document.getElementById("nav-links");
const menuBtn = document.getElementById("menu-btn");

function onScroll() {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.querySelectorAll("a").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

/* ---------- Rotating role text in hero ---------- */
const roles = [
  "Web Developer",
  "Creative Web Designer",
  "Instagram Growth Expert",
  "Meta Ads Specialist",
  "Python Programmer",
];
const rotator = document.getElementById("role-rotator");
if (rotator && !reduceMotion) {
  let i = 0;
  setInterval(() => {
    rotator.classList.add("swap");
    setTimeout(() => {
      i = (i + 1) % roles.length;
      rotator.textContent = roles[i];
      rotator.classList.remove("swap");
    }, 350);
  }, 2600);
}

/* ---------- Scroll reveal, counters and skill bars ---------- */
function animateCount(el) {
  const target = Number(el.dataset.target);
  if (reduceMotion) { el.textContent = target; return; }
  const duration = 1600;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("visible");
      el.querySelectorAll(".count").forEach(animateCount);
      el.querySelectorAll(".bar-fill").forEach((bar) => {
        bar.style.width = `${bar.dataset.level}%`;
      });
      obs.unobserve(el);
    });
  },
  { threshold: 0.15 }
);

// Stagger items that sit side by side in a grid
document.querySelectorAll(".service-grid, .skills-grid, .testi-grid, .stats").forEach((grid) => {
  [...grid.children].forEach((child, idx) => {
    child.style.transitionDelay = `${idx * 0.12}s`;
  });
});
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Tilt effect on service cards (desktop only) ---------- */
if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const max = 12;
    card.addEventListener("mouseenter", () => {
      card.style.transitionDelay = "0s";
      card.style.transition = "transform .15s ease-out";
    });
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) scale(1.03)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform .4s ease";
      card.style.transform = "";
    });
  });
}

/* ---------- Contact links + form ---------- */
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
    a.href = "#contact-form";
    a.removeAttribute("target");
  }
});

const form = document.getElementById("contact-form");
const note = document.getElementById("form-note");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = data.get("name").trim();
  const email = data.get("email").trim();
  const message = data.get("message").trim();

  if (!CONFIG.email) {
    note.textContent = `Thanks ${name}! The contact form isn't connected yet — please try again soon.`;
    return;
  }

  const subject = encodeURIComponent(`New project enquiry from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
  note.textContent = `Thanks ${name}! Your email app is opening — hit send and I'll reply soon.`;
  form.reset();
});

/* ---------- Footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
