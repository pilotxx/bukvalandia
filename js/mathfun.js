'use strict';
/* ============================================================
   Букваландия — игровые задания по математике («руками», а не только клавиатурой)
   Обычное задание темы (makeTask) с вероятностью ~50 % заменяется игровым того же уровня сложности:
   🧱 собери число из брусков и кубиков · 🐾 числовой луч — питомец прыгает ·
   🟩 закрась клетки (умножение, площадь) · ✏️ обведи стороны (периметр) ·
   ⏰ поставь стрелки · ⚖️ уравновесь весы · 💬 задача-комикс (схема → действие → ответ).
   Номер задания в банке темы сохраняется — звёзды, ошибки и «Работа над ошибками» работают как раньше.
   Ответ в answer() — 'ok' / 'bad' (вид задания 'mf').
   ============================================================ */

const MF_EMO = { яблоко: '🍎', марка: '📮', конфета: '🍬', наклейка: '⭐', орех: '🌰', гриб: '🍄', шарик: '🎈', карандаш: '✏️' };
const MF_GIRLS = ['Маша', 'Оля', 'Катя'];
const MF_FRUIT = [['🍉', 'Арбуз'], ['🎃', 'Тыква'], ['🍍', 'Ананас'], ['🥔', 'Картошка'], ['🍈', 'Дыня']];
const MF_SMALL = [['🧀', 'Сыр'], ['🍞', 'Хлеб'], ['🧈', 'Масло'], ['🍫', 'Шоколад'], ['🍯', 'Мёд']];
const mfTime = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const mfMass = g => g >= 1000 ? `${Math.floor(g / 1000)} кг${g % 1000 ? ' ' + (g % 1000) + ' г' : ''}` : g + ' г';

const MathFun = {
  KINDS: ['mf'],
  /* Темы: [доля игровых заданий, генератор по уровню 1–3]; генератор может вернуть null — тогда остаётся обычное задание */
  TOPICS: {
    m_tens: [0.55, d => MathFun.blocksTask(d, 'tens')],
    m_compare: [0.45, d => MathFun.blocksTask(d, 'range')],
    m_num1000: [0.45, d => MathFun.blocksTask(d, 'h')],
    m_round10: [0.45, d => d < 3 ? MathFun.lineTask(d, 'round') : null],
    m_over10: [0.5, d => MathFun.lineTask(d, 'over10')],
    m_sub20: [0.5, d => MathFun.lineTask(d, 'sub20')],
    m_add2: [0.5, d => MathFun.lineTask(d, 'add2')],
    m_sub2: [0.5, d => MathFun.lineTask(d, 'sub2')],
    m_mulmean: [0.55, d => MathFun.cellsTask(d, 'mul')],
    m_t2345: [0.5, d => Math.random() < 0.5 ? MathFun.lineTask(d, 'skip') : MathFun.cellsTask(d, 'tab')],
    m_area: [0.55, d => MathFun.cellsTask(d, 'area')],
    m_perim: [0.55, d => MathFun.edgesTask(d)],
    m_clock: [0.55, d => MathFun.clockTask(d, 'set')],
    m_time: [0.6, d => d === 3 ? MathFun.clockTask(d, 'end') : null],
    m_mass: [0.55, d => MathFun.scaleTask(d, 'mass')],
    m_unknown: [0.45, d => d < 3 ? MathFun.scaleTask(d, 'unk') : null],
    m_eq: [0.45, d => d < 3 ? MathFun.scaleTask(d, 'eq') : null],
    m_prob1: [0.55, d => MathFun.comicTask(d)],
  },

  /* ---------- Превращение задания ---------- */
  transform(t, les, i) {
    if (!t || les.subject.id !== 'math' || t.lid) return t;
    const g = MathFun.TOPICS[les.id];
    if (!g || Math.random() >= g[0]) return t;
    try {
      const n = g[1](lvD(les.bank[i]));
      if (n) return Object.assign({ kind: 'mf', hint: '', explain: '' }, n, { answer: String(n.answer) });
    } catch (e) { console.error('Задание-игра (математика)', les.id, e); }
    return t;
  },

  /* ============================================================
     🧱 Собери число из брусков-десятков, кубиков-единиц (и плиток-сотен)
     ============================================================ */
  blocksTask(d, mode) {
    const pl = (n, a, b, c) => `${n} ${U.plural(n, a, b, c)}`;
    const said = n => { const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10; return [h ? pl(h, 'плитка', 'плитки', 'плиток') : '', t ? pl(t, 'брусок', 'бруска', 'брусков') : '', u ? pl(u, 'кубик', 'кубика', 'кубиков') : ''].filter(Boolean).join(', '); };
    let n, lo = null, hi = null, prompt;
    if (mode === 'range') {
      if (d === 1) { const t = mr(1, 8); lo = t * 10 + mr(0, 3); hi = lo + mr(4, 6); }
      else if (d === 2) { const t = mr(1, 8); lo = t * 10 + mr(6, 8); hi = lo + mr(4, 5); }
      else { lo = mr(15, 94); hi = lo + 3; }
      n = lo + 1;
      const fit = Array.from({ length: hi - lo - 1 }, (_, k) => lo + 1 + k);
      return {
        mf: 'blocks', lo, hi, n, hund: false, answer: n, label: `🧱 ${lo} < ? < ${hi}`,
        prompt: `🧱 Собери любое число <b>больше ${lo}</b>, но <b>меньше ${hi}</b>`,
        explain: `Подходят числа: <b>${fit.join(', ')}</b>. Сравнивай сначала десятки, потом единицы.`,
        hint: `Сначала положи столько брусков, сколько десятков в числе ${lo}.`,
      };
    }
    if (mode === 'tens') {
      if (d === 1) { n = mr(11, 49); prompt = `🧱 Собери число <b>${n}</b>`; }
      else if (d === 2) { n = mr(50, 99); prompt = `🧱 Собери число <b>${n}</b>`; }
      else {
        const v = mr(1, 3);
        if (v === 1) { const x = mr(11, 89); n = x + 10; prompt = `🧱 Собери число, которое <b>на 10 больше</b>, чем ${x}`; }
        else if (v === 2) { const t = mr(2, 9); n = t * 10 - 1; prompt = `🧱 Собери число, которое <b>на 1 меньше</b>, чем ${t * 10}`; }
        else { const t = mr(1, 8); n = t * 10 + 10; prompt = `🧱 Собери число, которое <b>на 1 больше</b>, чем ${t * 10 + 9}`; }
      }
    } else {
      if (d === 1) n = mr(1, 3) * 100 + mr(1, 9) * 10 + mr(1, 9);
      else if (d === 2) n = Math.random() < 0.5 ? mr(1, 5) * 100 + mr(1, 9) : mr(1, 5) * 100 + mr(1, 9) * 10;
      if (d < 3) prompt = `🧱 Собери число <b>${n}</b>`;
      else if (Math.random() < 0.5) { const x = mr(1, 4) * 100 + mr(10, 99); n = x + 100; prompt = `🧱 Собери число, которое <b>на 100 больше</b>, чем ${x}`; }
      else { const x = mr(2, 5) * 100 + mr(0, 9); n = x - 10; prompt = `🧱 Собери число, которое <b>на 10 меньше</b>, чем ${x}`; }
    }
    return {
      mf: 'blocks', n, lo, hi, hund: mode === 'h', answer: n, label: '🧱 ' + n, prompt,
      explain: `Число <b>${n}</b> — это ${MathFun.digits(n)}: ${said(n)}.`,
      hint: mode === 'h' ? 'Плитка — 100, брусок — 10, кубик — 1. Первая цифра — сколько плиток.' : 'Брусок — 10, кубик — 1. Первая цифра — сколько брусков, вторая — сколько кубиков.',
    };
  },
  blocksHTML(t) {
    return `<div class="mf mfb">
      <div class="mfb-src">${t.hund ? '<button class="mfb-s" data-v="100"><i class="mfb-h"></i><b>100</b></button>' : ''}<button class="mfb-s" data-v="10"><i class="mfb-r"></i><b>10</b></button><button class="mfb-s" data-v="1"><i class="mfb-c"></i><b>1</b></button></div>
      <div class="mfb-tray" id="mfTray"><span class="ph">Стол пуст — нажми на брусок или кубик</span></div>
      <div class="mf-msg" id="mfMsg"></div>
      <div class="mf-row"><button class="btn primary" id="mfOk">Готово</button></div></div>`;
  },
  blocksBind(t, body) {
    const st = { h: 0, r: 0, c: 0 }, tray = $('#mfTray', body), msg = $('#mfMsg', body);
    const draw = () => {
      const v = st.h * 100 + st.r * 10 + st.c;
      tray.innerHTML = v ? `<div class="mfb-g">${'<i class="mfb-h" data-v="100"></i>'.repeat(st.h)}</div><div class="mfb-g">${'<i class="mfb-r" data-v="10"></i>'.repeat(st.r)}</div><div class="mfb-g cubes">${'<i class="mfb-c" data-v="1"></i>'.repeat(st.c)}</div>`
        : '<span class="ph">Стол пуст — нажми на брусок или кубик</span>';
    };
    const say = (s, cls = '') => { msg.innerHTML = s; msg.className = 'mf-msg ' + cls; };
    const add = v => {
      if (L.answered) return;
      say('');
      if (v === 1) {
        if (st.c < 9) st.c++;
        else if (st.r < 9 || (t.hund && st.h < 9)) { st.c = 0; st.r++; say('✨ 10 кубиков = 1 брусок!', 'good'); }
        else { MathFun.shake(tray); return; }
      } else if (v === 10) {
        if (st.r < 9) st.r++;
        else if (t.hund && st.h < 9) { st.r = 0; st.h++; say('✨ 10 брусков = 1 плитка-сотня!', 'good'); }
        else { MathFun.shake(tray); say(t.hund ? '' : 'Больше девяти брусков не нужно — это уже сотня!'); return; }
      } else { if (st.h < 9) st.h++; else { MathFun.shake(tray); return; } }
      if (st.r === 10) { st.r = 0; st.h++; say('✨ 10 брусков = 1 плитка-сотня!', 'good'); }
      Sound.play('pop'); draw();
    };
    $$('.mfb-s', body).forEach(b => RuFun.dragable(b, tg => { if (tg && tg.closest('#mfTray')) add(+b.dataset.v); }, () => add(+b.dataset.v)));
    tray.addEventListener('click', e => {
      const it = e.target.closest('[data-v]'); if (!it || L.answered) return;
      const v = +it.dataset.v;
      if (v === 100) st.h--; else if (v === 10) st.r--; else st.c--;
      Sound.play('tap'); draw();
    });
    $('#mfOk', body).addEventListener('click', () => {
      if (L.answered) return;
      const v = st.h * 100 + st.r * 10 + st.c;
      if (!v) { say('Положи на стол бруски и кубики'); MathFun.shake(tray); return; }
      const ok = t.lo !== null ? v > t.lo && v < t.hi : v === t.n;
      tray.classList.add(ok ? 'right' : 'wrong');
      if (!ok) say(`Получилось <b>${v}</b>.`);
      MathFun.done(ok);
    });
  },

  /* ============================================================
     🐾 Числовой луч: питомец прыгает (+1, +10, по 3…)
     ============================================================ */
  lineTask(d, mode) {
    let a, b, op = 1, steps, lo = 0, hi = 20, tick = 1, hint;
    const pl = n => U.plural(n, 'прыжок', 'прыжка', 'прыжков');
    if (mode === 'over10') {
      a = d === 1 ? 9 : d === 2 ? U.rnd([8, 7]) : mr(5, 9); b = mr(11 - a, 9); steps = [1];
      hint = `Сначала допрыгай до 10 — это ${10 - a} ${pl(10 - a)}, потом ещё ${b - (10 - a)}.`;
    } else if (mode === 'sub20') {
      const c = d === 1 ? mr(11, 13) : d === 2 ? mr(12, 15) : mr(13, 18);
      b = mr(c - 9, 9); a = c; op = -1; steps = [-1];
      hint = `Сначала допрыгай назад до 10 — это ${c - 10} ${pl(c - 10)}, потом ещё ${b - (c - 10)}.`;
    } else if (mode === 'add2') {
      if (d === 1) { a = mr(2, 8) * 10 + mr(0, 7); b = mr(1, 9 - a % 10); steps = [1]; }
      else if (d === 2) { do { a = mr(12, 89); b = mr(2, 9); } while (a % 10 + b < 10 || a % 10 === 0 || a + b > 99); steps = [1]; }
      else { do { a = mr(15, 59); b = mr(12, 39); } while (a % 10 + b % 10 < 10 || a + b > 99); steps = [10, 1]; }
      hint = steps.length > 1 ? `Сначала прыгай десятками: ${Math.floor(b / 10)} раза по +10, потом единицами: ${b % 10} раз по +1.` : `Сделай ${b} ${pl(b)} по +1.`;
    } else if (mode === 'sub2') {
      if (d === 1) { a = mr(2, 9) * 10 + mr(2, 9); b = mr(1, a % 10); steps = [-1]; }
      else if (d === 2) { do { a = mr(21, 99); b = mr(2, 9); } while (b <= a % 10); steps = [-1]; }
      else { do { a = mr(41, 99); b = mr(12, 39); } while (b % 10 <= a % 10 || b % 10 === 0); steps = [-10, -1]; }
      op = -1;
      hint = steps.length > 1 ? `Сначала прыгай назад десятками: ${Math.floor(b / 10)} раза по −10, потом ${b % 10} раз по −1.` : `Сделай ${b} ${pl(b)} назад по −1.`;
    } else if (mode === 'round') {
      tick = 10; lo = 0; hi = 100;
      if (d === 1) { const x = mr(1, 8), y = mr(1, 9 - x); a = x * 10; b = y * 10; steps = [10]; }
      else { const x = mr(3, 10), y = mr(1, x - 1); a = x * 10; b = y * 10; steps = [-10]; op = -1; }
      hint = `Каждый прыжок — ${tick} единиц. Сделай ${b / 10} ${pl(b / 10)}.`;
    } else {   // skip: таблица умножения прыжками
      const s = d === 1 ? U.rnd([2, 3]) : d === 2 ? U.rnd([4, 5]) : mr(2, 5), k = mr(2, s >= 4 ? 9 : 10);
      const tgt = s * k;
      return {
        mf: 'line', a: 0, target: tgt, steps: [s], lo: 0, hi: Math.ceil((tgt + s) / 10) * 10, tick: 1, k, s,
        answer: tgt, label: `🐾 по ${s} × ${k}`, eq0: `${s} · ${k} = ?`,
        prompt: `🐾 Питомец прыгает <b>по ${s}</b>. Сделай <b>${k}</b> ${pl(k)} и нажми «Готово»`,
        explain: `По ${s} взяли ${k} раз: ${Array.from({ length: k }, (_, i) => s * (i + 1)).join(', ')}. Значит, ${s} · ${k} = <b>${tgt}</b>.`,
        hint: `Считай прыжки: ${s}, ${2 * s}, ${3 * s}…`,
      };
    }
    const tgt = a + op * b;
    if (mode !== 'round' && mode !== 'over10' && mode !== 'sub20') {
      lo = Math.max(0, Math.floor((Math.min(a, tgt) - 1) / 10) * 10); hi = Math.ceil((Math.max(a, tgt) + 1) / 10) * 10;
    }
    const sign = op > 0 ? '+' : '−';
    return {
      mf: 'line', a, target: tgt, steps, lo, hi, tick, answer: tgt, label: `🐾 ${a} ${sign} ${b}`, eq0: `${a} ${sign} ${b} = ?`,
      prompt: '🐾 Прыгай с питомцем по лучу и нажми «Готово»',
      explain: `${a} ${sign} ${b} = <b>${tgt}</b>. ${steps.length > 1 ? `Прыжки: ${Math.floor(b / 10)} ${pl(Math.floor(b / 10))} по ${sign}10 и ${b % 10} по ${sign}1.` : `Нужно ${b / Math.abs(steps[0])} ${pl(b / Math.abs(steps[0]))} по ${sign}${Math.abs(steps[0])}.`}`,
      hint,
    };
  },
  lineHTML(t) {
    const pet = typeof petSVG === 'function' ? petSVG({ uid: 'mfp', mood: 'happy' }) : '🐾';
    const btn = s => `<button class="btn mfl-j" data-s="${s}">${s > 0 ? '+' : '−'}${Math.abs(s)}</button>`;
    return `<div class="mf mfl"><div class="eq mf-eq0">${t.eq0}</div>
      <div class="mfl-wrap"><div class="mfl-lane"><div class="mfl-pet" id="mfPet"><span class="mfl-num" id="mfNum">${t.a}</span><span class="mfl-svg">${pet}</span></div></div>
      <svg class="mfl-svg0" id="mfLine" viewBox="0 0 700 64"></svg></div>
      <div class="mf-msg" id="mfMsg">Прыжков: 0</div>
      <div class="mf-row">${t.steps.map(btn).join('')}<button class="btn ghost" id="mfBack" aria-label="Назад">↩</button><button class="btn primary" id="mfOk">Готово</button></div></div>`;
  },
  lineBind(t, body) {
    const W = 700, P = 22, Y = 44, svg = $('#mfLine', body), pet = $('#mfPet', body), num = $('#mfNum', body), msg = $('#mfMsg', body);
    const x = v => P + (v - t.lo) / (t.hi - t.lo) * (W - 2 * P);
    const n = (t.hi - t.lo) / t.tick, dense = n > 30;
    let base = `<line x1="${P - 10}" y1="${Y}" x2="${W - P + 12}" y2="${Y}" stroke="#2B2350" stroke-width="2.5"/><path d="M${W - P + 14} ${Y} l-9 -5 v10 z" fill="#2B2350"/>`;
    for (let v = t.lo; v <= t.hi; v += t.tick) {
      const big = v % (t.tick * 10) === 0, mid = v % (t.tick * 5) === 0;
      base += `<line x1="${x(v)}" y1="${Y - (big ? 8 : mid ? 6 : 4)}" x2="${x(v)}" y2="${Y + (big ? 8 : mid ? 6 : 4)}" stroke="#2B2350" stroke-width="${big ? 2.2 : 1.3}"/>`;
      if (!dense || mid) base += `<text x="${x(v)}" y="${Y + 19}" text-anchor="middle" font-size="${dense ? 12 : 13}" font-weight="${big ? 900 : 700}" fill="#2B2350">${v}</text>`;
    }
    const path = [t.a];
    const draw = () => {
      let arcs = '';
      for (let k = 1; k < path.length; k++) {
        const x1 = x(path[k - 1]), x2 = x(path[k]), h = Math.min(30, 8 + Math.abs(x2 - x1) * 0.45);
        const up = path[k] > path[k - 1], st = Math.abs(path[k] - path[k - 1]);
        arcs += `<path d="M${x1} ${Y - 3} Q${(x1 + x2) / 2} ${Y - 3 - 2 * h} ${x2} ${Y - 3}" fill="none" stroke="${up ? '#22C55E' : '#FF7A59'}" stroke-width="2.4"/>`;
        if (Math.abs(x2 - x1) >= 34) arcs += `<text x="${(x1 + x2) / 2}" y="${Y - 6 - h}" text-anchor="middle" font-size="11" font-weight="900" fill="${up ? '#15994A' : '#C2361A'}">${up ? '+' : '−'}${st}</text>`;
      }
      svg.innerHTML = base + arcs;
      const p = path[path.length - 1];
      pet.style.left = (100 * x(p) / W) + '%';
      num.textContent = p;
      msg.textContent = 'Прыжков: ' + (path.length - 1);
    };
    draw();
    const hop = () => { pet.classList.remove('hop'); void pet.offsetWidth; pet.classList.add('hop'); };
    $$('.mfl-j', body).forEach(b => b.addEventListener('click', () => {
      if (L.answered) return;
      const p = path[path.length - 1] + +b.dataset.s;
      if (p < t.lo || p > t.hi) { MathFun.shake(svg); Sound.play('wrong'); return; }
      path.push(p); hop(); Sound.play('pop'); draw();
    }));
    $('#mfBack', body).addEventListener('click', () => { if (L.answered || path.length < 2) return; path.pop(); Sound.play('tap'); draw(); });
    $('#mfOk', body).addEventListener('click', () => {
      if (L.answered) return;
      if (path.length < 2) { msg.textContent = 'Сначала попрыгай! Нажимай кнопки с прыжками'; MathFun.shake(msg); return; }
      const ok = path[path.length - 1] === t.target;
      if (!ok) svg.insertAdjacentHTML('beforeend', `<circle cx="${x(t.target)}" cy="${Y}" r="9" fill="none" stroke="#22C55E" stroke-width="3"/>`);
      MathFun.done(ok);
    });
  },

  /* ============================================================
     🟩 Клетки: закрась ряды (умножение), прямоугольник или квадрат (площадь)
     ============================================================ */
  cellsTask(d, mode) {
    const C = 10, R = 6;
    const rows = n => `${n} ${U.plural(n, 'ряд', 'ряда', 'рядов')}`, cells = n => `${n} ${U.plural(n, 'клетка', 'клетки', 'клеток')}`;
    if (mode === 'mul' || mode === 'tab') {
      let r, c;
      if (mode === 'mul') { do { r = d === 1 ? mr(2, 4) : d === 2 ? mr(2, 5) : mr(3, 5); c = d === 1 ? mr(2, 5) : d === 2 ? mr(3, 6) : mr(4, 8); } while (r === c); }
      else { r = d === 1 ? U.rnd([2, 3]) : d === 2 ? U.rnd([4, 5]) : mr(2, 5); c = mr(3, 9); }
      return {
        mf: 'cells', mode: 'mul', C, R, w: c, h: r, answer: r * c, label: `🟩 ${r} по ${c}`, eqs: `${c} · ${r}`,
        prompt: `🟩 Закрась <b>${rows(r)}</b> по <b>${cells(c)}</b>`,
        explain: `${r} ${U.plural(r, 'ряд', 'ряда', 'рядов')} по ${c}: ${Array(r).fill(c).join(' + ')} = ${c} · ${r} = <b>${r * c}</b>.`,
        hint: 'Проведи пальцем по клеткам — они закрашиваются. Ряд — это клетки слева направо.',
      };
    }
    if (d === 1) {
      const w = mr(3, 7), h = mr(2, 4);
      return {
        mf: 'cells', mode: 'rect', C, R, w, h, answer: w * h, label: `🟩 S ${w}×${h}`, eqs: `${w} · ${h}`, unit: 'кв. см',
        prompt: `🟩 Закрась прямоугольник: <b>длина ${cells(w)}</b>, <b>ширина ${cells(h)}</b>. Потом найди площадь`,
        explain: `S = ${w} · ${h} = <b>${w * h}</b> кв. см — столько клеток внутри.`,
        hint: 'Длина — клетки слева направо, ширина — сверху вниз. Одна клетка — 1 кв. см.',
      };
    }
    const N = d === 2 ? U.rnd([6, 8, 10, 12, 14, 15, 16, 18, 20, 24]) : U.rnd([4, 9, 16, 25, 36]);
    const sq = d === 3;
    const ways = [];
    for (let h = 1; h <= R; h++) if (N % h === 0 && N / h <= C && (!sq || N / h === h)) ways.push(`${N / h} · ${h}`);
    return {
      mf: 'cells', mode: sq ? 'square' : 'area', C, R, N, answer: N, label: `🟩 ${sq ? 'квадрат' : 'S'} ${N}`,
      prompt: sq ? `🟩 Закрась <b>квадрат</b> площадью <b>${N} кв. см</b> (одна клетка — 1 кв. см)` : `🟩 Закрась любой прямоугольник площадью <b>${N} кв. см</b> (одна клетка — 1 кв. см)`,
      explain: sq ? `У квадрата все стороны равны: ${ways[0]} = <b>${N}</b> кв. см.` : `Подходят прямоугольники: ${ways.map(x => '<b>' + x + '</b>').join(', ')} — везде ${N} клеток.`,
      hint: sq ? `Какое число, умноженное само на себя, даёт ${N}?` : `Подумай, какие два числа при умножении дают ${N}.`,
    };
  },
  cellsHTML(t) {
    return `<div class="mf mfc"><div class="mfc-grid" id="mfGrid" style="--c:${t.C}">${Array.from({ length: t.C * t.R }, (_, k) => `<i data-k="${k}"></i>`).join('')}</div>
      <div class="mf-msg" id="mfMsg">Проведи пальцем по клеткам (нажатие на закрашенную клетку стирает)</div>
      <div id="mfStep"><div class="mf-row"><button class="btn ghost" id="mfClr">Стереть всё</button><button class="btn primary" id="mfOk">Готово</button></div></div></div>`;
  },
  cellsBind(t, body) {
    const grid = $('#mfGrid', body), cells = $$('i', grid), msg = $('#mfMsg', body), on = new Set();
    let mode = null, locked = false;
    const set = (el, v) => { const k = +el.dataset.k; if (v === on.has(k)) return; v ? on.add(k) : on.delete(k); el.classList.toggle('on', v); if (v) Sound.play('tap'); };
    grid.addEventListener('pointerdown', e => {
      const c = e.target.closest('i'); if (!c || locked || L.answered) return;
      e.preventDefault(); mode = !on.has(+c.dataset.k); set(c, mode);
      window.addEventListener('pointerup', stop, { once: true });
    });
    grid.addEventListener('pointermove', e => {
      if (mode === null) return;
      const c = document.elementFromPoint(e.clientX, e.clientY);
      if (c && c.parentNode === grid) set(c, mode);
    });
    function stop() { mode = null; }
    grid.addEventListener('pointercancel', stop);
    $('#mfClr', body).addEventListener('click', () => { if (locked) return; on.clear(); cells.forEach(c => c.classList.remove('on')); Sound.play('tap'); });
    $('#mfOk', body).addEventListener('click', () => {
      if (locked || L.answered) return;
      const ks = [...on];
      if (!ks.length) { msg.textContent = 'Сначала закрась клетки'; MathFun.shake(grid); return; }
      const xs = ks.map(k => k % t.C), ys = ks.map(k => Math.floor(k / t.C));
      const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
      if (w * h !== ks.length) { msg.textContent = 'Закрась ровный прямоугольник — без дырок и лишних клеток'; MathFun.shake(grid); Sound.play('wrong'); return; }
      let ok;
      if (t.mode === 'mul') ok = w === t.w && h === t.h;
      else if (t.mode === 'rect') ok = (w === t.w && h === t.h) || (w === t.h && h === t.w);
      else ok = w * h === t.N && (t.mode !== 'square' || w === h);
      locked = true; grid.classList.add('locked');
      if (!ok) {
        msg.innerHTML = `Получилось ${h} ${U.plural(h, 'ряд', 'ряда', 'рядов')} по ${w} ${U.plural(w, 'клетке', 'клетки', 'клеток')}${t.mode === 'mul' || t.mode === 'rect' ? '' : ` — это ${w * h} кв. см`}.`;
        grid.classList.add('wrong'); MathFun.done(false); return;
      }
      Sound.play('coin');
      if (t.mode === 'area' || t.mode === 'square') { msg.innerHTML = `${w} · ${h} = <b>${w * h}</b> ✓`; grid.classList.add('right'); MathFun.done(true); return; }
      msg.textContent = t.mode === 'mul' ? 'Верно! Теперь посчитай клетки' : 'Верно! Теперь найди площадь';
      MathFun.padStep($('#mfStep', body), `${t.eqs} = [?]${t.unit ? ' ' + t.unit : ''}`, t.answer, grid);
    });
  },

  /* ============================================================
     ✏️ Периметр: обведи пальцем все стороны фигуры по клеткам
     ============================================================ */
  edgesTask(d) {
    let cells = [], W, H, desc;
    if (d === 1 || (d === 2 && Math.random() < 0.5)) {
      W = mr(2, 6); H = mr(2, 4); if (d === 2) H = W = mr(2, 4);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push([x, y]);
      desc = W === H ? `У квадрата 4 стороны по ${W} см: P = ${W} · 4 = ` : `P = (${W} + ${H}) · 2 = `;
    } else {
      W = mr(3, 6); H = mr(3, 4);
      const cw = mr(1, W - 2), ch = mr(1, H - 1);    // вырезанный угол
      const corner = U.rnd([[0, 0], [W - cw, 0], [0, H - ch], [W - cw, H - ch]]);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!(x >= corner[0] && x < corner[0] + cw && y >= corner[1] && y < corner[1] + ch)) cells.push([x, y]);
      desc = 'Сложи все стороны по клеткам: P = ';
    }
    const has = (x, y) => cells.some(c => c[0] === x && c[1] === y), edges = [];
    cells.forEach(([x, y]) => {
      if (!has(x, y - 1)) edges.push(`h${x}_${y}`);
      if (!has(x, y + 1)) edges.push(`h${x}_${y + 1}`);
      if (!has(x - 1, y)) edges.push(`v${x}_${y}`);
      if (!has(x + 1, y)) edges.push(`v${x + 1}_${y}`);
    });
    const P = edges.length;
    return {
      mf: 'edges', cells, W, H, edges, nums: d === 1, answer: P, label: `✏️ P ${W}×${H} ${cells.length}`,
      prompt: '✏️ Обведи пальцем <b>все стороны</b> фигуры. Одна клетка — 1 см',
      explain: `${desc}<b>${P}</b> см. Периметр — длина всей границы фигуры.`,
      hint: 'Веди пальцем по пунктиру вокруг фигуры. Каждый отрезок — 1 см.',
    };
  },
  edgesHTML(t) {
    const S = 34, M = 14, w = t.W * S + 2 * M, h = t.H * S + 2 * M;
    let g = '';
    for (let x = 0; x <= t.W; x++) g += `<line x1="${M + x * S}" y1="${M - 6}" x2="${M + x * S}" y2="${h - M + 6}" class="mfe-g"/>`;
    for (let y = 0; y <= t.H; y++) g += `<line x1="${M - 6}" y1="${M + y * S}" x2="${w - M + 6}" y2="${M + y * S}" class="mfe-g"/>`;
    const fill = t.cells.map(([x, y]) => `<rect x="${M + x * S}" y="${M + y * S}" width="${S}" height="${S}" class="mfe-f"/>`).join('');
    const ed = t.edges.map(e => {
      const [x, y] = e.slice(1).split('_').map(Number), x1 = M + x * S, y1 = M + y * S, x2 = e[0] === 'h' ? x1 + S : x1, y2 = e[0] === 'h' ? y1 : y1 + S;
      return `<g class="mfe-e" data-e="${e}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="mfe-l"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="mfe-hit" data-e="${e}"/><text x="${(x1 + x2) / 2 + (e[0] === 'v' ? (x * 2 >= t.W ? 9 : -9) : 0)}" y="${(y1 + y2) / 2 + (e[0] === 'h' ? (y * 2 >= t.H ? 12 : -6) : 4)}" class="mfe-n"></text></g>`;
    }).join('');
    return `<div class="mf mfe"><svg class="mfe-svg" id="mfEdges" viewBox="0 0 ${w} ${h}" style="max-width:${Math.round(w * 1.6)}px">${g}${fill}${ed}</svg>
      <div class="mf-msg" id="mfMsg">Обведено: 0 см</div><div id="mfStep"></div></div>`;
  },
  edgesBind(t, body) {
    const svg = $('#mfEdges', body), msg = $('#mfMsg', body), done = [];
    let mode = null, finished = false;
    const grp = e => svg.querySelector(`.mfe-e[data-e="${e}"]`);
    const renum = () => { t.edges.forEach(e => { grp(e).querySelector('text').textContent = ''; }); if (t.nums) done.forEach((e, k) => { grp(e).querySelector('text').textContent = k + 1; }); msg.textContent = t.nums ? `Обведено: ${done.length} см` : `Обведи все стороны — ${done.length ? 'продолжай' : 'начни с любого угла'}`; };
    const mark = (e, v) => {
      const i = done.indexOf(e);
      if (v && i < 0) { done.push(e); grp(e).classList.add('on'); Sound.play('tap'); }
      else if (!v && i >= 0) { done.splice(i, 1); grp(e).classList.remove('on'); }
      else return;
      renum();
      if (done.length === t.edges.length && !finished) {
        finished = true; mode = null; svg.classList.add('locked'); Sound.play('coin');
        msg.textContent = 'Вся граница обведена! Чему равен периметр?';
        setTimeout(() => MathFun.padStep($('#mfStep', body), 'P = [?] см', t.answer, svg), 250);
      }
    };
    const hitAt = (cx, cy) => { const el = document.elementFromPoint(cx, cy); return el && el.dataset && el.dataset.e && svg.contains(el) ? el.dataset.e : null; };
    svg.addEventListener('pointerdown', ev => {
      if (finished || L.answered) return;
      ev.preventDefault();
      const e = hitAt(ev.clientX, ev.clientY);
      mode = e ? !done.includes(e) : true;
      if (e) mark(e, mode);
      window.addEventListener('pointerup', () => { mode = null; }, { once: true });
    });
    svg.addEventListener('pointermove', ev => { if (mode === null || finished) return; const e = hitAt(ev.clientX, ev.clientY); if (e) mark(e, mode); });
    renum();
  },

  /* ============================================================
     ⏰ Часы: поставь стрелки пальцем
     ============================================================ */
  clockTask(d, mode) {
    if (mode === 'end') {
      const h = mr(7, 10), m1 = mr(0, 9) * 5, dur = mr(3, 10) * 5, t2 = h * 60 + m1 + dur, h2 = Math.floor(t2 / 60), m2 = t2 % 60;
      return {
        mf: 'clock', h: h2, m: m2, h0: h, m0: m1, tol: 10, answer: m2, label: `⏰ ${mfTime(h, m1)}+${dur}`,
        prompt: `⏰ Урок начался в <b>${mfTime(h, m1)}</b> и длился <b>${dur} мин</b>. Поставь стрелки на время, когда урок закончился`,
        explain: `${mfTime(h, m1)} + ${dur} мин = <b>${mfTime(h2, m2)}</b>.${h2 > h ? ` Длинная стрелка прошла через 12 — короткая перешла к ${h2}.` : ''}`,
        hint: 'Каждая цифра для длинной стрелки — 5 минут. Отсчитай минуты от начала урока.',
      };
    }
    const h = mr(1, 12), m = d === 1 ? 0 : d === 2 ? U.rnd([30, 15, 45, 30]) : mr(1, 11) * 5;
    return {
      mf: 'clock', h, m, h0: 12, m0: 0, tol: d === 1 ? 8 : 10, answer: m || h, label: '⏰ ' + mfTime(h, m),
      prompt: `⏰ Поставь стрелки: <b>${mfTime(h, m)}</b>`,
      explain: m === 0 ? `Длинная стрелка на 12, короткая на ${h} — ровно <b>${mfTime(h, m)}</b>.` : `Длинная стрелка — на ${m / 5} (это ${m} минут), короткая — ${m >= 30 ? `между ${h} и ${h % 12 + 1}` : `чуть дальше ${h}`}: <b>${mfTime(h, m)}</b>.`,
      hint: 'Короткая стрелка — часы, длинная (красная) — минуты. Каждая цифра для длинной стрелки — 5 минут.',
    };
  },
  clockHTML(t) {
    let ticks = '', nums = '';
    for (let i = 0; i < 60; i++) {
      const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = big ? 40 : 43;
      ticks += `<line x1="${(50 + r1 * Math.sin(a)).toFixed(1)}" y1="${(50 - r1 * Math.cos(a)).toFixed(1)}" x2="${(50 + 46 * Math.sin(a)).toFixed(1)}" y2="${(50 - 46 * Math.cos(a)).toFixed(1)}" stroke="#2B2350" stroke-width="${big ? 2 : 0.8}"/>`;
    }
    for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; nums += `<text x="${(50 + 33 * Math.sin(a)).toFixed(1)}" y="${(50 - 33 * Math.cos(a)).toFixed(1)}" font-size="9" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#2B2350">${i}</text>`; }
    return `<div class="mf mfk"><svg class="mfk-clock" id="mfClock" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff" stroke="#7C5CFF" stroke-width="3"/>${ticks}${nums}
      <g id="mfGood"></g>
      <line id="mfH" class="mfk-h" x1="50" y1="50" x2="50" y2="27" stroke="#2B2350" stroke-width="5" stroke-linecap="round"/>
      <line id="mfM" class="mfk-m" x1="50" y1="50" x2="50" y2="12" stroke="#FF7A59" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="3.8" fill="#2B2350"/></svg>
      <div class="mfk-side"><div class="mf-msg" id="mfMsg">Двигай пальцем стрелки:<br><b>короткая</b> — часы, <b class="red">длинная</b> — минуты</div>
      <button class="btn primary" id="mfOk">Готово</button></div></div>`;
  },
  clockBind(t, body) {
    const svg = $('#mfClock', body), H = $('#mfH', body), M = $('#mfM', body);
    const st = { h: ((t.h0 % 12) + t.m0 / 60) * 30, m: t.m0 * 6 };
    const diff = (a, b) => { const x = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(x, 360 - x); };
    const draw = () => { H.setAttribute('transform', `rotate(${st.h} 50 50)`); M.setAttribute('transform', `rotate(${st.m} 50 50)`); };
    draw();
    let grab = null;
    const pos = ev => { const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 100 - 50, y = (ev.clientY - r.top) / r.height * 100 - 50; return { a: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360, r: Math.hypot(x, y) }; };
    svg.addEventListener('pointerdown', ev => {
      if (L.answered) return;
      ev.preventDefault();
      const p = pos(ev), dh = diff(p.a, st.h), dm = diff(p.a, st.m);
      grab = dh < 25 && dm < 25 ? (p.r < 27 ? 'h' : 'm') : dh < dm ? 'h' : 'm';
      (grab === 'h' ? H : M).classList.add('grab');
      window.addEventListener('pointerup', () => { H.classList.remove('grab'); M.classList.remove('grab'); grab = null; }, { once: true });
      move(ev);
    });
    const move = ev => {
      if (!grab) return;
      const p = pos(ev);
      if (grab === 'm') { const v = Math.round(p.a / 30) * 30 % 360; if (v !== st.m) { st.m = v; Sound.play('tap'); } }
      else st.h = Math.round(p.a / 2.5) * 2.5 % 360;
      draw();
    };
    svg.addEventListener('pointermove', move);
    $('#mfOk', body).addEventListener('click', () => {
      if (L.answered) return;
      const th = ((t.h % 12) + t.m / 60) * 30, tm = t.m * 6;
      const ok = diff(st.m, tm) < 1 && diff(st.h, th) <= t.tol;
      if (!ok) {
        $('#mfGood', body).innerHTML = `<line x1="50" y1="50" x2="50" y2="27" stroke="#22C55E" stroke-width="5" stroke-linecap="round" opacity=".55" transform="rotate(${th} 50 50)"/><line x1="50" y1="50" x2="50" y2="12" stroke="#22C55E" stroke-width="3" stroke-linecap="round" opacity=".55" transform="rotate(${tm} 50 50)"/>`;
        $('#mfMsg', body).innerHTML = 'Зелёные стрелки — как нужно было';
      }
      MathFun.done(ok);
    });
  },

  /* ============================================================
     ⚖️ Весы: уравновесь гирьками (масса, неизвестное слагаемое, уравнение)
     ============================================================ */
  scaleTask(d, mode) {
    if (mode === 'mass') {
      let g, tray, obj;
      if (d === 1) { g = mr(1, 3) * 1000; tray = [500, 200, 100]; obj = U.rnd(MF_FRUIT); }
      else if (d === 2) { g = mr(1, 3) * 1000 + mr(1, 9) * 100; tray = [1000, 500, 200, 100]; obj = U.rnd(MF_FRUIT); }
      else { g = Math.random() < 0.5 ? mr(1, 2) * 1000 + mr(1, 19) * 50 : mr(3, 19) * 50; tray = [1000, 500, 200, 100, 50]; obj = U.rnd(g >= 1000 ? MF_FRUIT : MF_SMALL); }
      return {
        mf: 'scale', left: [{ t: obj[0], w: g, lab: mfMass(g) }], tray, to: 'R', unit: 'g', answer: g, label: `⚖️ ${obj[1]} ${mfMass(g)}`,
        prompt: `⚖️ ${obj[1]} — <b>${mfMass(g)}</b>. Уравновесь весы гирьками`,
        explain: `${mfMass(g)} = <b>${g} г</b>${g >= 1000 ? ' (1 кг = 1000 г)' : ''}. Например: ${MathFun.split(g, tray).map(mfMass).join(' + ')}.`,
        hint: '1 кг = 1000 г. Две гирьки по 500 г весят столько же, сколько 1 кг.',
      };
    }
    let a, x, txt;
    if (d === 1) { x = mr(2, 9); a = mr(2, 9); }
    else { a = mr(10, 40); x = mr(5, 39); }
    const first = Math.random() < 0.5;
    const X = mode === 'eq' ? 'x' : '?';
    txt = first ? `${X} + ${a} = ${a + x}` : `${a} + ${X} = ${a + x}`;
    const box = { t: '🎁', w: x, lab: X, box: true }, wa = { w: a, lab: String(a) };
    return {
      mf: 'scale', left: first ? [box, wa] : [wa, box], right: [{ w: a + x, lab: String(a + x) }], tray: [1, 2, 5, 10, 20], to: 'L', unit: '', answer: x,
      label: `⚖️ ${txt}`, eq0: txt,
      prompt: '⚖️ Сколько весит 🎁? Сними коробку и уравновесь весы гирьками',
      explain: `${X === 'x' ? 'x' : 'Неизвестное слагаемое'} = ${a + x} − ${a} = <b>${x}</b>. Проверка: ${first ? `${x} + ${a}` : `${a} + ${x}`} = ${a + x}.`,
      hint: `На правой чаше ${a + x}, рядом с коробкой ${a}. Сколько не хватает до ${a + x}?`,
    };
  },
  digits(n) { const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10; return [h ? h + ' сот.' : '', t || h ? t + ' дес.' : '', u + ' ед.'].filter(Boolean).join(' '); },
  split(g, tray) { const out = []; for (const w of tray) while (g >= w) { out.push(w); g -= w; } return out; },
  scaleHTML(t) {
    const wlab = w => t.unit === 'g' ? mfMass(w) : String(w);
    return `<div class="mf mfs">${t.eq0 ? `<div class="eq mf-eq0">${t.eq0}</div>` : ''}
      <div class="mfs-stage"><div class="mfs-beam" id="mfBeam"></div><div class="mfs-post"></div>
        <div class="mfs-pan L" id="mfPanL"><div class="mfs-in"></div><i class="mfs-dish"></i></div>
        <div class="mfs-pan R" id="mfPanR"><div class="mfs-in"></div><i class="mfs-dish"></i></div></div>
      <div class="mf-msg" id="mfMsg">${t.to === 'L' ? 'Нажми на коробку 🎁, чтобы снять её' : 'Нажимай на гирьки (или перетаскивай на чашу). Гирьку на чаше можно убрать нажатием'}</div>
      <div class="mfs-tray" id="mfTray">${t.tray.map(w => `<button class="mfs-w${w >= 1000 ? ' big' : w <= 2 ? ' tiny' : ''}" data-w="${w}"><span>${wlab(w)}</span></button>`).join('')}</div></div>`;
  },
  scaleBind(t, body) {
    const wlab = w => t.unit === 'g' ? mfMass(w) : String(w);
    const side = { L: t.left.map(x => Object.assign({}, x)), R: (t.right || []).map(x => Object.assign({}, x)) };
    const added = { L: [], R: [] }, panL = $('#mfPanL', body), panR = $('#mfPanR', body), beam = $('#mfBeam', body), msg = $('#mfMsg', body), tray = $('#mfTray', body);
    let boxOff = t.to !== 'L', finished = false;
    if (!boxOff) tray.classList.add('off');
    const sum = s => side[s].reduce((a, x) => a + x.w, 0) + added[s].reduce((a, w) => a + w, 0);
    const item = (x, k, s, mine) => x.t ? `<span class="mfs-obj${x.box ? ' box' : ''}" ${x.box ? 'data-box="1"' : ''}>${x.t}<small>${x.lab}</small></span>`
      : `<span class="mfs-w on${x.w >= 1000 ? ' big' : x.w <= 2 ? ' tiny' : ''}" ${mine ? `data-k="${k}" data-s="${s}"` : ''}><span>${x.lab || wlab(x.w)}</span></span>`;
    const draw = () => {
      ['L', 'R'].forEach(s => {
        $('.mfs-in', s === 'L' ? panL : panR).innerHTML = side[s].map(x => item(x)).join('') + added[s].map((w, k) => item({ w }, k, s, true)).join('');
      });
      const l = sum('L'), r = sum('R'), df = r - l;
      let a = df ? Math.max(-14, Math.min(14, df / Math.max(l, r, 1) * 30)) : 0;
      if (df && Math.abs(a) < 4) a = Math.sign(df) * 4;
      beam.style.transform = `rotate(${a}deg)`;
      const dy = Math.sin(a * Math.PI / 180) * (beam.offsetWidth / 2);
      panL.style.transform = `translateY(${-dy}px)`; panR.style.transform = `translateY(${dy}px)`;
      if (!df && boxOff && !finished && added[t.to].length) {
        finished = true; tray.classList.add('off');
        msg.innerHTML = '⚖️ <b>Равновесие!</b>'; msg.className = 'mf-msg good'; Sound.play('coin');
        setTimeout(() => MathFun.done(true), 700);
      }
    };
    draw();
    const add = w => {
      if (finished || L.answered) return;
      if (!boxOff) { msg.textContent = 'Сначала сними коробку 🎁 — нажми на неё'; MathFun.shake(msg); return; }
      if (added[t.to].length >= 16) { MathFun.shake(tray); return; }
      added[t.to].push(w); added[t.to].sort((a, b) => b - a); Sound.play('pop'); draw();
    };
    $$('.mfs-w', tray).forEach(b => RuFun.dragable(b, tg => { if (tg && tg.closest('.mfs-pan')) add(+b.dataset.w); }, () => add(+b.dataset.w)));
    [panL, panR].forEach(p => p.addEventListener('click', e => {
      if (finished || L.answered) return;
      if (e.target.closest('[data-box]')) {
        side.L = side.L.filter(x => !x.box); boxOff = true; tray.classList.remove('off');
        msg.textContent = 'Теперь положи гирьки на левую чашу вместо коробки'; Sound.play('pop'); draw(); return;
      }
      const w = e.target.closest('[data-k]'); if (!w) return;
      added[w.dataset.s].splice(+w.dataset.k, 1); Sound.play('tap'); draw();
    }));
  },

  /* ============================================================
     💬 Задача-комикс: картинка → схема из кусочков → действие → ответ
     ============================================================ */
  comicTask(d) {
    const [k1, k2] = U.sample(KIDS, 2), kid = k => (MF_GIRLS.includes(k[0]) ? '👧' : '👦');
    let w = U.rnd(COUNTABLE), type, a, b, story, rows, slots, op, eqs, ans, panels;
    type = d === 1 ? U.rnd(['sum', 'rest']) : d === 2 ? U.rnd(['more', 'less', 'diff']) : U.rnd(['mul', 'div']);
    if (type === 'mul' || type === 'div') w = U.rnd(MASC);
    const em = MF_EMO[w] || '⭐';
    const heap = n => n <= 10 ? `<span class="mfm-heap">${em.repeat(n)}</span>` : `<span class="mfm-heap">${em}<b>× ${n}</b></span>`;
    if (type === 'sum') {
      a = notOne(4, 30); b = notOne(3, 20);
      story = `У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} — ${nw(b, w)}. Сколько ${many(w)} у них вместе?`;
      panels = [[kid(k1) + ' ' + k1[0], heap(a)], [kid(k2) + ' ' + k2[0], heap(b)], ['❓ Вместе', '?']];
      rows = [{ segs: [{ v: a, s: 'A', cap: k1[0] }, { v: b, s: 'B', cap: k2[0] }], brace: 'Q', bcap: 'вместе' }];
      slots = { A: a, B: b, Q: '?' }; op = '+'; eqs = `${a} + ${b}`; ans = a + b;
    } else if (type === 'rest') {
      a = notOne(10, 40); b = notOne(2, a - 2);
      story = `В коробке было ${nw(a, w)}. Из коробки взяли ${nw(b, w)}. Сколько ${many(w)} осталось?`;
      panels = [['📦 Было', heap(a)], ['🤚 Взяли', heap(b)], ['❓ Осталось', '?']];
      rows = [{ segs: [{ v: b, s: 'B', cap: 'взяли', cls: 'gone' }, { v: a - b, s: 'Q', cap: 'осталось' }], brace: 'A', bcap: 'было' }];
      slots = { A: a, B: b, Q: '?' }; op = '−'; eqs = `${a} − ${b}`; ans = a - b;
    } else if (type === 'more' || type === 'less') {
      a = notOne(10, 50); b = notOne(2, 9);
      const more = type === 'more';
      story = `У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} на ${nw(b, w)} ${more ? 'больше' : 'меньше'}. Сколько ${many(w)} у ${k2[1]}?`;
      panels = [[kid(k1) + ' ' + k1[0], heap(a)], [kid(k2) + ' ' + k2[0], `<span class="mfm-heap">${more ? '➕' : '➖'}<b>${b}</b></span>`], ['❓ У ' + k2[1], '?']];
      rows = more
        ? [{ label: k1[0], segs: [{ v: a, s: 'A' }] }, { label: k2[0], segs: [{ v: a, t: '' }, { v: b, s: 'B', cls: 'extra', cap: 'больше' }], brace: 'Q' }]
        : [{ label: k1[0], segs: [{ v: a - b, t: '' }, { v: b, s: 'B', cls: 'extra', cap: 'меньше' }], brace: 'A' }, { label: k2[0], segs: [{ v: a - b, s: 'Q' }] }];
      slots = { A: a, B: b, Q: '?' }; op = more ? '+' : '−'; eqs = `${a} ${op} ${b}`; ans = more ? a + b : a - b;
    } else if (type === 'diff') {
      a = notOne(10, 50); b = notOne(2, a - 3);
      story = `У ${k1[1]} ${nw(a, w)}, а у ${k2[1]} — ${nw(b, w)}. На сколько ${many(w)} у ${k1[1]} больше, чем у ${k2[1]}?`;
      panels = [[kid(k1) + ' ' + k1[0], heap(a)], [kid(k2) + ' ' + k2[0], heap(b)], ['❓ На сколько больше?', '?']];
      rows = [{ label: k1[0], segs: [{ v: b, t: '' }, { v: a - b, s: 'Q', cls: 'extra', cap: 'на сколько?' }], brace: 'A' }, { label: k2[0], segs: [{ v: b, s: 'B' }] }];
      slots = { A: a, B: b, Q: '?' }; op = '−'; eqs = `${a} − ${b}`; ans = a - b;
    } else if (type === 'mul') {
      do { a = mr(2, 9); b = mr(2, 6); } while (a === b);   // a — в одной коробке, b — коробок
      story = `В одной коробке ${nw(a, w)}. Сколько ${many(w)} в ${b} таких коробках?`;
      panels = [['📦 В одной', heap(a)], ['📦 Коробок', `<span class="mfm-heap">${'📦'.repeat(b)}</span>`], ['❓ Всего', '?']];
      rows = [{ label: 'коробки', segs: Array.from({ length: b }, (_, k) => k ? { v: 1, t: '', cls: 'same' } : { v: 1, s: 'A' }), brace: 'Q', bcap: 'всего' }];
      slots = { A: a, Q: '?' }; op = '·'; eqs = `${a} · ${b}`; ans = a * b;
    } else {
      b = mr(2, 6); ans = mr(2, 9); a = ans * b;
      story = `${U.cap(nw(a, w))} разложили поровну в ${nw(b, 'пакет')}. Сколько ${many(w)} в каждом пакете?`;
      panels = [['Всего', heap(a)], ['👜 Пакетов', `<span class="mfm-heap">${'👜'.repeat(b)}</span>`], ['❓ В каждом', '?']];
      rows = [{ label: 'пакеты', segs: Array.from({ length: b }, (_, k) => k ? { v: 1, t: '', cls: 'same' } : { v: 1, s: 'Q', cap: 'в одном' }), brace: 'A', bcap: 'всего' }];
      slots = { A: a, Q: '?' }; op = ':'; eqs = `${a} : ${b}`;
    }
    return {
      mf: 'comic', story, panels, rows, slots, op, ops: d === 3 ? ['+', '−', '·', ':'] : ['+', '−'], eqs, answer: ans,
      label: `💬 ${eqs}`, prompt: '💬 ' + story,
      explain: `${{ '+': 'Складываем', '−': 'Вычитаем', '·': 'Умножаем', ':': 'Делим' }[op]}: ${eqs} = <b>${ans}</b>.`,
      hint: { sum: '«Вместе» — складываем.', rest: '«Взяли» — стало меньше, вычитаем.', more: '«На … больше» — прибавляем.', less: '«На … меньше» — вычитаем.', diff: 'Чтобы узнать, на сколько больше, из большего вычитаем меньшее.', mul: 'По одинаковому числу несколько раз — умножаем.', div: 'Поровну — делим.' }[type],
    };
  },
  comicHTML(t) {
    const seg = s => `<div class="mfm-seg ${s.cls || ''}" style="flex:${s.v}">${s.s ? `<button class="mfm-slot" data-slot="${s.s}"></button>` : s.t || ''}${s.cap ? `<small>${s.cap}</small>` : ''}</div>`;
    const rows = t.rows.map(r => `<div class="mfm-row${r.segs.some(x => x.cap) ? ' capt' : ''}">${r.label ? `<span class="mfm-l">${r.label}</span>` : ''}<div class="mfm-tr">${r.brace ? `<div class="mfm-brace">${r.bcap ? `<small>${r.bcap}</small>` : ''}<button class="mfm-slot" data-slot="${r.brace}"></button></div>` : ''}<div class="mfm-segs">${r.segs.map(seg).join('')}</div></div></div>`).join('');
    const pieces = U.shuffle(Object.values(t.slots).map(String));
    return `<div class="mf mfm"><div class="mfm-panels">${t.panels.map(p => `<div class="mfm-p"><b>${p[0]}</b>${p[1] === '?' ? '<span class="mfm-q">?</span>' : p[1]}</div>`).join('')}</div>
      <div class="mfm-scheme" id="mfScheme">${rows}</div>
      <div id="mfStep"><div class="mfm-pieces"><span class="mfm-step">Шаг 1 из 3: перенеси в схему</span>${pieces.map((p, k) => `<button class="s-item mfm-pc" data-v="${U.esc(p)}" data-k="${k}">${U.esc(p)}</button>`).join('')}</div></div>
      <div class="mf-msg" id="mfMsg"></div></div>`;
  },
  comicBind(t, body) {
    let err = false, sel = null, left = Object.keys(t.slots).length;
    const step = $('#mfStep', body), msg = $('#mfMsg', body);
    const pcs = $$('.mfm-pc', body);
    MathFun.reveal(step);
    const put = (pc, slot) => {
      if (L.answered || pc.classList.contains('placed') || slot.classList.contains('full')) return;
      if (String(t.slots[slot.dataset.slot]) === pc.dataset.v) {
        slot.textContent = pc.dataset.v; slot.classList.add('full'); pc.classList.add('placed'); pc.disabled = true;
        const segs = slot.closest('.mfm-segs'); if (segs) $$('.mfm-seg.same', segs).forEach(x => { x.textContent = pc.dataset.v; });
        Sound.play('coin'); left--;
        if (!left) setTimeout(chooseOp, 350);
      } else { err = true; Sound.play('wrong'); MathFun.shake(slot); pc.classList.add('miss'); }
      sel = null; pcs.forEach(x => x.classList.remove('sel'));
    };
    pcs.forEach(pc => RuFun.dragable(pc, tg => { const s = tg && tg.closest('.mfm-slot'); if (s) put(pc, s); },
      () => { sel = pc; pcs.forEach(x => x.classList.toggle('sel', x === pc)); Sound.play('tap'); }));
    $$('.mfm-slot', body).forEach(s => s.addEventListener('click', () => { if (sel) put(sel, s); }));
    const chooseOp = () => {
      if (L.answered) return;
      step.innerHTML = `<div class="mfm-step">Шаг 2 из 3: какое действие нужно?</div><div class="mfm-ops">${t.ops.map(o => `<button class="opt mfm-op" data-o="${o}">${o}</button>`).join('')}</div>`;
      MathFun.reveal(step);
      $$('.mfm-op', step).forEach(b => b.addEventListener('click', () => {
        if (L.answered || b.disabled) return;
        if (b.dataset.o === t.op) { b.classList.add('right'); Sound.play('coin'); setTimeout(count, 350); }
        else { err = true; b.disabled = true; b.classList.add('wrong'); Sound.play('wrong'); }
      }));
    };
    const count = () => {
      if (L.answered) return;
      MathFun.padStep(step, `${t.eqs} = [?]`, t.answer, null, ok => {
        if (ok && err) msg.textContent = 'Ответ верный! Но в схеме или в действии была ошибка — такую задачу повторим ещё раз';
        return ok && !err;
      }, 'Шаг 3 из 3: посчитай');
    };
  },

  /* ---------- Общие кусочки ---------- */
  /* Маленькая клавиатура внутри задания: пример с окошком [?] и цифры */
  padStep(box, eqs, ans, lockEl, judge, title) {
    box.innerHTML = `${title ? `<div class="mfm-step">${title}</div>` : ''}<div class="eq mf-eq">${eqs.replace('[?]', '<span class="inbox" id="mfIn"></span>')}</div>
      <div class="mf-pad">${'1234567890'.split('').map(k => `<button data-k="${k}">${k}</button>`).join('')}<button data-k="del" class="kdel" aria-label="Стереть">⌫</button><button data-k="ok" class="kok" disabled aria-label="Проверить">✓</button></div>`;
    if (lockEl) lockEl.classList.add('locked', 'mf-small');
    MathFun.reveal(box);
    let typed = '';
    const inb = $('#mfIn', box), okb = $('[data-k="ok"]', box);
    $$('.mf-pad button', box).forEach(b => b.addEventListener('click', () => {
      if (L.answered) return;
      const k = b.dataset.k;
      if (k === 'del') typed = typed.slice(0, -1);
      else if (k === 'ok') {
        if (!typed) return;
        let ok = Number(typed) === Number(ans);
        inb.classList.add(ok ? 'ok' : 'bad');
        if (!ok) inb.insertAdjacentHTML('afterend', `<span class="inbox fixd">${ans}</span>`);
        if (judge) ok = judge(ok);
        $$('.mf-pad button', box).forEach(x => { x.disabled = true; });
        MathFun.done(ok); return;
      } else if (typed.length < 4) typed += k;
      inb.textContent = typed; okb.disabled = !typed; Sound.play('tap');
    }));
  },
  /* Прокрутить урок, чтобы новый шаг не прятался под кнопкой «Подсказка» */
  reveal(el) {
    setTimeout(() => {
      const b = $('#lBody'), foot = $('#lFoot'); if (!b || !el.isConnected) return;
      const lim = (foot ? foot.getBoundingClientRect().top : innerHeight) - 6, r = el.getBoundingClientRect();
      if (r.bottom > lim) b.scrollBy({ top: Math.min(r.bottom - lim, r.top - b.getBoundingClientRect().top), behavior: 'smooth' });
    }, 380);
  },
  shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); },
  done(ok) { if (!L || L.answered) return; answer(ok ? 'ok' : 'bad'); },

  /* ---------- Отрисовка и привязка ---------- */
  html(t) { const f = MathFun[t.mf + 'HTML']; return f ? f.call(MathFun, t) : ''; },
  bind(t, body) { const f = MathFun[t.mf + 'Bind']; if (f) f.call(MathFun, t, body); },
};
