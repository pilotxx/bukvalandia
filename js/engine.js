'use strict';
/* ============================================================
   Букваландия — общие утилиты и конструкторы заданий
   ============================================================ */

const VOWELS = 'аоуыэеёюяи';
const ALPHABET = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split('');

const U = {
  rnd: a => a[Math.floor(Math.random() * a.length)],
  shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  sample: (a, n) => U.shuffle(a).slice(0, n),
  plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  },
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  cap: s => s.charAt(0).toUpperCase() + s.slice(1),
  isV: ch => !!ch && VOWELS.includes(ch.toLowerCase()),
  hasV: s => [...s.toLowerCase()].some(c => VOWELS.includes(c)),
  vowelCount: w => [...w.toLowerCase()].filter(c => VOWELS.includes(c)).length,
  /* «корОва» -> «коро́ва» (заглавная гласная = ударная) */
  accent: w => w.replace(/[АОУЫЭЕЁЮЯИ]/g, c => c === 'Ё' ? 'ё' : c.toLowerCase() + '́'),
  dayKey(d = new Date()) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  weekKey(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-W' + Math.ceil(((t - y0) / 86400000 + 1) / 7);
  },
  hash(str) {
    let h = 2166136261;
    for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },
  seeded(seed) {
    let s = seed || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  },
};

/* Разбор записи пропуска: «ж[и|ы]раф::примечание».
   Первый вариант в скобках — правильный, «-» означает «ничего не пишем». */
function parseGap(s) {
  let note = '';
  const k = s.indexOf('::');
  if (k >= 0) { note = s.slice(k + 2); s = s.slice(0, k); }
  const m = s.match(/^(.*)\[([^\]]*)\](.*)$/);
  const opts = m[2].split('|');
  const ans = opts[0];
  return { before: m[1], after: m[3], answer: ans, opts, note, full: m[1] + (ans === '-' ? '' : ans) + m[3] };
}

const opt = (v, label) => ({ v, label: label == null ? v : label });

const T = {
  /* Выбор из вариантов */
  choice(prompt, options, answer, extra = {}) {
    const list = options.map(o => typeof o === 'object' ? o : opt(o));
    return Object.assign({ kind: 'choice', prompt, options: extra.keepOrder ? list : U.shuffle(list), answer }, extra);
  },
  /* Слово с пропуском */
  gap(str, prompt, cfg = {}) {
    const g = parseGap(str);
    const label = v => v === '-' ? (cfg.none || 'ничего') : v;
    const sorted = g.opts.slice().sort((a, b) => a === '-' ? 1 : b === '-' ? -1 : a.localeCompare(b, 'ru'));
    return {
      kind: 'choice', prompt,
      word: { before: g.before, after: g.after, fill: g.answer === '-' ? '' : g.answer },
      options: sorted.map(v => opt(v, label(v))),
      answer: g.answer,
      explain: cfg.explain ? cfg.explain(g) : g.note,
      label: g.full,
    };
  },
};

/* ---------- Перенос слов: школьные правила ---------- */
const HY = {
  /* Причина, по которой разрыв в позиции i неверен (или null, если всё правильно) */
  invalid(w, i) {
    const a = w.slice(0, i), b = w.slice(i);
    if (a.length < 2 || b.length < 2) return 'Нельзя оставлять или переносить одну букву.';
    if (!U.hasV(a) || !U.hasV(b)) return 'В каждой части должна быть гласная.';
    if ('ьъй'.includes(b[0])) return `Букву ${b[0].toUpperCase()} нельзя отрывать от предыдущей буквы.`;
    const la = a[a.length - 1];
    if (U.isV(b[0]) && !U.isV(la) && !'йьъ'.includes(la)) return 'Переносим по слогам: согласную нельзя отрывать от следующей гласной.';
    if (b.length >= 2 && b[0] === b[1] && !U.isV(b[0])) return 'Двойные согласные при переносе разделяются.';
    if (a.length >= 2 && la === a[a.length - 2] && !U.isV(la)) return 'Двойные согласные при переносе разделяются.';
    return null;
  },
  valid(w) { const r = []; for (let i = 1; i < w.length; i++) if (!HY.invalid(w, i)) r.push(i); return r; },
  wrong(w) { const r = []; for (let i = 1; i < w.length; i++) if (HY.invalid(w, i)) r.push(i); return r; },
  best(w) {
    const v = HY.valid(w);
    if (!v.length) return null;
    const mid = w.length / 2;
    const score = i => {
      const la = w[i - 1], fb = w[i];
      let s = Math.abs(i - mid);
      if ('йь'.includes(la) || la === fb) s -= 3;
      else if (!U.isV(la) && !U.isV(fb)) s -= 0.6;   /* кош-ка: делим стечение согласных */
      return s;
    };
    return v.sort((x, y) => score(x) - score(y))[0];
  },
  show: (w, i) => w.slice(0, i) + '-' + w.slice(i),
};
