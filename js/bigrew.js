'use strict';
/* ============================================================
   Букваландия — награды за главных боссов (этап 5, 21.11)
   Кляксус (w8, русский)      → 🏫 Школа питомца: питомец решает задания пройденных тем, ребёнок проверяет —
                                 находит ошибку, показывает верный ответ и выбирает правило (запоминалку темы).
   Биг-Бен (ew8, английский)  → ✈️ Путешествие по Британии: 6 остановок, задания труднее обычных (без подсказок),
                                 сценки-диалоги; за каждую остановку — сувенир в домик, за весь путь — колесо обозрения.
   Тысячник (mw9, математика) → 🏝️ Свой остров: постройки за монеты, жители, расширение острова.
   Открываются победой над своим главным боссом (и у старого сохранения, где босс уже побеждён).
   Состояние — S.big (в defaults() app.js). Без таймеров и наказаний.
   ============================================================ */

const BIG = [
  { id: 'school', world: 'w8', icon: '🏫', name: 'Школа питомца', subj: 'ru',
    desc: 'Теперь урок ведёшь ты! Питомец решает задания, а ты проверяешь: находишь ошибки, показываешь, как правильно, и объясняешь правило.' },
  { id: 'trip', world: 'ew8', icon: '✈️', name: 'Путешествие', subj: 'en',
    desc: 'Путешествие по Британии: шесть остановок, трудные задания по-английски и разговоры с жителями. За каждую остановку — редкий сувенир!' },
  { id: 'isl', world: 'mw9', icon: '🏝️', name: 'Свой остров', subj: 'math',
    desc: 'Свой остров: строй домики, фонтаны, карусели и замок за монеты. Чем больше жителей — тем больше можно построить.' },
];

/* ФРАЗЫ ПИТОМЦА (их собирает озвучка: всё между этой меткой и «КОНЕЦ ФРАЗ»; только речь питомца, без рода) */
const BIG_SAY = {
  news: 'Смотри, у нас новая награда! Пойдём посмотрим?',
  scStart: ['Начинаем урок! Я буду стараться!', 'Ура, урок! Проверяй меня внимательно!'],
  scThink: ['Я думаю, вот так!', 'Кажется, я знаю ответ!', 'Хм… Наверное, так!', 'Проверь меня, пожалуйста!'],
  scRight: ['Ура, у меня правильно!', 'Здорово, я всё лучше отвечаю!'],
  scCaught: ['Ой, ошибочка вышла! Как же правильно?', 'Ой, ошибка! Покажи, как правильно.'],
  scMissed: 'Ой, а тут была ошибка! Давай посмотрим вместе.',
  scNotErr: 'А мне кажется, тут всё верно. Давай проверим!',
  scFixed: 'Понятно! А какое правило тут помогает?',
  scRule: ['Спасибо! Теперь я запомню это правило!', 'Как интересно! Теперь буду знать!'],
  scRuleNo: 'Давай вспомним правило вместе.',
  scEnd: 'Спасибо за урок! Мне так нравится учиться у тебя!',
  scPrize: 'Смотри, мне дали награду за учёбу! Это благодаря тебе!',
  trOpen: 'Ура, путешествие! Берём с собой хорошее настроение!',
  trSouv: 'Какой чудесный сувенир! Поставим его в домике!',
  trAll: 'Мы проехали всю Британию! Вот это приключение!',
  trAgain: 'Почти получилось! Давай попробуем эту остановку ещё раз.',
  isOpen: ['Это наш остров! Что построим сегодня?', 'Как хорошо на нашем острове!'],
  isBuild: ['Какая красивая постройка!', 'Ура, остров растёт!', 'Здесь будет так уютно!', 'Вот это да! Мне нравится!'],
  isMoney: 'Нужно ещё немного монет. Позанимаемся?',
  isPop: 'Сначала нужно больше жителей. Построим домики!',
  isRank: 'Наш остров становится всё больше и больше!',
  isBig: 'Остров стал больше! Сколько тут места!',
};
/* КОНЕЦ ФРАЗ */

/* Награды-предметы для домика (не продаются). Попадают в тот же список, что игрушки-боссы:
   их показывает комната, гардероб «Домик» и желание «игрушка». */
const BIG_ITEMS = [
  { id: 'sc_cert', cat: 'decor', icon: '📜', name: 'Похвальная грамота', zone: 'wall', x: 595, y: 150, h: 60, play: 'look', ps: 1 },
  { id: 'sc_globe', cat: 'decor', icon: '🌍', name: 'Глобус', zone: 'floor', x: 330, y: 300, h: 64, play: 'look', ps: 1 },
  { id: 'sc_cap', cat: 'decor', icon: '🎓', name: 'Шапочка отличника', zone: 'floor', x: 140, y: 330, h: 46, play: 'look', ps: 1 },
  { id: 'tr_plane', cat: 'decor', icon: '✈️', name: 'Самолётик', zone: 'air', x: 150, y: 46, h: 56, play: 'float', ps: 1 },
  { id: 'tr_train', cat: 'decor', icon: '🚂', name: 'Паровозик', zone: 'floor', x: 400, y: 340, h: 60, play: 'ride', ps: 1 },
  { id: 'tr_sheep', cat: 'decor', icon: '🐑', name: 'Овечка', zone: 'floor', x: 250, y: 350, h: 60, play: 'hug', ps: 1 },
  { id: 'tr_crown', cat: 'decor', icon: '👑', name: 'Корона', zone: 'floor', x: 480, y: 330, h: 44, play: 'look', ps: 1 },
  { id: 'tr_boat', cat: 'decor', icon: '⛵', name: 'Кораблик', zone: 'floor', x: 560, y: 350, h: 60, play: 'look', ps: 1 },
  { id: 'tr_umb', cat: 'decor', icon: '☂️', name: 'Зонтик', zone: 'floor', x: 40, y: 340, h: 70, play: 'look', ps: 1 },
  { id: 'tr_wheel', cat: 'decor', icon: '🎡', name: 'Колесо обозрения', zone: 'floor', x: 600, y: 300, h: 130, play: 'ride', ps: 1 },
];
if (typeof ITEMS !== 'undefined' && typeof BOSS_TOYS !== 'undefined') BIG_ITEMS.forEach(i => { i.big = true; BOSS_TOYS.push(i); ITEMS[i.id] = i; });

/* ============================================================
   ПУТЕШЕСТВИЕ: остановки и сценки (английские строки q и a[0] озвучиваются — их собирает тест\англ_фразы.html)
   q — что говорит житель, tq — перевод; a[0] — верный ответ, ta — его перевод; ctx — подсказка-ситуация по-русски.
   ============================================================ */
const TRIP_PASS = 6;      // из 8 заданий с первой попытки — остановка пройдена
const TRIP = [
  { id: 'air', icon: '✈️', name: 'Аэропорт', souv: 'tr_plane', c1: '#9AD8FF', c2: '#3A8DFF',
    desc: 'Самолёт приземлился! Пройди контроль, найди свою сумку и поговори с работниками аэропорта.',
    les: ['e_be', 'e_dialog', 'e_family', 'e_num1'],
    sits: [
      { who: '👩', q: 'Hello! How are you?', tq: 'Привет! Как дела?', a: ["I'm fine, thank you.", "I'm eight.", "It's red."], ta: 'Хорошо, спасибо.' },
      { who: '👮', q: 'Can I see your passport, please?', tq: 'Можно посмотреть твой паспорт?', a: ['Here you are.', 'Good night!', 'I like apples.'], ta: 'Вот, пожалуйста.' },
      { who: '👩', q: 'How old are you?', tq: 'Сколько тебе лет?', a: ["I'm nine.", "I'm fine.", "It's blue."], ta: 'Мне девять лет.' },
      { who: '👨', q: 'Where are you from?', tq: 'Откуда ты?', a: ["I'm from Russia.", "I'm happy.", "It's a bag."], ta: 'Я из России.' },
      { who: '👨', q: 'Is this your bag?', tq: 'Это твоя сумка?', a: ['Yes, it is.', 'Yes, I can.', 'Yes, I have.'], ta: 'Да, моя.' },
    ] },
  { id: 'train', icon: '🚂', name: 'Поезд', souv: 'tr_train', c1: '#FFB38A', c2: '#E8603B',
    desc: 'Едем на поезде! Купи билеты, найди свободное место и поговори с попутчиками.',
    les: ['e_num2', 'e_have', 'e_colours', 'e_food'],
    sits: [
      { who: '👨', q: 'How many tickets?', tq: 'Сколько билетов?', a: ['Two tickets, please.', 'Two cats, please.', "I'm two."], ta: 'Два билета, пожалуйста.' },
      { who: '👧', q: 'Is this seat free?', tq: 'Это место свободно?', a: ['Yes, sit down, please.', 'Yes, I am.', "No, I can't swim."], ta: 'Да, садись, пожалуйста.' },
      { who: '👦', q: 'Have you got a pet?', tq: 'У тебя есть питомец?', a: ['Yes, I have.', 'Yes, I am.', 'Yes, it is.'], ta: 'Да, есть.' },
      { who: '👵', q: 'Would you like an apple?', tq: 'Хочешь яблоко?', a: ['Yes, please.', 'Hello!', "It's green."], ta: 'Да, пожалуйста.' },
      { who: '👦', q: 'What colour is the train?', ctx: 'Поезд красный.', tq: 'Какого цвета поезд?', a: ["It's red.", "It's Monday.", "I'm red."], ta: 'Он красный.' },
    ] },
  { id: 'farm', icon: '🐑', name: 'Ферма', souv: 'tr_sheep', c1: '#A8E6A0', c2: '#3DB57A',
    desc: 'В гостях на ферме: животные, их голоса и умения. Фермер задаёт вопросы!',
    les: ['e_farm', 'e_wild', 'e_can', 'e_plural'],
    sits: [
      { who: '👨', pic: '🐑', q: "What's this?", tq: 'Что это?', a: ["It's a sheep.", "It's a cow.", "It's a sheeps."], ta: 'Это овца.' },
      { who: '👩', pic: '🐄🐄🐄', q: 'How many cows can you see?', tq: 'Сколько коров ты видишь?', a: ['I can see three cows.', 'I can see three cow.', 'I can see two cows.'], ta: 'Я вижу трёх коров.' },
      { who: '👨', pic: '🦆', q: 'Can a duck swim?', tq: 'Утка умеет плавать?', a: ['Yes, it can.', 'Yes, it is.', "No, it can't."], ta: 'Да, умеет.' },
      { who: '👩', pic: '🐷', q: 'Can a pig fly?', tq: 'Свинья умеет летать?', a: ["No, it can't.", 'Yes, it can.', "No, it isn't."], ta: 'Нет, не умеет.' },
      { who: '👨', q: "Which animal says 'moo'?", tq: 'Какое животное говорит «му»?', a: ['A cow.', 'A dog.', 'A duck.'], ta: 'Корова.' },
    ] },
  { id: 'castle', icon: '🏰', name: 'Замок', souv: 'tr_crown', c1: '#C9B8FF', c2: '#7C5CFF',
    desc: 'Старинный замок в Шотландии: башни, королевская корона и спрятанный ключ.',
    les: ['e_prep', 'e_house', 'e_colours', 'e_this'],
    sits: [
      { who: '👨', q: 'Where is the cat?', ctx: 'Кот сидит под столом.', tq: 'Где кот?', a: ["It's under the table.", "It's on the table.", "It's in the table."], ta: 'Он под столом.' },
      { who: '👩', q: 'Where is the key?', ctx: 'Ключ лежит в коробке.', tq: 'Где ключ?', a: ["It's in the box.", "It's on the box.", "It's under the box."], ta: 'Он в коробке.' },
      { who: '👨', q: 'What colour is the crown?', ctx: 'Корона жёлтая.', tq: 'Какого цвета корона?', a: ["It's yellow.", "It's a yellow.", 'They are yellow.'], ta: 'Она жёлтая.' },
      { who: '👩', q: 'Is the castle big or small?', tq: 'Замок большой или маленький?', a: ["It's big.", "It's a big.", 'Big is it.'], ta: 'Он большой.' },
      { who: '👨', q: 'Can you open the door?', tq: 'Ты можешь открыть дверь?', a: ['Yes, I can.', 'Yes, I am.', 'Yes, I have.'], ta: 'Да, могу.' },
    ] },
  { id: 'sea', icon: '🌊', name: 'Море', souv: 'tr_boat', c1: '#8EE6F0', c2: '#2A9DC4',
    desc: 'Мы на море! Погода, купание и игры на пляже — отвечай новым друзьям.',
    les: ['e_weather', 'e_actions', 'e_present', 'e_clothes'],
    sits: [
      { who: '👧', q: "What's the weather like today?", ctx: 'Светит солнце.', tq: 'Какая сегодня погода?', a: ["It's sunny.", "It's rainy.", "It's sun."], ta: 'Солнечно.' },
      { who: '👦', q: "Let's swim!", tq: 'Давай поплаваем!', a: ["OK! Let's go!", 'Yes, it is.', "I'm fine."], ta: 'Хорошо! Пойдём!' },
      { who: '👩', q: 'What are you doing?', ctx: 'Ты плаваешь.', tq: 'Что ты делаешь?', a: ["I'm swimming.", 'I swimming.', "I'm swim."], ta: 'Я плаваю.' },
      { who: '👧', q: 'What is he doing?', ctx: 'Мальчик бежит.', tq: 'Что он делает?', a: ['He is running.', 'He running.', 'He is run.'], ta: 'Он бежит.' },
      { who: '👩', q: 'Are you cold?', ctx: 'Тебе тепло.', tq: 'Тебе холодно?', a: ["No, I'm not.", "No, I don't.", "No, I can't."], ta: 'Нет, не холодно.' },
    ] },
  { id: 'party', icon: '🎉', name: 'Праздник', souv: 'tr_umb', c1: '#FFC4E1', c2: '#E8569A',
    desc: 'Прощальный праздник с новыми друзьями: угощение, подарки и знакомства.',
    les: ['e_food', 'e_family', 'e_toys', 'e_sentence'],
    sits: [
      { who: '👵', q: 'Would you like some cake?', tq: 'Хочешь торта?', a: ['Yes, please!', 'Yes, I like.', 'Here you are.'], ta: 'Да, пожалуйста!' },
      { who: '👦', q: 'Do you like pizza?', tq: 'Ты любишь пиццу?', a: ['Yes, I do.', 'Yes, I am.', 'Yes, I like.'], ta: 'Да, люблю.' },
      { who: '👧', q: 'This is my brother, Tom.', tq: 'Это мой брат Том.', a: ['Nice to meet you, Tom!', 'Goodbye, Tom!', "I'm Tom."], ta: 'Приятно познакомиться, Том!' },
      { who: '👩', q: 'Happy birthday! This is for you.', tq: 'С днём рождения! Это тебе.', a: ['Thank you very much!', "You're welcome.", 'Yes, it is.'], ta: 'Большое спасибо!' },
      { who: '👨', q: 'Goodbye! Come again!', tq: 'До свидания! Приезжай ещё!', a: ['Goodbye! See you!', 'Hello!', 'Good morning!'], ta: 'До свидания! Увидимся!' },
    ] },
];

/* ============================================================
   СВОЙ ОСТРОВ: размеры, постройки (pop — жители, need — сколько жителей нужно, чтобы построить)
   ============================================================ */
const ISL_SIZES = [{ c: 4, r: 3, price: 0 }, { c: 5, r: 4, price: 400 }, { c: 6, r: 5, price: 900 }];
const ISL_B = [
  { id: 'tree', icon: '🌳', name: 'Дерево', price: 30, pop: 0, need: 0 },
  { id: 'flowers', icon: '🌷', name: 'Клумба', price: 30, pop: 0, need: 0 },
  { id: 'palm', icon: '🌴', name: 'Пальма', price: 40, pop: 0, need: 0 },
  { id: 'tent', icon: '⛺', name: 'Палатка', price: 80, pop: 1, need: 0 },
  { id: 'house', icon: '🏠', name: 'Домик', price: 150, pop: 3, need: 0 },
  { id: 'boat', icon: '⛵', name: 'Лодка', price: 120, pop: 0, need: 2 },
  { id: 'house2', icon: '🏡', name: 'Дом с садом', price: 250, pop: 5, need: 3 },
  { id: 'fountain', icon: '⛲', name: 'Фонтан', price: 260, pop: 0, need: 4 },
  { id: 'shop', icon: '🏪', name: 'Магазинчик', price: 300, pop: 0, need: 6 },
  { id: 'train', icon: '🚂', name: 'Паровозик', price: 380, pop: 0, need: 8 },
  { id: 'carousel', icon: '🎠', name: 'Карусель', price: 420, pop: 0, need: 8 },
  { id: 'school', icon: '🏫', name: 'Школа', price: 450, pop: 0, need: 10 },
  { id: 'circus', icon: '🎪', name: 'Цирк', price: 600, pop: 0, need: 14 },
  { id: 'wheel', icon: '🎡', name: 'Колесо обозрения', price: 700, pop: 0, need: 16 },
  { id: 'tower', icon: '🗼', name: 'Башня', price: 800, pop: 0, need: 18 },
  { id: 'castle', icon: '🏰', name: 'Замок', price: 1500, pop: 0, need: 24 },
  { id: 'rocket', icon: '🚀', name: 'Ракета', price: 2000, pop: 0, need: 30 },
];
const ISL_BY = {};
ISL_B.forEach(b => { ISL_BY[b.id] = b; });
const ISL_RANKS = [[0, 'Пустой остров'], [1, 'Островок'], [8, 'Деревня'], [16, 'Посёлок'], [26, 'Городок'], [36, 'Город']];

/* ============================================================
   ОБЩЕЕ: открыто ли, новость после победы, карточки на карте и у питомца, окно-оверлей
   ============================================================ */
const BigRew = {
  ok: id => { const b = BIG.find(x => x.id === id); return !!(b && S.bosses[b.world]); },
  boss: b => WORLD_BY_ID[b.world].boss,
  /* новость: один раз для каждой открытой награды (в том числе у старого сохранения, где босс уже побеждён) */
  announce() {
    BIG.filter(b => BigRew.ok(b.id) && !S.big.seen[b.id] && !BigRew.queued[b.id]).forEach(b => {
      BigRew.queued[b.id] = 1;
      celebrate(() => {
        S.big.seen[b.id] = Date.now();    // отметка — только когда новость действительно показана (закрыли программу раньше — покажется в следующий раз)
        Sound.play('level'); confetti();
        modal({
          cls: 'celebrate',
          html: `<div class="m-icon big-news">${b.icon}</div><h2>Новая награда: ${b.name}!</h2>
            <p>За победу над боссом «${BigRew.boss(b).name}» ${BigRew.boss(b).emoji}</p><p>${b.desc}</p>
            <p class="small">Найти её можно на вкладке 🐾 «Питомец» и на карте — сразу после мира «${WORLD_BY_ID[b.world].name}».</p>`,
          buttons: [{ label: 'Потом', cls: 'ghost' }, { label: 'Открыть!', cls: 'primary', onClick: () => { BigRew.open(b.id); } }],   // сразу: иначе следующая новость из очереди всплывёт поверх окна
        });
        if (petStage() > 0) Speech.sayPet(BIG_SAY.news, petStage());
      });
    });
  },
  queued: {},
  btn(b) {
    const op = BigRew.ok(b.id), fresh = op && !S.big.opened[b.id];
    return `<button class="big-btn ${op ? '' : 'locked'}" data-act="bigOpen" data-arg="${b.id}"><span class="bb-ic">${op ? b.icon : '🔒'}</span>
      <b>${b.name}</b><small>${op ? BigRew.sub(b) : 'Победи: ' + BigRew.boss(b).emoji + ' ' + BigRew.boss(b).name}</small>${fresh ? '<em class="big-new">NEW</em>' : ''}</button>`;
  },
  sub(b) {
    if (b.id === 'school') return School.rank()[1];
    if (b.id === 'trip') { const n = TRIP.filter((_, i) => S.big.trip.done[i]).length; return n === TRIP.length ? 'Весь путь пройден ✓' : `Остановок: ${n} из ${TRIP.length}`; }
    const p = Island.pop(); return Island.rank(p) + (p ? ` · 👪 ${p}` : '');
  },
  /* вкладка «Питомец»: три награды в ряд */
  petRow() {
    return `<div class="big-row"><div class="big-h">🏆 Награды за главных боссов</div><div class="big-btns">${BIG.map(BigRew.btn).join('')}</div></div>`;
  },
  /* карта: сразу после мира главного босса */
  mapCard(w) {
    const b = BIG.find(x => x.world === w.id);
    if (!b) return '';
    if (!BigRew.ok(b.id)) return `<div class="big-map locked"><span class="bm-ic">🔒</span><span><b>${b.icon} ${b.name}</b><small>Откроется после победы над боссом «${w.boss.name}»</small></span></div>`;
    return `<button class="big-map" data-act="bigOpen" data-arg="${b.id}"><span class="bm-ic">${b.icon}</span><span><b>${b.name}</b><small>${BigRew.sub(b)}</small></span>${!S.big.opened[b.id] ? '<em class="big-new">NEW</em>' : '<span class="go">›</span>'}</button>`;
  },
  open(id) {
    const b = BIG.find(x => x.id === id);
    if (!b) return;
    Sound.play('tap');
    if (!BigRew.ok(id)) { toast(`🔒 «${b.name}» откроется после победы над боссом «${BigRew.boss(b).name}» ${BigRew.boss(b).emoji}`); return; }
    if (L || $('#big')) return;
    S.big.opened[id] = S.big.opened[id] || Date.now();
    save();
    if (id === 'school') School.open();
    if (id === 'trip') Trip.open();
    if (id === 'isl') Island.open();
  },
  /* полноэкранное окно награды */
  overlay(cls, html) {
    const ov = document.createElement('div');
    ov.className = 'overlay big-ov ' + cls;
    ov.id = 'big';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    document.body.classList.add('no-scroll');
    Back.push(() => { BigRew.close(); });
    return ov;
  },
  top: (title, right = '') => `<div class="g-top big-top"><button class="x" data-act="bigClose" aria-label="Закрыть">✕</button><div class="g-task">${title}</div>${right}</div>`,
  close(quiet) {
    const ov = $('#big');
    if (ov) ov.remove();
    document.body.classList.remove('no-scroll');
    School.st = null; Island.sel = null;
    if (quiet) return;
    render();
    setTimeout(flushQueue, 300);
  },
  /* английские фразы путешествия — для озвучки (тест\англ_фразы.html) */
  enPhrases: () => TRIP.flatMap(s => s.sits.flatMap(x => [x.q, x.a[0]])),
  actions: {
    bigOpen: a => BigRew.open(a),
    bigClose: () => { Back.done(); BigRew.close(); },
    tripStop: a => Trip.stopSheet(+a),
    tripAgain: a => { Back.done(); closeLesson(); setTimeout(() => startSession('trip', +a), 50); },
    tripBack: () => { Back.done(); closeLesson(); setTimeout(() => Trip.open(), 60); },
  },
};

/* ============================================================
   🏫 ШКОЛА ПИТОМЦА
   Урок — 6 заданий из пройденных тем русского (только с выбором ответа). Питомец отвечает, часть ответов — с ошибкой.
   Ребёнок: «Верно» / «Ошибка» → (если ошибка) как правильно → какое правило помогает (запоминалка RU_MEMO).
   ============================================================ */
const SC_LEN = 6;
/* Близкие темы: правило-«обманка» берётся только из темы, далёкой от задания (иначе верными могли бы быть оба правила) */
/* (проверка DeepSeek э5: буквы/звуки ↔ непроизносимые и удвоенные; части речи ↔ члены предложения; словарные ↔ удвоенные) */
const SC_CLOSE = [['vowels', 'letsnd', 'voiced', 'soft', 'abc'], ['soft', 'sepsoft', 'sephard', 'hush', 'chk'], ['voiced', 'paired', 'silent', 'double', 'letsnd'],
  ['bezud', 'cognate', 'root', 'stress', 'vocab2', 'vocab3', 'double'], ['cognate', 'root', 'morph', 'prefprep', 'sephard'],
  ['pos', 'anim', 'gender', 'number', 'cases', 'hush', 'negverb', 'members'], ['endmark', 'members', 'build', 'senttype', 'text', 'homog', 'capital'],
  ['syll', 'hyph', 'stress'], ['zhishi', 'chascha', 'chk']];
const School = {
  /* какое правило верно для этого задания: в темах «Ь» и «Ъ/Ь» есть задания на соседнее правило */
  ruleOf(t) {
    /* запоминалка темы не помогает решить это задание — шаг «правило» пропускаем, показываем объяснение */
    if (t.lid === 'abc' || /не обозначает звука|Найди пару к букве/.test(t.prompt.replace(/<[^>]+>/g, ''))) return null;
    const lab = String((t.options.find(o => String(o.v) === String(t.answer)) || {}).label || t.answer).toLowerCase();
    if (t.lid === 'sepsoft' && lab.includes('мягк')) return 'soft';
    if (t.lid === 'sephard' && lab === 'ь') return 'sepsoft';
    return t.lid;
  },
  close: (a, b) => a === b || SC_CLOSE.some(g => g.includes(a) && g.includes(b)),
  st: null,
  RANKS: [[0, 'Первоклашка'], [6, 'Ученик'], [18, 'Хорошист'], [36, 'Отличник'], [60, 'Знаток'], [90, 'Профессор']],
  PRIZES: [[10, 'sc_cert'], [40, 'sc_globe'], [90, 'sc_cap']],
  rank(p = S.big.school.pts) { let r = School.RANKS[0]; School.RANKS.forEach(x => { if (p >= x[0]) r = x; }); return r; },
  nextRank(p = S.big.school.pts) { return School.RANKS.find(x => x[0] > p) || null; },
  topics: () => SUBJ.ru.worlds.flatMap(w => w.lessons).filter(l => (S.stars[l.id] || 0) > 0),
  task(pool, used) {
    for (let k = 0; k < 40; k++) {
      const les = U.rnd(pool);
      let t = null;
      try { t = les.make(les.bank[Math.floor(Math.random() * les.bank.length)]); } catch (e) { t = null; }
      if (!t || t.kind !== 'choice' || !t.options || t.options.length < 2 || used.has(t.label)) continue;
      if (!t.options.some(o => String(o.v) === String(t.answer))) continue;
      used.add(t.label); t.lid = les.id;
      return t;
    }
    return null;
  },
  open() {
    const ov = BigRew.overlay('sc-ov', `${BigRew.top('🏫 Школа питомца', `<div class="g-score">📘 <b id="scPts">${S.big.school.pts}</b></div>`)}<div class="sc-area" id="scArea"></div>`);
    ov.addEventListener('click', School.click);
    School.home();
  },
  home() {
    School.st = null;
    const p = S.big.school.pts, r = School.rank(), nx = School.nextRank();
    const prize = School.PRIZES.find(x => p < x[0]);
    $('#scArea').innerHTML = `<div class="sc-home">
      <div class="sc-class"><div class="sc-boardbig">Сегодня урок ведёшь <b>ты</b>!</div><div class="sc-desk">${petSVG({ uid: 'sch', mood: 'happy' })}</div></div>
      <div class="card sc-card">
        <p>Питомец решает задания из уже пройденных тем, а ты проверяешь. Есть ошибка? Покажи, как правильно, и выбери правило, которое поможет.</p>
        <div class="bar-l"><span>🎓 ${r[1]}</span><small>${nx ? `${p} / ${nx[0]} 📘 до звания «${nx[1]}»` : 'Высшее звание!'}</small></div>
        <div class="bar"><div style="width:${nx ? Math.round(100 * (p - r[0]) / (nx[0] - r[0])) : 100}%"></div></div>
        ${prize ? `<p class="small">🎁 При ${prize[0]} 📘 — награда в домик: <b>${ITEMS[prize[1]].icon} ${ITEMS[prize[1]].name}</b></p>` : '<p class="small">🎁 Все награды школы получены!</p>'}
        <p class="small">Уроков проведено: ${S.big.school.n}. 📘 — очки учителя: за найденную ошибку, верный ответ и правило.</p>
        <button class="btn primary big" data-sc="start">Начать урок ▶</button>
      </div></div>`;
  },
  start() {
    const pool = School.topics();
    if (!pool.length) { toast('Сначала пройди хотя бы одну тему русского языка'); return; }
    const used = new Set(), list = [];
    for (let i = 0; i < SC_LEN; i++) { const t = School.task(pool, used); if (t) list.push(t); }
    if (list.length < 3) { toast('Не нашлось заданий — пройди ещё темы русского языка'); return; }
    /* сколько раз питомец ошибётся: от 2 до 4 из 6 — чтобы нельзя было угадывать одним ответом */
    const nWrong = Math.min(list.length - 1, 2 + Math.floor(Math.random() * 3));
    const wrong = U.shuffle(list.map((_, i) => i)).slice(0, nWrong);
    list.forEach((t, i) => {
      t.petWrong = wrong.includes(i);
      t.petAns = t.petWrong ? U.rnd(t.options.filter(o => String(o.v) !== String(t.answer))).v : t.answer;
    });
    School.st = { list, i: 0, coins: 0, pts: 0, found: 0, missed: 0, phase: 'judge' };
    Speech.sayPet(U.rnd(BIG_SAY.scStart), petStage());
    School.show(true);
  },
  lab: (t, v) => { const o = t.options.find(x => String(x.v) === String(v)); return o ? (o.html ? o.label : U.esc(o.label)) : U.esc(v); },
  /* задание на доске с ответом питомца */
  board(t, v, cls) {
    const lab = School.lab(t, v);
    let show = '';
    const right = String(v) === String(t.answer) && t.word && t.word.fill !== undefined;
    /* в пропуск — буквы ответа (верный ответ — всегда его буквы t.word.fill), иначе ответ отдельной строкой */
    const inGap = t.word && (right || /^[а-яё]{0,2}$/i.test(String((t.options.find(x => String(x.v) === String(v)) || {}).label || '?')));
    const who = cls === 'fixd' ? 'Правильно' : 'Ответ питомца';
    if (t.word) {
      const fill = right ? U.esc(t.word.fill) : lab;
      show = `<div class="${t.small ? 'sentence' : 'word'}">${t.word.before}<span class="gap sc-gap ${cls}">${inGap ? (fill || '·') : '?'}</span>${t.word.after}</div>`;
      if (!inGap) show += `<div class="sc-ans ${cls}">${who}: <b>${lab}</b></div>`;
    } else {
      if (t.show) show = `<div class="${t.small ? 'sentence' : t.show.startsWith('<div') || t.show.startsWith('<svg') ? 'mshow' : 'word'}">${t.show}</div>`;
      show += `<div class="sc-ans ${cls}">${who}: <b>${lab}</b></div>`;
    }
    return `<div class="sc-board"><div class="sc-prompt">${t.prompt}</div>${show}</div>`;
  },
  show(first) {
    const st = School.st, t = st.list[st.i];
    st.phase = 'judge';
    const say = U.rnd(BIG_SAY.scThink);
    $('#scArea').innerHTML = `<div class="sc-dots">${st.list.map((_, k) => `<i class="${k < st.i ? 'done' : k === st.i ? 'on' : ''}"></i>`).join('')}</div>
      ${School.board(t, t.petAns, '')}
      <div class="sc-petrow"><div class="sc-pet">${petSVG({ uid: 'scp', mood: 'happy' })}</div><div class="bubble sc-say" id="scSay">${say}</div></div>
      <div class="sc-step" id="scStep"><div class="sc-q">Питомец ответил верно?</div>
        <div class="sc-judge"><button class="btn sc-yes" data-sc="ok">✅ Верно</button><button class="btn sc-no" data-sc="bad">❌ Ошибка</button></div></div>`;
    if (!first) Speech.sayPet(say, petStage());
  },
  sayPet(text, mood) {
    const b = $('#scSay'); if (b) b.textContent = text;
    const p = $('.sc-pet'); if (p && mood) p.innerHTML = petSVG({ uid: 'scp', mood });
    Speech.sayPet(text, petStage());
  },
  gain(c, p) { const st = School.st; st.coins += c; st.pts += p; const e = $('#scPts'); if (e) e.textContent = S.big.school.pts + st.pts; },
  nextBtn: () => `<button class="btn primary big" data-sc="next">Дальше ▶</button>`,
  judge(saysOk) {
    const st = School.st, t = st.list[st.i];
    if (st.phase !== 'judge') return;
    const step = $('#scStep');
    const exp = t.explain ? `<div class="sc-exp">${t.explain}</div>` : '';
    if (!t.petWrong && saysOk) {
      st.phase = 'done'; School.gain(4, 1); Sound.play('right');
      School.sayPet(U.rnd(BIG_SAY.scRight), 'love');
      step.innerHTML = `<div class="sc-res ok">✅ Верно, ошибки нет! <span class="fb-coins">+4 <i class="ci"></i></span></div>${exp}${School.nextBtn()}`;
    } else if (!t.petWrong) {
      st.phase = 'done'; Sound.play('tap');
      School.sayPet(BIG_SAY.scNotErr, 'wow');
      step.innerHTML = `<div class="sc-res">🧐 А тут питомец ответил верно. Проверь ещё раз!</div>${exp}${School.nextBtn()}`;
    } else if (saysOk) {
      st.phase = 'done'; st.missed++; Sound.play('wrong');
      School.sayPet(BIG_SAY.scMissed, 'wow');
      step.innerHTML = `<div class="sc-res bad">🧐 Тут была ошибка! Правильно: <b>${School.lab(t, t.answer)}</b></div>${exp}${School.nextBtn()}`;
      School.fixBoard(t);
    } else {
      st.phase = 'fix'; st.found++; School.gain(5, 1); Sound.play('right');
      School.sayPet(U.rnd(BIG_SAY.scCaught), 'wow');
      $$('.sc-board .sc-ans, .sc-board .sc-gap').forEach(e => e.classList.add('bad'));
      step.innerHTML = `<div class="sc-res ok">🔎 Ошибка найдена! <span class="fb-coins">+5 <i class="ci"></i></span></div>
        <div class="sc-q">Покажи питомцу, как правильно:</div>
        <div class="sc-opts">${t.options.map(o => `<button class="btn opt" data-scfix="${U.esc(o.v)}">${o.html ? o.label : U.esc(o.label)}</button>`).join('')}</div>`;
    }
  },
  fixBoard(t) {
    const b = $('.sc-board');
    if (b) b.outerHTML = School.board(t, t.answer, 'fixd');
  },
  fix(v) {
    const st = School.st, t = st.list[st.i];
    if (st.phase !== 'fix') return;
    const ok = String(v) === String(t.answer);
    $$('#scStep [data-scfix]').forEach(b => {
      b.disabled = true;
      if (b.dataset.scfix === String(t.answer)) b.classList.add('right');
      else if (b.dataset.scfix === String(v)) b.classList.add('wrong');
    });
    School.fixBoard(t);
    if (ok) { School.gain(5, 1); Sound.play('right'); } else Sound.play('wrong');
    /* правило: запоминалка этой темы и две чужие */
    const rk = School.ruleOf(t), memo = RU_MEMO[rk];
    const others = U.shuffle(Object.keys(RU_MEMO).filter(k => !School.close(k, rk) && !School.close(k, t.lid) && RU_MEMO[k] !== memo && LESSONS[k] && LESSONS[k].subject === SUBJ.ru)).slice(0, 2);
    st.ruleKey = rk;
    const step = $('#scStep');
    const head = ok ? `<div class="sc-res ok">👏 Верно! <span class="fb-coins">+5 <i class="ci"></i></span></div>` : `<div class="sc-res bad">Правильно: <b>${School.lab(t, t.answer)}</b></div>`;
    if (!memo || others.length < 2) {
      st.phase = 'done';
      School.sayPet(U.rnd(BIG_SAY.scRule), 'love');
      step.innerHTML = `${head}${t.explain ? `<div class="sc-exp">${t.explain}</div>` : ''}${School.nextBtn()}`;
      return;
    }
    st.phase = 'rule';
    st.rules = U.shuffle([rk, ...others]);
    School.sayPet(BIG_SAY.scFixed, 'happy');
    step.innerHTML = `${head}<div class="sc-q">Какое правило поможет питомцу?</div>
      <div class="sc-rules">${st.rules.map(k => `<button class="btn sc-rule" data-scrule="${k}">${RU_MEMO[k]}</button>`).join('')}</div>`;
  },
  rule(k) {
    const st = School.st, t = st.list[st.i];
    if (st.phase !== 'rule') return;
    st.phase = 'done';
    const rk = st.ruleKey, ok = k === rk;
    $$('#scStep [data-scrule]').forEach(b => {
      b.disabled = true;
      if (b.dataset.scrule === rk) b.classList.add('right');
      else if (b.dataset.scrule === k) b.classList.add('wrong');
    });
    if (ok) { School.gain(5, 1); Sound.play('star'); School.sayPet(U.rnd(BIG_SAY.scRule), 'love'); }
    else { Sound.play('wrong'); School.sayPet(BIG_SAY.scRuleNo, 'happy'); const at = st.i; setTimeout(() => { if (School.st === st && st.i === at) Speech.sayPet(RU_MEMO[rk], petStage()); }, 2600); }
    $('#scStep').insertAdjacentHTML('beforeend', `${ok ? '<div class="sc-res ok">🎓 Правило выбрано верно! <span class="fb-coins">+5 <i class="ci"></i></span></div>' : ''}${t.explain ? `<div class="sc-exp">${t.explain}</div>` : ''}${School.nextBtn()}`);
    const nb = $('#scStep [data-sc="next"]'); if (nb) nb.scrollIntoView({ block: 'nearest' });
  },
  next() {
    const st = School.st;
    if (!st || st.phase !== 'done') return;
    Sound.play('tap');
    st.i++;
    if (st.i < st.list.length) School.show();
    else School.finish();
  },
  finish() {
    const st = School.st, sc = S.big.school;
    const f = rewardInfo('school', 2).f;     // повтор в тот же день — меньше монет (как у уроков)
    markPlayed('school');
    const before = sc.pts;
    sc.pts += st.pts; sc.n++;
    const raw = Math.round((st.coins + 10) * f * petBonusMul());
    const got = earnCoins(raw);
    addXP(st.pts * 4);
    if (sc.n === 1) Life.remember('school', '🏫', 'Первый урок в Школе питомца');
    const rb = School.rank(before), ra = School.rank(sc.pts);
    if (ra !== rb) Life.remember('school', '🎓', 'Питомец получил звание «' + ra[1] + '»');
    const prizes = School.PRIZES.filter(x => before < x[0] && sc.pts >= x[0] && !S.owned[x[1]]);
    prizes.forEach(x => { S.owned[x[1]] = true; });
    Life.onLesson();
    checkAch();
    save();
    Sound.play('level');
    if (prizes.length) confetti();
    $('#scArea').innerHTML = `<div class="sc-home"><div class="card sc-card sc-end">
      <div class="sc-endpet">${petSVG({ uid: 'sce', mood: 'love' })}</div>
      <h2>Урок окончен!</h2>
      <ul class="res-lines"><li>🔎 Найдено ошибок: <b>${st.found}</b>${st.missed ? ` · пропущено: ${st.missed}` : ''}</li><li>📘 Очки учителя: <b>+${st.pts}</b> (всего ${sc.pts})</li></ul>
      <div class="res-coins">+${got} <i class="ci"></i></div>
      ${got < raw ? `<p class="note">Дневной лимит монет достигнут — очки учителя всё равно засчитаны!</p>` : f < 1 ? '<p class="small muted">Сегодня урок в школе уже был — монет меньше. Завтра снова полная награда.</p>' : ''}
      ${ra !== rb ? `<div class="unlock-card">🎓 Новое звание питомца: <b>${ra[1]}</b></div>` : ''}
      ${prizes.map(x => `<div class="prize-card">${ITEMS[x[1]].icon} Награда в домик: <b>${ITEMS[x[1]].name}</b></div>`).join('')}
      <div class="res-btns"><button class="btn ghost" data-act="bigClose">Выйти</button><button class="btn primary" data-sc="start">Ещё урок</button></div></div></div>`;
    School.st = null;
    setTimeout(() => { if (!School.st && $('.sc-end')) Speech.sayPet(prizes.length ? BIG_SAY.scPrize : BIG_SAY.scEnd, petStage()); }, 300);
  },
  click(ev) {
    const a = ev.target.closest('[data-sc]'), fx = ev.target.closest('[data-scfix]'), ru = ev.target.closest('[data-scrule]');
    if (a && !a.disabled) {
      const k = a.dataset.sc;
      if (k === 'start') { Sound.play('tap'); School.start(); }
      if (k === 'ok' || k === 'bad') School.judge(k === 'ok');
      if (k === 'next') School.next();
      return;
    }
    if (fx && !fx.disabled) { School.fix(fx.dataset.scfix); return; }
    if (ru && !ru.disabled) School.rule(ru.dataset.scrule);
  },
};

/* ============================================================
   ✈️ ПУТЕШЕСТВИЕ — маршрут; сама остановка идёт обычным уроком (startSession('trip', i) в app.js)
   ============================================================ */
const Trip = {
  open() {
    const T = S.big.trip;
    const n = TRIP.filter((_, i) => T.done[i]).length;
    BigRew.overlay('tr-ov', `${BigRew.top('✈️ Путешествие по Британии', `<div class="g-score">🧳 <b>${n}/${TRIP.length}</b></div>`)}
      <div class="tr-area"><div class="tr-intro">${petSVG({ uid: 'trp', mood: 'wow' })}<p>На каждой остановке — 8 трудных заданий по-английски, <b>без подсказок</b>.
        Ответь верно с первой попытки хотя бы на ${TRIP_PASS} — и получишь сувенир в домик! Пройдёшь все — ждёт особая награда.</p></div>
      <div class="tr-route">${TRIP.map((s, i) => {
        const done = !!T.done[i], open = i === 0 || !!T.done[i - 1];
        return `<button class="tr-stop ${done ? 'done' : open ? 'open' : 'locked'}" data-act="tripStop" data-arg="${i}" style="--c1:${s.c1};--c2:${s.c2}">
          <span class="tr-num">${i + 1}</span><span class="tr-ic">${open ? s.icon : '🔒'}</span>
          <span class="tr-txt"><b>${s.name}</b><small>${done ? `Пройдено ✓ · лучший: ${T.best[i] || 0}/8` : open ? 'Можно ехать!' : 'Сначала пройди прошлую остановку'}</small></span>
          <span class="tr-souv ${done ? 'got' : ''}">${ITEMS[s.souv].icon}</span></button>`;
      }).join('')}
      <div class="tr-final ${T.all ? 'got' : ''}"><span>${ITEMS.tr_wheel.icon}</span><b>${T.all ? 'Весь путь пройден! Колесо обозрения — в домике' : 'Пройди все остановки — получишь колесо обозрения'}</b></div>
      </div></div>`);
    if (!S.big.trip.greet) { S.big.trip.greet = 1; save(); Speech.sayPet(BIG_SAY.trOpen, petStage()); }
  },
  stopSheet(i) {
    const s = TRIP[i], T = S.big.trip;
    if (!s) return;
    Sound.play('tap');
    if (i > 0 && !T.done[i - 1]) { toast(`🔒 Сначала пройди остановку «${TRIP[i - 1].name}»`); return; }
    const r = rewardInfo('trip_' + i, T.done[i] ? 2 : 1);
    modal({
      cls: 'sheet',
      html: `<div class="m-icon">${s.icon}</div><h2>${s.name}</h2><p>${s.desc}</p>
        <div class="goals"><span>📝 8 заданий</span><span>🚫 Без подсказок</span><span>🎯 Нужно ${TRIP_PASS} верных с первой попытки</span></div>
        <p class="reward">${T.done[i] ? `Сувенир «${ITEMS[s.souv].name}» ${ITEMS[s.souv].icon} уже в домике.${r.f < 1 ? ` Сегодня монет — ${Math.round(r.f * 100)}%.` : ''}` : `Награда: сувенир «${ITEMS[s.souv].name}» ${ITEMS[s.souv].icon} и 40 <i class="ci"></i>`}</p>`,
      buttons: [{ label: 'Не сейчас', cls: 'ghost' }, { label: 'В путь! ✈️', cls: 'primary big', onClick: () => { if (L || !$('#big')) return; Back.done(); BigRew.close(true); setTimeout(() => startSession('trip', i), 60); } }],   // пауза — как в «Ещё раз»: сначала история «назад», потом новый урок
    });
  },
  sitTask(s) {
    const opts = U.shuffle(s.a.map(x => ({ v: x, label: x })));
    return {
      kind: 'choice', prompt: 'Что ответить? 💬', options: opts, answer: s.a[0],
      show: `<div class="tr-scene">${s.pic ? `<div class="tr-pic">${s.pic}</div>` : ''}<div class="tr-who">${s.who}</div><div class="qbubble">${s.q}</div>${s.ctx ? `<div class="tr-ctx">${s.ctx}</div>` : ''}</div>`,
      say: s.q, auto: true, sayAfter: s.a[0], label: s.q,
      explain: `<i>${s.q}</i> — ${s.tq}<br><b>${s.a[0]}</b> — ${s.ta}`,
    };
  },
  /* 3 сценки остановки + 5 трудных заданий (GEN.boost=1) из тем остановки, которые ребёнок проходил */
  tasks(i) {
    const s = TRIP[i];
    const out = U.shuffle(s.sits.slice()).slice(0, 3).map(x => ({ t: Trip.sitTask(x), remake: () => Trip.sitTask(x) }));
    let pool = s.les.filter(id => LESSONS[id] && (S.stars[id] || 0) > 0);
    if (pool.length < 2) pool = SUBJ.en.worlds.filter(w => !w.g3).flatMap(w => w.lessons).filter(l => (S.stars[l.id] || 0) > 0).map(l => l.id);
    if (!pool.length) pool = s.les.filter(id => LESSONS[id]);
    const labels = new Set(out.map(x => x.t.label));
    for (let k = 0; out.length < 8 && k < 60; k++) {
      const id = U.rnd(pool), les = LESSONS[id];
      const t = makeTask(id, Math.floor(Math.random() * les.bank.length));
      if (t && !labels.has(t.label)) { labels.add(t.label); out.push({ t }); }
    }
    return U.shuffle(out);
  },
  finish() {
    if (L.finished) return;
    const stageBefore = petStage();
    commonFinish();
    const i = L.ref, s = TRIP[i], T = S.big.trip;
    markPlayed('trip_' + i);
    S.counters.lessons++;
    if (L.fresh) weekly('lesson');
    T.best[i] = Math.max(T.best[i] || 0, L.first);
    /* если заданий набралось меньше 8 (мало пройденных тем) — порог по доле, чтобы остановка оставалась проходимой */
    const need = Math.min(TRIP_PASS, Math.ceil(L.total * 0.75));
    const pass = L.first >= need, newStop = pass && !T.done[i];
    let bonus = 0;
    if (newStop) { T.done[i] = Date.now(); S.owned[s.souv] = true; bonus += 40; }
    const all = newStop && !T.all && TRIP.every((_, k) => T.done[k]);
    if (all) { T.all = Date.now(); S.owned.tr_wheel = true; bonus += 120; Life.remember('trip', '✈️', 'Путешествие по Британии пройдено!'); }
    else if (newStop && i === 0) Life.remember('trip', '✈️', 'Начало путешествия по Британии');
    const raw = Math.round(L.coins * L.petMul);
    const got = earnCoins(raw) + (bonus ? earnCoins(bonus, true) : 0);
    const xp = L.xp + (newStop ? 60 : 0);
    addXP(xp);
    const nextS = TRIP[i + 1];
    const html = `<div class="result ${pass ? 'win' : ''}"><div class="m-icon">${pass ? s.icon : '🧭'}</div>
      <h2>${pass ? `${s.name}: остановка пройдена!` : 'Почти получилось!'}</h2>
      <p>Верно с первой попытки: <b>${L.first} из ${L.total}</b>${pass ? '' : ` — нужно ${need}. Попробуй ещё раз: задания будут другие.`}</p>
      ${newStop ? `<div class="prize-card">${ITEMS[s.souv].icon} Сувенир в домик: <b>${ITEMS[s.souv].name}</b></div>` : ''}
      ${all ? `<div class="unlock-card">${ITEMS.tr_wheel.icon} Весь путь пройден! В домике — <b>${ITEMS.tr_wheel.name}</b></div>` : ''}
      ${newStop && nextS && !all ? `<div class="unlock-card" style="--c1:${nextS.c1};--c2:${nextS.c2}">${nextS.icon} Следующая остановка: <b>${nextS.name}</b></div>` : ''}
      <div class="res-coins">+${got} <i class="ci"></i> <span>+${xp} опыта</span></div>
      ${got < raw + bonus ? `<p class="note">Дневной лимит монет достигнут. Опыт засчитан!</p>` : ''}
      <div class="res-pet">${petSVG({ mood: pass ? 'wow' : 'happy', uid: 'rp' })}</div>
      <div class="res-btns"><button class="btn ghost" data-act="tripAgain" data-arg="${i}">Ещё раз</button><button class="btn primary big" data-act="tripBack">К маршруту</button></div></div>`;
    afterFinish(stageBefore);
    showResult(html);
    if (pass) { Sound.play('level'); if (newStop) confetti(); }
    const L0 = L;     // фраза — только если ребёнок ещё на этом экране итога
    setTimeout(() => L === L0 && L && Speech.sayPet(all ? BIG_SAY.trAll : newStop ? BIG_SAY.trSouv : pass ? U.rnd(BIG_SAY.scRight) : BIG_SAY.trAgain, petStage()), 600);
  },
};

/* ============================================================
   🏝️ СВОЙ ОСТРОВ — клетки острова (ключ «ряд-столбец»), запас (убранные постройки ставятся бесплатно)
   ============================================================ */
const Island = {
  sel: null,     // { k: 'new', id } — ставим новую; { k: 'cell', key } — выбрана постройка; { k: 'move', key } — переносим
  size: () => ISL_SIZES[Math.min(ISL_SIZES.length - 1, S.big.isl.size || 0)],
  pop: () => Object.values(S.big.isl.cells).reduce((a, id) => a + ((ISL_BY[id] || {}).pop || 0), 0),
  rank(p = Island.pop()) { let r = ISL_RANKS[0][1]; ISL_RANKS.forEach(x => { if (p >= x[0]) r = x[1]; }); return r; },
  keys() { const z = Island.size(), out = []; for (let r = 0; r < z.r; r++) for (let c = 0; c < z.c; c++) out.push(r + '-' + c); return out; },
  free: () => Island.keys().filter(k => !S.big.isl.cells[k]),
  open() {
    const ov = BigRew.overlay('is-ov', `${BigRew.top('🏝️ Свой остров', `<div class="g-score" id="isCoins"></div>`)}<div class="is-area" id="isArea"></div>`);
    ov.addEventListener('click', Island.click);
    Island.sel = null;
    Island.draw();
    Speech.sayPet(U.rnd(BIG_SAY.isOpen), petStage());
  },
  status() {
    const s = Island.sel;
    if (!s) return `<div class="is-status">👆 Выбери постройку внизу — и нажми на свободное место острова. Нажми на постройку на острове, чтобы переставить её.</div>`;
    if (s.k === 'new') {
      const b = ISL_BY[s.id], store = S.big.isl.store[s.id] || 0;
      return `<div class="is-status on"><span class="is-sel">${b.icon}</span><span><b>${b.name}</b><small>${store ? 'Из запаса — бесплатно' : `🧮 ${fmt(S.coins)} − ${fmt(b.price)} = ${fmt(S.coins - b.price)}`}</small><small>Нажми на свободное место на острове</small></span><button class="btn sm ghost" data-is="cancel">Отмена</button></div>`;
    }
    const id = S.big.isl.cells[s.key], b = ISL_BY[id];
    if (s.k === 'move') return `<div class="is-status on"><span class="is-sel">${b.icon}</span><span><b>Переставляем: ${b.name}</b><small>Нажми на новое место (на другую постройку — поменяются местами)</small></span><button class="btn sm ghost" data-is="cancel">Отмена</button></div>`;
    return `<div class="is-status on"><span class="is-sel">${b.icon}</span><span><b>${b.name}</b>${b.pop ? `<small>👪 жителей: ${b.pop}</small>` : ''}</span>
      <button class="btn sm" data-is="move">↔️ Переставить</button><button class="btn sm ghost" data-is="store">📦 В запас</button></div>`;
  },
  draw() {
    const I = S.big.isl, z = Island.size(), p = Island.pop(), s = Island.sel;
    const nx = ISL_SIZES[(I.size || 0) + 1];
    const free = Island.free().length;
    const nextRank = ISL_RANKS.find(x => x[0] > p);
    const ce = $('#isCoins'); if (ce) ce.innerHTML = `<i class="ci"></i> <b>${fmt(S.coins)}</b>`;
    const cells = Island.keys().map(k => {
      const id = I.cells[k], b = id ? ISL_BY[id] : null;
      const mark = s && ((s.k === 'cell' || s.k === 'move') && s.key === k) ? 'sel' : (s && (s.k === 'new' || s.k === 'move') && !b) ? 'target' : '';
      return `<button class="is-cell ${b ? 'built' : 'empty'} ${mark}" data-iscell="${k}" aria-label="${b ? b.name : 'Свободное место'}">${b ? b.icon : ''}</button>`;
    }).join('');
    $('#isArea').innerHTML = `<div class="is-head"><b>${Island.rank(p)}</b><span>👪 Жителей: <b>${p}</b>${nextRank ? ` · до «${nextRank[1]}» — ещё ${nextRank[0] - p}` : ''}</span><span>🏗️ Построек: ${Object.keys(I.cells).length} · свободно мест: ${free}</span></div>
      <div class="is-sea"><div class="is-land" style="--c:${z.c};--r:${z.r}"><div class="is-grid">${cells}</div>
        <div class="is-pet">${petSVG({ uid: 'isp', mood: 'happy' })}</div></div></div>
      ${Island.status()}
      ${nx ? `<button class="btn is-grow" data-is="grow" ${S.coins < nx.price ? 'disabled' : ''}>🌊 Расширить остров до ${nx.c}×${nx.r} — ${fmt(nx.price)} <i class="ci"></i></button>` : '<p class="small is-max">🏝️ Остров самого большого размера!</p>'}
      <h3 class="is-h">🏗️ Постройки</h3>
      <div class="is-cat">${ISL_B.map(b => {
        const st = I.store[b.id] || 0, lock = p < b.need && !st, poor = !st && S.coins < b.price;
        return `<button class="is-b ${lock ? 'locked' : poor ? 'poor' : ''} ${s && s.k === 'new' && s.id === b.id ? 'on' : ''}" data-isb="${b.id}">
          <span class="is-bi">${lock ? '🔒' : b.icon}</span><b>${b.name}</b>
          <small>${st ? `📦 в запасе: ${st}` : lock ? `👪 нужно жителей: ${b.need}` : `${fmt(b.price)} <i class="ci"></i>`}</small>${b.pop ? `<em>👪 +${b.pop}</em>` : ''}</button>`;
      }).join('')}</div>`;
  },
  pick(id) {
    const b = ISL_BY[id], I = S.big.isl, p = Island.pop();
    Sound.play('tap');
    if (p < b.need && !(I.store[id] > 0)) { toast(`🔒 Для «${b.name}» нужно ${b.need} жителей, сейчас ${p}. Построй домики!`); Speech.sayPet(BIG_SAY.isPop, petStage()); return; }
    if (!(I.store[id] > 0) && S.coins < b.price) { toast(`Не хватает монет: нужно ${fmt(b.price)}, есть ${fmt(S.coins)}. Ещё ${fmt(b.price - S.coins)}!`); Speech.sayPet(BIG_SAY.isMoney, petStage()); return; }
    if (!Island.free().length) { toast('На острове нет свободного места — расширь остров или убери постройку в запас'); return; }
    Island.sel = Island.sel && Island.sel.k === 'new' && Island.sel.id === id ? null : { k: 'new', id };
    Island.draw();
    if (Island.sel) { const g = $('.is-sea'); if (g) g.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  },
  tapCell(key) {
    const I = S.big.isl, s = Island.sel, id = I.cells[key];
    if (s && s.k === 'new') {
      if (id) { Island.sel = { k: 'cell', key }; Island.draw(); Island.bounce(key); return; }
      const b = ISL_BY[s.id], before = Island.pop();
      if (I.store[s.id] > 0) I.store[s.id]--;
      else { if (S.coins < b.price) { toast('Не хватает монет'); Island.sel = null; Island.draw(); return; } S.coins -= b.price; I.spent = (I.spent || 0) + b.price; }
      if (!I.store[s.id]) delete I.store[s.id];
      I.cells[key] = s.id; I.built = (I.built || 0) + 1;
      Island.sel = null;
      Sound.play('buy');
      Island.after(before);
      if (I.built === 1) Life.remember('isl', '🏝️', `Первая постройка на острове: ${b.name}`);
      save(); Island.draw(); Island.bounce(key); renderTop();
      Speech.sayPet(U.rnd(BIG_SAY.isBuild), petStage());
      return;
    }
    if (s && s.k === 'move') {
      if (key !== s.key) { const a = I.cells[s.key]; if (id) I.cells[s.key] = id; else delete I.cells[s.key]; I.cells[key] = a; Sound.play('pop'); save(); }
      Island.sel = null; Island.draw(); Island.bounce(key);
      return;
    }
    if (id) { Island.sel = s && s.k === 'cell' && s.key === key ? null : { k: 'cell', key }; Sound.play('pop'); Island.draw(); Island.bounce(key); }
    else if (s) { Island.sel = null; Island.draw(); }
  },
  after(before) {
    const p = Island.pop(), ra = Island.rank(p), rb = Island.rank(before);
    if (ra !== rb) {
      Sound.play('level'); confetti(40);
      toast(`🎉 Теперь это — ${ra}! Жителей: ${p}`);
      Life.remember('isl', '🏝️', `Остров стал: «${ra}»`);
      setTimeout(() => { if ($('.is-ov')) Speech.sayPet(BIG_SAY.isRank, petStage()); }, 1200);
    }
  },
  bounce(key) { const e = $(`[data-iscell="${key}"]`); if (e) { e.classList.remove('bnc'); void e.offsetWidth; e.classList.add('bnc'); } },
  act(k) {
    const I = S.big.isl, s = Island.sel;
    if (k === 'cancel') { Island.sel = null; Sound.play('tap'); Island.draw(); return; }
    if (k === 'move' && s && s.k === 'cell') { Island.sel = { k: 'move', key: s.key }; Sound.play('tap'); Island.draw(); return; }
    if (k === 'store' && s && s.k === 'cell') {
      const id = I.cells[s.key], b = ISL_BY[id], left = Island.pop() - (b.pop || 0);
      const needy = Object.values(I.cells).filter(x => x !== id).map(x => ISL_BY[x]).filter(x => x.need > left);
      const doIt = () => { delete I.cells[s.key]; I.store[id] = (I.store[id] || 0) + 1; Island.sel = null; Sound.play('tap'); save(); Island.draw(); };
      if (needy.length) { confirmBox(`<div class="m-icon">📦</div><h2>Убрать «${b.name}»?</h2><p>Жителей станет меньше (${left}). Постройки останутся на месте, а новые большие постройки будут закрыты, пока жителей снова не станет больше.</p><p class="small">Из запаса её можно поставить обратно бесплатно.</p>`, 'Убрать', doIt); return; }
      doIt(); toast(`📦 «${b.name}» — в запасе. Поставить обратно можно бесплатно.`);
      return;
    }
    if (k === 'grow') {
      const nx = ISL_SIZES[(I.size || 0) + 1];
      if (!nx || S.coins < nx.price) return;
      confirmBox(`<div class="m-icon">🌊</div><h2>Расширить остров?</h2><p>Остров станет ${nx.c}×${nx.r} — это ${nx.c * nx.r} мест для построек.</p><p class="reward">🧮 ${fmt(S.coins)} − ${fmt(nx.price)} = ${fmt(S.coins - nx.price)} <i class="ci"></i></p>`, 'Расширить', () => {
        if (ISL_SIZES[(I.size || 0) + 1] !== nx || S.coins < nx.price) return;   // окно подтверждения устарело
        S.coins -= nx.price; I.spent = (I.spent || 0) + nx.price; I.size = (I.size || 0) + 1;
        Sound.play('level'); confetti(40); save(); Island.sel = null; Island.draw(); renderTop();
        Speech.sayPet(BIG_SAY.isBig, petStage());
      });
    }
  },
  click(ev) {
    const c = ev.target.closest('[data-iscell]'), b = ev.target.closest('[data-isb]'), a = ev.target.closest('[data-is]');
    if (c) { Island.tapCell(c.dataset.iscell); return; }
    if (b) { Island.pick(b.dataset.isb); return; }
    if (a && !a.disabled) Island.act(a.dataset.is);
  },
};
