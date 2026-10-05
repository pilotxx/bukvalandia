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
  { at: 0, name: 'Яйцо' }, { at: 1, name: 'Малыш' }, { at: 20, name: 'Подросток' }, { at: 60, name: 'Юный герой' }, { at: 130, name: 'Легенда' },
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

  /* Одежда */
  { id: 'cap', cat: 'hat', icon: '🧢', name: 'Кепка', price: 80, lvl: 1 },
  { id: 'bow', cat: 'hat', icon: '🎀', name: 'Бантик', price: 80, lvl: 1 },
  { id: 'flower', cat: 'hat', icon: '🌸', name: 'Цветочек', price: 140, lvl: 2 },
  { id: 'straw', cat: 'hat', icon: '👒', name: 'Шляпка', price: 260, lvl: 4 },
  { id: 'tophat', cat: 'hat', icon: '🎩', name: 'Цилиндр', price: 420, lvl: 6 },
  { id: 'grad', cat: 'hat', icon: '🎓', name: 'Шапочка мудреца', price: 800, lvl: 9 },
  { id: 'crown', cat: 'hat', icon: '👑', name: 'Корона', price: 2200, lvl: 13 },
  { id: 'glasses', cat: 'glasses', icon: '👓', name: 'Очки', price: 150, lvl: 2 },
  { id: 'sun', cat: 'glasses', icon: '🕶️', name: 'Тёмные очки', price: 380, lvl: 5 },
  { id: 'goggles', cat: 'glasses', icon: '🥽', name: 'Очки пловца', price: 750, lvl: 8 },
  { id: 'scarf', cat: 'neck', icon: '🧣', name: 'Шарф', price: 200, lvl: 3 },
  { id: 'beads', cat: 'neck', icon: '📿', name: 'Бусы', price: 450, lvl: 6 },
  { id: 'medal', cat: 'neck', icon: '🎖️', name: 'Орден', price: 1200, lvl: 11 },

  /* Цвета питомца */
  { id: 'c_pink', cat: 'color', icon: '💗', name: 'Розовый', color: '#FF8FB1', price: 220, lvl: 2 },
  { id: 'c_sky', cat: 'color', icon: '💙', name: 'Голубой', color: '#6EC6FF', price: 220, lvl: 2 },
  { id: 'c_sun', cat: 'color', icon: '💛', name: 'Солнечный', color: '#FFD34E', price: 380, lvl: 4 },
  { id: 'c_lav', cat: 'color', icon: '💜', name: 'Лавандовый', color: '#B39DFF', price: 550, lvl: 6 },
  { id: 'c_fire', cat: 'color', icon: '🧡', name: 'Огненный', color: '#FF7A45', price: 900, lvl: 8 },
  { id: 'c_rainbow', cat: 'color', icon: '🌈', name: 'Радужный', color: 'rainbow', price: 2600, lvl: 14 },
  { id: 'c_gold', cat: 'color', icon: '✨', name: 'Золотой', color: 'gold', price: 4000, lvl: 18 },

  /* Домик */
  { id: 'plant', cat: 'decor', icon: '🌻', name: 'Подсолнух', price: 60, lvl: 1, x: 8, y: 62, s: 44 },
  { id: 'teddy', cat: 'decor', icon: '🧸', name: 'Мишка', price: 120, lvl: 1, x: 80, y: 70, s: 40 },
  { id: 'ball', cat: 'decor', icon: '⚽', name: 'Мячик', price: 90, lvl: 1, x: 66, y: 82, s: 28 },
  { id: 'balloons', cat: 'decor', icon: '🎈', name: 'Шарики', price: 200, lvl: 2, x: 88, y: 18, s: 40 },
  { id: 'books', cat: 'decor', icon: '📚', name: 'Книжки', price: 160, lvl: 2, x: 22, y: 78, s: 34 },
  { id: 'picture', cat: 'decor', icon: '🖼️', name: 'Картина', price: 260, lvl: 3, x: 22, y: 20, s: 42 },
  { id: 'sofa', cat: 'decor', icon: '🛋️', name: 'Диванчик', price: 340, lvl: 4, x: 14, y: 50, s: 54 },
  { id: 'kite', cat: 'decor', icon: '🎏', name: 'Рыбки-флажки', price: 420, lvl: 5, x: 70, y: 16, s: 38 },
  { id: 'guitar', cat: 'decor', icon: '🎸', name: 'Гитара', price: 550, lvl: 6, x: 90, y: 52, s: 42 },
  { id: 'fish', cat: 'decor', icon: '🐠', name: 'Аквариум', price: 700, lvl: 7, x: 40, y: 18, s: 38 },
  { id: 'piano', cat: 'decor', icon: '🎹', name: 'Пианино', price: 1000, lvl: 9, x: 32, y: 50, s: 46 },
  { id: 'rocket', cat: 'decor', icon: '🚀', name: 'Ракета', price: 1600, lvl: 11, x: 92, y: 80, s: 44 },
  { id: 'castle', cat: 'decor', icon: '🏰', name: 'Игрушечный замок', price: 2600, lvl: 14, x: 6, y: 84, s: 46 },
  { id: 'rainbowd', cat: 'decor', icon: '🌈', name: 'Радуга', price: 3600, lvl: 17, x: 54, y: 10, s: 52 },
  { id: 'carousel', cat: 'decor', icon: '🎠', name: 'Карусель', price: 5000, lvl: 20, x: 78, y: 40, s: 48 },

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
  { id: 'x_unicorn', cat: 'decor', icon: '🦄', name: 'Единорог', x: 50, y: 30, s: 40, exclusive: true },
  { id: 'x_star', cat: 'decor', icon: '🌟', name: 'Звезда желаний', x: 10, y: 8, s: 34, exclusive: true },
  { id: 'x_dragon', cat: 'decor', icon: '🐉', name: 'Игрушечный дракон', x: 60, y: 60, s: 40, exclusive: true },
  { id: 'x_planet', cat: 'decor', icon: '🪐', name: 'Планета', x: 30, y: 6, s: 36, exclusive: true },
  { id: 'x_mushroom', cat: 'decor', icon: '🍄', name: 'Волшебный гриб', x: 44, y: 84, s: 32, exclusive: true },
  { id: 'x_fireworks', cat: 'decor', icon: '🎆', name: 'Салют', x: 78, y: 4, s: 36, exclusive: true },
  { id: 'x_tent', cat: 'decor', icon: '🎪', name: 'Цирковой шатёр', x: 58, y: 40, s: 40, exclusive: true },
  { id: 'x_crystal', cat: 'decor', icon: '🔮', name: 'Хрустальный шар', x: 4, y: 34, s: 32, exclusive: true },
];
const ITEMS = {};
[...SHOP, ...EXCLUSIVE].forEach(i => { ITEMS[i.id] = i; });

const SHOP_TABS = [
  { id: 'food', name: 'Еда', icon: '🍎' },
  { id: 'wear', name: 'Одежда', icon: '🎩', cats: ['hat', 'glasses', 'neck'] },
  { id: 'color', name: 'Цвета', icon: '🎨' },
  { id: 'decor', name: 'Домик', icon: '🏠' },
  { id: 'theme', name: 'Темы', icon: '🖼️' },
  { id: 'games', name: 'Игры', icon: '🎮' },
  { id: 'prizes', name: 'Призы', icon: '🎁' },
];

const GAMES = [
  { id: 'balloons', icon: '🎈', name: 'Лопни шарики', desc: 'Лопай шарики с нужными буквами. 40 секунд!' },
  { id: 'memory', icon: '🃏', name: 'Найди пару', desc: 'Открывай карточки и находи одинаковые.' },
];
const gamePrice = playsToday => 100 + 30 * playsToday;

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
  { name: 'чётные числа', yes: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'], no: ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19'] },
  { name: 'числа из таблицы на 5', yes: ['5', '10', '15', '20', '25', '30', '35', '40', '45'], no: ['12', '18', '21', '27', '33', '14', '8', '6', '22'] },
];
