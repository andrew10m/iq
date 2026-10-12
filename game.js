/* =====================================================================
   ИГРА «ЗОВ ГЛУБИНЫ» — логика экспедиции поверх погружения.
   Тексты и баланс — в expedition.js, подпись подарка — в CONFIG (script.js).
   ===================================================================== */
(() => {
"use strict";

const X = EXPEDITION;
const Q = X.quests;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isSet = (s) => typeof s === "string" && s.trim() !== "" && !/^\[.*\]$/.test(s.trim());
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
const dataWord = (n) => `${n} ${plural(n, "единица", "единицы", "единиц")} данных`;

const NAME = isSet(CONFIG.name) ? CONFIG.name.trim() : "исследователь";
const CAPTAIN = isSet(CONFIG.captain) ? CONFIG.captain.trim() : "";
const CAPTAIN_LABEL = CAPTAIN ? `Капитан ${CAPTAIN}` : "Капитан";
const fill = (t) => t.replace(/\{name\}/g, NAME).replace(/\{captain\}/g, CAPTAIN || "экспедиции").replace(/\{sub\}/g, S.sub || "Глубина");

let O = null; // интерфейс погружения из script.js

/* =====================================================================
   СОХРАНЕНИЕ
   ===================================================================== */
const KEY = "pogruzhenie-save-v1";
const fresh = () => ({
  v: 1, started: false, sub: "", data: X.startData,
  scanned: {}, evidence: Object.fromEntries(X.startEvidence.map((k) => [k, 1])), solved: {},
  hull: 1, owned: {}, slots: [], quest: 0, maxDepth: 0,
  radioDay: "", daily: 0, asked: {}, days: [], notes: {}, log: [],
  finaleSeen: false, grants: {}
});
let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* нет доступа к хранилищу — играем без сохранения */ }
  return fresh();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ничего страшного */ }
}

/* ---------- код экспедиции: прогресс в 22 символах ---------- */
const ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const EV_KEYS = Object.keys(X.evidence);
const D_KEYS = Object.keys(X.deductions);
const M_KEYS = Object.keys(X.modules);
const CYR = { "А": "A", "В": "B", "С": "C", "Е": "E", "Н": "H", "К": "K", "М": "M", "О": "0", "Р": "P", "Т": "T", "Х": "X", "У": "Y", "З": "3", "Б": "6" };

function checksum(bits) {
  let h = 0;
  for (let i = 0; i < bits.length; i += 5) h = (h * 31 + parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2) + 7) % 1021;
  return h;
}
function encode() {
  let b = "";
  const put = (v, n) => { b += Math.max(0, Math.min(v, 2 ** n - 1)).toString(2).padStart(n, "0"); };
  put(1, 3);
  ANIMALS.forEach((a) => put(S.scanned[a.id] ? 1 : 0, 1));
  put(S.hull - 1, 2);
  M_KEYS.forEach((m) => put(S.owned[m] ? 1 : 0, 1));
  M_KEYS.forEach((m) => put(S.slots.includes(m) ? 1 : 0, 1));
  put(S.data, 12);
  EV_KEYS.forEach((k) => put(S.evidence[k] ? 1 : 0, 1));
  D_KEYS.forEach((k) => put(S.solved[k] ? 1 : 0, 1));
  put(S.quest, 5);
  put(S.daily, 7);
  put(S.maxDepth >= 10900 ? 1 : 0, 1);
  put(S.finaleSeen ? 1 : 0, 1);
  put(checksum(b), 10);
  while (b.length % 5) b += "0";
  let s = "";
  for (let i = 0; i < b.length; i += 5) s += ALPH[parseInt(b.slice(i, i + 5), 2)];
  return s.match(/.{1,4}/g).join("-");
}
function decode(code) {
  let s = String(code).toUpperCase().replace(/[^0-9A-ZА-ЯЁ]/g, "");
  s = s.split("").map((c) => CYR[c] || c).join("").replace(/O/g, "0").replace(/[IL]/g, "1").replace(/U/g, "V");
  if (!/^[0-9A-HJKMNP-TV-Z]+$/.test(s)) return null;
  let b = s.split("").map((c) => ALPH.indexOf(c).toString(2).padStart(5, "0")).join("");
  let p = 0;
  const get = (n) => { const v = parseInt(b.slice(p, p + n), 2); p += n; return v; };
  if (b.length < 3 || get(3) !== 1) return null;
  const st = { scanned: {}, owned: {}, slots: [], evidence: {}, solved: {} };
  const now = Date.now();
  ANIMALS.forEach((a) => { if (get(1)) st.scanned[a.id] = now; });
  st.hull = get(2) + 1;
  M_KEYS.forEach((m) => { if (get(1)) st.owned[m] = 1; });
  M_KEYS.forEach((m) => { if (get(1)) st.slots.push(m); });
  st.data = get(12);
  EV_KEYS.forEach((k) => { if (get(1)) st.evidence[k] = 1; });
  D_KEYS.forEach((k) => { if (get(1)) st.solved[k] = 1; });
  st.quest = Math.min(get(5), Q.length);
  st.daily = get(7);
  st.maxDepth = get(1) ? 10935 : 0;
  st.finaleSeen = !!get(1);
  const body = b.slice(0, p);
  const sum = get(10);
  if (Number.isNaN(sum) || checksum(body) !== sum) return null;
  st.slots = st.slots.filter((m) => st.owned[m]).slice(0, X.slots);
  return st;
}
function applyState(st) {
  const keep = { sub: S.sub, notes: S.notes, log: S.log, days: S.days };
  S = Object.assign(fresh(), keep, st, { started: true });
  save();
  location.hash = "";
  location.reload();
}

/* =====================================================================
   СОСТОЯНИЕ ДЛЯ ЗАДАЧ
   ===================================================================== */
const G = {
  scanned: () => ANIMALS.filter((a) => S.scanned[a.id]).length,
  scannedInZone: (z) => ANIMALS.filter((a) => a.zone === z && S.scanned[a.id]).length,
  total: () => ANIMALS.length,
  has: (k) => !!S.evidence[k],
  solved: (k) => !!S.solved[k],
  hull: () => S.hull,
  owned: (m) => !!S.owned[m],
  installed: (m) => S.slots.includes(m),
  maxDepth: () => S.maxDepth
};
const act = () => (S.quest >= Q.length ? 5 : Q[S.quest].act);
const curQuest = () => Q[S.quest] || null;
const dedQuest = { d1: "q4", d2: "q8", d3: "q12", d4: "q16" };
const questIndex = (id) => Q.findIndex((q) => q.id === id);
const dedOpen = (d) => S.quest >= questIndex(dedQuest[d]);

/* =====================================================================
   ЗВУКОВЫЕ МОДЕЛИ (Web Audio, без файлов)
   ===================================================================== */
const Audio = (() => {
  let ctx = null;
  const init = () => { if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); } if (ctx && ctx.state === "suspended") ctx.resume(); return ctx; };
  function noise(dur) {
    const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(type, f0, f1, t, dur, vol, filter) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, Math.min(.2, dur / 3), vol, dur);
    let node = o;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filter; o.connect(f); node = f; }
    node.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .05);
  }
  function play(kind) {
    if (!init()) return;
    const t = ctx.currentTime + .05;
    if (kind === "rise") {
      tone("sawtooth", 70, 260, t, 2.6, .22, 520);
      const n = noise(2.8), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "lowpass"; f.frequency.value = 300; env(g, t, .4, .12, 2.8);
      n.connect(f).connect(g).connect(ctx.destination); n.start(t);
    } else if (kind === "moan") tone("sine", 190, 140, t, 2.8, .3);
    else if (kind === "song") [[300, 520], [480, 260], [220, 380], [600, 420]].forEach(([a, b], i) => tone("sine", a, b, t + i * .6, .55, .2));
    else if (kind === "calls") [[900, 1400], [1200, 800], [700, 1300]].forEach(([a, b], i) => tone("triangle", a, b, t + i * .45, .35, .12));
    else if (kind === "chirps") for (let i = 0; i < 9; i++) tone("sine", 2000 + Math.random() * 1500, 3200 + Math.random() * 800, t + i * .17, .08, .08);
    else if (kind === "clicks") for (let i = 0; i < 12; i++) {
      const n = noise(.02), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "bandpass"; f.frequency.value = 2500; env(g, t + i * .2, .002, .6, .02);
      n.connect(f).connect(g).connect(ctx.destination); n.start(t + i * .2);
    } else if (kind === "silence") {
      const n = noise(1.6), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "lowpass"; f.frequency.value = 400; env(g, t, .3, .015, 1.6);
      n.connect(f).connect(g).connect(ctx.destination); n.start(t);
    }
  }
  const ping = () => { if (init()) { tone("sine", 1320, 1310, ctx.currentTime, .5, .06); tone("sine", 1980, 1970, ctx.currentTime + .08, .6, .04); } };
  return { play, ping, init };
})();

/* ---------- спектрограммы: картинка звука ---------- */
function spectro(kind) {
  if (!kind || kind === "none") return "";
  const R = (n) => { let s = n * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
  const rnd = R(kind.length * 7);
  let body = "";
  const line = (d, w = 4, o = .95) => `<path d="${d}" stroke="currentColor" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${o}"/>`;
  if (kind === "rise") body = line("M12,54 C70,53 120,44 188,12", 5);
  if (kind === "moan") body = line("M12,46 C60,44 130,48 188,50", 7, .85);
  if (kind === "song") for (let i = 0; i < 5; i++) { const x = 14 + i * 36; body += line(`M${x},48 Q${x + 12},${16 + rnd() * 18} ${x + 26},${36 + rnd() * 10}`, 3); }
  if (kind === "calls") for (let i = 0; i < 4; i++) { const x = 16 + i * 46, y = 22 + rnd() * 18; body += line(`M${x},${y + 10} Q${x + 10},${y - 8} ${x + 22},${y + 4}`, 3); }
  if (kind === "chirps") for (let i = 0; i < 16; i++) { const x = 12 + i * 11; body += line(`M${x},${30 + rnd() * 6} L${x + 4},${12 + rnd() * 6}`, 2); }
  if (kind === "clicks") for (let i = 0; i < 12; i++) { const x = 16 + i * 15; body += line(`M${x},8 L${x},58`, 1.6, .9); }
  if (kind === "silence") for (let i = 0; i < 40; i++) body += `<circle cx="${8 + rnd() * 184}" cy="${52 + rnd() * 8}" r=".9" fill="currentColor" opacity=".45"/>`;
  return `<svg class="spectro" viewBox="0 0 200 64" role="img" aria-label="Спектрограмма">
    <g stroke="currentColor" opacity=".12">${[16, 32, 48].map((y) => `<line x1="0" x2="200" y1="${y}" y2="${y}"/>`).join("")}${[50, 100, 150].map((x) => `<line y1="0" y2="64" x1="${x}" x2="${x}"/>`).join("")}</g>
    ${body}
    <text x="196" y="62" text-anchor="end" font-size="7" fill="currentColor" opacity=".5">время →</text>
    <text x="3" y="8" font-size="7" fill="currentColor" opacity=".5">↑ высота</text>
  </svg>`;
}

/* =====================================================================
   ВОПРОСЫ ПО КАРТОЧКЕ (чтение и память)
   ===================================================================== */
const SHALLOW_HOMES = ["Коралловые рифы", "Берега Галапагосских островов", "Тёплые прибрежные воды"];
const DEEP_HOMES = ["Сумеречная зона, 200–1000 м", "Полночная зона, 1000–4000 м", "Бездна и впадины, глубже 4000 м"];
const stems = (s) => new Set(s.toLowerCase().replace(/[^а-яё ]/g, " ").split(/\s+/).filter((w) => w.length >= 4).map((w) => w.slice(0, 5)));
const overlap = (a, b) => { const A = stems(a); for (const w of stems(b)) if (A.has(w)) return true; return false; };
function sizeMeters(s) {
  let best = null;
  const re = /(\d+(?:[.,]\d+)?)\s*(см|м)(?![а-я])/g;
  let m;
  while ((m = re.exec(s))) { const v = parseFloat(m[1].replace(",", ".")) * (m[2] === "см" ? .01 : 1); if (best === null || v > best) best = v; }
  return best;
}
function makeQuestion(a, avoidType) {
  const others = ANIMALS.filter((b) => b.id !== a.id);
  const types = [];
  const name = lowerFirst(a.name);
  const foodD = shuffle(others).map((b) => b.food).filter((f, i, arr) => f !== a.food && !overlap(f, a.food) && arr.indexOf(f) === i).slice(0, 3);
  if (foodD.length === 3) types.push({ type: "food", q: `Чем питается ${name}?`, right: a.food, wrong: foodD });
  const sz = sizeMeters(a.size);
  if (sz) {
    const pool = [];
    shuffle(others).forEach((b) => {
      const v = sizeMeters(b.size);
      if (!v || pool.length >= 3) return;
      const far = (x, y) => Math.max(x, y) / Math.min(x, y) >= 2;
      if (far(v, sz) && pool.every((p) => far(p.v, v))) pool.push({ v, t: b.size });
    });
    if (pool.length === 3) types.push({ type: "size", q: `Какого размера ${name}?`, right: a.size, wrong: pool.map((p) => p.t) });
  }
  if (a.zone === 0 && !DEEP_HOMES.includes(a.home)) types.push({ type: "home", q: `Где живёт ${name}?`, right: a.home, wrong: DEEP_HOMES });
  if (DEEP_HOMES.includes(a.home)) types.push({ type: "home", q: `Где живёт ${name}?`, right: a.home, wrong: SHALLOW_HOMES });
  const factD = shuffle(others.filter((b) => b.group !== a.group && b.zone !== a.zone)).slice(0, 3).map((b) => pick(b.facts));
  types.push({ type: "fact", q: "Какой из этих фактов есть в карточке этого вида?", right: pick(a.facts), wrong: factD });
  const pool = types.filter((t) => t.type !== avoidType);
  const t = pick(pool.length ? pool : types);
  const options = shuffle([t.right, ...t.wrong]);
  return { type: t.type, q: t.q, options, correct: options.indexOf(t.right) };
}

/* =====================================================================
   ИНТЕРФЕЙС: уведомления, радио, оверлеи
   ===================================================================== */
function toast(html, cls = "") {
  const el = document.createElement("div");
  el.className = "g-toast " + cls;
  el.innerHTML = html;
  $("#gToasts").appendChild(el);
  gsap.fromTo(el, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: "power3.out" });
  gsap.to(el, { y: -10, autoAlpha: 0, duration: .5, delay: 3.4, onComplete: () => el.remove() });
}

const Radio = (() => {
  const box = $("#radio");
  let queue = [], busy = false, typing = null, hideTween = null;
  function say(lines, opts = {}) {
    queue.push({ lines: lines.map(fill), ...opts });
    if (!busy) next();
  }
  function next() {
    const m = queue.shift();
    if (!m) { busy = false; hide(); return; }
    busy = true;
    m.lines.forEach((l) => S.log.unshift({ t: Date.now(), text: l }));
    S.log = S.log.slice(0, 30); save();
    show(m, 0);
  }
  function show(m, i) {
    if (hideTween) { hideTween.kill(); hideTween = null; }
    box.hidden = false;
    document.body.classList.add("radio-open");
    $("#radioFrom").textContent = m.from || `Связь · ${CAPTAIN_LABEL}`;
    const last = i === m.lines.length - 1;
    $("#radioExtra").innerHTML = last && m.extra ? m.extra : "";
    $("#radioOk").textContent = last ? (m.okLabel || "Принято") : "Дальше";
    $("#radioCount").textContent = m.lines.length > 1 ? `${i + 1}/${m.lines.length}` : "";
    type($("#radioText"), m.lines[i]);
    if (i === 0) { gsap.fromTo(box, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: "power3.out" }); Audio.ping(); }
    $("#radioOk").onclick = () => {
      if (typing) { typing.finish(); return; }
      if (!last) { show(m, i + 1); return; }
      if (m.onClose) m.onClose();
      next();
    };
    if (last && m.onShow) m.onShow($("#radioExtra"));
  }
  function type(el, text) {
    if (typing) typing.finish();
    let i = 0, raf = 0, done = false;
    const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); el.textContent = text; typing = null; };
    const stepF = () => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) finish(); else raf = requestAnimationFrame(stepF); };
    typing = { finish };
    el.textContent = "";
    raf = requestAnimationFrame(stepF);
  }
  function hide() {
    hideTween = gsap.to(box, { y: 20, autoAlpha: 0, duration: .3, onComplete: () => { hideTween = null; box.hidden = true; document.body.classList.remove("radio-open"); } });
  }
  $("#radioText").addEventListener("click", () => typing && typing.finish());
  return { say, busy: () => busy };
})();

function lockScroll(on) {
  document.documentElement.style.overflow = on ? "hidden" : (O && O.currentSpecies() ? "hidden" : "");
}

/* =====================================================================
   HUD: текущая задача и данные
   ===================================================================== */
let shownData = null;
function renderHud() {
  const hud = $("#hud");
  if (!S.started) { hud.hidden = true; document.body.classList.remove("has-hud"); return; }
  hud.hidden = false;
  document.body.classList.add("has-hud");
  const q = curQuest();
  const a = X.acts[act()];
  $("#hudAct").textContent = `${a.n} · ${a.title}`;
  if (q) {
    const [d, n] = q.progress(G);
    $("#hudGoal").textContent = q.title + (n > 1 ? ` · ${Math.min(d, n)}/${n}` : "");
    $("#hudBar").style.transform = `scaleX(${clamp(d / n)})`;
  } else {
    $("#hudGoal").textContent = "Экспедиция завершена";
    $("#hudBar").style.transform = "scaleX(1)";
  }
  const el = $("#hudData");
  if (shownData === null) { shownData = S.data; el.textContent = S.data; }
  else if (shownData !== S.data) {
    const o = { v: shownData };
    gsap.to(o, { v: S.data, duration: .8, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } });
    gsap.fromTo($("#hudJournal"), { scale: 1.08 }, { scale: 1, duration: .5, ease: "power2.out" });
    shownData = S.data;
  }
  $("#hudRadio").hidden = !dailyAvailable();
}

function addData(n) { S.data = Math.max(0, S.data + n); save(); renderHud(); }

/* =====================================================================
   ДВИЖОК ЗАДАЧ
   ===================================================================== */
function evaluate() {
  let advanced = false;
  while (S.quest < Q.length) {
    const q = Q[S.quest];
    const [d, n] = q.progress(G);
    if (d < n) break;
    S.quest++;
    advanced = true;
    if (q.reward) S.data += q.reward;
    (q.give || []).forEach((k) => { S.evidence[k] = 1; });
    save();
    const lines = q.done.slice();
    let extra = `<p class="r-done">✓ Задача выполнена: ${esc(q.title)}${q.reward ? ` · +${dataWord(q.reward)}` : ""}</p>`;
    if (q.checkpoint) {
      lines.push("Запиши код экспедиции — с ним можно продолжить на любом устройстве, даже если этот сломается.");
      extra = `<p class="r-done">✓ ${esc(q.title)}</p><div class="code-show">${encode()}</div><button class="g-link" type="button" data-copycode>Скопировать код</button>`;
    }
    Radio.say(lines, { extra, onShow: (box) => bindCopy(box), onClose: q.finale ? () => setTimeout(Finale.show, 500) : null });
  }
  if (advanced) refreshAll();
  else renderHud();
  checkGrant();
}

function refreshAll() {
  renderHud();
  markPage();
  if (O) { O.refreshIndex(); if (O.currentSpecies()) renderScan(O.currentSpecies()); }
  if (Journal.isOpen()) Journal.render();
}

/* ---------- страховка: игра не должна «застревать» ---------- */
function neededPurchase() {
  const q = curQuest();
  if (!q) return 0;
  if (q.id === "q2") return S.owned.hydro ? 0 : X.modules.hydro.price;
  if (q.id === "q5") return X.hulls[1].price;
  if (q.id === "q9") return (S.owned.light ? 0 : X.modules.light.price) + (S.hull >= 3 ? 0 : X.hulls[2].price);
  if (q.id === "q13") return X.hulls[3].price;
  return 0;
}
function checkGrant() {
  const q = curQuest();
  const need = neededPurchase();
  if (!q || !need || S.data >= need || S.grants[q.id]) return;
  const scannable = ANIMALS.filter((a) => a.zone <= S.hull - 1 && !S.scanned[a.id] && (a.zone < 2 || S.owned.light));
  if (scannable.length || dailyAvailable()) return;
  const gift = need - S.data;
  S.grants[q.id] = 1;
  addData(gift);
  Radio.say(["Институт океанологии прочитал наши отчёты и выделил экспедиции грант. Этого хватит на следующую покупку."],
    { extra: `<p class="r-done">+${dataWord(gift)}</p>` });
}

/* =====================================================================
   ИЗУЧЕНИЕ ВИДА (в карточке)
   ===================================================================== */
function scanReward(a) { return Math.round(X.scanData[a.zone] * (S.slots.includes("arm") ? X.armBonus : 1)); }

function renderScan(id, box = $("#dGame")) {
  if (!box) return;
  const a = O.BY_ID[id];
  if (!S.started) { box.innerHTML = ""; return; }
  const sound = X.sounds[id];
  const dark = a.zone >= 2 && !S.slots.includes("light");
  let html = `<section class="scan" id="scan">`;
  if (S.scanned[id]) {
    html += `<div class="scan-head"><span class="scan-k">Атлас экспедиции</span><span class="scan-badge ok">✓ Вид изучен</span></div>`;
    if (sound && !S.evidence[sound]) {
      html += S.slots.includes("hydro")
        ? `<p class="scan-text">У этого вида интересный голос. Гидрофон готов к записи.</p><button class="scan-btn" type="button" data-voice="${id}">Записать голос</button>`
        : `<p class="scan-text">У этого вида интересный голос. Установи гидрофон, чтобы записать его, — это может стать уликой.</p><button class="g-link" type="button" data-journal="sub">Открыть батискаф</button>`;
    } else if (sound) {
      const e = X.evidence[sound];
      html += `<p class="scan-text">Голос записан: «${esc(e.title)}». Улика — в «Расследовании».</p>`;
    }
  } else if (dark) {
    html += `<div class="scan-head"><span class="scan-k">Наблюдение</span><span class="scan-badge">Слишком темно</span></div>
      <p class="scan-text">Глубже 1000 метров солнечного света нет совсем. Чтобы изучить этот вид, установи прожектор.</p>
      <button class="g-link" type="button" data-journal="sub">Открыть батискаф</button>`;
  } else {
    html += `<div class="scan-head"><span class="scan-k">Наблюдение</span><span class="scan-badge">Не изучен</span></div>
      <p class="scan-text">Прочитай карточку и ответь на вопрос — так вид попадёт в атлас. Награда: ${dataWord(scanReward(a))}${S.slots.includes("arm") ? " (с манипулятором)" : ""}.${sound && S.slots.includes("hydro") ? " Гидрофон запишет его голос." : ""}</p>
      <button class="scan-btn" type="button" data-scan="${id}">Изучить вид</button>`;
  }
  html += `<div class="scan-q" id="scanQ"></div></section>
    <section class="notes"><label class="scan-k" for="noteField">Мои заметки</label>
      <textarea id="noteField" rows="3" maxlength="600" placeholder="Что тебя удивило? Что хочешь узнать ещё?">${esc(S.notes[id] || "")}</textarea></section>`;
  box.innerHTML = html;
  const note = $("#noteField", box);
  let tm = 0;
  note.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { S.notes[id] = note.value.trim(); if (!S.notes[id]) delete S.notes[id]; save(); }, 400); });
}

function askScan(id, avoid) {
  const a = O.BY_ID[id];
  const q = makeQuestion(a, avoid);
  const box = $("#scanQ");
  box.innerHTML = `<p class="scan-qt">${esc(q.q)}</p><div class="scan-opts">${q.options.map((o, i) => `<button type="button" data-ans="${i}">${esc(o)}</button>`).join("")}</div><p class="scan-fb" id="scanFb"></p>`;
  const btn = $("[data-scan]"); if (btn) btn.hidden = true;
  gsap.from(box.children, { y: 14, autoAlpha: 0, duration: .5, stagger: .05, ease: "power3.out" });
  $$("[data-ans]", box).forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.ans;
    $$("[data-ans]", box).forEach((x) => { x.disabled = true; });
    if (i === q.correct) {
      b.classList.add("ok");
      completeScan(a);
    } else {
      b.classList.add("bad");
      $("#scanFb").innerHTML = `Неточно. Перечитай карточку выше — ответ там есть. <button class="g-link" type="button" data-retry="${id}" data-avoid="${q.type}">Другой вопрос</button>`;
    }
  }));
  setTimeout(() => box.scrollIntoView({ block: "nearest", behavior: "smooth" }), 80);
}

function scanFx() {
  const m = $("#dMedia");
  if (!m) return;
  const fx = document.createElement("div");
  fx.className = "scan-fx";
  m.appendChild(fx);
  gsap.fromTo(fx, { yPercent: -100 }, { yPercent: 100, duration: 1.1, ease: "power2.inOut", onComplete: () => fx.remove() });
}

function completeScan(a) {
  const reward = scanReward(a);
  S.scanned[a.id] = Date.now();
  S.data += reward;
  const sound = X.sounds[a.id];
  let gotSound = null;
  if (sound && S.slots.includes("hydro") && !S.evidence[sound]) { S.evidence[sound] = 1; gotSound = sound; }
  save();
  scanFx();
  Audio.ping();
  toast(`<b>Вид изучен</b><span>${esc(a.name)} · +${dataWord(reward)}</span>`, "ok");
  if (gotSound) setTimeout(() => toast(`<b>Новая улика</b><span>${esc(X.evidence[gotSound].title)}</span>`, "ev"), 700);
  setTimeout(() => { renderScan(a.id); evaluate(); }, 900);
  renderHud();
  markPage();
}

function recordVoice(id) {
  const sound = X.sounds[id];
  if (!sound || !S.slots.includes("hydro")) return;
  S.evidence[sound] = 1;
  save();
  scanFx();
  Audio.play(X.evidence[sound].spectro);
  toast(`<b>Новая улика</b><span>${esc(X.evidence[sound].title)}</span>`, "ev");
  renderScan(id);
  evaluate();
}

/* ---------- отметки на странице: изучено и сонар ---------- */
function markPage() {
  const sonar = S.slots.includes("sonar");
  $$("#story [data-species], #indexList [data-species]").forEach((el) => {
    const id = el.dataset.species;
    el.classList.toggle("is-scanned", !!S.scanned[id] && S.started);
    el.classList.toggle("sonar-mark", sonar && !S.scanned[id]);
  });
}

/* =====================================================================
   СЕАНС СВЯЗИ: вопрос дня (интервальное повторение)
   ===================================================================== */
function dailyAvailable() {
  return S.started && S.radioDay !== today() && Object.keys(S.scanned).length >= 3;
}
function startDaily() {
  if (!dailyAvailable()) return;
  const ids = Object.keys(S.scanned).filter((id) => O.BY_ID[id]);
  ids.sort((x, y) => (S.asked[x] || 0) - (S.asked[y] || 0) || S.scanned[x] - S.scanned[y]);
  const id = ids[0];
  const a = O.BY_ID[id];
  const q = makeQuestion(a);
  S.asked[id] = Date.now();
  Radio.say([`Сеанс связи. Проверим память: ты уже изучал этот вид — ${lowerFirst(a.name)}. ${q.q}`], {
    okLabel: "Закрыть",
    extra: `<div class="scan-opts r-opts">${q.options.map((o, i) => `<button type="button" data-dans="${i}">${esc(o)}</button>`).join("")}</div><p class="scan-fb" id="dailyFb"></p>`,
    onShow: (box) => {
      $$("[data-dans]", box).forEach((b) => b.addEventListener("click", () => {
        if (S.radioDay === today()) return;
        S.radioDay = today(); S.daily++;
        const i = +b.dataset.dans;
        $$("[data-dans]", box).forEach((x) => { x.disabled = true; });
        $$("[data-dans]", box)[q.correct].classList.add("ok");
        if (i === q.correct) {
          S.data += X.dailyData;
          $("#dailyFb", box).style.color = "var(--ok)";
          $("#dailyFb", box).textContent = `Верно! Память у тебя отличная. +${dataWord(X.dailyData)}. Следующий сеанс связи — завтра.`;
        } else {
          b.classList.add("bad");
          $("#dailyFb", box).innerHTML = `Не совсем. Правильный ответ отмечен. Загляни в карточку, чтобы запомнить. <button class="g-link" type="button" data-open="${id}">Открыть карточку</button>`;
        }
        save(); renderHud(); checkGrant();
      }));
    }
  });
}

/* =====================================================================
   ЖУРНАЛ ЭКСПЕДИЦИИ
   ===================================================================== */
const Journal = (() => {
  const box = $("#journal");
  let tab = "tasks";
  const TABS = [["tasks", "Экспедиция"], ["case", "Расследование"], ["sub", "Батискаф"], ["atlas", "Атлас"], ["save", "Сохранение"]];

  function open(t) {
    if (t) tab = t;
    render();
    box.hidden = false;
    lockScroll(true);
    document.body.classList.add("journal-open");
    gsap.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: .35 });
    gsap.from($(".j-panel", box), { y: 30, duration: .6, ease: "power3.out" });
  }
  function close() {
    gsap.to(box, { autoAlpha: 0, duration: .3, onComplete: () => { box.hidden = true; document.body.classList.remove("journal-open"); lockScroll(false); } });
  }

  function render() {
    $("#jSub").textContent = `Батискаф «${S.sub || "Глубина"}» · данные: ${S.data}`;
    $("#jTabs").innerHTML = TABS.map(([k, n]) => `<button type="button" role="tab" class="${k === tab ? "on" : ""}" data-tab="${k}">${n}${k === "case" && openDeductions() ? '<i class="dot"></i>' : ""}</button>`).join("");
    $$("#jTabs [data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); $("#jBody").scrollTop = 0; }));
    $("#jBody").innerHTML = { tasks: tasksHtml, case: caseHtml, sub: subHtml, atlas: atlasHtml, save: saveHtml }[tab]();
    bind();
  }

  const openDeductions = () => D_KEYS.filter((d) => dedOpen(d) && !S.solved[d]).length;

  /* --- вкладка «Экспедиция» --- */
  function tasksHtml() {
    const q = curQuest();
    const a = X.acts[act()];
    let cur = "";
    if (q) {
      const [d, n] = q.progress(G);
      const link = { q2: "sub", q5: "sub", q9: "sub", q13: "sub", q4: "case", q8: "case", q12: "case", q16: "case" }[q.id];
      cur = `<div class="j-quest"><p class="eyebrow">${a.n} · ${a.title}</p><h3>${esc(q.title)}</h3><p>${esc(q.goal)}</p>
        <div class="j-bar"><i style="transform:scaleX(${clamp(d / n)})"></i></div><p class="j-small">${Math.min(d, n)} из ${n}${q.reward ? ` · награда: ${dataWord(q.reward)}` : ""}</p>
        ${link ? `<button class="g-btn" type="button" data-tab-go="${link}">${link === "sub" ? "Открыть батискаф" : "Открыть расследование"}</button>` : ""}
        ${q.id === "q14" ? '<button class="g-btn" type="button" data-dive-bottom>Спуститься на дно</button>' : ""}</div>`;
    } else {
      cur = `<div class="j-quest"><p class="eyebrow">Экспедиция завершена</p><h3>Свободное погружение</h3><p>Все главы пройдены. Изучай оставшиеся виды и возвращайся на сеансы связи.</p>
        <button class="g-btn" type="button" data-finale>Открыть финал</button></div>`;
    }
    const days = S.days.length;
    const daily = dailyAvailable()
      ? `<button class="g-btn ghost" type="button" data-daily>Начать сеанс связи · +${X.dailyData}</button>`
      : `<p class="j-small">${Object.keys(S.scanned).length < 3 ? "Сеансы связи начнутся, когда изучишь 3 вида." : "Сегодняшний сеанс связи пройден. Следующий — завтра."}</p>`;
    const done = Q.slice(0, S.quest).map((x) => `<li>✓ ${esc(x.title)}</li>`).join("");
    const log = S.log.slice(0, 8).map((l) => `<li>${esc(l.text)}</li>`).join("");
    return `${cur}
      <div class="j-grid">
        <div class="j-stat"><b>${G.scanned()}<small>/${ANIMALS.length}</small></b><span>видов изучено</span></div>
        <div class="j-stat"><b>${O.fmt(S.maxDepth)}<small> м</small></b><span>рекорд глубины</span></div>
        <div class="j-stat"><b>${EV_KEYS.filter((k) => S.evidence[k]).length}<small>/${EV_KEYS.length}</small></b><span>улик</span></div>
        <div class="j-stat"><b>${days}</b><span>${plural(days, "день", "дня", "дней")} в экспедиции</span></div>
      </div>
      <div class="j-block"><h4>Сеанс связи</h4><p class="j-small">Раз в день капитан проверяет, что ты помнишь об изученных видах. Так знания остаются надолго.</p>${daily}</div>
      ${log ? `<div class="j-block"><h4>Последние радиограммы</h4><ul class="j-log">${log}</ul></div>` : ""}
      ${done ? `<div class="j-block"><h4>Выполнено</h4><ul class="j-done">${done}</ul></div>` : ""}`;
  }

  /* --- вкладка «Расследование» --- */
  function evidenceCard(k, selectable, selected) {
    const e = X.evidence[k];
    return `<${selectable ? "button type=\"button\"" : "div"} class="ev ${selected ? "sel" : ""}" data-ev="${k}">
      <span class="ev-src">${esc(e.src)}</span><b>${esc(e.title)}</b>${spectro(e.spectro)}<span class="ev-text">${esc(e.text)}</span>
      ${e.spectro && e.spectro !== "none" && !selectable ? `<span class="g-link" role="button" tabindex="0" data-play="${e.spectro}">▶ Звуковая модель</span>` : ""}
    </${selectable ? "button" : "div"}>`;
  }
  let picks = {};
  function caseHtml() {
    const have = EV_KEYS.filter((k) => S.evidence[k]);
    const deds = D_KEYS.map((d) => {
      const D = X.deductions[d];
      if (S.solved[d]) return `<div class="ded solved"><p class="eyebrow">✓ Проверено</p><h4>${esc(D.title)}</h4><p>${esc(D.ok)}</p></div>`;
      if (!dedOpen(d)) return `<div class="ded locked"><p class="eyebrow">Пока рано</p><h4>${esc(D.title)}</h4><p class="j-small">Сначала собери улики по ходу экспедиции.</p></div>`;
      const st = picks[d] || (picks[d] = { a: -1, ev: [] });
      return `<div class="ded open" data-ded="${d}"><p class="eyebrow">Нужно проверить</p><h4>${esc(D.title)}</h4><p class="ded-q">${esc(D.q)}</p>
        <p class="j-small">1. Выбери ответ.</p>
        <div class="ded-opts">${D.options.map((o, i) => `<button type="button" class="${st.a === i ? "sel" : ""}" data-da="${i}">${esc(o)}</button>`).join("")}</div>
        <p class="j-small">2. Выбери ${D.need.length === 1 ? "улику, которая это доказывает" : `${D.need.length} улики, которые это доказывают`}.</p>
        <div class="ev-grid">${have.map((k) => evidenceCard(k, true, st.ev.includes(k))).join("")}</div>
        <button class="g-btn" type="button" data-check="${d}">Проверить гипотезу</button>
        <p class="ded-fb" id="fb-${d}"></p></div>`;
    }).join("");
    return `<div class="dossier"><p class="eyebrow">Дело № 1997 · «Блуп»</p><h3>Что издало самый загадочный звук океана?</h3>
        <p>Учёные проверяют гипотезы: выдвигают догадку и ищут факты, которые её подтверждают или опровергают. Здесь ты делаешь то же самое.</p>
        <button class="g-btn ghost" type="button" data-play="rise">▶ Звуковая модель «Блупа»</button>
        <p class="j-small">Это ускоренная модель для сравнения, а не настоящая запись.</p></div>
      <div class="j-block"><h4>Гипотезы</h4>${deds}</div>
      <div class="j-block"><h4>Улики · ${have.length} из ${EV_KEYS.length}</h4><div class="ev-grid">${have.map((k) => evidenceCard(k, false)).join("")}</div></div>`;
  }
  function checkDed(d) {
    const D = X.deductions[d], st = picks[d], fb = $(`#fb-${d}`);
    if (st.a < 0) { fb.textContent = "Сначала выбери ответ."; return; }
    if (st.ev.length !== D.need.length) { fb.textContent = `Выбери ${D.need.length === 1 ? "одну улику" : `${D.need.length} улики`}.`; return; }
    if (st.a !== D.correct) { fb.textContent = `${CAPTAIN_LABEL}: «Не торопись. ${D.hintAnswer}»`; gsap.fromTo(fb, { x: -6 }, { x: 0, duration: .4, ease: "elastic.out(1,.3)" }); return; }
    const okEv = D.need.every((k) => st.ev.includes(k));
    if (!okEv) { fb.textContent = `${CAPTAIN_LABEL}: «Ответ верный, но доказательства не те. ${D.hintEvidence}»`; return; }
    S.solved[d] = 1;
    save();
    Audio.ping();
    render();
    evaluate();
  }

  /* --- вкладка «Батискаф» --- */
  let hullCheck = false;
  function subHtml() {
    const near = O.depth <= X.swapDepth;
    const next = X.hulls[S.hull];
    const rating = X.hulls[S.hull - 1].depth;
    const hullRow = X.hulls.map((h, i) => `<span class="hull ${i < S.hull ? "on" : ""}"><b>${h.name.replace("Корпус ", "")}</b>${O.fmt(h.depth)} м</span>`).join("");
    let hullBlock = `<p class="j-small">Корпус выдерживает до ${O.fmt(rating)} м.</p>`;
    if (next) {
      const can = S.data >= next.price;
      hullBlock += hullCheck
        ? `<div class="calc"><p class="eyebrow">Инженер просит проверить расчёт</p><p class="calc-q">${esc(next.check.q)}</p>
            <div class="ded-opts">${next.check.options.map((o, i) => `<button type="button" data-calc="${i}">${esc(o)}</button>`).join("")}</div><p class="ded-fb" id="calcFb"></p></div>`
        : `<button class="g-btn" type="button" data-hull ${can ? "" : "disabled"}>${next.name}: до ${O.fmt(next.depth)} м · ${next.price} данных</button>
           ${can ? "" : `<p class="j-small">Не хватает ${dataWord(next.price - S.data)}. Изучай виды и проходи сеансы связи.</p>`}`;
    } else hullBlock += `<p class="j-small">Это предел: батискаф выдержит дно Марианской впадины.</p>`;
    const used = S.slots.length;
    const mods = M_KEYS.map((k) => {
      const m = X.modules[k];
      const owned = S.owned[k], inst = S.slots.includes(k);
      let btn;
      if (!owned) btn = `<button class="g-btn small" type="button" data-buy="${k}" ${S.data >= m.price ? "" : "disabled"}>Купить · ${m.price}</button>`;
      else if (inst) btn = `<button class="g-btn small ghost" type="button" data-uninstall="${k}" ${near ? "" : "disabled"}>Снять</button>`;
      else btn = `<button class="g-btn small" type="button" data-install="${k}" ${near && used < X.slots ? "" : "disabled"}>Установить</button>`;
      return `<div class="mod ${inst ? "inst" : ""} ${owned ? "owned" : ""}"><span class="mod-ico">${m.icon}</span><div><b>${m.name}</b><p>${esc(m.text)}</p>
        <span class="mod-st">${inst ? "Установлен" : owned ? "На складе" : "Не куплен"}</span></div>${btn}</div>`;
    }).join("");
    return `<div class="sub-head"><p class="eyebrow">Научный батискаф</p><h3>«${esc(S.sub || "Глубина")}»</h3></div>
      <div class="j-block"><h4>Корпус</h4><div class="hulls">${hullRow}</div>${hullBlock}</div>
      <div class="j-block"><h4>Модули · слоты ${used} из ${X.slots}</h4>
        <p class="j-small">Слотов только ${X.slots} — выбирай, что важнее для следующего погружения. ${near ? "Батискаф у поверхности: модули можно менять." : `Модули меняют только у поверхности (мельче ${X.swapDepth} м). Сейчас глубина ${O.fmt(O.depth)} м.`}</p>
        ${near ? "" : '<button class="g-btn ghost" type="button" data-ascend>Всплыть к поверхности</button>'}
        <div class="mods">${mods}</div></div>`;
  }
  function buyHull() {
    const next = X.hulls[S.hull];
    if (!next || S.data < next.price) return;
    S.data -= next.price;
    S.hull++;
    hullCheck = false;
    save();
    Audio.ping();
    O.setMaxZone(S.hull - 1);
    close();
    evaluate();
    setTimeout(() => { O.scrollToZone(S.hull - 1); toast(`<b>${esc(next.name)} установлен</b><span>Теперь можно спуститься до ${O.fmt(next.depth)} м</span>`, "ok"); }, 450);
  }

  /* --- вкладка «Атлас» --- */
  function atlasHtml() {
    return O.ZONES.map((z, zi) => {
      const list = O.ORDER.map((id) => O.BY_ID[id]).filter((a) => a.zone === zi);
      const n = list.filter((a) => S.scanned[a.id]).length;
      const locked = zi > S.hull - 1;
      return `<div class="j-block atlas-zone"><h4>${z.name} <small>${n}/${list.length}</small></h4><div class="j-bar"><i style="transform:scaleX(${n / list.length})"></i></div>
        <div class="atlas-list">${list.map((a) => locked
          ? '<span class="atl locked">Неизвестный вид</span>'
          : `<button type="button" class="atl ${S.scanned[a.id] ? "ok" : ""}" data-open="${a.id}">${S.scanned[a.id] ? "✓ " : ""}${esc(a.name)}${S.notes[a.id] ? " ✎" : ""}</button>`).join("")}</div></div>`;
    }).join("");
  }

  /* --- вкладка «Сохранение» --- */
  function saveHtml() {
    const code = encode();
    const link = location.protocol.startsWith("http") ? `${location.href.split("#")[0]}#code=${code}` : "";
    return `<div class="j-block"><h4>Прогресс сохраняется сам</h4><p class="j-small">Всё запоминается в этом браузере автоматически. Но если почистить браузер или сменить устройство, прогресс пропадёт. Поэтому есть код экспедиции.</p></div>
      <div class="j-block"><h4>Код экспедиции</h4><p class="j-small">Перепиши код на бумагу или сфотографируй. По нему можно продолжить на любом устройстве. Заметки и имя батискафа в код не входят — их сохраняет файл ниже.</p>
        <div class="code-show">${code}</div>
        <div class="j-row"><button class="g-btn" type="button" data-copycode>Скопировать код</button>${link ? `<button class="g-btn ghost" type="button" data-copylink="${esc(link)}">Скопировать ссылку для другого устройства</button>` : ""}</div></div>
      <div class="j-block"><h4>Продолжить по коду</h4><div class="j-row"><input id="codeIn" class="g-input" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XX" autocomplete="off" spellcheck="false"><button class="g-btn" type="button" data-loadcode>Загрузить</button></div><p class="ded-fb" id="codeFb"></p></div>
      <div class="j-block"><h4>Резервная копия файлом</h4><p class="j-small">Полная копия вместе с заметками.</p>
        <div class="j-row"><button class="g-btn ghost" type="button" data-export>Сохранить файл</button><label class="g-btn ghost">Загрузить файл<input type="file" accept=".json,application/json" id="fileIn" hidden></label></div><p class="ded-fb" id="fileFb"></p></div>
      <div class="j-block danger" id="resetBox"><button class="g-link" type="button" data-reset>Начать экспедицию заново</button></div>`;
  }

  function bind() {
    const body = $("#jBody");
    body.onclick = (e) => {
      const t = e.target.closest("button, [data-play], label");
      if (!t) return;
      const d = t.dataset;
      if (d.open) { close(); return; }
      if (d.tabGo) { tab = d.tabGo; render(); }
      else if ("diveBottom" in d) { close(); setTimeout(() => O.scrollToY(document.body.scrollHeight, 5), 350); }
      else if ("daily" in d) { close(); setTimeout(startDaily, 350); }
      else if ("finale" in d) { close(); setTimeout(Finale.show, 350); }
      else if (d.play) { e.preventDefault(); Audio.play(d.play); }
      else if (d.da !== undefined) { const ded = t.closest("[data-ded]").dataset.ded; picks[ded].a = +d.da; render(); }
      else if (d.ev && t.closest("[data-ded]")) {
        const ded = t.closest("[data-ded]").dataset.ded, st = picks[ded];
        st.ev = st.ev.includes(d.ev) ? st.ev.filter((k) => k !== d.ev) : st.ev.concat(d.ev).slice(-X.deductions[ded].need.length);
        render();
      }
      else if (d.check) checkDed(d.check);
      else if ("hull" in d) { hullCheck = true; render(); }
      else if (d.calc !== undefined) {
        const next = X.hulls[S.hull], fb = $("#calcFb");
        if (+d.calc === next.check.correct) { fb.textContent = `Верно! ${next.check.why}`; $$("[data-calc]").forEach((b) => { b.disabled = true; }); t.classList.add("ok"); setTimeout(buyHull, 1800); }
        else { t.classList.add("bad"); fb.textContent = "Пересчитай: раздели глубину на 10 и прибавь 1 атмосферу воздуха."; }
      }
      else if (d.buy) { const m = X.modules[d.buy]; if (S.data >= m.price) { S.data -= m.price; S.owned[d.buy] = 1; if (S.slots.length < X.slots && O.depth <= X.swapDepth) S.slots.push(d.buy); save(); Audio.ping(); render(); evaluate(); markPage(); } }
      else if (d.install) { if (S.slots.length < X.slots) { S.slots.push(d.install); save(); render(); evaluate(); markPage(); } }
      else if (d.uninstall) { S.slots = S.slots.filter((k) => k !== d.uninstall); save(); render(); markPage(); }
      else if ("ascend" in d) { close(); O.ascend(() => { Journal.open("sub"); }); }
      else if ("copycode" in d) copy(encode(), t);
      else if (d.copylink) copy(d.copylink, t);
      else if ("loadcode" in d) {
        const st = decode($("#codeIn").value);
        if (!st) { $("#codeFb").textContent = "Код не подходит. Проверь буквы и цифры."; return; }
        $("#codeFb").innerHTML = `Код верный: изучено видов — ${Object.keys(st.scanned).length}. Текущий прогресс на этом устройстве заменится. <button class="g-link" type="button" data-applycode>Загрузить</button>`;
        $("[data-applycode]").onclick = () => applyState(st);
      }
      else if ("export" in d) exportFile();
      else if ("reset" in d) {
        $("#resetBox").innerHTML = `<p>Точно начать заново? Весь прогресс на этом устройстве пропадёт. Код экспедиции лучше сначала записать.</p><div class="j-row"><button class="g-btn ghost" type="button" data-noreset>Отмена</button><button class="g-btn danger" type="button" data-yesreset>Да, начать заново</button></div>`;
      }
      else if ("noreset" in d) render();
      else if ("yesreset" in d) { try { localStorage.removeItem(KEY); } catch (err) { /* нет хранилища */ } location.reload(); }
    };
    const fileIn = $("#fileIn");
    if (fileIn) fileIn.onchange = () => {
      const f = fileIn.files[0];
      if (!f) return;
      f.text().then((txt) => {
        const st = JSON.parse(txt);
        if (!st || st.v !== 1 || typeof st.scanned !== "object") throw new Error("bad");
        S = Object.assign(fresh(), st); save(); location.reload();
      }).catch(() => { $("#fileFb").textContent = "Этот файл не подходит."; });
    };
  }

  $("#jClose").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden && !e.target.closest("input, textarea")) close(); });
  return { open, close, render, isOpen: () => !box.hidden };
})();

function copy(text, btn) {
  const done = () => { const o = btn.textContent; btn.textContent = "Скопировано ✓"; setTimeout(() => { btn.textContent = o; }, 1600); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => fallback());
  else fallback();
  function fallback() {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { prompt("Скопируй код:", text); }
    ta.remove();
  }
}
function bindCopy(box) { $$("[data-copycode]", box).forEach((b) => { b.onclick = () => copy(encode(), b); }); }
function exportFile() {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ekspeditsiya-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* =====================================================================
   ПРОЛОГ
   ===================================================================== */
const Prologue = (() => {
  const box = $("#prologue");
  let raf = 0;
  function wave() {
    const cv = $("#proWave"), ctx = cv.getContext("2d");
    const draw = (t) => {
      const W = cv.width = cv.clientWidth * 2, H = cv.height = cv.clientHeight * 2;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(159,230,255,.75)";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const k = x / W, env = Math.sin(Math.PI * k) ** 2;
        const f = 6 + k * 18;
        const y = H / 2 + Math.sin(k * f * Math.PI + t / 280) * env * H * .32 * (.6 + .4 * Math.sin(t / 900));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
  }
  function show() {
    box.hidden = false;
    lockScroll(true);
    wave();
    let i = 0;
    const lines = X.prologue.map(fill);
    const text = $("#proText"), btn = $("#proNext");
    const step = () => {
      if (i < lines.length) {
        gsap.to(text, { autoAlpha: 0, y: -8, duration: .25, onComplete: () => {
          text.textContent = lines[i++];
          gsap.fromTo(text, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .6, ease: "power3.out" });
          btn.textContent = "Дальше";
        } });
      } else {
        $("#proStory").hidden = true;
        $("#proName").hidden = false;
        gsap.from("#proName > *", { y: 16, autoAlpha: 0, stagger: .08, duration: .6 });
        setTimeout(() => $("#subName").focus(), 200);
      }
    };
    btn.onclick = () => { Audio.init(); step(); };
    step();
    gsap.from(".pro-inner > *", { y: 20, autoAlpha: 0, stagger: .1, duration: .9, ease: "power3.out" });
    $("#proPlay").onclick = () => Audio.play("rise");
    $("#proStart").onclick = start;
    $("#subName").onkeydown = (e) => { if (e.key === "Enter") start(); };
    $("#proHaveCode").onclick = () => { $("#proCode").hidden = !$("#proCode").hidden; if (!$("#proCode").hidden) $("#proCodeIn").focus(); };
    $("#proCodeGo").onclick = () => {
      const st = decode($("#proCodeIn").value);
      if (!st) { $("#proCodeFb").textContent = "Код не подходит. Проверь буквы и цифры."; return; }
      applyState(st);
    };
  }
  function start() {
    S.sub = ($("#subName").value.trim() || "Глубина").slice(0, 24);
    S.started = true;
    save();
    cancelAnimationFrame(raf);
    gsap.to(box, { autoAlpha: 0, duration: .6, onComplete: () => { box.hidden = true; lockScroll(false); } });
    refreshAll();
    Radio.say([
      `Батискаф «${S.sub}» готов к погружению.`,
      "Первая задача: изучи три любых вида. Листай вниз, открывай карточки животных и нажимай «Изучить вид». Отвечать придётся по тексту карточки — так что читай внимательно.",
      "Внизу экрана — текущая задача и журнал экспедиции. В журнале есть батискаф, расследование, атлас и код сохранения."
    ]);
  }
  return { show };
})();

/* =====================================================================
   ФИНАЛ
   ===================================================================== */
const Finale = (() => {
  const box = $("#finale");
  function show() {
    S.finaleSeen = true; save();
    const msg = isSet(CONFIG.finalMessage) ? CONFIG.finalMessage : "Настоящий океан ждёт тебя. Готовься к экспедиции!";
    const date = isSet(CONFIG.finalDate) ? CONFIG.finalDate : "";
    const from = isSet(CONFIG.fromWho) ? CONFIG.fromWho : "";
    $("#finBody").innerHTML = `
      <p class="eyebrow">Экспедиция «Зов глубины» завершена</p>
      <h2 class="display-m">Дело «Блуп» раскрыто</h2>
      <p class="lead">${esc(NAME.charAt(0).toUpperCase() + NAME.slice(1))}, ты прошёл путь от поверхности до дна Марианской впадины и разгадал загадку, над которой учёные думали годами.</p>
      <div class="j-grid fin-stats">
        <div class="j-stat"><b>${G.scanned()}<small>/${ANIMALS.length}</small></b><span>видов изучено</span></div>
        <div class="j-stat"><b>≈${O.fmt(10935)}<small> м</small></b><span>глубина</span></div>
        <div class="j-stat"><b>${EV_KEYS.filter((k) => S.evidence[k]).length}</b><span>улик собрано</span></div>
        <div class="j-stat"><b>${S.days.length}</b><span>${plural(S.days.length, "день", "дня", "дней")} в экспедиции</span></div>
      </div>
      <div class="fin-letter">
        <p class="eyebrow">Последняя радиограмма · ${esc(CAPTAIN_LABEL)}</p>
        <p class="fin-msg">${esc(msg)}</p>
        ${date ? `<p class="fin-date">${esc(date)}</p>` : ""}
        ${from ? `<p class="fin-from">${esc(from)}</p>` : ""}
      </div>
      <div class="j-block"><h4>Задания для настоящей экспедиции</h4><ol class="real-list">${X.realWorld.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></div>
      <button class="g-btn" type="button" id="finClose">Продолжить свободное погружение</button>`;
    box.hidden = false;
    lockScroll(true);
    gsap.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 });
    gsap.from("#finBody > *", { y: 30, autoAlpha: 0, stagger: .12, duration: 1, ease: "power3.out", delay: .3 });
    $("#finClose").onclick = () => gsap.to(box, { autoAlpha: 0, duration: .5, onComplete: () => { box.hidden = true; lockScroll(false); renderHud(); } });
  }
  return { show };
})();

/* =====================================================================
   ЗАБОТА: перерыв после долгой игры
   ===================================================================== */
(function breakReminder() {
  let active = 0, last = Date.now(), shown = false;
  setInterval(() => {
    const now = Date.now();
    if (document.visibilityState === "visible" && S.started) active += now - last;
    last = now;
    if (!shown && active > X.breakMinutes * 60000) {
      shown = true;
      Radio.say(["Экипаж поднимается на палубу на перерыв. Отдохни минут десять: посмотри вдаль, разомнись, выпей воды. Батискаф подождёт — прогресс сохранён."], { from: `Связь · ${CAPTAIN_LABEL}`, okLabel: "Хорошо" });
    }
  }, 15000);
})();

/* =====================================================================
   ПОДКЛЮЧЕНИЕ К ПОГРУЖЕНИЮ
   ===================================================================== */
window.OceanGame = {
  maxZone: () => S.hull - 1,
  attach(ocean) {
    O = ocean;
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* не поддерживается */ }
    if (S.started && !S.days.includes(today())) { S.days.push(today()); save(); }

    O.on("drawer", (a, box) => renderScan(a.id, box));
    O.on("index", () => markPage());
    O.on("build", () => markPage());
    O.on("action", (name) => { if (name === "sub") Journal.open("sub"); });
    let saveT = 0;
    O.on("depth", (d) => {
      if (!S.started || d <= S.maxDepth + 1) return;
      S.maxDepth = Math.round(d);
      clearTimeout(saveT);
      saveT = setTimeout(() => { save(); if (curQuest() && curQuest().id === "q14") evaluate(); }, 400);
    });

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-scan], [data-voice], [data-retry], [data-journal]");
      if (!t) return;
      if (t.dataset.scan) askScan(t.dataset.scan);
      else if (t.dataset.voice) recordVoice(t.dataset.voice);
      else if (t.dataset.retry) askScan(t.dataset.retry, t.dataset.avoid);
      else if (t.dataset.journal) { O.closeSpecies(); setTimeout(() => Journal.open(t.dataset.journal), 300); }
    });
    $("#hudTask").addEventListener("click", () => Journal.open("tasks"));
    $("#hudJournal").addEventListener("click", () => Journal.open());
    $("#hudRadio").addEventListener("click", startDaily);

    markPage();
    renderHud();

    const m = location.hash.match(/code=([0-9A-Za-zА-Яа-я-]+)/);
    const fromLink = m ? decode(decodeURIComponent(m[1])) : null;
    if (fromLink) {
      Radio.say(["По ссылке пришёл код экспедиции. Загрузить этот прогресс? То, что сохранено на этом устройстве, заменится."], {
        okLabel: "Не загружать",
        extra: `<p class="r-done">Изучено видов: ${Object.keys(fromLink.scanned).length}</p><button class="g-btn" type="button" id="useLink">Загрузить прогресс</button>`,
        onShow: (box) => { $("#useLink", box).onclick = () => applyState(fromLink); },
        onClose: () => { history.replaceState(null, "", location.pathname + location.search); }
      });
    } else if (!S.started) {
      setTimeout(Prologue.show, 900);
    } else {
      const q = curQuest();
      setTimeout(() => toast(`<b>С возвращением на борт</b><span>${q ? esc(q.title) : "Свободное погружение"}</span>`), 1200);
      if (dailyAvailable()) setTimeout(() => toast("<b>Сеанс связи доступен</b><span>Кнопка с антенной внизу</span>", "ev"), 2600);
      evaluate();
    }
  }
};
})();
