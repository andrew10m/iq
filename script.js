/* =====================================================================
   ПОДПИСЬ ПОДАРКА — поменяйте только этот блок.
   Пока в полях заготовки в квадратных скобках, на сайте их не видно.
   ===================================================================== */
const CONFIG = {
  name: "[ИМЯ]",                                     // имя брата: «Миша»
  captain: "[ТВОЁ ИМЯ]",                             // ты — капитан экспедиции: «Андрей»
  fromWho: "[ОТ КОГО, например: от старшего брата]", // подпись на обложке и в финале
  finalMessage: "[ТЕКСТ ПОСЛАНИЯ В ФИНАЛЕ]",         // например: «Собирайся: едем в Москвариум!»
  finalDate: "[ДАТА, если есть]"                     // например: «15 июня, 11:00»
};

/* ===================================================================== */

(() => {
"use strict";

/* ---------------- зоны глубины ---------------- */
const ZONES = [
  { from: 0, to: 200, name: "Солнечная зона", term: "Эпипелагиаль",
    text: "Тонкий верхний слой, куда проникает солнце. Здесь живёт большинство знакомых нам морских животных.",
    stats: [["Свет", "Хватает для водорослей"], ["Давление", "До 21 атмосферы"]] },
  { from: 200, to: 1000, name: "Сумеречная зона", term: "Мезопелагиаль",
    text: "Солнце сюда почти не доходит. Многие обитатели светятся сами: чтобы охотиться, прятаться и находить друг друга.",
    stats: [["Свет", "Меньше 1% солнечного"], ["Давление", "21–101 атмосфера"]] },
  { from: 1000, to: 4000, name: "Полночная зона", term: "Батипелагиаль",
    text: "Вечная ночь и холод в несколько градусов. Единственный свет здесь — живой.",
    stats: [["Свет", "Только живой"], ["Давление", "101–401 атмосфера"]] },
  { from: 4000, to: 10935, name: "Бездна", term: "Абиссаль и хадаль",
    text: "Давление в сотни раз больше, чем у поверхности. И всё равно здесь есть жизнь.",
    stats: [["Свет", "Только живой"], ["Давление", "Больше 400 атмосфер"]] }
];
const BOTTOM = 10935;

/* ---------------- сценарий погружения ----------------
   feature — герой на весь экран, quote — номер факта для цитаты (0, 1 или 2)
   gallery — глава с горизонтальной лентой карточек */
const STORY = [
  { type: "hero" },
  { type: "chapter", zone: 0 },
  { type: "feature", id: "bluewhale", quote: 1 },
  { type: "gallery", title: "Морские млекопитающие", lead: "Дышат воздухом и кормят детёнышей молоком, но их дом — океан.",
    ids: ["afalina", "beluga", "narwhal", "humpback", "seal", "sealion"] },
  { type: "feature", id: "orca", quote: 1 },
  { type: "gallery", title: "Акулы и скаты", lead: "Их скелет состоит из хряща, а не из кости.",
    ids: ["whaleshark", "hammerhead", "nurseshark", "sawfish", "electricray"] },
  { type: "feature", id: "greatwhite", quote: 0 },
  { type: "feature", id: "manta", quote: 1 },
  { type: "feature", id: "octopus", quote: 0 },
  { type: "gallery", title: "Коралловый риф", lead: "Рифы занимают меньше 1% дна океана, но дают дом примерно четверти всех морских видов.",
    ids: ["clownfish", "seahorse", "starfish", "mantisshrimp", "seacucumber"] },
  { type: "gallery", title: "Открытый океан и побережья", lead: "Простор, течения и солнце. Здесь живут великие странники.",
    ids: ["sunfish", "swordfish", "greenturtle", "iguana", "seasnake", "moonjelly", "lobster"] },
  { type: "chapter", zone: 1 },
  { type: "feature", id: "giantsquid", quote: 0 },
  { type: "gallery", title: "Жители сумерек", lead: "Огромные глаза, светящиеся тела и странные формы — всё, чтобы выжить в полумраке.",
    ids: ["hatchetfish", "vampiresquid", "goblinshark", "blobfish", "isopod", "spidercrab", "greenlandshark"] },
  { type: "feature", id: "coelacanth", quote: 0 },
  { type: "chapter", zone: 2 },
  { type: "feature", id: "spermwhale", quote: 0 },
  { type: "feature", id: "anglerfish", quote: 0 },
  { type: "gallery", title: "Обитатели вечной ночи", lead: "Здесь выживает тот, кто умеет ждать, светиться или проглотить добычу крупнее себя.",
    ids: ["atolla", "gulpereel", "fangtooth"] },
  { type: "chapter", zone: 3 },
  { type: "feature", id: "snailfish", quote: 0 },
  { type: "gallery", title: "На дне мира", lead: "Мягкие тела, медленная жизнь и давление, которое раздавило бы подводную лодку.",
    ids: ["dumbo", "scotoplanes", "amphipod"] },
  { type: "end" }
];

/* ---------------- помощники ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ");
const isSet = (s) => typeof s === "string" && s.trim() !== "" && !/^\[.*\]$/.test(s.trim());
const BY_ID = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));
const ORDER = STORY.flatMap((s) => (s.type === "feature" ? [s.id] : s.type === "gallery" ? s.ids : []));
ANIMALS.forEach((a) => { if (!ORDER.includes(a.id)) ORDER.push(a.id); });
const NUM = (id) => String(ORDER.indexOf(id) + 1).padStart(2, "0");
const zoneRange = (z) => `${fmt(ZONES[z].from)}–${fmt(ZONES[z].to)} м`;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- связь с игровым слоем ---------------- */
const hooks = { depth: [], drawer: [], index: [], action: [], build: [] };
const emit = (evt, ...args) => hooks[evt].forEach((fn) => { try { fn(...args); } catch (e) { console.error(e); } });
let maxZone = 3;
const visibleOrder = () => ORDER.filter((id) => BY_ID[id].zone <= maxZone);

function photoHtml(src, alt, z, label) {
  return `<figure class="ph" data-z="${z}">
    <img src="${esc(src)}" alt="${esc(alt)}" decoding="async">
    <figcaption class="ph-empty"><span class="ph-k">${esc(label || "Место для фото")}</span><code>${esc(src)}</code></figcaption>
  </figure>`;
}
function bindPhotos(root) {
  $$(".ph img", root).forEach((img) => {
    const f = img.closest(".ph");
    const ok = () => { f.classList.add("is-loaded"); f.classList.remove("is-missing"); };
    const bad = () => f.classList.add("is-missing");
    if (img.complete) { (img.naturalWidth ? ok : bad)(); return; }
    img.addEventListener("load", ok, { once: true });
    img.addEventListener("error", bad, { once: true });
  });
}
function splitWords(el) {
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w"><span class="wi">${esc(w)}</span></span>`).join(" ");
}

/* ---------------- сборка страницы ---------------- */
(function assignDepths() {
  let zone = 0;
  const groups = [[], [], [], []];
  STORY.forEach((s) => {
    if (s.type === "chapter") zone = s.zone;
    if (s.type !== "end") groups[zone].push(s);
  });
  groups.forEach((g, zi) => {
    const z = ZONES[zi];
    const flow = g.filter((s) => s.type !== "chapter" && s.type !== "hero");
    g.forEach((s) => {
      if (s.type === "chapter" || s.type === "hero") s.depth = z.from;
      else s.depth = Math.round(lerp(z.from, z.to, (flow.indexOf(s) + 1) / (flow.length + 1)));
      s.zone = zi;
    });
  });
  const end = STORY[STORY.length - 1];
  end.depth = BOTTOM; end.zone = 3;
})();

function heroHtml(s) {
  const who = isSet(CONFIG.name) ? `Для ${esc(CONFIG.name)}` : "";
  const from = isSet(CONFIG.fromWho) ? esc(CONFIG.fromWho) : "";
  const ded = who || from ? `<p class="dedication">${[who, from].filter(Boolean).join(" — ")}</p>` : "";
  return `<section class="hero" id="top" data-depth="${s.depth}">
    <div class="hero-media">${photoHtml("images/hero.jpg", "Поверхность океана снизу", "hero", "Фон обложки · поверхность океана снизу")}</div>
    <div class="hero-shade"></div>
    <div class="hero-text">
      <p class="eyebrow" data-fade>Документальное погружение · ${ANIMALS.length} видов</p>
      <h1 class="display-xl split">Погружение</h1>
      <p class="lead" data-fade>Одиннадцать километров вниз — от солнечных рифов до дна Марианской впадины.</p>
      ${ded}
    </div>
    <div class="scroll-cue"><span>Вниз</span><i></i></div>
  </section>`;
}

function chapterHtml(s) {
  const z = ZONES[s.zone];
  return `<section class="chapter" data-depth="${s.depth}" data-chapter="${s.zone}" id="zone-${s.zone}">
    <div class="chapter-inner">
      <p class="eyebrow">${z.term} · ${zoneRange(s.zone)}</p>
      <div class="chapter-num"><span>${fmt(z.from)}</span><small>м</small></div>
      <h2 class="display-m">${z.name}</h2>
      <p class="lead">${z.text}</p>
      <p class="chapter-stat">${z.stats.map(([k, v]) => `<span><b>${k}</b>${v}</span>`).join("")}</p>
    </div>
  </section>`;
}

function featureHtml(s) {
  const a = BY_ID[s.id];
  return `<section class="feature" data-depth="${s.depth}" id="sp-${a.id}" data-species="${a.id}">
    <div class="feature-media">${photoHtml(a.photo, a.name, a.zone, `Фото · ${a.name}`)}</div>
    <div class="feature-shade"></div>
    <div class="feature-text">
      <p class="eyebrow" data-fade>№ ${NUM(a.id)} · ${GROUPS[a.group]} · ${ZONES[a.zone].name}</p>
      <h2 class="display split">${esc(a.name)}</h2>
      <p class="latin" data-fade>${esc(a.latin)}</p>
      <p class="lead" data-fade>${esc(a.tagline)}</p>
      <button class="more" type="button" data-open="${a.id}" data-fade>Подробнее <span>→</span></button>
    </div>
    <div class="feature-quote">
      <p class="eyebrow">${esc(a.name)} · знаете ли вы</p>
      <p class="quote">${esc(a.facts[s.quote || 0])}</p>
      <dl class="specs-inline">
        <div><dt>Размер</dt><dd>${esc(a.size)}</dd></div>
        <div><dt>Глубина</dt><dd>${esc(a.depth)}</dd></div>
        <div><dt>Питание</dt><dd>${esc(a.food)}</dd></div>
      </dl>
      <button class="more" type="button" data-open="${a.id}">Все факты <span>→</span></button>
    </div>
  </section>`;
}

function galleryHtml(s) {
  const n = s.ids.length;
  return `<section class="gallery" data-depth="${s.depth}">
    <div class="gallery-head">
      <p class="eyebrow" data-fade>${ZONES[s.zone].name} · ${n} ${n < 5 ? "вида" : "видов"}</p>
      <h2 class="display-m split">${esc(s.title)}</h2>
      <p class="lead" data-fade>${esc(s.lead)}</p>
    </div>
    <div class="gallery-track">${s.ids.map((id) => {
      const a = BY_ID[id];
      return `<button class="card" type="button" data-open="${a.id}" data-species="${a.id}" aria-label="${esc(a.name)}: подробнее">
        <div class="card-media">${photoHtml(a.photo, a.name, a.zone, "Фото")}</div>
        <div class="card-meta"><span class="card-no">${NUM(a.id)}</span><span class="card-name">${esc(a.name)}</span><span class="card-latin">${esc(a.latin)}</span></div>
      </button>`;
    }).join("")}</div>
  </section>`;
}

function barrierHtml(z) {
  const limit = ZONES[z].to;
  return `<section class="barrier chapter" data-depth="${limit}" data-chapter="limit" id="limit">
    <div class="chapter-inner">
      <p class="eyebrow">Предел корпуса · ${fmt(limit)} м</p>
      <div class="chapter-num"><span>${fmt(limit)}</span><small>м</small></div>
      <h2 class="display-m">Дальше — нельзя</h2>
      <p class="lead">Корпус батискафа рассчитан только до ${fmt(limit)} м. Глубже его раздавит давление. Улучши корпус в журнале экспедиции.</p>
      <button class="more" type="button" data-action="sub">Открыть батискаф <span>→</span></button>
    </div>
  </section>`;
}

function endHtml(s) {
  return `<section class="end" data-depth="${s.depth}" data-chapter="end" id="bottom">
    <div class="seabed"></div>
    <div class="end-inner">
      <p class="eyebrow">Бездна Челленджера · Марианская впадина</p>
      <div class="chapter-num"><span>≈${fmt(BOTTOM)}</span><small>м</small></div>
      <h2 class="display-m">Дно мира</h2>
      <p class="lead">Самое глубокое место на Земле. Давление здесь больше тысячи атмосфер. Люди впервые опустились сюда в 1960 году.</p>
      <button class="ascend" type="button" data-action="ascend">Всплыть на поверхность <span>↑</span></button>
    </div>
  </section>`;
}

function build() {
  const parts = STORY.filter((s) => s.zone <= maxZone && (s.type !== "end" || maxZone === 3)).map((s) => ({
    hero: heroHtml, chapter: chapterHtml, feature: featureHtml, gallery: galleryHtml, end: endHtml
  }[s.type])(s));
  if (maxZone < 3) parts.push(barrierHtml(maxZone));
  $("#story").innerHTML = parts.join("");
  $$("#story .split").forEach(splitWords);
  bindPhotos($("#story"));
}

/* ---------------- цвет воды по глубине ---------------- */
const STOPS = [
  [0, [18, 112, 156]], [60, [12, 82, 124]], [200, [7, 46, 82]], [600, [5, 27, 54]],
  [1000, [3, 16, 33]], [4000, [2, 8, 18]], [BOTTOM, [1, 3, 7]]
];
function waterAt(d) {
  for (let i = 1; i < STOPS.length; i++) {
    if (d <= STOPS[i][0]) {
      const t = (d - STOPS[i - 1][0]) / (STOPS[i][0] - STOPS[i - 1][0]);
      return STOPS[i - 1][1].map((v, k) => lerp(v, STOPS[i][1][k], t));
    }
  }
  return STOPS[STOPS.length - 1][1];
}
const rgb = (c) => `rgb(${c.map((v) => Math.round(clamp(v, 0, 255))).join(",")})`;

/* ---------------- частицы: пузырьки, морской снег, живой свет ---------------- */
const Particles = (() => {
  const cv = $("#particles"), ctx = cv.getContext("2d");
  let W = 0, H = 0, DPR = 1, items = [], lastY = window.scrollY, t = 0;
  const sprite = (r, inner, outer) => {
    const c = document.createElement("canvas"); c.width = c.height = r * 2;
    const g = c.getContext("2d"), gr = g.createRadialGradient(r * .8, r * .7, 0, r, r, r);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();
    return c;
  };
  const BUB = (() => {
    const r = 32, c = document.createElement("canvas"); c.width = c.height = r * 2;
    const g = c.getContext("2d");
    g.strokeStyle = "rgba(230,248,255,.7)"; g.lineWidth = 2.5; g.beginPath(); g.arc(r, r, r - 3, 0, Math.PI * 2); g.stroke();
    const gr = g.createRadialGradient(r * .65, r * .6, 0, r, r, r);
    gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(.35, "rgba(255,255,255,.08)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fill();
    return c;
  })();
  const SNOW = sprite(8, "rgba(255,255,255,.9)", "rgba(255,255,255,0)");
  const SPARK = sprite(16, "rgba(170,250,255,1)", "rgba(80,200,255,0)");

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const k = clamp((W * H) / (1440 * 900), .45, 1.2);
    const R = Math.random;
    items = [];
    for (let i = 0; i < 46 * k; i++) items.push({ kind: 0, x: R() * W, y: R() * H, r: 1.5 + R() * R() * 7, v: 22 + R() * 50, p: R() * 6, z: .4 + R() * .9 });
    for (let i = 0; i < 160 * k; i++) items.push({ kind: 1, x: R() * W, y: R() * H, r: .6 + R() * 1.6, v: 4 + R() * 10, p: R() * 6, z: .3 + R() * 1 });
    for (let i = 0; i < 34 * k; i++) items.push({ kind: 2, x: R() * W, y: R() * H, r: 1.5 + R() * 3, v: 1 + R() * 4, p: R() * 6, z: .2 + R() * .6, s: .6 + R() * 1.6 });
  }

  function frame(dt, depth) {
    t += dt;
    const y = window.scrollY, dy = y - lastY; lastY = y;
    ctx.clearRect(0, 0, W, H);
    const aB = clamp(1 - depth / 320), aS = clamp((depth - 120) / 500) * .7, aL = clamp((depth - 650) / 700);
    for (const p of items) {
      p.y -= dy * p.z * .35;
      if (p.kind === 0) { p.y -= p.v * dt; p.x += Math.sin(t * 1.6 + p.p) * .25; }
      else if (p.kind === 1) { p.y += p.v * dt; p.x += Math.sin(t * .4 + p.p) * .12; }
      else { p.y -= p.v * dt * .3; p.x += Math.sin(t * .3 + p.p) * .1; }
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      let a, img, s;
      if (p.kind === 0) { a = aB * .85; img = BUB; s = p.r * 2; }
      else if (p.kind === 1) { a = aS * (.4 + p.z * .5); img = SNOW; s = p.r * 3; }
      else { a = aL * (.35 + .65 * Math.max(0, Math.sin(t * p.s + p.p))); img = SPARK; s = p.r * 4; }
      if (a < .01) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
  window.addEventListener("resize", resize);
  resize();
  return { frame };
})();

/* ---------------- глубиномер ---------------- */
let markers = [], ticks = [], depth = 0;
function depthAt(y) {
  if (!markers.length) return 0;
  if (y <= markers[0].st.start) return markers[0].depth;
  for (let i = 0; i < markers.length - 1; i++) {
    const a = markers[i], b = markers[i + 1];
    if (y < b.st.start) return lerp(a.depth, b.depth, clamp((y - a.st.start) / Math.max(1, b.st.start - a.st.start)));
  }
  return markers[markers.length - 1].depth;
}
function zoneName(d) {
  if (d >= BOTTOM - 5) return "Дно впадины";
  let n = ZONES[0].name;
  ZONES.forEach((z) => { if (d >= z.from) n = z.name; });
  return n;
}

let shownDepth = -1, shownZone = "", renderedY = -1;
function render(force) {
  const y = window.scrollY;
  if (y === renderedY && force !== true) return;
  renderedY = y;
  const max = ScrollTrigger.maxScroll(window) || 1;
  depth = depthAt(y);
  const c = waterAt(depth);
  const light = clamp(1 - depth / 400);
  const root = document.documentElement.style;
  root.setProperty("--water", rgb(c));
  root.setProperty("--water-hi", rgb(c.map((v) => lerp(v * 1.7, v + (255 - v) * .28, light))));
  root.setProperty("--water-lo", rgb(c.map((v) => v * .42)));
  $(".rays").style.opacity = clamp(1 - depth / 230).toFixed(3);

  const d = Math.round(depth);
  if (d !== shownDepth) {
    shownDepth = d;
    $("#navDepth").textContent = fmt(d);
    $("#gaugeNum").textContent = fmt(d);
  }
  const zn = zoneName(depth);
  if (zn !== shownZone) {
    shownZone = zn;
    $("#navZone").textContent = zn;
    $("#gaugeZone").textContent = zn;
  }
  const p = clamp(y / max);
  $("#gaugeFill").style.transform = `scaleY(${p})`;
  const dot = $("#gaugeDot");
  if (dot) dot.style.top = `${p * 100}%`;
  $("#progressFill").style.transform = `scaleX(${p})`;
  ticks.forEach((t) => t.el.classList.toggle("on", depth >= t.depth && depth < t.next));
  emit("depth", depth);
}

function buildTicks() {
  const max = ScrollTrigger.maxScroll(window) || 1;
  const box = $("#gaugeTicks");
  box.innerHTML = '<span class="gauge-dot" id="gaugeDot"></span>';
  const list = markers.filter((m) => m.el.dataset.chapter !== undefined);
  ticks = list.map((m, i) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "tick";
    el.textContent = `${m.depth === BOTTOM ? "≈" : ""}${fmt(m.depth)} м${m.el.dataset.chapter === "limit" ? " · предел" : ""}`;
    el.style.top = `${clamp(m.goTo / max) * 100}%`;
    el.addEventListener("click", () => scrollToY(m.goTo, 1.8));
    box.appendChild(el);
    return { el, depth: m.depth, next: list[i + 1] ? list[i + 1].depth : Infinity };
  });
}

function scrollToY(y, duration, onComplete) {
  gsap.to(window, { scrollTo: { y, autoKill: true }, duration, ease: "power3.inOut", onComplete });
}

/* ---------------- анимации прокрутки ---------------- */
function revealIn(scope, trigger, start = "top 75%") {
  const words = $$(".split .wi", scope);
  const fades = $$("[data-fade]", scope);
  const tl = gsap.timeline({ paused: true });
  tl.from(words, { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: .06 }, 0)
    .from(fades, { y: 26, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: .08 }, .15);
  ScrollTrigger.create({ trigger, start, onEnter: () => tl.play(), onLeaveBack: () => tl.reverse() });
  return tl;
}

let firstBuild = true;
function setupSection(sec) {
  if (sec.classList.contains("hero")) {
    if (firstBuild) {
      const tl = gsap.timeline({ delay: .2 });
      tl.from($$(".split .wi", sec), { yPercent: 115, duration: 1.6, ease: "expo.out", stagger: .05 })
        .from($$("[data-fade], .dedication, .scroll-cue", sec), { y: 24, autoAlpha: 0, duration: 1.2, ease: "power3.out", stagger: .12 }, .5)
        .from($(".hero-media", sec), { scale: 1.12, duration: 2.6, ease: "power2.out" }, 0);
    }
    gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } })
      .to($(".hero-text", sec), { yPercent: -35, autoAlpha: 0, ease: "none" }, 0)
      .to($(".scroll-cue", sec), { autoAlpha: 0, ease: "none", duration: .3 }, 0)
      .to($(".hero-media .ph", sec), { yPercent: 18, scale: 1.08, autoAlpha: .25, ease: "none" }, 0);
    return;
  }

  if (sec.classList.contains("chapter")) {
    const inner = $(".chapter-inner", sec);
    const isLimit = sec.classList.contains("barrier");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: "top top", end: isLimit ? "+=60%" : "+=110%", pin: true, scrub: .6 }
    });
    tl.from($(".chapter-num", sec), { scale: .82, autoAlpha: 0, filter: "blur(14px)", duration: 1, ease: "power2.out" })
      .from($$(".eyebrow, h2, .lead, .chapter-stat, .more", inner), { y: 40, autoAlpha: 0, stagger: .12, duration: .8 }, .25);
    if (!isLimit) tl.to({}, { duration: .8 }).to(inner, { y: -70, autoAlpha: 0, duration: .8, ease: "power1.in" });
    sec._goTo = tl.scrollTrigger;
    return;
  }

  if (sec.classList.contains("feature")) {
    revealIn(sec, sec, "top 70%");
    const media = $(".feature-media .ph", sec);
    gsap.fromTo(media, { yPercent: -10 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true }
    });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: "top top", end: "+=130%", pin: true, scrub: .6 }
    });
    tl.fromTo(media, { scale: 1.16 }, { scale: 1, ease: "none", duration: 1 }, 0)
      .to($(".feature-text", sec), { y: -60, autoAlpha: 0, duration: .25, ease: "power1.in" }, .3)
      .fromTo($(".feature-quote", sec), { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .3, ease: "power2.out" }, .45)
      .to($(".feature-shade", sec), { opacity: 1.0, duration: .3 }, .3)
      .to({}, { duration: .25 });
    gsap.set($(".feature-shade", sec), { opacity: .9 });
    return;
  }

  if (sec.classList.contains("gallery")) {
    revealIn($(".gallery-head", sec), sec, "top 70%");
    const track = $(".gallery-track", sec);
    const cards = $$(".card", sec);
    gsap.from(cards, {
      y: 70, autoAlpha: 0, duration: 1.1, ease: "power3.out", stagger: .07,
      scrollTrigger: { trigger: sec, start: "top 65%", toggleActions: "play none none reverse" }
    });
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    if (dist() > 40) {
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: .6, invalidateOnRefresh: true }
      });
    }
    return;
  }

  if (sec.classList.contains("end")) {
    gsap.from($$(".end-inner > *", sec), {
      y: 40, autoAlpha: 0, duration: 1.2, ease: "power3.out", stagger: .1,
      scrollTrigger: { trigger: sec, start: "top 60%", toggleActions: "play none none reverse" }
    });
  }
}

function setupAll() {
  markers = [];
  // маркеры глубины и анимации создаются сверху вниз — так ScrollTrigger правильно учитывает закрепления
  $$("#story > section").forEach((sec) => {
    const m = { el: sec, depth: +sec.dataset.depth, st: ScrollTrigger.create({ trigger: sec, start: "top 55%" }) };
    markers.push(m);
    setupSection(sec);
    m.pin = sec._goTo || null;
  });
}

function onRefresh() {
  markers.forEach((m) => { m.goTo = m.pin ? m.pin.start + (m.pin.end - m.pin.start) * .35 : m.st.start + window.innerHeight * .55; });
  buildTicks();
  render(true);
}

/* Пересобрать погружение под новый предел глубины (после улучшения корпуса) */
function setMaxZone(z, opts = {}) {
  z = clamp(z, 0, 3);
  if (z === maxZone && !opts.force) return;
  maxZone = z;
  ScrollTrigger.getAll().forEach((st) => st.kill());
  gsap.killTweensOf(window);
  build();
  setupAll();
  ScrollTrigger.refresh();
  if (Index.isOpen()) Index.build();
  emit("build", maxZone);
}

/* ---------------- карточка вида ---------------- */
const Drawer = (() => {
  const box = $("#drawer"), panel = $(".drawer-panel", box), dim = $(".drawer-dim", box);
  let idx = -1, open = false, tween = null, curId = null;
  const wide = () => window.matchMedia("(min-width: 900px)").matches;

  function fill(id) {
    const list = visibleOrder();
    idx = list.indexOf(id);
    curId = id;
    const a = BY_ID[id];
    const z = ZONES[a.zone];
    $("#dMedia").innerHTML = photoHtml(a.photo, a.name, a.zone, `Фото · ${a.name}`);
    bindPhotos($("#dMedia"));
    $("#dEyebrow").textContent = `№ ${NUM(a.id)} · ${GROUPS[a.group]} · ${z.name}, ${zoneRange(a.zone)}`;
    $("#dTitle").textContent = a.name;
    $("#dLatin").textContent = a.latin;
    $("#dTag").textContent = a.tagline;
    $("#dSpecs").innerHTML = [["Где живёт", a.home], ["Глубина", a.depth], ["Размер", a.size], ["Питание", a.food]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#dFacts").innerHTML = a.facts.map((f) => `<li>${esc(f)}</li>`).join("");
    const prev = BY_ID[list[(idx - 1 + list.length) % list.length]];
    const next = BY_ID[list[(idx + 1) % list.length]];
    $("#dPrev .lbl").textContent = prev.name;
    $("#dNext .lbl").textContent = next.name;
    $("#dPrev").setAttribute("aria-label", `Предыдущий вид: ${prev.name}`);
    $("#dNext").setAttribute("aria-label", `Следующий вид: ${next.name}`);
    $("#dCount").textContent = `${NUM(a.id)} / ${ORDER.length}`;
    $("#dGame").innerHTML = "";
    emit("drawer", a, $("#dGame"));
    $("#dScroll").scrollTop = 0;
  }

  function show(id) {
    if (!BY_ID[id] || BY_ID[id].zone > maxZone) return;
    if (open) { if (id !== curId) swap(() => fill(id), 1); return; }
    fill(id);
    open = true;
    box.hidden = false;
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("drawer-open");
    tween && tween.kill();
    tween = gsap.timeline()
      .fromTo(dim, { autoAlpha: 0 }, { autoAlpha: 1, duration: .45, ease: "power2.out" }, 0)
      .fromTo(panel, wide() ? { xPercent: 100 } : { yPercent: 100 }, { xPercent: 0, yPercent: 0, duration: .8, ease: "expo.out" }, 0)
      .from($$(".drawer-body > *", panel), { y: 24, autoAlpha: 0, duration: .8, ease: "power3.out", stagger: .04 }, .2);
    setTimeout(() => $(".drawer-close", panel).focus({ preventScroll: true }), 50);
  }

  function swap(doFill, dir) {
    const els = () => $$(".drawer-body > *, .drawer-media", panel);
    gsap.to(els(), {
      autoAlpha: 0, x: dir > 0 ? -24 : 24, duration: .22, ease: "power2.in",
      onComplete: () => {
        doFill();
        gsap.fromTo(els(), { autoAlpha: 0, x: dir > 0 ? 24 : -24 }, { autoAlpha: 1, x: 0, duration: .5, ease: "power3.out", stagger: .025 });
      }
    });
  }

  function step(dir) {
    const list = visibleOrder();
    const nextId = list[(idx + dir + list.length) % list.length];
    swap(() => fill(nextId), dir);
  }

  function hide() {
    if (!open) return;
    open = false;
    tween && tween.kill();
    tween = gsap.timeline({ onComplete: () => {
      box.hidden = true;
      if (!Index.isOpen()) document.documentElement.style.overflow = "";
      document.body.classList.remove("drawer-open");
    } })
      .to(panel, wide() ? { xPercent: 100 } : { yPercent: 100 }, { duration: .5, ease: "power3.in" }, 0)
      .to(dim, { autoAlpha: 0, duration: .4 }, .1);
  }

  $$("[data-close]", box).forEach((b) => b.addEventListener("click", hide));
  $("#dPrev").addEventListener("click", () => step(-1));
  $("#dNext").addEventListener("click", () => step(1));
  let sx = 0, sy = 0;
  panel.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener("touchend", (e) => {
    if (e.target.closest("textarea, input, .scan")) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (!open || e.target.closest("textarea, input")) return;
    if (e.key === "Escape") hide();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  return { show, hide, isOpen: () => open, current: () => (open ? curId : null), refresh: () => { if (open) fill(curId); } };
})();

/* ---------------- указатель видов ---------------- */
const Index = (() => {
  const box = $("#index");
  function build() {
    $("#indexList").innerHTML = ZONES.map((z, zi) => {
      const list = ORDER.map((id) => BY_ID[id]).filter((a) => a.zone === zi);
      const locked = zi > maxZone;
      return `<div class="index-zone ${locked ? "is-locked" : ""}"><h3>${z.name}<small>${zoneRange(zi)}${locked ? " · нужен корпус прочнее" : ""}</small></h3>
        <div class="index-names">${list.map((a) => locked
          ? `<button type="button" disabled>Неизвестный вид<span>${"·".repeat(3)}</span></button>`
          : `<button type="button" data-open="${a.id}" data-species="${a.id}">${esc(a.name)}<span>${esc(a.latin)}</span></button>`).join("")}</div></div>`;
    }).join("");
    $$("#indexList [data-species]").forEach((b) => emit("index", b.dataset.species, b));
  }
  function show() {
    build();
    box.hidden = false;
    document.documentElement.style.overflow = "hidden";
    gsap.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 });
    gsap.from($$(".index-head > *, .index-zone", box), { y: 30, autoAlpha: 0, duration: .8, ease: "power3.out", stagger: .05 });
  }
  function hide(keepLock) {
    gsap.to(box, { autoAlpha: 0, duration: .3, onComplete: () => { box.hidden = true; if (!keepLock && !Drawer.isOpen()) document.documentElement.style.overflow = ""; } });
  }
  $("#indexBtn").addEventListener("click", show);
  $("#indexClose").addEventListener("click", () => hide());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden && !Drawer.isOpen()) hide(); });
  return { hide, show, build, isOpen: () => !box.hidden };
})();

/* ---------------- открытый интерфейс для игры ---------------- */
window.Ocean = {
  on: (evt, fn) => { hooks[evt].push(fn); },
  ZONES, BOTTOM, ORDER, BY_ID, NUM, fmt, esc, isSet,
  get maxZone() { return maxZone; },
  get depth() { return depth; },
  setMaxZone,
  openSpecies: (id) => Drawer.show(id),
  closeSpecies: () => Drawer.hide(),
  currentSpecies: () => Drawer.current(),
  refreshSpecies: () => Drawer.refresh(),
  openIndex: () => Index.show(),
  refreshIndex: () => { if (Index.isOpen()) Index.build(); },
  scrollToY,
  ascend: (onDone) => scrollToY(0, clamp(window.scrollY / 4000, 1.6, 6), onDone),
  scrollToZone: (z) => {
    const el = $(`#zone-${z}`) || $("#limit");
    if (!el) return;
    const m = markers.find((k) => k.el === el);
    if (m) scrollToY(m.goTo, 2.4);
  },
  photoHtml, bindPhotos
};

/* ---------------- запуск ---------------- */
function boot() {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  const game = window.OceanGame;
  maxZone = game ? game.maxZone() : 3;
  build();
  setupAll();
  firstBuild = false;
  ScrollTrigger.addEventListener("refresh", onRefresh);

  document.addEventListener("click", (e) => {
    const act = e.target.closest("[data-action]");
    if (act) {
      if (act.dataset.action === "ascend") window.Ocean.ascend();
      emit("action", act.dataset.action, act);
      return;
    }
    const t = e.target.closest("[data-open]");
    if (!t) return;
    if (Index.isOpen()) Index.hide(true);
    Drawer.show(t.dataset.open);
  });
  $("#brand").addEventListener("click", (e) => { e.preventDefault(); scrollToY(0, 2.2); });

  gsap.ticker.add((time, deltaTime) => {
    render();
    if (!reduceMotion) Particles.frame(Math.min(.05, deltaTime / 1000), depth);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  if (game) game.attach(window.Ocean);
  ScrollTrigger.refresh();
}

// game.js подключается после этого файла — запускаемся, когда загружены все скрипты страницы
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else setTimeout(boot, 0);
})();
