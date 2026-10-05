'use strict';
/* ============================================================
   Числоград — математика 2–3 класса.
   Методика: «предмет → картинка → число» (CPA): брусочки-десятки, рамка десяти,
   группы предметов, схемы к задачам, часы, клетчатые фигуры; стратегии устного счёта;
   ответ вводится с клавиатуры (угадать нельзя); сложность растёт внутри урока и после 2 звёзд.
   ============================================================ */

const GEN = { boost: 0 };                       // +1 к сложности, когда тема уже на 2–3 звезды
const RAMP = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]; // банк урока математики = уровни сложности
const mr = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const lvD = d => Math.min(3, d + GEN.boost);
/* Число, не оканчивающееся на 1 (кроме 11), — чтобы в задачах всегда было «5 яблок», «3 яблока» */
function notOne(a, b) { let x, k = 0; do { x = mr(a, b); k++; } while (x % 10 === 1 && x % 100 !== 11 && k < 60); return x; }

const NOUN = {
  орех: ['орех', 'ореха', 'орехов'], гриб: ['гриб', 'гриба', 'грибов'], карандаш: ['карандаш', 'карандаша', 'карандашей'],
  шарик: ['шарик', 'шарика', 'шариков'], марка: ['марка', 'марки', 'марок'], конфета: ['конфета', 'конфеты', 'конфет'],
  яблоко: ['яблоко', 'яблока', 'яблок'], наклейка: ['наклейка', 'наклейки', 'наклеек'], рубль: ['рубль', 'рубля', 'рублей'],
  пакет: ['пакет', 'пакета', 'пакетов'], коробка: ['коробки', 'коробки', 'коробок'], тетрадь: ['тетрадь', 'тетради', 'тетрадей'],
  раз: ['раз', 'раза', 'раз'], см: ['см', 'см', 'см'],
};
const nw = (k, w) => `${k} ${U.plural(k, ...NOUN[w])}`;
const many = w => NOUN[w][2];
const KIDS = [['Маша', 'Маши'], ['Петя', 'Пети'], ['Оля', 'Оли'], ['Ваня', 'Вани'], ['Катя', 'Кати'], ['Дима', 'Димы']];
const COUNTABLE = ['яблоко', 'марка', 'конфета', 'наклейка', 'орех', 'гриб', 'шарик'];
const MASC = ['орех', 'гриб', 'карандаш', 'шарик'];   // винительный = именительный: «21 орех разложили»

/* ---------- Конструкторы заданий ---------- */
function inTask(prompt, show, answer, o = {}) {
  return Object.assign({ kind: 'input', prompt, show: show.includes('[?]') ? show : show + '<div class="eq">[?]</div>', answer: String(answer) }, o);
}
const eq = s => `<div class="eq">${s}</div>`;
function cmpTask(a, b, show, explain, label) {
  const s = a > b ? '>' : a < b ? '<' : '=';
  return T.choice('Поставь знак: <b>&lt;</b>, <b>&gt;</b> или <b>=</b>', ['<', '>', '='].map(x => opt(x, x)), s,
    { keepOrder: true, show: eq(show.replace('○', '<span class="cmp">?</span>')), explain, label });
}

/* ---------- Наглядные модели ---------- */
const VIS = {
  blocks: (t, o) => `<div class="b10">${'<i class="rod"></i>'.repeat(t)}<span class="ones">${'<i class="cube"></i>'.repeat(o)}</span></div>`,
  frame: k => `<div class="tenf">${Array.from({ length: 10 }, (_, i) => `<i class="${i < k ? 'on' : ''}"></i>`).join('')}</div>`,
  groups: (a, b, em) => `<div class="grp">${Array.from({ length: a }, () => `<span>${em.repeat(b)}</span>`).join('')}</div>`,
  clock(h, m) {
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const a = i * 6 * Math.PI / 180, big = i % 5 === 0;
      const r1 = big ? 40 : 43;
      ticks += `<line x1="${(50 + r1 * Math.sin(a)).toFixed(1)}" y1="${(50 - r1 * Math.cos(a)).toFixed(1)}" x2="${(50 + 46 * Math.sin(a)).toFixed(1)}" y2="${(50 - 46 * Math.cos(a)).toFixed(1)}" stroke="#2B2350" stroke-width="${big ? 2 : 0.8}"/>`;
    }
    let nums = '';
    for (let i = 1; i <= 12; i++) {
      const a = i * 30 * Math.PI / 180;
      nums += `<text x="${(50 + 33 * Math.sin(a)).toFixed(1)}" y="${(50 - 33 * Math.cos(a)).toFixed(1)}" font-size="9" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#2B2350">${i}</text>`;
    }
    const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
    return `<svg class="clock" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff" stroke="#7C5CFF" stroke-width="3"/>${ticks}${nums}
      <line x1="50" y1="50" x2="50" y2="27" stroke="#2B2350" stroke-width="4.5" stroke-linecap="round" transform="rotate(${ha} 50 50)"/>
      <line x1="50" y1="50" x2="50" y2="13" stroke="#FF7A59" stroke-width="2.6" stroke-linecap="round" transform="rotate(${ma} 50 50)"/>
      <circle cx="50" cy="50" r="3.5" fill="#2B2350"/></svg>`;
  },
  rect(a, b, unit = 'см', grid = false) {
    const sc = Math.min(170 / a, 100 / b), w = a * sc, h = b * sc, x = (220 - w) / 2, y = 14;
    let g = '';
    if (grid) {
      for (let i = 1; i < a; i++) g += `<line x1="${x + i * sc}" y1="${y}" x2="${x + i * sc}" y2="${y + h}" stroke="#7C5CFF" stroke-width="1" opacity=".45"/>`;
      for (let j = 1; j < b; j++) g += `<line x1="${x}" y1="${y + j * sc}" x2="${x + w}" y2="${y + j * sc}" stroke="#7C5CFF" stroke-width="1" opacity=".45"/>`;
    }
    const lab = grid ? '' : `<text x="${x + w / 2}" y="${y + h + 16}" text-anchor="middle" font-size="14" font-weight="800" fill="#2B2350">${a} ${unit}</text>
      <text x="${x + w + 8}" y="${y + h / 2}" font-size="14" font-weight="800" fill="#2B2350" dominant-baseline="central">${b} ${unit}</text>`;
    return `<svg class="fig" viewBox="0 0 260 ${y + h + 26}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#E9E2FF" stroke="#5B3FE0" stroke-width="3" rx="2"/>${g}${lab}</svg>`;
  },
  tri(a, b, c, unit = 'см') {
    return `<svg class="fig" viewBox="0 0 240 150"><path d="M30 130 L210 130 L95 20 Z" fill="#FFE9D6" stroke="#E2552F" stroke-width="3" stroke-linejoin="round"/>
      <text x="120" y="147" text-anchor="middle" font-size="14" font-weight="800" fill="#2B2350">${a} ${unit}</text>
      <text x="40" y="72" font-size="14" font-weight="800" fill="#2B2350">${b} ${unit}</text>
      <text x="160" y="72" font-size="14" font-weight="800" fill="#2B2350">${c} ${unit}</text></svg>`;
  },
  poly(n) {
    const pts = [];
    const rot = Math.random() * Math.PI;
    for (let i = 0; i < n; i++) {
      const a = rot + i * 2 * Math.PI / n + (Math.random() - 0.5) * (Math.PI / n) * 0.5;
      const r = 40 + Math.random() * 8;
      pts.push(`${(60 + r * Math.cos(a)).toFixed(1)},${(55 + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<svg class="fig small" viewBox="0 0 120 110"><polygon points="${pts.join(' ')}" fill="#D7F5E3" stroke="#15994A" stroke-width="3" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3.5" fill="#15994A"/>`).join('')}</svg>`;
  },
  /* Схема к задаче: строки с отрезками, длина пропорциональна числу */
  bars(rows, note = '') {
    const max = Math.max(...rows.map(r => r.segs.reduce((s, x) => s + x.v, 0)));
    return `<div class="barm">${rows.map(r => `<div class="bm-row"><span class="bm-l">${r.label}</span><div class="bm-track">${r.segs.map(s =>
      `<div class="bm-seg ${s.cls || ''}" style="width:${(100 * s.v / max).toFixed(1)}%">${s.t}</div>`).join('')}</div></div>`).join('')}${note ? `<div class="bm-note">${note}</div>` : ''}</div>`;
  },
};

/* ---------- Таблица умножения: 36 фактов для тренажёра ---------- */
const MUL_FACTS = [];
for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) MUL_FACTS.push([a, b]);
const mulKey = (a, b) => Math.min(a, b) + 'x' + Math.max(a, b);

/* ============================================================
   МИРЫ ЧИСЛОГРАДА
   ============================================================ */
const MATH_WORLDS = [

  /* ------------------------------------------------ 1 */
  {
    id: 'mw1', name: 'Площадь Чисел', emoji: '🏛️', c1: '#FFB86B', c2: '#FF7E67',
    boss: { id: 'mb1', name: 'Енот Пересчёт', emoji: '🦝', hp: 8, story: 'Енот Пересчёт перемешал все числа на площади. Наведи порядок!' },
    lessons: [
      {
        id: 'm_tens', title: 'Десятки и единицы', icon: '🧱', grade: 2, ramp: true, bank: RAMP,
        rule: `Брусок — это <b>десяток</b> (10), кубик — <b>единица</b> (1).${VIS.blocks(3, 4)}3 десятка и 4 единицы — это <b>34</b>. В записи числа сначала пишем десятки, потом единицы.`,
        make(d0) {
          const d = lvD(d0);
          if (d === 1) {
            const t = mr(1, 4), o = mr(0, 9), n = 10 * t + o;
            return inTask('Какое число показано?', VIS.blocks(t, o), n, { explain: `${t} дес. и ${o} ед. — это <b>${n}</b>.`, hint: 'Каждый брусок — 10, каждый кубик — 1. Считай бруски десятками: 10, 20, 30…', label: `${t} дес. ${o} ед.` });
          }
          if (d === 2) {
            const n = mr(12, 99), t = Math.floor(n / 10), o = n % 10, dec = Math.random() < 0.5;
            return inTask(`Сколько <b>${dec ? 'десятков' : 'единиц'}</b> в числе ${n}?`, eq(String(n)), dec ? t : o,
              { explain: `${n} = ${t} дес. ${o} ед. ${dec ? 'Десятков' : 'Единиц'} — <b>${dec ? t : o}</b>.`, hint: 'Первая цифра двузначного числа — десятки, вторая — единицы.', label: `${dec ? 'десятки' : 'единицы'} в ${n}` });
          }
          const v = mr(1, 3);
          if (v === 1) { const t = mr(2, 9); return inTask('Запиши число', eq(`${t} дес. 0 ед. = [?]`), t * 10, { explain: `${t} десятков без единиц — это <b>${t * 10}</b>.`, hint: 'Если единиц нет, на их месте пишем 0.', label: `${t} дес. 0 ед.` }); }
          if (v === 2) { const t = mr(2, 9); return inTask(`Сколько единиц в ${t} десятках?`, eq(`${t} дес. = [?] ед.`), t * 10, { explain: `В одном десятке 10 единиц, в ${t} десятках — <b>${t * 10}</b>.`, hint: '1 десяток = 10 единиц.', label: `${t} дес. в ед.` }); }
          const t = mr(1, 9), o = mr(1, 9);
          return inTask('Какое число состоит из…', eq(`${t} дес. и ${o} ед. = [?]`), t * 10 + o, { explain: `Пишем десятки, потом единицы: <b>${t * 10 + o}</b>.`, hint: 'Сначала цифра десятков, потом цифра единиц.', label: `${t} дес. ${o} ед.` });
        },
      },
      {
        id: 'm_compare', title: 'Сравнение чисел', icon: '⚖️', grade: 2, ramp: true, bank: RAMP,
        rule: 'Сначала сравни <b>десятки</b>: у кого больше, то число и больше. <i>52 &gt; 47</i>.<br>Если десятков поровну — сравни <b>единицы</b>: <i>43 &lt; 46</i>.<br>Острый клювик знака смотрит на меньшее число.',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) {
            let a, b; do { a = mr(10, 99); b = mr(10, 99); } while (Math.floor(a / 10) === Math.floor(b / 10));
            return cmpTask(a, b, `${a} ○ ${b}`, `Сравниваем десятки: ${Math.floor(a / 10)} и ${Math.floor(b / 10)}. Значит, <b>${a} ${a > b ? '&gt;' : '&lt;'} ${b}</b>.`, `${a} и ${b}`);
          }
          if (d === 2) {
            let a, b;
            if (Math.random() < 0.5) { const t = mr(1, 9); a = t * 10 + mr(0, 9); do { b = t * 10 + mr(0, 9); } while (b === a); }
            else { do { a = mr(12, 98); b = (a % 10) * 10 + Math.floor(a / 10); } while (a % 10 === 0 || a === b); }
            const sameT = Math.floor(a / 10) === Math.floor(b / 10);
            return cmpTask(a, b, `${a} ○ ${b}`, sameT ? `Десятков поровну, сравниваем единицы: <b>${a} ${a > b ? '&gt;' : '&lt;'} ${b}</b>.` : `Сравниваем десятки: <b>${a} ${a > b ? '&gt;' : '&lt;'} ${b}</b>.`, `${a} и ${b}`);
          }
          const x = mr(10, 60), y = mr(2, 30), s = x + y;
          const n = Math.random() < 0.3 ? s : s + U.rnd([-10, -1, 1, 10, 9, -9]);
          return cmpTask(s, n, `${x} + ${y} ○ ${n}`, `Сначала посчитай: ${x} + ${y} = ${s}. Значит, <b>${s} ${s > n ? '&gt;' : s < n ? '&lt;' : '='} ${n}</b>.`, `${x}+${y} и ${n}`);
        },
      },
      {
        id: 'm_seq', title: 'Числовые цепочки', icon: '🔗', grade: 2, ramp: true, bank: RAMP,
        rule: 'Найди <b>правило</b> цепочки: на сколько меняется каждое следующее число?<br><i>5, 10, 15, 20 → каждый раз +5, дальше 25</i>.',
        make(d0) {
          const d = lvD(d0);
          const step = d === 1 ? U.rnd([2, 5, 10]) : d === 2 ? U.rnd([-2, -5, -10, 3]) : U.rnd([4, 6, 9, -3, -4]);
          let s;
          if (step > 0) s = mr(0, 100 - step * 5); else s = mr(-step * 5, 100);
          const seq = Array.from({ length: 5 }, (_, i) => s + step * i);
          const hide = d === 3 && Math.random() < 0.5 ? mr(1, 3) : 4;
          const show = seq.map((x, i) => i === hide ? '[?]' : x).join(', ');
          return inTask('Какое число пропущено?', eq(show), seq[hide],
            { explain: `Правило: каждый раз <b>${step > 0 ? '+' + step : '−' + (-step)}</b>. Пропущено число <b>${seq[hide]}</b>.`, hint: 'Посмотри, на сколько отличаются два соседних числа.', label: show.replace('[?]', '?') });
        },
      },
    ],
  },

  /* ------------------------------------------------ 2 */
  {
    id: 'mw2', name: 'Улица Десятка', emoji: '🎡', c1: '#7FD8BE', c2: '#2BB39A',
    boss: { id: 'mb2', name: 'Крокодил Обжора', emoji: '🐊', hp: 8, story: 'Крокодил Обжора проглотил все десятки! Считай быстро и точно — и он их вернёт.' },
    lessons: [
      {
        id: 'm_to10', title: 'Состав числа 10', icon: '🔟', grade: 2, ramp: true, bank: RAMP,
        rule: `Знать, сколько не хватает до 10, — главный секрет быстрого счёта!${VIS.frame(7)}7 и 3 — вместе 10. Пары: 1+9, 2+8, 3+7, 4+6, 5+5.`,
        make(d0) {
          const d = lvD(d0), k = mr(1, 9);
          if (d === 1) return inTask('Сколько кружков не хватает до 10?', VIS.frame(k), 10 - k, { explain: `${k} и <b>${10 - k}</b> — вместе 10.`, hint: 'Посчитай пустые клеточки.', label: `${k} до 10` });
          if (d === 2) return inTask('Дополни до 10', eq(`${k} + [?] = 10`), 10 - k, { explain: `${k} + <b>${10 - k}</b> = 10.`, hint: 'Вспомни пары: 1+9, 2+8, 3+7, 4+6, 5+5.', label: `${k} + ? = 10` });
          return inTask('Найди пропущенное число', eq(`10 − [?] = ${k}`), 10 - k, { explain: `10 − <b>${10 - k}</b> = ${k}, потому что ${k} + ${10 - k} = 10.`, hint: 'Сколько нужно прибавить к ответу, чтобы получилось 10?', label: `10 − ? = ${k}` });
        },
      },
      {
        id: 'm_over10', title: 'Сложение через десяток', icon: '➕', grade: 2, ramp: true, bank: RAMP,
        rule: `Сначала <b>дополни до 10</b>, потом прибавь остаток:<br><i>8 + 5 = 8 + 2 + 3 = 10 + 3 = 13</i>`,
        make(d0) {
          const d = lvD(d0);
          const a = d === 1 ? 9 : d === 2 ? U.rnd([8, 7]) : mr(5, 9);
          const b = mr(11 - a, 9), s = a + b, p = 10 - a;
          const [x, y] = d === 3 && Math.random() < 0.5 ? [b, a] : [a, b];
          return inTask('Реши пример', eq(`${x} + ${y} = [?]`), s,
            { explain: `${a} + ${b} = ${a} + ${p} + ${b - p} = 10 + ${b - p} = <b>${s}</b>.`, hint: `Дополни ${a} до 10: нужно ${p}. Сколько ещё останется прибавить?`, label: `${x} + ${y}` });
        },
      },
      {
        id: 'm_sub20', title: 'Вычитание через десяток', icon: '➖', grade: 2, ramp: true, bank: RAMP,
        rule: 'Вычитай <b>по частям</b>: сначала до 10, потом остальное.<br><i>13 − 5 = 13 − 3 − 2 = 10 − 2 = 8</i>',
        make(d0) {
          const d = lvD(d0);
          const c = d === 1 ? mr(11, 13) : d === 2 ? mr(12, 15) : mr(13, 18);
          const b = mr(c - 9, 9), r = c - b, u = c - 10;
          return inTask('Реши пример', eq(`${c} − ${b} = [?]`), r,
            { explain: `${c} − ${b} = ${c} − ${u} − ${b - u} = 10 − ${b - u} = <b>${r}</b>.`, hint: `Сначала отними ${u}, чтобы получилось 10.`, label: `${c} − ${b}` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 3 */
  {
    id: 'mw3', name: 'Мост Сотни', emoji: '🌉', c1: '#7CC6FF', c2: '#3D7BF7',
    boss: { id: 'mb3', name: 'Черепаха Тихоход', emoji: '🐢', hp: 10, story: 'Черепаха Тихоход загородила Мост Сотни. Реши её примеры — и она уступит дорогу!' },
    lessons: [
      {
        id: 'm_round10', title: 'Круглые десятки', icon: '🎯', grade: 2, ramp: true, bank: RAMP,
        rule: 'Круглые числа складывай как десятки:<br><i>30 + 40 = 3 дес. + 4 дес. = 7 дес. = 70</i>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) { const a = mr(1, 8), b = mr(1, 9 - a); return inTask('Реши пример', eq(`${a * 10} + ${b * 10} = [?]`), (a + b) * 10, { explain: `${a} дес. + ${b} дес. = ${a + b} дес. = <b>${(a + b) * 10}</b>.`, hint: 'Считай десятками, как единицами.', label: `${a * 10} + ${b * 10}` }); }
          if (d === 2) { const a = mr(3, 10), b = mr(1, a - 1); return inTask('Реши пример', eq(`${a * 10} − ${b * 10} = [?]`), (a - b) * 10, { explain: `${a} дес. − ${b} дес. = ${a - b} дес. = <b>${(a - b) * 10}</b>.`, hint: 'Считай десятками, как единицами.', label: `${a * 10} − ${b * 10}` }); }
          const v = mr(1, 3);
          if (v === 1) { const b = mr(1, 9); return inTask('Реши пример', eq(`100 − ${b * 10} = [?]`), 100 - b * 10, { explain: `100 — это 10 десятков. 10 дес. − ${b} дес. = <b>${100 - b * 10}</b>.`, hint: '100 = 10 десятков.', label: `100 − ${b * 10}` }); }
          if (v === 2) { const a = mr(2, 9), u = mr(1, 9); return inTask('Реши пример', eq(`${a * 10} + ${u} = [?]`), a * 10 + u, { explain: `${a} дес. и ${u} ед. — это <b>${a * 10 + u}</b>.`, hint: 'Десятки и единицы просто записываем рядом.', label: `${a * 10} + ${u}` }); }
          const a = mr(2, 9), u = mr(1, 9); return inTask('Реши пример', eq(`${a * 10 + u} − ${u} = [?]`), a * 10, { explain: `Убрали все единицы — остались ${a} дес. = <b>${a * 10}</b>.`, hint: 'Сколько единиц в числе? Их и убираем.', label: `${a * 10 + u} − ${u}` });
        },
      },
      {
        id: 'm_add2', title: 'Сложение до 100', icon: '🧮', grade: 2, ramp: true, bank: RAMP,
        rule: 'Складывай <b>десятки с десятками, единицы с единицами</b>:<br><i>45 + 23 = (40 + 20) + (5 + 3) = 68</i><br>Если единиц больше 10 — дополни до круглого: <i>36 + 7 = 36 + 4 + 3 = 43</i>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) { const a = mr(2, 8) * 10 + mr(0, 7), b = mr(1, 9 - a % 10); return inTask('Реши пример', eq(`${a} + ${b} = [?]`), a + b, { explain: `Единицы: ${a % 10} + ${b} = ${a % 10 + b}. Ответ: <b>${a + b}</b>.`, hint: 'Прибавь к единицам, десятки не меняются.', label: `${a} + ${b}` }); }
          if (d === 2) {
            let a, b; do { a = mr(12, 89); b = mr(2, 9); } while (a % 10 + b < 10 || a % 10 === 0 || a + b > 99);
            const p = 10 - a % 10;
            return inTask('Реши пример', eq(`${a} + ${b} = [?]`), a + b, { explain: `${a} + ${b} = ${a} + ${p} + ${b - p} = ${a + p} + ${b - p} = <b>${a + b}</b>.`, hint: `Дополни ${a} до ${a + p}: прибавь ${p}, потом остаток.`, label: `${a} + ${b}` });
          }
          let a, b; do { a = mr(15, 79); b = mr(12, 59); } while (a % 10 + b % 10 < 10 || a + b > 100);
          const t = Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10, u = a % 10 + b % 10;
          return inTask('Реши пример', eq(`${a} + ${b} = [?]`), a + b, { explain: `Десятки: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${t}. Единицы: ${a % 10} + ${b % 10} = ${u}. Вместе: ${t} + ${u} = <b>${a + b}</b>.`, hint: 'Сложи отдельно десятки и единицы, потом результаты.', label: `${a} + ${b}` });
        },
      },
      {
        id: 'm_sub2', title: 'Вычитание до 100', icon: '📉', grade: 2, ramp: true, bank: RAMP,
        rule: 'Вычитай <b>по частям</b>:<br><i>52 − 7 = 52 − 2 − 5 = 50 − 5 = 45</i><br><i>63 − 28 = 63 − 20 − 8 = 43 − 8 = 35</i>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) { const a = mr(2, 9) * 10 + mr(2, 9), b = mr(1, a % 10); return inTask('Реши пример', eq(`${a} − ${b} = [?]`), a - b, { explain: `Единицы: ${a % 10} − ${b} = ${a % 10 - b}. Ответ: <b>${a - b}</b>.`, hint: 'Отними от единиц, десятки не меняются.', label: `${a} − ${b}` }); }
          if (d === 2) {
            let a, b; do { a = mr(21, 99); b = mr(2, 9); } while (b <= a % 10);
            const u = a % 10;
            return inTask('Реши пример', eq(`${a} − ${b} = [?]`), a - b, { explain: u ? `${a} − ${b} = ${a} − ${u} − ${b - u} = ${a - u} − ${b - u} = <b>${a - b}</b>.` : `${a} − ${b} = <b>${a - b}</b>.`, hint: u ? `Сначала отними ${u}, чтобы получилось круглое число.` : 'Представь круглое число как «десятки»: отними от последнего десятка.', label: `${a} − ${b}` });
          }
          let a, b; do { a = mr(31, 99); b = mr(12, a - 10); } while (b % 10 <= a % 10 || b % 10 === 0);
          const bt = Math.floor(b / 10) * 10, bu = b % 10;
          return inTask('Реши пример', eq(`${a} − ${b} = [?]`), a - b, { explain: `${a} − ${b} = ${a} − ${bt} − ${bu} = ${a - bt} − ${bu} = <b>${a - b}</b>.`, hint: `Отними сначала десятки (${bt}), потом единицы (${bu}).`, label: `${a} − ${b}` });
        },
      },
      {
        id: 'm_unknown', title: 'Найди неизвестное', icon: '🔎', grade: 2, ramp: true, bank: RAMP,
        rule: '<b>Неизвестное слагаемое</b> = сумма − известное слагаемое: <i>? + 8 = 15 → 15 − 8 = 7</i><br><b>Неизвестное уменьшаемое</b> = разность + вычитаемое: <i>? − 9 = 6 → 6 + 9 = 15</i><br><b>Неизвестное вычитаемое</b> = уменьшаемое − разность: <i>20 − ? = 12 → 20 − 12 = 8</i>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) { const x = mr(2, 9), b = mr(2, 9); return inTask('Найди неизвестное число', eq(`[?] + ${b} = ${x + b}`), x, { explain: `Неизвестное слагаемое: ${x + b} − ${b} = <b>${x}</b>. Проверка: ${x} + ${b} = ${x + b}.`, hint: 'Из суммы вычти известное слагаемое.', label: `? + ${b} = ${x + b}` }); }
          if (d === 2) { const a = mr(10, 60), x = mr(5, 99 - a); return inTask('Найди неизвестное число', eq(`${a} + [?] = ${a + x}`), x, { explain: `${a + x} − ${a} = <b>${x}</b>. Проверка: ${a} + ${x} = ${a + x}.`, hint: 'Из суммы вычти известное слагаемое.', label: `${a} + ? = ${a + x}` }); }
          if (Math.random() < 0.5) { const c = mr(5, 60), b = mr(3, 99 - c); return inTask('Найди неизвестное число', eq(`[?] − ${b} = ${c}`), c + b, { explain: `Неизвестное уменьшаемое: ${c} + ${b} = <b>${c + b}</b>. Проверка: ${c + b} − ${b} = ${c}.`, hint: 'К разности прибавь вычитаемое.', label: `? − ${b} = ${c}` }); }
          const a = mr(20, 99), x = mr(3, a - 3);
          return inTask('Найди неизвестное число', eq(`${a} − [?] = ${a - x}`), x, { explain: `Неизвестное вычитаемое: ${a} − ${a - x} = <b>${x}</b>. Проверка: ${a} − ${x} = ${a - x}.`, hint: 'Из уменьшаемого вычти разность.', label: `${a} − ? = ${a - x}` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 4 */
  {
    id: 'mw4', name: 'Фабрика Умножения', emoji: '🏭', c1: '#C3A6FF', c2: '#8A5CF6',
    boss: { id: 'mb4', name: 'Кальмар Умножак', emoji: '🦑', hp: 10, story: 'Кальмар Умножак захватил фабрику: у него 10 щупалец, и все путают примеры!' },
    lessons: [
      {
        id: 'm_mulmean', title: 'Что такое умножение', icon: '🍎', grade: 2, ramp: true, bank: RAMP,
        rule: `Умножение — это сложение <b>одинаковых</b> чисел.${VIS.groups(3, 4, '🍎')}По 4 яблока взяли 3 раза: <i>4 + 4 + 4 = 4 · 3 = 12</i>`,
        make(d0) {
          const d = lvD(d0), em = U.rnd(['🍎', '🍓', '⭐', '🐟', '🌸', '🍬', '🎈']);
          let a, b; do { a = mr(2, 4); b = mr(2, 5); } while (a === b);
          if (d === 1) return inTask('Сколько всего предметов?', VIS.groups(a, b, em), a * b, { explain: `По ${b} взяли ${a} раза: ${Array(a).fill(b).join(' + ')} = ${b} · ${a} = <b>${a * b}</b>.`, hint: `Считай группами: ${b}, ${2 * b}…`, label: `${a} группы по ${b}` });
          if (d === 2) {
            return T.choice('Какое выражение подходит к рисунку?', [`${b} · ${a}`, `${b} + ${a}`, `${b} · ${b}`], `${b} · ${a}`,
              { show: VIS.groups(a, b, em), explain: `В каждой группе по ${b}, групп — ${a}. По ${b} взять ${a} раза: <b>${b} · ${a}</b>.`, label: `выражение ${b}·${a}` });
          }
          const n = mr(2, 9), k = mr(3, 5);
          return inTask('Замени сложение умножением', eq(`${Array(k).fill(n).join(' + ')} = ${n} · [?]`), k, { explain: `Число ${n} сложили ${k} раза, значит, ${n} · <b>${k}</b>.`, hint: 'Сосчитай, сколько раз повторяется слагаемое.', label: `${n} ${k} раз` });
        },
      },
      {
        id: 'm_t2345', title: 'Таблица на 2, 3, 4, 5', icon: '✖️', grade: 2, ramp: true, bank: RAMP,
        rule: 'Считай <b>прыжками</b>: на 2 — 2, 4, 6, 8…; на 5 — 5, 10, 15, 20…<br>От перестановки множителей произведение не меняется: <i>3 · 4 = 4 · 3</i>.<br>Если забыл: <i>4 · 7 = 4 · 6 + 4</i>.',
        make(d0) {
          const d = lvD(d0);
          const a = d === 1 ? U.rnd([2, 3]) : d === 2 ? U.rnd([4, 5]) : mr(2, 5), b = mr(2, 10);
          const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
          return inTask('Реши пример', eq(`${x} · ${y} = [?]`), a * b, { explain: `${x} · ${y} = <b>${a * b}</b>.`, hint: b > 2 ? `Если помнишь ${a} · ${b - 1} = ${a * (b - 1)}, прибавь ещё ${a}.` : `${a} · 2 = ${a} + ${a}.`, label: `${x} · ${y}` });
        },
      },
      {
        id: 'm_mul01', title: 'Умножение на 0, 1 и 10', icon: '0️⃣', grade: 2, ramp: true, bank: RAMP,
        rule: '<b>a · 1 = a</b> — число не меняется.<br><b>a · 0 = 0</b> — ноль раз ничего не взяли.<br><b>a · 10</b> — припиши нолик: <i>7 · 10 = 70</i>.<br><b>a : 1 = a</b>, <b>a : a = 1</b>, <b>0 : a = 0</b>. На 0 делить нельзя!',
        make(d0) {
          const d = lvD(d0), a = mr(2, 9);
          const v = d === 1 ? U.rnd(['a1', '1a', 'a0', '0a']) : d === 2 ? U.rnd(['a10', '10a', 'ad1', 'a1']) : U.rnd(['0da', 'ada', 'a0', 'a10', 'ad1']);
          const map = {
            a1: [`${a} · 1`, a, 'При умножении на 1 число не меняется.'], '1a': [`1 · ${a}`, a, 'При умножении 1 на число получается это число.'],
            a0: [`${a} · 0`, 0, 'При умножении на 0 получается 0.'], '0a': [`0 · ${a}`, 0, 'Ноль, умноженный на любое число, — это 0.'],
            a10: [`${a} · 10`, a * 10, 'При умножении на 10 приписываем нолик.'], '10a': [`10 · ${a}`, a * 10, '10 · a = a · 10 — приписываем нолик.'],
            ad1: [`${a} : 1`, a, 'При делении на 1 число не меняется.'], ada: [`${a} : ${a}`, 1, 'Число, делённое само на себя, равно 1.'],
            '0da': [`0 : ${a}`, 0, 'Ноль, делённый на любое число, — это 0.'],
          };
          const [e, r, why] = map[v];
          return inTask('Реши пример', eq(`${e} = [?]`), r, { explain: `${e} = <b>${r}</b>. ${why}`, hint: why, label: e });
        },
      },
    ],
  },

  /* ------------------------------------------------ 5 */
  {
    id: 'mw5', name: 'Башня Таблицы', emoji: '🗼', c1: '#FFA6C9', c2: '#F0559A',
    boss: { id: 'mb5', name: 'Краб Делёж', emoji: '🦀', hp: 12, story: 'Краб Делёж утащил на вершину башни всю таблицу умножения. Верни её!' },
    lessons: [
      {
        id: 'm_t6789', title: 'Таблица на 6, 7, 8, 9', icon: '✳️', grade: 3, ramp: true, bank: RAMP,
        rule: 'Опирайся на то, что знаешь: <i>7 · 6 = 7 · 5 + 7 = 35 + 7 = 42</i>.<br>Секрет девятки: <i>9 · 6 = 10 · 6 − 6 = 54</i>.<br>Тренируйся в тренажёре таблицы — он сам повторяет трудные примеры.',
        make(d0) {
          const d = lvD(d0);
          const a = d === 1 ? 6 : d === 2 ? U.rnd([7, 8]) : U.rnd([6, 7, 8, 9]), b = mr(2, 9);
          const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
          const hint = a === 9 ? `9 · ${b} = 10 · ${b} − ${b} = ${10 * b} − ${b}.` : b > 5 ? `${a} · ${b} = ${a} · 5 + ${a} · ${b - 5} = ${a * 5} + ${a * (b - 5)}.` : `${a} · ${b} = ${b} · ${a} — эту таблицу ты уже знаешь.`;
          return inTask('Реши пример', eq(`${x} · ${y} = [?]`), a * b, { explain: `${x} · ${y} = <b>${a * b}</b>. ${hint}`, hint, label: `${x} · ${y}` });
        },
      },
      {
        id: 'm_div', title: 'Деление', icon: '➗', grade: 2, ramp: true, bank: RAMP,
        rule: 'Деление — это <b>раздать поровну</b>. Чтобы разделить, вспомни умножение:<br><i>24 : 6 = ?  →  6 · 4 = 24, значит 24 : 6 = 4</i>',
        make(d0) {
          const d = lvD(d0);
          const a = d === 1 ? mr(2, 5) : mr(2, 9), q = mr(2, 9), c = a * q;
          if (d === 3 && Math.random() < 0.6) {
            const w = U.rnd(MASC);
            return inTask('Реши задачу', `<div class="story">${U.cap(nw(c, w))} разложили поровну в ${nw(a, 'пакет')}. Сколько ${many(w)} в каждом пакете?</div>`, q,
              { explain: `${c} : ${a} = <b>${q}</b>, потому что ${a} · ${q} = ${c}.`, hint: `Подумай: ${a} · ? = ${c}.`, label: `${c} : ${a} (задача)` });
          }
          return inTask('Реши пример', eq(`${c} : ${a} = [?]`), q, { explain: `${c} : ${a} = <b>${q}</b>, потому что ${a} · ${q} = ${c}.`, hint: `На какое число нужно умножить ${a}, чтобы получилось ${c}?`, label: `${c} : ${a}` });
        },
      },
      {
        id: 'm_family', title: 'Умножение и деление', icon: '🔄', grade: 3, ramp: true, bank: RAMP,
        rule: 'Умножение и деление — <b>одна семья</b>:<br><i>7 · 6 = 42  →  42 : 6 = 7  и  42 : 7 = 6</i>',
        make(d0) {
          const d = lvD(d0), a = mr(2, 9), b = mr(2, 9), c = a * b;
          const v = d === 1 ? 0 : d === 2 ? mr(0, 1) : mr(1, 2);
          const fact = `Зная, что <b>${a} · ${b} = ${c}</b>, найди:`;
          if (v === 0) return inTask(fact, eq(`${c} : ${b} = [?]`), a, { explain: `Если ${a} · ${b} = ${c}, то ${c} : ${b} = <b>${a}</b>.`, hint: 'Произведение разделить на один множитель — получится другой множитель.', label: `${c} : ${b}` });
          if (v === 1) return inTask(fact, eq(`${c} : ${a} = [?]`), b, { explain: `Если ${a} · ${b} = ${c}, то ${c} : ${a} = <b>${b}</b>.`, hint: 'Произведение разделить на один множитель — получится другой множитель.', label: `${c} : ${a}` });
          return inTask(fact, eq(`[?] : ${a} = ${b}`), c, { explain: `Неизвестное делимое: ${b} · ${a} = <b>${c}</b>.`, hint: 'Неизвестное делимое = частное · делитель.', label: `? : ${a} = ${b}` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 6 */
  {
    id: 'mw6', name: 'Мастерская Мер', emoji: '🕰️', c1: '#FFD36B', c2: '#F5A300',
    boss: { id: 'mb6', name: 'Сова Полуночница', emoji: '🦉', hp: 10, story: 'Сова Полуночница перевела все часы и перепутала все линейки. Почини мастерскую!' },
    lessons: [
      {
        id: 'm_length', title: 'Длина: см, дм, м', icon: '📏', grade: 2, ramp: true, bank: RAMP,
        rule: '<b>1 дм = 10 см</b><br><b>1 м = 10 дм = 100 см</b><br><i>5 дм 3 см = 50 см + 3 см = 53 см</i>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) {
            const k = mr(2, 9);
            const v = U.rnd([['1 дм = [?] см', 10, '1 дм = 10 см.'], ['1 м = [?] дм', 10, '1 м = 10 дм.'], ['1 м = [?] см', 100, '1 м = 100 см.'], [`${k} дм = [?] см`, k * 10, `1 дм = 10 см, значит ${k} дм = ${k * 10} см.`]]);
            return inTask('Сколько?', eq(v[0]), v[1], { explain: v[2].replace(/(\d+ см\.|\d+ дм\.)$/, '<b>$1</b>'), hint: '1 дм = 10 см, 1 м = 10 дм = 100 см.', label: v[0].replace('[?]', '?') });
          }
          if (d === 2) {
            const k = mr(1, 9), c = mr(1, 9);
            const v = U.rnd([[`${k} дм ${c} см = [?] см`, k * 10 + c, `${k} дм = ${k * 10} см, плюс ${c} см.`], [`${k * 10} см = [?] дм`, k, `10 см = 1 дм, значит ${k * 10} см = ${k} дм.`], [`${k} м = [?] дм`, k * 10, `1 м = 10 дм, значит ${k} м = ${k * 10} дм.`]]);
            return inTask('Сколько?', eq(v[0]), v[1], { explain: `${v[2]} Ответ: <b>${v[1]}</b>.`, hint: '1 дм = 10 см, 1 м = 10 дм = 100 см.', label: v[0].replace('[?]', '?') });
          }
          if (Math.random() < 0.4) {
            const a = mr(2, 9) * 10 + U.rnd([0, 0, 5]), bd = mr(2, 9);
            return cmpTask(a, bd * 10, `${a} см ○ ${bd} дм`, `${bd} дм = ${bd * 10} см. Значит, <b>${a} см ${a > bd * 10 ? '&gt;' : a < bd * 10 ? '&lt;' : '='} ${bd} дм</b>.`, `${a} см и ${bd} дм`);
          }
          const m = mr(1, 3), c = mr(1, 9) * 10;
          return inTask('Сколько?', eq(`${m} м ${c} см = [?] см`), m * 100 + c, { explain: `${m} м = ${m * 100} см, плюс ${c} см = <b>${m * 100 + c}</b> см.`, hint: '1 м = 100 см.', label: `${m} м ${c} см` });
        },
      },
      {
        id: 'm_time', title: 'Единицы времени', icon: '⏳', grade: 2, ramp: true, bank: RAMP,
        rule: '<b>1 ч = 60 мин</b>, <b>1 мин = 60 с</b><br><b>1 сутки = 24 ч</b>, <b>1 неделя = 7 суток</b><br><b>1 год = 12 месяцев</b>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) {
            const v = U.rnd([['1 ч = [?] мин', 60], ['1 мин = [?] с', 60], ['1 сут. = [?] ч', 24], ['1 нед. = [?] сут.', 7], ['1 год = [?] мес.', 12]]);
            return inTask('Сколько?', eq(v[0]), v[1], { explain: `${v[0].replace('[?]', '<b>' + v[1] + '</b>')}. Это нужно запомнить!`, hint: '1 ч = 60 мин, 1 сутки = 24 ч, 1 неделя = 7 суток.', label: v[0].replace('[?]', '?') });
          }
          if (d === 2) {
            const k = mr(2, 3), mm = U.rnd([10, 15, 20, 30, 45]), w = mr(2, 4);
            const v = U.rnd([[`${k} ч = [?] мин`, k * 60, `1 ч = 60 мин, ${k} ч = 60 · ${k}.`], [`1 ч ${mm} мин = [?] мин`, 60 + mm, `1 ч = 60 мин, плюс ${mm} мин.`], [`${w} нед. = [?] сут.`, w * 7, `1 неделя = 7 суток, ${w} нед. = 7 · ${w}.`]]);
            return inTask('Сколько?', eq(v[0]), v[1], { explain: `${v[2]} Ответ: <b>${v[1]}</b>.`, hint: '1 ч = 60 мин, 1 неделя = 7 суток.', label: v[0].replace('[?]', '?') });
          }
          const h = mr(7, 17), m1 = mr(0, 9) * 5, dur = mr(3, 10) * 5;
          const t2 = h * 60 + m1 + dur, h2 = Math.floor(t2 / 60), m2 = t2 % 60;
          const f = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
          return inTask('Сколько минут прошло?', `<div class="story">Урок начался в <b>${f(h, m1)}</b>, а закончился в <b>${f(h2, m2)}</b>. Сколько минут длился урок?</div>`, dur,
            { explain: h2 > h ? `От ${f(h, m1)} до ${f(h2, 0)} — ${60 - m1} мин${m2 ? `, и ещё ${m2} мин. Всего` : '. Ответ:'} <b>${dur}</b> мин.` : `${m2} − ${m1} = <b>${dur}</b> мин.`, hint: h2 > h ? 'Сначала посчитай минуты до ровного часа, потом прибавь остальное.' : 'Вычти минуты начала из минут конца.', label: `${f(h, m1)} → ${f(h2, m2)}` });
        },
      },
      {
        id: 'm_clock', title: 'Часы', icon: '⏰', grade: 2, ramp: true, bank: RAMP,
        rule: '<b>Короткая</b> стрелка показывает <b>часы</b>, <b>длинная</b> (красная) — <b>минуты</b>.<br>Длинная стрелка на 12 — ровно столько часов. На 6 — половина (30 минут). Каждая цифра для длинной стрелки — это 5 минут.',
        make(d0) {
          const d = lvD(d0), h = mr(1, 12);
          const m = d === 1 ? 0 : d === 2 ? U.rnd([30, 15, 45, 30]) : mr(1, 11) * 5;
          const f = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
          const nh = h === 12 ? 1 : h + 1, ph = h === 1 ? 12 : h - 1;
          const set = new Set([f(h, m)]);
          const cands = [f(nh, m), f(ph, m), f(h, (60 - m) % 60), f(m === 0 ? 12 : Math.max(1, Math.round(m / 5)), h * 5 % 60), f(h, (m + 30) % 60)];
          for (const c of U.shuffle(cands)) { if (set.size >= 4) break; set.add(c); }
          return T.choice('Который час на часах?', [...set], f(h, m), {
            show: VIS.clock(h, m), label: f(h, m),
            explain: m === 0 ? `Длинная стрелка на 12, короткая на ${h} — ровно <b>${f(h, m)}</b>.` : `Короткая стрелка прошла ${h}, длинная показывает ${m} минут: <b>${f(h, m)}</b>.`,
          });
        },
      },
      {
        id: 'm_mass', title: 'Масса: кг и г', icon: '🏋️', grade: 3, ramp: true, bank: RAMP,
        rule: '<b>1 кг = 1000 г</b><br><i>2 кг 500 г = 2000 г + 500 г = 2500 г</i>',
        make(d0) {
          const d = lvD(d0), k = mr(2, 9), g = mr(1, 9) * 100;
          if (d === 1) {
            const one = Math.random() < 0.4;
            return inTask('Сколько?', eq(one ? '1 кг = [?] г' : `${k} кг = [?] г`), one ? 1000 : k * 1000,
              { explain: one ? '1 кг = <b>1000</b> г. Это нужно запомнить!' : `1 кг = 1000 г, значит ${k} кг = <b>${k * 1000}</b> г.`, hint: '1 кг = 1000 г.', label: one ? '1 кг в г' : `${k} кг в г` });
          }
          if (d === 2) return inTask('Сколько?', eq(`${k} кг ${g} г = [?] г`), k * 1000 + g, { explain: `${k} кг = ${k * 1000} г, плюс ${g} г = <b>${k * 1000 + g}</b> г.`, hint: '1 кг = 1000 г.', label: `${k} кг ${g} г` });
          if (Math.random() < 0.5) return inTask('Сколько?', eq(`${k * 1000} г = [?] кг`), k, { explain: `1000 г = 1 кг, значит ${k * 1000} г = <b>${k}</b> кг.`, hint: '1 кг = 1000 г.', label: `${k * 1000} г в кг` });
          const a = mr(2, 9) * 100;
          return cmpTask(1000, a, `1 кг ○ ${a} г`, `1 кг = 1000 г, а 1000 &gt; ${a}. Значит, <b>1 кг &gt; ${a} г</b>.`, `1 кг и ${a} г`);
        },
      },
    ],
  },

  /* ------------------------------------------------ 7 */
  {
    id: 'mw7', name: 'Сад Фигур', emoji: '🏞️', c1: '#9BE38A', c2: '#4CB944',
    boss: { id: 'mb7', name: 'Ящер Квадратус', emoji: '🦎', hp: 10, story: 'Ящер Квадратус перепутал все фигуры в саду. Измерь и посчитай всё правильно!' },
    lessons: [
      {
        id: 'm_shapes', title: 'Многоугольники', icon: '🔺', grade: 2, ramp: true, bank: RAMP,
        rule: 'У многоугольника <b>углов столько же, сколько сторон</b>.<br>3 угла — <b>треугольник</b>, 4 — <b>четырёхугольник</b>, 5 — <b>пятиугольник</b>, 6 — <b>шестиугольник</b>.',
        make(d0) {
          const d = lvD(d0);
          const NAMES = { 3: 'Треугольник', 4: 'Четырёхугольник', 5: 'Пятиугольник', 6: 'Шестиугольник' };
          if (d === 1) { const n = mr(3, 5); return inTask('Сколько углов у фигуры?', VIS.poly(n), n, { explain: `У фигуры <b>${n}</b> углов (точки-вершины), и столько же сторон.`, hint: 'Посчитай точки на углах фигуры.', label: `углы ${n}` }); }
          if (d === 2) { const n = mr(3, 6); return T.choice('Как называется фигура?', Object.values(NAMES), NAMES[n], { show: VIS.poly(n), explain: `У фигуры ${n} углов — это <b>${NAMES[n].toLowerCase()}</b>.`, label: NAMES[n] }); }
          const n = mr(3, 6), k = mr(2, 5);
          return inTask('Реши задачу', `<div class="story">Сколько всего углов у ${k} фигур, если каждая из них — ${NAMES[n].toLowerCase()}?</div>`, n * k,
            { explain: `У одной фигуры ${n} углов, у ${k} — ${n} · ${k} = <b>${n * k}</b>.`, hint: `Сколько углов у одной такой фигуры? Умножь на ${k}.`, label: `${k} × ${NAMES[n]}` });
        },
      },
      {
        id: 'm_perim', title: 'Периметр', icon: '📐', grade: 2, ramp: true, bank: RAMP,
        rule: '<b>Периметр</b> — сумма длин всех сторон фигуры.<br>Прямоугольник: <i>P = (a + b) · 2</i><br>Квадрат: <i>P = a · 4</i>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) { let a = mr(3, 9), b = mr(2, 6); if (a === b) a++; return inTask('Найди периметр прямоугольника (в см)', VIS.rect(a, b), 2 * (a + b), { explain: `P = (${a} + ${b}) · 2 = ${a + b} · 2 = <b>${2 * (a + b)}</b> см.`, hint: 'У прямоугольника две пары одинаковых сторон. Сложи все четыре.', label: `P ${a}×${b}` }); }
          if (d === 2) {
            if (Math.random() < 0.5) { const a = mr(2, 9); return inTask('Найди периметр квадрата (в см)', VIS.rect(a, a), 4 * a, { explain: `У квадрата 4 равные стороны: P = ${a} · 4 = <b>${4 * a}</b> см.`, hint: 'Все стороны квадрата равны.', label: `P квадрат ${a}` }); }
            let a, b, c; do { a = mr(4, 9); b = mr(3, 8); c = mr(3, 8); } while (a >= b + c || b >= a + c || c >= a + b);
            return inTask('Найди периметр треугольника (в см)', VIS.tri(a, b, c), a + b + c, { explain: `P = ${a} + ${b} + ${c} = <b>${a + b + c}</b> см.`, hint: 'Сложи длины всех трёх сторон.', label: `P треуг ${a},${b},${c}` });
          }
          if (Math.random() < 0.5) { const a = mr(2, 9); return inTask('Реши задачу', `<div class="story">Периметр квадрата — ${4 * a} см. Какова длина его стороны (в см)?</div>`, a, { explain: `У квадрата 4 равные стороны: ${4 * a} : 4 = <b>${a}</b> см.`, hint: 'Периметр квадрата раздели на 4.', label: `сторона из P ${4 * a}` }); }
          const a = mr(3, 12), b = mr(2, 9), P = 2 * (a + b);
          return inTask('Реши задачу', `<div class="story">Периметр прямоугольника — ${P} см, длина — ${a} см. Найди ширину (в см).</div>`, b,
            { explain: `Половина периметра: ${P} : 2 = ${a + b} см. Ширина: ${a + b} − ${a} = <b>${b}</b> см.`, hint: 'Половина периметра — это длина + ширина.', label: `ширина из P ${P}` });
        },
      },
      {
        id: 'm_area', title: 'Площадь', icon: '🟩', grade: 3, ramp: true, bank: RAMP,
        rule: '<b>Площадь</b> — сколько квадратиков помещается в фигуре.<br>Прямоугольник: <i>S = a · b</i> (длина · ширина).<br>Измеряют в квадратных сантиметрах: <i>кв. см</i>.',
        make(d0) {
          const d = lvD(d0);
          const a = mr(2, 7), b = mr(2, 5);
          if (d === 1) return inTask('Сколько клеточек внутри прямоугольника?', VIS.rect(a, b, '', true), a * b, { explain: `${b} ${U.plural(b, 'ряд', 'ряда', 'рядов')} по ${a} клеточек: ${a} · ${b} = <b>${a * b}</b>.`, hint: 'Посчитай клеточки в одном ряду и умножь на число рядов.', label: `клетки ${a}×${b}` });
          if (d === 2) return inTask('Найди площадь (в кв. см)', VIS.rect(a + 1, b), (a + 1) * b, { explain: `S = ${a + 1} · ${b} = <b>${(a + 1) * b}</b> кв. см.`, hint: 'Площадь прямоугольника = длина · ширина.', label: `S ${a + 1}×${b}` });
          const x = mr(3, 9), y = mr(2, 9);
          return inTask('Реши задачу', `<div class="story">Площадь прямоугольника — ${x * y} кв. см, длина — ${x} см. Найди ширину (в см).</div>`, y,
            { explain: `S = длина · ширина, значит ширина = ${x * y} : ${x} = <b>${y}</b> см.`, hint: 'Площадь раздели на длину.', label: `ширина из S ${x * y}` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 8 */
  {
    id: 'mw8', name: 'Замок Задач', emoji: '🏯', c1: '#A3B4FF', c2: '#5B6CF0',
    boss: { id: 'mb8', name: 'Призрак Задачник', emoji: '👻', hp: 12, story: 'Призрак Задачник запутал все условия задач. Разгадай их!' },
    lessons: [
      {
        id: 'm_order', title: 'Порядок действий', icon: '📋', grade: 2, ramp: true, bank: RAMP,
        rule: '1) Сначала действия в <b>скобках</b>.<br>2) Потом <b>умножение и деление</b>.<br>3) Потом <b>сложение и вычитание</b>.<br>Действия одной ступени — <b>слева направо</b>: <i>20 − 8 + 5 = 12 + 5 = 17</i>',
        make(d0) {
          const d = lvD(d0);
          let e, r, ex;
          if (d === 1) {
            const a = mr(20, 60), b = mr(5, 19), c = mr(2, 15);
            if (Math.random() < 0.5) { e = `${a} − ${b} + ${c}`; r = a - b + c; ex = `Слева направо: ${a} − ${b} = ${a - b}, потом ${a - b} + ${c} = <b>${r}</b>.`; }
            else { e = `${a} + ${c} − ${b}`; r = a + c - b; ex = `Слева направо: ${a} + ${c} = ${a + c}, потом ${a + c} − ${b} = <b>${r}</b>.`; }
          } else if (d === 2) {
            const a = mr(5, 40), b = mr(2, 9), c = mr(2, 9);
            const v = mr(1, 3);
            if (v === 1) { e = `${a} + ${b} · ${c}`; r = a + b * c; ex = `Сначала умножение: ${b} · ${c} = ${b * c}, потом ${a} + ${b * c} = <b>${r}</b>.`; }
            else if (v === 2) { const A = b * c + mr(0, 30); e = `${A} − ${b} · ${c}`; r = A - b * c; ex = `Сначала умножение: ${b} · ${c} = ${b * c}, потом ${A} − ${b * c} = <b>${r}</b>.`; }
            else { const x = mr(2, 6), y = mr(1, 4), z = mr(2, 9); e = `(${x} + ${y}) · ${z}`; r = (x + y) * z; ex = `Сначала скобки: ${x} + ${y} = ${x + y}, потом ${x + y} · ${z} = <b>${r}</b>.`; }
          } else {
            const b = mr(2, 9), c = mr(2, 9), dd = mr(2, 9), q = mr(2, 9), D = dd * q;
            if (Math.random() < 0.5 && b * c >= q) { e = `${b} · ${c} − ${D} : ${dd}`; r = b * c - q; ex = `Сначала умножение и деление: ${b} · ${c} = ${b * c}, ${D} : ${dd} = ${q}. Потом ${b * c} − ${q} = <b>${r}</b>.`; }
            else { const x = mr(10, 30), y = mr(2, x - 2); const z = mr(2, 4); e = `(${x} − ${y}) · ${z}`; r = (x - y) * z; ex = `Сначала скобки: ${x} − ${y} = ${x - y}, потом ${x - y} · ${z} = <b>${r}</b>.`; }
          }
          return inTask('Вычисли, соблюдая порядок действий', eq(`${e} = [?]`), r, { explain: ex, hint: 'Скобки → умножение и деление → сложение и вычитание.', label: e });
        },
      },
      {
        id: 'm_eq', title: 'Уравнения', icon: '🔐', grade: 2, ramp: true, bank: RAMP,
        rule: '<b>Уравнение</b> — равенство с неизвестным числом <b>x</b>.<br><i>x + 14 = 30 → x = 30 − 14 = 16</i><br><i>x · 6 = 42 → x = 42 : 6 = 7</i><br>Всегда делай <b>проверку</b>: подставь ответ вместо x.',
        make(d0) {
          const d = lvD(d0);
          let e, x, rule;
          if (d === 1) {
            if (Math.random() < 0.5) { const a = mr(5, 40); x = mr(3, 50); e = `x + ${a} = ${x + a}`; rule = `x = ${x + a} − ${a}`; }
            else { const a = mr(3, 30); x = mr(a + 2, 90); e = `x − ${a} = ${x - a}`; rule = `x = ${x - a} + ${a}`; }
          } else if (d === 2) {
            if (Math.random() < 0.5) { const a = mr(20, 99); x = mr(3, a - 3); e = `${a} − x = ${a - x}`; rule = `x = ${a} − ${a - x}`; }
            else { const a = mr(5, 50); x = mr(3, 45); e = `${a} + x = ${a + x}`; rule = `x = ${a + x} − ${a}`; }
          } else {
            const a = mr(2, 9); x = mr(2, 9);
            const v = mr(1, 3);
            if (v === 1) { e = `x · ${a} = ${a * x}`; rule = `x = ${a * x} : ${a}`; }
            else if (v === 2) { e = `x : ${a} = ${x}`; const X = a * x; rule = `x = ${x} · ${a}`; x = X; }
            else { e = `${a * x} : x = ${a}`; rule = `x = ${a * x} : ${a}`; }
          }
          return inTask('Реши уравнение', eq(e) + eq('x = [?]'), x, { explain: `${rule} = <b>${x}</b>. Проверка: подставь ${x} вместо x — равенство верное.`, hint: 'Вспомни, как найти неизвестный компонент: слагаемое, уменьшаемое, вычитаемое, множитель…', label: e });
        },
      },
      {
        id: 'm_prob1', title: 'Задачи', icon: '📝', grade: 2, ramp: true, bank: RAMP,
        rule: 'Читай задачу <b>два раза</b>. Найди, что известно и что нужно узнать.<br>Нарисуй <b>схему</b>: отрезки помогут понять, складывать или вычитать.<br><i>«На 3 больше» — прибавляем, «на 3 меньше» — вычитаем.</i>',
        make(d0) {
          const d = lvD(d0);
          const [k1, k2] = U.sample(KIDS, 2), w = U.rnd(COUNTABLE);
          const story = s => `<div class="story">${s}</div>`;
          if (d === 1) {
            if (Math.random() < 0.5) {
              const a = notOne(4, 30), b = notOne(3, 20);
              return inTask('Реши задачу', story(`У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} — ${nw(b, w)}. Сколько ${many(w)} у них вместе?`), a + b,
                { explain: `Вместе — это сложение: ${a} + ${b} = <b>${a + b}</b>.`, hint: VIS.bars([{ label: k1[0], segs: [{ v: a, t: a }] }, { label: k2[0], segs: [{ v: b, t: b }] }], 'Вместе — ?'), label: `${a}+${b} ${w}` });
            }
            const a = notOne(10, 40), b = notOne(2, a - 2);
            return inTask('Реши задачу', story(`В коробке было ${nw(a, w)}. Из коробки взяли ${nw(b, w)}. Сколько ${many(w)} осталось?`), a - b,
              { explain: `Взяли — значит, стало меньше: ${a} − ${b} = <b>${a - b}</b>.`, hint: VIS.bars([{ label: 'было', segs: [{ v: b, t: b + ' взяли', cls: 'gone' }, { v: a - b, t: '?' }] }]), label: `${a}−${b} ${w}` });
          }
          if (d === 2) {
            const a = notOne(10, 50), b = notOne(2, 9);
            const v = mr(1, 3);
            if (v === 1) return inTask('Реши задачу', story(`У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} на ${nw(b, w)} больше. Сколько ${many(w)} у ${k2[1]}?`), a + b,
              { explain: `«На ${b} больше» — прибавляем: ${a} + ${b} = <b>${a + b}</b>.`, hint: VIS.bars([{ label: k1[0], segs: [{ v: a, t: a }] }, { label: k2[0], segs: [{ v: a, t: a }, { v: b, t: '+' + b, cls: 'extra' }] }], `У ${k2[1]} — ?`), label: `на ${b} больше` });
            if (v === 2) return inTask('Реши задачу', story(`У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} на ${nw(b, w)} меньше. Сколько ${many(w)} у ${k2[1]}?`), a - b,
              { explain: `«На ${b} меньше» — вычитаем: ${a} − ${b} = <b>${a - b}</b>.`, hint: VIS.bars([{ label: k1[0], segs: [{ v: a - b, t: '' }, { v: b, t: b }] }, { label: k2[0], segs: [{ v: a - b, t: '?' }] }], `У ${k2[1]} на ${b} меньше`), label: `на ${b} меньше` });
            const c = notOne(2, a - 3);
            return inTask('Реши задачу', story(`У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} — ${nw(c, w)}. На сколько ${many(w)} у ${k1[1]} больше, чем у ${k2[1]}?`), a - c,
              { explain: `Чтобы узнать, на сколько одно число больше другого, из большего вычитаем меньшее: ${a} − ${c} = <b>${a - c}</b>.`, hint: VIS.bars([{ label: k1[0], segs: [{ v: c, t: c }, { v: a - c, t: '?', cls: 'extra' }] }, { label: k2[0], segs: [{ v: c, t: c }] }]), label: `на сколько ${a} и ${c}` });
          }
          const m = U.rnd(MASC), g = mr(2, 9), k = mr(2, 9);
          const v = mr(1, 3);
          if (v === 1) return inTask('Реши задачу', story(`В одной коробке ${nw(g, m)}. Сколько ${many(m)} в ${k} таких коробках?`), g * k,
            { explain: `По ${g} взяли ${k} раз: ${g} · ${k} = <b>${g * k}</b>.`, hint: VIS.bars([{ label: 'коробки', segs: Array.from({ length: k }, () => ({ v: g, t: g })) }], 'Всего — ?'), label: `${g}·${k} ${m}` });
          if (v === 2) return inTask('Реши задачу', story(`${U.cap(nw(g * k, m))} разложили поровну в ${nw(k, 'пакет')}. Сколько ${many(m)} в каждом пакете?`), g,
            { explain: `Поровну — значит, делим: ${g * k} : ${k} = <b>${g}</b>.`, hint: `Подумай: ${k} · ? = ${g * k}.`, label: `${g * k}:${k} поровну` });
          return inTask('Реши задачу', story(`${U.cap(nw(g * k, m))} разложили по ${g} в пакеты. Сколько получилось пакетов?`), k,
            { explain: `По ${g} в каждый пакет: ${g * k} : ${g} = <b>${k}</b>.`, hint: `Подумай: ${g} · ? = ${g * k}.`, label: `${g * k}:${g} по ${g}` });
        },
      },
      {
        id: 'm_prob2', title: 'Задачи в два действия', icon: '🧠', grade: 3, ramp: true, bank: RAMP,
        rule: 'Сначала узнай то, чего <b>не хватает</b> для ответа, — это первое действие. Потом ответь на вопрос — второе действие.<br><i>У Маши 6, у Пети на 2 больше. Сколько вместе? → 1) 6 + 2 = 8; 2) 6 + 8 = 14</i>',
        make(d0) {
          const d = lvD(d0);
          const [k1, k2] = U.sample(KIDS, 2), w = U.rnd(COUNTABLE);
          const story = s => `<div class="story">${s}</div>`;
          if (d === 1) {
            const a = notOne(6, 30), b = notOne(2, 9), more = Math.random() < 0.5 || a - b < 3;
            const c = more ? a + b : a - b;
            return inTask('Реши задачу', story(`У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} на ${nw(b, w)} ${more ? 'больше' : 'меньше'}. Сколько ${many(w)} у них вместе?`), a + c,
              { explain: `1) ${a} ${more ? '+' : '−'} ${b} = ${c} — у ${k2[1]}. 2) ${a} + ${c} = <b>${a + c}</b> — вместе.`, hint: `Сначала узнай, сколько у ${k2[1]}.`, label: `вместе, на ${b} ${more ? 'больше' : 'меньше'}` });
          }
          if (d === 2) {
            if (Math.random() < 0.5) {
              const m = U.rnd(MASC), k = mr(2, 6), g = mr(2, 9), c = notOne(2, 9);
              return inTask('Реши задачу', story(`Купили ${k} ${U.plural(k, ...NOUN.коробка)} по ${nw(g, m)} и ещё ${nw(c, m)}. Сколько всего ${many(m)} купили?`), k * g + c,
                { explain: `1) ${g} · ${k} = ${g * k}. 2) ${g * k} + ${c} = <b>${g * k + c}</b>.`, hint: 'Сначала узнай, сколько в коробках.', label: `${k}·${g}+${c}` });
            }
            const a = notOne(30, 90), b = notOne(5, 20), c = mr(3, 12);
            return inTask('Реши задачу', story(`В корзине было ${nw(a, 'гриб')}. Сначала взяли ${nw(b, 'гриб')}, потом ещё ${c}. Сколько грибов осталось?`), a - b - c,
              { explain: `1) ${a} − ${b} = ${a - b}. 2) ${a - b} − ${c} = <b>${a - b - c}</b>.`, hint: 'Вычитай по очереди: сначала первое, потом второе.', label: `${a}−${b}−${c}` });
          }
          if (Math.random() < 0.5) {
            const k = mr(2, 5), p = notOne(3, 15), total = notOne(k * p + 5, 100);
            return inTask('Реши задачу', story(`У мамы было ${nw(total, 'рубль')}. Она купила ${nw(k, 'тетрадь')} по ${nw(p, 'рубль')}. Сколько рублей у неё осталось?`), total - k * p,
              { explain: `1) ${p} · ${k} = ${k * p} — стоят тетради. 2) ${total} − ${k * p} = <b>${total - k * p}</b>.`, hint: 'Сначала узнай, сколько стоят все тетради.', label: `${total}−${k}·${p}` });
          }
          const a = notOne(2, 9), t = mr(2, 5);
          return inTask('Реши задачу', story(`У ${k1[1]} ${nw(a, 'марка')}, а у ${k2[1]} в ${nw(t, 'раз')} больше. Сколько марок у них вместе?`), a + a * t,
            { explain: `1) ${a} · ${t} = ${a * t} — у ${k2[1]}. 2) ${a} + ${a * t} = <b>${a + a * t}</b>.`, hint: '«В 3 раза больше» — значит, умножаем на 3.', label: `в ${t} раз, вместе` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 9 */
  {
    id: 'mw9', name: 'Тысячеград', emoji: '🌆', c1: '#FF9E8A', c2: '#E85D4A',
    boss: { id: 'mb9', name: 'Тираннозавр Тысячник', emoji: '🦖', hp: 14, story: 'Сам Тираннозавр Тысячник! Он считает до тысячи и думает, что ты не сможешь. Докажи, что сможешь!' },
    lessons: [
      {
        id: 'm_num1000', title: 'Числа до 1000', icon: '💯', grade: 3, ramp: true, bank: RAMP,
        rule: 'В трёхзначном числе: <b>сотни, десятки, единицы</b>.<br><i>347 = 3 сот. 4 дес. 7 ед.</i><br>Всего десятков в 347 — <b>34</b>.',
        make(d0) {
          const d = lvD(d0), n = mr(101, 999), s = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10;
          if (d === 1) {
            if (Math.random() < 0.5) return inTask(`Сколько <b>сотен</b> в числе ${n}?`, eq(String(n)), s, { explain: `${n} = ${s} сот. ${t} дес. ${u} ед. Сотен — <b>${s}</b>.`, hint: 'Первая цифра трёхзначного числа — сотни.', label: `сотни в ${n}` });
            return inTask('Запиши число', eq(`${s} сот. ${t} дес. ${u} ед. = [?]`), n, { explain: `Сотни, десятки, единицы: <b>${n}</b>.`, hint: 'Пиши цифры по порядку: сотни, десятки, единицы.', label: `запись ${n}` });
          }
          if (d === 2) {
            const v = mr(1, 3);
            if (v === 1) return inTask(`Сколько <b>всего десятков</b> в числе ${n}?`, eq(String(n)), Math.floor(n / 10), { explain: `Закрой последнюю цифру: <b>${Math.floor(n / 10)}</b> десятков.`, hint: 'Всего десятков — это число без последней цифры.', label: `всего дес. в ${n}` });
            const r = mr(1, 9) * 100;
            if (v === 2) return inTask('Какое число идёт после?', eq(`${r - 1}, [?]`), r, { explain: `После ${r - 1} идёт <b>${r}</b>.`, hint: 'Прибавь 1.', label: `после ${r - 1}` });
            return inTask('Какое число идёт перед?', eq(`[?], ${r}`), r - 1, { explain: `Перед ${r} идёт <b>${r - 1}</b>.`, hint: 'Отними 1.', label: `перед ${r}` });
          }
          const v = mr(1, 3);
          if (v === 1) { const z = s * 100 + u; return inTask('Запиши число', eq(`${s} сот. 0 дес. ${u} ед. = [?]`), z, { explain: `Десятков нет — пишем 0: <b>${z}</b>.`, hint: 'Если разряда нет, на его месте пишем 0.', label: `запись ${z}` }); }
          if (v === 2) { const b = Math.min(n, 899); return inTask(`Какое число на 100 больше, чем ${b}?`, eq(`${b} + 100 = [?]`), b + 100, { explain: `Увеличиваем сотни на 1: <b>${b + 100}</b>.`, hint: 'Изменится только цифра сотен.', label: `+100 к ${b}` }); }
          let m2; do { m2 = n + U.rnd([-100, -10, -1, 1, 10, 90, -90]); } while (m2 < 100 || m2 > 999);
          return cmpTask(n, m2, `${n} ○ ${m2}`, `Сравниваем по разрядам, начиная с сотен: <b>${n} ${n > m2 ? '&gt;' : '&lt;'} ${m2}</b>.`, `${n} и ${m2}`);
        },
      },
      {
        id: 'm_add3', title: 'Сложение и вычитание до 1000', icon: '🏗️', grade: 3, ramp: true, bank: RAMP,
        rule: 'Складывай и вычитай <b>по разрядам</b>: сотни с сотнями, десятки с десятками, единицы с единицами.<br><i>245 + 132 = 377</i><br>Если в разряде получилось больше 9 — переноси единицу в старший разряд.',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) {
            const a = mr(1, 8), b = mr(1, 9 - a);
            if (Math.random() < 0.5) return inTask('Реши пример', eq(`${a * 100} + ${b * 100} = [?]`), (a + b) * 100, { explain: `${a} сот. + ${b} сот. = <b>${(a + b) * 100}</b>.`, hint: 'Считай сотнями.', label: `${a * 100}+${b * 100}` });
            return inTask('Реши пример', eq(`${(a + b) * 100} − ${b * 100} = [?]`), a * 100, { explain: `${a + b} сот. − ${b} сот. = <b>${a * 100}</b>.`, hint: 'Считай сотнями.', label: `${(a + b) * 100}−${b * 100}` });
          }
          if (d === 2) {
            let a, b; do { a = mr(100, 800); b = mr(11, 199); } while (a % 10 + b % 10 > 9 || Math.floor(a / 10) % 10 + Math.floor(b / 10) % 10 > 9 || a + b > 999);
            if (Math.random() < 0.5) return inTask('Реши пример', eq(`${a} + ${b} = [?]`), a + b, { explain: `Складываем по разрядам: <b>${a + b}</b>.`, hint: 'Единицы с единицами, десятки с десятками, сотни с сотнями.', label: `${a}+${b}` });
            return inTask('Реши пример', eq(`${a + b} − ${b} = [?]`), a, { explain: `Вычитаем по разрядам: <b>${a}</b>.`, hint: 'Единицы из единиц, десятки из десятков, сотни из сотен.', label: `${a + b}−${b}` });
          }
          if (Math.random() < 0.5) {
            let a, b; do { a = mr(105, 700); b = mr(105, 400); } while (a % 10 + b % 10 < 10 || a + b > 999);
            return inTask('Реши пример', eq(`${a} + ${b} = [?]`), a + b, { explain: `Единицы: ${a % 10} + ${b % 10} = ${a % 10 + b % 10} — пишем ${(a + b) % 10}, 1 десяток переносим. Ответ: <b>${a + b}</b>.`, hint: 'Начни с единиц. Если получилось больше 9 — перенеси 1 в десятки.', label: `${a}+${b}` });
          }
          let a, b; do { a = mr(300, 999); b = mr(105, a - 50); } while (b % 10 <= a % 10);
          return inTask('Реши пример', eq(`${a} − ${b} = [?]`), a - b, { explain: `В единицах ${a % 10} меньше ${b % 10} — занимаем 1 десяток. Ответ: <b>${a - b}</b>.`, hint: 'Если единиц не хватает, займи 1 десяток (это 10 единиц).', label: `${a}−${b}` });
        },
      },
      {
        id: 'm_mulx', title: 'Внетабличное умножение', icon: '🚀', grade: 3, ramp: true, bank: RAMP,
        rule: 'Разложи число на <b>десятки и единицы</b>:<br><i>23 · 3 = 20 · 3 + 3 · 3 = 60 + 9 = 69</i><br><i>72 : 4 = (40 + 32) : 4 = 10 + 8 = 18</i>',
        make(d0) {
          const d = lvD(d0);
          if (d === 1) {
            const t = mr(1, 4), b = mr(2, Math.floor(9 / t));
            if (Math.random() < 0.5) return inTask('Реши пример', eq(`${t * 10} · ${b} = [?]`), t * 10 * b, { explain: `${t} дес. · ${b} = ${t * b} дес. = <b>${t * b * 10}</b>.`, hint: 'Умножь десятки, как обычные числа.', label: `${t * 10}·${b}` });
            return inTask('Реши пример', eq(`${t * b * 10} : ${b} = [?]`), t * 10, { explain: `${t * b} дес. : ${b} = ${t} дес. = <b>${t * 10}</b>.`, hint: 'Дели десятки, как обычные числа.', label: `${t * b * 10}:${b}` });
          }
          const mul = Math.random() < 0.5;
          let a, b;
          if (mul) {
            do { a = mr(11, 49); b = mr(2, 9); } while (a * b > 99 || (d === 2 && (a % 10) * b > 9) || (d === 3 && (a % 10) * b < 10));
            const t = a - a % 10, u = a % 10;
            return inTask('Реши пример', eq(`${a} · ${b} = [?]`), a * b, { explain: `${a} · ${b} = ${t} · ${b} + ${u} · ${b} = ${t * b} + ${u * b} = <b>${a * b}</b>.`, hint: `Разложи ${a} = ${t} + ${u}.`, label: `${a}·${b}` });
          }
          let q; do { b = mr(2, 9); q = mr(11, 49); } while (b * q > 99 || (d === 2 && Math.floor(b * q / 10) % b !== 0) || (d === 3 && Math.floor(b * q / 10) % b === 0));
          const D = b * q, p1 = (q - q % 10) * b, p2 = (q % 10) * b;
          return inTask('Реши пример', eq(`${D} : ${b} = [?]`), q, { explain: `${D} = ${p1} + ${p2}; ${p1} : ${b} = ${p1 / b}, ${p2} : ${b} = ${p2 / b}. Ответ: <b>${q}</b>.`, hint: `Разложи ${D} на удобные слагаемые: ${p1} + ${p2}.`, label: `${D}:${b}` });
        },
      },
      {
        id: 'm_rem', title: 'Деление с остатком', icon: '🍰', grade: 3, ramp: true, bank: RAMP,
        rule: '<i>17 : 5 = 3 (ост. 2)</i>, потому что 5 · 3 = 15, а 17 − 15 = 2.<br>Главное правило: <b>остаток всегда меньше делителя!</b>',
        make(d0) {
          const d = lvD(d0);
          const b = d === 1 ? mr(2, 5) : mr(3, 9), q = mr(1, 9), r = mr(1, b - 1), D = b * q + r;
          const f = (x, y) => `${x} (ост. ${y})`;
          const set = new Set([f(q, r)]);
          const cands = [q > 1 ? f(q - 1, r + b) : null, f(q + 1, r), r + 1 < b ? f(q, r + 1) : f(q, r - 1 > 0 ? r - 1 : r + 2), f(q, b), r > 1 ? f(q, r - 1) : null].filter(Boolean);
          for (const c of U.shuffle(cands)) { if (set.size >= 4) break; set.add(c); }
          return T.choice('Раздели с остатком', [...set], f(q, r), {
            show: eq(`${D} : ${b} = ?`), label: `${D}:${b}`,
            explain: `${b} · ${q} = ${b * q}, ${D} − ${b * q} = ${r}. Ответ: <b>${f(q, r)}</b>. Остаток ${r} меньше делителя ${b} ✓`,
          });
        },
      },
    ],
  },
];
