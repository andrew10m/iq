/* =====================================================================
   НАСТРОЙКИ ПОДАРКА — поменяйте только этот блок
   ===================================================================== */
const CONFIG = {
  name: "[ИМЯ]",                                       // имя брата: «Директор Миша»
  fromWho: "[ОТ КОГО, например: от старшего брата]",   // кто дарит
  finalMessage: "[ТЕКСТ ПОЗДРАВЛЕНИЯ]",                // секретное послание на странице «Мечта»
  finalDate: "[ДАТА, если есть]",                      // например: «15 июня, 11:00». Можно оставить пустым: ""
  dreamRank: 5                                         // с какого ранга открывается «Мечта» (5 = «Директор океанариума»)
};

/* ===================================================================== */

(() => {
"use strict";

const isSet = (s) => typeof s === "string" && s.trim() !== "" && !/^\[.*\]$/.test(s.trim());
const NAME = isSet(CONFIG.name) ? CONFIG.name.trim() : "";
const DIRECTOR = NAME ? `Директор ${NAME}` : "Директор";

/* ---------------- константы игры ---------------- */
const RANKS = [
  { name: "Юнга", xp: 0 },
  { name: "Матрос", xp: 15 },
  { name: "Ныряльщик", xp: 40 },
  { name: "Исследователь", xp: 80 },
  { name: "Капитан", xp: 130 },
  { name: "Директор океанариума", xp: 200 },
  { name: "Легенда глубин", xp: 300 }
];
const GEAR = {
  bathyscaphe: { name: "Батискаф", price: 120, zone: 2 },
  deepsub: { name: "Глубоководный аппарат", price: 250, zone: 3 }
};
const POOL_MAX = 12;
const MOOD_STEP_MS = 6 * 60 * 1000;   // настроение падает на 1 каждые 6 минут
const WRONG_POOL_CAP = 60;
const DISCOVER_XP = 2;
const QUIZ = {
  len: 10,
  pearls: [0, 2, 3, 5],
  xp: [0, 1, 2, 3],
  perfectPearls: 10,
  perfectXp: 5
};
const DIFF_NAMES = ["", "Лёгкий", "Средний", "Сложный"];

const DECOR = [
  { id: "kelp",    name: "Ламинария",           price: 20, w: 46,  h: 110, x: 5 },
  { id: "amphora", name: "Древняя амфора",      price: 25, w: 40,  h: 58,  x: 22 },
  { id: "coral",   name: "Коралловый куст",     price: 30, w: 80,  h: 70,  x: 38 },
  { id: "anchor",  name: "Старый якорь",        price: 35, w: 52,  h: 70,  x: 60 },
  { id: "chest",   name: "Сундук с сокровищами", price: 45, w: 62,  h: 50,  x: 76 },
  { id: "geyser",  name: "Гейзер пузырей",      price: 50, w: 50,  h: 130, x: 92 },
  { id: "vent",    name: "Чёрный курильщик",    price: 70, w: 56,  h: 110, x: 14 },
  { id: "wreck",   name: "Затонувший корабль",  price: 90, w: 150, h: 90,  x: 50 }
];

const DECOR_SVG = {
  kelp: '<svg viewBox="0 0 50 120"><g class="sway"><path d="M18,120 C8,95 28,78 16,52 C8,32 22,18 18,2" stroke="#2f9e44" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M32,120 C40,100 26,84 36,62 C42,48 32,34 36,20" stroke="#40c057" stroke-width="7" fill="none" stroke-linecap="round"/></g></svg>',
  amphora: '<svg viewBox="0 0 40 60"><path d="M14,4 h12 v6 c8,4 12,14 12,24 c0,12 -8,22 -18,24 c-10,-2 -18,-12 -18,-24 c0,-10 4,-20 12,-24 Z" fill="#c4683a" stroke="#7a3a1c" stroke-width="2"/><path d="M6,30 h28 M8,38 h24" stroke="#f0c08a" stroke-width="2.5"/><path d="M14,10 c-8,0 -10,8 -6,12 M26,10 c8,0 10,8 6,12" stroke="#7a3a1c" stroke-width="2.5" fill="none"/></svg>',
  coral: '<svg viewBox="0 0 80 70"><g stroke-linecap="round" fill="none"><path d="M40,70 V40 M40,48 L24,30 L22,12 M24,30 L10,22 M40,40 L54,24 L52,6 M54,24 L68,18 M40,56 L60,46 L70,34" stroke="#ff6f91" stroke-width="7"/><path d="M22,12 v-2 M52,6 v-2 M10,22 h-2 M68,18 h2 M70,34 h2" stroke="#ffd1dc" stroke-width="7"/></g></svg>',
  anchor: '<svg viewBox="0 0 52 70"><g fill="none" stroke="#6b7785" stroke-width="5" stroke-linecap="round"><circle cx="26" cy="8" r="5"/><path d="M26,13 V64 M14,24 H38 M6,46 C8,60 18,64 26,64 C34,64 44,60 46,46"/></g><path d="M2,48 l6,-8 l4,9 Z M50,48 l-6,-8 l-4,9 Z" fill="#6b7785"/></svg>',
  chest: '<svg viewBox="0 0 62 50"><rect x="4" y="22" width="54" height="26" rx="4" fill="#8a5a2b" stroke="#4e3013" stroke-width="2"/><path d="M4,22 C4,8 58,8 58,22 Z" fill="#a06a34" stroke="#4e3013" stroke-width="2" transform="rotate(-12 4 22)"/><rect x="26" y="26" width="10" height="10" rx="2" fill="#ffd166"/><path d="M4,34 H58" stroke="#ffd166" stroke-width="3"/><g class="twinkle"><circle cx="20" cy="18" r="4" fill="#ffe28a"/><circle cx="34" cy="14" r="3" fill="#fff6c9"/><circle cx="44" cy="19" r="3.5" fill="#ffd166"/></g></svg>',
  geyser: '<svg viewBox="0 0 50 130"><g class="rise-bubbles" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"><circle cx="24" cy="100" r="4"/><circle cx="28" cy="70" r="3"/><circle cx="22" cy="40" r="5"/><circle cx="27" cy="12" r="3.5"/></g><path d="M2,130 C4,112 12,106 18,110 C22,100 32,100 34,110 C40,104 48,114 48,130 Z" fill="#5a5f6a" stroke="#3a3e46" stroke-width="2"/></svg>',
  vent: '<svg viewBox="0 0 56 110"><g class="smoke" fill="#1a1a22" opacity=".75"><circle cx="28" cy="34" r="10"/><circle cx="34" cy="20" r="12"/><circle cx="24" cy="8" r="9"/></g><path d="M16,110 L20,46 C22,40 34,40 36,46 L42,110 Z" fill="#2b2730" stroke="#141218" stroke-width="2"/><path d="M22,70 l6,-4 M30,86 l6,-3 M20,96 l8,2" stroke="#ff7a3a" stroke-width="2" opacity=".7"/><ellipse cx="28" cy="44" rx="8" ry="3" fill="#ff8a3a" opacity=".55"/></svg>',
  wreck: '<svg viewBox="0 0 150 90"><path d="M8,58 C30,66 110,72 142,52 L132,86 C100,92 40,90 18,84 Z" fill="#5b3a22" stroke="#2e1d10" stroke-width="2"/><path d="M20,64 L130,62 M24,74 L126,72" stroke="#2e1d10" stroke-width="2" opacity=".6"/><path d="M70,62 L84,6" stroke="#4a2f1b" stroke-width="5" stroke-linecap="round"/><path d="M84,10 L112,30 L80,40 Z" fill="#d8cdb2" opacity=".55"/><circle cx="46" cy="72" r="4" fill="#1a120a"/><circle cx="66" cy="74" r="4" fill="#1a120a"/><circle cx="86" cy="74" r="4" fill="#1a120a"/></svg>'
};

/* ---------------- сохранение ---------------- */
const KEY = "okeanarium-save-v1";
const fresh = () => ({
  v: 1, introSeen: false, pearls: 50, xp: 0,
  found: {}, pets: [], uid: 1,
  decor: { warm: [], cold: [], reef: [], deep: [] },
  gear: { bathyscaphe: false, deepsub: false },
  sound: true, best: {}, dreamSeen: false, dreamAnnounced: false,
  pool: "warm", diff: 1
});
let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw), f = fresh();
      return Object.assign(f, d, {
        decor: Object.assign(f.decor, d.decor || {}),
        gear: Object.assign(f.gear, d.gear || {})
      });
    }
  } catch (e) { /* хранилище недоступно — играем без сохранения */ }
  return fresh();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ничего страшного */ }
}

/* ---------------- помощники ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const BY_ID = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pearlIco = '<span class="pearl"></span>';
const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
const pearlsWord = (n) => `${n} ${plural(n, "жемчужина", "жемчужины", "жемчужин")}`;
const fmtDepth = (m) => Math.round(m).toLocaleString("ru-RU");
const foundCount = () => ANIMALS.filter((a) => S.found[a.id]).length;
const rankIndex = (xp = S.xp) => { let r = 0; RANKS.forEach((k, i) => { if (xp >= k.xp) r = i; }); return r; };
const zoneLocked = (z) => (z === 2 && !S.gear.bathyscaphe) || (z === 3 && !S.gear.deepsub);
const petOf = (id) => S.pets.find((p) => p.id === id);

/* ---------------- звук (Web Audio, без файлов) ---------------- */
const Sound = (() => {
  let ctx = null, master = null, amb = null, dropTimer = null;
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    if (S.sound) startAmbient();
  }
  function tone(freq, dur, { type = "sine", vol = 0.18, when = 0, to = null } = {}) {
    if (!ctx || !S.sound) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function startAmbient() {
    if (!ctx || amb) return;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
    const g = ctx.createGain(); g.gain.value = 0.05;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.08; lfoG.gain.value = 0.025;
    lfo.connect(lfoG).connect(g.gain);
    src.connect(lp).connect(g).connect(master);
    src.start(); lfo.start();
    amb = { src, lfo, g };
    const notes = [392, 440, 523.25, 587.33, 659.25, 783.99];
    const drop = () => {
      if (S.sound) { tone(pick(notes), 1.8, { vol: 0.035 }); tone(pick(notes) / 2, 2.4, { vol: 0.02, when: 0.3 }); }
      dropTimer = setTimeout(drop, rnd(2600, 5200));
    };
    dropTimer = setTimeout(drop, 1500);
  }
  function stopAmbient() {
    if (!amb) return;
    try { amb.src.stop(); amb.lfo.stop(); } catch (e) { /* уже остановлен */ }
    amb = null; clearTimeout(dropTimer);
  }
  return {
    init,
    set(on) { S.sound = on; save(); if (on) { init(); startAmbient(); } else stopAmbient(); },
    blub() { tone(260, 0.16, { to: 720, vol: 0.16 }); tone(420, 0.12, { to: 980, vol: 0.08, when: 0.08 }); },
    ding() { tone(1318.5, 0.5, { vol: 0.12 }); tone(1975.5, 0.7, { vol: 0.08, when: 0.08 }); },
    click() { tone(660, 0.06, { type: "triangle", vol: 0.06 }); },
    good() { tone(784, 0.14, { type: "triangle", vol: 0.12 }); tone(1046.5, 0.25, { type: "triangle", vol: 0.12, when: 0.1 }); },
    bad() { tone(196, 0.25, { type: "square", vol: 0.05, to: 130 }); },
    fanfare() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.45, { type: "triangle", vol: 0.1, when: i * 0.12 })); }
  };
})();

/* ---------------- уведомления ---------------- */
function toast(html, cls = "") {
  const el = document.createElement("div");
  el.className = "toast " + cls;
  el.innerHTML = html;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

function bumpStats() {
  $$(".stat-pearl").forEach((el) => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
}

function addPearls(n) {
  S.pearls = Math.max(0, S.pearls + n);
  save();
  updateCounters();
  if (n > 0) bumpStats();
}

function addXp(n) {
  const before = rankIndex();
  S.xp += n;
  save();
  const after = rankIndex();
  updateCounters();
  if (after > before) {
    Sound.fanfare();
    const lines = [`${DIRECTOR}, поздравляю! Новый ранг: «${RANKS[after].name}».`];
    if (after >= CONFIG.dreamRank && !S.dreamAnnounced) {
      S.dreamAnnounced = true; save();
      lines.push("И ещё... Пришло секретное письмо с пометкой «Только для директора».");
      lines.push("Оно ждёт вас на главном экране. Я не подглядывал. Почти.");
    } else if (after < RANKS.length - 1) {
      lines.push(`До ранга «${RANKS[after + 1].name}» — ${RANKS[after + 1].xp - S.xp} опыта.`);
    }
    setTimeout(() => dialog(lines), 400);
  }
}

function updateCounters() {
  $$(".js-pearls").forEach((el) => { el.textContent = S.pearls; });
  const st = $("#statPearls"); if (st) st.textContent = S.pearls;
  const sf = $("#statFound"); if (sf) sf.textContent = `${foundCount()}/${ANIMALS.length}`;
  const r = rankIndex();
  $("#rankName").textContent = RANKS[r].name;
  const next = RANKS[r + 1];
  $("#rankFill").style.width = next ? `${((S.xp - RANKS[r].xp) / (next.xp - RANKS[r].xp)) * 100}%` : "100%";
}

/* ---------------- диалог маскота ---------------- */
let dialogQueue = [], dialogDone = null;
function dialog(lines, done) {
  dialogQueue = lines.slice();
  dialogDone = done || null;
  $("#dialogWrap").hidden = false;
  nextLine();
}
function nextLine() {
  if (!dialogQueue.length) {
    $("#dialogWrap").hidden = true;
    const d = dialogDone; dialogDone = null;
    if (d) d();
    return;
  }
  $("#dialogText").textContent = dialogQueue.shift();
  $("#dialogNext").textContent = dialogQueue.length ? "Дальше" : "Понятно!";
  Sound.blub();
}

/* ---------------- экраны ---------------- */
let current = "intro";
function go(name, opts = {}) {
  if (name === "dream" && rankIndex() < CONFIG.dreamRank) name = "hub";
  if (current === "aquarium" && name !== "aquarium") Aqua.stop();
  $$(".screen").forEach((s) => s.classList.toggle("is-active", s.id === name));
  current = name;
  if (!opts.noHistory && name !== "intro") {
    try { history.pushState({ screen: name }, ""); } catch (e) { /* file:// в некоторых браузерах */ }
  }
  ({
    hub: renderHub,
    dive: Dive.render,
    aquarium: () => Aqua.render(opts.pool),
    encyclopedia: Book.render,
    quiz: Quiz.menu,
    dream: renderDream
  }[name] || (() => {}))();
}
window.addEventListener("popstate", (e) => {
  closeSheet();
  const target = e.state && e.state.screen ? e.state.screen : (current === "hub" ? "hub" : "hub");
  if (current !== "intro") go(target, { noHistory: true });
});

/* ---------------- заставка ---------------- */
function renderIntro() {
  $("#introTitle").textContent = `${DIRECTOR}, океанариум ждёт вас`;
  $("#introFrom").textContent = isSet(CONFIG.fromWho) ? `Подарок ${CONFIG.fromWho}` : "";
}
function enter() {
  Sound.init();
  Sound.blub();
  go("hub");
  if (!S.introSeen) {
    S.introSeen = true; save();
    setTimeout(() => dialog([
      `${DIRECTOR}! Наконец-то вы здесь. Я Октавий, ваш заместитель по науке.`,
      "Докладываю: бассейны пусты, а посетители уже спрашивают про акул.",
      "Нам нужны новые обитатели! Ныряйте в «Погружение» и открывайте виды. За каждый новый вид — жемчужины.",
      "На жемчужины мы поселим животных в океанариум. А на «Экзамене аса» вы докажете, что разбираетесь в океане лучше всех.",
      "Для начала выделяю 50 жемчужин из бюджета. Удачи, директор!"
    ]), 350);
  }
}

/* ---------------- хаб ---------------- */
const TIPS = [
  "«Экзамен аса» — лучший способ заработать жемчужины. И уважение коллектива.",
  "Если животное грустит, покормите его. С заместителями тоже работает.",
  "Глубже 1000 метров без батискафа не пущу. Техника безопасности.",
  "В «родном» бассейне животным лучше. В чужом настроение не поднимется выше 60.",
  "Факт дня: у меня три сердца. Поэтому я так люблю свою работу.",
  "Не «касатка», а «косатка». Я проверил. Касатка — это птица.",
  "В энциклопедии видно, кого вы ещё не нашли. Силуэты подскажут.",
  "Украшения для бассейнов продаются прямо в океанариуме. Сундук особенно хорош.",
  "Нажмите на меня ещё раз — у меня много советов."
];
let tipIdx = 0;
function smartTip() {
  const hungry = S.pets.find((p) => moodOf(p) < 40);
  const found = foundCount();
  if (found === 0) return `${DIRECTOR}, начнём с «Погружения». Там ждут первые виды.`;
  if (hungry) return `${DIRECTOR}, ${petLabel(hungry)} проголодался. Загляните в «Мой океанариум».`;
  if (!S.pets.length) return "Открытые виды уже есть. Пора поселить кого-нибудь в океанариум!";
  if (!S.gear.bathyscaphe && S.pearls >= GEAR.bathyscaphe.price) return "Нам хватает жемчужин на батискаф! Он ждёт вас на глубине 1000 м.";
  if (S.gear.bathyscaphe && !S.gear.deepsub && S.pearls >= GEAR.deepsub.price) return "Жемчужин хватает на глубоководный аппарат. Бездна ждёт!";
  if (rankIndex() >= CONFIG.dreamRank && !S.dreamSeen) return "Директор, секретное письмо всё ещё не открыто. Оно внизу экрана.";
  return null;
}
function sayTip(next) {
  const smart = next ? null : smartTip();
  const text = smart || TIPS[tipIdx++ % TIPS.length];
  $("#hubSay").textContent = text;
}
function renderHub() {
  updateCounters();
  const n = S.pets.length;
  $("#tileAquaSub").textContent = n ? `${n} ${plural(n, "житель", "жителя", "жителей")}` : "Бассейны пока пусты";
  $("#tileBookSub").textContent = `Открыто ${foundCount()} из ${ANIMALS.length}`;
  const dt = $("#dreamTile");
  if (rankIndex() >= CONFIG.dreamRank) {
    dt.className = "dream-tile is-open";
    dt.innerHTML = '<span class="lock">✉️</span><span>Секретное письмо для директора. Открыть!</span>';
  } else {
    dt.className = "dream-tile";
    dt.innerHTML = `<span class="lock">🔒</span><span>Секретная страница. Откроется на ранге «${RANKS[CONFIG.dreamRank].name}»</span>`;
  }
  sayTip(false);
}

/* ---------------- окно-шторка ---------------- */
function openSheet(html) {
  $("#sheetBody").innerHTML = html;
  $("#sheetWrap").hidden = false;
  $("#sheet").scrollTop = 0;
}
function closeSheet() { $("#sheetWrap").hidden = true; $("#sheetBody").innerHTML = ""; }

/* ---------------- открытие вида ---------------- */
function discover(id) {
  if (S.found[id]) return false;
  const a = BY_ID[id];
  S.found[id] = true;
  const reward = RARITY[a.rarity].pearls;
  save();
  Sound.ding();
  toast(`<img src="${a.img}" alt=""><span><span class="t-big">Новый вид открыт!</span><span class="t-small">${esc(a.name)} · +${reward} жемчужин</span></span>`, "gold");
  addPearls(reward);
  addXp(DISCOVER_XP);
  return true;
}

/* ---------------- карточка животного ---------------- */
function openCard(id) {
  const a = BY_ID[id];
  const rar = RARITY[a.rarity];
  const zone = ZONES[a.zone];
  const html = `
    <div class="card-hero z${a.zone} ${a.glow ? "glow" : ""}"><img src="${a.img}" alt="${esc(a.name)}"></div>
    <h3 class="card-title">${esc(a.name)}</h3>
    <p class="card-latin">${esc(a.latin)}</p>
    <div class="badges">
      <span class="badge ${a.rarity}">${rar.name}</span>
      <span class="badge">${GROUPS[a.group]}</span>
      <span class="badge">${zone.from}–${zone.to === 10900 ? "11 000" : zone.to} м</span>
    </div>
    <p class="card-tag">${esc(a.tagline)}</p>
    <div class="stats">
      <div><span class="ic">🌍</span><span><b>Где живёт</b>${esc(HOMES[a.home])}</span></div>
      <div><span class="ic">↓</span><span><b>Глубина</b>${esc(a.depth)}</span></div>
      <div><span class="ic">📏</span><span><b>Размер</b>${esc(a.size)}</span></div>
      <div><span class="ic">🍽</span><span><b>Чем питается</b>${esc(a.food)}</span></div>
    </div>
    <div class="facts"><h4>Знаете ли вы?</h4><ol>${a.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ol></div>
    <div class="card-actions" id="cardActions"></div>`;
  openSheet(html);
  renderCardActions(a);
}

function renderCardActions(a) {
  const box = $("#cardActions");
  if (!box) return;
  const pet = petOf(a.id);
  const price = RARITY[a.rarity].price;
  if (pet) {
    box.innerHTML = `<p class="note">Живёт в бассейне «${POOLS[pet.pool].name}».</p>
      <button class="btn btn-turq" data-act="visit">Навестить</button>`;
    box.querySelector("[data-act=visit]").onclick = () => { closeSheet(); go("aquarium", { pool: pet.pool }); };
    return;
  }
  const can = S.pearls >= price;
  box.innerHTML = `<button class="btn btn-coral" data-act="add" ${can ? "" : "disabled"}>Добавить в океанариум · ${price} ${pearlIco}</button>
    ${can ? "" : `<p class="note">Не хватает ${pearlsWord(price - S.pearls)}. Их дают за новые виды и за «Экзамен аса».</p>`}`;
  const btn = box.querySelector("[data-act=add]");
  if (btn) btn.onclick = () => choosePool(a, box);
}

function choosePool(a, box, moving = null) {
  const title = moving ? `Куда переселить: ${esc(petLabel(moving))}?` : "В какой бассейн?";
  box.innerHTML = `<p class="note" style="font-weight:800;color:#fff;font-size:16px">${title}</p>
    <div class="pool-pick">${Object.keys(POOLS).map((k) => {
      const n = S.pets.filter((p) => p.pool === k).length;
      const best = k === a.pool;
      return `<button data-pool="${k}" class="${best ? "best" : ""}" ${n >= POOL_MAX ? "disabled" : ""}>
        ${best ? "★ " : ""}${POOLS[k].name}<small>${best ? "Идеально для этого вида" : `${n}/${POOL_MAX} мест`}</small></button>`;
    }).join("")}</div>`;
  $$("[data-pool]", box).forEach((b) => {
    b.onclick = () => {
      const pool = b.dataset.pool;
      if (moving) {
        moving.pool = pool; save(); Sound.blub(); closeSheet();
        toast(`${esc(petLabel(moving))} переехал в «${POOLS[pool].name}»`);
        Aqua.render(pool);
        return;
      }
      const price = RARITY[a.rarity].price;
      if (S.pearls < price) return;
      addPearls(-price);
      const pet = { uid: S.uid++, id: a.id, pool, name: "", mood: 85, t: Date.now() };
      S.pets.push(pet);
      save();
      Sound.ding();
      toast(`<img src="${a.img}" alt=""><span><span class="t-big">${esc(a.name)} в океанариуме!</span><span class="t-small">Бассейн «${POOLS[pool].name}»</span></span>`);
      if (pool !== a.pool) setTimeout(() => toast(`Октавий: «Ему было бы лучше в «${POOLS[a.pool].name}». Но решать вам.»`), 700);
      renderCardActions(a);
      if (current === "encyclopedia") Book.render();
    };
  });
}

/* =====================================================================
   ПОГРУЖЕНИЕ
   ===================================================================== */
const Dive = (() => {
  const STOPS = [
    [0, [60, 198, 224]], [60, [26, 143, 196]], [200, [11, 79, 134]], [600, [7, 42, 90]],
    [1000, [4, 26, 58]], [4000, [2, 10, 26]], [10900, [0, 2, 6]]
  ];
  let built = false, zoneEls = [], ticking = false;

  function colorAt(d) {
    for (let i = 1; i < STOPS.length; i++) {
      if (d <= STOPS[i][0]) {
        const [d0, c0] = STOPS[i - 1], [d1, c1] = STOPS[i];
        const t = (d - d0) / (d1 - d0);
        return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * t)).join(",")})`;
      }
    }
    return "rgb(0,2,6)";
  }

  function spotWidth(a) {
    return Math.round(Math.min(window.innerWidth * 0.86, 80 + 64 * Math.log10(1 + a.sizeNum * 10)));
  }

  function spotHtml(a, i) {
    const f = S.found[a.id];
    const off = ((i * 37) % 5) * 10 - 20;
    return `<button class="spot ${f ? "found" : "new"} ${a.glow ? "glow" : ""}" data-id="${a.id}" style="width:${spotWidth(a)}px;margin-top:${off}px">
      <img src="${a.img}" alt="${f ? esc(a.name) : "Неизвестный вид"}" loading="lazy" style="animation-delay:-${(i % 7) * 0.7}s">
      <span class="spot-label">${f ? esc(a.name) : "Новый вид?"}</span></button>`;
  }

  function lockHtml(z) {
    const g = z === 2 ? "bathyscaphe" : "deepsub";
    const gear = GEAR[g];
    const needPrev = z === 3 && !S.gear.bathyscaphe;
    const sil = ANIMALS.filter((a) => a.zone === z).slice(0, 3).map((a) => `<img src="${a.img}" alt="">`).join("");
    if (needPrev) {
      return `<div class="zone-lock"><div class="lock-ico">🔒</div><h4>Бездна закрыта</h4><p>Сначала постройте батискаф для глубины 1000 м.</p><div class="silhouettes">${sil}</div></div>`;
    }
    const can = S.pearls >= gear.price;
    return `<div class="zone-lock"><div class="lock-ico">${z === 2 ? "🛟" : "🚀"}</div>
      <h4>Дальше без ${z === 2 ? "батискафа" : "глубоководного аппарата"} не пройти</h4>
      <p>${z === 2 ? "Давление растёт, света нет. Нужен прочный батискаф." : "Здесь давление в сотни раз больше, чем у поверхности. Нужна особая техника."}</p>
      <div class="silhouettes">${sil}</div>
      <button class="btn btn-coral" data-buy="${g}" ${can ? "" : "disabled"}>Построить: ${gear.name} · ${gear.price} ${pearlIco}</button>
      ${can ? "" : `<p class="note" style="margin-top:8px">Не хватает ${pearlsWord(gear.price - S.pearls)}. Заработайте их за новые виды или на «Экзамене аса».</p>`}
    </div>`;
  }

  function build() {
    const box = $("#diveZones");
    box.innerHTML = ZONES.map((z, zi) => {
      const list = ANIMALS.filter((a) => a.zone === zi);
      const locked = zoneLocked(zi);
      return `<section class="zone" data-zone="${zi}">
        <div class="zone-head"><span class="zone-depth">${fmtDepth(z.from)} – ${zi === 3 ? "≈ 11 000" : fmtDepth(z.to)} м</span>
          <h3>${z.name}</h3><p>${z.text}</p></div>
        ${locked ? lockHtml(zi) : `<div class="zone-field">${list.map(spotHtml).join("")}</div>`}
      </section>`;
    }).join("");
    const allOpen = !zoneLocked(2) && !zoneLocked(3);
    $("#diveBottom").innerHTML = allOpen
      ? `<div class="seabed"></div><h3>Дно Марианской впадины · ≈ 10 900 м</h3><p>Глубже на Земле некуда. Вы — в самой глубокой точке океана.</p>
         <button class="btn btn-turq" id="surfaceBtn">Всплыть</button>`
      : "";
    zoneEls = $$(".zone", box);
    built = true;
    $$(".spot", box).forEach((b) => { b.onclick = () => onSpot(b); });
    $$("[data-buy]", box).forEach((b) => { b.onclick = () => buyGear(b.dataset.buy); });
    const sb = $("#surfaceBtn");
    if (sb) sb.onclick = () => $("#diveScroll").scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSpot(btn) {
    const id = btn.dataset.id;
    Sound.blub();
    const isNew = discover(id);
    if (isNew) {
      btn.classList.remove("new"); btn.classList.add("found");
      btn.querySelector(".spot-label").textContent = BY_ID[id].name;
    }
    openCard(id);
  }

  function buyGear(g) {
    const gear = GEAR[g];
    if (S.pearls < gear.price) return;
    addPearls(-gear.price);
    S.gear[g] = true; save();
    Sound.fanfare();
    const y = $("#diveScroll").scrollTop;
    build();
    $("#diveScroll").scrollTop = y;
    dialog([
      g === "bathyscaphe"
        ? "Батискаф готов! Полночная зона открыта. Там темно, так что смотрите на огоньки."
        : "Глубоководный аппарат готов! Ныряем в бездну — до самого дна Марианской впадины."
    ]);
  }

  function update() {
    ticking = false;
    const sc = $("#diveScroll");
    const center = sc.scrollTop + sc.clientHeight * 0.45;
    let depth = 0, zname = ZONES[0].name;
    for (let i = 0; i < zoneEls.length; i++) {
      const el = zoneEls[i], top = el.offsetTop, h = el.offsetHeight, z = ZONES[i];
      if (center < top) break;
      zname = z.name;
      if (zoneLocked(i)) { depth = z.from; break; }
      depth = z.from + clamp((center - top) / h, 0, 1) * (z.to - z.from);
    }
    $("#depthNum").textContent = fmtDepth(depth);
    $("#depthZone").textContent = zname;
    $("#diveBg").style.backgroundColor = colorAt(depth);
    $("#diveRays").style.opacity = clamp(1 - depth / 180, 0, 1);
    $("#diveSnow").style.opacity = clamp((depth - 150) / 700, 0, 0.85);
  }

  function render() {
    build();
    update();
  }

  function init() {
    $("#diveScroll").addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", () => { if (current === "dive" && built) update(); });
  }

  return { render, init };
})();

/* =====================================================================
   МОЙ ОКЕАНАРИУМ
   ===================================================================== */
function moodOf(p) {
  const a = BY_ID[p.id];
  const cap = p.pool === a.pool ? 100 : WRONG_POOL_CAP;
  const dec = Math.floor((Date.now() - p.t) / MOOD_STEP_MS);
  return clamp(Math.round(p.mood - dec), 5, cap);
}
function petLabel(p) { return p.name || BY_ID[p.id].name; }
const POP_LINES = {
  dash: ["Вжух!", "Не догоните!", "Ой!"],
  flip: ["Хоп!", "Кульбит!", "Аплодисменты!"],
  color: ["Новый цвет!", "Маскировка!", "Я невидимка?"],
  flap: ["Взмах!", "Лечу!", "Плюх!"],
  pulse: ["Пульс!", "Блик!", "Бульк."],
  shy: ["Ой…", "Стесняюсь", "Бульк"],
  spark: ["Бзз!", "Искра!", "Вспышка!"]
};

const Aqua = (() => {
  let pool = "warm", sims = [], raf = 0, last = 0, W = 0, H = 0, selected = null;

  function size(a) {
    const scale = clamp(W / 700, 0.62, 1.1);
    const w = Math.round((50 + 50 * Math.log10(1 + a.sizeNum * 10)) * scale);
    return { w, h: Math.round(w * 2 / 3) };
  }

  function measure() {
    const el = $("#pool");
    W = el.clientWidth; H = el.clientHeight;
  }

  function newTarget(s) {
    const pad = 6;
    const minY = 26, maxY = H - s.h - 30;
    if (s.move === "crawl") { s.tx = rnd(pad, W - s.w - pad); s.ty = H - s.h - 10; }
    else if (s.move === "drift") { s.tx = rnd(pad, W - s.w - pad); s.ty = rnd(minY, Math.max(minY, H * 0.55)); }
    else if (s.move === "hover") { s.tx = clamp(s.x + rnd(-80, 80), pad, W - s.w - pad); s.ty = clamp(s.y + rnd(-50, 50), minY, Math.max(minY, maxY)); }
    else { s.tx = rnd(pad, Math.max(pad, W - s.w - pad)); s.ty = rnd(minY, Math.max(minY, maxY)); }
    s.wait = s.move === "crawl" || s.move === "hover" ? rnd(0.5, 3) : 0;
  }

  function render(p) {
    if (p) pool = p; else pool = S.pool || "warm";
    S.pool = pool; save();
    selected = null;
    renderTabs();
    const el = $("#pool");
    el.className = "pool " + pool;
    renderDecor();
    measure();
    buildPets();
    renderTools();
    start();
  }

  function renderTabs() {
    $("#poolTabs").innerHTML = Object.keys(POOLS).map((k) => {
      const n = S.pets.filter((x) => x.pool === k).length;
      return `<button class="pool-tab ${k === pool ? "is-on" : ""}" data-tab="${k}" role="tab">${POOLS[k].name} <small>${n}</small></button>`;
    }).join("");
    $$("[data-tab]").forEach((b) => { b.onclick = () => { Sound.click(); render(b.dataset.tab); }; });
  }

  function renderDecor() {
    $("#poolDecor").innerHTML = (S.decor[pool] || []).map((id) => {
      const d = DECOR.find((x) => x.id === id);
      if (!d) return "";
      return `<div style="position:absolute;bottom:0;left:calc(${d.x}% - ${d.w / 2}px);width:${d.w}px;height:${d.h}px">${DECOR_SVG[id].replace("<svg ", `<svg width="${d.w}" height="${d.h}" `)}</div>`;
    }).join("");
  }

  function buildPets() {
    const box = $("#poolFish");
    box.innerHTML = "";
    sims = [];
    const list = S.pets.filter((p) => p.pool === pool);
    $("#poolEmpty").innerHTML = list.length ? "" :
      `<img src="images/mascot.svg" alt=""><span>Бассейн «${POOLS[pool].name}» пуст.</span>
       <span style="font-size:15px;font-weight:700">Откройте животных в «Погружении» и добавьте их сюда из карточки.</span>
       <button class="btn btn-coral" id="emptyDive">Нырнуть</button>`;
    const ed = $("#emptyDive"); if (ed) ed.onclick = () => go("dive");
    list.forEach((p) => {
      const a = BY_ID[p.id];
      const { w, h } = size(a);
      const el = document.createElement("button");
      el.className = "pet" + (a.glow ? " glow" : "");
      el.style.width = w + "px";
      el.setAttribute("aria-label", petLabel(p));
      el.innerHTML = `<span class="pet-mood"></span><div class="flip"><img src="${a.img}" alt=""></div><span class="pet-name"${p.name ? "" : " hidden"}>${esc(p.name)}</span>`;
      box.appendChild(el);
      const s = { p, a, el, flip: el.querySelector(".flip"), img: el.querySelector("img"), w, h, move: a.move,
        x: rnd(0, Math.max(0, W - w)), y: a.move === "crawl" ? H - h - 10 : rnd(26, Math.max(26, H - h - 40)),
        tx: 0, ty: 0, wait: 0, dir: -1, boost: 0, hue: 0, phase: rnd(0, 6) };
      s.speed = a.move === "crawl" ? 14 : a.move === "drift" ? 12 : a.move === "hover" ? 16 : a.move === "glide" ? 30 : 42 - Math.min(20, w / 10);
      newTarget(s);
      el.onclick = (e) => { e.stopPropagation(); tap(s); };
      sims.push(s);
      updateMoodBadge(s);
    });
  }

  function updateMoodBadge(s) {
    const m = moodOf(s.p);
    s.el.classList.toggle("hungry", m < 40);
    s.el.querySelector(".pet-mood").textContent = m < 40 ? "🍽" : "";
  }

  function step(t) {
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    for (const s of sims) {
      if (s.wait > 0) { s.wait -= dt; }
      else {
        const dx = s.tx - s.x, dy = s.ty - s.y, dist = Math.hypot(dx, dy);
        const sp = s.speed * (s.boost > 0 ? 4 : 1);
        if (dist < 4) newTarget(s);
        else {
          s.x += (dx / dist) * sp * dt;
          s.y += (dy / dist) * sp * dt * (s.move === "swim" || s.move === "glide" ? 0.6 : 1);
          if (Math.abs(dx) > 2) s.dir = dx > 0 ? 1 : -1;
        }
      }
      if (s.boost > 0) s.boost -= dt;
      s.phase += dt;
      const bob = s.move === "crawl" ? 0 : Math.sin(s.phase * (s.move === "drift" ? 1.2 : 2)) * (s.move === "drift" ? 6 : 3);
      s.el.style.transform = `translate(${s.x.toFixed(1)}px, ${(s.y + bob).toFixed(1)}px)`;
      const facesRight = s.a.faces === "right";
      const flip = (s.dir > 0) !== facesRight ? -1 : 1;
      if (s.move !== "drift" && s.flipVal !== flip) { s.flip.style.transform = `scaleX(${flip})`; s.flipVal = flip; }
    }
  }

  function start() {
    cancelAnimationFrame(raf);
    last = 0;
    if (sims.length) raf = requestAnimationFrame(step);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function pop(s, text) {
    const el = document.createElement("div");
    el.className = "pop";
    el.textContent = text;
    el.style.left = (s.x + s.w / 2) + "px";
    el.style.top = Math.max(0, s.y - 10) + "px";
    $("#pool").appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  function tap(s) {
    const r = s.a.react;
    Sound.blub();
    s.el.classList.remove("react-flap", "react-pulse", "react-flip", "react-shy", "react-spark");
    void s.el.offsetWidth;
    if (r === "dash") {
      s.boost = 1.1;
      s.tx = s.x < W / 2 ? W - s.w - 6 : 6;
      s.wait = 0;
    } else if (r === "color") {
      s.hue = (s.hue + rnd(70, 160)) % 360;
      s.img.style.filter = `hue-rotate(${s.hue}deg) saturate(1.3)`;
    } else {
      s.el.classList.add("react-" + r);
    }
    pop(s, pick(POP_LINES[r] || ["Бульк!"]));
    select(s);
  }

  function select(s) {
    selected = s;
    renderTools();
  }

  function feed(s, silent) {
    const m = moodOf(s.p);
    const a = s.a;
    const cap = s.p.pool === a.pool ? 100 : WRONG_POOL_CAP;
    if (m >= cap - 3) { if (!silent) pop(s, "Я сыт!"); return -1; }
    s.p.mood = Math.min(cap, m + 35);
    s.p.t = Date.now();
    dropFood(s.x + s.w / 2, 4);
    if (!silent) pop(s, "Ням!");
    updateMoodBadge(s);
    return m < 60 ? 2 : 0;
  }

  function dropFood(x, n) {
    const box = $("#poolFood");
    for (let i = 0; i < n; i++) {
      const f = document.createElement("i");
      f.className = "food";
      f.style.left = clamp(x + rnd(-20, 20), 4, W - 10) + "px";
      f.style.top = "4px";
      f.style.setProperty("--fall", (H * rnd(0.5, 0.85)).toFixed(0) + "px");
      f.style.animationDelay = rnd(0, 0.4).toFixed(2) + "s";
      box.appendChild(f);
      setTimeout(() => f.remove(), 3000);
    }
  }

  function feedAll() {
    const list = sims;
    if (!list.length) { toast("В бассейне пока никого нет."); return; }
    let reward = 0, fed = 0;
    list.forEach((s) => { const r = feed(s, true); if (r >= 0) { fed++; reward += r; } });
    for (let x = 30; x < W; x += 70) dropFood(x, 2);
    save();
    Sound.blub();
    if (reward) { addPearls(reward); toast(`Все сыты и довольны! +${reward} ${pearlIco}`); }
    else toast(fed ? "Покормили! Настроение растёт." : "Все и так сыты.");
    renderTools();
  }

  function renderTools() {
    const n = S.pets.filter((x) => x.pool === pool).length;
    const tools = $(".pool-tools");
    if (!selected || !sims.includes(selected)) {
      selected = null;
      tools.innerHTML = `<span class="pool-count">${n}/${POOL_MAX} мест</span>
        <button class="btn btn-coral btn-small" id="feedAllBtn">Покормить всех</button>
        <button class="btn btn-ghost btn-small" id="decorBtn">Украшения</button>`;
      $("#feedAllBtn").onclick = feedAll;
      $("#decorBtn").onclick = openDecor;
      return;
    }
    const s = selected, p = s.p, a = s.a, m = moodOf(p);
    const col = m >= 60 ? "#51cf66" : m >= 30 ? "#ffd43b" : "#ff6b6b";
    const wrong = p.pool !== a.pool;
    tools.innerHTML = `<div class="pet-info">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b style="font-size:18px">${esc(petLabel(p))}</b>${p.name ? `<span style="color:var(--muted);font-size:14px">${esc(a.name)}</span>` : ""}
        </div>
        <div class="mood" title="Настроение"><span style="width:${m}%;background:${col}"></span></div>
        <span style="font-size:13px;color:var(--muted);font-weight:700">Настроение: ${m}${wrong ? ` · лучше переселить в «${POOLS[a.pool].name}»` : ""}</span>
      </div>
      <button class="btn btn-coral btn-small" id="petFeed">Покормить</button>
      <button class="btn btn-ghost btn-small" id="petMore">Ещё</button>
      <button class="icon-btn" id="petClose" aria-label="Закрыть" style="width:40px;height:40px;font-size:16px">✕</button>`;
    $("#petFeed").onclick = () => {
      const r = feed(s);
      save();
      if (r > 0) { addPearls(r); toast(`${esc(petLabel(p))} благодарит вас! +${r} ${pearlIco}`); }
      Sound.blub();
      renderTools();
    };
    $("#petClose").onclick = () => { selected = null; renderTools(); };
    $("#petMore").onclick = () => openPetSheet(s);
  }

  function openPetSheet(s) {
    const p = s.p, a = s.a;
    openSheet(`
      <div class="pet-panel-head"><img src="${a.img}" alt=""><div><h3>${esc(petLabel(p))}</h3><p>${esc(a.name)} · бассейн «${POOLS[p.pool].name}»</p></div></div>
      <p style="margin:0;font-weight:800">Дайте имя:</p>
      <div class="name-row"><input id="petName" maxlength="18" placeholder="Например, Бублик" value="${esc(p.name)}"><button class="btn btn-turq" id="petNameSave">Ок</button></div>
      <div class="btn-row">
        <button class="btn btn-ghost" id="petCard">Карточка вида</button>
        <button class="btn btn-ghost" id="petMove">Переселить</button>
      </div>
      <div id="petMoveBox" style="margin-top:10px"></div>`);
    const saveName = () => {
      p.name = $("#petName").value.trim().slice(0, 18);
      save(); Sound.ding();
      const nm = s.el.querySelector(".pet-name"); nm.textContent = p.name; nm.hidden = !p.name;
      closeSheet(); renderTools();
      if (p.name) toast(`Теперь его зовут ${esc(p.name)}!`);
    };
    $("#petNameSave").onclick = saveName;
    $("#petName").onkeydown = (e) => { if (e.key === "Enter") saveName(); };
    $("#petCard").onclick = () => openCard(a.id);
    $("#petMove").onclick = () => choosePool(a, $("#petMoveBox"), p);
  }

  function openDecor() {
    const owned = S.decor[pool] || [];
    openSheet(`<h3 class="card-title" style="padding-right:50px">Украшения</h3>
      <p class="card-latin" style="font-style:normal">Для бассейна «${POOLS[pool].name}». У вас ${S.pearls} ${pearlIco}</p>
      <div class="decor-list">${DECOR.map((d) => {
        const has = owned.includes(d.id);
        const can = S.pearls >= d.price;
        return `<div class="decor-item ${has ? "owned" : ""}">${DECOR_SVG[d.id]}<b>${d.name}</b>
          ${has ? `<button class="btn btn-ghost btn-small" data-rm="${d.id}">Убрать</button>`
                : `<button class="btn btn-coral btn-small" data-dec="${d.id}" ${can ? "" : "disabled"}>${d.price} ${pearlIco}</button>`}</div>`;
      }).join("")}</div>
      <p class="note" style="margin-top:12px">Убранное украшение можно поставить обратно бесплатно.</p>`);
    $$("[data-dec]").forEach((b) => {
      b.onclick = () => {
        const d = DECOR.find((x) => x.id === b.dataset.dec);
        S.stored = S.stored || {};
        const free = S.stored[pool + ":" + d.id];
        if (!free) { if (S.pearls < d.price) return; addPearls(-d.price); }
        S.decor[pool] = (S.decor[pool] || []).concat(d.id);
        if (free) delete S.stored[pool + ":" + d.id];
        save(); Sound.ding(); renderDecor(); openDecor();
      };
      const key = pool + ":" + b.dataset.dec;
      if (S.stored && S.stored[key]) { b.disabled = false; b.innerHTML = "Поставить"; }
    });
    $$("[data-rm]").forEach((b) => {
      b.onclick = () => {
        S.decor[pool] = S.decor[pool].filter((x) => x !== b.dataset.rm);
        S.stored = S.stored || {};
        S.stored[pool + ":" + b.dataset.rm] = true;
        save(); Sound.click(); renderDecor(); openDecor();
      };
    });
  }

  function init() {
    window.addEventListener("resize", () => {
      if (current !== "aquarium") return;
      const oldW = W, oldH = H;
      measure();
      sims.forEach((s) => {
        const sz = size(s.a); s.w = sz.w; s.h = sz.h; s.el.style.width = s.w + "px";
        s.x = clamp(s.x * (W / (oldW || W)), 0, Math.max(0, W - s.w));
        s.y = s.move === "crawl" ? H - s.h - 10 : clamp(s.y * (H / (oldH || H)), 20, Math.max(20, H - s.h - 30));
        newTarget(s);
      });
    });
    $("#pool").addEventListener("click", () => { if (selected) { selected = null; renderTools(); } });
    setInterval(() => { if (current === "aquarium") sims.forEach(updateMoodBadge); }, 30000);
  }

  return { render, stop, init };
})();

/* =====================================================================
   ЭНЦИКЛОПЕДИЯ
   ===================================================================== */
const Book = (() => {
  const FILTERS = [
    ["all", "Все"], ["mammal", "Млекопитающие"], ["shark", "Акулы"], ["fish", "Рыбы"],
    ["invert", "Беспозвоночные"], ["reptile", "Рептилии"], ["deep", "Глубоководные"]
  ];
  let filter = "all";

  function render() {
    $("#bookCount").textContent = `${foundCount()}/${ANIMALS.length}`;
    $("#bookFilters").innerHTML = FILTERS.map(([k, n]) => `<button class="chip ${k === filter ? "is-on" : ""}" data-f="${k}">${n}</button>`).join("");
    $$("[data-f]").forEach((b) => { b.onclick = () => { filter = b.dataset.f; Sound.click(); render(); }; });
    const list = ANIMALS.filter((a) => filter === "all" || (filter === "deep" ? a.zone >= 1 : a.group === filter));
    $("#bookGrid").innerHTML = list.map((a) => {
      const f = S.found[a.id];
      return `<button class="book-card z${a.zone} ${f ? "" : "locked"}" data-id="${a.id}">
        <span class="rar-dot ${a.rarity}" title="${RARITY[a.rarity].name}"></span>
        ${f ? (petOf(a.id) ? '<span class="in-pool" title="Живёт в океанариуме">🏠</span>' : "") : '<span class="q">?</span>'}
        <img src="${a.img}" alt="" loading="lazy">
        <span class="bc-name">${f ? esc(a.name) : "???"}</span></button>`;
    }).join("");
    $$("#bookGrid .book-card").forEach((b) => {
      b.onclick = () => {
        const a = BY_ID[b.dataset.id];
        if (S.found[a.id]) { Sound.click(); openCard(a.id); return; }
        const z = ZONES[a.zone];
        Sound.click();
        toast(`Этот вид живёт в зоне «${z.name}» (${fmtDepth(z.from)}–${a.zone === 3 ? "11 000" : fmtDepth(z.to)} м). Ищите в «Погружении»!`);
      };
    });
  }
  return { render };
})();

/* =====================================================================
   ЭКЗАМЕН АСА
   ===================================================================== */
const Quiz = (() => {
  const MODES = {
    sil:   { name: "Угадай по силуэту", sub: "Кто прячется в тени?", img: "images/hammerhead.svg", cls: "m-sil" },
    myth:  { name: "Правда или миф", sub: "Не дайте себя обмануть", img: "images/blobfish.svg", cls: "m-myth" },
    where: { name: "Где живёт?", sub: "От рифов до впадин", img: "images/greenturtle.svg", cls: "m-where" },
    big:   { name: "Кто больше?", sub: "Битва размеров", img: "images/bluewhale.svg", cls: "m-big" }
  };
  let Q = null;

  function wrap(html) { $("#quizWrap").innerHTML = `<div class="quiz-inner">${html}</div>`; $("#quizWrap").scrollTop = 0; }

  function menu() {
    Q = null;
    const r = rankIndex(), next = RANKS[r + 1];
    const pct = next ? ((S.xp - RANKS[r].xp) / (next.xp - RANKS[r].xp)) * 100 : 100;
    const diff = S.diff || 1;
    wrap(`
      <div class="rank-card"><div class="medal">${r + 1}</div><div style="flex:1">
        <h3>${RANKS[r].name}</h3>
        <p>${next ? `Опыт: ${S.xp}. До ранга «${next.name}» — ${next.xp - S.xp}.` : `Опыт: ${S.xp}. Высший ранг! Вы — легенда.`}</p>
        <span class="rank-bar"><span style="width:${pct}%"></span></span></div></div>
      <div class="ranks-ladder">${RANKS.map((k, i) => `<span class="${i < r ? "done" : i === r ? "cur" : ""}">${k.name}</span>`).join("")}</div>
      <p class="q-section">Сложность</p>
      <div class="diff-row">${[1, 2, 3].map((d) => `<button data-d="${d}" class="${d === diff ? "is-on" : ""}">${DIFF_NAMES[d]}<small>+${QUIZ.pearls[d]} ${plural(QUIZ.pearls[d], "жемчужина", "жемчужины", "жемчужин")} за ответ</small></button>`).join("")}</div>
      <p class="q-section">Экзамены · по ${QUIZ.len} вопросов</p>
      <div class="mode-grid">${Object.entries(MODES).map(([k, m]) => {
        const best = S.best[k + diff];
        return `<button class="mode ${m.cls}" data-m="${k}">${best != null ? `<span class="best">Рекорд: ${best}/${QUIZ.len}</span>` : ""}
          <img src="${m.img}" alt=""><b>${m.name}</b><small>${m.sub}</small></button>`;
      }).join("")}</div>`);
    $$("[data-d]").forEach((b) => { b.onclick = () => { S.diff = +b.dataset.d; save(); Sound.click(); menu(); }; });
    $$("[data-m]").forEach((b) => { b.onclick = () => start(b.dataset.m); });
  }

  /* --- генераторы вопросов --- */
  function animalPool(diff) {
    if (diff === 1) return ANIMALS.filter((a) => a.zone === 0 && a.rarity !== "legendary" || ["bluewhale", "greatwhite", "whaleshark", "narwhal"].includes(a.id));
    if (diff === 2) return ANIMALS.filter((a) => a.zone <= 1);
    return ANIMALS;
  }

  function genSil(diff) {
    const pool = shuffle(animalPool(diff));
    return pool.slice(0, QUIZ.len).map((a) => {
      let others = ANIMALS.filter((x) => x.id !== a.id);
      if (diff === 1) others = others.filter((x) => x.group !== a.group);
      if (diff === 3) { const same = others.filter((x) => x.group === a.group); if (same.length >= 3) others = same; }
      const opts = shuffle([a, ...shuffle(others).slice(0, 3)]);
      return {
        kind: "sil", title: "Чей это силуэт?", a,
        options: opts.map((o) => ({ label: o.name, ok: o.id === a.id })),
        explain: `${a.name}. ${a.tagline}`
      };
    });
  }

  function genMyth(diff) {
    let list = shuffle(MYTHS.filter((m) => m.d === diff));
    if (list.length < QUIZ.len) list = list.concat(shuffle(MYTHS.filter((m) => m.d !== diff))).slice(0, QUIZ.len);
    return list.slice(0, QUIZ.len).map((m) => ({
      kind: "myth", title: "Правда или миф?", statement: m.q,
      options: [{ label: "Правда", ok: m.a }, { label: "Миф", ok: !m.a }],
      explain: m.why, verdictTrue: m.a
    }));
  }

  function genWhere(diff) {
    const pool = shuffle(animalPool(diff));
    return pool.slice(0, QUIZ.len).map((a) => {
      const wrong = shuffle(Object.keys(HOMES).filter((k) => !a.homeOk.includes(k))).slice(0, 3);
      const opts = shuffle([a.home, ...wrong]);
      return {
        kind: "where", title: "Где живёт?", a,
        options: opts.map((k) => ({ label: HOMES[k], ok: k === a.home })),
        explain: `${a.name}: ${HOMES[a.home].toLowerCase()}. Глубина: ${a.depth.toLowerCase()}.`
      };
    });
  }

  function genBig(diff) {
    const list = ANIMALS.filter((a) => !a.noCompare);
    const range = diff === 1 ? [4, Infinity] : diff === 2 ? [1.8, 4] : [1.25, 1.8];
    const out = [], used = new Set();
    let guard = 0;
    while (out.length < QUIZ.len && guard++ < 2000) {
      const x = pick(list), y = pick(list);
      if (x.id === y.id) continue;
      const big = x.sizeNum >= y.sizeNum ? x : y, small = big === x ? y : x;
      const ratio = big.sizeNum / small.sizeNum;
      const key = [x.id, y.id].sort().join("|");
      if (ratio < range[0] || ratio >= range[1] || used.has(key)) continue;
      if (used.has(x.id) && used.has(y.id)) continue;
      used.add(key); used.add(x.id); used.add(y.id);
      const pair = shuffle([x, y]);
      out.push({
        kind: "big", title: "Кто крупнее?", sub: "Сравниваем наибольшую длину (у манты — размах плавников)",
        options: pair.map((o) => ({ label: o.name, img: o.img, ok: o.id === big.id, extra: o.size })),
        explain: `${big.name} крупнее: ${big.size.toLowerCase()}. ${small.name}: ${small.size.toLowerCase()}.`
      });
    }
    return out;
  }

  function start(mode) {
    Sound.click();
    const diff = S.diff || 1;
    const gen = { sil: genSil, myth: genMyth, where: genWhere, big: genBig }[mode];
    const qs = gen(diff);
    Q = { mode, diff, qs, i: 0, score: 0 };
    show();
  }

  function show() {
    const q = Q.qs[Q.i];
    const n = Q.qs.length;
    let body = "";
    if (q.kind === "sil") body = `<div class="q-img sil" id="qImg"><img src="${q.a.img}" alt="Силуэт"></div>`;
    if (q.kind === "where") body = `<div class="q-img"><img src="${q.a.img}" alt=""></div><p class="q-title" style="font-size:20px;color:var(--aqua)">${esc(q.a.name)}</p>`;
    if (q.kind === "myth") body = `<div class="q-statement">«${esc(q.statement)}»</div>`;
    const answers = q.kind === "big"
      ? `<div class="answers two" id="answers">${q.options.map((o, i) => `<button class="ans pick" data-i="${i}"><img src="${o.img}" alt=""><span>${esc(o.label)}</span><em>${esc(o.extra)}</em></button>`).join("")}</div>`
      : `<div class="answers ${q.kind === "myth" ? "two" : ""}" id="answers">${q.options.map((o, i) => `<button class="ans" data-i="${i}">${esc(o.label)}</button>`).join("")}</div>`;
    wrap(`
      <div class="q-top"><span class="q-num">${Q.i + 1}/${n}</span><span class="q-progress"><span style="width:${(Q.i / n) * 100}%"></span></span><span class="q-score">★ ${Q.score}</span></div>
      <div class="q-card">
        <h3 class="q-title">${esc(q.title)}</h3>
        ${q.sub ? `<p class="note" style="margin:-4px 0 10px">${esc(q.sub)}</p>` : ""}
        ${body}${answers}
        <div id="after"></div>
      </div>`);
    $$("#answers .ans").forEach((b) => { b.onclick = () => answer(+b.dataset.i); });
  }

  function answer(i) {
    const q = Q.qs[Q.i];
    const box = $("#answers");
    if (box.classList.contains("answered")) return;
    box.classList.add("answered");
    const ok = q.options[i].ok;
    $$(".ans", box).forEach((b, k) => {
      if (q.options[k].ok) b.classList.add("ok");
      else if (k === i) b.classList.add("bad");
    });
    if (ok) { Q.score++; Sound.good(); } else Sound.bad();
    const img = $("#qImg"); if (img) img.classList.add("reveal");
    const verdict = ok ? "✅" : "❌";
    const head = q.kind === "myth" ? (q.verdictTrue ? "Это правда. " : "Это миф. ") : "";
    $("#after").innerHTML = `<div class="explain"><span class="verdict">${verdict}</span><span>${esc(head + q.explain)}</span></div>
      <button class="btn btn-coral q-next" id="qNext">${Q.i + 1 < Q.qs.length ? "Дальше" : "Результат"}</button>`;
    $(".q-score").textContent = "★ " + Q.score;
    $("#qNext").onclick = () => { Q.i++; if (Q.i < Q.qs.length) show(); else finish(); };
    $("#qNext").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function finish() {
    const n = Q.qs.length, sc = Q.score, d = Q.diff;
    const perfect = sc === n;
    const pearls = sc * QUIZ.pearls[d] + (perfect ? QUIZ.perfectPearls : 0);
    const xp = sc * QUIZ.xp[d] + (perfect ? QUIZ.perfectXp : 0);
    const key = Q.mode + d;
    const record = S.best[key] == null || sc > S.best[key];
    S.best[key] = Math.max(sc, S.best[key] || 0);
    save();
    const title = perfect ? "Безупречно! Вы — настоящий ас." : sc >= 8 ? "Отлично, директор!" : sc >= 5 ? "Неплохо! Ещё немного практики." : "Океан полон загадок. Попробуем ещё?";
    wrap(`<div class="q-card result">
      <div class="big">${sc}/${n}</div>
      <h3>${title}</h3>
      <p>${MODES[Q.mode].name} · ${DIFF_NAMES[d]}${record && sc > 0 ? " · новый рекорд!" : ""}</p>
      <div class="rewards"><span>+${pearls} ${pearlIco}</span><span>+${xp} опыта</span></div>
      <button class="btn btn-coral" id="qAgain">Ещё раз</button>
      <button class="btn btn-ghost" id="qMenu">Другой экзамен</button>
    </div>`);
    if (perfect) { confetti(40); Sound.fanfare(); } else Sound.ding();
    $("#qAgain").onclick = () => start(Q.mode);
    $("#qMenu").onclick = menu;
    addPearls(pearls);
    addXp(xp);
  }

  function back() {
    if (Q) menu(); else go("hub");
  }

  return { menu, back };
})();

/* =====================================================================
   МЕЧТА
   ===================================================================== */
function renderDream() {
  S.dreamSeen = true; save();
  $("#dreamTitle").textContent = `${DIRECTOR}, вы прошли все испытания`;
  $("#dreamText").textContent = isSet(CONFIG.finalMessage) ? CONFIG.finalMessage : "Настоящий океан ждёт вас. Готовьтесь к экспедиции!";
  $("#dreamDate").textContent = isSet(CONFIG.finalDate) ? `📅 ${CONFIG.finalDate}` : "";
  $("#dreamFrom").textContent = isSet(CONFIG.fromWho) ? `С любовью, ${CONFIG.fromWho.replace(/^от\s+/i, "")}` : "";
  confetti(70);
  Sound.fanfare();
}

function confetti(n) {
  const colors = ["#ffd166", "#ff7a59", "#7cf7ff", "#b6ff5c", "#a77bff", "#ffffff"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = rnd(0, 100) + "vw";
    c.style.background = pick(colors);
    c.style.animationDuration = rnd(2.2, 4.2) + "s";
    c.style.animationDelay = rnd(0, 0.8) + "s";
    c.style.borderRadius = Math.random() < 0.4 ? "50%" : "2px";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5200);
  }
}

/* =====================================================================
   НАСТРОЙКИ
   ===================================================================== */
const SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" fill="currentColor"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9H3zm18.6 6.2-1.4 1.4L17.6 14l-2.6 2.6-1.4-1.4L16.2 12.6 13.6 10l1.4-1.4 2.6 2.6 2.6-2.6 1.4 1.4-2.6 2.6z" fill="currentColor"/></svg>';
function renderSoundBtn() {
  const b = $("#soundBtn");
  b.innerHTML = S.sound ? SOUND_ON : SOUND_OFF;
  b.setAttribute("aria-label", S.sound ? "Выключить звук" : "Включить звук");
}
function openSettings() {
  openSheet(`<h3 class="card-title" style="padding-right:50px">Настройки</h3>
    <p class="card-latin" style="font-style:normal">${DIRECTOR} · ранг «${RANKS[rankIndex()].name}» · опыт ${S.xp}</p>
    <div class="card-actions">
      <button class="btn btn-ghost" id="setSound">${S.sound ? "Выключить звук" : "Включить звук"}</button>
      <button class="btn btn-ghost" id="setIntro">Послушать Октавия ещё раз</button>
    </div>
    <div id="resetBox" style="margin-top:22px;text-align:center">
      <button class="danger-link" id="setReset">Начать заново</button>
    </div>
    ${isSet(CONFIG.fromWho) ? `<p class="note" style="margin-top:16px">Подарок ${esc(CONFIG.fromWho)}</p>` : ""}`);
  $("#setSound").onclick = () => { Sound.set(!S.sound); renderSoundBtn(); openSettings(); };
  $("#setIntro").onclick = () => { closeSheet(); S.introSeen = false; enter(); };
  $("#setReset").onclick = () => {
    $("#resetBox").innerHTML = `<p style="font-weight:800">Точно начать заново? Все животные, жемчужины, имена и ранги пропадут навсегда.</p>
      <div class="btn-row"><button class="btn btn-ghost" id="resetNo">Отмена</button><button class="btn btn-coral" id="resetYes">Да, сбросить</button></div>`;
    $("#resetNo").onclick = openSettings;
    $("#resetYes").onclick = () => {
      try { localStorage.removeItem(KEY); } catch (e) { /* нет хранилища */ }
      S = fresh(); save();
      location.reload();
    };
  };
}

/* =====================================================================
   ЗАПУСК
   ===================================================================== */
function makeBubbles() {
  const box = $(".bubbles");
  const n = window.innerWidth < 500 ? 10 : 16;
  for (let i = 0; i < n; i++) {
    const b = document.createElement("i");
    const s = rnd(6, 20);
    b.style.width = b.style.height = s + "px";
    b.style.left = rnd(0, 100) + "%";
    b.style.animationDuration = rnd(8, 18) + "s";
    b.style.animationDelay = -rnd(0, 18) + "s";
    box.appendChild(b);
  }
}

function init() {
  makeBubbles();
  renderIntro();
  renderSoundBtn();
  updateCounters();
  Dive.init();
  Aqua.init();

  $("#enterBtn").onclick = enter;
  $$("[data-go]").forEach((b) => { b.addEventListener("click", () => { Sound.click(); go(b.dataset.go); }); });
  $("#quizBack").onclick = () => { Sound.click(); Quiz.back(); };
  $("#dialogNext").onclick = nextLine;
  $("#sheetDim").onclick = closeSheet;
  $("#sheetClose").onclick = closeSheet;
  $("#soundBtn").onclick = () => { Sound.set(!S.sound); renderSoundBtn(); };
  $("#settingsBtn").onclick = openSettings;
  $("#hubMascot").onclick = () => { Sound.blub(); sayTip(true); };
  $("#dreamTile").onclick = () => {
    if (rankIndex() >= CONFIG.dreamRank) go("dream");
    else {
      const need = RANKS[CONFIG.dreamRank].xp - S.xp;
      toast(`Октавий: «Это секрет. Нужно ещё ${need} опыта. Экзамены — лучший путь.»`);
    }
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!$("#dialogWrap").hidden) nextLine(); else closeSheet(); }
  });
  try { history.replaceState({ screen: "hub" }, ""); } catch (e) { /* file:// */ }
}

init();
})();
