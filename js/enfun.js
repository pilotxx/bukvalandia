'use strict';
/* ============================================================
   Букваландия — игры с питомцем по-английски (EnFun)
   Обычное задание английской темы (makeTask) с вероятностью ~50 % заменяется игровым:
   🐾 команда питомцу (Run! Dance!) · 👆 Touch your nose! · 🧢 одень питомца (Put on the hat!) ·
   🎨 раскрась питомца (Make the cat blue!) · 📦 положи предмет (Put the ball in the box!) ·
   💬 разговор с питомцем (вопрос в облачке).
   Номер задания в банке темы сохраняется — звёзды, ошибки и «Работа над ошибками» работают как раньше.
   Ответ в answer() — 'ok' / 'bad' (вид задания 'ef'). Все команды озвучены записями (voice/en-N.js).
   ============================================================ */

/* Вид питомца по-английски */
const EF_SPECIES = { dragon: 'dragon', cat: 'cat', bunny: 'rabbit' };

/* Действия для команд: эмодзи-карточка, движение питомца, предмет в лапах */
const EF_ACT = {
  'run': { em: '🏃', anim: 'run' },
  'swim': { em: '🏊', anim: 'swim', prop: '🌊' },
  'fly': { em: '🕊️', anim: 'fly' },
  'sing': { em: '🎤', anim: 'bounce', prop: '🎶' },
  'dance': { em: '💃', anim: 'dance' },
  'read': { em: '📖', anim: 'bounce', prop: '📖' },
  'write': { em: '✍️', anim: 'bounce', prop: '✏️' },
  'draw': { em: '🎨', anim: 'bounce', prop: '🎨' },
  'climb': { em: '🧗', anim: 'fly', prop: '🪜' },
  'ride a bike': { em: '🚴', anim: 'run', prop: '🚲' },
  'sleep': { em: '😴', anim: 'sleep', mood: 'sleep', prop: '💤' },
  'skate': { em: '⛸️', anim: 'glide', prop: '⛸️' },
  'ski': { em: '⛷️', anim: 'glide', prop: '🎿' },
  'play football': { em: '⚽', anim: 'run', prop: '⚽' },
};

/* Одежда: английское слово → вещь из магазина (ITEMS); col — цвет в команде */
const EF_CLOTHES = [
  { en: 'hat', ru: 'шляпу', id: 'straw' },
  { en: 'cap', ru: 'кепку', id: 'cap' },
  { en: 'scarf', ru: 'шарф', id: 'scarf' },
  { en: 'T-shirt', ru: 'красную футболку', id: 'tee_red', col: 'red' },
  { en: 'T-shirt', ru: 'синюю футболку', id: 'tee_blue', col: 'blue' },
  { en: 'dress', ru: 'платье', id: 'dress_pink' },
  { en: 'boots', ru: 'сапожки', id: 'rainboots' },
  { en: 'shoes', ru: 'туфли', id: 'shoes' },
];

/* Цвета для раскрашивания (белый не виден на светлом фоне) */
const EF_COLS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'grey'];

/* Перевод английского слова по словарям V */
function efRu(en) {
  for (const list of Object.values(V)) { const w = list.find(x => x[0] === en); if (w) return w[1]; }
  return en;
}
const efCap = s => s.charAt(0).toUpperCase() + s.slice(1);

const EnFun = {
  KINDS: ['ef'],
  /* Темы: [доля игровых заданий, генератор]; генератор может вернуть null — остаётся обычное задание */
  TOPICS: {
    e_actions: [0.5, (les, i) => EnFun.simonTask()],
    e_body: [0.5, (les, i) => EnFun.touchTask()],
    e_clothes: [0.5, (les, i) => EnFun.dressTask()],
    e_colours: [0.4, (les, i) => EnFun.paintTask()],
    e_prep: [0.55, (les, i) => EnFun.whereTask(les.bank[i])],
    e_toys: [0.35, (les, i) => EnFun.whereTask(null)],
    e_dialog: [0.6, (les, i) => EnFun.talkTask(les.bank[i])],
    e_time: [0.4, (les, i) => enClockTask(les.bank[i])],          // «поставь стрелки» (MathFun) по английской фразе
  },

  /* ---------- Превращение задания ---------- */
  transform(t, les, i) {
    if (!t || les.subject.id !== 'en' || t.lid) return t;
    const g = EnFun.TOPICS[les.id];
    if (!g || Math.random() >= g[0]) return t;
    try {
      const n = g[1](les, i);
      if (n) return Object.assign({ kind: 'ef', hint: '', explain: '' }, n);
    } catch (e) { console.error('Задание-игра (английский)', les.id, e); }
    return t;
  },

  /* 🐾 Команда питомцу: Run! Dance! — выбери карточку, питомец выполнит */
  simonTask() {
    const verbs = Object.keys(EF_ACT);
    const v = U.rnd(verbs);
    const others = U.sample(verbs.filter(x => x !== v && EF_ACT[x].em !== EF_ACT[v].em), 3);
    const cmd = efCap(v) + '!';
    return {
      ef: 'simon', verb: v, opts: U.shuffle([v, ...others]),
      prompt: `🐾 Команда для питомца: <b>${cmd}</b> Что нужно сделать?`,
      say: cmd, auto: true, sayAfter: cmd,
      explain: `<b>${cmd}</b> — ${efRu(v)}! ${EF_ACT[v].em}`,
      hint: `${EF_ACT[v].em} <b>${v}</b> — ${efRu(v)}.`,
      label: cmd,
    };
  },

  /* 👆 Touch your nose! — покажи часть на питомце */
  touchTask() {
    const parts = V.body.filter(([en]) => !['arm', 'face', 'finger'].includes(en));   // похожие пары путают (hand/arm)
    const p = U.rnd(parts);
    const others = U.sample(parts.filter(x => x[0] !== p[0]), 3);
    const cmd = `Touch your ${p[0]}!`;
    return {
      ef: 'touch', part: p[0], opts: U.shuffle([p, ...others]),
      prompt: `👆 <b>${cmd}</b> Дотронься до нужного места!`,
      say: cmd, auto: true, sayAfter: cmd,
      explain: `<b>${cmd}</b> — дотронься до: ${p[1]} ${p[2]}`,
      hint: `<b>${p[0]}</b> — ${p[1]}.`,
      label: cmd,
    };
  },

  /* 🧢 Put on the hat! — одень питомца */
  dressTask() {
    const c = U.rnd(EF_CLOTHES);
    const pool = EF_CLOTHES.filter(x => x !== c && (c.col ? true : x.en !== c.en));
    let others = U.sample(pool, 3);
    if (c.col) {   // «red T-shirt»: вторая футболка — обязательная ловушка
      const twin = pool.find(x => x.en === c.en);
      if (twin && !others.includes(twin)) others = [twin, ...others.slice(0, 2)];
    }
    const cmd = `Put on the ${c.col ? c.col + ' ' : ''}${c.en}!`;
    return {
      ef: 'dress', item: c.id, opts: U.shuffle([c, ...others]),
      prompt: `🧢 <b>${cmd}</b> Надень это на питомца!`,
      say: cmd, auto: true, sayAfter: cmd,
      explain: `<b>${cmd}</b> — надень ${c.ru}! ${ITEMS[c.id] ? ITEMS[c.id].icon : ''}`,
      hint: `<b>${c.en}</b> — ${efRu(c.en)}.`,
      label: cmd,
    };
  },

  /* 🎨 Make the cat blue! — раскрась питомца */
  paintTask() {
    const sp = EF_SPECIES[S.pet.species] || 'cat';
    const col = U.rnd(EF_COLS);
    const others = U.sample(EF_COLS.filter(x => x !== col), 3);
    const cmd = `Make the ${sp} ${col}!`;
    const ru = efRu(col);
    return {
      ef: 'paint', col, opts: U.shuffle([col, ...others]),
      prompt: `🎨 <b>${cmd}</b> Раскрась питомца!`,
      say: cmd, auto: true, sayAfter: cmd,
      explain: `<b>${cmd}</b> — сделай питомца ${ru.replace(/ый$|ой$/, 'ым').replace(/ий$/, 'им')}! ${EnFun.swatch(col)}`,
      hint: `<b>${col}</b> — ${ru}.`,
      label: cmd,
    };
  },
  swatch(col) { const c = V.colours.find(x => x[0] === col); return c ? `<span class="sw" style="background:${c[2]}"></span>` : ''; },

  /* 📦 Put the ball in the box! — перетащи предмет на место */
  whereTask(bankItem) {
    let w, em, rel;
    if (bankItem) { [w, em, rel] = bankItem; }       // тема in/on/under: её же слова и предлог
    else { const t = U.rnd(V.toys); w = t[0]; em = t[2]; rel = U.rnd(['in', 'on', 'under']); }
    const place = rel === 'in' ? 'box' : 'table';
    const cmd = `Put the ${w} ${rel} the ${place}.`;
    const done = `The ${w} is ${rel} the ${place}.`;
    const RU = { in: 'в коробку', on: 'на стол', under: 'под стол' };
    return {
      ef: 'where', obj: em, rel,
      prompt: `📦 <b>${cmd}</b> Перетащи!`,
      say: cmd, auto: true, sayAfter: done,
      explain: `<b>${done}</b> — положи ${em} ${RU[rel]}: <b>${rel}</b>.`,
      hint: `<b>in</b> — в, <b>on</b> — на, <b>under</b> — под.`,
      label: `${w} ${rel} (игра)`,
    };
  },

  /* 💬 Разговор с питомцем: вопрос в облачке, выбери ответ */
  talkTask(item) {
    const [q, qru, a, aru, wrong] = item;
    return {
      ef: 'talk', q, opts: U.shuffle([a, ...wrong]),
      prompt: '💬 Питомец говорит с тобой! Выбери ответ',
      say: q, auto: true, sayAfter: a, answerText: a,
      explain: `<i>${q}</i> — ${qru}<br><b>${a}</b> — ${aru}`,
      label: q,
    };
  },

  /* ---------- Отрисовка ---------- */
  pet(extra = {}) { return typeof petSVG === 'function' ? petSVG(Object.assign({ uid: 'ef' }, extra)) : '🐾'; },
  html(t) {
    switch (t.ef) {
      case 'simon':
        return `<div class="ef-stage" id="efStage"><div class="ef-pet" id="efPet">${EnFun.pet({ mood: 'wow' })}</div></div>
          <div class="opts letters ef-acts">${t.opts.map(v => `<button class="opt ef-act" data-v="${U.esc(v)}" aria-label="${U.esc(v)}">${EF_ACT[v].em}</button>`).join('')}</div>
          <p class="small rf-tip">Нажми на карточку — питомец выполнит команду</p>`;
      case 'touch':
        return `<div class="ef-stage" id="efStage"><div class="ef-pet" id="efPet">${EnFun.pet({ mood: 'happy' })}</div></div>
          <div class="opts letters ef-acts">${t.opts.map(p => `<button class="opt ef-act" data-v="${U.esc(p[0])}" aria-label="${U.esc(p[0])}">${p[2]}</button>`).join('')}</div>`;
      case 'dress':
        return `<div class="ef-stage" id="efStage"><div class="ef-pet" id="efPet">${EnFun.pet({ mood: 'happy' })}</div></div>
          <div class="opts letters ef-acts">${t.opts.map(c => `<button class="opt ef-act ${c.col ? 'ef-tint' : ''}" data-v="${U.esc(c.id)}" ${c.col ? `style="--tint:${c.col === 'red' ? '#E53935' : '#1E88E5'}"` : ''} aria-label="${U.esc(c.en)}">${ITEMS[c.id] ? ITEMS[c.id].icon : '👕'}</button>`).join('')}</div>`;
      case 'paint':
        return `<div class="ef-stage" id="efStage"><div class="ef-pet" id="efPet">${EnFun.pet({ mood: 'happy' })}</div></div>
          <div class="opts letters ef-acts">${t.opts.map(col => { const hex = V.colours.find(x => x[0] === col)[2]; return `<button class="opt ef-act ef-col" data-v="${U.esc(col)}" style="--tint:${hex}" aria-label="${U.esc(col)}"><i></i></button>`; }).join('')}</div>`;
      case 'where':
        return `<div class="ef-scene" id="efScene">
            <button class="ef-obj" id="efObj">${t.obj}</button>
            <div class="ef-spot"><div class="ef-zone" data-rel="on"><span>on</span></div><div class="ef-table"></div><div class="ef-zone" data-rel="under"><span>under</span></div></div>
            <div class="ef-spot"><div class="ef-box"><div class="ef-zone zin" data-rel="in"><span>in</span></div></div></div>
          </div><p class="small rf-tip">Тяни предмет пальцем на место (или нажми: сначала предмет, потом место)</p>`;
      case 'talk':
        return `<div class="ef-talk"><div class="ef-pet sm" id="efPet">${EnFun.pet({ mood: 'wow' })}</div><div class="qbubble ef-q">${U.esc(t.q)}</div></div>
          <div class="opts list">${t.opts.map(a => `<button class="opt ef-ans" data-v="${U.esc(a)}">${U.esc(a)}</button>`).join('')}</div>`;
    }
    return '';
  },

  bind(t, body) {
    if (t.ef === 'where') { EnFun.bindWhere(t, body); return; }
    const stage = $('#efPet', body);
    const buttons = $$('.ef-act, .ef-ans', body);
    buttons.forEach(b => b.addEventListener('click', () => {
      if (L.answered || b.disabled) return;
      const v = b.dataset.v;
      const okAns = t.ef === 'simon' ? t.verb : t.ef === 'touch' ? t.part : t.ef === 'dress' ? t.item : t.ef === 'paint' ? t.col : t.answerText;
      const ok = v === String(okAns);
      buttons.forEach(x => { x.disabled = true; });
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) { answer('bad'); return; }
      /* питомец выполняет: движение, предмет, одежда или цвет */
      if (stage) {
        if (t.ef === 'simon') {
          const a = EF_ACT[t.verb];
          stage.innerHTML = EnFun.pet({ mood: a.mood || 'laugh' }) + (a.prop ? `<span class="ef-prop">${a.prop}</span>` : '');
          stage.classList.add('a-' + a.anim);
        } else if (t.ef === 'touch') { stage.innerHTML = EnFun.pet({ mood: 'laugh' }); stage.classList.add('a-bounce'); }
        else if (t.ef === 'dress') { const it = ITEMS[t.item]; stage.innerHTML = EnFun.pet({ mood: 'love', [it.cat]: it }); stage.classList.add('a-bounce'); }
        else if (t.ef === 'paint') { const hex = V.colours.find(x => x[0] === t.col)[2]; stage.innerHTML = EnFun.pet({ mood: 'love', color: hex }); stage.classList.add('a-bounce'); }
        else if (t.ef === 'talk') { stage.innerHTML = EnFun.pet({ mood: 'love' }); stage.classList.add('a-bounce'); }
      }
      Sound.play('pet');
      setTimeout(() => answer('ok'), 900);
    }));
  },

  bindWhere(t, body) {
    const obj = $('#efObj', body);
    let sel = false, done = false;
    const drop = zone => {
      if (L.answered || !zone || done) return;
      done = true;
      const ok = zone.dataset.rel === t.rel;
      zone.classList.add(ok ? 'right' : 'wrong');
      zone.appendChild(obj);
      obj.classList.add('placed');
      setTimeout(() => answer(ok ? 'ok' : 'bad'), ok ? 500 : 350);
    };
    RuFun.dragable(obj, tg => { const z = tg && tg.closest('.ef-zone'); if (z) drop(z); else Sound.play('tap'); },
      () => { sel = !sel; obj.classList.toggle('sel', sel); Sound.play('tap'); });
    $$('.ef-zone', body).forEach(z => z.addEventListener('click', () => { if (sel) drop(z); }));
  },

  /* ---------- Полный список английских фраз для озвучки (тест/англ_фразы.html) ---------- */
  phrases() {
    const out = [];
    Object.keys(EF_ACT).forEach(v => out.push(efCap(v) + '!'));
    V.body.forEach(([en]) => out.push(`Touch your ${en}!`));
    EF_CLOTHES.forEach(c => out.push(`Put on the ${c.col ? c.col + ' ' : ''}${c.en}!`));
    Object.values(EF_SPECIES).forEach(sp => EF_COLS.forEach(col => out.push(`Make the ${sp} ${col}!`)));
    const nouns = [...new Set(['cat', 'dog', 'ball', 'book', 'mouse', 'teddy bear', 'apple', ...V.toys.map(x => x[0])])];
    nouns.forEach(w => ['in', 'on', 'under'].forEach(rel => {
      const place = rel === 'in' ? 'box' : 'table';
      out.push(`Put the ${w} ${rel} the ${place}.`);
      out.push(`The ${w} is ${rel} the ${place}.`);
    }));
    return out;
  },
};
