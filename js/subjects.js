'use strict';
/* ============================================================
   Предметы и общие индексы. Чтобы добавить предмет — допишите его сюда.
   id уроков и миров не меняйте: к ним привязан прогресс ребёнка.
   ============================================================ */
const SUBJECTS = [
  { id: 'ru', name: 'Русский', icon: '📖', land: 'Букваландия', worlds: WORLDS },
  { id: 'math', name: 'Математика', icon: '🔢', land: 'Числоград', worlds: MATH_WORLDS },
];
const SUBJ = {};
const ALL_WORLDS = [];
const WORLD_BY_ID = {};
const LESSONS = {};
SUBJECTS.forEach(s => {
  SUBJ[s.id] = s;
  s.worlds.forEach((w, wi) => {
    w.subject = s; w.wi = wi;
    ALL_WORLDS.push(w); WORLD_BY_ID[w.id] = w;
    w.lessons.forEach((l, li) => { l.world = w; l.subject = s; l.wi = wi; l.li = li; LESSONS[l.id] = l; });
  });
  s.total = s.worlds.reduce((a, w) => a + w.lessons.length * 3 + 3, 0);
});
const TOTAL_STARS = SUBJECTS.reduce((a, s) => a + s.total, 0);
