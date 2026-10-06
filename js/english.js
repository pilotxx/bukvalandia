'use strict';
/* ============================================================
   Остров Hello — английский для 2–3 класса.
   Методика: слово всегда звучит (британский голос) и показано картинкой;
   phonics — чтение через звуки букв (CVC → сочетания → «волшебная e»);
   готовые фразы и мини-диалоги; грамматика на примерах. Без записи английских слов русскими буквами.
   Если английского голоса на устройстве нет, задания «на слух» автоматически заменяются чтением.
   ============================================================ */

const EN_ABC = 'abcdefghijklmnopqrstuvwxyz'.split('');
const EN_VOW = 'aeiou';
const enWord = w => `<div class="enword">${w}</div>`;
const ruWord = w => `<div class="ruword">${w}</div>`;
const swatch = hex => `<span class="sw" style="background:${hex}"></span>`;
const ex = (en, ru, em = '') => `<b>${en}</b> — ${ru} ${em}`;

/* Слово с пропуском (грамматика, сочетания букв) */
function enGap(str, prompt, o = {}) {
  const t = T.gap(str, prompt, { explain: o.explain, none: o.none });
  t.small = !!o.small;
  t.pic = o.pic;
  t.sayAfter = t.label;                 // после ответа звучит вся фраза целиком
  if (o.label) t.label = o.label;
  return t;
}
const scrambled = w => { const a = [...w]; let s; let k = 0; do { s = U.shuffle(a); k++; } while (s.join('') === w && k < 20); return s; };

/* ---------- Универсальные задания на слова ---------- */
function vocabTask(item, list, o = {}) {
  const [en, ru, em] = item;
  const others = U.sample(list.filter(x => x[0] !== en && x[1] !== ru && x[2] !== em), 3);
  const pics = [item, ...others];
  const pic = x => o.pic ? o.pic(x) : x[2];
  const picOpt = x => o.pic ? { v: x[0], label: o.pic(x), html: true } : opt(x[0], x[2]);
  const voice = Speech.enOk();
  const kinds = ['wordPic', 'picWord', 'ruEn', 'enRu'];
  if (voice) kinds.push('listenPic', 'listenPic', 'listenWord');
  if (/^[a-z]{3,6}$/.test(en)) { kinds.push('spell'); if (GEN.boost) kinds.push('spell', 'spell'); }
  const k = U.rnd(kinds);
  const exp = ex(en, ru, o.pic ? '' : em);
  if (k === 'listenPic') return T.choice('Послушай и выбери картинку', pics.map(picOpt), en, { say: en, auto: true, explain: exp, label: en });
  if (k === 'listenWord') return T.choice('Послушай и выбери слово', pics.map(x => opt(x[0])), en, { say: en, auto: true, explain: exp, label: en });
  if (k === 'wordPic') return T.choice('Найди картинку к слову', pics.map(picOpt), en, { show: enWord(en), say: en, explain: exp, label: en });
  if (k === 'picWord') return T.choice('Как это по-английски?', pics.map(x => opt(x[0])), en, { pic: pic(item), sayAfter: en, explain: exp, label: en });
  if (k === 'ruEn') return T.choice('Переведи на английский', pics.map(x => opt(x[0])), en, { show: ruWord(ru), sayAfter: en, explain: exp, label: en });
  if (k === 'enRu') return T.choice('Что значит это слово?', pics.map(x => opt(x[0], x[1])), en, { show: enWord(en), say: en, explain: exp, label: en });
  return { kind: 'order', join: '', prompt: 'Собери слово из букв', pic: pic(item), pieces: scrambled(en), answers: [en], sayAfter: en, explain: exp, label: en + ' (буквы)' };
}
const repeatTo = (list, n) => { const out = []; while (out.length < n) out.push(...list); return out.slice(0, Math.max(n, list.length)); };
const vocabLesson = (list, o) => ({ bank: repeatTo(list, 12), make(item) { return vocabTask(item, list, o); } });

/* ---------- Словари: [английский, русский, картинка] ---------- */
const V = {
  farm: [['cat', 'кошка', '🐱'], ['dog', 'собака', '🐶'], ['cow', 'корова', '🐮'], ['pig', 'свинья', '🐷'], ['horse', 'лошадь', '🐴'], ['sheep', 'овца', '🐑'],
    ['duck', 'утка', '🦆'], ['hen', 'курица', '🐔'], ['rabbit', 'кролик', '🐰'], ['mouse', 'мышь', '🐭'], ['fish', 'рыба', '🐟'], ['bird', 'птица', '🐦']],
  wild: [['lion', 'лев', '🦁'], ['tiger', 'тигр', '🐯'], ['monkey', 'обезьяна', '🐵'], ['elephant', 'слон', '🐘'], ['bear', 'медведь', '🐻'], ['fox', 'лиса', '🦊'],
    ['giraffe', 'жираф', '🦒'], ['zebra', 'зебра', '🦓'], ['crocodile', 'крокодил', '🐊'], ['snake', 'змея', '🐍'], ['owl', 'сова', '🦉'], ['penguin', 'пингвин', '🐧'], ['frog', 'лягушка', '🐸']],
  family: [['mum', 'мама', '👩'], ['dad', 'папа', '👨'], ['sister', 'сестра', '👧'], ['brother', 'брат', '👦'], ['grandma', 'бабушка', '👵'], ['grandpa', 'дедушка', '👴'],
    ['baby', 'малыш', '👶'], ['family', 'семья', '👪']],
  house: [['house', 'дом', '🏠'], ['door', 'дверь', '🚪'], ['bed', 'кровать', '🛏️'], ['chair', 'стул', '🪑'], ['sofa', 'диван', '🛋️'], ['bath', 'ванна', '🛁'],
    ['lamp', 'лампа', '💡'], ['TV', 'телевизор', '📺'], ['clock', 'часы', '🕰️'], ['key', 'ключ', '🔑'], ['garden', 'сад', '🏡']],
  school: [['book', 'книга', '📖'], ['pen', 'ручка', '🖊️'], ['pencil', 'карандаш', '✏️'], ['bag', 'портфель', '🎒'], ['ruler', 'линейка', '📏'], ['scissors', 'ножницы', '✂️'],
    ['paints', 'краски', '🎨'], ['notebook', 'тетрадь', '📓'], ['computer', 'компьютер', '💻'], ['school', 'школа', '🏫']],
  toys: [['ball', 'мяч', '⚽'], ['teddy bear', 'плюшевый мишка', '🧸'], ['car', 'машинка', '🚗'], ['train', 'поезд', '🚂'], ['plane', 'самолёт', '✈️'], ['kite', 'воздушный змей', '🪁'],
    ['robot', 'робот', '🤖'], ['boat', 'кораблик', '⛵'], ['drum', 'барабан', '🥁'], ['balloon', 'воздушный шарик', '🎈'], ['puzzle', 'пазл', '🧩']],
  food: [['apple', 'яблоко', '🍎'], ['banana', 'банан', '🍌'], ['bread', 'хлеб', '🍞'], ['milk', 'молоко', '🥛'], ['cake', 'торт', '🎂'], ['egg', 'яйцо', '🥚'],
    ['cheese', 'сыр', '🧀'], ['orange', 'апельсин', '🍊'], ['pizza', 'пицца', '🍕'], ['carrot', 'морковь', '🥕'], ['ice cream', 'мороженое', '🍦'], ['chocolate', 'шоколад', '🍫'],
    ['sweets', 'конфеты', '🍬'], ['tea', 'чай', '🍵'], ['soup', 'суп', '🍲'], ['sandwich', 'бутерброд', '🥪'], ['tomato', 'помидор', '🍅'], ['potato', 'картошка', '🥔'],
    ['juice', 'сок', '🧃'], ['grapes', 'виноград', '🍇'], ['lemon', 'лимон', '🍋'], ['strawberry', 'клубника', '🍓']],
  clothes: [['hat', 'шляпа', '👒'], ['T-shirt', 'футболка', '👕'], ['dress', 'платье', '👗'], ['jeans', 'джинсы', '👖'], ['shoes', 'туфли', '👞'], ['socks', 'носки', '🧦'],
    ['coat', 'пальто', '🧥'], ['scarf', 'шарф', '🧣'], ['gloves', 'перчатки', '🧤'], ['cap', 'кепка', '🧢'], ['boots', 'сапоги', '👢']],
  body: [['eye', 'глаз', '👁️'], ['ear', 'ухо', '👂'], ['nose', 'нос', '👃'], ['mouth', 'рот', '👄'], ['hand', 'кисть руки', '✋'], ['arm', 'рука', '💪'],
    ['leg', 'нога', '🦵'], ['foot', 'ступня', '🦶'], ['tooth', 'зуб', '🦷'], ['finger', 'палец', '☝️'], ['face', 'лицо', '🙂']],
  weather: [['sun', 'солнце', '☀️'], ['rain', 'дождь', '🌧️'], ['snow', 'снег', '❄️'], ['cloud', 'облако', '☁️'], ['wind', 'ветер', '🌬️'], ['rainbow', 'радуга', '🌈'],
    ['winter', 'зима', '⛄'], ['spring', 'весна', '🌷'], ['summer', 'лето', '🏖️'], ['autumn', 'осень', '🍂']],
  actions: [['run', 'бегать', '🏃'], ['swim', 'плавать', '🏊'], ['fly', 'летать', '🕊️'], ['sing', 'петь', '🎤'], ['dance', 'танцевать', '💃'], ['read', 'читать', '📖'],
    ['write', 'писать', '✍️'], ['draw', 'рисовать', '🎨'], ['climb', 'лазать', '🧗'], ['ride a bike', 'кататься на велосипеде', '🚴'], ['sleep', 'спать', '😴'],
    ['skate', 'кататься на коньках', '⛸️'], ['ski', 'кататься на лыжах', '⛷️'], ['play football', 'играть в футбол', '⚽']],
  colours: [['red', 'красный', '#E53935'], ['blue', 'синий', '#1E88E5'], ['green', 'зелёный', '#43A047'], ['yellow', 'жёлтый', '#FDD835'], ['orange', 'оранжевый', '#FB8C00'],
    ['purple', 'фиолетовый', '#8E24AA'], ['pink', 'розовый', '#F48FB1'], ['black', 'чёрный', '#212121'], ['white', 'белый', '#FFFFFF'], ['brown', 'коричневый', '#795548'], ['grey', 'серый', '#9E9E9E']],
};
const COLOUR_OF = [['banana', '🍌', 'yellow'], ['lemon', '🍋', 'yellow'], ['tomato', '🍅', 'red'], ['strawberry', '🍓', 'red'], ['carrot', '🥕', 'orange'], ['orange', '🍊', 'orange'],
  ['frog', '🐸', 'green'], ['leaf', '🌿', 'green'], ['cloud', '☁️', 'white'], ['milk', '🥛', 'white'], ['elephant', '🐘', 'grey'], ['chocolate', '🍫', 'brown'], ['bear', '🐻', 'brown'],
  ['pig', '🐷', 'pink'], ['grapes', '🍇', 'purple', true]];
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const TENS = { 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'a hundred' };
const numWord = n => n <= 20 ? NUM[n] : n === 100 ? 'a hundred' : n % 10 === 0 ? TENS[n] : `${TENS[n - n % 10]}-${NUM[n % 10]}`;

/* ---------- Сцена «в, на, под» ---------- */
function prepScene(rel, em) {
  if (rel === 'in') {
    return `<svg class="scene" viewBox="0 0 200 150"><text x="100" y="92" font-size="46" text-anchor="middle" dominant-baseline="central">${em}</text>
      <path d="M50 90 L150 90 L150 140 L50 140 Z" fill="#C8955A" stroke="#7A5230" stroke-width="3"/><path d="M50 90 L35 72 M150 90 L165 72" stroke="#7A5230" stroke-width="3"/>
      <line x1="50" y1="112" x2="150" y2="112" stroke="#7A5230" stroke-width="2" opacity=".5"/></svg>`;
  }
  const table = `<rect x="35" y="78" width="130" height="10" rx="3" fill="#C8955A" stroke="#7A5230" stroke-width="3"/>
    <line x1="48" y1="88" x2="48" y2="142" stroke="#7A5230" stroke-width="6"/><line x1="152" y1="88" x2="152" y2="142" stroke="#7A5230" stroke-width="6"/>`;
  const y = rel === 'on' ? 54 : 118;
  return `<svg class="scene" viewBox="0 0 200 150">${table}<text x="100" y="${y}" font-size="40" text-anchor="middle" dominant-baseline="central">${em}</text></svg>`;
}

/* ============================================================
   МИРЫ ОСТРОВА HELLO
   ============================================================ */
const half = (from, to) => EN_ABC.slice(EN_ABC.indexOf(from), EN_ABC.indexOf(to) + 1);
const CONFUSE = { b: 'dpq', d: 'bpq', p: 'qbd', q: 'pgd', m: 'nw', n: 'mu', i: 'jl', j: 'ig', g: 'qj', l: 'it', u: 'vn', v: 'uw', w: 'vm', e: 'ac', a: 'oe', o: 'ac', c: 'oe', h: 'nk', k: 'hx', f: 'tl', t: 'fl', r: 'nh', s: 'zc', z: 'sx', x: 'ky', y: 'vj' };
function letterTask(kind, pool) {
  const L = U.rnd(pool), UL = L.toUpperCase();
  if (kind === 'listen' && Speech.enOk()) {
    const others = U.sample(pool.filter(x => x !== L), 3);
    return T.choice('Послушай и выбери букву', [L, ...others].map(x => opt(x, x.toUpperCase())), L, { say: UL, auto: true, explain: `Это буква <b>${UL} ${L}</b>.`, label: 'буква ' + UL });
  }
  if (kind === 'case' || kind === 'listen') {
    const conf = (CONFUSE[L] || '').split('').filter(x => x !== L);
    const others = [...new Set([...conf, ...U.sample(EN_ABC.filter(x => x !== L), 4)])].filter(x => x !== L).slice(0, 3);
    return T.choice(`Найди маленькую букву для <b>${UL}</b>`, [L, ...others].map(x => opt(x)), L, { show: enWord(UL), say: UL, explain: `Большая <b>${UL}</b> — маленькая <b>${L}</b>.`, label: `${UL} → ${L}` });
  }
  const i = EN_ABC.indexOf(L);
  const t = i < 25 ? i + 1 : i - 1, after = i < 25;
  const others = U.sample(EN_ABC.filter((x, k) => k !== t && k !== i), 3);
  return T.choice(`Какая буква идёт <b>${after ? 'после' : 'перед'}</b> ${UL}?`, [EN_ABC[t], ...others].map(x => opt(x, x.toUpperCase())), EN_ABC[t],
    { explain: `В алфавите: ${after ? UL + ', ' + EN_ABC[t].toUpperCase() : EN_ABC[t].toUpperCase() + ', ' + UL}.`, label: `${after ? 'после' : 'перед'} ${UL}` });
}

const EN_WORLDS = [

  /* ------------------------------------------------ 1 */
  {
    id: 'ew1', name: 'Бухта ABC', emoji: '⛵', c1: '#7FD3F7', c2: '#2E9BDA',
    boss: { id: 'eb1', name: 'Попугай Болтун', emoji: '🦜', hp: 8, story: 'Попугай Болтун выкрикивает буквы вперемешку. Наведи порядок в алфавите!' },
    lessons: [
      {
        id: 'e_abc1', title: 'Буквы A–M', icon: '🅰️', grade: 2,
        rule: 'В английском алфавите <b>26 букв</b>. У каждой есть большая и маленькая форма: <b>A a, B b, C c</b>…<br>Нажимай 🔊, чтобы услышать, как называется буква. Не путай <b>b</b> и <b>d</b>: у <b>b</b> «животик» справа!',
        bank: ['listen', 'listen', 'listen', 'listen', 'case', 'case', 'case', 'case', 'next', 'next', 'next', 'case'],
        make: k => letterTask(k, half('a', 'm')),
      },
      {
        id: 'e_abc2', title: 'Буквы N–Z', icon: '🔠', grade: 2,
        rule: 'Вторая половина алфавита: <b>N O P Q R S T U V W X Y Z</b>.<br>Не путай <b>p</b> и <b>q</b>: у <b>p</b> «хвостик» слева, у <b>q</b> — справа. <b>W</b> — это «двойная U».',
        bank: ['listen', 'listen', 'listen', 'listen', 'case', 'case', 'case', 'case', 'next', 'next', 'next', 'case'],
        make: k => letterTask(k, half('n', 'z')),
      },
      {
        id: 'e_abcall', title: 'Весь алфавит', icon: '🔡', grade: 2,
        rule: '<span class="abc-line">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</span>Английские слова в словаре стоят по алфавиту — как и русские.',
        bank: ['order', 'order', 'order', 'miss', 'miss', 'miss', 'listen', 'listen', 'case', 'case', 'next', 'next'],
        make(k) {
          if (k === 'order') {
            const ls = U.sample(EN_ABC, 4), right = ls.slice().sort();
            let sh; do { sh = U.shuffle(ls); } while (sh.join('') === right.join(''));
            return { kind: 'order', join: ' ', prompt: 'Расставь буквы <b>по алфавиту</b>', pieces: sh.map(x => x.toUpperCase()), answers: [right.join(' ').toUpperCase()], explain: `По алфавиту: ${right.join(', ').toUpperCase()}.`, label: 'порядок ' + right.join('').toUpperCase() };
          }
          if (k === 'miss') {
            const s = mr(0, 22), h = s + mr(1, 2);
            const seq = [s, s + 1, s + 2, s + 3].map(x => x === h ? '<span class="q-mark">?</span>' : EN_ABC[x].toUpperCase()).join(' ');
            const others = U.sample(EN_ABC.filter((_, i) => i !== h), 3);
            return T.choice('Какая буква пропущена?', [EN_ABC[h], ...others].map(x => opt(x, x.toUpperCase())), EN_ABC[h], { show: enWord(seq), explain: `По алфавиту: ${[s, s + 1, s + 2, s + 3].map(x => EN_ABC[x].toUpperCase()).join(', ')}.`, label: 'пропуск ' + EN_ABC[h].toUpperCase() });
          }
          return letterTask(k, EN_ABC);
        },
      },
    ],
  },

  /* ------------------------------------------------ 2 */
  {
    id: 'ew2', name: 'Парк Звуков', emoji: '🎠', c1: '#FFB3D1', c2: '#F06292',
    boss: { id: 'eb2', name: 'Обезьянка Шумелка', emoji: '🐒', hp: 8, story: 'Обезьянка Шумелка перемешала все звуки в парке. Прочитай слова правильно!' },
    lessons: [
      {
        id: 'e_initial', title: 'Первая буква слова', icon: '👂', grade: 2,
        rule: 'Послушай слово и найди, с какой <b>буквы</b> оно начинается.<br><i>🐱 cat — <b>c</b>, 🐶 dog — <b>d</b></i>',
        bank: [['apple', '🍎', 'яблоко'], ['bus', '🚌', 'автобус'], ['cat', '🐱', 'кошка'], ['dog', '🐶', 'собака'], ['egg', '🥚', 'яйцо'], ['fish', '🐟', 'рыба'], ['girl', '👧', 'девочка'],
          ['hat', '🎩', 'шляпа'], ['jeans', '👖', 'джинсы'], ['king', '🤴', 'король'], ['lion', '🦁', 'лев'], ['moon', '🌙', 'луна'], ['nose', '👃', 'нос'], ['orange', '🍊', 'апельсин'],
          ['pen', '🖊️', 'ручка'], ['queen', '👸', 'королева'], ['rabbit', '🐰', 'кролик'], ['sun', '☀️', 'солнце'], ['tiger', '🐯', 'тигр'], ['umbrella', '☂️', 'зонт'],
          ['van', '🚐', 'фургон'], ['watch', '⌚', 'часы'], ['yo-yo', '🪀', 'йо-йо'], ['zebra', '🦓', 'зебра']],
        make([w, em, ru]) {
          const L = w[0];
          const banned = { c: 'ksq', k: 'cq', q: 'kc', s: 'cz', z: 's', j: 'g', g: 'j', v: 'wf', w: 'v' }[L] || '';
          const pool = EN_ABC.filter(x => x !== L && !banned.includes(x) && (EN_VOW.includes(L) ? !EN_VOW.includes(x) : true) && x !== 'x');
          const opts = [L, ...U.sample(pool, 3)].map(x => opt(x));
          const exp = `<b>${w}</b> — ${ru} ${em}. Первая буква — <b>${L}</b>.`;
          if (Speech.enOk() && Math.random() < 0.7) return T.choice('Послушай слово. С какой буквы оно начинается?', opts, L, { pic: em, say: w, auto: true, explain: exp, label: w });
          return T.choice('С какой буквы начинается слово?', opts, L, { pic: em, show: enWord(`<span class="q-mark">?</span>${w.slice(1)}`), sayAfter: w, explain: exp, label: w });
        },
      },
      {
        id: 'e_cvc', title: 'Читаем короткие слова', icon: '📗', grade: 2,
        rule: 'В коротких словах буквы читаются своими «звуками»:<br><b>a</b> — [æ] <i>cat</i>, <b>e</b> — [e] <i>pen</i>, <b>i</b> — [ɪ] <i>pig</i>, <b>o</b> — [ɒ] <i>dog</i>, <b>u</b> — [ʌ] <i>sun</i>.<br>Читай слово по звукам и соединяй: <i>c-a-t → cat</i>.',
        bank: [['cat', '🐱', 'кошка'], ['dog', '🐶', 'собака'], ['pig', '🐷', 'свинья'], ['hen', '🐔', 'курица'], ['fox', '🦊', 'лиса'], ['bus', '🚌', 'автобус'], ['sun', '☀️', 'солнце'],
          ['cup', '☕', 'чашка'], ['bed', '🛏️', 'кровать'], ['pen', '🖊️', 'ручка'], ['box', '📦', 'коробка'], ['bag', '🎒', 'сумка'], ['hat', '🎩', 'шляпа'], ['map', '🗺️', 'карта'],
          ['bat', '🦇', 'летучая мышь'], ['rat', '🐀', 'крыса'], ['cap', '🧢', 'кепка'], ['van', '🚐', 'фургон'], ['web', '🕸️', 'паутина'], ['net', '🥅', 'сетка'], ['nut', '🥜', 'орех'], ['bug', '🐞', 'жучок']],
        make([w, em, ru]) {
          const list = this.bank;
          const swaps = [...EN_VOW].filter(v => v !== w[1]).map(v => w[0] + v + w[2]);
          const spellOpts = [w, ...U.sample(swaps, 3)];
          const exp = `<b>${w}</b> — ${ru} ${em}`;
          const r = Math.random();
          if (r < 0.35) {
            const others = U.sample(list.filter(x => x[0] !== w), 3);
            return T.choice('Прочитай слово и найди картинку', [[w, em], ...others].map(x => opt(x[0], x[1])), w, { show: enWord(w), say: w, explain: exp, label: w + ' (чтение)' });
          }
          if (r < 0.65 && Speech.enOk()) return T.choice('Послушай и найди, как пишется слово', spellOpts, w, { say: w, auto: true, explain: exp, label: w + ' (на слух)' });
          return T.choice('Как пишется это слово?', spellOpts, w, { pic: em, sayAfter: w, explain: exp, label: w + ' (письмо)' });
        },
      },
      {
        id: 'e_digraph', title: 'Сочетания sh, ch, th, ee, oo', icon: '🐚', grade: 2,
        rule: 'Две буквы вместе дают <b>один звук</b>:<br><b>sh</b> — [ʃ], как «ш»: <i>ship</i> &nbsp; <b>ch</b> — [tʃ], как «ч»: <i>chick</i><br><b>th</b> — язык между зубами: <i>three</i><br><b>ee</b> — долгое [i:]: <i>tree</i> &nbsp; <b>oo</b> — долгое [u:]: <i>moon</i>',
        bank: [['[sh|ch|th]ip', '🚢', 'корабль'], ['fi[sh|ch|th]', '🐟', 'рыба'], ['[sh|ch|th]eep', '🐑', 'овца'], ['[sh|ch|th]ell', '🐚', 'ракушка'], ['[ch|sh|th]ick', '🐤', 'цыплёнок'],
          ['[ch|sh|th]eese', '🧀', 'сыр'], ['[ch|sh|th]air', '🪑', 'стул'], ['[ch|sh|th]erry', '🍒', 'вишня'], ['[ch|sh|th]ips', '🍟', 'картошка фри'], ['[th|sh|ch]ree', '3️⃣', 'три'],
          ['ba[th|sh|ch]', '🛁', 'ванна'], ['tee[th|sh|ch]', '🦷', 'зубы'], ['[th|sh|ch]umb', '👍', 'большой палец'], ['tr[ee|oo]', '🌳', 'дерево'], ['b[ee|oo]', '🐝', 'пчела'],
          ['m[oo|ee]n', '🌙', 'луна'], ['b[oo|ee]ts', '👢', 'сапоги'], ['gr[ee|oo]n', '🟢', 'зелёный'], ['f[ee|oo]t', '🦶', 'ступни']],
        make([s, em, ru]) {
          const SOUND = { sh: 'sh — звук [ʃ], как «ш»', ch: 'ch — звук [tʃ], как «ч»', th: 'th — язык между зубами', ee: 'ee — долгий звук [i:]', oo: 'oo — долгий звук [u:]' };
          const t = enGap(s, Speech.enOk() ? 'Послушай и вставь буквы' : 'Какие буквы пропущены?', { pic: em, explain: g => `<b>${g.full}</b> — ${ru}. ${SOUND[g.answer]}.` });
          if (Speech.enOk()) { t.say = t.label; t.auto = true; }
          return t;
        },
      },
      {
        id: 'e_magic', title: 'Волшебная E', icon: '✨', grade: 3,
        rule: 'Буква <b>e</b> на конце слова <b>не читается</b>, но «включает» гласную — та читается, как в алфавите:<br><i>kit [ɪ] → kit<b>e</b> [aɪ]</i>, <i>cap → cap<b>e</b> [eɪ]</i>, <i>hop → hop<b>e</b> [əʊ]</i>, <i>cub → cub<b>e</b> [juː]</i>',
        bank: [['kite', '🪁', 'воздушный змей', 'kit', 'kait'], ['cake', '🎂', 'торт', 'cak', 'keik'], ['bike', '🚲', 'велосипед', 'bik', 'baik'], ['home', '🏠', 'дом', 'hom', 'houm'],
          ['rose', '🌹', 'роза', 'ros', 'rouz'], ['bone', '🦴', 'кость', 'bon', 'boun'], ['nose', '👃', 'нос', 'nos', 'nouz'], ['plane', '✈️', 'самолёт', 'plan', 'plein'],
          ['smile', '😊', 'улыбка', 'smil', 'smail'], ['five', '5️⃣', 'пять', 'fiv', 'faiv'], ['nine', '9️⃣', 'девять', 'nin', 'nain'], ['cube', '🧊', 'кубик', 'kub', 'kjub'], ['game', '🎮', 'игра', 'gam', 'geim']],
        make([w, em, ru, d1, d2]) {
          const vow = w.replace(/e$/, '').match(/[aeiou](?=[^aeiou]*$)/)[0];
          const SOUNDS = { a: '[eɪ]', i: '[aɪ]', o: '[əʊ]', u: '[juː]' };
          return T.choice('Как правильно пишется слово?', [w, d1, d2], w, {
            pic: em, sayAfter: w, label: w,
            explain: `<b>${w}</b> — ${ru} ${em}. Буква <b>e</b> на конце не читается, а <b>${vow}</b> звучит как в алфавите: ${SOUNDS[vow]}.`,
          });
        },
      },
    ],
  },

  /* ------------------------------------------------ 3 */
  {
    id: 'ew3', name: 'Зоопарк', emoji: '🦁', c1: '#FFD180', c2: '#FB8C00',
    boss: { id: 'eb3', name: 'Акула Хапуга', emoji: '🦈', hp: 10, story: 'Акула Хапуга утащила таблички с названиями зверей. Верни их на место!' },
    lessons: [
      Object.assign({ id: 'e_farm', title: 'Домашние животные', icon: '🐮', grade: 2, rule: 'Слушай, смотри и запоминай: <i>🐱 cat, 🐶 dog, 🐮 cow, 🐷 pig, 🐴 horse, 🐑 sheep, 🦆 duck, 🐔 hen…</i><br>Нажимай 🔊 сколько угодно раз — так слова запоминаются лучше.' }, vocabLesson(V.farm)),
      Object.assign({ id: 'e_wild', title: 'Дикие животные', icon: '🦒', grade: 2, rule: '<i>🦁 lion, 🐯 tiger, 🐵 monkey, 🐘 elephant, 🐻 bear, 🦊 fox, 🦒 giraffe, 🦓 zebra…</i><br>Кнопка 🐢 произносит слово медленно.' }, vocabLesson(V.wild)),
      {
        id: 'e_can', title: 'Я умею: can / can\'t', icon: '🏊', grade: 2,
        rule: '<b>can</b> — может, умеет: <i>A fish <b>can</b> swim.</i><br><b>can\'t</b> (cannot) — не может: <i>A fish <b>can\'t</b> walk.</i>',
        bank: [['A fish [can|can\'t] swim.', '🐟'], ['A fish [can\'t|can] walk.', '🐟'], ['A bird [can|can\'t] fly.', '🐦'], ['A dog [can|can\'t] run.', '🐶'], ['A dog [can\'t|can] fly.', '🐶'],
          ['A frog [can|can\'t] jump.', '🐸'], ['A monkey [can|can\'t] climb.', '🐵'], ['An elephant [can\'t|can] fly.', '🐘'], ['A snake [can\'t|can] walk.', '🐍'],
          ['A penguin [can\'t|can] fly.', '🐧'], ['A penguin [can|can\'t] swim.', '🐧'], ['A horse [can|can\'t] run.', '🐴'], ['A cow [can\'t|can] fly.', '🐮'],
          ['A duck [can|can\'t] swim.', '🦆'], ['A baby [can\'t|can] read.', '👶']],
        make([s, em]) {
          return enGap(s, 'Вставь <b>can</b> или <b>can\'t</b>', { pic: em, small: true, explain: g => g.answer === 'can' ? `<b>${g.full}</b> — да, может! <i>can</i> = может, умеет.` : `<b>${g.full}</b> — не может. <i>can't</i> = не может.` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 4 */
  {
    id: 'ew4', name: 'Радужный сад', emoji: '🌈', c1: '#B9F6CA', c2: '#00C853',
    boss: { id: 'eb4', name: 'Павлин Хвастун', emoji: '🦚', hp: 10, story: 'Павлин Хвастун уверен, что никто не знает цвета и числа лучше него. Докажи обратное!' },
    lessons: [
      {
        id: 'e_colours', title: 'Цвета', icon: '🎨', grade: 2,
        rule: `${swatch('#E53935')} red ${swatch('#1E88E5')} blue ${swatch('#43A047')} green ${swatch('#FDD835')} yellow ${swatch('#FB8C00')} orange ${swatch('#8E24AA')} purple<br>${swatch('#F48FB1')} pink ${swatch('#212121')} black ${swatch('#FFFFFF')} white ${swatch('#795548')} brown ${swatch('#9E9E9E')} grey<br>Вопрос: <i>What colour is it?</i> — Ответ: <i>It's red.</i>`,
        bank: [...V.colours, ...COLOUR_OF.map(x => ['ctx', ...x])],
        make(item) {
          if (item[0] === 'ctx') {
            const [, obj, em, col, many] = item;
            const others = U.sample(V.colours.filter(c => c[0] !== col), 3).map(c => c[0]);
            const ru = V.colours.find(c => c[0] === col)[1];
            const q = `What colour ${many ? 'are' : 'is'} the ${obj}?`, it = many ? "They're" : "It's";
            return T.choice(q, [col, ...others].map(x => opt(x, `${it} ${x}.`)), col, { pic: em, say: q, auto: Speech.enOk(), sayAfter: `${it} ${col}.`, explain: `<i>${q}</i> — Какого цвета? <b>${it} ${col}.</b> — ${ru}.${many ? ' Предметов много, поэтому <b>are</b> и <b>they</b>.' : ''}`, label: `${obj} — ${col}` });
          }
          return vocabTask(item, V.colours, { pic: x => swatch(x[2]) });
        },
      },
      {
        id: 'e_num1', title: 'Числа 1–10', icon: '1️⃣', grade: 2,
        rule: '1 one, 2 two, 3 three, 4 four, 5 five,<br>6 six, 7 seven, 8 eight, 9 nine, 10 ten',
        bank: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 2, 7],
        make: n => numTask(n, 1, 10),
      },
      {
        id: 'e_num2', title: 'Числа 11–20', icon: '🎲', grade: 2,
        rule: '11 eleven, 12 twelve, 13 thirteen, 14 fourteen, 15 fifteen,<br>16 sixteen, 17 seventeen, 18 eighteen, 19 nineteen, 20 twenty<br>Окончание <b>-teen</b> — это «-надцать».',
        bank: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 13, 15],
        make: n => numTask(n, 11, 20),
      },
      {
        id: 'e_num3', title: 'Десятки до 100', icon: '💯', grade: 3,
        rule: '20 twenty, 30 thirty, 40 <b>forty</b> (без u!), 50 fifty, 60 sixty, 70 seventy, 80 eighty, 90 ninety, 100 a hundred.<br>Составные числа пишем через дефис: <i>35 — thirty-five</i>.',
        bank: [30, 40, 50, 60, 70, 80, 90, 100, 25, 47, 63, 88],
        make: n => numTask(n, 20, 100),
      },
    ],
  },

  /* ------------------------------------------------ 5 */
  {
    id: 'ew5', name: 'Дом, милый дом', emoji: '🏡', c1: '#FFCCBC', c2: '#FF7043',
    boss: { id: 'eb5', name: 'Мышонок Шуршун', emoji: '🐭', hp: 10, story: 'Мышонок Шуршун спрятал все вещи в доме. Найди их по-английски!' },
    lessons: [
      Object.assign({ id: 'e_family', title: 'Моя семья', icon: '👪', grade: 2, rule: '<i>👩 mum, 👨 dad, 👧 sister, 👦 brother, 👵 grandma, 👴 grandpa, 👶 baby</i><br>Как представить: <i>This is my mum.</i> — Это моя мама.' }, vocabLesson(V.family)),
      Object.assign({ id: 'e_house', title: 'Мой дом', icon: '🏠', grade: 2, rule: '<i>🏠 house, 🚪 door, 🛏️ bed, 🪑 chair, 🛋️ sofa, 🛁 bath, 💡 lamp, 📺 TV, 🕰️ clock…</i>' }, vocabLesson(V.house)),
      {
        id: 'e_be', title: 'am / is / are', icon: '🙋', grade: 2,
        rule: '<b>I am</b> — я есть<br><b>he / she / it is</b> — он / она / оно<br><b>we / you / they are</b> — мы / вы, ты / они<br><i>I am eight. She is my sister. They are friends.</i>',
        bank: ['I [am|is|are] eight.', 'She [is|am|are] my sister.', 'They [are|am|is] friends.', 'We [are|am|is] happy.', 'It [is|am|are] a cat.', 'You [are|am|is] my friend.',
          'He [is|am|are] tall.', 'Tom [is|am|are] ten.', 'My dogs [are|am|is] big.', 'The ball [is|am|are] red.', 'I [am|is|are] a pupil.', 'Kate and Ann [are|am|is] sisters.',
          'The cats [are|am|is] black.', 'My mum [is|am|are] a doctor.'],
        make(s) {
          return enGap(s, 'Вставь <b>am</b>, <b>is</b> или <b>are</b>', { small: true, explain: g => `<b>${g.full}</b> — ${g.answer === 'am' ? 'с I всегда <b>am</b>.' : g.answer === 'is' ? 'один (он, она, оно) — <b>is</b>.' : 'много (мы, вы, они) или you — <b>are</b>.'}` });
        },
      },
      {
        id: 'e_have', title: 'have got / has got', icon: '🎁', grade: 2,
        rule: '«У меня есть…»:<br><b>I / you / we / they have got</b> — <i>I have got a cat.</i><br><b>he / she / it has got</b> — <i>She has got a doll.</i>',
        bank: ['I [have|has] got a cat.', 'She [has|have] got a doll.', 'They [have|has] got a ball.', 'My brother [has|have] got a bike.', 'We [have|has] got a garden.',
          'He [has|have] got a dog.', 'You [have|has] got a nice bag.', 'The cat [has|have] got green eyes.', 'Ann [has|have] got a sister.', 'I [have|has] got two brothers.',
          'It [has|have] got a long tail.', 'My friends [have|has] got a puppy.'],
        make(s) {
          return enGap(s, 'Вставь <b>have</b> или <b>has</b>', { small: true, explain: g => `<b>${g.full}</b> — ${g.answer === 'has' ? 'он, она, оно → <b>has got</b>.' : 'я, ты, мы, они → <b>have got</b>.'}` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 6 */
  {
    id: 'ew6', name: 'Школа Hello', emoji: '🏫', c1: '#B3E5FC', c2: '#039BE5',
    boss: { id: 'eb6', name: 'Тыквоголов', emoji: '🎃', hp: 12, story: 'Тыквоголов перепутал все вещи в школе. Разложи всё по местам!' },
    lessons: [
      Object.assign({ id: 'e_school', title: 'Школьные вещи', icon: '🎒', grade: 2, rule: '<i>📖 book, 🖊️ pen, ✏️ pencil, 🎒 bag, 📏 ruler, ✂️ scissors, 🎨 paints, 📓 notebook…</i>' }, vocabLesson(V.school)),
      Object.assign({ id: 'e_toys', title: 'Игрушки', icon: '🧸', grade: 2, rule: '<i>⚽ ball, 🧸 teddy bear, 🚗 car, 🚂 train, ✈️ plane, 🪁 kite, 🤖 robot, ⛵ boat…</i>' }, vocabLesson(V.toys)),
      {
        id: 'e_aan', title: 'a или an', icon: '🍏', grade: 2,
        rule: 'Перед словом в единственном числе ставим <b>a</b> или <b>an</b> («один, какой-то»).<br><b>an</b> — если слово начинается с <b>гласного звука</b>: <i>an apple, an egg</i>.<br><b>a</b> — во всех остальных случаях: <i>a cat, a dog</i>.',
        bank: [['apple', '🍎', 1], ['egg', '🥚', 1], ['orange', '🍊', 1], ['elephant', '🐘', 1], ['umbrella', '☂️', 1], ['ice cream', '🍦', 1], ['owl', '🦉', 1], ['ant', '🐜', 1],
          ['octopus', '🐙', 1], ['cat', '🐱', 0], ['dog', '🐶', 0], ['banana', '🍌', 0], ['book', '📖', 0], ['ball', '⚽', 0], ['house', '🏠', 0], ['pen', '🖊️', 0], ['tiger', '🐯', 0],
          ['robot', '🤖', 0], ['lemon', '🍋', 0], ['ship', '🚢', 0]],
        make([w, em, an]) {
          return enGap(`[${an ? 'an|a' : 'a|an'}] ${w}`, 'Вставь <b>a</b> или <b>an</b>', { pic: em, explain: g => an ? `<b>${g.full}</b> — слово начинается с гласного звука, поэтому <b>an</b>.` : `<b>${g.full}</b> — слово начинается с согласного звука, поэтому <b>a</b>.` });
        },
      },
      {
        id: 'e_this', title: 'this / these', icon: '👉', grade: 2,
        rule: '<b>this</b> — этот, эта (один предмет): <i>This is a pen.</i><br><b>these</b> — эти (много предметов): <i>These are pens.</i>',
        bank: [['pen', 'pens', '🖊️'], ['cat', 'cats', '🐱'], ['book', 'books', '📖'], ['apple', 'apples', '🍎'], ['box', 'boxes', '📦'], ['car', 'cars', '🚗'], ['ball', 'balls', '⚽'], ['bag', 'bags', '🎒']],
        make([sg, pl, em]) {
          const many = Math.random() < 0.5;
          const v = Math.random() < 0.5;
          const s = v ? (many ? `[These|This] are ${pl}.` : `[This|These] is a ${sg}.`) : (many ? `These [are|is] ${pl}.` : `This [is|are] a ${sg}.`);
          return enGap(s, v ? 'Вставь <b>this</b> или <b>these</b>' : 'Вставь <b>is</b> или <b>are</b>', { pic: many ? em + em + em : em, small: true,
            explain: g => many ? `<b>${g.full}</b> — много предметов: <b>these are</b>.` : `<b>${g.full}</b> — один предмет: <b>this is</b>.`, label: (many ? pl : sg) + (v ? ' this' : ' is') });
        },
      },
      {
        id: 'e_prep', title: 'in, on, under', icon: '📦', grade: 2,
        rule: '<b>in</b> — в, внутри: <i>in the box</i><br><b>on</b> — на: <i>on the table</i><br><b>under</b> — под: <i>under the table</i>',
        bank: [['cat', '🐱', 'in'], ['cat', '🐱', 'on'], ['cat', '🐱', 'under'], ['ball', '⚽', 'in'], ['ball', '⚽', 'under'], ['dog', '🐶', 'on'], ['dog', '🐶', 'under'],
          ['book', '📖', 'on'], ['mouse', '🐭', 'in'], ['mouse', '🐭', 'under'], ['teddy bear', '🧸', 'on'], ['apple', '🍎', 'in']],
        make([w, em, rel]) {
          const place = rel === 'in' ? 'box' : 'table';
          const RU = { in: 'в', on: 'на', under: 'под' };
          const where = { in: 'в коробке', on: 'на столе', under: 'под столом' }[rel];
          return T.choice(`Where is the ${w}?`, ['in', 'on', 'under'].map(x => opt(x)), rel, {
            keepOrder: true, show: prepScene(rel, em) + `<div class="ensent">The ${w} is <span class="gap">___</span> the ${place}.</div>`,
            sayAfter: `The ${w} is ${rel} the ${place}.`, label: `${w} ${rel}`,
            explain: `<b>The ${w} is ${rel} the ${place}.</b> — ${RU[rel]}: ${where}.`,
          });
        },
      },
    ],
  },

  /* ------------------------------------------------ 7 */
  {
    id: 'ew7', name: 'Кафе «Вкусняшка»', emoji: '🍰', c1: '#F8BBD0', c2: '#EC407A',
    boss: { id: 'eb7', name: 'Хомяк Обжора', emoji: '🐹', hp: 12, story: 'Хомяк Обжора съел все слова в меню. Верни их!' },
    lessons: [
      Object.assign({ id: 'e_food', title: 'Еда', icon: '🍕', grade: 2, rule: '<i>🍎 apple, 🍌 banana, 🍞 bread, 🥛 milk, 🎂 cake, 🥚 egg, 🧀 cheese, 🍕 pizza…</i><br><i>I like apples.</i> — Я люблю яблоки.' }, vocabLesson(V.food)),
      Object.assign({ id: 'e_clothes', title: 'Одежда', icon: '👕', grade: 2, rule: '<i>👒 hat, 👕 T-shirt, 👗 dress, 👖 jeans, 👞 shoes, 🧦 socks, 🧥 coat, 🧣 scarf…</i>' }, vocabLesson(V.clothes)),
      Object.assign({ id: 'e_body', title: 'Тело', icon: '👃', grade: 2, rule: '<i>👁️ eye, 👂 ear, 👃 nose, 👄 mouth, ✋ hand, 💪 arm, 🦵 leg, 🦶 foot, 🦷 tooth…</i><br><b>hand</b> — кисть руки, <b>arm</b> — вся рука.' }, vocabLesson(V.body)),
      {
        id: 'e_plural', title: 'Много: -s, -es', icon: '🐑', grade: 3,
        rule: 'Обычно добавляем <b>-s</b>: <i>cat → cats</i>.<br>После <b>s, x, ch, sh</b> — <b>-es</b>: <i>box → boxes</i>.<br><b>y → ies</b>: <i>baby → babies</i>.<br>Особые слова: <i>child → children, mouse → mice, man → men, tooth → teeth, foot → feet, sheep → sheep</i>.',
        bank: [['cat', 'cats', '🐱', ['cates', 'cat']], ['dog', 'dogs', '🐶', ['doges', 'dog']], ['apple', 'apples', '🍎', ['applees', 'appls']], ['box', 'boxes', '📦', ['boxs', 'box']],
          ['fox', 'foxes', '🦊', ['foxs', 'foxies']], ['bus', 'buses', '🚌', ['buss', 'busies']], ['dress', 'dresses', '👗', ['dresss', 'dressies']], ['watch', 'watches', '⌚', ['watchs', 'watchies']],
          ['baby', 'babies', '👶', ['babys', 'babyes']], ['child', 'children', '🧒', ['childs', 'childes']], ['mouse', 'mice', '🐭', ['mouses', 'mices']], ['man', 'men', '👨', ['mans', 'manes']],
          ['tooth', 'teeth', '🦷', ['tooths', 'toothes']], ['foot', 'feet', '🦶', ['foots', 'feets']], ['sheep', 'sheep', '🐑', ['sheeps', 'sheepes']]],
        make([sg, pl, em, wrong]) {
          const why = /es$/.test(pl) && !/ies$/.test(pl) ? 'после s, x, ch, sh добавляем <b>-es</b>.' : /ies$/.test(pl) ? '<b>y</b> меняется на <b>ies</b>.' : pl === sg + 's' ? 'обычно просто добавляем <b>-s</b>.' : 'это особое слово, его нужно запомнить!';
          return T.choice(`Один — <b>${sg}</b>. А если много?`, [pl, ...wrong], pl, { pic: em + em + em, sayAfter: `one ${sg}, two ${pl}`, explain: `<b>${sg} → ${pl}</b>: ${why}`, label: `${sg} → ${pl}` });
        },
      },
    ],
  },

  /* ------------------------------------------------ 8 */
  {
    id: 'ew8', name: 'Туманный Лондон', emoji: '☂️', c1: '#C5CAE9', c2: '#5C6BC0',
    boss: { id: 'eb8', name: 'Динозавр Биг-Бен', emoji: '🦕', hp: 14, story: 'Динозавр Биг-Бен охраняет Лондон и проверяет английский у всех гостей. Покажи, на что ты способен!' },
    lessons: [
      Object.assign({ id: 'e_weather', title: 'Погода и времена года', icon: '⛅', grade: 2, rule: '<i>☀️ sun, 🌧️ rain, ❄️ snow, ☁️ cloud, 🌬️ wind, 🌈 rainbow</i><br><i>⛄ winter, 🌷 spring, 🏖️ summer, 🍂 autumn</i>' }, vocabLesson(V.weather)),
      Object.assign({ id: 'e_actions', title: 'Что я умею делать', icon: '🏃', grade: 2, rule: '<i>🏃 run, 🏊 swim, 🎤 sing, 💃 dance, 📖 read, ✍️ write, 🎨 draw…</i><br><i>I can swim.</i> — Я умею плавать.' }, vocabLesson(V.actions)),
      {
        id: 'e_present', title: 'He likes, she plays', icon: '⏰', grade: 3,
        rule: 'Когда говорим о том, что происходит <b>обычно</b> (Present Simple):<br><i>I like, you like, we like, they like</i><br>но <b>he / she / it</b> + <b>-s</b>: <i>He like<b>s</b>. She play<b>s</b>.</i><br><i>go → goes</i>',
        bank: ['He [likes|like] apples.', 'I [like|likes] cats.', 'She [plays|play] tennis.', 'We [play|plays] football.', 'My mum [drinks|drink] tea.', 'They [go|goes] to school.',
          'Tom [goes|go] to school.', 'The cat [eats|eat] fish.', 'I [read|reads] books.', 'My sister [sings|sing] songs.', 'You [draw|draws] very well.', 'The dog [runs|run] fast.'],
        make(s) {
          return enGap(s, 'Выбери правильную форму', { small: true, explain: g => /s$/.test(g.answer) ? `<b>${g.full}</b> — он, она, оно → глагол с <b>-s</b>.` : `<b>${g.full}</b> — я, ты, мы, они → глагол <b>без -s</b>.` });
        },
      },
      {
        id: 'e_dialog', title: 'Разговор', icon: '💬', grade: 2,
        rule: '<i>What\'s your name? — My name is Kate.</i><br><i>How are you? — I\'m fine, thank you.</i><br><i>How old are you? — I\'m eight.</i><br><i>Can you swim? — Yes, I can.</i>',
        bank: [["What's your name?", 'Как тебя зовут?', 'My name is Kate.', 'Меня зовут Кейт.', ["I'm fine.", "I'm eight."]],
          ['How are you?', 'Как дела?', "I'm fine, thank you.", 'Хорошо, спасибо.', ['My name is Tom.', 'Goodbye!']],
          ['How old are you?', 'Сколько тебе лет?', "I'm eight.", 'Мне восемь.', ["I'm fine.", 'Yes, I am.']],
          ['Goodbye!', 'До свидания!', 'Bye!', 'Пока!', ['Hello!', 'Thank you.']],
          ['Thank you!', 'Спасибо!', "You're welcome.", 'Пожалуйста.', ['Sorry.', 'Hello.']],
          ['Where are you from?', 'Откуда ты?', "I'm from Russia.", 'Я из России.', ["I'm nine.", "It's red."]],
          ['Do you like apples?', 'Ты любишь яблоки?', 'Yes, I do.', 'Да, люблю.', ['Yes, I am.', "No, I can't."]],
          ['Can you swim?', 'Ты умеешь плавать?', 'Yes, I can.', 'Да, умею.', ['Yes, I do.', 'Yes, it is.']],
          ['Have you got a pet?', 'У тебя есть питомец?', 'Yes, I have.', 'Да, есть.', ['Yes, I am.', 'Yes, I can.']],
          ['What colour is it?', 'Какого это цвета?', "It's blue.", 'Синего.', ["It's a dog.", "I'm fine."]],
          ['Is it a cat?', 'Это кошка?', 'Yes, it is.', 'Да.', ['Yes, I do.', 'Yes, I have.']],
          ['Good morning!', 'Доброе утро!', 'Good morning!', 'Доброе утро!', ['Good night!', 'Goodbye!']],
          ['Nice to meet you!', 'Приятно познакомиться!', 'Nice to meet you too!', 'Мне тоже приятно!', ["I'm fine.", 'Bye!']],
          ['Are you a pupil?', 'Ты ученик?', 'Yes, I am.', 'Да.', ['Yes, I do.', 'Yes, I can.']]],
        make([q, qru, a, aru, wrong]) {
          return T.choice('Выбери правильный ответ', [a, ...wrong], a, {
            show: `<div class="qbubble">${q}</div>`, say: q, auto: Speech.enOk(), sayAfter: a, label: q,
            explain: `<i>${q}</i> — ${qru}<br><b>${a}</b> — ${aru}`,
          });
        },
      },
      {
        id: 'e_sentence', title: 'Составь предложение', icon: '🧵', grade: 2,
        rule: 'В английском предложении порядок слов строгий: <b>кто</b> → <b>что делает</b> → <b>что / где</b>.<br><i>I like apples. She has got a dog.</i>',
        bank: [['I', 'like', 'apples.', 'Я люблю яблоки.', '🍎'], ['This', 'is', 'my', 'cat.', 'Это моя кошка.', '🐱'], ['She', 'has', 'got', 'a', 'dog.', 'У неё есть собака.', '🐶'],
          ['I', 'can', 'swim.', 'Я умею плавать.', '🏊'], ['The', 'ball', 'is', 'under', 'the', 'table.', 'Мяч под столом.', '⚽'], ['My', 'name', 'is', 'Tom.', 'Меня зовут Том.', '👦'],
          ['It', 'is', 'a', 'red', 'car.', 'Это красная машина.', '🚗'], ['We', 'are', 'friends.', 'Мы друзья.', '🤝'], ['Can', 'you', 'dance?', 'Ты умеешь танцевать?', '💃'],
          ['I', 'have', 'got', 'a', 'sister.', 'У меня есть сестра.', '👧'], ['My', 'cat', 'is', 'black.', 'Моя кошка чёрная.', '🐱'], ['He', 'likes', 'bananas.', 'Он любит бананы.', '🍌'],
          ['The', 'sun', 'is', 'yellow.', 'Солнце жёлтое.', '☀️']],
        make(arr) {
          const em = arr[arr.length - 1], ru = arr[arr.length - 2], pieces = arr.slice(0, -2), right = pieces.join(' ');
          let sh; do { sh = U.shuffle(pieces); } while (sh.join(' ') === right);
          return { kind: 'order', join: ' ', prompt: 'Составь предложение', pic: em, show: ruWord(ru), pieces: sh, answers: [right], sayAfter: right, explain: `<b>${right}</b> — ${ru}`, label: right };
        },
      },
    ],
  },
];

/* Числа: прочитай / послушай → набери цифрами; цифра → слово */
function numTask(n, lo, hi) {
  const w = numWord(n);
  const v = Math.random();
  if (v < 0.35 && Speech.enOk()) return inTask('Послушай число и набери его цифрами', '<div class="eq">[?]</div>', n, { say: w, auto: true, explain: `<b>${w}</b> — ${n}`, label: `${w} (на слух)` });
  if (v < 0.65) return inTask('Напиши число цифрами', enWord(w) + '<div class="eq">[?]</div>', n, { say: w, explain: `<b>${w}</b> — ${n}`, label: w });
  const pool = new Set([w]);
  if (n === 40) pool.add('fourty');   // частая ошибка — пусть встретится как ловушка
  const near = [n + 1, n - 1, n + 10, n - 10, n % 10 ? n + 10 - 2 * (n % 10) : n - 5, n < 20 && n > 12 ? (n - 10) * 10 : n + 2].filter(x => x >= 0 && x <= 100 && x !== n);
  for (const x of U.shuffle(near)) { if (pool.size >= 4) break; pool.add(numWord(x)); }
  return T.choice('Как это число по-английски?', [...pool].slice(0, 4), w, { show: `<div class="eq">${n}</div>`, sayAfter: w, explain: `${n} — <b>${w}</b>${n === 40 ? '. Внимание: forty пишется без u!' : ''}`, label: `${n} → ${w}` });
}
