'use strict';
/* ============================================================
   Букваландия — комната питомца
   Подарки по размеру питомца (пол / стена / воздух), перетаскивание пальцем,
   питомец ходит и играет с подарками (по нажатию и сам), касания, мяч, прятки, сон.
   Координаты комнаты — условные единицы 640×380; на экране комната масштабируется.
   ============================================================ */

const ROOM_W = 640, ROOM_H = 380, FLOOR_Y = 250, FOOT_MIN = 262, FOOT_MAX = 372;
const PET_BOX = 170;   // размер рисунка питомца в единицах комнаты
const depthK = y => 0.82 + 0.18 * Math.max(0, Math.min(1, (y - FOOT_MIN) / (FOOT_MAX - FOOT_MIN)));
const wait = ms => new Promise(r => setTimeout(r, ms));

const Room = {
  root: null, inner: null, petEl: null, s: 1, gen: 0,
  pet: { x: 320, y: 352, dir: 1 },
  busy: false, idleT: null, hide: null, taps: [],

  /* ---------- Положение предметов ---------- */
  pos(i) {
    const p = S.room.pos[i.id];
    return p ? { x: p[0], y: p[1] } : { x: i.x, y: i.y };
  },
  decor() { return [...SHOP, ...EXCLUSIVE, ...BOSS_TOYS].filter(i => i.cat === 'decor' && S.owned[i.id] && !S.hidden[i.id]); },
  night() {
    const from = S.settings.sleepFrom;
    if (!from) return false;
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    return h >= from || h < 7;
  },

  itemHTML(i) {
    const p = Room.pos(i);
    const inner = i.tank ? `<div class="tank" style="width:${i.h}px;height:${Math.round(i.h * 0.72)}px"><span class="fish f1">🐠</span><span class="fish f2">🐟</span><span class="fish f3">🐡</span><i class="bub b1"></i><i class="bub b2"></i></div>` : i.icon;
    return `<div class="ri z-${i.zone}" data-id="${i.id}" style="${Room.itemStyle(i, p)}">${inner}</div>`;
  },
  itemStyle(i, p) {
    const k = i.zone === 'floor' ? depthK(p.y) : 1;
    const z = i.zone === 'floor' ? Math.round(p.y) : i.zone === 'wall' ? 5 : 600;
    return `left:${p.x}px;top:${p.y}px;font-size:${i.h}px;z-index:${z};--k:${k.toFixed(3)}`;
  },

  html() {
    const night = Room.night();
    return `<div class="room ${night ? 'night' : ''}" id="room"><div class="room-in" id="roomIn">
      <div class="wall"></div><div class="window"><div class="sky">${night ? '<span class="moon">🌙</span><i class="st s1"></i><i class="st s2"></i><i class="st s3"></i>' : '<span class="sun">☀️</span><span class="cloud">☁️</span>'}</div></div>
      <div class="floor"></div>
      ${Room.decor().map(Room.itemHTML).join('')}
      <div class="rpet" id="rpet"><div class="rp-flip"><div class="rp-act">${petSVG({ uid: 'rp', mood: night && petStage() > 0 ? 'sleep' : undefined })}</div></div></div>
      </div><div class="pet-say" id="petSay"></div>
      ${night ? '<div class="night-note">🌙 Ночь — питомец спит</div>' : ''}</div>`;
  },

  /* ---------- Подключение после отрисовки экрана ---------- */
  mount() {
    Room.unmount();
    Room.gen++;
    Room.root = $('#room'); Room.inner = $('#roomIn'); Room.petEl = $('#rpet');
    if (!Room.root) return;
    Room.busy = false; Room.hide = null;
    Room.fit();
    const bed = ITEMS.bed && S.owned.bed && !S.hidden.bed ? Room.pos(ITEMS.bed) : null;
    if (Room.night() && petStage() > 0 && bed) { Room.pet.x = bed.x; Room.pet.y = bed.y - 2; Room.pet.onTop = true; } else Room.pet.onTop = false;
    if (petStage() === 0) { Room.pet.x = 320; Room.pet.y = 352; }
    Room.place(0);
    Room.root.addEventListener('pointerdown', Room.onDown);
    Room.root.addEventListener('pointermove', Room.onLook);
    window.addEventListener('resize', Room.fit);
    Room.scheduleIdle();
    if (!Room.night()) Room.greet();
    Room.root.classList.toggle('sleeping', Room.night() && petStage() > 0);
  },
  unmount() {
    clearTimeout(Room.idleT);
    window.removeEventListener('resize', Room.fit);
    Room.gen++;
    Room.root = null;
  },
  alive(g) { return g === Room.gen && Room.root && document.body.contains(Room.root); },
  fit() {
    if (!Room.root) return;
    Room.s = Math.min(1.6, Room.root.clientWidth / ROOM_W);
    Room.inner.style.transform = `scale(${Room.s})`;
    Room.root.style.height = Math.round(ROOM_H * Room.s) + 'px';
  },

  /* ---------- Питомец: положение, ходьба, настроение ---------- */
  place(ms) {
    const p = Room.pet, el = Room.petEl;
    if (!el) return;
    el.style.transition = ms ? `left ${ms}ms linear, top ${ms}ms linear` : 'none';
    el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
    el.style.zIndex = Math.round(p.y) + (p.onTop ? 60 : 1);
    el.style.setProperty('--k', depthK(p.y).toFixed(3));
    el.querySelector('.rp-flip').style.transform = `scaleX(${p.dir})`;
  },
  async walkTo(x, y, g) {
    const p = Room.pet;
    x = Math.max(60, Math.min(ROOM_W - 60, x)); y = Math.max(FOOT_MIN, Math.min(FOOT_MAX + 4, y));
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < 4) return true;
    if (Math.abs(x - p.x) > 4) p.dir = x > p.x ? 1 : -1;
    p.onTop = false;
    const ms = Math.max(250, d / 0.17);
    p.x = x; p.y = y;
    Room.anim('a-walk');
    Room.place(ms);
    await wait(ms);
    if (!Room.alive(g)) return false;
    Room.anim('');
    return true;
  },
  draw(mood, extra = {}) {
    if (!Room.petEl) return;
    Room.petEl.querySelector('.rp-act').innerHTML = petSVG(Object.assign({ uid: 'rp', mood }, extra));
  },
  anim(cls) {
    const a = Room.petEl && Room.petEl.querySelector('.rp-act');
    if (!a) return;
    a.className = 'rp-act';
    if (cls) { void a.offsetWidth; a.classList.add(cls); }
  },
  say(text, voice = false, whisper = false) {
    const b = $('#petSay');
    if (!b || !Room.root) return;
    const k = depthK(Room.pet.y);
    const top = (Room.pet.y - PET_BOX * 1.02 * k) * Room.s;
    b.textContent = text;
    /* в прятках облачко — посередине сверху, чтобы не выдать, где спрятался питомец */
    const x = Room.hide ? Room.root.clientWidth / 2 : Room.pet.x * Room.s;
    b.style.left = Math.max(70, Math.min(Room.root.clientWidth - 70, x)) + 'px';
    b.style.top = (Room.hide ? 60 : Math.max(26, top)) + 'px';
    b.className = 'pet-say show';
    clearTimeout(b._t);
    b._t = setTimeout(() => { b.className = 'pet-say'; }, Math.max(2200, text.length * 70));
    if (voice) Speech.sayPet(text, petStage(), whisper);
  },
  fx(ch, x, y, cls = 'fx-rise', life = 1400, size = 30) {
    if (!Room.inner) return;
    const e = document.createElement('span');
    e.className = 'rfx ' + cls; e.textContent = ch;
    e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.fontSize = size + 'px';
    e.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
    Room.inner.appendChild(e);
    setTimeout(() => e.remove(), life);
  },
  headY() { return Room.pet.y - PET_BOX * 0.7 * depthK(Room.pet.y); },
  hearts(n = 3) { for (let i = 0; i < n; i++) setTimeout(() => Room.fx(U.rnd(['❤️', '💖', '💕']), Room.pet.x + Math.random() * 60 - 30, Room.headY()), i * 180); },
  itemEl(id) { return Room.inner && Room.inner.querySelector(`.ri[data-id="${id}"]`); },
  itemFx(id, cls, ms = 1200) {
    const e = Room.itemEl(id); if (!e) return;
    e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls);
    setTimeout(() => e.classList.remove(cls), ms);
  },

  /* ---------- Приветствие раз в день ---------- */
  greet() {
    if (S.greetDay === U.dayKey() || petStage() === 0) return;
    S.greetDay = U.dayKey(); save();
    const n = S.name || 'друг';
    const t = U.rnd([`Привет, ${n}! Ура, мы снова вместе!`, `${n}, привет! Как здорово, что ты здесь!`, `Привет, ${n}! Поиграем?`]);
    setTimeout(() => { if (Room.root) { Room.draw('love'); Room.anim('a-jump'); Room.hearts(); Room.say(t, true); setTimeout(() => Room.root && Room.draw(), 1800); } }, 400);
  },

  /* ---------- Сам по себе: раз в 14–22 секунды что-нибудь делает ---------- */
  scheduleIdle() {
    clearTimeout(Room.idleT);
    Room.idleT = setTimeout(Room.idle, 14000 + Math.random() * 8000);
  },
  async idle() {
    const g = Room.gen;
    if (!Room.alive(g)) return;
    if (Room.busy || Room.drag || Room.hide || modalOpen > 0 || $('.overlay') || document.visibilityState !== 'visible' || petStage() === 0 || Room.night()) { Room.scheduleIdle(); return; }
    const toys = Room.decor().filter(i => i.play && petStage() >= (i.ps || 1));
    if (toys.length && Math.random() < 0.65) await Room.playWith(U.rnd(toys).id, false);
    else await Room.idleAct();
    if (Room.alive(g)) Room.scheduleIdle();
  },
  async idleAct() {
    const g = Room.gen;
    Room.busy = true;
    const r = Math.random();
    if (r < 0.25) {
      await Room.walkTo(80 + Math.random() * 480, FOOT_MIN + 20 + Math.random() * 90, g);
      if (Room.alive(g)) Room.say(U.rnd(['Ля-ля-ля…', 'Прогуляюсь немножко!', 'Топ-топ-топ!']));
    } else if (r < 0.45) {
      Room.anim('a-dance'); Room.say(U.rnd(['Танцуем!', 'Раз-два, раз-два!', 'Я танцую!']));
      Room.melody('dance'); await wait(2200);
    } else if (r < 0.6) {
      Room.draw('sleep'); Room.say('Ааа-ах… Что-то спать хочется.'); await wait(1600);
    } else if (r < 0.8) {
      /* бабочка пролетает — питомец следит и пытается поймать */
      const b = document.createElement('span'); b.className = 'rfx butterfly'; b.textContent = '🦋';
      b.style.left = '-30px'; b.style.top = '120px'; Room.inner.appendChild(b);
      setTimeout(() => b.remove(), 4200);
      Room.draw('wow'); Room.say('Ой, бабочка!');
      await wait(1200); if (!Room.alive(g)) return;
      Room.anim('a-jump'); await wait(700);
      Room.say('Лети, лети!');
      await wait(1200);
    } else {
      Room.anim('a-wave'); Room.say(U.rnd(['Привет!', 'Эй, я здесь!', 'Поиграй со мной!']));
      await wait(1800);
    }
    if (Room.alive(g)) { Room.draw(); Room.anim(''); }
    Room.busy = false;
  },

  /* ---------- Игра с подарком ---------- */
  spotFor(i) {
    const p = Room.pos(i), P = Room.pet;
    if (i.zone !== 'floor') return { x: p.x + (P.x < p.x ? -40 : 40), y: 345 };
    if (i.play === 'sit' || i.play === 'sleep') return { x: p.x, y: p.y - 2, top: true };
    if (i.play === 'bounce') return { x: p.x, y: p.y + 1, top: true };
    const w = i.h * depthK(p.y) * 0.55 + 45;
    let side = P.x < p.x ? -1 : 1;
    if (p.x + side * w < 50 || p.x + side * w > ROOM_W - 50) side = -side;
    return { x: p.x + side * w, y: Math.max(FOOT_MIN, Math.min(FOOT_MAX, p.y + 4)) };
  },
  async playWith(id, byChild = true) {
    const i = ITEMS[id];
    if (!i || !Room.root) return;
    const st = petStage();
    if (st === 0) { Room.itemFx(id, 'wiggle'); return; }
    if (Room.night()) { Room.itemFx(id, 'wiggle'); Room.say('Тсс… Сейчас ночь, игрушки тоже спят.', byChild, true); return; }
    if (Room.busy) return;
    if (st < (i.ps || 1)) { Room.itemFx(id, 'wiggle'); Room.say('Это пока сложно для меня. Подрасту — научусь!', byChild); return; }
    const g = Room.gen;
    Room.busy = true;
    clearTimeout(Room.idleT);
    const spot = Room.spotFor(i);
    const ok = await Room.walkTo(spot.x, spot.y, g);
    if (!ok) { Room.busy = false; return; }
    const ip = Room.pos(i);
    Room.pet.dir = ip.x >= Room.pet.x ? 1 : -1;
    if (spot.top) { Room.pet.onTop = true; Room.pet.x = spot.x; Room.pet.y = spot.y; }
    Room.place(200);
    await Room.act(i, ip, byChild, g);
    if (Room.alive(g)) { Room.draw(); Room.anim(''); Room.pet.onTop = false; Room.place(0); }
    S.counters.play = (S.counters.play || 0) + 1;
    if (S.counters.play % 10 === 0) { checkAch(); save(); setTimeout(flushQueue, 300); }
    Room.busy = false;
    Room.scheduleIdle();
  },
  async act(i, ip, v, g) {
    const say = (t) => Room.say(t, v);
    const hy = Room.headY();
    switch (i.play) {
      case 'kick': {
        Room.anim('a-kick'); say(U.rnd(['Пас!', 'Гол!', 'Лови мяч!', 'Ура, мячик!']));
        await wait(300);
        Room.rollBall(i, Room.pet.dir * (90 + Math.random() * 80));
        Sound.play('pop');
        await wait(1500); break;
      }
      case 'hug': Room.draw('love'); Room.anim('a-jump'); Room.itemFx(i.id, 'wiggle'); Room.hearts(4);
        say(U.rnd([i.id === 'teddy' ? 'Обнимашки с мишкой!' : 'Обнимашки с другом!', 'Я тебя люблю, дружок!', 'Какой мягкий!'])); Sound.play('pet'); await wait(2200); break;
      case 'water': Room.anim('a-kick'); say('Полью цветочек!');
        for (let n = 0; n < 6; n++) setTimeout(() => Room.fx('💧', ip.x + Math.random() * 30 - 15, ip.y - i.h, 'fx-fall', 900, 18), n * 150);
        await wait(1100); Room.itemFx(i.id, 'grow', 1000); Room.fx('✨', ip.x, ip.y - i.h, 'fx-rise'); say('Расти большой!'); await wait(1300); break;
      case 'read': Room.draw('happy'); Room.anim('a-sit'); Room.fx('📖', Room.pet.x + Room.pet.dir * 20, Room.pet.y - 55, 'fx-hold', 2800, 40);
        say(U.rnd(['Жили-были буквы…', 'Ой, какая интересная сказка!', 'Читаю по слогам: ко-ло-бок!'])); await wait(2900); break;
      case 'music': {
        Room.anim('a-dance'); say(U.rnd(['Музыка!', 'Тра-ля-ля!', 'Послушай мою песенку!']));
        Room.itemFx(i.id, 'wiggle', 2400);
        for (let n = 0; n < 7; n++) setTimeout(() => Room.fx(U.rnd(['🎵', '🎶', '♪']), ip.x + Math.random() * 50 - 25, ip.y - i.h * 0.8, 'fx-rise', 1400, 26), n * 300);
        Room.melody(i.id); await wait(2600); break;
      }
      case 'paint': {
        Room.anim('a-kick'); say('Рисую тебе картину!');
        const cols = ['🔴', '🟡', '🔵', '🟢', '🟣'];
        for (let n = 0; n < 6; n++) setTimeout(() => Room.fx(U.rnd(cols), ip.x + Math.random() * 40 - 20, ip.y - i.h * 0.7 + Math.random() * 30, 'fx-pop', 1100, 14), n * 220);
        await wait(1500); Room.fx('🖼️', ip.x, ip.y - i.h, 'fx-rise', 1600, 44); Room.draw('laugh'); say('Готово! Это мы с тобой!'); await wait(1600); break;
      }
      case 'build': Room.anim('a-jump'); say(i.id === 'castle' ? 'Строю башню!' : 'Собираю пазл!');
        for (let n = 0; n < 5; n++) setTimeout(() => Room.fx(i.id === 'castle' ? '🧱' : '🧩', ip.x + Math.random() * 40 - 20, ip.y - 20, 'fx-pop', 900, 20), n * 250);
        await wait(1500); Room.draw('laugh'); say('Получилось!'); Room.fx('⭐', ip.x, ip.y - i.h, 'fx-rise'); await wait(1300); break;
      case 'sit': Room.anim('a-bounce'); Room.draw('laugh'); say(U.rnd(['Какой мягкий диванчик!', 'Прыг-скок на диване!', 'Отдохну немножко.'])); await wait(2200);
        Room.draw('sleep'); Room.anim(''); Room.fx('💤', Room.pet.x + 30, hy, 'fx-rise', 1600); await wait(1600); break;
      case 'sleep': Room.draw('sleep'); Room.anim('a-sit'); say('Посплю минутку…');
        for (let n = 0; n < 3; n++) setTimeout(() => Room.fx('💤', Room.pet.x + 30, Room.headY(), 'fx-rise', 1500, 26), n * 800);
        await wait(3000); Room.draw('happy'); say('Ах, как хорошо выспаться!'); await wait(1400); break;
      case 'float': {
        const e = Room.itemEl(i.id);
        Room.draw('laugh'); say('Ух ты, я лечу!');
        if (e) { e.style.transition = 'left .5s, top .5s'; e.style.left = Room.pet.x + 'px'; e.style.top = (Room.pet.y - 170) + 'px'; }
        await wait(500); Room.anim('a-float'); await wait(2400);
        if (e) { const p = Room.pos(i); e.style.left = p.x + 'px'; e.style.top = p.y + 'px'; setTimeout(() => { e.style.transition = ''; }, 600); }
        break;
      }
      case 'look': Room.draw('wow'); Room.itemFx(i.id, 'glow', 2400);
        say({ fish: 'Привет, рыбки! Буль-буль!', telescope: 'Вижу Луну и звёзды!', picture: 'Какая красивая картина!', kite: 'Как красиво развеваются!', x_planet: 'Это Сатурн! У него кольца!', x_crystal: 'Шар показывает… пятёрку!' }[i.id] || 'Как интересно!');
        if (i.id === 'telescope') ['🌙', '⭐', '🪐'].forEach((c, n) => setTimeout(() => Room.fx(c, ip.x + 30, ip.y - i.h - 10, 'fx-rise', 1500), n * 400));
        else Room.fx('✨', ip.x, ip.y - (i.zone === 'floor' ? i.h : i.h / 2), 'fx-rise');
        await wait(2500); break;
      case 'ride': {
        const e = Room.itemEl(i.id);
        if (i.id === 'rocket') {
          say('Три, два, один — пуск!'); await wait(700);
          Room.petEl.classList.add('gone'); Room.itemFx(i.id, 'launch', 2600); Sound.play('level');
          await wait(2600); Room.petEl.classList.remove('gone'); Room.draw('laugh'); say('Вот это полёт! Привет из космоса!'); await wait(1600);
        } else {
          Room.pet.onTop = true; Room.pet.x = ip.x; Room.pet.y = ip.y - 2; Room.place(300);
          if (e) e.classList.add('spin'); Room.anim('a-bounce'); Room.draw('laugh'); say('Ура, карусель! Кружимся!'); Room.melody('dance');
          await wait(3000); if (e) e.classList.remove('spin');
        }
        break;
      }
      case 'wow': Room.draw('wow'); Room.anim('a-jump'); say(i.id === 'rainbowd' ? 'Радуга! Загадаем желание?' : 'Салют! Ура-а-а!');
        for (let n = 0; n < 6; n++) setTimeout(() => Room.fx(U.rnd(['✨', '🎆', '🌟']), ip.x + Math.random() * 80 - 40, ip.y - Math.random() * 40, 'fx-pop', 1000, 26), n * 200);
        await wait(2200); break;
      case 'wish': Room.draw('sleep'); Room.itemFx(i.id, 'glow', 2400); say('Загадываю желание…'); await wait(2000);
        Room.draw('love'); Room.fx('✨', ip.x, ip.y, 'fx-pop'); say('Пусть всё получится!'); await wait(1500); break;
      case 'bounce': Room.draw('laugh'); say('Прыг-скок!');
        for (let n = 0; n < 3; n++) { Room.anim('a-hop'); Sound.play('pop'); await wait(650); }
        break;
      case 'hide': say('Спрячусь в шатре!'); await wait(700); Room.petEl.classList.add('gone'); await wait(1500);
        Room.petEl.classList.remove('gone'); Room.draw('laugh'); Room.anim('a-jump'); say('Ку-ку! Вот я где!'); Sound.play('pet'); await wait(1500); break;
      default: Room.anim('a-jump'); say('Как здорово!'); await wait(1500);
    }
    void g;
  },

  /* Мяч катится и возвращается (в игре питомца) */
  rollBall(i, dx) {
    const e = Room.itemEl(i.id); if (!e) return;
    const p = Room.pos(i);
    const nx = Math.max(40, Math.min(ROOM_W - 40, p.x + dx));
    e.style.transition = 'left .7s cubic-bezier(.2,.8,.3,1)';
    e.classList.add('rolling');
    e.style.left = nx + 'px';
    setTimeout(() => { e.style.left = p.x + 'px'; }, 800);
    setTimeout(() => { e.classList.remove('rolling'); e.style.transition = ''; }, 1500);
  },

  /* Мелодии синтезатором (без файлов) */
  melody(id) {
    if (!Sound.enabled) return;
    Sound.init(); const c = Sound.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    const N = { C: 523, D: 587, E: 659, F: 698, G: 784, A: 880, B: 988, c: 1046 };
    const song = {
      piano: [['C', .3], ['E', .3], ['G', .3], ['c', .5], ['G', .3], ['E', .3], ['C', .6]],
      guitar: [['G', .25], ['B', .25], ['D', .25], ['G', .25], ['E', .25], ['C', .25], ['D', .5]],
      drum: 'drum', dance: [['E', .2], ['E', .2], ['G', .2], ['E', .2], ['D', .2], ['C', .4]],
    }[id] || [['C', .3], ['D', .3], ['E', .3], ['C', .4]];
    if (song === 'drum') { [0, .3, .6, .75, .9, 1.2, 1.5].forEach(t => Sound.tone(110, t, 0.15, 'sine', 0.35)); return; }
    let t = 0;
    song.forEach(([n, d]) => { Sound.tone(N[n], t, d * 0.95, id === 'guitar' ? 'sawtooth' : 'triangle', id === 'guitar' ? 0.06 : 0.13); t += d; });
  },

  /* ---------- Касания: питомец, предметы, пол ---------- */
  toRoom(ev) {
    const r = Room.inner.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / Room.s, y: (ev.clientY - r.top) / Room.s };
  },
  onDown(ev) {
    if (!Room.inner || ev.button > 0) return;
    Sound.init();
    const it = ev.target.closest('.ri');
    const onPet = ev.target.closest('.rpet');
    const start = Room.toRoom(ev);
    if (it) { Room.startDrag(ev, it, start); return; }
    if (onPet) { Room.petTouch(ev, start); return; }
    /* пустой пол — питомец идёт туда */
    if (start.y > FLOOR_Y && !Room.busy && !Room.hide && petStage() > 0 && !Room.night()) {
      const g = Room.gen;
      Room.busy = true;
      Room.walkTo(start.x, start.y + 10, g).then(() => { Room.busy = false; Room.scheduleIdle(); });
    }
  },
  startDrag(ev, el, start) {
    const i = ITEMS[el.dataset.id];
    if (!i) return;
    ev.preventDefault();
    const p0 = Room.pos(i);
    const off = { x: p0.x - start.x, y: p0.y - start.y };
    const trail = [{ x: start.x, y: start.y, t: performance.now() }];
    let moved = false;
    try { el.setPointerCapture(ev.pointerId); } catch (e) { /* */ }
    const move = e2 => {
      const q = Room.toRoom(e2);
      if (!moved && Math.hypot(q.x - start.x, q.y - start.y) < 8) return;
      if (!moved) { moved = true; Room.drag = true; el.classList.add('dragging'); }
      trail.push({ x: q.x, y: q.y, t: performance.now() }); if (trail.length > 6) trail.shift();
      const np = Room.clampPos(i, q.x + off.x, q.y + off.y);
      el.style.cssText = Room.itemStyle(i, np);
      el._p = np;
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.classList.remove('dragging');
      Room.drag = false;
      if (!moved) { if (Room.hide) Room.seek(i.id); else Room.playWith(i.id, true); return; }
      const a = trail[0], b = trail[trail.length - 1], dt = Math.max(1, b.t - a.t);
      const vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
      if (i.id === 'ball' && Math.hypot(vx, vy) > 0.5 && !Room.night()) { Room.throwBall(el, el._p || p0, vx, vy); return; }
      if (el._p) { S.room.pos[i.id] = [Math.round(el._p.x), Math.round(el._p.y)]; save(); }
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  },
  clampPos(i, x, y) {
    x = Math.max(24, Math.min(ROOM_W - 24, x));
    if (i.zone === 'floor') y = Math.max(FOOT_MIN, Math.min(FOOT_MAX, y));
    else if (i.zone === 'wall') y = Math.max(i.h * 0.4, Math.min(FLOOR_Y - i.h * 0.45, y));
    else y = Math.max(i.h * 0.45, Math.min(FLOOR_Y - 20, y));
    return { x, y };
  },

  /* Бросок мяча: летит, прыгает, катится — питомец бежит и приносит обратно */
  throwBall(el, p, vx, vy) {
    const g = Room.gen;
    let x = p.x, y = p.y, h = 0, vh = Math.min(1.1, Math.max(0.35, -vy * 0.9 + 0.35));
    const ground = Math.max(FOOT_MIN + 10, Math.min(FOOT_MAX, p.y));
    vx = Math.max(-1.4, Math.min(1.4, vx));
    let last = performance.now(), bounces = 0;
    el.classList.add('rolling');
    Sound.play('pop');
    const step = now => {
      if (!Room.alive(g)) return;
      const dt = Math.min(40, now - last); last = now;
      x += vx * dt; vh -= 0.0028 * dt; h += vh * dt;
      if (h <= 0) { h = 0; if (Math.abs(vh) > 0.12) { vh = -vh * 0.5; bounces++; Sound.tone && Sound.play('tap'); } else vh = 0; vx *= 0.82; }
      if (h === 0 && vh === 0) vx *= 0.94;
      if (x < 30 || x > ROOM_W - 30) { vx = -vx * 0.6; x = Math.max(30, Math.min(ROOM_W - 30, x)); }
      el.style.left = x + 'px'; el.style.top = (ground - h) + 'px'; el.style.zIndex = Math.round(ground);
      if (Math.abs(vx) < 0.02 && h === 0 && vh === 0) { el.classList.remove('rolling'); Room.fetch(el, x, ground, g); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    if (!Room.busy && petStage() > 0) { Room.draw('wow'); Room.say(U.rnd(['Ой, мячик!', 'Сейчас поймаю!', 'Бегу-бегу!'])); }
    void bounces;
  },
  async fetch(el, x, y, g) {
    S.room.pos.ball = [Math.round(x), Math.round(y)]; save();
    if (Room.busy || petStage() === 0) return;
    Room.busy = true; clearTimeout(Room.idleT);
    const side = Room.pet.x < x ? -1 : 1;
    if (!await Room.walkTo(x + side * 50, y, g)) { Room.busy = false; return; }
    Room.pet.dir = -side; Room.place(0);
    Room.anim('a-jump'); Room.draw('laugh');
    el.style.transition = 'left .4s, top .4s'; el.style.left = (Room.pet.x - side * 20) + 'px'; el.style.top = (y - 60) + 'px';
    Room.say(U.rnd(['Есть! Поймано!', 'Ура, мячик у меня!', 'Ещё! Кидай ещё!']), true);
    await wait(900); if (!Room.alive(g)) return;
    const nx = Math.max(80, Math.min(ROOM_W - 80, Room.pet.x - side * 40));
    el.style.left = nx + 'px'; el.style.top = Math.min(FOOT_MAX, y + 6) + 'px';
    S.room.pos.ball = [Math.round(nx), Math.round(Math.min(FOOT_MAX, y + 6))]; save();
    setTimeout(() => { el.style.transition = ''; }, 500);
    S.counters.play = (S.counters.play || 0) + 1;
    await wait(600);
    if (Room.alive(g)) { Room.draw(); Room.anim(''); }
    Room.busy = false; Room.scheduleIdle();
  },

  /* Касание питомца: голова — погладить, нос — чих, живот — щекотка, ножки — прыжок; провести пальцем — мурлычет */
  petTouch(ev, start) {
    ev.preventDefault();
    const st = petStage();
    const svg = Room.petEl.querySelector('svg');
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    let sx = (ev.clientX - r.left) / r.width * 200;
    const sy = (ev.clientY - r.top) / r.height * 200;
    if (Room.pet.dir < 0) sx = 200 - sx;
    let path = 0, lastP = start, stroked = false;
    const move = e2 => {
      const q = Room.toRoom(e2);
      path += Math.hypot(q.x - lastP.x, q.y - lastP.y); lastP = q;
      if (!stroked && path > 70) { stroked = true; Room.react('stroke'); }
    };
    const up = () => {
      Room.root && Room.root.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (stroked) return;
      if (Room.hide) return;
      if (st === 0) { Room.anim('a-shake'); Sound.play('pet'); Room.say(U.rnd(['Тук-тук!', 'Скоро вылуплюсь!', 'Кто там шевелится?'])); return; }
      if (Room.night()) { Room.draw('sleep'); Room.anim('a-shake'); Room.say(U.rnd(['Тсс… Уже ночь. Пора спать!', 'Спокойной ночи… Завтра поиграем.']), true, true); return; }
      const now = Date.now();
      Room.taps = Room.taps.filter(t => now - t < 3000); Room.taps.push(now);
      if (Room.taps.length >= 5) { Room.taps = []; Room.react('dance'); return; }
      const G = Pet.GEO[st];
      const inHead = Math.hypot(sx - 100, sy - G.hy) < G.hr;
      if (inHead && Math.abs(sx - 100) < G.hr * 0.32 && sy > G.hy + G.hr * 0.12 && sy < G.hy + G.hr * 0.65) Room.react('boop');
      else if (inHead && sy < G.hy - G.hr * 0.25) Room.react('pat');
      else if (sy < G.hy - G.hr * 0.6) Room.react('ears');
      else if (inHead) Room.react('face');
      else if (sy > G.fy - 12) Room.react('feet');
      else Room.react('belly');
    };
    Room.root.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  },
  async react(kind) {
    if (Room.busy && kind !== 'stroke') return;
    const g = Room.gen;
    Room.busy = true; clearTimeout(Room.idleT);
    const hy = Room.headY();
    S.counters.play = (S.counters.play || 0) + 1;
    switch (kind) {
      case 'stroke': Room.draw('love'); Room.hearts(4); Room.say(U.rnd(['Мррр… Как приятно!', 'Ещё погладь, пожалуйста!', 'Мур-мур-мур!']), true); Room.purr(); await wait(1800); break;
      case 'pat': Room.draw('sleep'); Room.anim('a-nod'); Room.say(U.rnd(['Мррр…', 'Как приятно, когда гладят по голове!', 'Ещё-ещё!']), true); Room.purr(); Room.hearts(2); await wait(1600); break;
      case 'boop': Room.draw('wow'); Room.say('А… а… апчхи!', true); await wait(900); Room.anim('a-shake'); Sound.play('pop'); Room.fx('💨', Room.pet.x + Room.pet.dir * 30, hy + 20, 'fx-pop', 800); Room.draw('laugh'); await wait(1000); Room.say('Будь здоров, нос!'); await wait(900); break;
      case 'belly': Room.draw('laugh'); Room.anim('a-shake'); Room.say(U.rnd(['Хи-хи-хи, щекотно!', 'Ха-ха, перестань!', 'Ой, щекотка!']), true); Room.giggle(); await wait(1700); break;
      case 'ears': Room.anim('a-shake'); Room.draw('wow'); Room.say(U.rnd(['Мои ушки!', 'Ушками слышу всё-всё!']), true); await wait(1400); break;
      case 'face': Room.draw('love'); Room.say(U.rnd(['Ты мой лучший друг!', 'Пойдём учиться?', 'Давай заработаем звёзды!', 'Я горжусь тобой!']), true); Room.hearts(2); await wait(1600); break;
      case 'feet': Room.anim('a-jump'); Room.draw('laugh'); Room.say(U.rnd(['Прыг!', 'Мои пяточки!', 'Хоп-хоп!']), true); Sound.play('pop'); await wait(1100); break;
      case 'dance': Room.anim('a-dance'); Room.draw('laugh'); Room.say('Ура! Танцуем вместе!', true); Room.melody('dance'); await wait(2400); break;
    }
    if (Room.alive(g)) { Room.draw(); Room.anim(''); }
    Room.busy = false; Room.scheduleIdle();
  },
  purr() { if (!Sound.enabled) return; Sound.init(); for (let n = 0; n < 6; n++) Sound.tone(70 + (n % 2) * 12, n * 0.22, 0.2, 'sine', 0.2); },
  giggle() { if (!Sound.enabled) return; Sound.init(); [880, 990, 880, 1046, 932].forEach((f, n) => Sound.tone(f, n * 0.12, 0.1, 'triangle', 0.08)); },

  /* Глаза следят за пальцем */
  onLook(ev) {
    if (!Room.petEl || petStage() === 0) return;
    const pu = Room.petEl.querySelector('.pupils');
    if (!pu) return;
    const r = Room.petEl.getBoundingClientRect();
    let dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height * 0.42);
    if (Room.pet.dir < 0) dx = -dx;
    const d = Math.hypot(dx, dy) || 1, m = Math.min(3.2, d / 30);
    pu.setAttribute('transform', `translate(${(dx / d * m).toFixed(1)} ${(dy / d * m).toFixed(1)})`);
  },

  /* ---------- Прятки ---------- */
  spots() { return Room.decor().filter(i => i.zone === 'floor' && i.h >= 70); },
  async hideSeek() {
    if (Room.busy || Room.hide || !Room.root) return;
    const sp = Room.spots();
    if (sp.length < 2) { Room.say('Для пряток нужно хотя бы два больших подарка в домике!', true); return; }
    const g = Room.gen;
    Room.busy = true; clearTimeout(Room.idleT);
    Room.say('Играем в прятки! Закрой глаза… Раз, два, три!', true);
    const cover = document.createElement('div'); cover.className = 'room-cover'; cover.innerHTML = '<span>🙈</span><b>Раз… два… три…</b>';
    Room.root.appendChild(cover);
    await wait(2600); if (!Room.alive(g)) return;
    const spot = U.rnd(sp), p = Room.pos(spot);
    Room.pet.x = p.x; Room.pet.y = p.y - 8; Room.pet.onTop = false; Room.place(0);
    Room.petEl.style.zIndex = Math.round(p.y) - 1;
    Room.petEl.classList.add('hidden');
    cover.remove();
    Room.hide = { id: spot.id, tries: 0 };
    Room.say('Ищи меня! Нажимай на подарки.');
    Room.busy = false;
  },
  async seek(id) {
    const h = Room.hide;
    if (!h) return;
    h.tries++;
    if (id !== h.id) {
      Room.itemFx(id, 'wiggle');
      const p = Room.pos(ITEMS[id]);
      Room.fx('❌', p.x, p.y - ITEMS[id].h * 0.6, 'fx-pop', 800, 26);
      Sound.play('tap');
      if (h.tries === 3) Room.say(ITEMS[h.id].h >= 130 ? 'Подсказка: я за чем-то очень большим!' : 'Подсказка: я за чем-то не очень большим!');
      return;
    }
    const g = Room.gen;
    Room.hide = null;
    Room.busy = true;
    Room.petEl.classList.remove('hidden');
    Room.pet.y = Math.min(FOOT_MAX, Room.pet.y + 30); Room.pet.x += 40; Room.place(300);
    Room.draw('laugh'); Room.anim('a-jump'); Sound.play('star'); confetti(30);
    Room.say(h.tries === 1 ? 'С первого раза! Вот это глаза!' : 'Ку-ку! Вот я где!', true);
    S.counters.play = (S.counters.play || 0) + 1;
    await wait(2000);
    if (Room.alive(g)) { Room.draw(); Room.anim(''); }
    Room.busy = false; Room.scheduleIdle();
  },

  /* ---------- Покормить: еда летит питомцу в рот ---------- */
  async eat(food) {
    if (!Room.root) return;
    const g = Room.gen;
    Room.busy = true; clearTimeout(Room.idleT);
    Room.fx(food.icon, Room.pet.x + Room.pet.dir * 70, Room.headY() - 30, 'fx-eat', 900, 40);
    await wait(800); if (!Room.alive(g)) return;
    Room.draw('chew'); Room.anim('a-nod');
    Sound.play('pop');
    await wait(1100); if (!Room.alive(g)) return;
    Room.draw('love'); Room.hearts(2);
    Room.say(U.rnd(['Ням-ням! Вкусно! Спасибо!', 'Ммм, объедение!', 'Вкуснятина! Спасибо!']), true);
    await wait(1500);
    if (Room.alive(g)) Room.draw();
    Room.busy = false; Room.scheduleIdle();
  },
};
