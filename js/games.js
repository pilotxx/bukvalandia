'use strict';
/* ============================================================
   Букваландия — развивающие мини-игры (1–2 минуты каждая)
   Окно игры, «Готово» и рекорды — общие (openGameOverlay / gameEnd в app.js).
   Уровни «Судоку» и «Лабиринта» сохраняются сразу после каждого пройденного уровня.
   ============================================================ */

const gTop = (task, score) => `<div class="g-top"><button class="x" data-act="gameClose">✕</button><div class="g-task">${task}</div><div class="g-score">${score}</div></div>`;
/* Итог игры: рекорд (больше — лучше), опыт */
function gFinish(ov, id, icon, title, score, xp, extra = '') {
  const rec = score > (S.records[id] || 0);
  if (rec) S.records[id] = score;
  addXP(xp);
  gameEnd(ov, `<div class="m-icon">${icon}</div><h2>${title}</h2>${extra}${rec && score ? '<p class="reward">🏆 Новый рекорд!</p>' : `<p>Рекорд: ${S.records[id] || 0}</p>`}<p class="small">+${xp} опыта</p>`);
}
const gSay = t => { if (petStage() > 0) Speech.sayPet(t, petStage()); };

/* ---------- 1. Поймай еду: корзинка, правило, пойманное — питомцу ---------- */
const CATCH_FOOD = [['яблоко', '🍎', 'f'], ['груша', '🍐', 'f'], ['банан', '🍌', 'f'], ['вишня', '🍒', 'f'], ['клубника', '🍓', 'f'], ['виноград', '🍇', 'f'],
  ['арбуз', '🍉', 'f'], ['лимон', '🍋', 'f'], ['апельсин', '🍊', 'f'], ['персик', '🍑', 'f'], ['ананас', '🍍', 'f'], ['кокос', '🥥', 'f'],
  ['морковь', '🥕', 'v'], ['огурец', '🥒', 'v'], ['помидор', '🍅', 'v'], ['кукуруза', '🌽', 'v'], ['капуста', '🥬', 'v'], ['картофель', '🥔', 'v'], ['баклажан', '🍆', 'v'],
  ['сыр', '🧀', 'o'], ['хлеб', '🍞', 'o'], ['торт', '🎂', 'o'], ['печенье', '🍪', 'o'], ['молоко', '🥛', 'o'], ['гриб', '🍄', 'o']];
const CATCH_RULES = [
  { name: 'только <b>овощи</b>', f: w => w[2] === 'v' },
  { name: 'только <b>фрукты и ягоды</b>', f: w => w[2] === 'f' },
  { name: 'слова на букву <b>К</b>', f: w => w[0][0] === 'к' },
  { name: 'слова, которые начинаются с <b>гласной</b>', f: w => U.isV(w[0][0]) },
  { name: 'слова из <b>двух слогов</b>', f: w => U.vowelCount(w[0]) === 2 },
  { name: 'слова с буквой <b>Р</b>', f: w => w[0].includes('р') },
];
function gameCatch() {
  const rule = U.rnd(CATCH_RULES);
  const yes = CATCH_FOOD.filter(rule.f), no = CATCH_FOOD.filter(w => !rule.f(w));
  let score = 0, left = 45, items = [], bx = 0.5, raf = 0, last = performance.now(), spawnT = 0, speed = 0.11;
  const ov = openGameOverlay(gTop(`Лови: ${rule.name}`, `🧺 <b id="gScore">0</b> · ⏱ <b id="gTime">45</b>`) + `<div class="g-area catch-area" id="gArea"><div class="basket" id="basket">🧺</div><div class="catch-word" id="cWord"></div></div>`);
  const area = ov.querySelector('#gArea'), bk = ov.querySelector('#basket'), cw = ov.querySelector('#cWord');
  const W = () => area.clientWidth, H = () => area.clientHeight;
  const moveTo = cx => { bx = Math.max(0.06, Math.min(0.94, (cx - area.getBoundingClientRect().left) / W())); bk.style.left = bx * 100 + '%'; };
  area.addEventListener('pointerdown', e => moveTo(e.clientX));
  area.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') moveTo(e.clientX); });
  bk.style.left = '50%';
  const spawn = () => {
    const ok = Math.random() < 0.5, w = U.rnd(ok ? yes : no);
    const el = document.createElement('div'); el.className = 'fall'; el.textContent = w[1];
    area.appendChild(el);
    items.push({ el, x: 0.06 + Math.random() * 0.88, y: -50, w, ok: rule.f(w) });
  };
  const loop = now => {
    if (!document.body.contains(ov)) return;
    const dt = Math.min(50, now - last); last = now;
    spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = 900 - Math.min(450, (45 - left) * 10); }
    const h = H(), by = h - 70;
    items = items.filter(it => {
      it.y += speed * dt * (1 + (45 - left) / 60);
      it.el.style.left = it.x * 100 + '%'; it.el.style.top = it.y + 'px';
      if (it.y > by - 20 && it.y < by + 30 && Math.abs(it.x - bx) * W() < 52) {
        if (it.ok) { score++; Sound.play('coin'); bk.classList.remove('yum'); void bk.offsetWidth; bk.classList.add('yum'); }
        else { score = Math.max(0, score - 1); Sound.play('wrong'); bk.classList.remove('shake'); void bk.offsetWidth; bk.classList.add('shake'); }
        cw.textContent = `${it.w[1]} ${it.w[0]} ${it.ok ? '✓' : '✗'}`; cw.className = 'catch-word ' + (it.ok ? 'ok' : 'bad');
        ov.querySelector('#gScore').textContent = score;
        it.el.remove(); return false;
      }
      if (it.y > h + 40) { it.el.remove(); return false; }
      return true;
    });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  ov._t2 = setInterval(() => {
    left--; const el = ov.querySelector('#gTime'); if (el) el.textContent = left;
    if (left <= 0) {
      clearInterval(ov._t2); cancelAnimationFrame(raf);
      items.forEach(it => it.el.remove());
      /* за каждые 5 правильных — еда питомцу */
      const n = Math.floor(score / 5), got = {};
      for (let i = 0; i < n; i++) { const f = U.rnd(['apple', 'carrot', 'apple', 'cookie']); got[f] = (got[f] || 0) + 1; S.food[f] = (S.food[f] || 0) + 1; }
      const list = Object.entries(got).map(([f, k]) => `${ITEMS[f].icon}×${k}`).join(' ');
      if (n) gSay('Спасибо за угощение! Ням-ням!');
      gFinish(ov, 'catch', '🧺', `Поймано: ${score}`, score, Math.min(30, score * 2), n ? `<p>Питомцу достаётся: <b>${list}</b></p>` : '<p class="small">За каждые 5 правильных — угощение питомцу.</p>');
    }
  }, 1000);
}

/* ---------- 2. Шарики-ответы ---------- */
function mathExample() {
  const r = Math.random();
  if (r < 0.45) { const a = 2 + Math.floor(Math.random() * Math.max(4, S.mul.unlocked - 1)), b = 2 + Math.floor(Math.random() * 8); return { q: `${a} × ${b}`, a: a * b }; }
  if (r < 0.75) { const a = 10 + Math.floor(Math.random() * 70), b = 3 + Math.floor(Math.random() * Math.min(29, 99 - a)); return { q: `${a} + ${b}`, a: a + b }; }
  const a = 20 + Math.floor(Math.random() * 79), b = 3 + Math.floor(Math.random() * (a - 5)); return { q: `${a} − ${b}`, a: a - b };
}
function gameMathBalloons() {
  let score = 0, left = 60, ex = mathExample();
  const ov = openGameOverlay(gTop(`Лопни ответ: <b class="mb-q" id="mbQ">${ex.q} = ?</b>`, `🎈 <b id="gScore">0</b> · ⏱ <b id="gTime">60</b>`) + `<div class="g-area balloons-area" id="gArea"></div>`);
  const area = ov.querySelector('#gArea');
  const colors = ['#FF6B9A', '#FFD34E', '#5ED6A0', '#6EC6FF', '#B39DFF', '#FF9F43'];
  const fake = () => { const d = U.rnd([1, 2, 10, -1, -2, -10, 5, -5]); return Math.max(0, ex.a + d); };
  const spawn = () => {
    const isOk = Math.random() < 0.25 || !area.querySelector('[data-ok="1"]');
    const v = isOk ? ex.a : fake();
    if (!isOk && v === ex.a) return;
    const b = document.createElement('button');
    b.className = 'balloon num'; b.dataset.v = v; b.dataset.ok = v === ex.a ? '1' : '';
    b.textContent = v;
    b.style.left = (4 + Math.random() * 78) + '%';
    b.style.setProperty('--bc', U.rnd(colors));
    b.style.animationDuration = (6 + Math.random() * 2) + 's';
    b.addEventListener('animationend', () => b.remove());
    b.addEventListener('pointerdown', () => {
      if (b.classList.contains('pop')) return;
      if (+b.dataset.v === ex.a) {
        score++; Sound.play('pop'); b.classList.add('pop'); setTimeout(() => b.remove(), 250);
        ex = mathExample(); ov.querySelector('#mbQ').textContent = `${ex.q} = ?`;
        area.querySelectorAll('.balloon').forEach(x => { x.dataset.ok = +x.dataset.v === ex.a ? '1' : ''; });
      } else { score = Math.max(0, score - 1); Sound.play('wrong'); b.classList.add('nope'); }
      ov.querySelector('#gScore').textContent = score;
    });
    area.appendChild(b);
  };
  ov._t1 = setInterval(spawn, 700);
  ov._t2 = setInterval(() => {
    left--; const el = ov.querySelector('#gTime'); if (el) el.textContent = left;
    if (left <= 0) { clearInterval(ov._t1); clearInterval(ov._t2); gFinish(ov, 'mathballoons', '🔢', `Решено примеров: ${score}`, score, Math.min(30, score * 2)); }
  }, 1000);
  spawn(); spawn();
}

/* ---------- 3. Собери слово (словарные слова) ---------- */
function gameWord() {
  const words = U.sample(DICT_WORDS, 6);
  let wi = 0, clean = 0, pos = 0, miss = 0;
  const ov = openGameOverlay(gTop('Собери словарное слово', `<b id="gScore">1</b> / 6`) + `<div class="g-area word-area"><div class="w-slots" id="wSlots"></div><div class="w-tiles" id="wTiles"></div><p class="w-note" id="wNote"></p></div>`);
  const show = () => {
    const raw = words[wi], w = raw.toLowerCase();
    pos = 0; miss = 0;
    ov.querySelector('#gScore').textContent = wi + 1;
    ov.querySelector('#wSlots').innerHTML = [...w].map(() => '<span class="w-slot"></span>').join('');
    let order = U.shuffle([...w].map((c, i) => [c, i]));
    if (order.every(([, i], k) => i === k) && w.length > 1) order = order.reverse();
    ov.querySelector('#wTiles').innerHTML = order.map(([c, i]) => `<button class="w-tile" data-c="${c}" data-i="${i}">${c}</button>`).join('');
    ov.querySelector('#wNote').innerHTML = 'Нажимай буквы по порядку';
  };
  ov.querySelector('#wTiles').addEventListener('click', ev => {
    const t = ev.target.closest('.w-tile'); if (!t || t.disabled) return;
    const raw = words[wi], w = raw.toLowerCase();
    if (t.dataset.c === w[pos]) {
      t.disabled = true; t.classList.add('used');
      const slot = ov.querySelectorAll('.w-slot')[pos];
      slot.textContent = w[pos];
      if (raw[pos] !== w[pos]) slot.classList.add('key');
      pos++; Sound.play('tap');
      if (pos === w.length) {
        if (!miss) clean++;
        Sound.play('right');
        const k = [...raw].findIndex(ch => ch !== ch.toLowerCase());
        ov.querySelector('#wNote').innerHTML = `✅ <b>${w}</b> — запомни букву <b class="key-l">${w[k].toUpperCase()}</b>!`;
        setTimeout(() => {
          wi++;
          if (wi < words.length) show();
          else gFinish(ov, 'word', '🔤', `Без ошибок: ${clean} из 6`, clean, 6 + clean * 3);
        }, 1500);
      }
    } else { miss++; Sound.play('wrong'); t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); }
  });
  show();
}

/* ---------- 4. Listen & tap ---------- */
function gameListen() {
  const all = Object.values(V).flat().filter(w => /^\p{Extended_Pictographic}/u.test(w[2] || '') && !w[0].includes(' '));
  const rounds = U.sample(all, 8);
  const voice = Speech.enOk();
  let k = 0, score = 0, lock = false;
  const ov = openGameOverlay(gTop(voice ? 'Послушай и найди картинку' : 'Прочитай и найди картинку', `<b id="gScore">1</b> / 8`) + `<div class="g-area listen-area"><div class="ls-q" id="lsQ"></div><div class="ls-opts" id="lsO"></div></div>`);
  const show = () => {
    const w = rounds[k];
    const opts = U.shuffle([w, ...U.sample(all.filter(x => x[0] !== w[0] && x[2] !== w[2]), 3)]);
    ov.querySelector('#gScore').textContent = k + 1;
    ov.querySelector('#lsQ').innerHTML = voice ? `<button class="btn big" id="lsSay">🔊 Послушать ещё</button>` : `<span class="ls-word">${w[0]}</span>`;
    ov.querySelector('#lsO').innerHTML = opts.map(o => `<button class="ls-o" data-w="${o[0]}">${o[2]}</button>`).join('');
    if (voice) { setTimeout(() => Speech.sayEn(w[0]), 300); ov.querySelector('#lsSay').onclick = () => Speech.sayEn(w[0], true); }
    lock = false;
  };
  ov.querySelector('#lsO').addEventListener('click', ev => {
    const b = ev.target.closest('.ls-o'); if (!b || lock) return;
    lock = true;
    const w = rounds[k];
    const ok = b.dataset.w === w[0];
    if (ok) { score++; Sound.play('right'); b.classList.add('right'); } else { Sound.play('wrong'); b.classList.add('wrong'); ov.querySelector(`.ls-o[data-w="${CSS.escape(w[0])}"]`).classList.add('right'); }
    ov.querySelector('#lsQ').innerHTML = `<span class="ls-word">${w[2]} ${w[0]}</span><small>${w[1]}</small>`;
    setTimeout(() => { k++; if (k < rounds.length) show(); else gFinish(ov, 'listen', '👂', `Правильно: ${score} из 8`, score, 5 + score * 3); }, ok ? 1100 : 1900);
  });
  show();
}

/* ---------- 5. Запомни порядок (как «Саймон») ---------- */
function gameSimon() {
  const pads = [['🧸', '#FFB3C7', 523], ['⚽', '#9FD8FF', 659], ['🎈', '#FFE08A', 784], ['🥁', '#B9F0C9', 988]];
  let seq = [], inp = 0, lock = true, best = 0;
  const ov = openGameOverlay(gTop('Запомни, что показывает питомец, и повтори', `Длина: <b id="gScore">0</b>`) + `<div class="g-area simon-area"><div class="sm-pet" id="smPet">${petSVG({ uid: 'sm', mood: 'wow' })}</div><p class="sm-msg" id="smMsg">Смотри внимательно!</p><div class="sm-pads" id="smPads">${pads.map((p, i) => `<button class="sm-pad" data-i="${i}" style="--pc:${p[1]}">${p[0]}</button>`).join('')}</div></div>`);
  const flash = i => { const b = ov.querySelectorAll('.sm-pad')[i]; b.classList.add('lit'); Sound.tone(pads[i][2], 0, 0.3, 'triangle', 0.16); setTimeout(() => b.classList.remove('lit'), 380); };
  const play = async () => {
    lock = true; ov.querySelector('#smMsg').textContent = 'Смотри внимательно!';
    await wait(700);
    for (const i of seq) { if (!document.body.contains(ov)) return; flash(i); await wait(Math.max(350, 650 - seq.length * 20)); }
    inp = 0; lock = false; ov.querySelector('#smMsg').textContent = 'Теперь ты!';
  };
  const next = () => { seq.push(Math.floor(Math.random() * 4)); ov.querySelector('#gScore').textContent = seq.length; play(); };
  Sound.init();
  ov.querySelector('#smPads').addEventListener('click', ev => {
    const b = ev.target.closest('.sm-pad'); if (!b || lock) return;
    const i = +b.dataset.i;
    flash(i);
    if (i !== seq[inp]) {
      lock = true; Sound.play('wrong');
      best = seq.length - 1;
      ov.querySelector('#smPet').innerHTML = petSVG({ uid: 'sm', mood: 'sad' });
      setTimeout(() => gFinish(ov, 'simon', '🎵', `Запомнено подряд: ${best}`, best, Math.min(30, best * 3)), 800);
      return;
    }
    inp++;
    if (inp === seq.length) {
      lock = true;
      ov.querySelector('#smPet').innerHTML = petSVG({ uid: 'sm', mood: 'laugh' });
      ov.querySelector('#smMsg').textContent = U.rnd(['Верно!', 'Отлично!', 'Здорово!']);
      setTimeout(() => { ov.querySelector('#smPet').innerHTML = petSVG({ uid: 'sm', mood: 'wow' }); next(); }, 700);
    }
  });
  seq = [Math.floor(Math.random() * 4)];
  next();
}

/* ---------- 6. Который час? ---------- */
function clockSVG(h, m) {
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<text x="${(100 + 72 * Math.sin(a)).toFixed(1)}" y="${(100 - 72 * Math.cos(a)).toFixed(1)}" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#2B2350">${i || 12}</text>`; }).join('');
  return `<svg viewBox="0 0 200 200" class="clock"><circle cx="100" cy="100" r="94" fill="#fff" stroke="#7C5CFF" stroke-width="8"/>${ticks}
    <line x1="100" y1="100" x2="100" y2="52" stroke="#2B2350" stroke-width="8" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="30" stroke="#FF6B9A" stroke-width="5" stroke-linecap="round" transform="rotate(${ma} 100 100)"/><circle cx="100" cy="100" r="7" fill="#2B2350"/></svg>`;
}
function gameClock() {
  let k = 0, score = 0, lock = false;
  const fmtT = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  const ov = openGameOverlay(gTop('Который час?', `<b id="gScore">1</b> / 8`) + `<div class="g-area clock-area"><div id="ckF"></div><div class="ck-opts" id="ckO"></div></div>`);
  let cur;
  const show = () => {
    const step = k < 3 ? 30 : k < 6 ? 15 : 5;
    const h = 1 + Math.floor(Math.random() * 12), m = step * Math.floor(Math.random() * (60 / step));
    cur = fmtT(h, m);
    const set = new Set([cur]);
    while (set.size < 4) {
      const t = U.rnd([[h, (m + 30) % 60], [h % 12 + 1, m], [(h + 10) % 12 + 1, m], [m / 5 || 12, h * 5 % 60], [h, (m + 15) % 60]]);
      set.add(fmtT(t[0], t[1]));
    }
    ov.querySelector('#gScore').textContent = k + 1;
    ov.querySelector('#ckF').innerHTML = clockSVG(h, m);
    ov.querySelector('#ckO').innerHTML = U.shuffle([...set]).map(t => `<button class="btn big" data-t="${t}">${t}</button>`).join('');
    lock = false;
  };
  ov.querySelector('#ckO').addEventListener('click', ev => {
    const b = ev.target.closest('[data-t]'); if (!b || lock) return;
    lock = true;
    const ok = b.dataset.t === cur;
    if (ok) { score++; Sound.play('right'); b.classList.add('right'); } else { Sound.play('wrong'); b.classList.add('wrong'); ov.querySelector(`[data-t="${cur}"]`).classList.add('right'); }
    setTimeout(() => { k++; if (k < 8) show(); else gFinish(ov, 'clock', '🕰️', `Правильно: ${score} из 8`, score, 5 + score * 3, '<p class="small">Короткая стрелка — часы, длинная — минуты.</p>'); }, ok ? 900 : 1800);
  });
  show();
}

/* ---------- 7. Магазин: заплати без сдачи / посчитай сдачу ---------- */
const MONEY_GOODS = [['🍎', 'яблоко'], ['✏️', 'карандаш'], ['📓', 'тетрадь'], ['🍦', 'мороженое'], ['🧃', 'сок'], ['🎈', 'шарик'], ['🍪', 'печенье'], ['🧸', 'мишка']];
function gameMoney() {
  let k = 0, score = 0, lock = false, paid = [], task;
  const coins = [1, 2, 5, 10, 50];
  const ov = openGameOverlay(gTop('Магазин', `<b id="gScore">1</b> / 8`) + `<div class="g-area money-area"><div class="mn-q" id="mnQ"></div><div id="mnB"></div></div>`);
  const sum = () => paid.reduce((a, b) => a + b, 0);
  const show = () => {
    lock = false; paid = [];
    const g = U.rnd(MONEY_GOODS);
    ov.querySelector('#gScore').textContent = k + 1;
    if (k % 2 === 0) {
      const price = 3 + Math.floor(Math.random() * (k < 4 ? 30 : 90));
      task = { t: 'pay', price };
      ov.querySelector('#mnQ').innerHTML = `<span class="mn-good">${g[0]}</span><b>${U.cap(g[1])} стоит ${price} ₽.</b><br>Заплати <b>ровно</b> — нажимай на монеты.`;
      ov.querySelector('#mnB').innerHTML = `<div class="mn-tray" id="mnT">Положено: <b id="mnS">0</b> ₽</div><div class="mn-coins">${coins.map(c => `<button class="coin-b c${c}" data-c="${c}">${c}</button>`).join('')}</div>
        <div class="mn-act"><button class="btn ghost" data-m="reset">Забрать всё</button><button class="btn primary" data-m="pay">Оплатить</button></div>`;
    } else {
      const price = 5 + Math.floor(Math.random() * 90), give = price < 50 ? 50 : 100, ch = give - price;
      task = { t: 'change', ch };
      const opts = new Set([ch]); while (opts.size < 4) { const v = ch + U.rnd([-10, 10, -1, 1, 5, -5]); if (v > 0) opts.add(v); }
      ov.querySelector('#mnQ').innerHTML = `<span class="mn-good">${g[0]}</span><b>${U.cap(g[1])} стоит ${price} ₽.</b><br>Продавцу дали ${give} ₽. Какая будет сдача?`;
      ov.querySelector('#mnB').innerHTML = `<div class="ck-opts">${U.shuffle([...opts]).map(v => `<button class="btn big" data-ch="${v}">${v} ₽</button>`).join('')}</div>`;
    }
  };
  const done = ok => {
    lock = true;
    if (ok) { score++; Sound.play('coin'); } else Sound.play('wrong');
    setTimeout(() => { k++; if (k < 8) show(); else gFinish(ov, 'money', '🪙', `Правильно: ${score} из 8`, score, 5 + score * 3); }, ok ? 900 : 1900);
  };
  ov.querySelector('#mnB').addEventListener('click', ev => {
    if (lock) return;
    const c = ev.target.closest('[data-c]'), m = ev.target.closest('[data-m]'), ch = ev.target.closest('[data-ch]');
    if (c) { paid.push(+c.dataset.c); Sound.play('tap'); ov.querySelector('#mnS').textContent = sum(); return; }
    if (m && m.dataset.m === 'reset') { paid = []; ov.querySelector('#mnS').textContent = 0; return; }
    if (m && m.dataset.m === 'pay') {
      const ok = sum() === task.price;
      ov.querySelector('#mnT').innerHTML = ok ? `✅ Ровно ${task.price} ₽!` : `❌ Положено ${sum()} ₽, а нужно ${task.price} ₽`;
      ov.querySelector('#mnT').className = 'mn-tray ' + (ok ? 'ok' : 'bad');
      done(ok); return;
    }
    if (ch) {
      const ok = +ch.dataset.ch === task.ch;
      ch.classList.add(ok ? 'right' : 'wrong');
      if (!ok) ov.querySelector(`[data-ch="${task.ch}"]`).classList.add('right');
      done(ok);
    }
  });
  show();
}

/* ---------- 8. Части речи: разложи по корзинкам ---------- */
const POS_WORDS = {
  n: ['кошка', 'дом', 'книга', 'мяч', 'река', 'школа', 'друг', 'солнце', 'лес', 'окно', 'стол', 'птица', 'снег', 'цветок', 'машина'],
  v: ['бежать', 'читает', 'рисовать', 'поёт', 'прыгать', 'играет', 'думать', 'летит', 'писать', 'спит', 'плавать', 'смотрит', 'строит', 'гуляет'],
  a: ['красный', 'весёлый', 'большой', 'быстрая', 'тёплое', 'зелёный', 'смешной', 'умный', 'высокая', 'синее', 'мягкий', 'добрый', 'вкусный', 'новая'],
};
function gamePos() {
  const list = U.shuffle(Object.entries(POS_WORDS).flatMap(([p, ws]) => U.sample(ws, 4).map(w => [w, p])));
  let k = 0, score = 0, lock = false;
  const ov = openGameOverlay(gTop('Куда положить слово?', `<b id="gScore">1</b> / ${list.length}`) + `<div class="g-area pos-area"><div class="pos-word" id="pwW"></div><div class="pos-baskets" id="pwB">
    <button class="pos-b" data-p="n"><span>🧺</span><b>Кто? Что?</b><small>существительное</small></button>
    <button class="pos-b" data-p="v"><span>🧺</span><b>Что делать?<br>Что делает?</b><small>глагол</small></button>
    <button class="pos-b" data-p="a"><span>🧺</span><b>Какой? Какая?</b><small>прилагательное</small></button></div></div>`);
  const show = () => { ov.querySelector('#gScore').textContent = k + 1; const w = ov.querySelector('#pwW'); w.textContent = list[k][0]; w.className = 'pos-word'; lock = false; };
  ov.querySelector('#pwB').addEventListener('click', ev => {
    const b = ev.target.closest('.pos-b'); if (!b || lock) return;
    lock = true;
    const ok = b.dataset.p === list[k][1];
    const w = ov.querySelector('#pwW');
    if (ok) { score++; Sound.play('right'); w.classList.add('fly'); }
    else { Sound.play('wrong'); w.classList.add('shake'); w.innerHTML = `${list[k][0]} <small>— ${POS[list[k][1]].toLowerCase()}</small>`; }
    setTimeout(() => { k++; if (k < list.length) show(); else gFinish(ov, 'pos', '🧺', `Правильно: ${score} из ${list.length}`, score, 4 + score * 2); }, ok ? 700 : 1800);
  });
  show();
}

/* ---------- 9. Судоку 4×4 с картинками (уровни сохраняются) ---------- */
function gameSudoku() {
  const lvlN = S.gameProg.sudoku || 1;
  const pics = U.rnd([['🍎', '🍌', '🍇', '🍓'], ['🐱', '🐶', '🐰', '🐻'], ['⭐', '🌙', '☀️', '☁️'], ['🔴', '🔵', '🟡', '🟢']]);
  /* решение: перестановки строк/столбцов внутри блоков и замена символов от базового */
  const base = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
  const perm = U.shuffle([0, 1, 2, 3]);
  let rows = Math.random() < 0.5 ? [0, 1, 2, 3] : [1, 0, 3, 2], cols = Math.random() < 0.5 ? [0, 1, 2, 3] : [0, 1, 3, 2];
  if (Math.random() < 0.5) rows = [rows[2], rows[3], rows[0], rows[1]];
  const sol = rows.map(r => cols.map(c => perm[base[r][c]]));
  const blanks = Math.min(11, 4 + lvlN);
  const cells = U.shuffle([...Array(16).keys()]).slice(0, blanks);
  const grid = sol.map(r => r.slice());
  cells.forEach(i => { grid[i >> 2][i & 3] = -1; });
  const fixed = grid.map(r => r.map(v => v >= 0));
  let pick = 0, mist = 0;
  const ov = openGameOverlay(gTop(`Судоку · уровень ${lvlN}`, `Ошибок: <b id="gScore">0</b>`) + `<div class="g-area sudoku-area"><p class="small sd-hint">В каждой строке, столбце и квадрате 2×2 — все 4 картинки, без повторов.</p><div class="sd-grid" id="sdG"></div><div class="sd-pal" id="sdP">${pics.map((p, i) => `<button class="sd-pick ${i === 0 ? 'on' : ''}" data-p="${i}">${p}</button>`).join('')}</div><p class="small">Выбери картинку внизу и нажми на пустую клетку.</p></div>`);
  const draw = () => {
    ov.querySelector('#sdG').innerHTML = grid.map((r, y) => r.map((v, x) => `<button class="sd-c ${fixed[y][x] ? 'fx' : ''} ${x === 1 ? 'br' : ''} ${y === 1 ? 'bb' : ''}" data-x="${x}" data-y="${y}">${v >= 0 ? pics[v] : ''}</button>`).join('')).join('');
  };
  ov.querySelector('#sdP').addEventListener('click', ev => {
    const b = ev.target.closest('.sd-pick'); if (!b) return;
    pick = +b.dataset.p; ov.querySelectorAll('.sd-pick').forEach(x => x.classList.toggle('on', x === b)); Sound.play('tap');
  });
  ov.querySelector('#sdG').addEventListener('click', ev => {
    const c = ev.target.closest('.sd-c'); if (!c) return;
    const x = +c.dataset.x, y = +c.dataset.y;
    if (fixed[y][x]) return;
    if (sol[y][x] !== pick) { mist++; ov.querySelector('#gScore').textContent = mist; Sound.play('wrong'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); return; }
    grid[y][x] = pick; fixed[y][x] = true; Sound.play('right'); draw();
    if (grid.every(r => r.every(v => v >= 0))) {
      S.gameProg.sudoku = lvlN + 1; save();
      gFinish(ov, 'sudoku', '🧮', `Уровень ${lvlN} пройден!`, lvlN, 8 + lvlN * 2, `<p>Ошибок: ${mist}. Следующий раз — уровень ${lvlN + 1}.</p>`);
    }
  });
  draw();
}

/* ---------- 10. Лабиринт (уровни сохраняются) ---------- */
function gameMaze() {
  let lvlN = S.gameProg.maze || 1;
  const ov = openGameOverlay(gTop(`Лабиринт · уровень <b id="mzL">${lvlN}</b>`, `Шаги: <b id="gScore">0</b>`) + `<div class="g-area maze-area"><div class="mz" id="mz"></div>
    <div class="mz-pad"><button data-d="0,-1">⬆️</button><div><button data-d="-1,0">⬅️</button><button data-d="1,0">➡️</button></div><button data-d="0,1">⬇️</button></div><p class="small">Нажимай стрелки или проводи пальцем по лабиринту.</p></div>`);
  let n, wallsR, wallsB, px, py, steps, done;
  const pet = PET_SPECIES[S.pet.species] ? { dragon: '🐲', cat: '🐱', bunny: '🐰' }[S.pet.species] : '🐾';
  const build = () => {
    n = Math.min(12, 4 + lvlN);
    wallsR = Array.from({ length: n }, () => Array(n).fill(true));
    wallsB = Array.from({ length: n }, () => Array(n).fill(true));
    const seen = Array.from({ length: n }, () => Array(n).fill(false));
    const st = [[0, 0]]; seen[0][0] = true;
    while (st.length) {
      const [x, y] = st[st.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !seen[b][a]);
      if (!nb.length) { st.pop(); continue; }
      const [a, b, dx, dy] = U.rnd(nb);
      if (dx === 1) wallsR[y][x] = false; if (dx === -1) wallsR[y][a] = false;
      if (dy === 1) wallsB[y][x] = false; if (dy === -1) wallsB[b][x] = false;
      seen[b][a] = true; st.push([a, b]);
    }
    px = 0; py = 0; steps = 0; done = false;
    ov.querySelector('#mzL').textContent = lvlN; ov.querySelector('#gScore').textContent = 0;
    draw();
  };
  const draw = () => {
    const mz = ov.querySelector('#mz');
    mz.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    mz.innerHTML = Array.from({ length: n * n }, (_, i) => { const x = i % n, y = Math.floor(i / n);
      return `<div class="mz-c ${wallsR[y][x] ? 'r' : ''} ${wallsB[y][x] ? 'b' : ''} ${x === 0 ? 'l' : ''} ${y === 0 ? 't' : ''}">${x === px && y === py ? pet : x === n - 1 && y === n - 1 ? '🍎' : ''}</div>`; }).join('');
  };
  const go = (dx, dy) => {
    if (done) return;
    if (dx === 1 && wallsR[py][px]) return bonk(); if (dx === -1 && (px === 0 || wallsR[py][px - 1])) return bonk();
    if (dy === 1 && wallsB[py][px]) return bonk(); if (dy === -1 && (py === 0 || wallsB[py - 1][px])) return bonk();
    px += dx; py += dy;
    if (px < 0 || py < 0 || px >= n || py >= n) { px -= dx; py -= dy; return bonk(); }
    steps++; ov.querySelector('#gScore').textContent = steps; Sound.play('tap'); draw();
    if (px === n - 1 && py === n - 1) {
      done = true; Sound.play('star');
      S.gameProg.maze = lvlN + 1; save();
      gFinish(ov, 'maze', '🌀', `Уровень ${lvlN} пройден!`, lvlN, 8 + lvlN * 2, `<p>Шагов: ${steps}. Следующий раз — уровень ${lvlN + 1}.</p>`);
    }
  };
  const bonk = () => { const mz = ov.querySelector('#mz'); mz.classList.remove('shake'); void mz.offsetWidth; mz.classList.add('shake'); Sound.play('wrong'); };
  ov.querySelector('.mz-pad').addEventListener('click', ev => { const b = ev.target.closest('[data-d]'); if (b) { const [dx, dy] = b.dataset.d.split(',').map(Number); go(dx, dy); } });
  let sw = null;
  const mzEl = ov.querySelector('#mz');
  mzEl.addEventListener('pointerdown', e => { sw = { x: e.clientX, y: e.clientY }; });
  mzEl.addEventListener('pointermove', e => {
    if (!sw) return;
    const cell = mzEl.clientWidth / n, dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.abs(dx) > cell * 0.7 || Math.abs(dy) > cell * 0.7) { if (Math.abs(dx) > Math.abs(dy)) go(Math.sign(dx), 0); else go(0, Math.sign(dy)); sw = { x: e.clientX, y: e.clientY }; }
  });
  window.addEventListener('pointerup', () => { sw = null; });
  ov._keys = e => { const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key]; if (m && document.body.contains(ov)) { e.preventDefault(); go(...m); } };
  document.addEventListener('keydown', ov._keys);
  build();
}

const GAME_FN = {
  catch: gameCatch, mathballoons: gameMathBalloons, word: gameWord, listen: gameListen, simon: gameSimon,
  clock: gameClock, money: gameMoney, pos: gamePos, sudoku: gameSudoku, maze: gameMaze,
  balloons: () => gameBalloons(), memory: () => gameMemory(),
};
