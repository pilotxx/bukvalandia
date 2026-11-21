'use strict';
/* Задание «Выбери все верные» (v16; идея из версии Codex, сделано заново).
   Четыре карточки, верных среди них 1, 2 или 3 — число заранее не угадать.
   Задания строятся из материала самого мира: слова с пропуском (русский),
   равенства по уровню мира (математика), переводы слов мира (английский).
   Пока используется в бою с боссом: примерно каждое пятое задание. */
const Multi = {
  KINDS: ['multi'],

  /* Сколько верных карточек из четырёх */
  nRight: () => U.rnd([1, 2, 2, 3]),

  /* Собрать задание: items — [{ label, ok }] */
  build(prompt, items, explain, hint) {
    return {
      kind: 'multi', prompt, explain, hint: hint || 'Верных может быть одна, две или три карточки. Проверь каждую.',
      items: U.shuffle(items.map((x, i) => ({ id: i, label: x.label, ok: !!x.ok }))),
      label: 'multi:' + items.map(x => x.label).join('|'),
    };
  },

  /* Задание для мира w; null — если в этом мире подходящего материала нет */
  make(w) {
    try {
      const f = { ru: Multi.ru, math: Multi.math, en: Multi.en }[w.subject.id];
      return f ? f(w) : null;
    } catch (e) { console.error('Ошибка задания «выбери все»', e); return null; }
  },

  /* Несколько заданий мира (без игровых превращений), чтобы взять из них слова */
  sample(w, n) {
    const out = [];
    for (let k = 0; k < n * 3 && out.length < n; k++) {
      const les = U.rnd(w.lessons);
      try { const t = les.make(les.bank[Math.floor(Math.random() * les.bank.length)]); if (t) out.push(t); } catch (e) { /* пропускаем */ }
    }
    return out;
  },

  /* Русский: слова с пропуском → «Выбери слова, написанные без ошибок» */
  ru(w) {
    const gaps = Multi.sample(w, 24).filter(t => t.word && t.options && t.options.length >= 2);
    /* все верные слова уроков мира: неверный вариант не должен совпасть с настоящим словом (луг → лук) */
    const real = new Set();
    w.lessons.forEach(les => les.bank.forEach(b => {
      try { const t = les.make(b); if (t && t.word) real.add((t.word.before + (t.word.fill || '') + t.word.after).toLowerCase()); } catch (e) { /* пропускаем */ }
    }));
    const seen = new Set(), words = [];
    for (const t of gaps) {
      const full = t.word.before + (t.word.fill || '') + t.word.after;
      if (seen.has(full)) continue; seen.add(full);
      const bad = t.options.map(o => o.v).filter(v => v !== t.answer);
      if (!bad.length) continue;
      const wv = U.rnd(bad);
      const wrong = t.word.before + (wv === '-' ? '' : wv) + t.word.after;
      if (wrong === full || real.has(wrong.toLowerCase()) || words.some(x => x.wrong === wrong || x.full === wrong)) continue;
      words.push({ full, wrong });
      if (words.length >= 4) break;
    }
    if (words.length < 4) return null;
    const k = Multi.nRight();
    const items = words.map((x, i) => i < k ? { label: x.full, ok: true } : { label: x.wrong, ok: false });
    return Multi.build('Выбери <b>все</b> слова, написанные без ошибок', items,
      words.map((x, i) => i < k ? '✅ ' + U.esc(x.full) : '❌ ' + U.esc(x.wrong) + ' — неверно, пишем <b>' + U.esc(x.full) + '</b>').join('; ') + '.', 'Проверь каждое слово по правилу этого мира. Верных может быть 1, 2 или 3.');
  },

  /* Математика: «Выбери все верные равенства», трудность — по номеру мира */
  math(w) {
    const wi = w.wi || 0, k = Multi.nRight(), items = [], used = new Set();
    const one = () => {
      let a, b, op, r;
      if (wi <= 1) { a = mr(3, 9); b = mr(2, 9); op = U.rnd(['+', '−']); if (op === '−' && b > a) [a, b] = [b, a]; }
      else if (wi <= 3) { a = mr(12, 89); b = mr(3, 9); op = U.rnd(['+', '−']); }
      else if (wi <= 6) { a = mr(2, 9); b = mr(2, 9); op = U.rnd(['·', ':']); if (op === ':') a = a * b; }
      else { a = mr(1, 9) * 100 + mr(1, 9) * 10; b = mr(1, 5) * 100 + mr(0, 9) * 10; op = U.rnd(['+', '−']); if (op === '+' && a + b > 990) op = '−'; if (op === '−' && b > a) [a, b] = [b, a]; }
      r =op === '+' ? a + b : op === '−' ? a - b : op === '·' ? a * b : a / b;
      return { a, b, op, r };
    };
    for (let i = 0, guard = 0; items.length < 4 && guard < 40; guard++) {
      const q = one(), key = q.a + q.op + q.b;
      if (used.has(key)) continue; used.add(key);
      const ok = items.length < k;
      let r = q.r;
      if (!ok) {
        const d = wi <= 1 ? U.rnd([1, -1, 2]) : wi <= 3 ? U.rnd([1, -1, 10, -10]) : wi <= 6 ? U.rnd([1, -1, q.op === '·' ? q.a : 1]) : U.rnd([10, -10, 100, -100]);
        r = q.r + d; if (r < 0 || r === q.r) r = q.r + 1;
      }
      items.push({ label: `${q.a} ${q.op} ${q.b} = ${r}`, ok, right: `${q.a} ${q.op} ${q.b} = ${q.r}` });
      i++;
    }
    if (items.length < 4) return null;
    const t = Multi.build('Питомец решал примеры. Выбери <b>все</b> верные равенства', items,
      'Проверка: ' + items.map(x => x.ok ? '✅ ' + x.right : '❌ ' + x.label + ' — неверно, ' + x.right).join('; ') + '.', 'Реши каждый пример сам и сравни ответ. Верных может быть 1, 2 или 3.');
    return t;
  },

  /* Английский: «Выбери все верные переводы» — слова из уроков этого мира */
  en(w) {
    const lat = s => /^[A-Za-z][A-Za-z '\-]*$/.test(s), cyr = s => /[А-Яа-яЁё]/.test(s);
    const pairs = new Map();
    Multi.sample(w, 24).forEach(t => (t.options || []).forEach(o => {
      if (lat(String(o.v)) && o.label && cyr(String(o.label)) && !pairs.has(o.v)) pairs.set(o.v, String(o.label));
    }));
    let list = [...pairs.entries()];
    if (list.length < 5) {                       // в мире мало слов — берём общий словарь
      list = Object.values(V).flat().map(x => [x[0], x[1]]);
    }
    list = U.shuffle(list);
    const pick = list.slice(0, 4), k = Multi.nRight();
    if (pick.length < 4) return null;
    const ru = pick.map(p => p[1]);
    const items = pick.map((p, i) => {
      if (i < k) return { label: `${p[0]} — ${p[1]}`, ok: true, right: `${p[0]} — ${p[1]}` };
      /* неверная пара: перевод от другого слова этой же четвёрки */
      const other = ru[(i + 1) % 4] !== p[1] ? ru[(i + 1) % 4] : ru[(i + 2) % 4];
      return { label: `${p[0]} — ${other}`, ok: false, right: `${p[0]} — ${p[1]}` };
    });
    return Multi.build('Выбери <b>все</b> верные переводы', items,
      items.map(x => x.ok ? '✅ ' + U.esc(x.right) : '❌ ' + U.esc(x.label) + ' — неверно, ' + U.esc(x.right)).join('; ') + '.', 'Прочитай английское слово и вспомни, что оно значит. Верных может быть 1, 2 или 3.');
  },

  /* ---------- Показ и проверка ---------- */
  html(t) {
    return `<div class="multi-hint">Нажми на все верные карточки, потом «Проверить»</div>
      <div class="multi-grid">${t.items.map(x => `<button class="multi-card" data-mi="${x.id}">${U.esc(x.label)}</button>`).join('')}</div>
      <button class="btn primary multi-check" id="multiCheck" disabled>Проверить</button>`;
  },
  bind(t, body) {
    const cards = $$('.multi-card', body), check = $('#multiCheck', body);
    cards.forEach(c => c.addEventListener('click', () => {
      if (L.answered) return;
      c.classList.toggle('on'); Sound.play('tap');
      check.disabled = !cards.some(x => x.classList.contains('on'));
    }));
    check.addEventListener('click', () => {
      if (L.answered) return;
      let ok = true;
      cards.forEach(c => {
        const it = t.items.find(x => String(x.id) === c.dataset.mi), on = c.classList.contains('on');
        c.disabled = true;
        if (it.ok && on) c.classList.add('right');
        else if (!it.ok && on) { c.classList.add('wrong'); ok = false; }
        else if (it.ok && !on) { c.classList.add('miss'); ok = false; }
      });
      check.disabled = true;
      answer(ok ? 'ok' : 'bad');
    });
  },
};
