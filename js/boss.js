'use strict';
/* ============================================================
   Бой с боссом: арена (босс сверху, питомец внизу, задание между ними).
   Верный ответ — питомец бросает снаряд (буква / цифра / ABC), каждый 5-й верный подряд — суперудар −2.
   Ошибка — босс бьёт кляксой, минус сердечко, и затем применяет свой приём.
   Каждый 4-й вопрос — босс со щитом (задание труднее). Победа — расколдованный босс и сундук.
   Фразы боссов озвучены низким голосом: voice/boss-N.js (делает «озвучка/озвучить.py», вид 'boss').
   ============================================================ */

/* Фразы боссов — без рода (боссы бывают «он» и «она»). Новая фраза → запустить озвучку. */
const BOSS_LINES = {
  start: ['Ха! Попробуй меня победить!', 'Ни за что не отдам!', 'Ну-ка, проверим, что ты знаешь!', 'Сюда никто не пройдёт!'],
  hurt: ['Ой!', 'Ай!', 'Не может быть!', 'Ай-ай-ай!', 'Ну погоди!', 'Ох-ох-ох!', 'Так нечестно!', 'Ай, больно!'],
  crit: ['Ой-ой-ой! Какой удар!', 'Ого! Вот это сила!', 'Ай-ай! Суперудар!'],
  laugh: ['Ха-ха-ха!', 'Хи-хи! Мимо!', 'Ага! Ошибочка!', 'Хо-хо-хо!', 'Ха-ха! Не угадать!'],
  angry: ['Ну всё, я сержусь!', 'Ах так? Держись!', 'Р-р-р! Сейчас получишь!'],
  scared: ['Ой-ой, мне страшно!', 'Пощади! Ой, нет!', 'Ты слишком много знаешь!'],
  shield: ['А вот мой щит!', 'Попробуй-ка пробей!', 'Щит! Теперь не достать!'],
  broke: ['Мой щит! Не может быть!', 'Ой, щит разбит!'],
  down: ['Ой-ой-ой-ой!', 'Не-е-ет! Колдовство пропадает!'],
  free: ['Спасибо! Теперь мы друзья!', 'Ура! Злые чары исчезли! Спасибо!', 'Как хорошо! Больше никаких проказ!'],
  win: ['Ха-ха! В этот раз победа моя!', 'Приходи ещё, если не боишься!'],
  trick: {
    b1: ['Тс-с-с! Заглушу все звуки!', 'У-у-у! Слышишь мои волны?'],
    b2: ['Ам! Откушу кусочек!', 'Хрум-хрум! Вкусный слог!'],
    b3: ['Ш-ш-ш! Ж-ж-ж!', 'Ш-ш-ш! Всё перепутаю!'],
    b4: ['Напущу туману!', 'Туман-туман, ничего не видно!'],
    b5: ['Камнепад!', 'Получай камушки!'],
    b6: ['Бз-з-з! Короткое замыкание!', 'Искры, вперёд!'],
    b7: ['Всё перепутаю!', 'Раз-два-три, всё вперемешку!'],
    b8: ['Клякса! Попробуй-ка сотри!', 'Шлёп! Ещё одна клякса!'],
    mb1: ['Перемешаю все числа!', 'Раз-два-три, всё вперемешку!'],
    mb2: ['Ам! Вкусный кусочек!', 'Хрум! Проглочу десяток!'],
    mb3: ['Получай ракушки!', 'Не спеши, ракушки летят!'],
    mb4: ['Чернильное облако!', 'Напущу чернил!'],
    mb5: ['Щёлк-щёлк! Ущипну!', 'Щёлк! Откушу краешек!'],
    mb6: ['Угу! Наступила ночь!', 'Угу-угу! Темно!'],
    mb7: ['Фигуры, вперёд!', 'Получай треугольники!'],
    mb8: ['У-у-у! Боишься?', 'У-у-у! Варианты исчезают!'],
    mb9: ['Р-р-р! Топ-топ!', 'Р-р-р! Земля трясётся!'],
    eb1: ['Перемешаю буквы!', 'Кар-р! Всё вперемешку!'],
    eb2: ['У-у-а-а! Шумим!', 'У-а-а! Как громко!'],
    eb3: ['Ам! Хап!', 'Хап! Откушу краешек!'],
    eb4: ['Перья летят!', 'Посмотри, какие перья!'],
    eb5: ['Шур-шур! Спрячу!', 'Шур-шур-шур! Где варианты?'],
    eb6: ['Бу! Темнота!', 'Бу-у! Наступила ночь!'],
    eb7: ['Ам-ням! Откушу!', 'Ням! Вкусный краешек!'],
    eb8: ['Бом-м! Топ-топ!', 'Бом-м! Земля трясётся!'],
  },
};
/* конец фраз босса */

/* Приём каждого босса: t — вид, g — что летит (камни, ракушки, фигуры, перья) */
const BOSS_FX = {
  b1: { t: 'waves' }, b2: { t: 'bite' }, b3: { t: 'hiss' }, b4: { t: 'fog' }, b5: { t: 'rocks', g: '🪨' },
  b6: { t: 'sparks' }, b7: { t: 'shuffle' }, b8: { t: 'blot' },
  mb1: { t: 'shuffle' }, mb2: { t: 'bite' }, mb3: { t: 'rocks', g: '🐚' }, mb4: { t: 'fog', ink: true }, mb5: { t: 'bite' },
  mb6: { t: 'night' }, mb7: { t: 'rocks', g: '🔺🟦🟡' }, mb8: { t: 'ghost' }, mb9: { t: 'stomp', g: '🪨' },
  eb1: { t: 'shuffle' }, eb2: { t: 'waves' }, eb3: { t: 'bite' }, eb4: { t: 'rocks', g: '🪶' }, eb5: { t: 'ghost' },
  eb6: { t: 'night' }, eb7: { t: 'bite' }, eb8: { t: 'stomp', g: '🪨' },
};

/* Плюшевые игрушки — расколдованные боссы в домике питомца (выдаются при первой победе) */
const BOSS_TOYS = [];
ALL_WORLDS.forEach((w, k) => {
  const b = w.boss;
  const it = { id: 'boss_' + b.id, cat: 'decor', icon: b.emoji, name: 'Игрушка «' + b.name + '»', zone: 'floor',
    x: 50 + (k * 83) % 540, y: 318 + (k % 3) * 24, h: 50, play: 'hug', ps: 1, plush: true };
  BOSS_TOYS.push(it); ITEMS[it.id] = it;
});

/* Голос боссов: записи низким голосом; нет записи — низкое «бормотание» */
const BossVoice = {
  pack: null, cur: null, asked: false,
  load() {
    if (this.pack || this.asked) return;
    this.asked = true;
    VoiceParts.load('boss', p => { this.pack = p; if (!p) this.asked = false; });
  },
  stop() { if (this.cur) { try { this.cur.pause(); } catch (e) { /* */ } this.cur = null; } },
  say(text) {
    if (!Speech.petOn) return;
    this.stop();
    const b64 = this.pack && this.pack[PetVoice.key(text)];
    if (!b64) { this.growl(text); return; }
    const a = new Audio('data:audio/mpeg;base64,' + b64);
    this.cur = a;
    a.play().catch(() => this.growl(text));
  },
  growl(text) {
    Sound.init(); const c = Sound.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    const syl = Math.max(2, Math.min(10, [...String(text).toLowerCase()].filter(ch => 'аоуыэеёюяи'.includes(ch)).length));
    let at = 0;
    for (let i = 0; i < syl; i++) {
      const f = 110 + Math.random() * 60, d = 0.08 + Math.random() * 0.06;
      const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + at;
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 0.8, t0 + d);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + d + 0.03);
      at += d + 0.04;
    }
  },
};

const Boss = {
  /* ---------- Разметка ---------- */
  topHTML(w) {
    return `<div class="boss-bar"><div class="hp"><div id="hpBar" style="width:100%"></div><span class="hp-name">${w.boss.name}</span></div>
      <span class="hearts" id="hearts">❤️❤️❤️</span></div>`;
  },
  arenaHTML(w) {
    return `<div class="arena-boss" id="aBoss"><div class="ab-wrap"><span class="ab-emo" id="bEmo">${w.boss.emoji}</span>
      <span class="ab-shield">🛡️</span><span class="ab-mood"></span></div><div class="ab-say" id="bSay"></div></div>`;
  },
  petHTML() {
    return `<div class="arena-pet" id="aPet"><div class="ap-in" id="aPetIn">${petSVG({ uid: 'ap', mood: 'happy' })}</div></div>
      <div class="ap-say" id="pSay"></div><div class="arena-fx" id="aFx"></div>`;
  },
  start() {
    BossVoice.load();
    Object.assign(L, { helped: false, trickNext: false, bState: '', biteLeft: 0, blotTold: false, lastCrit: false });
    setTimeout(() => { if (L && L.mode === 'boss') Boss.bossSay(U.rnd(BOSS_LINES.start)); }, 500);
  },

  /* ---------- Мелочи ---------- */
  ov: () => $('#lesson'),
  center(el, ky = 0.5) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * ky]; },
  bossSay(text) {
    BossVoice.say(text);
    const b = $('#bSay'); if (!b) return;
    b.textContent = text; b.classList.add('show');
    clearTimeout(this.bT); this.bT = setTimeout(() => b.classList.remove('show'), 2200);
  },
  petSay(text) {
    Speech.sayPet(text, petStage());
    const b = $('#pSay'); if (!b) return;
    b.textContent = text; b.classList.add('show');
    clearTimeout(this.pT); this.pT = setTimeout(() => b.classList.remove('show'), 2200);
  },
  setPet(mood) { const p = $('#aPetIn'); if (p) p.innerHTML = petSVG({ uid: 'ap', mood }); },
  hearts() { $('#hearts').innerHTML = '❤️'.repeat(L.hearts) + '<span class="lost">🤍</span>'.repeat(Math.max(0, 3 - L.hearts)); },
  re(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); },
  fxEl(cls, style = '', html = '', life = 0) {
    const box = $('#aFx'); if (!box) return null;
    const el = document.createElement('div');
    el.className = 'fx ' + cls; el.style.cssText = style; el.innerHTML = html;
    box.appendChild(el);
    if (life) setTimeout(() => el.remove(), life);
    return el;
  },
  float(text, el, cls = '') {
    const [x, y] = this.center(el, 0.15);
    this.fxEl('dmg ' + cls, `left:${x + 30}px;top:${y}px`, text, 1300);
  },
  /* Полёт снаряда по дуге от одного элемента к другому */
  fly(html, from, to, cls = '', dur = 520, arc = -80) {
    const [x0, y0] = this.center(from, 0.4), [x1, y1] = this.center(to, 0.5);
    const el = this.fxEl('shot ' + cls, `left:${x0}px;top:${y0}px`, html);
    if (!el) return Promise.resolve();
    const dx = x1 - x0, dy = y1 - y0;
    return new Promise(res => {
      const end = () => { el.remove(); res(); };
      if (!el.animate) { setTimeout(end, 50); return; }
      const a = el.animate([
        { transform: 'translate(-50%,-50%) scale(.6) rotate(0deg)' },
        { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 + arc}px)) scale(1.15) rotate(200deg)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.9) rotate(400deg)` },
      ], { duration: dur, easing: 'ease-in' });
      a.onfinish = end;
    });
  },
  /* Чем бросает питомец: русский — буква из ответа, математика — цифра, английский — ABC */
  ammo(t) {
    const sid = L.subject.id;
    if (sid === 'math') { const d = String(t.answer).match(/\d/g); return U.rnd(d || '0123456789'.split('')); }
    if (sid === 'en') return U.rnd(['A', 'B', 'C']);
    const opt = t.options && t.options.find(o => String(o.v) === String(t.answer));
    const src = String((t.word && t.word.fill) || (opt && opt.label) || t.answer || '').replace(/<[^>]+>/g, '');
    return U.rnd(src.toUpperCase().match(/[А-ЯЁ]/g) || 'АБВГДЕЖЗИКЛМНОПРСТУФХ'.split(''));
  },
  loot() {
    const sid = L.subject.id;
    return (sid === 'math' ? '0123456789+−' : sid === 'en' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ').split('');
  },
  noise(dur, freq, vol = 0.12, type = 'highpass') {
    if (!Sound.enabled) return;
    Sound.init(); const c = Sound.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime;
    s.buffer = buf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(t0);
  },
  tones(list, type = 'triangle', vol = 0.12) { if (Sound.enabled) list.forEach(([f, s, d]) => Sound.tone(f, s, d, type, vol)); },
  clearFx() { $$('#aFx .blotcv, #aFx .fog, #aFx .night').forEach(x => x.remove()); },

  /* ---------- Ход боя ---------- */
  /* Каждый 4-й вопрос — со щитом: задание потруднее, из последних тем мира */
  prepTask() {
    const e = L.queue[L.pos];
    if (e.shield || (L.pos + 1) % 4 !== 0) return;
    const ls = L.world.lessons.slice(Math.floor(L.world.lessons.length / 2));
    let t = null;
    GEN.boost = 1;
    for (let k = 0; k < 8 && !t; k++) { const les = U.rnd(ls); t = makeTask(les.id, Math.floor(Math.random() * les.bank.length)); }
    GEN.boost = 0;
    if (t) L.queue[L.pos] = { t, shield: true };
  },
  onTask(e) {
    const ab = $('#aBoss');
    ab.classList.toggle('shielded', !!e.shield);
    if (e.shield) {
      $('#lBody').insertAdjacentHTML('afterbegin', '<div class="retry-tag shield-tag">🛡️ У босса щит! Задание потруднее — ответь верно и разбей щит</div>');
      this.tones([[300, 0, 0.12], [450, 0.08, 0.2]], 'square', 0.05);
      this.bossSay(U.rnd(BOSS_LINES.shield));
    }
    this.setPet('happy');
    if (L.biteLeft > 0 && --L.biteLeft === 0) this.unbite();
    if (L.hearts === 1 && !L.helped) setTimeout(() => this.help(), 700);
    else if (L.trickNext || (L.pos % 5 === 2)) { L.trickNext = false; setTimeout(() => this.trick(), e.shield ? 1600 : 800); }
  },
  correct(e, t) {
    const crit = L.combo > 0 && L.combo % 5 === 0, dmg = crit ? 2 : 1;
    L.lastCrit = crit;
    L.hp = Math.max(0, L.hp - dmg);
    this.clearFx();
    const pet = $('#aPet'), boss = $('#bEmo');
    this.re(pet, 'throw');
    this.setPet(crit ? 'laugh' : 'happy');
    if (crit) this.petSay('Суперудар!');
    const g = this.ammo(t);
    this.fly(crit ? `${g}<b>💥</b>` : g, pet, boss, crit ? 'crit' : '', crit ? 600 : 520, crit ? -120 : -80)
      .then(() => this.impact(dmg, crit, !!e.shield));
  },
  impact(dmg, crit, shield) {
    if (!L || L.mode !== 'boss') return;
    const b = $('#bEmo');
    this.re(b, 'hit');
    Sound.play('hit');
    if (crit) { this.re(this.ov(), 'quake'); this.tones([[200, 0, 0.2], [120, 0.08, 0.3]], 'sawtooth', 0.1); }
    if (shield) this.breakShield();
    this.float(crit ? 'КРИТ! −2' : '−1', b, crit ? 'crit' : '');
    const [x, y] = this.center(b);
    for (let i = 0; i < (crit ? 9 : 5); i++) {
      const a = Math.random() * 6.28, r = 50 + Math.random() * 40;
      this.fxEl('spark', `left:${x}px;top:${y}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px`, U.rnd(['✨', '⭐', '💫']), 800);
    }
    $('#hpBar').style.width = (100 * L.hp / L.hpMax) + '%';
    this.unbite();
    if (L.hp <= 0) return;
    /* настроение: ≤50 % — злится, ≤20 % — пугается */
    const q = L.hp / L.hpMax, st = q <= 0.2 ? 'scared' : q <= 0.5 ? 'angry' : '';
    const ab = $('#aBoss');
    if (st !== L.bState) {
      L.bState = st;
      ab.classList.toggle('angry', st === 'angry'); ab.classList.toggle('scared', st === 'scared');
      ab.querySelector('.ab-mood').textContent = st === 'angry' ? '💢' : st === 'scared' ? '💦' : '';
      if (st) { this.bossSay(U.rnd(BOSS_LINES[st])); return; }
    }
    if (shield) this.bossSay(U.rnd(BOSS_LINES.broke));
    else if (crit) this.bossSay(U.rnd(BOSS_LINES.crit));
    else if (Math.random() < 0.75) this.bossSay(U.rnd(BOSS_LINES.hurt));
  },
  breakShield() {
    const ab = $('#aBoss'); ab.classList.remove('shielded');
    const [x, y] = this.center(ab.querySelector('.ab-wrap'));
    this.fxEl('shatter', `left:${x}px;top:${y}px`, '🛡️', 700);
    for (let i = 0; i < 6; i++) this.fxEl('spark', `left:${x}px;top:${y}px;--dx:${Math.random() * 160 - 80}px;--dy:${Math.random() * 120 - 30}px`, '✦', 700);
    this.tones([[1400, 0, 0.08], [1000, 0.05, 0.1], [1700, 0.1, 0.15]], 'square', 0.05);
  },
  wrong() {
    L.hearts = Math.max(0, L.hearts - 1);
    L.trickNext = L.hearts > 0;
    this.clearFx();
    const pet = $('#aPet'), boss = $('#bEmo'), ab = $('#aBoss');
    this.re(ab, 'laughing');
    this.bossSay(U.rnd(L.hearts ? BOSS_LINES.laugh : BOSS_LINES.win));
    this.fly('<i class="inkb"></i>', boss, pet, 'ink', 560, -40).then(() => {
      if (!L || L.mode !== 'boss') return;
      this.re(pet, 'ouch');
      this.fxEl('splat', (([x, y]) => `left:${x}px;top:${y}px`)(this.center(pet, 0.45)), '', 1500);
      this.setPet('sad');
      this.float('−❤️', pet, 'heart');
      this.hearts();
      this.noise(0.25, 600, 0.1, 'lowpass');
    });
  },
  /* Помощь питомца: при одном сердечке — один раз за бой +1 */
  help() {
    if (!L || L.mode !== 'boss' || L.helped || L.hearts !== 1) return;
    L.helped = true;
    this.setPet('love');
    this.petSay('Держись, я помогу!');
    this.fly('❤️', $('#aPet'), $('#hearts'), 'heartshot', 750, -90).then(() => {
      if (!L || L.mode !== 'boss') return;
      L.hearts++; this.hearts(); this.re($('#hearts'), 'bump');
      Sound.play('pet');
    });
  },

  /* ---------- Приёмы боссов ---------- */
  trick() {
    if (!L || L.mode !== 'boss' || L.finished || L.answered) return;
    const id = L.world.boss.id, fx = BOSS_FX[id] || { t: 'waves' };
    if (BOSS_LINES.trick[id]) this.bossSay(U.rnd(BOSS_LINES.trick[id]));
    this.re($('#aBoss'), 'cast');
    (this.T[fx.t] || this.T.waves).call(this, fx);
  },
  bodyRect() { return $('#lBody').getBoundingClientRect(); },
  unbite() { $$('#aFx .bite').forEach(b => { b.classList.add('gone'); setTimeout(() => b.remove(), 400); }); L.biteLeft = 0; },
  T: {
    waves() {
      const [x, y] = this.center($('#bEmo'));
      for (let i = 0; i < 4; i++) this.fxEl('ring', `left:${x}px;top:${y}px;animation-delay:${i * 0.2}s`, '', 1800);
      this.re($('#lBody .ans'), 'wobbly');
      this.tones([[180, 0, 0.3], [150, 0.25, 0.3], [180, 0.5, 0.3]], 'sine', 0.08);
    },
    bite() {
      if ($('#aFx .bite')) return;
      this.fxEl('bite ' + U.rnd(['left', 'right']));
      L.biteLeft = 2;
      [0, 0.15, 0.3].forEach(s => setTimeout(() => this.noise(0.08, 900, 0.14, 'lowpass'), s * 1000));
    },
    hiss() {
      const r = this.bodyRect();
      for (let i = 0; i < 3; i++) {
        this.fxEl('hissw', `left:${r.left + r.width * (0.2 + 0.3 * i)}px;top:${r.top + 30 + Math.random() * r.height * 0.5}px;animation-delay:${i * 0.2}s`, 'Ш-Ш-Ш!', 1800);
      }
      this.noise(1.1, 4000, 0.07);
    },
    fog(fx) {
      const r = this.bodyRect();
      this.fxEl('fog' + (fx.ink ? ' ink' : ''), `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${Math.min(r.height, innerHeight - r.top)}px`, '', 3600);
      this.noise(1.2, 400, 0.05, 'lowpass');
    },
    rocks(fx, stomp = false) {
      const g = Array.from(fx.g || '🪨');
      for (let i = 0; i < 7; i++) {
        this.fxEl('rock', `left:${8 + Math.random() * 84}%;animation-delay:${i * 0.13}s;font-size:${30 + Math.random() * 22}px;--r:${Math.random() * 360}deg`, U.rnd(g), 2300);
        setTimeout(() => Sound.tone(110 + Math.random() * 60, 0, 0.12, 'sine', 0.15), 700 + i * 130);
      }
      if (stomp) [0, 450, 900].forEach(d => setTimeout(() => { this.re(this.ov(), 'quake'); Sound.tone(70, 0, 0.25, 'sine', 0.25); }, d));
    },
    stomp(fx) { this.T.rocks.call(this, fx, true); },
    sparks() {
      const r = this.bodyRect();
      for (let i = 0; i < 10; i++) {
        this.fxEl('zap', `left:${r.left + Math.random() * r.width}px;top:${r.top + Math.random() * Math.min(r.height, 360)}px;animation-delay:${i * 0.07}s`, U.rnd(['⚡', '✨', '⚡']), 1100);
      }
      this.re(this.ov(), 'flicker');
      for (let i = 0; i < 5; i++) Sound.tone(1200 + Math.random() * 900, i * 0.08, 0.05, 'square', 0.05);
    },
    shuffle() {
      const box = $('#lBody .opts');
      const opts = box ? $$('.opt', box).filter(b => !b.disabled) : [];
      if (opts.length < 2) { this.T.waves.call(this); return; }
      this.re(box, 'swirl');
      setTimeout(() => { if (L && !L.answered) U.shuffle([...box.children]).forEach(c => box.appendChild(c)); }, 320);
      this.tones([[500, 0, 0.08], [700, 0.08, 0.08], [400, 0.16, 0.08], [800, 0.24, 0.12]], 'triangle', 0.08);
    },
    ghost() {
      this.re($('#lBody .ans'), 'ghosty');
      const r = this.bodyRect();
      this.fxEl('ghostfly', `top:${r.top + r.height * 0.3}px`, '👻', 2400);
      this.tones([[400, 0, 0.6], [300, 0.5, 0.7]], 'sine', 0.06);
    },
    night() {
      this.fxEl('night', '', '<span>🌙</span>', 3000);
      this.tones([[330, 0, 0.3], [262, 0.3, 0.5]], 'sine', 0.08);
    },
    blot() {
      if ($('#aFx .blotcv')) return;
      const a = ($('#lBody .ans') || $('#lBody')).getBoundingClientRect();
      const w = Math.round(Math.min(a.width, 340)), h = Math.round(Math.min(Math.max(a.height, 130), 230));
      if (w < 60) return;
      const x = a.left + Math.random() * Math.max(0, a.width - w), y = a.top + Math.random() * Math.max(0, Math.min(a.height, innerHeight - a.top - 20) - h);
      const cv = document.createElement('canvas');
      cv.className = 'fx blotcv'; cv.width = w; cv.height = h;
      cv.style.cssText = `left:${x}px;top:${Math.max(a.top, y)}px;width:${w}px;height:${h}px`;
      $('#aFx').appendChild(cv);
      const c = cv.getContext('2d');
      c.fillStyle = '#2E2350';
      const blob = (bx, by, r) => { c.beginPath(); c.arc(bx, by, r, 0, 6.29); c.fill(); };
      blob(w / 2, h / 2, Math.min(w, h) * 0.36);
      for (let i = 0; i < 12; i++) { const an = Math.random() * 6.28, d = Math.min(w, h) * (0.25 + Math.random() * 0.22); blob(w / 2 + Math.cos(an) * d * (w / h > 1.4 ? 1.4 : 1), h / 2 + Math.sin(an) * d, 8 + Math.random() * 20); }
      for (let i = 0; i < 4; i++) { const bx = w * (0.3 + Math.random() * 0.4); c.fillRect(bx - 4, h / 2, 8, h * 0.42); blob(bx, h / 2 + h * 0.42, 7); }
      const full = this.ink(c, w, h);
      let moves = 0, done = false;
      const finish = () => {
        if (done) return; done = true;
        cv.classList.add('gone'); setTimeout(() => cv.remove(), 450);
        Sound.play('pop');
      };
      const rub = ev => {
        if (done) return;
        ev.preventDefault();
        const r = cv.getBoundingClientRect();
        c.globalCompositeOperation = 'destination-out';
        c.beginPath(); c.arc(ev.clientX - r.left, ev.clientY - r.top, 30, 0, 6.29); c.fill();
        if (++moves % 6 === 0 && this.ink(c, w, h) < full * 0.3) finish();
      };
      cv.addEventListener('pointerdown', rub);
      cv.addEventListener('pointermove', ev => { if (ev.buttons || ev.pointerType === 'touch') rub(ev); });
      setTimeout(finish, 25000);
      this.noise(0.2, 500, 0.15, 'lowpass');
      if (!L.blotTold) { L.blotTold = true; setTimeout(() => this.petSay('Сотри кляксу пальцем!'), 1200); }
    },
  },
  ink(c, w, h) {
    const d = c.getImageData(0, 0, w, h).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4 * 37) if (d[i] > 40) n++;
    return n;
  },

  /* ---------- Победа ---------- */
  defeat(cb) {
    L.defeating = true;
    const ab = $('#aBoss'), b = $('#bEmo');
    setTimeout(() => {
      if (!L) return;
      this.bossSay(U.rnd(BOSS_LINES.down));
      ab.classList.remove('angry', 'scared', 'shielded');
      ab.querySelector('.ab-mood').textContent = '';
      b.classList.remove('hit'); b.classList.add('spin');
      this.tones([[600, 0, 0.15], [500, 0.15, 0.15], [400, 0.3, 0.15], [300, 0.45, 0.3]], 'triangle', 0.1);
    }, 650);
    setTimeout(() => {
      if (!L) return;
      const [x, y] = this.center(b);
      Sound.play('pop'); this.noise(0.3, 1500, 0.15);
      this.fxEl('poof', `left:${x}px;top:${y}px`, '💥', 900);
      b.classList.remove('spin'); b.classList.add('kind'); ab.classList.add('freed');
      const loot = this.loot();
      for (let i = 0; i < 18; i++) {
        const an = Math.random() * 6.28, r = 120 + Math.random() * 220;
        this.fxEl('loot', `left:${x}px;top:${y}px;--dx:${Math.cos(an) * r}px;--dy:${Math.sin(an) * r * 0.8 + 80}px;animation-delay:${Math.random() * 0.25}s`, U.rnd(loot), 1900);
      }
      confetti(110); Sound.play('level');
      this.setPet('laugh');
    }, 1850);
    setTimeout(() => { if (L) this.bossSay(U.rnd(BOSS_LINES.free)); }, 2500);
    setTimeout(() => { if (L && !L.finished) cb(); }, 4600);
  },
  /* Сундук: монеты или редкий предмет. Первая победа — щедрее, и из сундука может выпасть редкий подарок */
  chestPrize(first, wi) {
    const rare = first && Math.random() < 0.35 ? EXCLUSIVE.find(x => !S.owned[x.id]) : null;
    if (rare) { S.owned[rare.id] = true; return { icon: rare.icon, html: `Редкий подарок: <b>${rare.icon} ${rare.name}</b> — он уже в домике!` }; }
    const n = first ? 40 + 15 * wi : Math.max(5, Math.round((15 + 5 * wi) * L.factor));
    earnCoins(n, true);
    return { icon: '💰', html: `В сундуке монеты: <b>+${n} <i class="ci"></i></b>` };
  },
  chestHTML() {
    return `<button class="chest" data-act="chestOpen" aria-label="Открыть сундук"><span class="ch-glow"></span>
      <svg class="chest-svg" viewBox="0 0 120 100" aria-hidden="true">
        <rect x="14" y="46" width="92" height="48" rx="6" fill="#B5652B"/><rect x="14" y="46" width="92" height="7" fill="#8E4A1C"/>
        <rect x="27" y="46" width="9" height="48" fill="#F5B400"/><rect x="84" y="46" width="9" height="48" fill="#F5B400"/>
        <g class="ch-lid"><path d="M14 48 V34 Q14 14 60 14 Q106 14 106 34 V48 Z" fill="#C8763A"/>
          <path d="M27 48 V20 h9 V48z M84 48 V20 h9 V48z" fill="#F5B400"/>
          <rect x="51" y="38" width="18" height="17" rx="3" fill="#FFD34E" stroke="#B98500" stroke-width="2"/><circle cx="60" cy="45" r="2.6" fill="#7A4A00"/></g>
      </svg><span class="ch-prize" id="chPrize"></span></button>`;
  },
  openChest() {
    const c = $('.chest');
    if (!c || c.classList.contains('open') || !L || !L.chest) return;
    c.classList.add('open');
    $('#chPrize').textContent = L.chest.icon;
    Sound.play('coin'); setTimeout(() => Sound.play('star'), 250);
    const tip = $('.chest-tip'); if (tip) tip.remove();
    const after = $('.after-chest');
    if (after) { after.hidden = false; setTimeout(() => { const b = after.querySelector('.btn'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 700); }
    confetti(60);
  },
};
