'use strict';
/* ============================================================
   Букваландия — интерактивные задания по русскому языку
   Обычное задание темы (makeTask) с вероятностью ~60 % превращается в игровое:
   🧲 перетащи букву · 👍👎 да или нет · 🔍 сыщик (найди ошибку) · 🏠 разложи по домикам ·
   ✂️ разрежь слово · 🔗 найди пару · 🧱 конструктор слова.
   Номер задания в банке темы сохраняется — звёзды, ошибки и «Работа над ошибками» работают как раньше.
   ============================================================ */

/* Запоминалки к темам: показываются в карточке темы, питомец их произносит */
const RU_MEMO = {
  vowels: 'Гласные поются: а-а-а, о-о-о! А согласные спотыкаются о губы и зубы.',
  soft: 'Е, Ё, Ю, Я, И и мягкий знак смягчают согласный, как подушка!',
  voiced: 'Закрой ушки ладошками: звонкий звенит в голове, а глухой только шуршит.',
  letsnd: 'Звуки мы слышим и говорим, а буквы видим и пишем.',
  abc: 'В алфавите тридцать три буквы — как богатырей в сказке!',
  syll: 'Сколько гласных — столько и слогов. Хлопай в ладоши на каждый слог!',
  stress: 'Позови слово, как будто оно далеко: коро-о-ова! Где тянется — там ударение.',
  hyph: 'Одну букву не оставляй и не переноси — ей одной скучно!',
  zhishi: 'Жираф и шина — пишем с буквой И!',
  chascha: 'Чаща и щука дружат с А и У: ча-ща, чу-щу!',
  chk: 'Ночка, речка, мощный — без мягкого знака!',
  capital: 'Имена, клички, города — с большой буквы всегда!',
  sepsoft: 'Разделительный мягкий знак — как стенка: семья, вьюга, листья.',
  bezud: 'Сомневаешься? Измени слово, чтобы гласная стала ударной: вода — воды!',
  vocab2: 'Словарные слова не проверишь — с ними нужно подружиться и запомнить!',
  paired: 'Дуб или дуп? Скажи «дубы» — и всё слышно!',
  silent: 'Солнце светит, но буква Л молчит. Проверь: солнышко!',
  double: 'Касса, ванна, суббота — две одинаковые буквы держатся за руки.',
  cognate: 'Родственные слова — одна семья: лес, лесник, лесной!',
  root: 'Корень — сердце слова. У всех родственников он одинаковый.',
  morph: 'Приставка впереди, корень в серединке, суффикс за ним, а окончание в конце меняется!',
  prefprep: 'Между предлогом и словом можно вставить ещё слово: в большом лесу. А с приставкой так нельзя!',
  sephard: 'Твёрдый знак пишем после приставки перед Е, Ё, Ю, Я: подъезд, объявление.',
  pos: 'Кто? Что? — существительное. Что делает? — глагол. Какой? — прилагательное.',
  anim: 'Кто? — про живое: кошка, мама. Что? — про неживое: стол, мяч.',
  gender: 'Он мой, она моя, оно моё — подставь и узнаешь род!',
  number: 'Один — единственное число, много — множественное: кот, коты.',
  cases: 'Иван Родил Девчонку, Велел Тащить Пелёнку — так запоминаем падежи!',
  hush: 'Дочь, мышь, ночь — она, с мягким знаком. Врач, мяч, ключ — он, без мягкого знака.',
  negverb: 'НЕ с глаголами пишем раздельно: не знаю, не хочу, не буду!',
  endmark: 'Говорим спокойно — точка. Спрашиваем — вопрос. Радуемся — восклицательный знак!',
  members: 'Подлежащее — кто или что? Сказуемое — что делает? Это главная пара предложения.',
  build: 'Предложение начинается с большой буквы, а в конце ставим знак.',
};
/* Фразы питомца в уроках (озвучены заранее) */
const RU_LINES = {
  clean: ['Картинка снова чистая! Мы победили кляксы!', 'Ура! Ни одной кляксы не осталось!'],
};
/* Сцены для картинки с кляксами — по мирам */
const BLOT_SCENES = ['🏝️🐚🌴🐠⛵', '🌄🐑🌻🦋🏡', '🌲🦔🍄🦊🌙', '🌊🐳🐬🦀⛵', '⛰️🦅🌨️🐐🏔️', '🏙️🚌🎡🎈🌆', '🏰👑🐉🛡️🦄', '☁️🌈🪁⭐🎠'];

const RuFun = {
  KINDS: ['sort', 'match', 'cut'],

  /* ---------- Превращение задания ---------- */
  transform(t, les, i) {
    if (!t || les.subject.id !== 'ru' || t.lid) return t;
    const r = Math.random();
    const id = les.id;
    try {
      if (id === 'syll' && String(les.bank[i]).startsWith('c:') && r < 0.55) return RuFun.cutTask(les.bank[i].slice(2), 'syll', t);
      if (id === 'hyph' && les.bank[i] !== 'x' && r < 0.5 && HY.valid(les.bank[i]).length) return RuFun.cutTask(les.bank[i], 'hyph', t);
      if ((id === 'bezud' || id === 'paired') && r < 0.3) return RuFun.matchGap(les, i, t);
      if (id === 'cognate' && r < 0.4) return RuFun.matchCognate(les, i, t);
      if ((id === 'morph' || id === 'root') && r < 0.45) return RuFun.buildTask(les.bank[i], t);
      const r2 = Math.random();   // отдельный жребий: особые виды выше не должны отнимать долю у общих
      if (t.kind === 'choice' && t.word && t.options.every(o => String(o.label).length <= 3)) {
        if (r2 < 0.28) return Object.assign(t, { ui: 'drag', prompt: t.prompt.replace(/^Вставь/, 'Перетащи') });
        if (r2 < 0.5) return RuFun.swipeTask(t);
        if (r2 < 0.7) return RuFun.findTask(les, i, t) || t;
        return t;
      }
      if (t.kind === 'choice' && !t.word && t.show && t.options.length >= 2 && t.options.length <= 3 && r2 < 0.6) return RuFun.sortTask(les, i, t) || t;
    } catch (e) { console.error('Задание-игра', id, e); }
    return t;
  },
  gapWord(t) { return t.word.before + (t.word.fill || '') + t.word.after; },
  wrongWord(t) {
    const w = t.options.find(o => o.v !== t.answer);
    return t.word.before + (w.v === '-' ? '' : w.v) + t.word.after;
  },

  /* 👍👎 Да или нет: слово написано верно? */
  swipeTask(t) {
    const right = Math.random() < 0.5;
    const w = right ? RuFun.gapWord(t) : RuFun.wrongWord(t);
    return Object.assign({}, t, {
      kind: 'choice', ui: 'swipe', word: null, show: null, card: w,
      prompt: 'Слово написано <b>верно</b>? Смахни карточку или нажми кнопку',
      options: [{ v: 'no', label: '👎 С ошибкой' }, { v: 'yes', label: '👍 Верно' }], answer: right ? 'yes' : 'no',
      explain: `Правильно пишется: <b>${RuFun.gapWord(t)}</b>. ${t.explain || ''}`,
    });
  },

  /* 🔍 Сыщик: среди четырёх слов одно с ошибкой */
  findTask(les, i, t) {
    const others = [];
    for (let k = 0; k < 30 && others.length < 3; k++) {
      const j = Math.floor(Math.random() * les.bank.length);
      if (j === i) continue;
      const o = les.make(les.bank[j]);
      if (o && o.kind === 'choice' && o.word && !others.some(x => RuFun.gapWord(x) === RuFun.gapWord(o)) && RuFun.gapWord(o) !== RuFun.gapWord(t)) others.push(o);
    }
    if (others.length < 3) return null;
    const words = U.shuffle([{ w: RuFun.wrongWord(t), bad: true }, ...others.map(o => ({ w: RuFun.gapWord(o) }))]);
    const ans = words.findIndex(x => x.bad);
    return Object.assign({}, t, {
      kind: 'choice', ui: 'find', word: null, show: null,
      prompt: '🔍 Кляксус спрятал <b>ошибку</b> в одном слове. Найди его!',
      options: words.map((x, k) => ({ v: String(k), label: x.w })), answer: String(ans),
      explain: `С ошибкой было слово «${words[ans].w}». Правильно: <b>${RuFun.gapWord(t)}</b>. ${t.explain || ''}`,
    });
  },

  /* 🏠 Разложи по домикам: несколько заданий темы с одинаковыми вариантами */
  sortTask(les, i, t) {
    const sig = o => o.prompt + '|' + o.options.map(x => x.v).sort().join(',');
    const s0 = sig(t), items = [{ label: t.show, v: t.answer }];
    for (let k = 0; k < 40 && items.length < 5; k++) {
      const o = les.make(les.bank[Math.floor(Math.random() * les.bank.length)]);
      if (o && o.kind === 'choice' && o.show && !o.word && sig(o) === s0 && !items.some(x => x.label === o.show)) items.push({ label: o.show, v: o.answer });
    }
    if (items.length < 4) return null;
    const houses = t.options.slice().sort((a, b) => String(a.v).localeCompare(String(b.v), 'ru'));
    return Object.assign({}, t, {
      kind: 'sort', ui: 'sort', items: U.shuffle(items), houses, show: null, word: null,
      prompt: '🏠 Разложи по домикам: ' + t.prompt.replace(/<[^>]+>/g, '').replace(/\?$/, '').toLowerCase(),
      explain: houses.map(h => `<b>${h.label}:</b> ${items.filter(x => x.v === h.v).map(x => x.label).join(', ') || '—'}`).join('<br>'),
      label: 'домики: ' + items.map(x => x.label.replace(/<[^>]+>/g, '')).join(', '),
    });
  },

  /* 🧱 Конструктор: части слова по домикам «приставка / корень / суффикс / окончание» */
  buildTask(m, t) {
    const items = [];
    if (m.p) items.push({ label: m.p, v: 'p' });
    items.push({ label: m.r, v: 'r' });
    m.s.forEach(x => items.push({ label: x, v: 's' }));
    if (m.e) items.push({ label: m.e, v: 'e' });
    const names = { p: 'Приставка', r: 'Корень', s: 'Суффикс', e: 'Окончание' };
    const houses = ['p', 'r', 's', 'e'].filter(k => items.some(x => x.v === k)).map(k => ({ v: k, label: names[k] }));
    return Object.assign({}, t, {
      kind: 'sort', ui: 'build', items: U.shuffle(items), houses, word: null, show: null, word2: m.w,
      prompt: `🧱 Собери слово <b>${m.w}</b>: положи каждую часть на своё место`,
      explain: `Разбор: ${morphShow(m)}`, label: m.w + ' (конструктор)',
    });
  },

  /* ✂️ Разрежь слово на слоги (или покажи, где перенести) */
  cutTask(w, mode, t) {
    return Object.assign({}, t, {
      kind: 'cut', ui: 'cut', mode, w, word: null, show: null,
      prompt: mode === 'syll' ? '✂️ Разрежь слово на <b>слоги</b>: нажимай между буквами, потом «Готово»' : '✂️ Покажи ножницами, где можно <b>перенести</b> слово',
      explain: mode === 'syll' ? `В слове «${w}» ${U.vowelCount(w)} ${U.plural(U.vowelCount(w), 'слог', 'слога', 'слогов')}: в каждом слоге — одна гласная.`
        : `Можно перенести так: ${HY.valid(w).map(k => '<b>' + HY.show(w, k) + '</b>').join(', ')}.`,
      label: w + (mode === 'syll' ? ' (слоги)' : ' (перенос)'),
    });
  },

  /* 🔗 Найди пару: слово ↔ проверочное */
  matchGap(les, i, t) {
    const pairs = [];
    const add = s => { const g = parseGap(s); if (g.note && !pairs.some(p => p.a === g.full)) pairs.push({ a: g.full, b: g.note.toLowerCase() }); };
    add(les.bank[i]);
    for (let k = 0; k < 30 && pairs.length < 4; k++) add(les.bank[Math.floor(Math.random() * les.bank.length)]);
    if (pairs.length < 3) return t;
    return Object.assign({}, t, {
      kind: 'match', ui: 'match', pairs, word: null, show: null,
      prompt: '🔗 Соедини слово с его <b>проверочным</b> словом',
      explain: pairs.map(p => `<b>${p.a}</b> — ${U.accent(p.b)}`).join('<br>'), label: 'пары: ' + pairs.map(p => p.a).join(', '),
    });
  },
  matchCognate(les, i, t) {
    const groups = [les.bank[i], ...U.sample(les.bank.filter((_, j) => j !== i), 2)];
    const pairs = groups.map(([g]) => { const [a, b] = U.sample(g, 2); return { a, b }; });
    return Object.assign({}, t, {
      kind: 'match', ui: 'match', pairs, word: null, show: null,
      prompt: '🔗 Соедини <b>родственные</b> слова',
      explain: pairs.map(p => `<b>${p.a}</b> — <b>${p.b}</b>`).join('<br>'), label: 'родственные: ' + pairs.map(p => p.a).join(', '),
    });
  },

  /* ---------- Отрисовка ---------- */
  html(t) {
    switch (t.ui) {
      case 'drag': return `<div class="drag-pool">${t.options.map(o => `<button class="opt tile" data-arg="${U.esc(o.v)}">${U.esc(o.label)}</button>`).join('')}</div><p class="small rf-tip">Тяни букву пальцем в пропуск (или просто нажми на неё)</p>`;
      case 'swipe': return `<div class="swipe-card" id="swCard"><span>${U.esc(t.card)}</span></div><div class="opts two">${t.options.map(o => `<button class="opt" data-act="ans" data-arg="${o.v}">${o.label}</button>`).join('')}</div>`;
      case 'find': return `<div class="find-line">${t.options.map(o => `<button class="opt find-w" data-act="ans" data-arg="${o.v}">${U.esc(o.label)}</button>`).join('')}</div>`;
      case 'sort': case 'build':
        return `<div class="sort-items" id="sItems">${t.items.map((x, k) => `<button class="s-item" data-k="${k}">${x.label}</button>`).join('')}</div>
          <div class="houses ${t.ui === 'build' ? 'blocks' : ''}">${t.houses.map(h => `<button class="house h-${h.v}" data-h="${U.esc(h.v)}"><span class="h-roof">${t.ui === 'build' ? '' : '🏠'}</span><b>${U.esc(h.label)}</b><span class="h-in"></span></button>`).join('')}</div>
          <p class="small rf-tip">Нажми на ${t.ui === 'build' ? 'часть слова' : 'слово'}, потом на ${t.ui === 'build' ? 'её место' : 'домик'} (или перетащи)</p>`;
      case 'cut': return `<div class="cut-word" id="cutW">${[...t.w].map((c, k) => `${k ? `<button class="cut-gap" data-g="${k}"><i>✂️</i></button>` : ''}<span class="cut-l">${c}</span>`).join('')}</div>
          ${t.mode === 'syll' ? '<button class="btn primary" id="cutOk">Готово</button>' : ''}`;
      case 'match': {
        const right = U.shuffle(t.pairs.map((p, k) => ({ b: p.b, k })));
        return `<div class="match"><div class="m-col">${t.pairs.map((p, k) => `<button class="m-it m-a" data-a="${k}">${U.esc(p.a)}</button>`).join('')}</div><svg class="m-lines" id="mLines"></svg>
          <div class="m-col">${right.map(x => `<button class="m-it m-b" data-b="${x.k}">${U.esc(x.b)}</button>`).join('')}</div></div><p class="small rf-tip">Нажми на слово слева, потом на его пару справа</p>`;
      }
    }
    return '';
  },
  bind(t, body) {
    if (t.ui === 'drag') RuFun.bindDrag(body);
    if (t.ui === 'swipe') RuFun.bindSwipe(body);
    if (t.ui === 'sort' || t.ui === 'build') RuFun.bindSort(t, body);
    if (t.ui === 'cut') RuFun.bindCut(t, body);
    if (t.ui === 'match') RuFun.bindMatch(t, body);
  },

  /* Перетаскивание пальцем: tile следует за пальцем, при отпускании — над целью или нет */
  dragable(el, onDrop, onTap) {
    el.addEventListener('pointerdown', ev => {
      if (el.disabled) return;
      ev.preventDefault();
      const r0 = el.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY;
      let moved = false, ghost = null;
      const move = e => {
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 8) return;
        if (!moved) { moved = true; ghost = el.cloneNode(true); ghost.classList.add('ghost'); ghost.style.cssText = `left:${r0.left}px;top:${r0.top}px;width:${r0.width}px;height:${r0.height}px`; document.body.appendChild(ghost); el.classList.add('lifted'); }
        ghost.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px) scale(1.08)`;
      };
      const up = e => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        if (!moved) { onTap(); return; }
        ghost.remove(); el.classList.remove('lifted');
        const target = document.elementFromPoint(e.clientX, e.clientY);
        onDrop(target);
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
  },
  bindDrag(body) {
    $$('.tile', body).forEach(b => RuFun.dragable(b, tg => { if (tg && tg.closest('#gap, #word')) answer(b.dataset.arg); else Sound.play('tap'); }, () => answer(b.dataset.arg)));
  },
  bindSwipe(body) {
    const c = $('#swCard', body); if (!c) return;
    let sx = null;
    c.addEventListener('pointerdown', e => { sx = e.clientX; c.style.transition = 'none'; });
    c.addEventListener('pointermove', e => { if (sx === null) return; const dx = e.clientX - sx; c.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`; c.classList.toggle('to-yes', dx > 40); c.classList.toggle('to-no', dx < -40); });
    const end = e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null; c.style.transition = '';
      if (Math.abs(dx) > 90 && !L.answered) { c.style.transform = `translateX(${dx > 0 ? 400 : -400}px) rotate(${dx > 0 ? 25 : -25}deg)`; c.style.opacity = '0'; setTimeout(() => answer(dx > 0 ? 'yes' : 'no'), 200); }
      else { c.style.transform = ''; c.classList.remove('to-yes', 'to-no'); }
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  },
  bindSort(t, body) {
    let sel = null, err = false, left = t.items.length;
    const items = $$('.s-item', body);
    const place = (k, h) => {
      const it = t.items[k], el = items[k];
      if (L.answered || el.classList.contains('placed')) return;
      if (String(it.v) === h.dataset.h) {
        el.classList.add('placed'); el.disabled = true;
        const chip = document.createElement('span'); chip.className = 'h-chip'; chip.innerHTML = it.label;
        h.querySelector('.h-in').appendChild(chip);
        Sound.play('coin'); left--;
        if (!left) setTimeout(() => answer(err ? 'bad' : 'ok'), 450);
      } else {
        err = true; Sound.play('wrong');
        h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake');
        el.classList.add('miss');
      }
      sel = null; items.forEach(x => x.classList.remove('sel'));
    };
    items.forEach((el, k) => RuFun.dragable(el, tg => { const h = tg && tg.closest('.house'); if (h) place(k, h); },
      () => { sel = k; items.forEach(x => x.classList.toggle('sel', x === el)); Sound.play('tap'); }));
    $$('.house', body).forEach(h => h.addEventListener('click', () => { if (sel !== null) place(sel, h); }));
  },
  bindCut(t, body) {
    const cuts = new Set();
    const gaps = $$('.cut-gap', body);
    const check = () => {
      if (L.answered) return;
      const ks = [...cuts].sort((a, b) => a - b);
      let ok;
      if (t.mode === 'syll') {
        const parts = []; let p = 0;
        ks.forEach(k => { parts.push(t.w.slice(p, k)); p = k; }); parts.push(t.w.slice(p));
        ok = parts.length === U.vowelCount(t.w) && parts.every(x => U.vowelCount(x) === 1);
      } else ok = HY.valid(t.w).includes(ks[0]);
      gaps.forEach(g => g.disabled = true);
      $('#cutW', body).classList.add(ok ? 'right' : 'wrong');
      answer(ok ? 'ok' : 'bad');
    };
    gaps.forEach(g => g.addEventListener('click', () => {
      const k = +g.dataset.g;
      if (cuts.has(k)) { cuts.delete(k); g.classList.remove('on'); } else { cuts.add(k); g.classList.add('on'); }
      Sound.play('pop');
      if (t.mode === 'hyph') check();
    }));
    const ok = $('#cutOk', body); if (ok) ok.addEventListener('click', check);
  },
  bindMatch(t, body) {
    let a = null, err = false, left = t.pairs.length;
    const svg = $('#mLines', body);
    const line = (ea, eb, cls) => {
      const r = svg.getBoundingClientRect(), A = ea.getBoundingClientRect(), B = eb.getBoundingClientRect();
      svg.insertAdjacentHTML('beforeend', `<line class="${cls}" x1="0" y1="${A.top + A.height / 2 - r.top}" x2="${r.width}" y2="${B.top + B.height / 2 - r.top}"/>`);
    };
    const cols = ['#FF6B9A', '#3A9BFF', '#22C55E', '#F59E0B'];
    $$('.m-a', body).forEach(el => el.addEventListener('click', () => { if (el.disabled || L.answered) return; a = el; $$('.m-a', body).forEach(x => x.classList.toggle('sel', x === el)); Sound.play('tap'); }));
    $$('.m-b', body).forEach(el => el.addEventListener('click', () => {
      if (!a || el.disabled || L.answered) return;
      if (a.dataset.a === el.dataset.b) {
        const c = cols[(t.pairs.length - left) % cols.length];
        a.disabled = el.disabled = true; a.classList.remove('sel'); a.style.background = el.style.background = c; a.style.color = el.style.color = '#fff';
        line(a, el, 'ok'); svg.lastElementChild.style.stroke = c;
        Sound.play('coin'); left--; a = null;
        if (!left) setTimeout(() => answer(err ? 'bad' : 'ok'), 450);
      } else { err = true; Sound.play('wrong'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    }));
  },

  /* ---------- Картинка с кляксами: каждый верный ответ стирает кляксу ---------- */
  blotHTML(world) {
    const sc = BLOT_SCENES[(world && world.wi) || 0] || BLOT_SCENES[0];
    const n = LESSON_LEN;
    return `<div class="blot-pic" id="blotPic"><span class="bp-scene">${sc}</span>${Array.from({ length: n }, (_, k) => `<i class="blot" style="left:${4 + (k * 93 / n) + (Math.random() * 4 - 2)}%;top:${10 + Math.random() * 40}%;--r:${Math.random() * 360}deg"></i>`).join('')}</div>`;
  },
  unblot() {
    const b = $('#blotPic .blot:not(.off)');
    if (!b) return;
    b.classList.add('off');
    if (!$('#blotPic .blot:not(.off)')) {
      $('#blotPic').classList.add('clean');
      Speech.sayPet(U.rnd(RU_LINES.clean), petStage());
    }
  },
};
