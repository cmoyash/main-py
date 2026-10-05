/* =========================================================
   AZURA — page behaviour
   ========================================================= */

/* ---------- edit these ---------- */
const CONFIG = {
  email: "hello@azura.example",
  phone: "+1 (555) 010-2030",
  // Paste a form endpoint here (for example from Formspree) to receive visit requests by email.
  // Leave empty and requests are kept in the visitor's browser only.
  formEndpoint: "",
};

// Prices are stored in US dollars and converted with these indicative rates.
const RATES = { USD: 1, EUR: 0.92, INR: 83.5 };

const RESIDENCES = [
  {
    id: "cliff-villa", name: "The Cliff Villa", type: "villa", beds: 5, baths: 6, area: 620, price: 6800000, status: "Available", view: "front",
    desc: "The main house: a glass living pavilion on the cliff edge, with the bedroom suite floating above and the infinity pool in front.",
    features: ["25 m infinity pool", "Double-height living room", "Chef's kitchen", "Wine room", "Home cinema", "Three-car garage"],
  },
  {
    id: "sky-suite", name: "The Sky Suite", type: "suite", beds: 3, baths: 3, area: 240, price: 3400000, status: "Next phase", view: "bedroom",
    desc: "A top-floor residence with a wraparound glass wall and a private terrace that faces the sunset.",
    features: ["Wraparound glass", "Private roof terrace", "Walk-in wardrobe", "Outdoor shower", "Smart home", "Lift access"],
  },
  {
    id: "pool-pavilion", name: "The Pool Pavilion", type: "pavilion", beds: 2, baths: 2, area: 180, price: 2100000, status: "Reserved", view: "pergola",
    desc: "A light, single-level guest house beside the pool deck, shaded by a timber pergola.",
    features: ["Pergola deck", "Pool access", "Outdoor kitchen", "Daybeds", "Ensuite bedrooms", "Garden views"],
  },
  {
    id: "garden-house", name: "The Garden House", type: "villa", beds: 4, baths: 4, area: 410, price: 4600000, status: "Next phase", view: "garden",
    desc: "Set back among the olive trees, a quieter home with a walled garden and sea views from the upper floor.",
    features: ["Walled olive garden", "Plunge pool", "Library", "Guest wing", "Solar roof", "Private entrance"],
  },
  {
    id: "lookout-studio", name: "The Lookout Studio", type: "suite", beds: 1, baths: 1, area: 85, price: 950000, status: "Available", view: "sunset",
    desc: "A compact studio cut into the rock, with one huge window aimed straight at the horizon.",
    features: ["Panoramic window", "Kitchenette", "Rain shower", "Rental programme ready", "Shared pool access", "Storage room"],
  },
  {
    id: "headland-estate", name: "The Headland Estate", type: "estate", beds: 7, baths: 8, area: 800, price: null, status: "Available", view: "aerial",
    desc: "The Cliff Villa and the Pool Pavilion together, with the whole headland as one private estate.",
    features: ["Main villa + guest pavilion", "Entire private headland", "Staff quarters", "Helipad-ready lawn", "Boat mooring", "Full concierge"],
  },
];

const GALLERY = [
  { view: "aerial", caption: "The headland from above" },
  { view: "sunset", caption: "Golden hour from the living room" },
  { view: "pool", caption: "The infinity pool" },
  { view: "living", caption: "Living room" },
  { view: "bedroom", caption: "Main bedroom" },
  { view: "dusk", caption: "Blue hour" },
  { view: "pergola", caption: "Pergola deck" },
  { view: "sea", caption: "From the water" },
];

/* ---------- tiny helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: ignore */ } },
};
const images = {}; // view name -> rendered image URL
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 2600);
}

/* ---------- money ---------- */
let currency = store.get("azura-currency", "USD");
if (!RATES[currency]) currency = "USD";
function money(usd, { short = false } = {}) {
  if (usd == null) return "Price on request";
  const v = usd * RATES[currency];
  if (currency === "INR") {
    if (short && v >= 1e7) return `₹${(v / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
    if (short && v >= 1e5) return `₹${(v / 1e5).toFixed(1).replace(/\.0$/, "")} L`;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
  }
  const locale = currency === "EUR" ? "de-DE" : "en-US";
  if (short) return new Intl.NumberFormat(locale, { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(v);
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

/* =========================================================
   3D story
   ========================================================= */
const story = $("#story");
const chapters = $$(".chapter");
let world = null;

// split headlines into words so they can animate in one by one
for (const h of $$(".headline")) {
  let i = 0;
  const wrap = (text) => text.split(/(\s+)/).map((part) => {
    if (!part.trim()) return document.createTextNode(part);
    const s = document.createElement("span");
    s.className = "w"; s.style.setProperty("--i", i++); s.textContent = part;
    return s;
  });
  for (const node of [...h.childNodes]) {
    if (node.nodeType === 3) node.replaceWith(...wrap(node.textContent));
    else { const parts = wrap(node.textContent); node.textContent = ""; node.append(...parts); }
  }
}

// chapter dots
const dots = $("#storyDots");
chapters.forEach((ch, i) => {
  const li = document.createElement("li");
  const b = document.createElement("button");
  b.type = "button";
  b.setAttribute("aria-label", `Go to chapter ${i + 1}: ${ch.querySelector(".headline").textContent.trim()}`);
  b.addEventListener("click", () => scrollToProgress(i === 0 ? 0 : (+ch.dataset.from + +ch.dataset.to) / 2));
  li.append(b); dots.append(li);
});
const dotButtons = $$("button", dots);

function storyProgress() {
  const r = story.getBoundingClientRect();
  const total = story.offsetHeight - innerHeight;
  return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
}
function scrollToProgress(p) {
  const total = story.offsetHeight - innerHeight;
  scrollTo({ top: story.offsetTop + p * total, behavior: "smooth" });
}

function updateStory() {
  const p = storyProgress();
  if (world) world.setProgress(p);
  chapters.forEach((ch, i) => {
    const on = p >= +ch.dataset.from && p < +ch.dataset.to;
    ch.classList.toggle("is-active", on);
    dotButtons[i].classList.toggle("is-active", on);
  });
  $("#storyBar").style.transform = `scaleX(${p})`;
  $("#scrollHint").classList.toggle("is-hidden", p > 0.02);
}

async function startWorld() {
  const canvas = $("#world");
  try {
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("WebGL is not available");
    const { createWorld, VIEWS } = await import("./scene.js");
    world = createWorld(canvas);
    world.jumpTo(storyProgress());
    updateStory();

    new IntersectionObserver(([e]) => (e.isIntersecting ? world.start() : world.stop())).observe(story);
    addEventListener("resize", () => world.resize());
    if (matchMedia("(pointer: fine)").matches) {
      addEventListener("pointermove", (e) => world.setPointer((e.clientX / innerWidth - 0.5) * 2, -(e.clientY / innerHeight - 0.5) * 2));
    }
    finishLoading();

    // render still images for the cards and gallery, one per task so the page stays responsive
    for (const name of Object.keys(VIEWS)) {
      await new Promise((r) => setTimeout(r, 30));
      images[name] = world.snapshot(name);
      for (const img of $$(`img[data-view="${name}"]`)) img.src = images[name];
    }
  } catch (err) {
    console.warn("3D view unavailable:", err);
    document.documentElement.classList.add("no-webgl");
    finishLoading();
  }
}

function finishLoading() {
  $("#loader").classList.add("is-done");
  document.body.classList.remove("is-loading");
}

/* =========================================================
   Header, menu, current section
   ========================================================= */
const header = $("#header");
const nav = $("#nav");
const menuBtn = $("#menuBtn");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  header.classList.toggle("is-solid", open || scrollY > story.offsetHeight - innerHeight - 10);
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

function onScroll() {
  updateStory();
  header.classList.toggle("is-solid", nav.classList.contains("is-open") || scrollY > story.offsetHeight - innerHeight - 10);
}
addEventListener("scroll", onScroll, { passive: true });

const navLinks = $$("a", nav);
const sectionObs = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${e.target.id}`));
  }
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main > section[id]").forEach((s) => sectionObs.observe(s));

/* ---------- reveal + counters ---------- */
const revealObs = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("is-in");
    revealObs.unobserve(e.target);
    const n = e.target.querySelector("[data-count]");
    if (n) countUp(n);
  }
}, { threshold: 0.15 });
$$(".reveal").forEach((el) => revealObs.observe(el));

function countUp(el) {
  const end = +el.dataset.count, dec = +(el.dataset.decimals || 0), suffix = el.dataset.suffix || "";
  const t0 = performance.now(), dur = 1400;
  const step = (now) => {
    const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
    el.textContent = (end * e).toFixed(dec) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* =========================================================
   Residences: filter, sort, save, details
   ========================================================= */
const filters = { type: "all", beds: 0, sort: "featured", savedOnly: false };
let saved = new Set(store.get("azura-saved", []));
const cardsEl = $("#cards");
const heartSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>';
const typeLabel = { villa: "Villa", suite: "Suite", pavilion: "Pavilion", estate: "Estate" };

function visibleResidences() {
  let list = RESIDENCES.filter((r) =>
    (filters.type === "all" || r.type === filters.type) &&
    r.beds >= filters.beds &&
    (!filters.savedOnly || saved.has(r.id)));
  const price = (r) => (r.price == null ? Infinity : r.price);
  if (filters.sort === "price-asc") list = [...list].sort((a, b) => price(a) - price(b));
  if (filters.sort === "price-desc") list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  if (filters.sort === "size-desc") list = [...list].sort((a, b) => b.area - a.area);
  return list;
}

function renderCards() {
  const list = visibleResidences();
  cardsEl.innerHTML = list.map((r, i) => `
    <article class="card" style="--i:${i}">
      <div class="card-media">
        <img data-view="${r.view}" src="${images[r.view] || ""}" alt="3D render of ${r.name}" loading="lazy" />
        <span class="badge ${r.status === "Available" ? "" : "reserved"}">${r.status}</span>
        <button class="heart" type="button" data-save="${r.id}" aria-pressed="${saved.has(r.id)}" aria-label="Save ${r.name}">${heartSvg}</button>
      </div>
      <div class="card-body">
        <span class="card-type">${typeLabel[r.type]}</span>
        <h3>${r.name}</h3>
        <div class="card-meta"><span>${r.beds} bed</span><span>${r.baths} bath</span><span>${r.area} m²</span></div>
        <div class="card-foot">
          <span class="price">${money(r.price, { short: true })}</span>
          <button class="card-link" type="button" data-open="${r.id}">View details</button>
        </div>
      </div>
    </article>`).join("");
  $("#resultCount").textContent = `${list.length} of ${RESIDENCES.length} residences`;
  $("#emptyState").hidden = list.length > 0;
}

$("#typeChips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  $$(".chip", e.currentTarget).forEach((c) => c.classList.toggle("is-active", c === chip));
  filters.type = chip.dataset.type;
  renderCards();
});
$("#bedsFilter").addEventListener("change", (e) => { filters.beds = +e.target.value; renderCards(); });
$("#sortBy").addEventListener("change", (e) => { filters.sort = e.target.value; renderCards(); });
const savedOnlyBtn = $("#savedOnly");
function setSavedOnly(on) {
  filters.savedOnly = on;
  savedOnlyBtn.setAttribute("aria-pressed", on);
  renderCards();
}
savedOnlyBtn.addEventListener("click", () => setSavedOnly(!filters.savedOnly));
$("#resetFilters").addEventListener("click", () => {
  Object.assign(filters, { type: "all", beds: 0, sort: "featured" });
  $$("#typeChips .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.type === "all"));
  $("#bedsFilter").value = "0"; $("#sortBy").value = "featured";
  setSavedOnly(false);
});
$("#savedBtn").addEventListener("click", () => {
  if (!saved.size) { toast("Tap the heart on a residence to save it"); }
  else setSavedOnly(true);
  $("#residences").scrollIntoView({ behavior: "smooth" });
});

function toggleSave(id) {
  const r = RESIDENCES.find((x) => x.id === id);
  if (saved.has(id)) { saved.delete(id); toast(`Removed ${r.name} from saved`); }
  else { saved.add(id); toast(`Saved ${r.name}`); }
  store.set("azura-saved", [...saved]);
  updateSavedUI();
}
function updateSavedUI() {
  $("#savedCount").textContent = saved.size;
  $("#savedBtn").classList.toggle("has-items", saved.size > 0);
  $$("[data-save]").forEach((b) => b.setAttribute("aria-pressed", saved.has(b.dataset.save)));
  if (current) $("#detailSave").setAttribute("aria-pressed", saved.has(current.id));
  if (filters.savedOnly) renderCards();
}

cardsEl.addEventListener("click", (e) => {
  const save = e.target.closest("[data-save]");
  if (save) return toggleSave(save.dataset.save);
  const card = e.target.closest(".card");
  if (card) openDetail(card.querySelector("[data-open]").dataset.open);
});

/* ---------- detail dialog ---------- */
const detail = $("#detail");
let current = null;
function openDetail(id) {
  current = RESIDENCES.find((r) => r.id === id);
  if (!current) return;
  const img = $("#detailImg");
  img.dataset.view = current.view;
  img.src = images[current.view] || "";
  img.alt = `3D render of ${current.name}`;
  $("#detailType").textContent = `${typeLabel[current.type]} · ${current.status}`;
  $("#detailTitle").textContent = current.name;
  $("#detailPrice").textContent = money(current.price);
  $("#detailSpecs").innerHTML = [[current.beds, "Bedrooms"], [current.baths, "Bathrooms"], [`${current.area}`, "m² inside"], [current.type === "estate" ? "1.2 ha" : "Sea", current.type === "estate" ? "Land" : "View"]]
    .map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("");
  $("#detailDesc").textContent = current.desc;
  $("#detailFeatures").innerHTML = current.features.map((f) => `<li>${f}</li>`).join("");
  $("#detailSave").setAttribute("aria-pressed", saved.has(current.id));
  $("#detailCalc").disabled = current.price == null;
  $("#detailCalc").style.opacity = current.price == null ? 0.4 : 1;
  detail.showModal();
}
$("#detailSave").addEventListener("click", () => current && toggleSave(current.id));
$("#detailBook").addEventListener("click", () => {
  detail.close();
  $("#residenceSelect").value = current.id;
  $("#visit").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => $("#visitForm [name=name]").focus({ preventScroll: true }), 700);
});
$("#detailCalc").addEventListener("click", () => {
  if (current.price == null) return;
  detail.close();
  const input = $("#calcPrice");
  input.value = clamp(current.price, +input.min, +input.max);
  updateCalc();
  $("#calculator").scrollIntoView({ behavior: "smooth" });
});

// close dialogs with the × button or by clicking the backdrop
for (const dlg of $$("dialog")) {
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
}

/* =========================================================
   Gallery + lightbox
   ========================================================= */
const galleryGrid = $("#galleryGrid");
galleryGrid.innerHTML = GALLERY.map((g, i) => `
  <button type="button" class="reveal" data-index="${i}" aria-label="Open image: ${g.caption}">
    <img data-view="${g.view}" src="${images[g.view] || ""}" alt="${g.caption}" loading="lazy" />
    <span>${g.caption}</span>
  </button>`).join("");
$$(".reveal", galleryGrid).forEach((el) => revealObs.observe(el));

const lightbox = $("#lightbox");
let lbIndex = 0;
function showImage(i) {
  lbIndex = (i + GALLERY.length) % GALLERY.length;
  const g = GALLERY[lbIndex];
  const img = $("#lbImg");
  img.dataset.view = g.view;
  img.src = images[g.view] || "";
  img.alt = g.caption;
  $("#lbCap").textContent = `${g.caption} · ${lbIndex + 1} / ${GALLERY.length}`;
}
galleryGrid.addEventListener("click", (e) => {
  const b = e.target.closest("[data-index]");
  if (!b) return;
  showImage(+b.dataset.index);
  lightbox.showModal();
});
$("#lbPrev").addEventListener("click", () => showImage(lbIndex - 1));
$("#lbNext").addEventListener("click", () => showImage(lbIndex + 1));
lightbox.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") showImage(lbIndex - 1);
  if (e.key === "ArrowRight") showImage(lbIndex + 1);
});
let touchX = null;
lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener("touchend", (e) => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) showImage(lbIndex + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* =========================================================
   Location: link the list and the map
   ========================================================= */
function hotSpot(name, on) {
  $$(`[data-spot="${name}"]`).forEach((el) => el.classList.toggle("is-hot", on));
}
$$("[data-spot]").forEach((el) => {
  el.addEventListener("mouseenter", () => hotSpot(el.dataset.spot, true));
  el.addEventListener("mouseleave", () => hotSpot(el.dataset.spot, false));
});

/* =========================================================
   Payment calculator
   ========================================================= */
const calc = { price: $("#calcPrice"), down: $("#calcDown"), rate: $("#calcRate"), term: $("#calcTerm") };
function fill(input) { input.style.setProperty("--fill", `${((input.value - input.min) / (input.max - input.min)) * 100}%`); }
function updateCalc() {
  const price = +calc.price.value, downPct = +calc.down.value, rate = +calc.rate.value, years = +calc.term.value;
  const down = price * (downPct / 100), loan = price - down, n = years * 12, r = rate / 100 / 12;
  const monthly = r === 0 ? loan / n : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const interest = monthly * n - loan;
  $("#priceOut").textContent = money(price, { short: true });
  $("#downOut").textContent = `${downPct}% · ${money(down, { short: true })}`;
  $("#rateOut").textContent = `${rate.toFixed(1)}%`;
  $("#termOut").textContent = `${years} years`;
  $("#monthly").textContent = money(monthly);
  $("#loanAmt").textContent = money(loan);
  $("#interestAmt").textContent = money(interest);
  $("#downAmt").textContent = money(down);
  $("#totalAmt").textContent = money(price + interest);
  const share = loan / (loan + interest || 1);
  $("#donutPrincipal").style.strokeDashoffset = 301.6 * (1 - share);
  Object.values(calc).forEach(fill);
}
Object.values(calc).forEach((i) => i.addEventListener("input", updateCalc));

/* ---------- currency ---------- */
const currencySel = $("#currency");
currencySel.value = currency;
currencySel.addEventListener("change", () => {
  currency = currencySel.value;
  store.set("azura-currency", currency);
  renderCards();
  updateCalc();
  if (current && detail.open) $("#detailPrice").textContent = money(current.price);
});

/* =========================================================
   Book a visit
   ========================================================= */
const form = $("#visitForm");
const dateInput = $("#visitDate");
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const maxDate = new Date(); maxDate.setMonth(maxDate.getMonth() + 6);
dateInput.min = isoDate(tomorrow);
dateInput.max = isoDate(maxDate);

$("#residenceSelect").innerHTML = '<option value="">Choose a residence</option>' +
  RESIDENCES.map((r) => `<option value="${r.id}">${r.name}</option>`).join("") +
  '<option value="any">Not sure yet</option>';

const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email."),
  phone: (v) => (v.replace(/\D/g, "").length >= 7 ? "" : "Please enter a phone number we can call."),
  residence: (v) => (v ? "" : "Please choose a residence."),
  date: (v) => {
    if (!v) return "Please choose a date.";
    if (v < dateInput.min || v > dateInput.max) return "Choose a date within the next six months.";
    if (new Date(`${v}T12:00`).getDay() === 0) return "We're closed on Sundays. Please pick another day.";
    return "";
  },
  time: (v) => (v ? "" : "Please choose a time."),
};

function validateField(el) {
  const rule = rules[el.name];
  if (!rule) return true;
  const msg = rule(el.value);
  const field = el.closest(".field");
  field.classList.toggle("has-error", !!msg);
  field.querySelector(".err").textContent = msg;
  el.setAttribute("aria-invalid", !!msg);
  return !msg;
}
form.addEventListener("blur", (e) => { if (e.target.name in rules && e.target.value) validateField(e.target); }, true);
form.addEventListener("input", (e) => { if (e.target.closest(".has-error")) validateField(e.target); });

let lastVisit = null;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let firstBad = null;
  for (const name of Object.keys(rules)) {
    const el = form.elements[name];
    if (!validateField(el) && !firstBad) firstBad = el;
  }
  const consentErr = $('[data-for="consent"]', form);
  consentErr.textContent = form.elements.consent.checked ? "" : "Please tick the box so we can contact you.";
  if (!form.elements.consent.checked && !firstBad) firstBad = form.elements.consent;
  if (firstBad) { firstBad.focus(); return; }

  const data = Object.fromEntries(new FormData(form));
  const r = RESIDENCES.find((x) => x.id === data.residence);
  data.residenceName = r ? r.name : "Any residence";
  data.sentAt = new Date().toISOString();

  const btn = form.querySelector("[type=submit]");
  btn.disabled = true; btn.textContent = "Sending…";
  if (CONFIG.formEndpoint) {
    try {
      const res = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
    } catch {
      btn.disabled = false; btn.textContent = "Request my visit";
      toast("Couldn't send right now. Please try again or call us.");
      return;
    }
  }
  const visits = store.get("azura-visits", []);
  visits.push(data);
  store.set("azura-visits", visits);
  lastVisit = data;

  const when = new Date(`${data.date}T${data.time}`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  $("#visitSummary").textContent = `${data.mode} visit to ${data.residenceName} on ${when} at ${data.time}. We'll confirm by email at ${data.email}.`;
  form.hidden = true;
  $("#visitDone").hidden = false;
  $("#visitDone").focus();
  btn.disabled = false; btn.textContent = "Request my visit";
});

$("#newVisit").addEventListener("click", () => {
  form.reset();
  $$(".has-error", form).forEach((f) => f.classList.remove("has-error"));
  form.hidden = false;
  $("#visitDone").hidden = true;
});

$("#icsBtn").addEventListener("click", () => {
  if (!lastVisit) return;
  const [y, m, d] = lastVisit.date.split("-");
  const [hh, mm] = lastVisit.time.split(":");
  const start = `${y}${m}${d}T${hh}${mm}00`;
  const endH = pad(+hh + 1);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AZURA//Visit//EN", "BEGIN:VEVENT",
    `UID:${Date.now()}@azura`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${start}`, `DTEND:${y}${m}${d}T${endH}${mm}00`,
    `SUMMARY:AZURA private visit - ${lastVisit.residenceName}`,
    `DESCRIPTION:${lastVisit.mode} visit. Contact ${CONFIG.email}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "azura-visit.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

/* ---------- newsletter ---------- */
$("#newsletter").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#nlEmail"), msg = $("#nlMsg");
  if (rules.email(input.value)) { msg.className = "err"; msg.textContent = "Please enter a valid email."; return; }
  const list = store.get("azura-newsletter", []);
  if (!list.includes(input.value.trim())) list.push(input.value.trim());
  store.set("azura-newsletter", list);
  msg.className = "err ok"; msg.textContent = "Thanks! You're on the list.";
  input.value = "";
});

/* ---------- contact details ---------- */
const emailA = $("#contactEmail"), phoneA = $("#contactPhone");
emailA.textContent = CONFIG.email; emailA.href = `mailto:${CONFIG.email}`;
phoneA.textContent = CONFIG.phone; phoneA.href = `tel:${CONFIG.phone.replace(/[^\d+]/g, "")}`;
$("#year").textContent = new Date().getFullYear();

/* ---------- go ---------- */
document.body.classList.add("is-loading");
renderCards();
updateSavedUI();
updateCalc();
updateStory();
startWorld();
