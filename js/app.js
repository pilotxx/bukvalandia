'use strict';
/* ============================================================
   Букваландия — приложение
   ============================================================ */

const KEY = 'bukvalandia_v1';
const VERSION = 1;
const LESSON_LEN = 10;
let S = null;               // состояние
let TAB = 'map';
let SHOP_TAB = 'food';
let L = null;               // активный урок / бой / работа над ошибками
let modalOpen = 0;
const Q = [];               // очередь праздничных окон
const ACTIVE = { ms: 0, last: Date.now(), due: false };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ============================================================
   СОСТОЯНИЕ
   ============================================================ */
function defaults() {
  return {
    v: VERSION, created: Date.now(), name: '', onboarded: false,
    coins: 0, earned: 0, xp: 0,
    stars: {}, stats: {}, bosses: {},
    history: {}, streak: { last: '', count: 0, best: 0 }, bestCombo: 0,
    pet: { species: 'dragon', name: '', color: null, hat: null, glasses: null, neck: null, satiety: 70, tick: Date.now(), stageSeen: 0 },
    owned: { th_sky: true }, food: {}, hidden: {},
    theme: 'sky', ach: {}, mistakes: [],
    weekly: { week: '', ids: [], prog: {}, done: {}, bonus: false, days: [] },
    counters: { lessons: 0, correct: 0, wrong: 0, perfect: 0, fixed: 0, bought: 0, fed: 0, weeklyAll: 0 },
    records: { balloons: 0, memory: 0 },
    settings: { sound: true, tts: true, dailyLimit: 500, breakMin: 20, openAll: false },
    parent: {
      pin: null, requests: [],
      prizes: [{ id: 'p1', name: 'Выбрать десерт на ужин', price: 1000 }, { id: 'p2', name: '30 минут мультиков', price: 1500 }, { id: 'p3', name: 'Поход в кино', price: 6000 }],
    },
    lastBackup: 0, limitToast: '',
  };
}
function merge(d, o) {
  if (o === undefined || o === null) return d;
  if (typeof d !== 'object' || d === null || Array.isArray(d) || typeof o !== 'object' || Array.isArray(o)) return o;
  const r = { ...d };
  for (const k of Object.keys(o)) r[k] = merge(d[k], o[k]);
  return r;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    S = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
  } catch (e) { S = defaults(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* хранилище недоступно */ }
}
function day() {
  const k = U.dayKey();
  if (!S.history[k]) {
    S.history[k] = { time: 0, correct: 0, wrong: 0, coins: 0, games: 0 };
    const keys = Object.keys(S.history).sort();
    while (keys.length > 120) delete S.history[keys.shift()];
  }
  return S.history[k];
}

/* ---------- Производные величины ---------- */
const totalStars = () => Object.values(S.stars).reduce((a, b) => a + b, 0) + Object.keys(S.bosses).length * 3;
const lvl = () => LEVEL.of(S.xp);
const petStage = () => { const t = totalStars(); let s = 0; PET_STAGES.forEach((p, i) => { if (t >= p.at) s = i; }); return s; };
const petColor = () => (S.pet.color && ITEMS[S.pet.color]) ? ITEMS[S.pet.color].color : PET_SPECIES[S.pet.species].color;
const petMood = () => S.pet.satiety < 30 ? 'sad' : 'happy';
const icon = id => id && ITEMS[id] ? ITEMS[id].icon : null;
function petSVG(extra = {}) {
  return Pet.svg(Object.assign({
    species: S.pet.species, color: petColor(), stage: petStage(),
    hat: icon(S.pet.hat), glasses: icon(S.pet.glasses), neck: icon(S.pet.neck), mood: petMood(),
  }, extra));
}
const streakNow = () => {
  const y = U.dayKey(new Date(Date.now() - 86400000));
  return (S.streak.last === U.dayKey() || S.streak.last === y) ? S.streak.count : 0;
};
const worldOpen = wi => wi === 0 || S.settings.openAll || !!S.bosses[WORLDS[wi - 1].id];
function lessonOpen(les) {
  if (!worldOpen(les.wi)) return false;
  if (S.settings.openAll || les.li === 0) return true;
  return (S.stars[les.world.lessons[les.li - 1].id] || 0) >= 1;
}
const bossReady = w => worldOpen(WORLDS.indexOf(w)) && w.lessons.every(l => (S.stars[l.id] || 0) >= 2);
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* ---------- Время: смена дня, голод питомца, неделя ---------- */
function tick() {
  day();
  const now = Date.now();
  const h = (now - S.pet.tick) / 3600000;
  if (h > 0) { S.pet.satiety = Math.max(0, S.pet.satiety - h * 1.5); S.pet.tick = now; }
  ensureWeek();
}

/* ============================================================
   НАГРАДЫ
   ============================================================ */
function earnCoins(n, bypass = false) {
  n = Math.max(0, Math.round(n));
  let add = n;
  const d = day();
  if (!bypass) {
    const lim = S.settings.dailyLimit;
    if (lim > 0) add = Math.min(n, Math.max(0, lim - d.coins));
    d.coins += add;
    if (lim > 0 && d.coins >= lim && S.limitToast !== U.dayKey()) {
      S.limitToast = U.dayKey();
      celebrate(() => modal({
        html: `<div class="m-icon">🌙</div><h2>Монетки на сегодня собраны!</h2><p>Ты отлично потрудился. Звёзды и опыт продолжают копиться, а новые монетки будут завтра.</p>`,
      }));
    }
  }
  S.coins += add; S.earned += add;
  return add;
}
function addXP(n) {
  const before = lvl();
  S.xp += Math.round(n);
  const after = lvl();
  for (let L2 = before + 1; L2 <= after; L2++) {
    const bonus = 40 * L2;
    earnCoins(bonus, true);
    const newItems = SHOP.filter(i => i.lvl === L2);
    celebrate(() => {
      Sound.play('level'); confetti();
      modal({
        cls: 'celebrate',
        html: `<div class="lvl-burst">${L2}</div><h2>Новый уровень!</h2><p>${LEVEL.title(L2) !== LEVEL.title(L2 - 1) ? `Новое звание: <b>${LEVEL.title(L2)}</b>!` : 'Так держать!'}</p><p class="reward">+${bonus} <i class="ci"></i></p>
          ${newItems.length ? `<p class="small">В магазине открылось:</p><div class="unlock-row">${newItems.map(i => `<span title="${i.name}">${i.icon}</span>`).join('')}</div>` : ''}`,
        buttons: [{ label: 'Ура!', cls: 'primary' }],
      });
    });
  }
}

const ACH_TEST = {
  first: () => S.counters.lessons >= 1,
  star3: () => Object.values(S.stars).some(v => v >= 3),
  stars10: () => totalStars() >= 10, stars30: () => totalStars() >= 30, stars60: () => totalStars() >= 60, stars100: () => totalStars() >= 100,
  streak3: () => S.streak.best >= 3, streak7: () => S.streak.best >= 7, streak14: () => S.streak.best >= 14, streak30: () => S.streak.best >= 30,
  combo10: () => S.bestCombo >= 10, combo25: () => S.bestCombo >= 25,
  correct100: () => S.counters.correct >= 100, correct500: () => S.counters.correct >= 500, correct1000: () => S.counters.correct >= 1000,
  perfect5: () => S.counters.perfect >= 5, fix20: () => S.counters.fixed >= 20,
  shop1: () => S.counters.bought >= 1, feed10: () => S.counters.fed >= 10,
  pet2: () => petStage() >= 2, pet3: () => petStage() >= 3, pet4: () => petStage() >= 4,
  level5: () => lvl() >= 5, level10: () => lvl() >= 10, level15: () => lvl() >= 15,
  weekly1: () => S.counters.weeklyAll >= 1,
  hero: () => WORLDS.every(w => S.bosses[w.id]),
};
WORLDS.forEach(w => { ACH_TEST['boss_' + w.id] = () => !!S.bosses[w.id]; });

function checkAch() {
  ACH.forEach(a => {
    if (S.ach[a.id] || !ACH_TEST[a.id] || !ACH_TEST[a.id]()) return;
    S.ach[a.id] = Date.now();
    earnCoins(a.reward, true);
    celebrate(() => {
      Sound.play('star');
      modal({
        cls: 'celebrate',
        html: `<div class="medal-big">${a.icon}</div><p class="small">Новая медаль!</p><h2>${a.name}</h2><p>${a.desc}</p><p class="reward">+${a.reward} <i class="ci"></i></p>`,
        buttons: [{ label: 'Здорово!', cls: 'primary' }],
      });
    });
  });
}

/* ---------- Недельные испытания ---------- */
function ensureWeek() {
  const wk = U.weekKey();
  if (S.weekly.week === wk) return;
  const rnd = U.seeded(U.hash(wk));
  const below3 = Object.keys(LESSONS).filter(id => (S.stars[id] || 0) < 3).length;
  let pool = WEEKLY_POOL.filter(c => (c.ev !== 'star' || TOTAL_STARS - totalStars() >= c.goal + 2) && (c.ev !== 'three' || below3 >= 4));
  pool = pool.map(c => [rnd(), c]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  S.weekly = { week: wk, ids: pool.slice(0, 3).map(c => c.id), prog: {}, done: {}, bonus: false, days: [] };
}
function weekly(ev, n = 1) {
  S.weekly.ids.forEach(id => {
    const c = WEEKLY_POOL.find(x => x.id === id);
    if (!c || c.ev !== ev || S.weekly.done[id]) return;
    S.weekly.prog[id] = c.max ? Math.max(S.weekly.prog[id] || 0, n) : (S.weekly.prog[id] || 0) + n;
    if (S.weekly.prog[id] >= c.goal) {
      S.weekly.done[id] = true;
      earnCoins(WEEKLY_REWARD, true);
      celebrate(() => {
        Sound.play('star');
        modal({ cls: 'celebrate', html: `<div class="m-icon">📅</div><p class="small">Испытание недели выполнено!</p><h2>${c.text}</h2><p class="reward">+${WEEKLY_REWARD} <i class="ci"></i></p>`, buttons: [{ label: 'Отлично!', cls: 'primary' }] });
      });
    }
  });
  if (!S.weekly.bonus && S.weekly.ids.length && S.weekly.ids.every(id => S.weekly.done[id])) {
    S.weekly.bonus = true;
    S.counters.weeklyAll++;
    const item = EXCLUSIVE.find(x => !S.owned[x.id]);
    if (item) S.owned[item.id] = true;
    celebrate(() => {
      Sound.play('level'); confetti();
      modal({
        cls: 'celebrate',
        html: item
          ? `<div class="medal-big">${item.icon}</div><p class="small">Все испытания недели пройдены!</p><h2>Редкий подарок: ${item.name}</h2><p>Его нельзя купить в магазине. Он уже стоит в домике питомца!</p>`
          : `<div class="medal-big">🎁</div><h2>Все испытания недели пройдены!</h2><p class="reward">+300 <i class="ci"></i></p>`,
        buttons: [{ label: 'Ура!', cls: 'primary' }],
      });
      if (!item) earnCoins(300, true);
    });
  }
}

/* ---------- Ошибки (интервальное повторение) ---------- */
function addMistake(l, i, label) {
  const m = S.mistakes.find(x => x.l === l && x.i === i);
  if (m) { m.n++; m.t = Date.now(); m.label = label; }
  else S.mistakes.push({ l, i, n: 1, t: Date.now(), label });
  if (S.mistakes.length > 80) { S.mistakes.sort((a, b) => b.n - a.n || b.t - a.t); S.mistakes.length = 80; }
}
function fixMistake(l, i) {
  const k = S.mistakes.findIndex(x => x.l === l && x.i === i);
  if (k < 0) return false;
  S.mistakes[k].n--;
  if (S.mistakes[k].n <= 0) S.mistakes.splice(k, 1);
  S.counters.fixed++;
  weekly('fix');
  return true;
}

/* ============================================================
   ОКНА, ТОСТЫ, КОНФЕТТИ
   ============================================================ */
function modal({ html, buttons = [{ label: 'Хорошо', cls: 'primary' }], cls = '', onClose, dismiss = true }) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal ${cls}" role="dialog">${html}<div class="modal-btns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-mb="${i}">${b.label}</button>`).join('')}</div></div>`;
  $('#modal-root').appendChild(wrap);
  modalOpen++;
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    wrap.classList.add('out');
    setTimeout(() => wrap.remove(), 180);
    modalOpen--;
    if (onClose) onClose();
    setTimeout(flushQueue, 220);
  };
  wrap.addEventListener('click', ev => {
    const b = ev.target.closest('[data-mb]');
    if (b) {
      Sound.play('tap');
      const bt = buttons[+b.dataset.mb];
      const r = bt.onClick ? bt.onClick(wrap) : undefined;
      if (r !== false) close();
    } else if (dismiss && ev.target === wrap) close();
  });
  wrap.close = close;
  return wrap;
}
function confirmBox(html, yes, onYes, no = 'Отмена') {
  return modal({ html, buttons: [{ label: no, cls: 'ghost' }, { label: yes, cls: 'primary', onClick: onYes }] });
}
function celebrate(fn, first = false) { if (first) Q.unshift(fn); else Q.push(fn); }
function flushQueue() {
  if (modalOpen > 0 || L || $('.overlay')) return;
  const fn = Q.shift();
  if (fn) { fn(); save(); render(); return; }
  if (ACTIVE.due) { ACTIVE.due = false; showBreak(); }
}
function toast(text, cls = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + cls;
  t.innerHTML = text;
  $('#toast-root').appendChild(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2600);
}
function confetti(n = 70) {
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#FF6B9A', '#FFD34E', '#5ED6A0', '#6EC6FF', '#B39DFF', '#FF9F43'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = U.rnd(colors);
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3600);
}
function bump(sel) {
  const el = $(sel); if (!el) return;
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

/* ---------- Кнопка «Назад» на Android ---------- */
const Back = {
  stack: [], skip: 0,
  push(fn) { this.stack.push(fn); history.pushState({ b: this.stack.length }, ''); },
  done() { if (this.stack.length) { this.stack.pop(); this.skip++; history.back(); } },
};
window.addEventListener('popstate', () => {
  if (Back.skip) { Back.skip--; return; }
  if (modalOpen > 0) {
    const w = $$('.modal-wrap').pop();
    if (w && w.close) w.close();
    history.pushState({}, '');
    return;
  }
  const fn = Back.stack.pop();
  if (fn && fn() === false) { Back.stack.push(fn); history.pushState({}, ''); }
});

/* ============================================================
   ОТРИСОВКА: каркас
   ============================================================ */
function applyTheme() {
  document.documentElement.dataset.theme = S.theme || 'sky';
  Sound.enabled = S.settings.sound;
  Speech.enabled = S.settings.tts;
}
function render() {
  applyTheme();
  renderTop();
  const scr = $('#screen');
  const y = scr.scrollTop;
  if (TAB === 'map') scr.innerHTML = renderMap();
  else if (TAB === 'pet') scr.innerHTML = renderPet();
  else if (TAB === 'shop') scr.innerHTML = renderShop();
  else if (TAB === 'awards') scr.innerHTML = renderAwards();
  scr.dataset.tab = TAB;
  if (scr.dataset.keep === TAB) scr.scrollTop = y;
  scr.dataset.keep = TAB;
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.arg === TAB));
  const on = $('.tabs .tab.on', scr);
  if (on) on.parentElement.scrollLeft = on.offsetLeft - on.parentElement.clientWidth / 2 + on.clientWidth / 2;
}
function renderTop() {
  const L2 = lvl(), x0 = LEVEL.start(L2), need = LEVEL.need(L2);
  const p = Math.min(1, (S.xp - x0) / need);
  const st = streakNow();
  $('#topbar').innerHTML = `
    <button class="lvl" data-act="tab" data-arg="awards" aria-label="Уровень ${L2}">
      <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="ring-bg"/><circle cx="22" cy="22" r="19" class="ring" style="stroke-dasharray:${(p * 119.4).toFixed(1)} 200"/></svg>
      <span>${L2}</span></button>
    <div class="who"><b>${U.esc(S.name || 'Герой')}</b><small>${LEVEL.title(L2)}</small></div>
    <div class="chips">
      <span class="chip ${st ? 'fire' : 'cold'}" title="Дней подряд">🔥<b>${st}</b></span>
      <span class="chip" id="chip-stars" title="Звёзды">⭐<b>${totalStars()}</b></span>
      <span class="chip coin" id="chip-coins" title="Монеты"><i class="ci"></i><b>${fmt(S.coins)}</b></span>
    </div>
    <button class="gear" data-act="parent" aria-label="Для взрослых">⚙️</button>`;
}

/* ============================================================
   КАРТА
   ============================================================ */
function petPhrase() {
  const n = U.esc(S.name || 'друг');
  if (petStage() === 0) return 'Я ещё в яйце! Получи первую звезду — и я вылуплюсь 🥚';
  if (S.pet.satiety < 30) return `${n}, я проголодался… Покорми меня, пожалуйста! 🍎`;
  if (S.mistakes.length >= 5) return 'Давай исправим ошибки — за это дают монетки! 🩹';
  return U.rnd([`Привет, ${n}! Отправимся в путь?`, 'Каждая звезда делает меня сильнее! ⭐', 'Вперёд, к новой теме!', 'Мне так нравится учиться с тобой!',
    'Кляксус не дремлет — нужно спешить!', 'Три звезды за урок — это настоящее мастерство!']);
}
function renderMap() {
  const backupDue = S.counters.lessons >= 3 && Date.now() - S.lastBackup > 7 * 86400000;
  let h = `<div class="map">
    <div class="hello" data-act="tab" data-arg="pet"><div class="hello-pet">${petSVG({ uid: 'hp' })}</div><div class="bubble">${petPhrase()}</div></div>`;
  if (backupDue) h += `<button class="banner warn" data-act="parent" data-arg="backup">🛟 Пора сохранить прогресс — позови взрослого</button>`;
  if (S.mistakes.length) {
    h += `<button class="fix-card" data-act="fix"><span class="fix-ic">🩹</span><span><b>Работа над ошибками</b><small>Ошибок: ${S.mistakes.length} · +15 <i class="ci"></i> за каждую исправленную</small></span><span class="go">›</span></button>`;
  }
  WORLDS.forEach((w, wi) => {
    const open = worldOpen(wi);
    const got = w.lessons.reduce((a, l) => a + (S.stars[l.id] || 0), 0) + (S.bosses[w.id] ? 3 : 0);
    const max = w.lessons.length * 3 + 3;
    const n = w.lessons.length + 1, gapY = 150, H = (n - 1) * gapY + 150;
    const pts = [];
    for (let i = 0; i < n; i++) pts.push([50 + Math.sin(i * 1.3 + wi * 0.9) * 24, 64 + i * gapY]);
    let path = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < n; i++) path += ` C${pts[i - 1][0]} ${pts[i - 1][1] + 58} ${pts[i][0]} ${pts[i][1] - 58} ${pts[i][0]} ${pts[i][1]}`;
    let nodes = '';
    let currentSet = false;
    w.lessons.forEach((les, i) => {
      const st = S.stars[les.id] || 0, op = lessonOpen(les);
      let cls = op ? (st ? 'done' : 'open') : 'locked';
      if (op && !st && !currentSet) { cls += ' current'; currentSet = true; }
      nodes += `<div class="nw" style="left:${pts[i][0]}%;top:${pts[i][1]}px">
        <button class="node ${cls}" data-act="lesson" data-arg="${les.id}" aria-label="${les.title}">${op ? les.icon : '🔒'}</button>
        <div class="nstars">${[1, 2, 3].map(k => `<i class="${k <= st ? 'on' : ''}">★</i>`).join('')}</div>
        <div class="ntitle">${les.title}<span class="gr">${les.grade} кл</span></div></div>`;
    });
    const bp = pts[n - 1], won = !!S.bosses[w.id], ready = bossReady(w);
    nodes += `<div class="nw boss" style="left:${bp[0]}%;top:${bp[1]}px">
      <button class="node bossn ${won ? 'won' : ready ? 'ready' : 'locked'}" data-act="boss" data-arg="${w.id}" aria-label="Босс ${w.boss.name}">${w.boss.emoji}${won ? '<em>✓</em>' : !ready ? '<em>🔒</em>' : ''}</button>
      <div class="ntitle bt">${won ? 'Побеждён!' : 'Босс: ' + w.boss.name}</div></div>`;
    h += `<section class="world ${open ? '' : 'wlocked'}" style="--c1:${w.c1};--c2:${w.c2}">
      <div class="whead"><span class="wemoji">${w.emoji}</span><div><small>Мир ${wi + 1}</small><h3>${w.name}</h3></div><span class="wstars">⭐ ${got}/${max}</span></div>
      ${open ? '' : `<div class="wlock">🔒 Победи босса «${WORLDS[wi - 1].boss.name}», чтобы открыть этот мир</div>`}
      <div class="path" style="height:${H}px"><svg viewBox="0 0 100 ${H}" preserveAspectRatio="none"><path d="${path}" vector-effect="non-scaling-stroke"/></svg>${nodes}</div>
    </section>`;
  });
  h += `<div class="map-end">🏰 Конец пути… пока что!</div></div>`;
  return h;
}

function openLessonSheet(id) {
  const les = LESSONS[id];
  if (!lessonOpen(les)) {
    const prev = les.li > 0 ? les.world.lessons[les.li - 1] : null;
    modal({ html: `<div class="m-icon">🔒</div><h2>Тема закрыта</h2><p>${!worldOpen(les.wi) ? `Сначала победи босса «${WORLDS[les.wi - 1].boss.name}».` : `Получи хотя бы 1 звезду в теме «${prev.title}».`}</p>` });
    return;
  }
  const st = S.stars[id] || 0, s = S.stats[id];
  const mastered = st >= 3;
  const m = modal({
    cls: 'sheet',
    html: `<div class="sheet-head" style="--c1:${les.world.c1};--c2:${les.world.c2}"><span class="sh-ic">${les.icon}</span><div><small>${les.world.name} · ${les.grade} класс</small><h2>${les.title}</h2>
      <div class="sh-stars">${[1, 2, 3].map(k => `<i class="${k <= st ? 'on' : ''}">★</i>`).join('')}${s ? `<span>лучший результат: ${s.best}%</span>` : ''}</div></div></div>
      <div class="rule"><div class="rule-t">📘 Вспомни правило <button class="say" data-say="1" aria-label="Прочитать вслух">🔊</button></div><div class="rule-b">${les.rule}</div></div>
      <div class="goals"><span>⭐ 6 из 10 верно с первой попытки</span><span>⭐⭐ 8 из 10 — без ошибок и подсказок</span><span>⭐⭐⭐ 9 из 10 — без ошибок и подсказок</span></div>
      ${mastered ? '<p class="note">Тема освоена! За повтор монет меньше — попробуй новые темы.</p>' : ''}`,
    buttons: [{ label: 'Закрыть', cls: 'ghost' }, { label: st ? 'Пройти ещё раз' : 'Начать урок', cls: 'primary big', onClick: () => { startSession('lesson', id); } }],
  });
  m.querySelector('[data-say]').addEventListener('click', () => Speech.say(les.rule));
}
function openBossSheet(wid) {
  const w = WORLDS.find(x => x.id === wid), wi = WORLDS.indexOf(w);
  if (!worldOpen(wi)) { modal({ html: `<div class="m-icon">🔒</div><h2>Мир закрыт</h2><p>Сначала победи босса «${WORLDS[wi - 1].boss.name}».</p>` }); return; }
  const won = !!S.bosses[wid], ready = bossReady(w);
  const need = w.lessons.filter(l => (S.stars[l.id] || 0) < 2);
  modal({
    cls: 'sheet',
    html: `<div class="boss-intro"><div class="boss-face">${w.boss.emoji}</div><h2>${w.boss.name}</h2><p>${w.boss.story}</p>
      <div class="goals"><span>❤️ У тебя 3 жизни</span><span>💥 Здоровье босса: ${w.boss.hp}</span><span>🚫 Без подсказок</span></div>
      ${!ready ? `<div class="need"><b>Чтобы сразиться, получи по 2 звезды в темах:</b>${need.map(l => `<div>${l.icon} ${l.title} — ${'★'.repeat(S.stars[l.id] || 0)}${'☆'.repeat(2 - Math.min(2, S.stars[l.id] || 0))}</div>`).join('')}</div>` : ''}
      ${won ? '<p class="note">Ты уже победил этого босса. Можно сразиться снова ради тренировки.</p>' : `<p class="reward">Награда: ${150 + 60 * wi} <i class="ci"></i> и новый мир!</p>`}</div>`,
    buttons: ready ? [{ label: 'Не сейчас', cls: 'ghost' }, { label: 'В бой! ⚔️', cls: 'primary big', onClick: () => startSession('boss', wid) }] : [{ label: 'Понятно', cls: 'primary' }],
  });
}

/* ============================================================
   УРОК / БОЙ / РАБОТА НАД ОШИБКАМИ
   ============================================================ */
function makeTask(lid, i) {
  const les = LESSONS[lid];
  try {
    const t = les.make(les.bank[i]);
    t.lid = lid; t.idx = i;
    return t;
  } catch (e) { console.error('Ошибка генерации', lid, i, e); return null; }
}
function buildLessonTasks(lid) {
  const les = LESSONS[lid];
  const mist = S.mistakes.filter(m => m.l === lid && m.i < les.bank.length).sort((a, b) => b.n - a.n).slice(0, 2);
  const used = new Set(mist.map(m => m.i));
  const rest = U.shuffle(les.bank.map((_, i) => i).filter(i => !used.has(i)));
  const out = [], labels = new Set();
  mist.forEach(m => { const t = makeTask(lid, m.i); if (t) { out.push({ t, fromMistake: true }); labels.add(t.label); } });
  for (const i of rest) {
    if (out.length >= LESSON_LEN) break;
    let t = null;
    for (let k = 0; k < 4; k++) { t = makeTask(lid, i); if (t && !labels.has(t.label)) break; }
    if (!t) continue;
    labels.add(t.label);
    out.push({ t });
  }
  return U.shuffle(out);
}
function bossTasks(w, n) {
  const out = [];
  while (out.length < n) {
    const les = U.rnd(w.lessons);
    const t = makeTask(les.id, Math.floor(Math.random() * les.bank.length));
    if (t && !out.some(x => x.t.label === t.label)) out.push({ t });
  }
  return out;
}
function startSession(mode, ref) {
  Sound.init();
  let queue = [], world = null;
  if (mode === 'lesson') { queue = buildLessonTasks(ref); world = LESSONS[ref].world; }
  if (mode === 'boss') { world = WORLDS.find(w => w.id === ref); queue = bossTasks(world, world.boss.hp + 4); }
  if (mode === 'fix') {
    const list = S.mistakes.slice().sort((a, b) => b.n - a.n || a.t - b.t).slice(0, LESSON_LEN);
    queue = list.map(m => ({ t: makeTask(m.l, m.i), fix: true })).filter(x => x.t);
    if (!queue.length) return;
  }
  const lesStats = mode === 'lesson' ? (S.stats[ref] || {}) : {};
  const mastered = mode === 'lesson' && (S.stars[ref] || 0) >= 3;
  L = {
    mode, ref, world, queue, pos: 0, total: queue.length,
    clean: 0, first: 0, wrongs: 0, hints: 0, combo: 0, maxCombo: 0, coins: 0, xp: 0, fixed: 0, correctAll: 0,
    factor: mastered ? Math.max(0.25, 1 / (1 + 0.5 * ((lesStats.mastered || 0) + 1))) : 1,
    hp: world && mode === 'boss' ? world.boss.hp : 0, hpMax: world && mode === 'boss' ? world.boss.hp : 0, hearts: 3,
    start: Date.now(), fastWrong: 0, petMul: petBonusMul(),
  };
  const ov = document.createElement('div');
  ov.className = 'overlay lesson-ov';
  ov.id = 'lesson';
  ov.style.setProperty('--c1', world ? world.c1 : '#FF9EC4');
  ov.style.setProperty('--c2', world ? world.c2 : '#E8569A');
  ov.innerHTML = `<div class="l-top"><button class="x" data-act="quit" aria-label="Выйти">✕</button>
      ${mode === 'boss' ? `<div class="boss-bar"><span class="b-emo" id="bEmo">${world.boss.emoji}</span><div class="hp"><div id="hpBar" style="width:100%"></div></div><span class="hearts" id="hearts">❤️❤️❤️</span></div>`
    : `<div class="l-progress"><div id="lProg"></div></div>`}
      <div class="combo" id="combo"></div></div>
    <div class="l-title">${mode === 'lesson' ? LESSONS[ref].icon + ' ' + LESSONS[ref].title : mode === 'boss' ? '⚔️ Бой: ' + world.boss.name : '🩹 Работа над ошибками'}</div>
    <div class="l-body" id="lBody"></div>
    <div class="l-foot" id="lFoot"></div>
    <div class="feedback" id="fb"></div>`;
  document.body.appendChild(ov);
  document.body.classList.add('no-scroll');
  Back.push(() => { askQuit(); return false; });
  showTask();
}
function askQuit() {
  if (!L) return;
  if (L.finished) { closeLesson(); Back.done(); return; }
  confirmBox('<div class="m-icon">🚪</div><h2>Выйти?</h2><p>Если выйти сейчас, звёзды и монеты за этот урок не начислятся.</p>', 'Выйти', () => { Back.done(); closeLesson(); }, 'Остаться');
}
function closeLesson() {
  if (L && !L.finished) {
    const d = day();
    d.time += Math.min(30 * 60000, Date.now() - L.start);
    save();
  }
  const ov = $('#lesson');
  if (ov) ov.remove();
  document.body.classList.remove('no-scroll');
  L = null;
  Speech.enabled && 'speechSynthesis' in window && speechSynthesis.cancel();
  render();
  setTimeout(flushQueue, 300);
}

function curTask() { return L.queue[L.pos]; }
function showTask() {
  const e = curTask(), t = e.t;
  L.answered = false; L.hint = false; L.shown = Date.now(); L.ord = [];
  const body = $('#lBody');
  if (L.mode !== 'boss') $('#lProg').style.width = (100 * L.pos / L.queue.length) + '%';
  let show = '';
  if (t.word) show = `<div class="word" id="word">${t.word.before}<span class="gap" id="gap">?</span>${t.word.after}</div>`;
  else if (t.show) show = `<div class="${t.small ? 'sentence' : 'word'}">${t.show}</div>`;
  let ans = '';
  if (t.kind === 'choice') {
    const short = t.options.every(o => o.label.length <= 3);
    const cls = short ? 'opts letters' : t.grid ? 'opts grid2' : (t.options.length === 2 && t.options.every(o => o.label.length <= 16)) ? 'opts two' : 'opts list';
    ans = `<div class="${cls}">${t.options.map(o => `<button class="opt" data-act="ans" data-arg="${U.esc(o.v)}">${U.esc(o.label)}</button>`).join('')}</div>`;
  } else if (t.kind === 'stress') {
    ans = `<div class="stress">${t.letters.map((c, i) => U.isV(c) ? `<button class="sv" data-act="ans" data-arg="${i}">${c}</button>` : `<span>${c}</span>`).join('')}</div>`;
  } else if (t.kind === 'tap') {
    ans = `<div class="tapline">${t.tokens.map((w, i) => `<button class="tw" data-act="ans" data-arg="${i}">${U.esc(w)}</button>`).join('')}</div>`;
  } else if (t.kind === 'order') {
    ans = `<div class="ord-line" id="ordLine"><span class="ph">Нажимай на слова по порядку</span></div>
      <div class="ord-pool" id="ordPool">${t.pieces.map((p, i) => `<button class="piece" data-act="ordAdd" data-arg="${i}">${U.esc(p)}</button>`).join('')}</div>`;
  }
  body.innerHTML = `${e.retry ? '<div class="retry-tag">🔁 Исправь ошибку</div>' : e.fromMistake || e.fix ? '<div class="retry-tag fix">🩹 Повторение</div>' : ''}
    <div class="prompt"><span>${t.prompt}</span>${Speech.available() && S.settings.tts ? `<button class="say" data-act="say" aria-label="Прочитать вслух">🔊</button>` : ''}</div>
    ${show}<div class="ans">${ans}</div><div class="hintbox" id="hintbox"></div>`;
  body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
  const foot = $('#lFoot');
  foot.innerHTML = `${L.mode !== 'boss' ? '<button class="btn hint" data-act="hint">💡 Подсказка</button>' : ''}
    ${t.kind === 'order' ? '<button class="btn primary" data-act="ordCheck" id="ordCheck" disabled>Проверить</button>' : ''}`;
  $('#fb').className = 'feedback';
}
function sayTask() {
  const t = curTask().t;
  Speech.say(t.prompt + (t.small && t.show ? '. ' + t.show : ''));
}

/* ---------- Подсказка ---------- */
function useHint() {
  if (!L || L.answered || L.hint) return;
  const e = curTask(), t = e.t;
  L.hint = true; L.hints++;
  Sound.play('tap');
  if (t.kind === 'choice' && t.options.length >= 3) {
    const wrong = $$('#lBody .opt').filter(b => b.dataset.arg !== String(t.answer) && !b.disabled);
    if (wrong.length) { const b = U.rnd(wrong); b.disabled = true; b.classList.add('gone'); }
  } else if (t.kind === 'stress') {
    const wrong = $$('#lBody .sv').filter(b => +b.dataset.arg !== t.answer);
    if (wrong.length >= 2) { const b = U.rnd(wrong); b.disabled = true; b.classList.add('gone'); }
  } else if (t.kind === 'tap') {
    const wrong = $$('#lBody .tw').filter(b => +b.dataset.arg !== t.answer && !b.disabled);
    U.sample(wrong, Math.ceil(wrong.length / 2)).forEach(b => { b.disabled = true; b.classList.add('gone'); });
  } else if (t.kind === 'order') {
    const first = t.answers[0].split(' ')[0];
    L.ord = [];
    const idx = t.pieces.findIndex(p => p === first);
    if (idx >= 0) L.ord.push(idx);
    renderOrder();
  }
  const les = LESSONS[t.lid];
  $('#hintbox').innerHTML = `<div class="hint-card"><b>💡 Правило:</b> ${les.rule}</div>`;
  $('#hintbox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const hb = $('[data-act="hint"]'); if (hb) { hb.disabled = true; hb.textContent = '💡 Подсказка взята (награда меньше)'; }
}

/* ---------- Составление предложения ---------- */
function renderOrder() {
  const t = curTask().t;
  const line = $('#ordLine'), pool = $('#ordPool');
  line.innerHTML = L.ord.length ? L.ord.map((i, k) => `<button class="piece in" data-act="ordDel" data-arg="${k}">${U.esc(t.pieces[i])}</button>`).join('') : '<span class="ph">Нажимай на слова по порядку</span>';
  $$('.piece', pool).forEach(b => { b.classList.toggle('used', L.ord.includes(+b.dataset.arg)); });
  $('#ordCheck').disabled = L.ord.length !== t.pieces.length;
}

/* ---------- Проверка ответа ---------- */
function answer(val) {
  if (!L || L.answered) return;
  const e = curTask(), t = e.t;
  let ok;
  if (t.kind === 'choice') ok = String(val) === String(t.answer);
  else if (t.kind === 'stress' || t.kind === 'tap') ok = +val === t.answer;
  else if (t.kind === 'order') ok = t.answers.includes(L.ord.map(i => t.pieces[i]).join(' '));
  L.answered = true;
  const fast = Date.now() - L.shown < 1300;
  const d = day();
  let gain = 0;

  /* подсветка */
  if (t.kind === 'choice') {
    $$('#lBody .opt').forEach(b => {
      b.disabled = true;
      if (b.dataset.arg === String(t.answer)) b.classList.add('right');
      else if (b.dataset.arg === String(val)) b.classList.add('wrong');
    });
    if (t.word) {
      const g = $('#gap');
      g.textContent = t.word.fill || '';
      g.classList.add(ok ? 'ok' : 'fixd');
      if (!t.word.fill) g.classList.add('empty');
    }
  } else if (t.kind === 'stress' || t.kind === 'tap') {
    const sel = t.kind === 'stress' ? '.sv' : '.tw';
    $$('#lBody ' + sel).forEach(b => {
      b.disabled = true;
      if (+b.dataset.arg === t.answer) b.classList.add('right');
      else if (+b.dataset.arg === +val) b.classList.add('wrong');
    });
  } else if (t.kind === 'order') {
    $('#ordLine').classList.add(ok ? 'right' : 'wrong');
    $$('#lBody .piece').forEach(b => { b.disabled = true; });
    const cb = $('#ordCheck'); if (cb) cb.disabled = true;
  }

  if (ok) {
    L.correctAll++; d.correct++; S.counters.correct++;
    weekly('correct');
    if (!e.retry) {
      L.first++;
      L.combo++;
      L.maxCombo = Math.max(L.maxCombo, L.combo);
      if (!L.hint) L.clean++;
      if (L.mode === 'fix') { gain = 15; }
      else {
        const base = L.hint ? 4 : 10 + (L.world ? WORLDS.indexOf(L.world) : 0);
        const mult = L.combo >= 10 ? 2 : L.combo >= 5 ? 1.5 : 1;
        gain = Math.max(1, Math.round(base * mult * L.factor));
      }
      L.xp += L.hint ? 4 : 10;
    }
    if (e.fromMistake || e.fix) { if (fixMistake(t.lid, t.idx)) L.fixed++; }
    L.coins += gain;
    if (L.combo > S.bestCombo) S.bestCombo = L.combo;
    L.fastWrong = 0;
    if (L.mode === 'boss') bossHit();
    Sound.play(L.combo >= 5 && L.combo % 5 === 0 ? 'combo' : 'right');
  } else {
    L.combo = 0;
    d.wrong++; S.counters.wrong++;
    if (!e.retry) { L.wrongs++; addMistake(t.lid, t.idx, t.label); }
    else addMistake(t.lid, t.idx, t.label);
    if (L.mode === 'boss') heroHit();
    else if (!e.retry || e.retryCount < 2) {
      const nt = makeTask(t.lid, t.idx);
      if (nt) L.queue.push({ t: nt, retry: true, retryCount: (e.retryCount || 0) + 1, fix: e.fix });
    }
    Sound.play('wrong');
    if (fast) { L.fastWrong++; if (L.fastWrong >= 2) { toast('🐢 Не спеши! Сначала подумай, потом нажимай.'); L.fastWrong = 0; } }
  }
  renderCombo();
  const exp = t.explainFor ? t.explainFor(String(val)) : t.explain;
  const titles = ok ? (e.retry ? ['Исправлено! 👏'] : ['Верно!', 'Молодец!', 'Отлично!', 'Правильно!', 'Здорово!']) : ['Не совсем…', 'Ошибочка!', 'Почти!'];
  const fb = $('#fb');
  fb.innerHTML = `<div class="fb-in"><div class="fb-h"><span class="fb-ic">${ok ? '✅' : '🧐'}</span><b>${U.rnd(titles)}</b>${gain ? `<span class="fb-coins">+${gain} <i class="ci"></i></span>` : ''}</div>
    ${exp ? `<div class="fb-exp">${exp}</div>` : ''}
    <button class="btn ${ok ? 'primary' : 'warm'} big" data-act="next">${ok ? 'Дальше' : 'Понятно'}</button></div>`;
  fb.className = 'feedback show ' + (ok ? 'ok' : 'bad');
  const hb = $('[data-act="hint"]'); if (hb) hb.disabled = true;
  save();
}
function renderCombo() {
  const c = $('#combo');
  if (!c) return;
  if (L.combo >= 3) {
    c.innerHTML = `🔥${L.combo}${L.combo >= 10 ? '<small>×2</small>' : L.combo >= 5 ? '<small>×1.5</small>' : ''}`;
    c.className = 'combo show' + (L.combo >= 10 ? ' hot' : '');
  } else c.className = 'combo';
}
function bossHit() {
  L.hp = Math.max(0, L.hp - 1);
  $('#hpBar').style.width = (100 * L.hp / L.hpMax) + '%';
  const b = $('#bEmo'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
  setTimeout(() => Sound.play('hit'), 150);
}
function heroHit() {
  L.hearts = Math.max(0, L.hearts - 1);
  $('#hearts').innerHTML = '❤️'.repeat(L.hearts) + '<span class="lost">🤍</span>'.repeat(3 - L.hearts);
}
function next() {
  if (!L) return;
  Sound.play('tap');
  if (L.mode === 'boss') {
    if (L.hp <= 0) return finishBoss(true);
    if (L.hearts <= 0) return finishBoss(false);
    if (L.pos + 1 >= L.queue.length) L.queue.push(...bossTasks(L.world, 5));
  }
  L.pos++;
  if (L.pos >= L.queue.length) return finishLesson();
  showTask();
}

/* ---------- Итоги урока ---------- */
function touchStreak() {
  const t = U.dayKey();
  if (S.streak.last === t) return false;
  const y = U.dayKey(new Date(Date.now() - 86400000));
  S.streak.count = S.streak.last === y ? S.streak.count + 1 : 1;
  S.streak.last = t;
  S.streak.best = Math.max(S.streak.best, S.streak.count);
  return true;
}
function commonFinish() {
  L.finished = true;
  const d = day();
  d.time += Math.min(30 * 60000, Date.now() - L.start);
  if (touchStreak()) weekly('day');
  weekly('combo', L.maxCombo);
}
function petBonusMul() { return S.pet.satiety >= 50 && petStage() > 0 ? 1.1 : 1; }

function finishLesson() {
  const stageBefore = petStage();
  commonFinish();
  let html;
  if (L.mode === 'fix') {
    const got = earnCoins(L.coins * L.petMul);
    addXP(L.xp);
    S.counters.lessons++;
    weekly('lesson');
    html = resultHTML({ title: L.fixed ? 'Ошибки исправлены!' : 'Хорошая тренировка!', stars: null, lines: [`Исправлено ошибок: <b>${L.fixed}</b>`, `Осталось в списке: <b>${S.mistakes.length}</b>`], coins: got, raw: Math.round(L.coins * L.petMul), xp: L.xp });
  } else {
    const id = L.ref, N = L.total;
    const stars = L.clean / N >= 0.9 ? 3 : L.clean / N >= 0.8 ? 2 : L.first / N >= 0.6 ? 1 : 0;
    const prev = S.stars[id] || 0;
    const newStars = Math.max(0, stars - prev);
    S.stars[id] = Math.max(prev, stars);
    const st = S.stats[id] || (S.stats[id] = { plays: 0, best: 0, last: 0, mastered: 0 });
    const acc = Math.round(100 * L.first / N);
    st.plays++; st.last = acc; st.best = Math.max(st.best, acc);
    if (prev >= 3) st.mastered++;
    S.counters.lessons++;
    const perfect = L.wrongs === 0 && L.hints === 0;
    if (perfect) { S.counters.perfect++; weekly('perfect'); }
    weekly('lesson');
    if (newStars) weekly('star', newStars);
    if (stars === 3 && prev < 3) weekly('three');
    const starCoins = newStars * 40;
    const raw = Math.round((L.coins + starCoins) * L.petMul);
    const got = earnCoins(raw);
    const xp = L.xp + newStars * 30;
    addXP(xp);
    const titles = ['Попробуй ещё раз!', 'Неплохо!', 'Хорошо!', 'Превосходно!'];
    html = resultHTML({
      title: titles[stars], stars, newStars, lines: [
        `С первой попытки: <b>${L.first} из ${N}</b>`, `Без подсказок: <b>${L.clean}</b>`, `Лучшая серия: <b>🔥 ${L.maxCombo}</b>`,
        ...(newStars ? [`Новых звёзд: <b>+${newStars}</b> (+${starCoins} <i class="ci"></i>)`] : []),
        ...(L.factor < 1 ? ['<span class="muted">Тема уже освоена — монет за повтор меньше</span>'] : []),
      ], coins: got, raw, xp, retry: id,
      tip: stars === 0 ? 'Перечитай правило и попробуй снова — у тебя получится!' : stars < 3 ? 'Для 3 звёзд нужно 9 ответов без подсказок и ошибок.' : '',
    });
  }
  afterFinish(stageBefore);
  showResult(html);
}
function finishBoss(win) {
  const stageBefore = petStage();
  commonFinish();
  const w = L.world, wi = WORLDS.indexOf(w), first = !S.bosses[w.id];
  let html;
  if (win) {
    S.counters.lessons++;
    weekly('lesson');
    const reward = first ? 150 + 60 * wi : 30;
    const got = earnCoins(L.coins * L.petMul) + earnCoins(reward, true);
    if (first) { S.bosses[w.id] = true; weekly('star', 3); }
    addXP(L.xp + (first ? 200 : 20));
    Sound.play('level'); confetti(120);
    const nextW = WORLDS[wi + 1];
    html = `<div class="result win"><div class="boss-defeat">${w.boss.emoji}</div><h2>Победа!</h2><p>${w.boss.name} повержен!</p>
      <div class="res-coins">+${got} <i class="ci"></i> <span>+${L.xp + (first ? 200 : 20)} опыта</span></div>
      ${first && nextW ? `<div class="unlock-card" style="--c1:${nextW.c1};--c2:${nextW.c2}">${nextW.emoji} Открыт новый мир: <b>${nextW.name}</b></div>` : ''}
      ${first && !nextW ? '<div class="unlock-card">👑 Букваландия спасена! Ты — настоящий герой!</div>' : ''}
      <div class="res-pet">${petSVG({ mood: 'wow', uid: 'rp' })}</div>
      <button class="btn primary big" data-act="resClose">На карту</button></div>`;
  } else {
    const got = earnCoins(L.coins * L.petMul);
    addXP(L.xp);
    Sound.play('lose');
    html = `<div class="result lose"><div class="boss-laugh">${w.boss.emoji}</div><h2>${w.boss.name} оказался сильнее</h2>
      <p>Не сдавайся! Повтори темы этого мира и попробуй снова. Боссы побеждаются тренировкой!</p>
      <div class="res-coins">+${got} <i class="ci"></i></div>
      <div class="res-btns"><button class="btn ghost" data-act="resClose">На карту</button><button class="btn primary" data-act="bossAgain" data-arg="${w.id}">Ещё раз</button></div></div>`;
  }
  afterFinish(stageBefore);
  showResult(html);
}
function afterFinish(stageBefore) {
  const after = petStage();
  if (after > stageBefore) {
    celebrate(() => {
      Sound.play('level'); confetti();
      const hatch = stageBefore === 0;
      const m = modal({
        cls: 'celebrate',
        html: `<div class="evo">${petSVG({ mood: 'wow', uid: 'evo' })}</div><h2>${hatch ? 'Питомец вылупился!' : 'Питомец вырос!'}</h2>
          <p>${hatch ? 'Привет! Я твой новый друг. Давай учиться вместе!' : `Теперь ${U.esc(S.pet.name || PET_SPECIES[S.pet.species].name)} — <b>${PET_STAGES[after].name}</b>!`}</p>
          ${hatch && !S.pet.name ? '<input class="inp" id="petNameInp" maxlength="14" placeholder="Придумай мне имя">' : ''}`,
        buttons: [{
          label: 'Ура!', cls: 'primary', onClick: w2 => {
            const inp = w2.querySelector('#petNameInp');
            if (inp) S.pet.name = inp.value.trim() || PET_SPECIES[S.pet.species].name;
          },
        }],
        dismiss: false,
      });
      void m;
    }, true);
  }
  checkAch();
  save();
}
function resultHTML({ title, stars, newStars = 0, lines, coins, raw, xp, retry, tip }) {
  const lim = S.settings.dailyLimit;
  const capped = coins < raw;
  return `<div class="result">
    <h2>${title}</h2>
    ${stars !== null ? `<div class="big-stars">${[1, 2, 3].map(k => `<i class="${k <= stars ? 'on' : ''}" style="animation-delay:${0.25 + k * 0.3}s">★</i>`).join('')}</div>` : '<div class="m-icon">🩹</div>'}
    <div class="res-coins">+${coins} <i class="ci"></i> <span>+${xp} опыта</span></div>
    ${capped ? `<p class="note">Дневной лимит монет достигнут (${lim}). Звёзды и опыт засчитаны!</p>` : ''}
    ${L && L.petMul > 1 ? '<p class="small">🐾 Сытый питомец дал +10% монет</p>' : petStage() > 0 ? '<p class="small muted">Покорми питомца — сытый питомец даёт +10% монет</p>' : ''}
    <ul class="res-lines">${lines.map(l => `<li>${l}</li>`).join('')}</ul>
    ${tip ? `<p class="tip">${tip}</p>` : ''}
    <div class="res-pet">${petSVG({ mood: stars === 0 ? 'happy' : 'wow', uid: 'rp' })}</div>
    <div class="res-btns">${retry ? `<button class="btn ghost" data-act="again" data-arg="${retry}">Ещё раз</button>` : ''}<button class="btn primary big" data-act="resClose">На карту</button></div>
  </div>`;
}
function showResult(html) {
  const ov = $('#lesson');
  ov.querySelector('.l-body').innerHTML = html;
  ov.querySelector('.l-foot').innerHTML = '';
  $('#fb').className = 'feedback';
  ov.classList.add('done');
  const stars = $$('.big-stars i.on', ov);
  stars.forEach((s, i) => setTimeout(() => Sound.play('star'), 300 + i * 300));
  if (stars.length === 3) setTimeout(() => confetti(), 1200);
  save();
}

/* ============================================================
   ПИТОМЕЦ
   ============================================================ */
function renderPet() {
  const stg = petStage(), t = totalStars();
  const nextSt = PET_STAGES[stg + 1];
  const prog = nextSt ? Math.min(1, (t - PET_STAGES[stg].at) / (nextSt.at - PET_STAGES[stg].at)) : 1;
  const decor = [...SHOP, ...EXCLUSIVE].filter(i => i.cat === 'decor' && S.owned[i.id] && !S.hidden[i.id]);
  const sat = Math.round(S.pet.satiety);
  const name = U.esc(S.pet.name || (stg === 0 ? 'Яйцо' : PET_SPECIES[S.pet.species].name));
  return `<div class="pet-screen">
    <div class="room">
      <div class="wall"></div><div class="floor"></div>
      ${decor.map(i => `<span class="deco" style="left:${i.x}%;top:${i.y}%;font-size:${i.s}px">${i.icon}</span>`).join('')}
      <button class="pet-big" data-act="petTap" aria-label="Погладить">${petSVG({ uid: 'pb' })}</button>
      <div class="pet-say" id="petSay"></div>
    </div>
    <div class="card pet-card">
      <div class="pc-head"><h2>${name}</h2><span class="stage-tag">${PET_STAGES[stg].name}</span></div>
      <div class="bar-l"><span>⭐ Рост</span><small>${nextSt ? `${t} / ${nextSt.at} звёзд до стадии «${nextSt.name}»` : 'Максимальная стадия!'}</small></div>
      <div class="bar"><div style="width:${prog * 100}%"></div></div>
      ${stg > 0 ? `<div class="bar-l"><span>🍎 Сытость</span><small>${sat}%${sat >= 50 ? ' · даёт +10% монет' : ''}</small></div>
      <div class="bar sat ${sat < 30 ? 'low' : ''}"><div style="width:${sat}%"></div></div>` : '<p class="small">Получи первую звезду в любом уроке — и питомец вылупится!</p>'}
      <div class="pc-btns">
        <button class="btn primary" data-act="feed" ${stg === 0 ? 'disabled' : ''}>🍎 Покормить</button>
        <button class="btn" data-act="wardrobe" ${stg === 0 ? 'disabled' : ''}>👗 Гардероб</button>
      </div>
    </div></div>`;
}
function petTap() {
  Sound.play('pet');
  const b = $('.pet-big'); b.classList.remove('jump'); void b.offsetWidth; b.classList.add('jump');
  const heart = document.createElement('span');
  heart.className = 'heart-fly'; heart.textContent = U.rnd(['❤️', '💖', '💕', '✨']);
  heart.style.left = 40 + Math.random() * 20 + '%';
  $('.room').appendChild(heart);
  setTimeout(() => heart.remove(), 1200);
  const say = $('#petSay');
  const st = petStage();
  const phrases = st === 0 ? ['Тук-тук! 🥚', '*шевелится*', 'Скоро вылуплюсь!']
    : S.pet.satiety < 30 ? ['Я голодный… 🥺', 'Хочу кушать!', 'Покорми меня, пожалуйста!']
      : ['Мур! Мне нравится!', 'Ты мой лучший друг!', 'Пойдём учиться?', 'Хи-хи, щекотно!', 'Я горжусь тобой!', 'Давай заработаем звёзды!'];
  say.textContent = U.rnd(phrases);
  say.className = 'pet-say show';
  clearTimeout(say._t);
  say._t = setTimeout(() => { say.className = 'pet-say'; }, 2000);
}
function openFeed() {
  const foods = SHOP.filter(i => i.cat === 'food' && S.food[i.id] > 0);
  const m = modal({
    cls: 'sheet',
    html: `<h2>Покормить питомца</h2><p class="small">Сытость: ${Math.round(S.pet.satiety)}%</p>
      ${foods.length ? `<div class="feed-grid">${foods.map(f => `<button class="feed-it" data-food="${f.id}"><span>${f.icon}</span><b>${f.name}</b><small>×${S.food[f.id]} · +${f.sat}%</small></button>`).join('')}</div>`
    : '<p>Еды пока нет. Её можно купить в магазине за монетки!</p>'}`,
    buttons: foods.length ? [{ label: 'Готово', cls: 'primary' }] : [{ label: 'Закрыть', cls: 'ghost' }, { label: 'В магазин', cls: 'primary', onClick: () => { SHOP_TAB = 'food'; TAB = 'shop'; render(); } }],
  });
  m.addEventListener('click', ev => {
    const b = ev.target.closest('[data-food]');
    if (!b) return;
    const f = ITEMS[b.dataset.food];
    if (!S.food[f.id]) return;
    if (S.pet.satiety >= 100) { toast('🐾 Я уже наелся!'); return; }
    S.food[f.id]--; S.pet.satiety = Math.min(100, S.pet.satiety + f.sat);
    S.counters.fed++;
    Sound.play('pet');
    b.querySelector('small').textContent = `×${S.food[f.id]} · +${f.sat}%`;
    if (!S.food[f.id]) b.disabled = true;
    m.querySelector('.small').textContent = `Сытость: ${Math.round(S.pet.satiety)}%`;
    toast(`${f.icon} Ням-ням! Спасибо!`);
    checkAch(); save(); render();
  });
}
function openWardrobe() {
  const slots = [['hat', 'Голова'], ['glasses', 'Очки'], ['neck', 'Шея'], ['color', 'Цвет']];
  const build = () => slots.map(([cat, nm]) => {
    const items = SHOP.filter(i => i.cat === cat && S.owned[i.id]);
    const cur = cat === 'color' ? S.pet.color : S.pet[cat];
    return `<div class="wd-sec"><b>${nm}</b><div class="wd-row">
      <button class="wd-it ${!cur ? 'on' : ''}" data-wd="${cat}:">${cat === 'color' ? '🎨' : '✖️'}<small>${cat === 'color' ? 'Обычный' : 'Снять'}</small></button>
      ${items.map(i => `<button class="wd-it ${cur === i.id ? 'on' : ''}" data-wd="${cat}:${i.id}">${i.icon}<small>${i.name}</small></button>`).join('')}
      ${items.length ? '' : '<span class="small muted">Купи в магазине</span>'}</div></div>`;
  }).join('') + (() => {
    const dec = [...SHOP, ...EXCLUSIVE].filter(i => i.cat === 'decor' && S.owned[i.id]);
    return dec.length ? `<div class="wd-sec"><b>Домик (показать / спрятать)</b><div class="wd-row">${dec.map(i => `<button class="wd-it ${S.hidden[i.id] ? '' : 'on'}" data-dec="${i.id}">${i.icon}<small>${i.name}</small></button>`).join('')}</div></div>` : '';
  })();
  const m = modal({ cls: 'sheet', html: `<h2>Гардероб</h2><div class="wd-pet">${petSVG({ uid: 'wd' })}</div><div id="wdBody">${build()}</div>`, buttons: [{ label: 'Готово', cls: 'primary' }] });
  m.addEventListener('click', ev => {
    const b = ev.target.closest('[data-wd],[data-dec]');
    if (!b) return;
    Sound.play('tap');
    if (b.dataset.dec) { const id = b.dataset.dec; S.hidden[id] = !S.hidden[id]; }
    else {
      const [cat, id] = b.dataset.wd.split(':');
      if (cat === 'color') S.pet.color = id || null; else S.pet[cat] = id || null;
    }
    save();
    m.querySelector('.wd-pet').innerHTML = petSVG({ uid: 'wd' });
    m.querySelector('#wdBody').innerHTML = build();
    render();
  });
}

/* ============================================================
   МАГАЗИН
   ============================================================ */
function renderShop() {
  const L2 = lvl();
  const tabs = `<div class="tabs">${SHOP_TABS.map(t => `<button class="tab ${SHOP_TAB === t.id ? 'on' : ''}" data-act="shopTab" data-arg="${t.id}">${t.icon}<span>${t.name}</span></button>`).join('')}</div>`;
  let body = '';
  if (SHOP_TAB === 'games') {
    const price = gamePrice(day().games);
    body = `<p class="shop-note">Мини-игры — награда за учёбу. Каждая следующая игра сегодня дороже.</p><div class="games">${GAMES.map(g => `
      <div class="card game-card"><span class="g-ic">${g.icon}</span><div><h3>${g.name}</h3><p class="small">${g.desc}</p>
      <p class="small">Рекорд: <b>${S.records[g.id] || '—'}</b></p></div>
      <button class="btn primary" data-act="buyGame" data-arg="${g.id}">Играть · ${price} <i class="ci"></i></button></div>`).join('')}</div>`;
  } else if (SHOP_TAB === 'prizes') {
    const reqs = S.parent.requests.slice().reverse().slice(0, 8);
    body = `<p class="shop-note">Настоящие призы от взрослых! Копи монетки и обменивай. Взрослый подтвердит и вручит приз.</p>
      <div class="prizes">${S.parent.prizes.length ? S.parent.prizes.map(p => `<div class="card prize"><span class="p-ic">🎁</span><div class="p-mid"><b>${U.esc(p.name)}</b>
        <div class="bar"><div style="width:${Math.min(100, 100 * S.coins / p.price)}%"></div></div><small>${S.coins >= p.price ? 'Хватает! 🎉' : 'Осталось накопить: ' + fmt(p.price - S.coins)}</small></div>
        <button class="btn ${S.coins >= p.price ? 'primary' : 'ghost'}" data-act="buyPrize" data-arg="${p.id}">${fmt(p.price)} <i class="ci"></i></button></div>`).join('') : '<p class="small">Взрослые ещё не добавили призы.</p>'}</div>
      ${reqs.length ? `<h3 class="sub">Мои заказы</h3>${reqs.map(r => `<div class="req ${r.status}"><span>${U.esc(r.name)}</span><small>${r.status === 'wait' ? '⏳ ждёт взрослого' : r.status === 'given' ? '🎉 получено' : '↩️ отменено'}</small></div>`).join('')}` : ''}`;
  } else {
    const tab = SHOP_TABS.find(t => t.id === SHOP_TAB);
    const cats = tab.cats || [SHOP_TAB];
    const items = SHOP.filter(i => cats.includes(i.cat));
    body = `<div class="shop-grid">${items.map(i => {
      const locked = i.lvl > L2;
      const owned = i.cat !== 'food' && S.owned[i.id];
      const equipped = (i.cat === 'theme' && S.theme === i.theme) || (i.cat === 'color' && S.pet.color === i.id) || (['hat', 'glasses', 'neck'].includes(i.cat) && S.pet[i.cat] === i.id);
      let btn;
      if (locked) btn = `<span class="lock-lv">🔒 Уровень ${i.lvl}</span>`;
      else if (equipped) btn = `<span class="eq">✓ Надето</span>`;
      else if (owned) btn = i.cat === 'decor' ? `<span class="eq">✓ В домике</span>` : `<button class="btn sm" data-act="equip" data-arg="${i.id}">${i.cat === 'theme' ? 'Включить' : 'Надеть'}</button>`;
      else btn = `<button class="btn sm ${S.coins >= i.price ? 'primary' : 'ghost'}" data-act="buy" data-arg="${i.id}">${fmt(i.price)} <i class="ci"></i></button>`;
      const sw = i.cat === 'color' ? `<span class="swatch" style="background:${i.color === 'rainbow' ? 'linear-gradient(135deg,#FF6B9A,#FFD34E,#5ED6A0,#6EC6FF,#B39DFF)' : i.color === 'gold' ? 'linear-gradient(135deg,#FFF3B0,#F5C542,#C98B12)' : i.color}"></span>` : '';
      return `<div class="item ${locked ? 'locked' : ''}"><span class="it-ic">${sw || i.icon}</span><b>${i.name}</b>${i.cat === 'food' ? `<small>+${i.sat}% сытости · есть: ${S.food[i.id] || 0}</small>` : ''}${btn}</div>`;
    }).join('')}</div>`;
  }
  return `<div class="shop"><div class="shop-head"><h2>Магазин</h2><span class="wallet"><i class="ci"></i> ${fmt(S.coins)}</span></div>${tabs}${body}</div>`;
}
function buy(id) {
  const i = ITEMS[id];
  if (!i || i.lvl > lvl()) return;
  if (S.coins < i.price) { Sound.play('wrong'); toast(`Не хватает ${fmt(i.price - S.coins)} <i class="ci"></i>. Пройди ещё урок!`); return; }
  confirmBox(`<div class="m-icon">${i.icon}</div><h2>${i.name}</h2><p>Купить за <b>${fmt(i.price)} <i class="ci"></i></b>?</p>`, 'Купить', () => {
    S.coins -= i.price;
    S.counters.bought++;
    if (i.cat === 'food') S.food[i.id] = (S.food[i.id] || 0) + 1;
    else {
      S.owned[i.id] = true;
      if (i.cat === 'theme') S.theme = i.theme;
      if (i.cat === 'color') S.pet.color = i.id;
      if (['hat', 'glasses', 'neck'].includes(i.cat)) S.pet[i.cat] = i.id;
    }
    Sound.play('buy');
    toast(`${i.icon} Куплено: ${i.name}!`);
    checkAch(); save(); render(); bump('#chip-coins');
  });
}
function equip(id) {
  const i = ITEMS[id];
  if (!S.owned[id]) return;
  if (i.cat === 'theme') S.theme = i.theme;
  else if (i.cat === 'color') S.pet.color = id;
  else S.pet[i.cat] = id;
  Sound.play('tap'); save(); render();
}
function buyPrize(id) {
  const p = S.parent.prizes.find(x => x.id === id);
  if (!p) return;
  if (S.coins < p.price) { Sound.play('wrong'); toast(`Нужно ещё ${fmt(p.price - S.coins)} <i class="ci"></i>. Ты справишься!`); return; }
  confirmBox(`<div class="m-icon">🎁</div><h2>${U.esc(p.name)}</h2><p>Обменять <b>${fmt(p.price)} <i class="ci"></i></b> на этот приз? Взрослый получит твою заявку.</p>`, 'Обменять', () => {
    S.coins -= p.price;
    S.parent.requests.push({ id: 'r' + Date.now(), prize: p.id, name: p.name, price: p.price, t: Date.now(), status: 'wait' });
    Sound.play('buy'); confetti();
    toast('🎁 Заявка отправлена взрослому!');
    save(); render();
  });
}
function buyGame(gid) {
  const price = gamePrice(day().games);
  if (S.coins < price) { Sound.play('wrong'); toast(`Нужно ${price} <i class="ci"></i> для игры`); return; }
  confirmBox(`<div class="m-icon">${GAMES.find(g => g.id === gid).icon}</div><h2>Сыграть?</h2><p>Игра стоит <b>${price} <i class="ci"></i></b>.</p>`, 'Играть!', () => {
    S.coins -= price; day().games++;
    save(); render();
    if (gid === 'balloons') gameBalloons(); else gameMemory();
  });
}

/* ============================================================
   НАГРАДЫ
   ============================================================ */
function renderAwards() {
  const L2 = lvl(), x0 = LEVEL.start(L2), need = LEVEL.need(L2);
  const wk = S.weekly;
  const nextEx = EXCLUSIVE.find(x => !S.owned[x.id]);
  return `<div class="awards">
    <div class="card lvl-card"><div class="lvl-num">${L2}</div><div class="lvl-info"><b>${LEVEL.title(L2)}</b><small>Опыт: ${fmt(S.xp - x0)} / ${fmt(need)} до уровня ${L2 + 1}</small>
      <div class="bar"><div style="width:${100 * (S.xp - x0) / need}%"></div></div></div></div>
    <div class="row2">
      <div class="card stat"><span>🔥</span><b>${streakNow()}</b><small>дней подряд<br>рекорд: ${S.streak.best}</small></div>
      <div class="card stat"><span>⭐</span><b>${totalStars()}</b><small>звёзд из ${TOTAL_STARS}</small></div>
    </div>
    <h3 class="sub">📅 Испытания недели</h3>
    <div class="weekly">${wk.ids.map(id => {
      const c = WEEKLY_POOL.find(x => x.id === id); const p = Math.min(c.goal, wk.prog[id] || 0);
      return `<div class="card wk ${wk.done[id] ? 'done' : ''}"><div class="wk-t">${wk.done[id] ? '✅' : '🎯'} ${c.text}<span>+${WEEKLY_REWARD} <i class="ci"></i></span></div><div class="bar"><div style="width:${100 * p / c.goal}%"></div></div><small>${p} / ${c.goal}</small></div>`;
    }).join('')}
      <div class="card wk bonus ${wk.bonus ? 'done' : ''}">🎁 Выполни все три — получишь редкий подарок ${wk.bonus ? '(получен!)' : nextEx ? '<b>' + '❓' + '</b>, которого нет в магазине' : ''}</div></div>
    <h3 class="sub">🏅 Медали <small>${Object.keys(S.ach).length} / ${ACH.length}</small></h3>
    <div class="medals">${ACH.map(a => `<button class="medal ${S.ach[a.id] ? 'got' : ''}" data-act="medal" data-arg="${a.id}"><span>${S.ach[a.id] ? a.icon : '❔'}</span><small>${a.name}</small></button>`).join('')}</div>
  </div>`;
}

/* ============================================================
   МИНИ-ИГРЫ
   ============================================================ */
function openGameOverlay(html) {
  const ov = document.createElement('div');
  ov.className = 'overlay game-ov';
  ov.id = 'game';
  ov.innerHTML = html;
  document.body.appendChild(ov);
  document.body.classList.add('no-scroll');
  Back.push(() => { closeGame(); });
  return ov;
}
function closeGame() {
  const ov = $('#game');
  if (ov) { clearInterval(ov._t1); clearInterval(ov._t2); ov.remove(); }
  document.body.classList.remove('no-scroll');
  render();
  setTimeout(flushQueue, 300);
}
function gameEnd(ov, html) {
  ov.querySelector('.g-area').innerHTML = `<div class="g-end">${html}<button class="btn primary big" data-act="gameClose">Готово</button></div>`;
  checkAch(); save();
}
function gameBalloons() {
  const set = U.rnd(BALLOON_SETS);
  let score = 0, left = 40;
  const ov = openGameOverlay(`<div class="g-top"><button class="x" data-act="gameClose">✕</button><div class="g-task">Лопай: <b>${set.name}</b></div><div class="g-score">🎈 <b id="gScore">0</b> · ⏱ <b id="gTime">40</b></div></div><div class="g-area balloons-area" id="gArea"></div>`);
  const area = ov.querySelector('#gArea');
  const colors = ['#FF6B9A', '#FFD34E', '#5ED6A0', '#6EC6FF', '#B39DFF', '#FF9F43'];
  const spawn = () => {
    const yes = Math.random() < 0.5;
    const ch = U.rnd([...(yes ? set.yes : set.no)]);
    const b = document.createElement('button');
    b.className = 'balloon';
    b.dataset.yes = set.yes.includes(ch) ? '1' : '';
    b.textContent = ch.toUpperCase();
    b.style.left = (4 + Math.random() * 78) + '%';
    b.style.setProperty('--bc', U.rnd(colors));
    b.style.animationDuration = (5 + Math.random() * 2.5) + 's';
    b.addEventListener('animationend', () => b.remove());
    b.addEventListener('pointerdown', () => {
      if (b.classList.contains('pop')) return;
      if (b.dataset.yes) { score++; Sound.play('pop'); b.classList.add('pop'); setTimeout(() => b.remove(), 250); }
      else { score = Math.max(0, score - 1); Sound.play('wrong'); b.classList.add('nope'); }
      ov.querySelector('#gScore').textContent = score;
    });
    area.appendChild(b);
  };
  ov._t1 = setInterval(spawn, 620);
  ov._t2 = setInterval(() => {
    left--;
    const el = ov.querySelector('#gTime'); if (el) el.textContent = left;
    if (left <= 0) {
      clearInterval(ov._t1); clearInterval(ov._t2);
      const rec = score > (S.records.balloons || 0);
      if (rec) S.records.balloons = score;
      addXP(Math.min(30, score));
      gameEnd(ov, `<div class="m-icon">🎈</div><h2>Ты лопнул ${score} ${U.plural(score, 'шарик', 'шарика', 'шариков')}!</h2>${rec ? '<p class="reward">🏆 Новый рекорд!</p>' : `<p>Рекорд: ${S.records.balloons}</p>`}<p class="small">+${Math.min(30, score)} опыта</p>`);
    }
  }, 1000);
  spawn();
}
function gameMemory() {
  const pool = ['🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐵', '🐰', '🐯', '🐨', '🐷', '🐙'];
  const set = U.sample(pool, 6);
  const cards = U.shuffle([...set, ...set]);
  let open = [], moves = 0, found = 0, lock = false;
  const ov = openGameOverlay(`<div class="g-top"><button class="x" data-act="gameClose">✕</button><div class="g-task">Найди все пары</div><div class="g-score">Ходы: <b id="gMoves">0</b></div></div>
    <div class="g-area"><div class="mem">${cards.map((c, i) => `<button class="mc" data-i="${i}"><span class="f">❓</span><span class="b">${c}</span></button>`).join('')}</div></div>`);
  ov.querySelector('.mem').addEventListener('click', ev => {
    const b = ev.target.closest('.mc');
    if (!b || lock || b.classList.contains('open')) return;
    b.classList.add('open'); Sound.play('tap');
    open.push(b);
    if (open.length < 2) return;
    moves++; ov.querySelector('#gMoves').textContent = moves;
    const [a, c] = open;
    if (cards[+a.dataset.i] === cards[+c.dataset.i]) {
      a.classList.add('ok'); c.classList.add('ok'); open = []; found++; Sound.play('right');
      if (found === 6) {
        const rec = !S.records.memory || moves < S.records.memory;
        if (rec) S.records.memory = moves;
        addXP(20);
        setTimeout(() => gameEnd(ov, `<div class="m-icon">🃏</div><h2>Все пары найдены!</h2><p>Ходов: <b>${moves}</b></p>${rec ? '<p class="reward">🏆 Новый рекорд!</p>' : `<p>Рекорд: ${S.records.memory} ходов</p>`}<p class="small">+20 опыта</p>`), 600);
      }
    } else {
      lock = true;
      setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); open = []; lock = false; }, 800);
    }
  });
}

/* ============================================================
   ПЕРЕРЫВ
   ============================================================ */
setInterval(() => {
  const now = Date.now();
  if (document.visibilityState === 'visible') ACTIVE.ms += Math.min(20000, now - ACTIVE.last);
  ACTIVE.last = now;
  if (S && S.settings.breakMin > 0 && ACTIVE.ms >= S.settings.breakMin * 60000) {
    ACTIVE.ms = 0;
    ACTIVE.due = true;
    flushQueue();
  }
}, 10000);
function showBreak() {
  modal({
    cls: 'celebrate',
    html: `<div class="m-icon">🧘</div><h2>Время отдохнуть!</h2><p>Ты занимаешься уже ${S.settings.breakMin} минут. Сделай зарядку для глаз:</p>
      <ul class="res-lines"><li>👀 Посмотри вдаль 10 секунд</li><li>🔄 Поводи глазами по кругу</li><li>🙆 Потянись и встань со стула</li></ul>`,
    buttons: [{ label: 'Я отдохнул!', cls: 'primary' }],
  });
}

/* ============================================================
   ДЛЯ ВЗРОСЛЫХ
   ============================================================ */
function openParent(section) {
  if (!S.parent.pin) return pinSetup(section);
  pinPad('Введите PIN-код', pin => {
    if (pin === S.parent.pin) { parentPanel(section || 'stats'); return true; }
    Sound.play('wrong'); return false;
  }, true);
}
function pinPad(title, onDone, withForgot) {
  let val = '';
  const m = modal({
    cls: 'pin-modal',
    html: `<h2>${title}</h2><p class="small">Раздел для родителей</p><div class="pin-dots">${'<i></i>'.repeat(4)}</div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div>
      ${withForgot ? '<button class="link" data-forgot="1">Забыли PIN?</button>' : ''}`,
    buttons: [{ label: 'Отмена', cls: 'ghost' }],
  });
  const dots = () => $$('.pin-dots i', m).forEach((d, i) => d.classList.toggle('on', i < val.length));
  m.addEventListener('click', ev => {
    if (ev.target.closest('[data-forgot]')) { m.close(); forgotPin(); return; }
    const b = ev.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k;
    if (k === '⌫') val = val.slice(0, -1); else if (val.length < 4) val += k;
    dots();
    if (val.length === 4) {
      const ok = onDone(val);
      if (ok) m.close();
      else { const box = $('.pin-dots', m); box.classList.add('shake'); setTimeout(() => { box.classList.remove('shake'); val = ''; dots(); }, 450); }
    }
  });
}
function pinSetup(section) {
  pinPad('Придумайте PIN-код', p1 => {
    setTimeout(() => pinPad('Повторите PIN-код', p2 => {
      if (p1 !== p2) { toast('PIN-коды не совпали. Попробуйте ещё раз.'); setTimeout(() => pinSetup(section), 300); return true; }
      S.parent.pin = p1; save(); toast('🔐 PIN-код сохранён');
      setTimeout(() => parentPanel(section || 'stats'), 250);
      return true;
    }), 250);
    return true;
  });
}
function forgotPin() {
  modal({
    html: '<h2>Сброс PIN-кода</h2><p>Решите пример, чтобы подтвердить, что вы взрослый:</p><p class="big-q">48 × 25 = ?</p><input class="inp" id="fpInp" inputmode="numeric" maxlength="5">',
    buttons: [{ label: 'Отмена', cls: 'ghost' }, {
      label: 'Сбросить', cls: 'primary', onClick: w => {
        if (w.querySelector('#fpInp').value.trim() === '1200') { S.parent.pin = null; save(); toast('PIN сброшен. Придумайте новый.'); setTimeout(() => pinSetup(), 300); return true; }
        toast('Неверно'); return false;
      },
    }],
  });
}
let P_TAB = 'stats';
function parentPanel(tab) {
  P_TAB = tab || 'stats';
  let ov = $('#parent');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'overlay parent-ov';
    ov.id = 'parent';
    document.body.appendChild(ov);
    document.body.classList.add('no-scroll');
    Back.push(() => { closeParent(); });
  }
  const tabs = [['stats', '📊 Успехи'], ['prizes', '🎁 Призы'], ['settings', '⚙️ Настройки'], ['backup', '💾 Сохранение']];
  ov.innerHTML = `<div class="p-top"><button class="x" data-act="parentClose">✕</button><h2>Для взрослых</h2></div>
    <div class="tabs p-tabs">${tabs.map(([id, nm]) => `<button class="tab ${P_TAB === id ? 'on' : ''}" data-act="pTab" data-arg="${id}"><span>${nm}</span></button>`).join('')}</div>
    <div class="p-body">${P_TAB === 'stats' ? pStats() : P_TAB === 'prizes' ? pPrizes() : P_TAB === 'settings' ? pSettings() : pBackup()}</div>`;
}
function closeParent() {
  const ov = $('#parent'); if (ov) ov.remove();
  document.body.classList.remove('no-scroll');
  render(); setTimeout(flushQueue, 300);
}
function pStats() {
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); const k = U.dayKey(d); days.push([d, S.history[k] || { time: 0, correct: 0, wrong: 0 }]); }
  const maxMin = Math.max(10, ...days.map(([, h]) => h.time / 60000));
  const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const c = S.counters, acc = c.correct + c.wrong ? Math.round(100 * c.correct / (c.correct + c.wrong)) : 0;
  const week = days.reduce((a, [, h]) => a + h.time, 0) / 60000;
  const mist = S.mistakes.slice().sort((a, b) => b.n - a.n).slice(0, 12);
  const weak = Object.keys(S.stats).filter(id => LESSONS[id] && S.stats[id].best < 70);
  const pend = S.parent.requests.filter(r => r.status === 'wait').length;
  return `${pend ? `<button class="banner" data-act="pTab" data-arg="prizes">🎁 Ребёнок ждёт призов: ${pend}</button>` : ''}
    <div class="p-cards"><div class="card stat"><b>${totalStars()}</b><small>звёзд из ${TOTAL_STARS}</small></div><div class="card stat"><b>${acc}%</b><small>точность ответов</small></div>
    <div class="card stat"><b>${Math.round(week)}</b><small>минут за 7 дней</small></div><div class="card stat"><b>${c.lessons}</b><small>уроков пройдено</small></div></div>
    <h3 class="sub">Время занятий (минуты)</h3>
    <div class="chart">${days.map(([d, h]) => { const m = Math.round(h.time / 60000); return `<div class="col"><span class="v">${m || ''}</span><div class="b" style="height:${(m / maxMin) * 100}%"></div><small>${wd[d.getDay()]}</small></div>`; }).join('')}</div>
    ${weak.length ? `<h3 class="sub">⚠️ Темы, требующие внимания</h3><div class="weak">${weak.map(id => `<span>${LESSONS[id].icon} ${LESSONS[id].title} — ${S.stats[id].best}%</span>`).join('')}</div>` : ''}
    <h3 class="sub">Частые ошибки</h3>
    ${mist.length ? `<div class="mist">${mist.map(m => `<div><b>${U.esc(m.label || '')}</b><small>${LESSONS[m.l] ? LESSONS[m.l].title : ''} · ошибок: ${m.n}</small></div>`).join('')}</div>` : '<p class="small">Ошибок пока нет 👍</p>'}
    <h3 class="sub">Все темы</h3>
    ${WORLDS.map(w => `<div class="p-world"><b>${w.emoji} ${w.name}</b>${S.bosses[w.id] ? ' <span class="tag">босс побеждён</span>' : ''}
      ${w.lessons.map(l => { const s = S.stats[l.id]; return `<div class="p-les"><span>${l.title} <small>${l.grade} кл</small></span><span class="st">${'★'.repeat(S.stars[l.id] || 0)}${'☆'.repeat(3 - (S.stars[l.id] || 0))}</span><small>${s ? `${s.best}% · ${s.plays} ${U.plural(s.plays, 'раз', 'раза', 'раз')}` : '—'}</small></div>`; }).join('')}</div>`).join('')}`;
}
function pPrizes() {
  const reqs = S.parent.requests.slice().reverse();
  return `<p class="small">Добавьте реальные награды. Ребёнок копит монеты и «покупает» приз, а вы подтверждаете выдачу. Ориентир: за хороший день занятий ребёнок получает около ${S.settings.dailyLimit || 500} монет.</p>
    ${reqs.filter(r => r.status === 'wait').map(r => `<div class="card req-p"><div><b>🎁 ${U.esc(r.name)}</b><small>${new Date(r.t).toLocaleDateString('ru-RU')} · ${fmt(r.price)} <i class="ci"></i></small></div>
      <div class="rq-b"><button class="btn ghost sm" data-act="reqCancel" data-arg="${r.id}">Вернуть монеты</button><button class="btn primary sm" data-act="reqGive" data-arg="${r.id}">Выдано ✓</button></div></div>`).join('')}
    <h3 class="sub">Список призов</h3>
    <div class="p-prizes">${S.parent.prizes.map(p => `<div class="pp"><input class="inp" data-pn="${p.id}" value="${U.esc(p.name)}" maxlength="40"><input class="inp num" data-pp="${p.id}" type="number" min="10" step="10" value="${p.price}"><button class="btn ghost sm" data-act="prizeDel" data-arg="${p.id}">🗑</button></div>`).join('')}</div>
    <button class="btn" data-act="prizeAdd">＋ Добавить приз</button>
    ${reqs.filter(r => r.status !== 'wait').length ? `<h3 class="sub">История</h3>${reqs.filter(r => r.status !== 'wait').slice(0, 15).map(r => `<div class="req ${r.status}"><span>${U.esc(r.name)}</span><small>${r.status === 'given' ? '✓ выдано' : '↩ отменено'} · ${new Date(r.t).toLocaleDateString('ru-RU')}</small></div>`).join('')}` : ''}`;
}
function pSettings() {
  const s = S.settings;
  const sel = (id, opts, v) => `<select class="inp" data-set="${id}">${opts.map(([val, nm]) => `<option value="${val}" ${String(v) === String(val) ? 'selected' : ''}>${nm}</option>`).join('')}</select>`;
  const tg = (id, v, nm, hint) => `<label class="tg"><span><b>${nm}</b>${hint ? `<small>${hint}</small>` : ''}</span><input type="checkbox" data-set="${id}" ${v ? 'checked' : ''}><i></i></label>`;
  return `<div class="set">
    <label class="fld"><b>Имя ребёнка</b><input class="inp" data-set="name" value="${U.esc(S.name)}" maxlength="16"></label>
    <label class="fld"><b>Дневной лимит монет</b><small>После лимита звёзды и опыт копятся, а монеты — нет. Защищает от «залипания».</small>${sel('dailyLimit', [[300, '300'], [500, '500 (рекомендуется)'], [800, '800'], [1200, '1200'], [0, 'Без лимита']], s.dailyLimit)}</label>
    <label class="fld"><b>Напоминание о перерыве</b>${sel('breakMin', [[10, 'каждые 10 минут'], [15, 'каждые 15 минут'], [20, 'каждые 20 минут'], [30, 'каждые 30 минут'], [0, 'выключено']], s.breakMin)}</label>
    ${tg('sound', s.sound, 'Звуки', '')}
    ${tg('tts', s.tts, 'Озвучка заданий (кнопка 🔊)', Speech.available() ? '' : 'На этом устройстве синтез речи недоступен')}
    ${tg('openAll', s.openAll, 'Открыть все темы', 'Можно сразу выбрать любую тему (например, для 3 класса). Боссы всё равно требуют 2 звезды в темах мира.')}
    <button class="btn" data-act="pinChange">🔐 Сменить PIN-код</button>
  </div>`;
}
function pBackup() {
  const last = S.lastBackup ? new Date(S.lastBackup).toLocaleString('ru-RU') : 'ещё ни разу';
  return `<div class="set">
    <div class="card"><b>Последнее сохранение:</b> ${last}<p class="small">Прогресс хранится в браузере на этом устройстве. Если очистить данные браузера или сменить устройство, прогресс пропадёт. Раз в неделю сохраняйте файл резервной копии.</p></div>
    <button class="btn primary big" data-act="exportSave">💾 Сохранить прогресс в файл</button>
    <label class="btn big file-btn">📂 Загрузить прогресс из файла<input type="file" accept=".json,application/json" id="importFile" hidden></label>
    <h3 class="sub">Опасная зона</h3>
    <button class="btn danger" data-act="resetAll">🗑 Сбросить весь прогресс</button>
  </div>`;
}
function exportSave() {
  const data = JSON.stringify(S, null, 1);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bukvalandia-${(S.name || 'progress').replace(/[^\wа-яё-]/gi, '')}-${U.dayKey()}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  S.lastBackup = Date.now(); save();
  toast('💾 Файл сохранён в «Загрузки»');
  parentPanel('backup');
}
function importSave(file) {
  const r = new FileReader();
  r.onload = () => {
    let data;
    try { data = JSON.parse(r.result); } catch (e) { toast('Это не файл сохранения'); return; }
    if (!data || typeof data !== 'object' || typeof data.coins !== 'number' || !data.stars) { toast('Файл не подходит'); return; }
    confirmBox(`<h2>Загрузить прогресс?</h2><p>Ученик: <b>${U.esc(data.name || '—')}</b>, звёзд: ${Object.values(data.stars).reduce((a, b) => a + b, 0)}, монет: ${data.coins}.<br>Текущий прогресс будет заменён.</p>`, 'Загрузить', () => {
      S = merge(defaults(), data); tick(); save(); toast('✅ Прогресс загружен'); parentPanel('backup'); render();
    });
  };
  r.readAsText(file);
}

/* ============================================================
   ЗНАКОМСТВО (первый запуск)
   ============================================================ */
function onboarding() {
  const ov = document.createElement('div');
  ov.className = 'overlay onb';
  ov.id = 'onb';
  document.body.appendChild(ov);
  let step = 0;
  const data = { name: '', species: 'dragon', grade: 2 };
  const show = () => {
    if (step === 0) {
      ov.innerHTML = `<div class="onb-card"><div class="onb-logo">📖✨</div><h1>Букваландия</h1>
        <p>В волшебной стране Букваландии жили-были буквы. Но злой <b>Кляксус</b> всё перепутал: буквы потерялись, слова сломались!</p>
        <p>Только ты и твой питомец можете спасти Букваландию. Готов?</p>
        <button class="btn primary big" data-o="next">Начать приключение!</button></div>`;
    } else if (step === 1) {
      ov.innerHTML = `<div class="onb-card"><div class="onb-logo">👋</div><h2>Как тебя зовут?</h2>
        <input class="inp big" id="onbName" maxlength="16" placeholder="Твоё имя" value="${U.esc(data.name)}">
        <button class="btn primary big" data-o="next">Дальше</button></div>`;
      setTimeout(() => $('#onbName').focus(), 100);
    } else if (step === 2) {
      ov.innerHTML = `<div class="onb-card"><h2>Выбери яйцо</h2><p class="small">Из него вылупится твой питомец, когда ты получишь первую звезду!</p>
        <div class="eggs">${Object.entries(PET_SPECIES).map(([id, sp]) => `<button class="egg-pick ${data.species === id ? 'on' : ''}" data-sp="${id}">
          ${Pet.svg({ species: id, color: sp.color, stage: 0, uid: 'e' + id })}<b>${sp.name}</b></button>`).join('')}</div>
        <div class="egg-preview">Кто внутри? <span>${Pet.svg({ species: data.species, color: PET_SPECIES[data.species].color, stage: 2, mood: 'happy', uid: 'prev' })}</span></div>
        <button class="btn primary big" data-o="next">Это мой!</button></div>`;
    } else if (step === 3) {
      ov.innerHTML = `<div class="onb-card"><div class="onb-logo">👨‍👩‍👧</div><h2>Вопрос для взрослых</h2><p>В каком классе учится ребёнок?</p>
        <div class="grade-pick"><button class="btn big ${data.grade === 2 ? 'primary' : ''}" data-gr="2">2 класс<small>темы открываются по порядку</small></button>
        <button class="btn big ${data.grade === 3 ? 'primary' : ''}" data-gr="3">3 класс<small>все темы открыты сразу</small></button></div>
        <p class="small">Это можно изменить позже в разделе ⚙️ «Для взрослых».</p>
        <button class="btn primary big" data-o="next">Готово</button></div>`;
    } else {
      S.name = data.name || 'Герой';
      S.pet.species = data.species;
      S.settings.openAll = data.grade === 3;
      S.onboarded = true;
      save();
      ov.remove();
      render();
      celebrate(() => modal({
        cls: 'celebrate',
        html: `<div class="evo">${petSVG({ uid: 'ob' })}</div><h2>Привет, ${U.esc(S.name)}!</h2><p>Это твоё яйцо. Проходи уроки на карте, собирай <b>звёзды</b> ⭐ и <b>монетки</b> <i class="ci"></i>.</p>
          <p>За звёзды питомец растёт, а за монетки можно купить ему еду, одежду и игрушки!</p>`,
        buttons: [{ label: 'Поехали!', cls: 'primary big' }],
      }));
      flushQueue();
      return;
    }
  };
  ov.addEventListener('click', ev => {
    const t = ev.target;
    const sp = t.closest('[data-sp]'); if (sp) { data.species = sp.dataset.sp; Sound.play('tap'); show(); return; }
    const gr = t.closest('[data-gr]'); if (gr) { data.grade = +gr.dataset.gr; Sound.play('tap'); show(); return; }
    if (t.closest('[data-o="next"]')) {
      Sound.init(); Sound.play('tap');
      if (step === 1) { data.name = $('#onbName').value.trim(); if (!data.name) { $('#onbName').classList.add('shake'); setTimeout(() => $('#onbName').classList.remove('shake'), 400); return; } }
      step++; show();
    }
  });
  ov.addEventListener('keydown', ev => { if (ev.key === 'Enter' && step === 1) ov.querySelector('[data-o="next"]').click(); });
  show();
}

/* ============================================================
   СОБЫТИЯ
   ============================================================ */
const ACTIONS = {
  tab: a => { TAB = a; Sound.play('tap'); $('#screen').scrollTop = 0; render(); },
  lesson: a => { Sound.play('tap'); openLessonSheet(a); },
  boss: a => { Sound.play('tap'); openBossSheet(a); },
  fix: () => { Sound.play('tap'); startSession('fix'); },
  quit: () => askQuit(),
  ans: a => answer(a),
  next: () => next(),
  hint: () => useHint(),
  say: () => sayTask(),
  ordAdd: a => { if (L.answered) return; const i = +a; if (!L.ord.includes(i)) { L.ord.push(i); Sound.play('tap'); renderOrder(); } },
  ordDel: a => { if (L.answered) return; L.ord.splice(+a, 1); Sound.play('tap'); renderOrder(); },
  ordCheck: () => answer(),
  resClose: () => { Back.done(); closeLesson(); },
  again: a => { Back.done(); closeLesson(); setTimeout(() => startSession('lesson', a), 50); },
  bossAgain: a => { Back.done(); closeLesson(); setTimeout(() => startSession('boss', a), 50); },
  petTap: () => petTap(),
  feed: () => openFeed(),
  wardrobe: () => openWardrobe(),
  shopTab: a => { SHOP_TAB = a; Sound.play('tap'); render(); },
  buy: a => buy(a),
  equip: a => equip(a),
  buyPrize: a => buyPrize(a),
  buyGame: a => buyGame(a),
  gameClose: () => { Back.done(); closeGame(); },
  medal: a => { const m = ACH.find(x => x.id === a); modal({ html: `<div class="medal-big ${S.ach[a] ? '' : 'gray'}">${S.ach[a] ? m.icon : '❔'}</div><h2>${m.name}</h2><p>${m.desc}</p><p class="reward">${S.ach[a] ? 'Получена ' + new Date(S.ach[a]).toLocaleDateString('ru-RU') : 'Награда: ' + m.reward + ' <i class="ci"></i>'}</p>` }); },
  parent: a => openParent(a),
  parentClose: () => { Back.done(); closeParent(); },
  pTab: a => parentPanel(a),
  prizeAdd: () => { S.parent.prizes.push({ id: 'p' + Date.now(), name: 'Новый приз', price: 1000 }); save(); parentPanel('prizes'); },
  prizeDel: a => { S.parent.prizes = S.parent.prizes.filter(p => p.id !== a); save(); parentPanel('prizes'); },
  reqGive: a => { const r = S.parent.requests.find(x => x.id === a); if (r) { r.status = 'given'; save(); parentPanel('prizes'); } },
  reqCancel: a => { const r = S.parent.requests.find(x => x.id === a); if (r) { r.status = 'cancel'; S.coins += r.price; save(); parentPanel('prizes'); } },
  pinChange: () => pinSetup('settings'),
  exportSave: () => exportSave(),
  resetAll: () => confirmBox('<div class="m-icon">⚠️</div><h2>Сбросить всё?</h2><p>Звёзды, монеты, питомец и покупки будут удалены. Сначала сохраните файл резервной копии!</p>', 'Сбросить', () => {
    setTimeout(() => confirmBox('<h2>Точно сбросить?</h2><p>Отменить будет нельзя.</p>', 'Да, сбросить', () => {
      try { localStorage.removeItem(KEY); } catch (e) { /* */ }
      location.reload();
    }), 250);
  }),
};
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el.dataset.arg, el);
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'importFile' && t.files[0]) { importSave(t.files[0]); t.value = ''; return; }
  if (t.dataset.set) {
    const k = t.dataset.set;
    if (k === 'name') S.name = t.value.trim().slice(0, 16) || S.name;
    else if (t.type === 'checkbox') S.settings[k] = t.checked;
    else S.settings[k] = +t.value;
    save(); applyTheme(); renderTop();
    return;
  }
  if (t.dataset.pn) { const p = S.parent.prizes.find(x => x.id === t.dataset.pn); if (p) { p.name = t.value.trim().slice(0, 40) || p.name; save(); } }
  if (t.dataset.pp) { const p = S.parent.prizes.find(x => x.id === t.dataset.pp); if (p) { p.price = Math.max(10, Math.round(+t.value || p.price)); save(); } }
});
document.addEventListener('keydown', ev => {
  if (!L || modalOpen) return;
  if (ev.key === 'Enter' && L.answered) { const b = $('[data-act="next"]'); if (b) b.click(); }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { tick(); save(); if (!L) render(); } else save(); });

/* ============================================================
   ЗАПУСК
   ============================================================ */
function boot() {
  load();
  tick();
  Speech.init();
  applyTheme();
  save();
  render();
  if (!S.onboarded) onboarding();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* офлайн-режим недоступен */ });
  }
}
boot();
