'use strict';
/* ============================================================
   Букваландия — двор и жизнь питомца (этап 4, 20.11)
   Двор: огород (посадить — полить — собрать), качели, яблоня, клад, погода дня и время суток.
   Жизнь: настроение и мини-желания (без наказаний и таймеров), память об успехах ребёнка.
   Полезные подарки: коллекции (набор → альбом → представление), мольберт → раскраска, книжка → сказки.
   Сцена двора рисуется тем же Room (Room.scene = 'yard'): ходьба, касания, облачко речи — общие.
   ============================================================ */

/* Овощи с огорода — еда питомца (в магазине не продаются) */
const GARDEN_FOOD = [
  { id: 'tomato', cat: 'food', icon: '🍅', name: 'Помидор', price: 0, sat: 15, lvl: 0, noShop: true },
  { id: 'strawberry', cat: 'food', icon: '🍓', name: 'Клубника', price: 0, sat: 20, lvl: 0, noShop: true },
  { id: 'corn', cat: 'food', icon: '🌽', name: 'Кукуруза', price: 0, sat: 20, lvl: 0, noShop: true },
  { id: 'pumpkin', cat: 'food', icon: '🎃', name: 'Тыква', price: 0, sat: 35, lvl: 0, noShop: true },
];
GARDEN_FOOD.forEach(i => { SHOP.push(i); ITEMS[i.id] = i; });

const CROPS = [
  { id: 'carrot', icon: '🥕', name: 'Морковка', bloom: '🌿' },
  { id: 'tomato', icon: '🍅', name: 'Помидор', bloom: '🌼' },
  { id: 'strawberry', icon: '🍓', name: 'Клубника', bloom: '🌸' },
  { id: 'corn', icon: '🌽', name: 'Кукуруза', bloom: '🌾' },
  { id: 'pumpkin', icon: '🎃', name: 'Тыква', bloom: '🌼' },
];
const GROW_MS = 2 * 3600000;        // политая грядка подрастает через 2 часа — или сразу после урока
const FINDS = [
  { id: 'shell', icon: '🐚', name: 'Ракушка' }, { id: 'leaf', icon: '🍁', name: 'Кленовый лист' },
  { id: 'acorn', icon: '🌰', name: 'Каштан' }, { id: 'gem', icon: '💎', name: 'Блестящий камешек' },
  { id: 'key', icon: '🗝️', name: 'Старый ключик' }, { id: 'button', icon: '🔘', name: 'Пуговка' },
  { id: 'compass', icon: '🧭', name: 'Компас' }, { id: 'bell', icon: '🔔', name: 'Колокольчик' },
];

/* Раскраски для мольберта: области [id, svg-фигура] в поле 200×160 */
const ART = [
  { id: 'house', icon: '🏠', name: 'Домик', r: [
    ['grass', '<rect x="0" y="138" width="200" height="22"/>'], ['sun', '<circle cx="172" cy="26" r="15"/>'],
    ['wall', '<rect x="50" y="70" width="100" height="70"/>'], ['roof', '<polygon points="40,72 100,24 160,72"/>'],
    ['door', '<rect x="88" y="100" width="24" height="40"/>'], ['win1', '<rect x="60" y="84" width="20" height="20"/>'],
    ['win2', '<rect x="120" y="84" width="20" height="20"/>']] },
  { id: 'flower', icon: '🌷', name: 'Цветок', r: [
    ['pot', '<polygon points="74,128 126,128 118,158 82,158"/>'], ['stem', '<rect x="97" y="78" width="6" height="52"/>'],
    ['leaf', '<ellipse cx="80" cy="108" rx="18" ry="7" transform="rotate(-25 80 108)"/>'],
    ['p1', '<circle cx="100" cy="30" r="15"/>'], ['p2', '<circle cx="125" cy="48" r="15"/>'], ['p3', '<circle cx="116" cy="76" r="15"/>'],
    ['p4', '<circle cx="84" cy="76" r="15"/>'], ['p5', '<circle cx="75" cy="48" r="15"/>'], ['mid', '<circle cx="100" cy="55" r="14"/>']] },
  { id: 'fish', icon: '🐟', name: 'Рыбка', r: [
    ['weed', '<path d="M20 158 Q8 130 22 110 Q34 90 20 70 L30 70 Q44 92 32 112 Q20 132 32 158z"/>'],
    ['tail', '<polygon points="140,80 186,52 186,108"/>'], ['fin', '<polygon points="80,52 108,28 116,54"/>'],
    ['body', '<ellipse cx="96" cy="82" rx="56" ry="32"/>'], ['eye', '<circle cx="66" cy="74" r="8"/>'],
    ['b1', '<circle cx="40" cy="40" r="7"/>'], ['b2', '<circle cx="54" cy="20" r="5"/>']] },
  { id: 'rocket', icon: '🚀', name: 'Ракета', r: [
    ['flame', '<polygon points="86,128 100,158 114,128"/>'], ['finl', '<polygon points="80,96 56,134 80,126"/>'],
    ['finr', '<polygon points="120,96 144,134 120,126"/>'], ['body', '<rect x="80" y="40" width="40" height="90" rx="6"/>'],
    ['nose', '<polygon points="80,42 100,6 120,42"/>'], ['win', '<circle cx="100" cy="70" r="11"/>'],
    ['star1', '<polygon points="30,30 34,40 44,40 36,46 39,56 30,50 21,56 24,46 16,40 26,40"/>'],
    ['star2', '<polygon points="166,60 169,67 176,67 170,71 172,78 166,74 160,78 162,71 156,67 163,67"/>']] },
];
const PALETTE = ['#FF5A5F', '#FF9F43', '#FFD34E', '#5ED67A', '#2EAD5B', '#6EC6FF', '#3F6FE0', '#B39DFF', '#FF8CC6', '#8B5A2B', '#9AA3AE', '#FFFFFF'];

/* ФРАЗЫ ПИТОМЦА (их собирает озвучка: всё между этой меткой и «КОНЕЦ ФРАЗ»; только речь питомца, без рода) */
const STORIES = [
  { id: 'seed', icon: '🌱', title: 'Семечко', pages: [
    ['🌰', 'Жило-было маленькое семечко. Оно очень хотело стать большим.'],
    ['🌧️', 'Пришёл дождик и напоил семечко водой.'],
    ['☀️', 'Выглянуло солнышко и согрело землю.'],
    ['🌻', 'И из семечка вырос высокий подсолнух!']],
    q: 'Что помогло семечку вырасти?', opts: ['Дождик и солнышко', 'Снег и ветер', 'Мороженое'] },
  { id: 'hedgehog', icon: '🦔', title: 'Ёжик и яблоко', pages: [
    ['🦔', 'Ёжик гулял по лесу и увидел на ветке красное яблоко.'],
    ['🍎', 'Ёжик прыгал-прыгал, но никак не мог достать яблоко.'],
    ['🐦', 'Прилетела птичка и качнула ветку. Яблоко упало прямо ёжику на иголки!'],
    ['🤝', 'Ёжик поделился яблоком с птичкой. Так они подружились.']],
    q: 'Кто помог ёжику?', opts: ['Птичка', 'Волк', 'Рыбка'] },
  { id: 'star', icon: '⭐', title: 'Звёздочка-потеряшка', pages: [
    ['🌌', 'Однажды ночью с неба упала маленькая звёздочка.'],
    ['🐸', 'Её нашёл лягушонок и сказал: «Не грусти, я помогу тебе вернуться домой!»'],
    ['🎈', 'Лягушонок привязал звёздочку к воздушному шарику.'],
    ['✨', 'Шарик поднялся высоко-высоко, и звёздочка снова засияла на небе.']],
    q: 'Как звёздочка вернулась на небо?', opts: ['На воздушном шарике', 'На лодке', 'На поезде'] },
  { id: 'bear', icon: '🐻', title: 'Медвежонок учит буквы', pages: [
    ['🐻', 'Медвежонок нашёл книжку, но не умел читать.'],
    ['🦉', 'Мудрая сова сказала: «Давай учить по одной букве каждый день!»'],
    ['📖', 'Медвежонок старался каждый день. Сначала буквы, потом слоги, потом слова.'],
    ['🎉', 'И скоро медвежонок прочитал всю книжку! Вот что значит учиться понемножку.']],
    q: 'Как медвежонок научился читать?', opts: ['Учил понемногу каждый день', 'Спал всю зиму', 'Ел мёд'] },
];
const WISHES = {
  pat: { ic: '🤲', say: 'Погладь меня, пожалуйста!' },
  swing: { ic: '🌳', say: 'Хочу покачаться на качелях во дворе!' },
  water: { ic: '💧', say: 'Давай польём огород!' },
  plant: { ic: '🌱', say: 'Давай посадим что-нибудь на грядке!' },
  feed: { ic: '🍎', say: 'Хочу чего-нибудь вкусненького!' },
  ball: { ic: '⚽', say: 'Брось мне мячик!' },
  lesson: { ic: '⭐', say: 'Давай пройдём урок вместе!' },
  story: { ic: '📚', say: 'Почитай мне сказку!' },
  paint: { ic: '🎨', say: 'Давай порисуем на мольберте!' },
  dig: { ic: '✨', say: 'Пойдём искать клад во дворе!' },
  toy: { ic: '🧸', say: 'Поиграй со мной в игрушки!' },
};
const MEM_SAY = {
  boss: 'Помню, как мы победили босса! Вот это была битва!',
  perfect: 'Помню твой урок без единой ошибки! Вот это да!',
  stage: 'Помнишь день моего взросления? Это благодаря тебе!',
  harvest: 'Помню наш первый урожай! Было так вкусно!',
  coll: 'Помню, как мы собрали целую коллекцию!',
  art: 'Помню нашу первую картину! Красота!',
  wishes: 'Помню день, когда сбылись все мои желания!',
};
const COLL_SAY = {
  harvest: 'Смотри, какой урожай! Всё вырастили сами!',
  finds: 'Наша выставка находок! Каждую нашли вместе!',
  art: 'Добро пожаловать на выставку наших картин!',
  tales: 'Все сказки прочитаны! Какие мы читатели!',
};
const YARD_SAY = {
  sun: 'Какой солнечный денёк!', cloud: 'Сегодня облачно. Зато не жарко!', rain: 'Кап-кап, дождик!',
  snow: 'Снег! Давай слепим снеговика!', wind: 'Какой ветер! Листики летят!',
  morning: 'Доброе утро, двор!', evening: 'Вечер. Скоро станет темно.',
  rained: 'Дождик полил огород! Спасибо, тучка!',
  night: 'Тсс… Ночью во дворе тихо. Все спят.',
  planted: 'Посадили! Теперь польём.', watered: 'Полили! Расти скорее!',
  growing: 'Растёт! Пройди урок — и огород подрастёт быстрее.',
  harvest: 'Урожай! Вот это да!', bedNight: 'Тсс… Огород тоже спит.',
  apple: 'Яблочко упало! Вкусное, наверное!', noApple: 'Новое яблочко будет завтра. Яблоня отдыхает.',
  swing1: 'Ух, как здорово качаться!', swing2: 'Выше! Ещё выше!', swing3: 'Ура! Лечу!',
  puddle: 'Плюх! Люблю лужи!', snow1: 'Катаем большой ком!', snow2: 'Теперь ещё один!', snow3: 'Снеговик готов! Привет, снеговик!',
  snowDone: 'Наш снеговик уже стоит. Красивый!',
  dig: 'Копаем-копаем…', found: 'Смотри, что нашлось!', foundCoin: 'Нашлась монетка!',
  noDig: 'Клад на сегодня найден. После урока поищем ещё!', noDig2: 'Клад на сегодня найден. Завтра поищем ещё!',
  wishDone: 'Ура, желание сбылось! Спасибо!', allWishes: 'Все мои желания сбылись! Спасибо тебе!',
  paintDone: 'Какая красивая картина! Повесим её на стену!', myart: 'Это наша картина! Красота!',
  storyOk: 'Верно! Ты внимательно слушаешь!', storyNo: 'Почти! Давай вспомним сказку ещё раз.',
  toHouse: 'Пойдём домой!', grow: 'Огород подрос!',
};
/* КОНЕЦ ФРАЗ */

const COLLS = [
  { id: 'harvest', icon: '🧺', name: 'Урожай', items: CROPS, how: 'Вырасти на огороде во дворе: посади, поливай, собери.' },
  { id: 'finds', icon: '🐚', name: 'Находки', items: FINDS, how: 'Ищи клад во дворе: одна находка в день, после урока — ещё одна.' },
  { id: 'art', icon: '🎨', name: 'Мои картины', items: ART, how: 'Раскрась все картинки на мольберте (мольберт — в магазине).', need: 'easel' },
  { id: 'tales', icon: '📚', name: 'Сказки', items: STORIES.map(s => ({ id: s.id, icon: s.icon, name: s.title })), how: 'Прочитай сказки в книжке (книжки — в магазине).', need: 'books' },
];
const WISH_NAME = {
  pat: 'Погладить питомца', swing: 'Покачаться на качелях', water: 'Полить огород', plant: 'Посадить семечко', feed: 'Покормить',
  ball: 'Бросить мячик', lesson: 'Пройти урок', story: 'Почитать сказку', paint: 'Раскрасить картинку', dig: 'Найти клад', toy: 'Поиграть с подарком',
};
const MOODS = ['🥺 Скучает по тебе', '🙂 Спокойное настроение', '😊 Хорошее настроение', '🤩 Прекрасное настроение'];

/* Картина на стене домика — последняя раскрашенная (появляется после первой раскраски) */
const MYART = { id: 'myart', cat: 'decor', icon: '🖼️', name: 'Наша картина', zone: 'wall', x: 52, y: 64, h: 64, play: 'look', ps: 1, art: true };
ITEMS.myart = MYART;

/* ============================================================
   ЖИЗНЬ ПИТОМЦА: настроение, желания, память, коллекции
   ============================================================ */
const Life = {
  today: () => U.dayKey(),
  /* Устойчивое «случайное» число дня (погода одна на весь день) */
  rand(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; },
  init() {
    const L2 = S.life;
    if (!Array.isArray(L2.beds)) L2.beds = [];
    while (L2.beds.length < 3) L2.beds.push({ c: null, st: 0, w: false, wt: 0 });
    if (!Array.isArray(L2.mem)) L2.mem = [];
    if (!L2.memInit) {
      /* старое сохранение: питомец «вспоминает» уже побеждённых боссов */
      L2.memInit = true;
      if (petStage() > 0) L2.mem.push({ t: 0, k: 'stage', ic: '🐣', txt: 'Питомец вылупился' });
      ALL_WORLDS.forEach(w => { if (S.bosses[w.id]) L2.mem.push({ t: 0, k: 'boss', ic: w.boss.emoji, txt: 'Победа над боссом: ' + w.boss.name }); });
    }
  },
  weather() {
    if (Life.wOver) return Life.wOver;
    const m = new Date().getMonth(), r = Life.rand(Life.today() + 'w');
    if (m === 11 || m <= 1) return r < 0.45 ? 'snow' : r < 0.75 ? 'sun' : 'cloud';
    if (m === 2 || m === 10) return r < 0.3 ? 'rain' : r < 0.55 ? 'cloud' : r < 0.7 ? 'wind' : 'sun';
    return r < 0.2 ? 'rain' : r < 0.35 ? 'cloud' : r < 0.45 ? 'wind' : 'sun';
  },
  dayPart() {
    if (Life.dpOver) return Life.dpOver;
    if (Room.night()) return 'night';
    const h = new Date().getHours();
    return h < 11 ? 'morning' : h < 17 ? 'day' : 'evening';
  },

  /* ---------- Мини-желания: до 3 в день, без срока и без наказаний ---------- */
  wishOk: {
    water: () => S.life.beds.some(b => b.c && b.st < 4 && !b.w),
    plant: () => S.life.beds.some(b => !b.c),
    feed: () => S.pet.satiety < 90 && SHOP.some(i => i.cat === 'food' && S.food[i.id] > 0),
    ball: () => S.owned.ball && !S.hidden.ball,
    story: () => S.owned.books && !S.hidden.books,
    paint: () => S.owned.easel && !S.hidden.easel,
    dig: () => Life.findAvail(),
    toy: () => [...SHOP, ...EXCLUSIVE, ...BOSS_TOYS].some(i => i.cat === 'decor' && i.play && i.id !== 'ball' && S.owned[i.id] && !S.hidden[i.id]),
  },
  wishes() {
    const L2 = S.life;
    if (L2.wDay !== Life.today() || !Array.isArray(L2.wishes)) {
      const pool = Object.keys(WISHES).filter(k => !Life.wishOk[k] || Life.wishOk[k]());
      L2.wDay = Life.today();
      L2.wishes = U.shuffle(pool).slice(0, 3).map(k => ({ k, done: false }));
      L2.allDay = '';
    }
    return L2.wishes;
  },
  /* ребёнок поиграл с питомцем сегодня — для настроения */
  touch() { if (S && S.life && S.life.petDay !== Life.today()) { S.life.petDay = Life.today(); Life.refreshCard(); } },
  pendingWish() { if (petStage() === 0) return null; const w = Life.wishes().find(x => !x.done); return w ? WISHES[w.k] : null; },
  done(k) {
    if (!S || petStage() === 0) return;
    const w = Life.wishes().find(x => x.k === k && !x.done);
    if (!w) return;
    w.done = true;
    const got = earnCoins(5);
    Sound.play('star');
    renderTop();
    toast(`💭 Желание исполнено!${got ? ` +${got} <i class="ci"></i>` : ''}`);
    const all = Life.wishes().every(x => x.done);
    if (all && S.life.allDay !== Life.today()) {
      S.life.allDay = Life.today();
      Life.remember('wishes', '💭', 'Сбылись все желания за день');
    }
    save();
    setTimeout(() => {
      if (Room.root && !Room.busy) { Room.hearts(3); Room.say(all ? YARD_SAY.allWishes : YARD_SAY.wishDone, true); }
      Life.refreshCard();
    }, 2600);
  },
  mood() {
    const w = Life.wishes();
    let m = 0;
    if (S.pet.satiety >= 50) m++;
    if (w.some(x => x.done) || S.life.petDay === Life.today()) m++;
    if (S.life.lessonDay === Life.today()) m++;
    if (w.length && w.every(x => x.done)) m++;
    return Math.min(3, m);
  },
  cardHTML() {
    const m = Life.mood(), w = Life.wishes();
    return `<div id="lifeCard" class="life-card">
      <div class="mood-line"><b>${MOODS[m]}</b>${m < 3 ? '<small>Исполни желание, покорми или пройди урок — питомец обрадуется</small>' : ''}</div>
      <div class="wish-row"><span class="wish-h">💭 Желания</span>${w.map(x => `<span class="wish ${x.done ? 'done' : ''}" title="${WISHES[x.k].say}">${WISHES[x.k].ic} ${WISH_NAME[x.k]}${x.done ? ' ✓' : ''}</span>`).join('')}</div>
      <div class="pc-btns"><button class="btn" data-act="album">📒 Альбом</button><button class="btn" data-act="memories">📔 Что я помню</button></div>
    </div>`;
  },
  refreshCard() { const c = $('#lifeCard'); if (c) c.outerHTML = Life.cardHTML(); },

  /* ---------- Память об успехах ---------- */
  remember(k, ic, txt) {
    const L2 = S.life;
    if (k === 'perfect' && L2.mem.some(m => m.k === 'perfect' && m.t && U.dayKey(new Date(m.t)) === Life.today())) return;
    L2.mem.push({ t: Date.now(), k, ic, txt });
    if (L2.mem.length > 40) L2.mem.splice(0, L2.mem.length - 40);
  },
  memLine() {
    const ks = [...new Set(S.life.mem.map(m => m.k))].filter(k => MEM_SAY[k]);
    return ks.length ? MEM_SAY[U.rnd(ks)] : null;
  },
  openMemories() {
    const list = S.life.mem.slice().reverse();
    modal({ cls: 'sheet', html: `<h2>📔 Что я помню</h2><p class="small">Питомец помнит ваши общие успехи.</p>
      ${list.length ? `<ul class="mem-list">${list.map(m => `<li><span>${m.ic}</span><b>${U.esc(m.txt)}</b><small>${m.t ? new Date(m.t).toLocaleDateString('ru-RU') : 'раньше'}</small></li>`).join('')}</ul>`
    : '<p>Пока пусто. Побеждай боссов, проходи уроки без ошибок, собирай урожай — питомец всё запомнит!</p>'}`,
    buttons: [{ label: 'Закрыть', cls: 'primary' }] });
    const t = Life.memLine();
    if (t && petStage() > 0) Speech.sayPet(t, petStage());
  },

  /* ---------- После урока / боя: огород растёт, желание «урок» сбывается ---------- */
  onLesson() {
    if (!S.life) return;
    S.life.lessonAt = Date.now(); S.life.lessonDay = Life.today();
    if (Life.grow(true)) toast('🌱 Ты учишься — и огород подрос!');
    Life.done('lesson');
  },
  grow(byLesson = false) {
    const now = Date.now();
    let n = 0;
    S.life.beds.forEach(b => {
      if (!b.c || b.st >= 4 || !b.w) return;
      if (byLesson || now - b.wt >= GROW_MS) { b.st++; b.w = false; n++; }
    });
    return n;
  },
  findAvail() {
    const n = S.life.findDay === Life.today() ? S.life.finds : 0;
    return n < 1 || (n < 2 && S.life.lessonDay === Life.today());
  },

  /* ---------- Коллекции ---------- */
  have(cid) { return S.life.coll[cid] || (S.life.coll[cid] = {}); },
  full(c) { const h = Life.have(c.id); return c.items.every(i => h[i.id]); },
  got(cid, iid) {
    const h = Life.have(cid);
    if (h[iid]) return false;
    h[iid] = Date.now();
    const c = COLLS.find(x => x.id === cid);
    if (Life.full(c) && !S.life.shows[cid]) {
      S.life.shows[cid] = Date.now();
      earnCoins(50, true);
      Life.remember('coll', c.icon, `Собрана коллекция «${c.name}»`);
      celebrate(() => {
        Sound.play('level'); confetti(40);
        modal({ cls: 'celebrate', html: `<div class="m-icon">${c.icon}</div><h2>Коллекция «${c.name}» собрана!</h2><p class="coll-row">${c.items.map(i => i.icon).join(' ')}</p><p class="reward">+50 <i class="ci"></i></p>`,
          buttons: [{ label: 'Потом', cls: 'ghost' }, { label: '🎭 Представление', cls: 'primary', onClick: () => setTimeout(() => Life.show(cid), 300) }] });
      });
      setTimeout(flushQueue, 2600);   // окно — после действия питомца (иначе ждало бы чужой модалки)
    }
    save();
    return true;
  },
  openAlbum() {
    const html = COLLS.map(c => {
      const h = Life.have(c.id), n = c.items.filter(i => h[i.id]).length, full = n === c.items.length;
      return `<div class="alb-sec ${full ? 'full' : ''}"><div class="alb-h"><span>${c.icon}</span><b>${c.name}</b><small>${n} из ${c.items.length}</small></div>
        <div class="alb-row">${c.items.map(i => `<span class="alb-it ${h[i.id] ? 'on' : ''}" title="${h[i.id] ? i.name : '?'}">${h[i.id] ? i.icon : '❔'}<small>${h[i.id] ? i.name : '?'}</small></span>`).join('')}</div>
        ${full ? `<button class="btn primary" data-show="${c.id}">🎭 Представление</button>` : `<p class="small muted">${c.how}${c.need && !S.owned[c.need] ? ' <b>Сначала купи подарок.</b>' : ''}</p>`}</div>`;
    }).join('');
    const m = modal({ cls: 'sheet', html: `<h2>📒 Альбом коллекций</h2><p class="small">Собери набор целиком — и питомец устроит представление!</p>${html}`, buttons: [{ label: 'Закрыть', cls: 'ghost' }] });
    m.addEventListener('click', ev => {
      const b = ev.target.closest('[data-show]');
      if (!b) return;
      m.close();
      setTimeout(() => Life.show(b.dataset.show), 300);
    });
  },
  /* Представление: предметы коллекции кружат вокруг питомца, музыка, конфетти */
  async show(cid) {
    const c = COLLS.find(x => x.id === cid);
    if (!c || petStage() === 0) return;
    if (TAB !== 'pet') { TAB = 'pet'; render(); await wait(500); }
    if (Room.night()) { toast('🌙 Питомец спит. Представление — утром!'); return; }
    if (!Room.root) return;
    if (Room.hide) { Room.hide = null; if (Room.petEl) Room.petEl.classList.remove('hidden'); }   // прятки прерываются
    const g = Room.gen;
    Room.busy = true; clearTimeout(Room.idleT);
    await Room.walkTo(320, 330, g);
    if (!Room.alive(g)) return;
    Room.pet.dir = 1; Room.place(0);
    const ring = document.createElement('div');
    ring.className = 'show-ring';
    ring.style.left = Room.pet.x + 'px'; ring.style.top = (Room.pet.y - 80) + 'px';
    ring.innerHTML = c.items.map((i, n) => `<span style="--a:${(360 / c.items.length * n).toFixed(1)}deg">${i.icon}</span>`).join('');
    Room.inner.appendChild(ring);
    Room.anim('a-dance'); Room.draw('laugh'); Room.melody('dance');
    Room.say(COLL_SAY[cid], true);
    confetti(50); Sound.play('level');
    await wait(2600); if (!Room.alive(g)) return;
    Room.melody('piano'); Room.hearts(4);
    await wait(2600);
    ring.remove();
    if (!Room.alive(g)) return;   // ушли с экрана — не трогаем занятость новой сцены
    Room.draw(); Room.anim('');
    Room.busy = false; Room.scheduleIdle();
  },
};

/* ============================================================
   ДВОР — сцена (рисует Room, когда Room.scene === 'yard')
   ============================================================ */
const BED_X = [230, 330, 430], BED_Y = 356;
const Yard = {
  html() {
    const dp = Life.dayPart(), w = Life.weather(), night = dp === 'night';
    const sky = night ? '<span class="y-moon">🌙</span>' + [1, 2, 3, 4, 5, 6].map(n => `<i class="st y${n}"></i>`).join('')
      : w === 'rain' || w === 'snow' ? '' : `<span class="y-sun ${dp}">☀️</span>`;
    const clouds = ['cloud', 'rain', 'snow'].includes(w) ? '<span class="y-cl c1">☁️</span><span class="y-cl c2">☁️</span><span class="y-cl c3">☁️</span>' : '<span class="y-cl c1 small">☁️</span>';
    const fall = w === 'rain' ? Yard.drops('i', 34) : w === 'snow' ? Yard.drops('b', 30) : w === 'wind' ? Yard.drops('leaf', 7) : '';
    return `<div class="room yard dp-${dp} w-${w} ${night ? 'night' : ''}" id="room"><div class="room-in" id="roomIn">
      <div class="y-sky">${sky}${clouds}</div><div class="y-hills"></div><div class="y-fence"></div><div class="y-grass"></div>
      ${Yard.objHTML()}
      <div class="rpet" id="rpet"><div class="rp-flip"><div class="rp-act">${petSVG({ uid: 'rp', mood: night && petStage() > 0 ? 'sleep' : undefined })}</div></div></div>
      <div class="y-fall">${fall}</div>
      </div><div class="pet-say" id="petSay"></div>
      ${night ? '<div class="night-note">🌙 Ночь — питомец спит</div>' : ''}</div>`;
  },
  drops(kind, n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const st = `left:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(-Math.random() * 3).toFixed(2)}s;animation-duration:${kind === 'i' ? (0.7 + Math.random() * 0.4).toFixed(2) : kind === 'b' ? (4 + Math.random() * 3).toFixed(2) : (3 + Math.random() * 2).toFixed(2)}s`;
      s += kind === 'leaf' ? `<span class="yl" style="${st};top:${(20 + Math.random() * 60).toFixed(0)}%">🍃</span>` : `<${kind} style="${st}"></${kind}>`;
    }
    return s;
  },
  objHTML() {
    const w = Life.weather(), L2 = S.life, today = Life.today();
    const snow = L2.snow && L2.snow.day === today ? L2.snow.n : 0;
    return `<div class="yo yo-house" data-yo="house" style="left:72px;top:262px;z-index:262">🏠<small>Домой</small></div>
      <div class="yo yo-tree" data-yo="tree" style="left:188px;top:258px;z-index:258">🌳${L2.appleDay !== today ? '<i class="apple">🍎</i>' : ''}</div>
      <div class="yo yo-swing" data-yo="swing" style="left:545px;top:116px;z-index:318"><i class="sw-frame"></i><div class="sw-arm"><i class="sw-rope l"></i><i class="sw-rope r"></i><i class="sw-seat"></i></div></div>
      ${L2.beds.map((b, n) => Yard.bedHTML(b, n)).join('')}
      <div class="yo yo-dig ${Life.findAvail() ? 'avail' : ''}" data-yo="dig" style="left:108px;top:362px;z-index:362"><i class="mound"></i>${Life.findAvail() ? '<span class="spark">✨</span>' : ''}</div>
      ${w === 'rain' ? '<div class="yo yo-puddle" data-yo="puddle" style="left:470px;top:282px;z-index:270"></div>' : ''}
      ${w === 'snow' ? `<div class="yo yo-snow" data-yo="snow" style="left:470px;top:286px;z-index:286">${snow >= 3 ? '⛄' : snow === 2 ? '<b class="sb2"></b><b class="sb1"></b>' : snow === 1 ? '<b class="sb1"></b>' : '<b class="pile"></b>'}</div>` : ''}`;
  },
  bedHTML(b, n) {
    const c = CROPS.find(x => x.id === b.c);
    const ic = !c ? '' : ['', '🌱', '🌿', c.bloom, c.icon][b.st];
    const badge = !c ? '<span class="bed-plus">＋</span>' : b.st >= 4 ? '<span class="bed-ripe">✨</span>' : !b.w ? '<span class="bed-drop">💧</span>' : '';
    return `<div class="yo yo-bed ${b.w ? 'wet' : ''}" data-yo="bed${n}" style="left:${BED_X[n]}px;top:${BED_Y}px;z-index:${BED_Y}"><i class="soil"></i>${c && b.st === 0 ? '<i class="seeds"></i>' : ''}<span class="crop s${b.st}">${ic}</span>${badge}</div>`;
  },
  redraw(id) {
    const e = Room.inner && Room.inner.querySelector(`[data-yo="${id}"]`);
    if (!e) return;
    const t = document.createElement('div');
    t.innerHTML = Yard.objHTML();
    const n = t.querySelector(`[data-yo="${id}"]`);
    if (n) e.replaceWith(n);
  },

  /* После отрисовки: дождь поливает огород, питомец говорит о погоде */
  mounted() {
    const L2 = S.life;
    L2.yardVisits = (L2.yardVisits || 0) + 1;
    let rained = false;
    if (Life.grow()) save();
    if (Life.weather() === 'rain' && Life.dayPart() !== 'night') {
      L2.beds.forEach(b => { if (b.c && b.st < 4 && !b.w) { b.w = true; b.wt = Date.now(); rained = true; } });
      if (rained) save();
    }
    L2.beds.forEach((b, n) => Yard.redraw('bed' + n));
    if (petStage() === 0) return;
    const g = Room.gen;
    setTimeout(() => {
      if (!Room.alive(g) || Room.busy || ($('#petSay') && $('#petSay').classList.contains('show'))) return;   // не перебивать приветствие
      const dp = Life.dayPart();
      if (dp === 'night') { Room.say(YARD_SAY.night, true, true); return; }
      const t = rained ? YARD_SAY.rained : Math.random() < 0.35 && dp !== 'day' ? YARD_SAY[dp] : YARD_SAY[Life.weather()];
      Room.draw('happy'); Room.say(t, true);
    }, 900);
  },

  /* Сам по себе во дворе */
  async idle() {
    const g = Room.gen, r = Math.random();
    Room.busy = true;
    if (r < 0.3) { await Yard.swing(false); return; }
    if (r < 0.55) {
      const n = Math.floor(Math.random() * 3);
      await Room.walkTo(BED_X[n] + 60, 342, g); if (!Room.alive(g)) return;
      Room.pet.dir = -1; Room.place(0); Room.draw('wow');
      const b = S.life.beds[n];
      Room.say(!b.c ? 'Тут можно что-нибудь посадить!' : b.st >= 4 ? 'Ура, созрело! Собирай!' : !b.w ? 'Грядка просит пить!' : 'Расти, расти!');
      await wait(1800);
    } else if (r < 0.75) {
      await Room.walkTo(80 + Math.random() * 480, 280 + Math.random() * 80, g);
      if (Room.alive(g)) Room.say(U.rnd(['Ля-ля-ля…', 'Хорошо во дворе!', 'Топ-топ по травке!']));
      await wait(1200);
    } else {
      Room.anim('a-jump'); Room.draw('laugh'); Room.say(U.rnd(['Поиграй со мной!', 'Эй, я здесь!', 'Как хорошо на улице!'])); await wait(1800);
    }
    if (!Room.alive(g)) return;
    Room.draw(); Room.anim('');
    Room.busy = false;
  },

  /* ---------- Нажатия на предметы двора ---------- */
  tap(id) {
    Sound.init();
    if (id === 'house') { Room.say(YARD_SAY.toHouse); setTimeout(() => { Room.scene = 'room'; render(); }, 350); return; }
    if (petStage() === 0) { Sound.play('tap'); return; }
    const night = Life.dayPart() === 'night';
    if (id.startsWith('bed')) { if (night) { Room.say(YARD_SAY.bedNight, true, true); return; } Yard.bed(+id.slice(3)); return; }
    if (night) { Room.say(YARD_SAY.night, true, true); return; }
    if (Room.busy) return;
    if (id === 'swing') Yard.swing(true);
    else if (id === 'tree') Yard.tree();
    else if (id === 'dig') Yard.dig();
    else if (id === 'puddle') Yard.puddle();
    else if (id === 'snow') Yard.snowman();
  },
  async go(x, y) {
    const g = Room.gen;
    Room.busy = true; clearTimeout(Room.idleT);
    const ok = await Room.walkTo(x, y, g);
    if (!ok) { if (Room.alive(g)) Room.busy = false; return null; }
    return g;
  },
  end(g) { if (!Room.alive(g)) return; Room.draw(); Room.anim(''); Room.pet.onTop = false; Room.place(0); Room.busy = false; Room.scheduleIdle(); },

  async bed(n) {
    if (Room.busy) return;
    if (Life.grow()) { save(); Yard.redraw('bed' + n); }   // прошло 2 часа, пока двор был открыт
    const b = S.life.beds[n];
    if (!b.c) { Yard.pickSeed(n); return; }
    if (b.st < 4 && b.w) { Room.say(YARD_SAY.growing, true); Yard.wiggle('bed' + n); return; }
    const g = await Yard.go(BED_X[n] + 58, BED_Y - 12); if (g === null) return;
    Room.pet.dir = -1; Room.place(0);
    if (b.st >= 4) {
      const c = CROPS.find(x => x.id === b.c);
      Room.anim('a-jump'); Room.draw('laugh');
      Room.fx(c.icon, BED_X[n], BED_Y - 40, 'fx-rise', 1400, 44); Sound.play('star');
      S.food[c.id] = (S.food[c.id] || 0) + 2;
      const first = Life.got('harvest', c.id);
      if (first) Life.remember('harvest', c.icon, 'Первый урожай: ' + c.name);
      S.life.beds[n] = { c: null, st: 0, w: false, wt: 0 };
      save(); Yard.redraw('bed' + n);
      Room.say(YARD_SAY.harvest, true);
      toast(`${c.icon} Урожай: +2 «${c.name}» — можно покормить питомца`);
      await wait(1800);
    } else {
      Room.anim('a-kick'); Room.draw('happy');
      for (let k = 0; k < 7; k++) setTimeout(() => Room.fx('💧', BED_X[n] + Math.random() * 50 - 25, BED_Y - 50, 'fx-fall', 900, 18), k * 130);
      b.w = true; b.wt = Date.now(); save();
      await wait(1000); Yard.redraw('bed' + n);
      Room.say(YARD_SAY.watered, true);
      Life.done('water');
      await wait(1400);
    }
    Yard.end(g);
  },
  wiggle(id) {
    const e = Room.inner && Room.inner.querySelector(`[data-yo="${id}"]`);
    if (!e) return;
    e.classList.remove('wiggle'); void e.offsetWidth; e.classList.add('wiggle');
    setTimeout(() => e.classList.remove('wiggle'), 900);
  },
  pickSeed(n) {
    const m = modal({ cls: 'sheet', html: `<h2>🌱 Что посадим?</h2><p class="small">Поливай грядку — и после урока она подрастёт. Урожай — еда для питомца.</p>
      <div class="feed-grid">${CROPS.map(c => `<button class="feed-it" data-seed="${c.id}"><span>${c.icon}</span><b>${c.name}</b><small>${S.life.coll.harvest && S.life.coll.harvest[c.id] ? '✓ в альбоме' : 'новое!'}</small></button>`).join('')}</div>`,
    buttons: [{ label: 'Отмена', cls: 'ghost' }] });
    m.addEventListener('click', async ev => {
      const bt = ev.target.closest('[data-seed]');
      if (!bt) return;
      m.close();
      const g = await Yard.go(BED_X[n] + 58, BED_Y - 12); if (g === null) return;
      Room.pet.dir = -1; Room.place(0);
      Room.anim('a-nod');
      for (let k = 0; k < 4; k++) setTimeout(() => Room.fx('🟤', BED_X[n] + Math.random() * 40 - 20, BED_Y - 30, 'fx-pop', 700, 10), k * 150);
      S.life.beds[n] = { c: bt.dataset.seed, st: 0, w: false, wt: 0 }; save();
      await wait(800); Yard.redraw('bed' + n);
      Room.draw('happy'); Room.say(YARD_SAY.planted, true);
      Life.done('plant');
      await wait(1400);
      Yard.end(g);
    });
  },
  async swing(byChild) {
    const g = await Yard.go(545, 340); if (g === null) return;
    const sw = Room.inner.querySelector('.yo-swing');
    Room.pet.onTop = true; Room.pet.x = 545; Room.pet.y = 318; Room.pet.dir = 1; Room.place(250);
    await wait(260); if (!Room.alive(g)) return;
    if (sw) sw.classList.add('swinging');
    Room.anim('a-swing'); Room.draw('laugh');
    Room.say(YARD_SAY.swing1, byChild);
    await wait(2100); if (!Room.alive(g)) return;
    Room.say(U.rnd([YARD_SAY.swing2, YARD_SAY.swing3]), byChild);
    await wait(2100); if (!Room.alive(g)) return;
    if (sw) sw.classList.remove('swinging');
    Room.pet.y = 345; Room.pet.x = 505; Room.place(300);
    if (byChild) Life.done('swing');
    await wait(300);
    Yard.end(g);
  },
  async tree() {
    const g = await Yard.go(240, 300); if (g === null) return;
    Room.pet.dir = -1; Room.place(0);
    Room.anim('a-shake'); Yard.wiggle('tree');
    await wait(500); if (!Room.alive(g)) return;
    if (S.life.appleDay !== Life.today()) {
      S.life.appleDay = Life.today();
      S.food.apple = (S.food.apple || 0) + 1; save();
      Room.fx('🍎', 205, 200, 'fx-fall', 900, 30);
      await wait(700); Yard.redraw('tree');
      Room.draw('laugh'); Room.say(YARD_SAY.apple, true);
      toast('🍎 Яблоко с яблони — можно покормить питомца');
    } else Room.say(YARD_SAY.noApple, true);
    await wait(1600);
    Yard.end(g);
  },
  async dig() {
    if (!Life.findAvail()) { Room.say(S.life.lessonDay === Life.today() ? YARD_SAY.noDig2 : YARD_SAY.noDig, true); return; }
    const g = await Yard.go(160, 362); if (g === null) return;
    Room.pet.dir = -1; Room.place(0);
    Room.say(YARD_SAY.dig);
    for (let k = 0; k < 3; k++) { Room.anim('a-kick'); for (let j = 0; j < 3; j++) Room.fx('🟫', 108 + Math.random() * 30 - 15, 350, 'fx-pop', 700, 12); await wait(500); }
    if (!Room.alive(g)) return;
    const L2 = S.life;
    if (L2.findDay !== Life.today()) { L2.findDay = Life.today(); L2.finds = 0; }
    L2.finds++;
    const have = Life.have('finds'), miss = FINDS.filter(f => !have[f.id]);
    Room.draw('wow'); Room.anim('a-jump'); Sound.play('star');
    if (miss.length) {
      const f = U.rnd(miss);
      Room.fx(f.icon, 108, 330, 'fx-hold', 2800, 44);
      Room.say(YARD_SAY.found, true);
      toast(`${f.icon} Находка: «${f.name}» — в альбоме коллекций`);
      Life.got('finds', f.id);
    } else {
      const got = earnCoins(5);
      Room.fx('✨', 108, 330, 'fx-rise', 1400, 40);
      Room.say(YARD_SAY.foundCoin, true);
      toast(`Клад: +${got} <i class="ci"></i>`);
    }
    save(); Yard.redraw('dig');
    Life.done('dig');
    await wait(2200);
    Yard.end(g);
  },
  async puddle() {
    const g = await Yard.go(440, 300); if (g === null) return;
    Room.pet.dir = 1; Room.place(0);
    Room.anim('a-jump'); await wait(300);
    Room.pet.x = 470; Room.pet.y = 290; Room.place(300);
    await wait(300); if (!Room.alive(g)) return;
    for (let k = 0; k < 5; k++) Room.fx('💦', 470 + Math.random() * 60 - 30, 280, 'fx-pop', 900, 22);
    Sound.play('pop'); Room.draw('laugh'); Room.say(YARD_SAY.puddle, true);
    await wait(1800);
    Yard.end(g);
  },
  async snowman() {
    const L2 = S.life, today = Life.today();
    if (!L2.snow || L2.snow.day !== today) L2.snow = { day: today, n: 0 };
    if (L2.snow.n >= 3) { Room.say(YARD_SAY.snowDone, true); return; }
    const g = await Yard.go(420, 296); if (g === null) return;
    Room.pet.dir = 1; Room.place(0);
    Room.anim('a-kick'); await wait(500); if (!Room.alive(g)) return;
    L2.snow.n++; save(); Yard.redraw('snow');
    Room.fx('❄️', 470, 250, 'fx-pop', 900, 22);
    Room.draw('laugh'); Room.say(YARD_SAY['snow' + L2.snow.n], true);
    if (L2.snow.n === 3) { Sound.play('star'); Room.hearts(3); }
    await wait(1600);
    Yard.end(g);
  },
};

/* ============================================================
   МОЛЬБЕРТ → РАСКРАСКА
   ============================================================ */
const Art = {
  svg(a, fills, live = false) {
    return `<svg viewBox="0 0 200 160" class="art-svg">${live ? '<rect width="200" height="160" fill="#fff"/>' : '<rect width="200" height="160" fill="#FFFDF7"/>'}${a.r.map(([id, sh]) =>
      sh.replace(/^<(\w+)/, `<$1 data-r="${id}" fill="${(fills && fills[id]) || '#fff'}" stroke="#3A3350" stroke-width="2.5" stroke-linejoin="round"`)).join('')}</svg>`;
  },
  mini() {
    const a = ART.find(x => x.id === S.life.artLast);
    return a ? `<div class="myart" style="width:${MYART.h}px;height:${Math.round(MYART.h * 0.8)}px">${Art.svg(a, S.life.art[a.id])}</div>` : MYART.icon;
  },
  open(first) {
    let cur = first || S.life.artLast || ART[0].id, col = PALETTE[0];
    const fills = () => S.life.art[cur] || (S.life.art[cur] = {});
    const body = () => {
      const a = ART.find(x => x.id === cur), f = fills(), n = a.r.filter(([id]) => f[id]).length;
      return `<div class="tabs art-tabs">${ART.map(x => `<button class="tab ${x.id === cur ? 'on' : ''}" data-pic="${x.id}">${x.icon}<span>${x.name}${Life.have('art')[x.id] ? ' ✓' : ''}</span></button>`).join('')}</div>
        <div class="art-box">${Art.svg(a, f, true)}</div>
        <div class="palette">${PALETTE.map(c => `<button class="pal ${c === col ? 'on' : ''}" data-col="${c}" style="background:${c}"></button>`).join('')}</div>
        <p class="small art-n">Раскрашено ${n} из ${a.r.length}. Выбери цвет и нажимай на части картинки.</p>`;
    };
    const m = modal({ cls: 'sheet art-sheet', html: `<h2>🎨 Раскраска</h2><div id="artBody">${body()}</div>`,
      buttons: [{ label: 'Готово', cls: 'primary', onClick: () => Art.finish(cur) }] });
    const upd = () => { m.querySelector('#artBody').innerHTML = body(); };
    m.addEventListener('click', ev => {
      const r = ev.target.closest('[data-r]'), p = ev.target.closest('[data-col]'), t = ev.target.closest('[data-pic]');
      if (r) { fills()[r.getAttribute('data-r')] = col; r.setAttribute('fill', col); Sound.play('pop'); save(); const a = ART.find(x => x.id === cur); m.querySelector('.art-n').textContent = `Раскрашено ${a.r.filter(([id]) => fills()[id]).length} из ${a.r.length}. Выбери цвет и нажимай на части картинки.`; return; }
      if (p) { col = p.dataset.col; Sound.play('tap'); m.querySelectorAll('.pal').forEach(b => b.classList.toggle('on', b === p)); return; }
      if (t) { cur = t.dataset.pic; Sound.play('tap'); upd(); }
    });
  },
  finish(cur) {
    const a = ART.find(x => x.id === cur), f = S.life.art[cur] || {};
    const n = a.r.filter(([id]) => f[id]).length;
    if (!n) return;
    S.life.artLast = cur;
    const full = n === a.r.length;
    if (full && Life.got('art', cur) && !S.life.mem.some(m => m.k === 'art')) Life.remember('art', '🎨', `Первая картина: «${a.name}»`);
    save();
    render();
    Life.done('paint');
    setTimeout(() => { if (Room.root) { Room.draw('love'); Room.hearts(3); Room.say(YARD_SAY.paintDone, true); Room.itemFx('myart', 'glow', 2400); } }, 500);
    if (!full) toast('🖼️ Картина на стене. Раскрась все части — и она попадёт в альбом!');
  },
};

/* ============================================================
   КНИЖКА → СКАЗКИ (питомец читает вслух, в конце вопрос)
   ============================================================ */
const Story = {
  open() {
    let s = null, p = 0, opts = [];
    const list = () => `<h2>📚 Сказки</h2><p class="small">Выбери сказку — питомец прочитает её вслух.</p><div class="feed-grid">${STORIES.map(x =>
      `<button class="feed-it" data-story="${x.id}"><span>${x.icon}</span><b>${x.title}</b><small>${Life.have('tales')[x.id] ? '✓ прочитана' : 'новая'}</small></button>`).join('')}</div>`;
    const page = () => {
      if (p < s.pages.length) {
        const [ic, tx] = s.pages[p];
        return `<h2>${s.icon} ${s.title}</h2><div class="st-pic">${ic}</div><p class="st-text">${tx}</p>
          <div class="st-nav"><button class="btn ghost" data-say="1">🔊 Ещё раз</button><span class="small">${p + 1} / ${s.pages.length}</span><button class="btn primary" data-next="1">Дальше ▶</button></div>`;
      }
      return `<h2>${s.icon} ${s.title}</h2><p class="st-q"><b>${s.q}</b></p><div class="st-opts">${opts.map((o, i) => `<button class="btn" data-opt="${i}">${o}</button>`).join('')}</div>`;
    };
    const m = modal({ cls: 'sheet story-sheet', html: `<div id="stBody">${list()}</div>`, buttons: [{ label: 'Закрыть', cls: 'ghost' }] });
    const box = m.querySelector('#stBody');
    const read = () => { if (s && p < s.pages.length) Speech.sayPet(s.pages[p][1], petStage()); };
    m.addEventListener('click', ev => {
      const st = ev.target.closest('[data-story]'), nx = ev.target.closest('[data-next]'), sy = ev.target.closest('[data-say]'), op = ev.target.closest('[data-opt]');
      if (st) { s = STORIES.find(x => x.id === st.dataset.story); p = 0; opts = U.shuffle(s.opts.slice()); Sound.play('tap'); box.innerHTML = page(); read(); return; }
      if (sy) { read(); return; }
      if (nx) { p++; Sound.play('tap'); box.innerHTML = page(); read(); if (p >= s.pages.length) Speech.sayPet(s.q, petStage()); return; }
      if (op && !op.disabled) {
        const ok = opts[+op.dataset.opt] === s.opts[0];
        m.querySelectorAll('[data-opt]').forEach(b => { b.disabled = true; if (opts[+b.dataset.opt] === s.opts[0]) b.classList.add('ok'); });
        if (!ok) op.classList.add('bad');
        Sound.play(ok ? 'star' : 'tap');
        Speech.sayPet(ok ? YARD_SAY.storyOk : YARD_SAY.storyNo, petStage());
        Life.got('tales', s.id);
        Life.done('story');
        box.insertAdjacentHTML('beforeend', `<p class="st-res">${ok ? '❤️ Верно!' : `Правильно: <b>${s.opts[0]}</b>`}</p><button class="btn primary" data-back="1">К сказкам</button>`);
        return;
      }
      if (ev.target.closest('[data-back]')) { s = null; box.innerHTML = list(); }
    });
  },
};
