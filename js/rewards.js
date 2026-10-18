'use strict';
/* ============================================================
   Букваландия — экономика: магазин, достижения, испытания, уровни
   ============================================================ */

/* Уровень игрока: каждый следующий требует больше опыта */
const LEVEL = {
  need: L => 100 + 50 * L,                       // опыт, чтобы перейти с L на L+1
  start(L) { let s = 0; for (let i = 1; i < L; i++) s += LEVEL.need(i); return s; },
  of(xp) { let L = 1; while (xp >= LEVEL.start(L + 1)) L++; return L; },
  TITLES: [[1, 'Новичок'], [2, 'Ученик'], [4, 'Знайка'], [6, 'Умник'], [8, 'Мастер знаний'], [11, 'Хранитель знаний'], [14, 'Мудрец'], [18, 'Легенда Букваландии']],
  title(L) { let r = ''; LEVEL.TITLES.forEach(([at, t]) => { if (L >= at) r = t; }); return r; },
};

/* Стадии питомца — по общему числу звёзд (по всем предметам). Достигнутая стадия не теряется. */
const PET_STAGES = [
  { at: 0, name: 'Яйцо' }, { at: 1, name: 'Малыш' }, { at: 25, name: 'Подросток' }, { at: 80, name: 'Юный герой' }, { at: 170, name: 'Легенда' },
];
const PET_STAGES_V1 = [0, 1, 15, 40, 80];   // пороги первой версии — для переноса прогресса
const PET_SPECIES = {
  dragon: { name: 'Дракоша', color: '#5ED6A0' },
  cat: { name: 'Котик', color: '#FFA94D' },
  bunny: { name: 'Ушастик', color: '#B9A3FF' },
};

/* ---------- Магазин ---------- */
const SHOP = [
  /* Еда — расходуется, восстанавливает сытость */
  { id: 'apple', cat: 'food', icon: '🍎', name: 'Яблоко', price: 15, sat: 15, lvl: 1 },
  { id: 'carrot', cat: 'food', icon: '🥕', name: 'Морковка', price: 15, sat: 15, lvl: 1 },
  { id: 'cookie', cat: 'food', icon: '🍪', name: 'Печенье', price: 25, sat: 25, lvl: 2 },
  { id: 'pie', cat: 'food', icon: '🥧', name: 'Пирог', price: 45, sat: 45, lvl: 3 },
  { id: 'icecream', cat: 'food', icon: '🍦', name: 'Мороженое', price: 50, sat: 40, lvl: 4 },
  { id: 'cake', cat: 'food', icon: '🎂', name: 'Торт', price: 90, sat: 100, lvl: 6 },

  /* Одежда. Эмодзи-уборы (icon) рисуются значком, предметы с shape — рисуются по фигуре питомца (js/pet.js) */
  { id: 'cap', cat: 'hat', icon: '🧢', name: 'Кепка', price: 80, lvl: 1 },
  { id: 'bow', cat: 'hat', icon: '🎀', name: 'Бантик', price: 80, lvl: 1 },
  { id: 'nightcap', cat: 'hat', icon: '🌙', name: 'Ночной колпак', price: 120, lvl: 1, shape: 'nightcap', c1: '#9FA8DA' },
  { id: 'flower', cat: 'hat', icon: '🌸', name: 'Цветочек', price: 140, lvl: 2 },
  { id: 'bandana', cat: 'hat', icon: '🏴‍☠️', name: 'Бандана пирата', price: 220, lvl: 2, shape: 'bandana', c1: '#E53935' },
  { id: 'doccap', cat: 'hat', icon: '🩺', name: 'Шапочка доктора', price: 250, lvl: 3, shape: 'doccap' },
  { id: 'toque', cat: 'hat', icon: '👨‍🍳', name: 'Колпак повара', price: 300, lvl: 3, shape: 'toque' },
  { id: 'straw', cat: 'hat', icon: '👒', name: 'Шляпка', price: 260, lvl: 4 },
  { id: 'tophat', cat: 'hat', icon: '🎩', name: 'Цилиндр', price: 420, lvl: 6 },
  { id: 'helmet', cat: 'hat', icon: '⛑️', name: 'Шлем рыцаря', price: 600, lvl: 6, shape: 'helmet', c1: '#B0BEC5' },
  { id: 'grad', cat: 'hat', icon: '🎓', name: 'Шапочка мудреца', price: 800, lvl: 9 },
  { id: 'dome', cat: 'hat', icon: '🪐', name: 'Шлем космонавта', price: 900, lvl: 8, shape: 'dome' },
  { id: 'crown', cat: 'hat', icon: '👑', name: 'Корона', price: 2200, lvl: 13 },
  { id: 'glasses', cat: 'glasses', icon: '👓', name: 'Очки', price: 150, lvl: 2 },
  { id: 'sun', cat: 'glasses', icon: '🕶️', name: 'Тёмные очки', price: 380, lvl: 5 },
  { id: 'goggles', cat: 'glasses', icon: '🥽', name: 'Очки пловца', price: 750, lvl: 8 },
  { id: 'bowtie', cat: 'neck', icon: '🎀', name: 'Бабочка', price: 160, lvl: 2, shape: 'bowtie', c1: '#E53935' },
  { id: 'scarf', cat: 'neck', icon: '🧣', name: 'Шарф', price: 200, lvl: 3 },
  { id: 'tie', cat: 'neck', icon: '👔', name: 'Галстук', price: 200, lvl: 3, shape: 'tie', c1: '#1E88E5' },
  { id: 'beads', cat: 'neck', icon: '📿', name: 'Бусы', price: 450, lvl: 6 },
  { id: 'medal', cat: 'neck', icon: '🎖️', name: 'Орден', price: 1200, lvl: 11 },
  { id: 'tee_red', cat: 'body', icon: '👕', name: 'Футболка со звездой', price: 120, lvl: 1, shape: 'tee', c1: '#E53935', pat: 'star', sleeve: 'short' },
  { id: 'tee_blue', cat: 'body', icon: '👕', name: 'Футболка в полоску', price: 140, lvl: 1, shape: 'tee', c1: '#1E88E5', c2: '#FFFFFF', pat: 'stripes', sleeve: 'short' },
  { id: 'pajama', cat: 'body', icon: '🛌', name: 'Пижама', price: 150, lvl: 1, shape: 'pajama', c1: '#9FA8DA', c2: '#FFFFFF', pat: 'dots', sleeve: 'full', cover: true },
  { id: 'sweater', cat: 'body', icon: '🧶', name: 'Тёплый свитер', price: 220, lvl: 2, shape: 'sweater', c1: '#8E24AA', c2: '#FFD34E', pat: 'zigzag', sleeve: 'full', cover: true },
  { id: 'overalls', cat: 'body', icon: '👖', name: 'Комбинезон', price: 240, lvl: 2, shape: 'overalls', c1: '#1E88E5', c2: '#FFD34E' },
  { id: 'pirate', cat: 'body', icon: '🦜', name: 'Тельняшка пирата', price: 240, lvl: 2, shape: 'pirate', c1: '#E53935', sleeve: 'short', cover: true },
  { id: 'dress_pink', cat: 'body', icon: '👗', name: 'Платье в горошек', price: 260, lvl: 2, shape: 'dress', c1: '#FF8FB1', c2: '#FFFFFF', pat: 'dots', sleeve: 'puff' },
  { id: 'hoodie', cat: 'body', icon: '🧥', name: 'Толстовка', price: 280, lvl: 3, shape: 'hoodie', c1: '#43A047', c2: '#2E7D32', sleeve: 'full', cover: true },
  { id: 'apron', cat: 'body', icon: '🍳', name: 'Фартук повара', price: 220, lvl: 3, shape: 'apron', c1: '#FFFFFF', c2: '#E53935' },
  { id: 'coat', cat: 'body', icon: '🥼', name: 'Халат доктора', price: 280, lvl: 3, shape: 'coat', c1: '#FFFFFF', sleeve: 'full', cover: true },
  { id: 'raincoat', cat: 'body', icon: '☔', name: 'Дождевик', price: 300, lvl: 3, shape: 'raincoat', c1: '#FDD835', c2: '#F57F17', sleeve: 'full', cover: true },
  { id: 'sailor', cat: 'body', icon: '⚓', name: 'Матроска', price: 380, lvl: 4, shape: 'sailor', c1: '#1E88E5', sleeve: 'short', cover: true },
  { id: 'dress_blue', cat: 'body', icon: '👗', name: 'Праздничное платье', price: 480, lvl: 5, shape: 'dress', c1: '#6EC6FF', c2: '#FFD34E', pat: 'star', sleeve: 'puff' },
  { id: 'tux', cat: 'body', icon: '🤵', name: 'Праздничный костюм', price: 560, lvl: 6, shape: 'tux', c1: '#263238', sleeve: 'full', cover: true },
  { id: 'armor', cat: 'body', icon: '🛡️', name: 'Доспехи', price: 650, lvl: 6, shape: 'armor', c1: '#B0BEC5', c2: '#78909C', sleeve: 'full', cover: true },
  { id: 'space', cat: 'body', icon: '🧑‍🚀', name: 'Скафандр', price: 950, lvl: 8, shape: 'space', c1: '#F4F7FB', sleeve: 'full', cover: true },
  { id: 'slippers', cat: 'feet', icon: '🐰', name: 'Тапочки-зайчики', price: 120, lvl: 1, shape: 'slippers', c1: '#FFC2D4' },
  { id: 'sneakers', cat: 'feet', icon: '👟', name: 'Кроссовки', price: 150, lvl: 1, shape: 'sneakers', c1: '#1E88E5' },
  { id: 'rainboots', cat: 'feet', icon: '👢', name: 'Резиновые сапожки', price: 200, lvl: 2, shape: 'boots', c1: '#FDD835', c2: '#F57F17' },
  { id: 'jackboots', cat: 'feet', icon: '🥾', name: 'Сапоги пирата', price: 220, lvl: 2, shape: 'boots', c1: '#5B3A1E', c2: '#8D6E63' },
  { id: 'shoes', cat: 'feet', icon: '🥿', name: 'Туфельки', price: 260, lvl: 3, shape: 'shoes', c1: '#E53935', c2: '#FFD34E' },
  { id: 'moonboots', cat: 'feet', icon: '🌙', name: 'Лунные ботинки', price: 500, lvl: 8, shape: 'boots', c1: '#ECEFF1', c2: '#90A4AE' },
  { id: 'backpack', cat: 'back', icon: '🎒', name: 'Рюкзак', price: 180, lvl: 1, shape: 'backpack', c1: '#FB8C00', c2: '#FFD34E' },
  { id: 'cape_hero', cat: 'back', icon: '🦸', name: 'Плащ героя', price: 420, lvl: 4, shape: 'cape', c1: '#E53935', c2: '#FFD34E' },
  { id: 'cape_blue', cat: 'back', icon: '🛡️', name: 'Плащ рыцаря', price: 450, lvl: 6, shape: 'cape', c1: '#1E88E5', c2: '#B0BEC5' },
  { id: 'fairy', cat: 'back', icon: '🧚', name: 'Волшебные крылышки', price: 500, lvl: 5, shape: 'fairy', c1: '#CDEBFF', c2: '#FFD6F0' },
  { id: 'jetpack', cat: 'back', icon: '🚀', name: 'Ранец-ракета', price: 800, lvl: 8, shape: 'jetpack', c1: '#B0BEC5' },
  { id: 'cape_royal', cat: 'back', icon: '🟣', name: 'Королевская мантия', price: 1200, lvl: 10, shape: 'cape', c1: '#8E24AA', c2: '#FFD34E', pat: 'ermine' },

  /* Цвета питомца */
  { id: 'c_pink', cat: 'color', icon: '💗', name: 'Розовый', color: '#FF8FB1', price: 220, lvl: 2 },
  { id: 'c_sky', cat: 'color', icon: '💙', name: 'Голубой', color: '#6EC6FF', price: 220, lvl: 2 },
  { id: 'c_sun', cat: 'color', icon: '💛', name: 'Солнечный', color: '#FFD34E', price: 380, lvl: 4 },
  { id: 'c_lav', cat: 'color', icon: '💜', name: 'Лавандовый', color: '#B39DFF', price: 550, lvl: 6 },
  { id: 'c_fire', cat: 'color', icon: '🧡', name: 'Огненный', color: '#FF7A45', price: 900, lvl: 8 },
  { id: 'c_rainbow', cat: 'color', icon: '🌈', name: 'Радужный', color: 'rainbow', price: 2600, lvl: 14 },
  { id: 'c_gold', cat: 'color', icon: '✨', name: 'Золотой', color: 'gold', price: 4000, lvl: 18 },

  /* Домик. zone: floor — стоит на полу (x, y — середина низа), wall — на стене, air — в воздухе (x, y — центр).
     h — размер в единицах комнаты (комната 640×380, питомец ≈150), play — во что питомец играет, ps — с какой стадии умеет */
  { id: 'ball', cat: 'decor', icon: '⚽', name: 'Мячик', price: 90, lvl: 1, zone: 'floor', x: 420, y: 362, h: 40, play: 'kick', ps: 1 },
  { id: 'plant', cat: 'decor', icon: '🌻', name: 'Подсолнух', price: 60, lvl: 1, zone: 'floor', x: 34, y: 278, h: 100, play: 'water', ps: 1 },
  { id: 'teddy', cat: 'decor', icon: '🧸', name: 'Мишка', price: 120, lvl: 1, zone: 'floor', x: 215, y: 352, h: 70, play: 'hug', ps: 1 },
  { id: 'puzzle', cat: 'decor', icon: '🧩', name: 'Пазл', price: 110, lvl: 1, zone: 'floor', x: 255, y: 372, h: 46, play: 'build', ps: 1 },
  { id: 'books', cat: 'decor', icon: '📚', name: 'Книжки', price: 160, lvl: 2, zone: 'floor', x: 250, y: 290, h: 56, play: 'read', ps: 1 },
  { id: 'balloons', cat: 'decor', icon: '🎈', name: 'Шарики', price: 200, lvl: 2, zone: 'air', x: 600, y: 120, h: 80, play: 'float', ps: 2 },
  { id: 'drum', cat: 'decor', icon: '🥁', name: 'Барабан', price: 180, lvl: 2, zone: 'floor', x: 365, y: 300, h: 64, play: 'music', ps: 1 },
  { id: 'bed', cat: 'decor', icon: '🛏️', name: 'Кроватка', price: 300, lvl: 2, zone: 'floor', x: 560, y: 292, h: 160, play: 'sleep', ps: 1 },
  { id: 'picture', cat: 'decor', icon: '🖼️', name: 'Картина', price: 260, lvl: 3, zone: 'wall', x: 140, y: 90, h: 90, play: 'look', ps: 1 },
  { id: 'easel', cat: 'decor', icon: '🎨', name: 'Мольберт с красками', price: 300, lvl: 3, zone: 'floor', x: 95, y: 360, h: 80, play: 'paint', ps: 2 },
  { id: 'sofa', cat: 'decor', icon: '🛋️', name: 'Диванчик', price: 340, lvl: 4, zone: 'floor', x: 150, y: 296, h: 170, play: 'sit', ps: 1 },
  { id: 'kite', cat: 'decor', icon: '🎏', name: 'Рыбки-флажки', price: 420, lvl: 5, zone: 'wall', x: 575, y: 32, h: 70, play: 'look', ps: 1 },
  { id: 'guitar', cat: 'decor', icon: '🎸', name: 'Гитара', price: 550, lvl: 6, zone: 'floor', x: 610, y: 350, h: 100, play: 'music', ps: 2 },
  { id: 'fish', cat: 'decor', icon: '🐠', name: 'Аквариум', price: 700, lvl: 7, zone: 'wall', x: 470, y: 150, h: 110, play: 'look', ps: 1, tank: true },
  { id: 'telescope', cat: 'decor', icon: '🔭', name: 'Телескоп', price: 800, lvl: 8, zone: 'floor', x: 300, y: 282, h: 100, play: 'look', ps: 3 },
  { id: 'piano', cat: 'decor', icon: '🎹', name: 'Пианино', price: 1000, lvl: 9, zone: 'floor', x: 455, y: 288, h: 130, play: 'music', ps: 2 },
  { id: 'rocket', cat: 'decor', icon: '🚀', name: 'Ракета', price: 1600, lvl: 11, zone: 'floor', x: 600, y: 280, h: 120, play: 'ride', ps: 3 },
  { id: 'castle', cat: 'decor', icon: '🏰', name: 'Игрушечный замок', price: 2600, lvl: 14, zone: 'floor', x: 70, y: 372, h: 120, play: 'build', ps: 2 },
  { id: 'rainbowd', cat: 'decor', icon: '🌈', name: 'Радуга', price: 3600, lvl: 17, zone: 'wall', x: 480, y: 88, h: 130, play: 'wow', ps: 1 },
  { id: 'carousel', cat: 'decor', icon: '🎠', name: 'Карусель', price: 5000, lvl: 20, zone: 'floor', x: 520, y: 372, h: 140, play: 'ride', ps: 3 },

  /* Темы оформления */
  { id: 'th_sky', cat: 'theme', icon: '🌤️', name: 'Небо', price: 0, lvl: 1, theme: 'sky' },
  { id: 'th_sunset', cat: 'theme', icon: '🌅', name: 'Закат', price: 400, lvl: 3, theme: 'sunset' },
  { id: 'th_sea', cat: 'theme', icon: '🐚', name: 'Море', price: 600, lvl: 5, theme: 'sea' },
  { id: 'th_jungle', cat: 'theme', icon: '🌴', name: 'Джунгли', price: 850, lvl: 7, theme: 'jungle' },
  { id: 'th_candy', cat: 'theme', icon: '🍭', name: 'Конфетная', price: 1100, lvl: 9, theme: 'candy' },
  { id: 'th_space', cat: 'theme', icon: '🪐', name: 'Космос', price: 1600, lvl: 12, theme: 'space' },
];

/* Эксклюзивы: только за недельные испытания (в магазине не продаются) */
const EXCLUSIVE = [
  { id: 'x_unicorn', cat: 'decor', icon: '🦄', name: 'Единорог', zone: 'floor', x: 180, y: 368, h: 80, play: 'hug', ps: 1, exclusive: true },
  { id: 'x_star', cat: 'decor', icon: '🌟', name: 'Звезда желаний', zone: 'air', x: 70, y: 50, h: 50, play: 'wish', ps: 1, exclusive: true },
  { id: 'x_dragon', cat: 'decor', icon: '🐉', name: 'Игрушечный дракон', zone: 'floor', x: 470, y: 372, h: 80, play: 'hug', ps: 1, exclusive: true },
  { id: 'x_planet', cat: 'decor', icon: '🪐', name: 'Планета', zone: 'air', x: 230, y: 40, h: 60, play: 'look', ps: 1, exclusive: true },
  { id: 'x_mushroom', cat: 'decor', icon: '🍄', name: 'Волшебный гриб', zone: 'floor', x: 380, y: 372, h: 70, play: 'bounce', ps: 2, exclusive: true },
  { id: 'x_fireworks', cat: 'decor', icon: '🎆', name: 'Салют', zone: 'air', x: 420, y: 36, h: 70, play: 'wow', ps: 1, exclusive: true },
  { id: 'x_tent', cat: 'decor', icon: '🎪', name: 'Цирковой шатёр', zone: 'floor', x: 300, y: 290, h: 150, play: 'hide', ps: 1, exclusive: true },
  { id: 'x_crystal', cat: 'decor', icon: '🔮', name: 'Хрустальный шар', zone: 'floor', x: 520, y: 300, h: 50, play: 'look', ps: 2, exclusive: true },
];
const ITEMS = {};
[...SHOP, ...EXCLUSIVE].forEach(i => { ITEMS[i.id] = i; });
const WEAR_CATS = [['hat', 'Голова'], ['glasses', 'Очки'], ['neck', 'Шея'], ['body', 'Одежда'], ['feet', 'Обувь'], ['back', 'На спине']];

/* Костюмы: весь набор надет — питомец радуется, вокруг сияние */
const COSTUMES = [
  { id: 'pirate', name: 'Пират', icon: '🦜', items: ['bandana', 'pirate', 'jackboots'], say: 'Йо-хо-хо! Пираты на борту! Где же сундук с сокровищами?' },
  { id: 'space', name: 'Космонавт', icon: '🚀', items: ['dome', 'space', 'moonboots', 'jetpack'], say: 'Внимание! Готовность к полёту! Три, два, один — поехали!' },
  { id: 'chef', name: 'Повар', icon: '🍳', items: ['toque', 'apron'], say: 'Сегодня в меню — пирог с яблоками! Кто будет пробовать?' },
  { id: 'knight', name: 'Рыцарь', icon: '🛡️', items: ['helmet', 'armor', 'cape_blue'], say: 'Рыцарь к бою готов! Кляксус, берегись!' },
  { id: 'doctor', name: 'Доктор', icon: '🩺', items: ['doccap', 'coat'], say: 'Скажите «а-а-а»! Всех вылечу, всем помогу!' },
  { id: 'royal', name: 'Королевский наряд', icon: '👑', items: ['crown', 'cape_royal'], say: 'Королевский бал объявляется открытым!' },
  { id: 'sleepy', name: 'Пижамная вечеринка', icon: '🌙', items: ['nightcap', 'pajama', 'slippers'], say: 'Пижамная вечеринка! Будем смотреть на звёзды и слушать сказки.' },
  { id: 'rain', name: 'Прогулка под дождём', icon: '☔', items: ['raincoat', 'rainboots'], say: 'Теперь никакой дождь не страшен! Пойдём по лужам!' },
  { id: 'hero', name: 'Супергерой', icon: '🦸', items: ['cape_hero', 'tee_red'], say: 'Супергерой спешит на помощь! Вперёд, к новым знаниям!' },
  { id: 'fairy', name: 'Волшебный наряд', icon: '🧚', items: ['fairy', 'dress_blue', 'flower'], say: 'Взмах крылышками — и случится чудо!' },
  { id: 'gala', name: 'Праздничный вечер', icon: '🎩', items: ['tophat', 'tux', 'bowtie'], say: 'Добрый вечер! Позвольте пригласить вас на танец!' },
];

const SHOP_TABS = [
  { id: 'food', name: 'Еда', icon: '🍎' },
  { id: 'wear', name: 'Одежда', icon: '🎩', cats: WEAR_CATS.map(c => c[0]) },
  { id: 'color', name: 'Цвета', icon: '🎨' },
  { id: 'decor', name: 'Домик', icon: '🏠' },
  { id: 'theme', name: 'Темы', icon: '🖼️' },
  { id: 'games', name: 'Игры', icon: '🎮' },
  { id: 'prizes', name: 'Копилка', icon: '🐷' },
];

const GAMES = [
  { id: 'catch', icon: '🧺', name: 'Поймай еду', desc: 'Лови в корзинку только то, что подходит под правило. Пойманное достанется питомцу!' },
  { id: 'mathballoons', icon: '🔢', name: 'Шарики-ответы', desc: 'Сверху пример — лопни шарик с правильным ответом.' },
  { id: 'word', icon: '🔤', name: 'Собери слово', desc: 'Словарные слова рассыпались на буквы. Собери их по порядку!' },
  { id: 'listen', icon: '👂', name: 'Listen & tap', desc: 'Послушай английское слово и найди картинку.' },
  { id: 'simon', icon: '🎵', name: 'Запомни порядок', desc: 'Питомец показывает игрушки по очереди — повтори!' },
  { id: 'clock', icon: '🕰️', name: 'Который час?', desc: 'Определи время по часам со стрелками.' },
  { id: 'money', icon: '🪙', name: 'Магазин', desc: 'Заплати без сдачи и посчитай сдачу.' },
  { id: 'pos', icon: '🧺', name: 'Части речи', desc: 'Разложи слова по корзинкам: кто? что делает? какой?' },
  { id: 'sudoku', icon: '🧮', name: 'Судоку', desc: 'Расставь картинки так, чтобы в каждой строке и столбце они не повторялись.' },
  { id: 'maze', icon: '🌀', name: 'Лабиринт', desc: 'Проведи питомца к угощению. С каждым уровнем — сложнее!' },
  { id: 'balloons', icon: '🎈', name: 'Лопни шарики', desc: 'Лопай шарики с нужными буквами. 40 секунд!' },
  { id: 'memory', icon: '🃏', name: 'Найди пару', desc: 'Открывай карточки и находи одинаковые.' },
];
const FREE_GAMES = 3;   // бесплатных игр в день
const gamePrice = playsToday => playsToday < FREE_GAMES ? 0 : 100 + 30 * (playsToday - FREE_GAMES);

/* ---------- Голос питомца: благодарность за подарок (без рода — ребёнок может быть любым) ---------- */
const THANKS = {
  apple: ['Яблочко! Хрум-хрум, спасибо!', 'Какое румяное яблоко! Спасибо!'],
  carrot: ['Морковка! Я так люблю морковку!', 'Хрустящая морковка! Спасибо!'],
  cookie: ['Печенье! Ммм, вкуснятина!', 'Ура, печенье! Спасибо большое!'],
  pie: ['Пирог! Пахнет так вкусно!', 'Ой, пирог! Это настоящий праздник!'],
  icecream: ['Мороженое! Холодное и сладкое, спасибо!', 'Ура, мороженое! Это моё любимое!'],
  cake: ['Целый торт! Какой красивый!', 'Торт! У нас что, праздник? Спасибо!'],
  cap: ['Какая классная кепка! Спасибо!', 'Кепка! Теперь солнце мне не страшно!'],
  bow: ['Какой красивый бантик! Спасибо!', 'Бантик! Как мне идёт!'],
  nightcap: ['Ночной колпак! Теперь буду спать как в сказке.', 'Какой уютный колпак! Спасибо!'],
  flower: ['Цветочек! Как он чудесно пахнет!', 'Какой красивый цветочек! Спасибо!'],
  bandana: ['Бандана пирата! Йо-хо-хо!', 'Ух ты, настоящая пиратская бандана!'],
  doccap: ['Шапочка доктора! Буду всех лечить!', 'Спасибо! Доктор Питомец к работе готов!'],
  toque: ['Колпак повара! Что бы такое приготовить?', 'Какой высокий колпак! Спасибо!'],
  straw: ['Какая красивая шляпка! Спасибо!', 'Шляпка! Пойдём гулять?'],
  tophat: ['Цилиндр! Как у настоящего фокусника!', 'Какой элегантный цилиндр! Спасибо!'],
  helmet: ['Шлем рыцаря! Теперь мне ничего не страшно!', 'Ух ты, настоящий шлем! Спасибо!'],
  grad: ['Шапочка мудреца! Теперь я знаю ещё больше!', 'Спасибо! Буду знать всё на свете!'],
  dome: ['Шлем космонавта! Летим к звёздам!', 'Ух ты! Я вижу космос!'],
  crown: ['Корона! Я чувствую себя настоящей королевской особой!', 'Какая сияющая корона! Спасибо огромное!'],
  glasses: ['Очки! Теперь я всё вижу!', 'В очках у меня такой учёный вид! Спасибо!'],
  sun: ['Тёмные очки! Как модно!', 'Спасибо! Теперь солнышко не слепит.'],
  goggles: ['Очки пловца! Пойдём купаться?', 'Ура! Буду нырять как рыбка!'],
  bowtie: ['Какая нарядная бабочка! Спасибо!', 'Бабочка! Можно идти на праздник!'],
  scarf: ['Тёплый шарфик! Теперь не замёрзну.', 'Какой мягкий шарф! Спасибо!'],
  tie: ['Галстук! Совсем как у взрослых!', 'Спасибо! В галстуке у меня такой важный вид!'],
  beads: ['Бусы! Как они блестят!', 'Какие красивые бусы! Спасибо!'],
  medal: ['Орден! За отличную учёбу, да?', 'Настоящий орден! Я так горжусь!'],
  tee_red: ['Футболка со звездой! Мне очень нравится!', 'Какая яркая футболка! Спасибо!'],
  tee_blue: ['Футболка в полоску! Как у моряка!', 'Спасибо за футболку! Она такая удобная!'],
  pajama: ['Пижама! Мягкая-премягкая, спасибо!', 'Ура, пижама! Теперь сны будут сладкие.'],
  sweater: ['Тёплый свитер! Как уютно!', 'Какой красивый свитер! Спасибо!'],
  overalls: ['Комбинезон! В нём удобно играть!', 'Спасибо за комбинезон! Пойдём лазать?'],
  pirate: ['Тельняшка пирата! Свистать всех наверх!', 'Ура, тельняшка! Почти как у пирата!'],
  dress_pink: ['Какое красивое платье в горошек! Спасибо!', 'Платье! Я кружусь, как на балу!'],
  hoodie: ['Толстовка с капюшоном! Как удобно!', 'Спасибо за толстовку! Она такая тёплая!'],
  apron: ['Фартук повара! Будем печь пироги?', 'Спасибо! Теперь можно готовить!'],
  coat: ['Халат доктора! Где мой градусник?', 'Спасибо! Буду лечить все игрушки!'],
  raincoat: ['Дождевик! Теперь можно гулять в дождь!', 'Какой яркий дождевик! Спасибо!'],
  sailor: ['Матроска! Полный вперёд!', 'Как у настоящего моряка! Спасибо!'],
  dress_blue: ['Праздничное платье! Оно волшебное!', 'Ой, какое нарядное платье! Спасибо!'],
  tux: ['Праздничный костюм! Можно идти в театр!', 'Какой нарядный костюм! Спасибо!'],
  armor: ['Доспехи! Я как рыцарь из сказки!', 'Ух ты, настоящие доспехи! Спасибо!'],
  space: ['Скафандр! Летим на Луну!', 'Настоящий скафандр! Спасибо огромное!'],
  slippers: ['Тапочки-зайчики! Такие мягкие!', 'Ой, у тапочек есть ушки! Спасибо!'],
  sneakers: ['Кроссовки! Теперь я буду бегать быстро-быстро!', 'Классные кроссовки! Спасибо!'],
  rainboots: ['Резиновые сапожки! Ура, лужи!', 'Спасибо! Буду прыгать по лужам!'],
  jackboots: ['Сапоги пирата! Йо-хо-хо!', 'Какие высокие сапоги! Спасибо!'],
  shoes: ['Какие красивые туфельки! Спасибо!', 'Туфельки! Можно танцевать!'],
  moonboots: ['Лунные ботинки! Прыг-скок по Луне!', 'Спасибо! Можно шагать по Луне!'],
  backpack: ['Рюкзак! Сложу туда учебники!', 'Какой удобный рюкзак! Пойдём в поход?'],
  cape_hero: ['Плащ героя! Я лечу на помощь!', 'Ух ты! В этом плаще я как супергерой!'],
  cape_blue: ['Плащ рыцаря! Как развевается!', 'Спасибо за плащ! Он такой благородный!'],
  fairy: ['Волшебные крылышки! Я почти лечу!', 'Какие нежные крылышки! Спасибо!'],
  jetpack: ['Ранец-ракета! Взлетаем!', 'Ух ты! Теперь я могу летать!'],
  cape_royal: ['Королевская мантия! Как торжественно!', 'Спасибо! Я чувствую себя настоящей королевской особой!'],
  c_pink: ['Розовый цвет! Как зефирка!', 'Ой, какой нежный цвет! Спасибо!'],
  c_sky: ['Голубой! Как небо!', 'Мне так нравится этот цвет! Спасибо!'],
  c_sun: ['Солнечный цвет! Я как лучик!', 'Какой яркий цвет! Спасибо!'],
  c_lav: ['Лавандовый! Как цветы на поле!', 'Какой красивый цвет! Спасибо!'],
  c_fire: ['Огненный цвет! Я горю от радости!', 'Ух ты, какой яркий! Спасибо!'],
  c_rainbow: ['Радужный! Я переливаюсь всеми цветами!', 'Ой, у меня все цвета радуги! Спасибо огромное!'],
  c_gold: ['Золотой! Я сияю как солнце!', 'Золотой цвет! Это просто чудо! Спасибо!'],
  ball: ['Какой красивый мячик! Спасибо! Давай играть!', 'Мячик! Кинь мне его, я поймаю!'],
  plant: ['Подсолнух! Какой солнечный цветок!', 'Спасибо за цветок! Буду его поливать.'],
  teddy: ['Мишка! Какой мягкий и пушистый! Спасибо!', 'Ура, плюшевый мишка! Буду с ним обниматься!'],
  puzzle: ['Пазл! Давай собирать вместе!', 'Спасибо! Люблю собирать картинки!'],
  books: ['Книжки! Обожаю сказки! Спасибо!', 'Сколько книжек! Почитаем вместе?'],
  balloons: ['Воздушные шарики! Какие разноцветные!', 'Ура, шарики! Держи их крепче, а то улетят!'],
  drum: ['Барабан! Бум-бум-бум! Спасибо!', 'Ура, барабан! Сыграем марш?'],
  bed: ['Кроватка! Теперь мне будет так уютно спать!', 'Какая мягкая кроватка! Спасибо!'],
  picture: ['Картина! Какая красивая! Повесим на стену.', 'Спасибо! Теперь у нас настоящий музей!'],
  easel: ['Мольберт и краски! Нарисую тебе картину!', 'Спасибо! Я буду настоящим художником!'],
  sofa: ['Диванчик! Можно присесть и отдохнуть. Спасибо!', 'Какой мягкий диван! Попрыгаем?'],
  kite: ['Рыбки-флажки! Как красиво развеваются!', 'Спасибо! Комната стала такой праздничной!'],
  guitar: ['Гитара! Сыграю тебе песенку!', 'Спасибо за гитару! Тренди-бренди!'],
  fish: ['Аквариум с рыбками! Привет, рыбки!', 'Спасибо! Буду смотреть, как они плавают.'],
  telescope: ['Телескоп! Посмотрим на звёзды?', 'Спасибо! Теперь я увижу Луну совсем близко!'],
  piano: ['Пианино! Я сыграю тебе мелодию!', 'Какое красивое пианино! Спасибо!'],
  rocket: ['Ракета! Полетели в космос!', 'Ух ты, настоящая ракета! Спасибо!'],
  castle: ['Замок! Тут можно играть в королевство!', 'Какой огромный замок! Спасибо!'],
  rainbowd: ['Радуга! Прямо у нас дома!', 'Какая яркая радуга! Спасибо!'],
  carousel: ['Карусель! Покатаемся? Ура!', 'Настоящая карусель! Это лучший подарок!'],
  th_sunset: ['Закат! Как красиво и тепло.', 'Спасибо! Вечернее небо такое розовое!'],
  th_sea: ['Море! Слышишь, как шумят волны?', 'Ура, море! Спасибо!'],
  th_jungle: ['Джунгли! Тут живут обезьянки!', 'Спасибо! Как зелено вокруг!'],
  th_candy: ['Конфетная страна! Всё такое сладкое!', 'Ой, как вкусно выглядит! Спасибо!'],
  th_space: ['Космос! Сколько звёзд!', 'Ух ты, мы среди звёзд! Спасибо!'],
};
/* Словарные слова 2–3 класса: заглавная буква — та, которую нужно запомнить (для загадок и игры «Собери слово») */
const DICT_WORDS = ['сОбака', 'вОрона', 'кОрова', 'сОрока', 'кАрандаш', 'тЕтрадь', 'пЕнал', 'учЕник', 'учИтель', 'бЕрёза', 'кАпуста', 'мОрковь',
  'Огурец', 'пОмидор', 'мАлина', 'мОлоко', 'мОроз', 'Одежда', 'пАльто', 'пОсуда', 'рАбота', 'рЕбята', 'сАпоги', 'суббОта', 'гОрод', 'дЕревня',
  'дЕвочка', 'мАльчик', 'лИсица', 'мЕдведь', 'пЕтух', 'вОробей', 'дЕжурный', 'тАрелка', 'лОпата', 'кАртофель', 'мЕбель', 'квАртира', 'нАрод',
  'хОрошо', 'вЕсело', 'тОпор', 'кОстюм', 'плАток', 'мАгазин', 'кАртина', 'кОнфета', 'кОмната', 'пОгода', 'кАникулы', 'лЯгушка', 'сЕвер',
  'вЕтер', 'мЕшок', 'стАкан', 'сОлдат', 'сОлома', 'Аптека', 'зАвод', 'кАрман'];
const DICT_ALT = { о: 'а', а: 'о', е: 'и', и: 'е', я: 'е' };

const THANKS_ANY =['Спасибо тебе большое!', 'Какой чудесный подарок! Спасибо!', 'Ой, это мне? Спасибо!'];

/* ---------- Достижения ---------- */
const ACH = [
  { id: 'first', icon: '👣', name: 'Первый шаг', desc: 'Пройди первый урок', reward: 30 },
  { id: 'star3', icon: '🌟', name: 'Отличник', desc: 'Получи 3 звезды за урок', reward: 50 },
  { id: 'stars10', icon: '⭐', name: 'Звёздочка', desc: 'Собери 10 звёзд', reward: 80 },
  { id: 'stars30', icon: '💫', name: 'Созвездие', desc: 'Собери 30 звёзд', reward: 150 },
  { id: 'stars60', icon: '🌠', name: 'Млечный путь', desc: 'Собери 60 звёзд', reward: 300 },
  { id: 'stars100', icon: '🌌', name: 'Галактика', desc: 'Собери 100 звёзд', reward: 600 },
  { id: 'streak3', icon: '🔥', name: 'Три дня подряд', desc: 'Занимайся 3 дня подряд', reward: 60 },
  { id: 'streak7', icon: '🔥', name: 'Неделя без пропусков', desc: 'Занимайся 7 дней подряд', reward: 150 },
  { id: 'streak14', icon: '☄️', name: 'Две недели', desc: 'Занимайся 14 дней подряд', reward: 300 },
  { id: 'streak30', icon: '🏔️', name: 'Железная воля', desc: 'Занимайся 30 дней подряд', reward: 800 },
  { id: 'combo10', icon: '⚡', name: 'Молния', desc: '10 правильных ответов подряд', reward: 60 },
  { id: 'combo25', icon: '🌩️', name: 'Гроза ошибок', desc: '25 правильных ответов подряд', reward: 200 },
  { id: 'correct100', icon: '✅', name: 'Сотня', desc: '100 правильных ответов', reward: 80 },
  { id: 'correct500', icon: '🎯', name: 'Снайпер', desc: '500 правильных ответов', reward: 250 },
  { id: 'correct1000', icon: '🏹', name: 'Тысячник', desc: '1000 правильных ответов', reward: 500 },
  { id: 'perfect5', icon: '💎', name: 'Без единой ошибки', desc: '5 уроков без ошибок', reward: 150 },
  { id: 'fix20', icon: '🩹', name: 'Работа над ошибками', desc: 'Исправь 20 ошибок', reward: 150 },
  { id: 'shop1', icon: '🛍️', name: 'Первая покупка', desc: 'Купи что-нибудь в магазине', reward: 20 },
  { id: 'feed10', icon: '🥕', name: 'Заботливый друг', desc: 'Покорми питомца 10 раз', reward: 80 },
  { id: 'play50', icon: '🎾', name: 'Лучший друг', desc: 'Поиграй с питомцем 50 раз', reward: 120 },
  { id: 'riddle10', icon: '🦉', name: 'Отгадчик', desc: 'Отгадай 10 загадок питомца', reward: 150 },
  { id: 'costume1', icon: '🎭', name: 'Первый костюм', desc: 'Надень питомцу полный костюм', reward: 100 },
  { id: 'costume5', icon: '🎪', name: 'Мастер костюмов', desc: 'Собери 5 разных костюмов', reward: 400 },
  { id: 'piggy1', icon: '🐷', name: 'Копилка', desc: 'Накопи на свою цель', reward: 100 },
  { id: 'pet2', icon: '🐣', name: 'Подрос!', desc: 'Питомец стал подростком', reward: 100 },
  { id: 'pet3', icon: '🦸', name: 'Юный герой', desc: 'Питомец стал юным героем', reward: 250 },
  { id: 'pet4', icon: '🏆', name: 'Легенда', desc: 'Питомец стал легендой', reward: 500 },
  { id: 'level5', icon: '🎖️', name: 'Уровень 5', desc: 'Достигни 5 уровня', reward: 100 },
  { id: 'level10', icon: '🥈', name: 'Уровень 10', desc: 'Достигни 10 уровня', reward: 300 },
  { id: 'level15', icon: '🥇', name: 'Уровень 15', desc: 'Достигни 15 уровня', reward: 600 },
  { id: 'weekly1', icon: '📅', name: 'Испытатель', desc: 'Выполни все испытания недели', reward: 100 },
  { id: 'stars200', icon: '🪐', name: 'Вселенная', desc: 'Собери 200 звёзд', reward: 1000 },
  { id: 'poly1', icon: '🎓', name: 'Учёный день', desc: 'Пройди уроки по всем предметам за один день', reward: 60 },
  { id: 'poly10', icon: '📚', name: 'Всезнайка', desc: '10 учёных дней', reward: 300 },
  { id: 'mul_all', icon: '🧮', name: 'Знаток таблицы', desc: 'Выучи всю таблицу умножения в тренажёре', reward: 400 },
  ...ALL_WORLDS.map(w => ({ id: 'boss_' + w.id, icon: w.boss.emoji, name: 'Победитель: ' + w.boss.name, desc: 'Победи босса мира «' + w.name + '»', reward: 50 + w.wi * 25 })),
  { id: 'hero', icon: '🦸‍♀️', name: 'Спаситель Букваландии', desc: 'Победи всех боссов русского языка', reward: 1000 },
  { id: 'mayor', icon: '🏅', name: 'Мэр Числограда', desc: 'Победи всех боссов математики', reward: 1000 },
  { id: 'en_all', icon: '🎡', name: 'Король Острова Hello', desc: 'Победи всех боссов английского', reward: 1000 },
  { id: 'stars300', icon: '🌞', name: 'Звёздный мастер', desc: 'Собери 300 звёзд', reward: 2000 },
];

/* ---------- Недельные испытания ---------- */
const WEEKLY_POOL = [
  { id: 'stars', text: 'Заработай 10 новых звёзд', ev: 'star', goal: 10 },
  { id: 'lessons', text: 'Пройди 8 уроков', ev: 'lesson', goal: 8 },
  { id: 'fix', text: 'Исправь 10 ошибок', ev: 'fix', goal: 10 },
  { id: 'perfect', text: 'Пройди 3 урока без ошибок', ev: 'perfect', goal: 3 },
  { id: 'days', text: 'Занимайся 4 разных дня', ev: 'day', goal: 4 },
  { id: 'combo', text: 'Ответь правильно 15 раз подряд', ev: 'combo', goal: 15, max: true },
  { id: 'correct', text: 'Дай 120 правильных ответов', ev: 'correct', goal: 120 },
  { id: 'replay', text: 'Улучши 3 урока до 3 звёзд', ev: 'three', goal: 3 },
  { id: 'ru5', text: 'Пройди 5 уроков русского языка', ev: 'lesson_ru', goal: 5 },
  { id: 'math5', text: 'Пройди 5 уроков математики', ev: 'lesson_math', goal: 5 },
  { id: 'en5', text: 'Пройди 5 уроков английского', ev: 'lesson_en', goal: 5 },
  { id: 'mul40', text: 'Ответь правильно 40 раз в тренажёре таблицы', ev: 'mul', goal: 40 },
  { id: 'poly', text: 'Устрой 2 учёных дня (все предметы за день)', ev: 'poly', goal: 2 },
];
const WEEKLY_REWARD = 150;

/* ---------- Мини-игры: наборы букв ---------- */
const BALLOON_SETS = [
  { name: 'гласные', yes: 'аоуыэеёюяи', no: 'бвгджзклмнпрстфхцчшщ' },
  { name: 'звонкие согласные', yes: 'бвгджзлмнрй', no: 'пфктшсхцчщаоуи' },
  { name: 'глухие согласные', yes: 'пфктшсхцчщ', no: 'бвгджзлмнраоу' },
  { name: 'шипящие: Ж, Ш, Ч, Щ', yes: 'жшчщ', no: 'бвгдзклмнпрстфхц' },
  { name: 'английские гласные: A, E, I, O, U', yes: 'aeiou', no: 'bcdfghjklmnpqrstvwz' },
  { name: 'чётные числа', yes: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'], no: ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19'] },
  { name: 'числа из таблицы на 5', yes: ['5', '10', '15', '20', '25', '30', '35', '40', '45'], no: ['12', '18', '21', '27', '33', '14', '8', '6', '22'] },
];
