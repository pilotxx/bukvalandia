'use strict';

/* Восемь последовательных действий — одна короткая история. */
const QUESTS = [
  {id:'mail',subject:'ru',icon:'📮',title:'Письмо другу',story:'Почини письмо и доставь приглашение.',gift:'souvenir_mail',route:['📍','🌳','🦒','✉️','❓','🌉','🐾','📮'],steps:['Адрес','Тропа','Гость','Приглашение','Вопрос','За рекой','Друг','Доставка']},
  {id:'detective',subject:'ru',icon:'🔎',title:'Словесный сыщик',story:'Найди улики и открой тайник.',gift:'souvenir_detective',route:['🌳','📝','🐾','🗝️','🏠','🔒','👂','✅'],steps:['Следы','Записка','Действие','Ключ','Комната','Замок','Шифр','Тайник']},
  {id:'cafe',subject:'math',icon:'🧁',title:'Кафе питомца',story:'Собери заказы и угости друзей.',gift:'souvenir_cafe',route:['🛒','🧾','🎂','🍪','🧮','🧁','🔢','🎉'],steps:['Заказ','Сдача','Цена','Угощение','Проверка','Чек','Быстрый счёт','Гости']},
  {id:'architect',subject:'math',icon:'🏗️',title:'Строим домик',story:'Спланируй комнату для питомца.',gift:'souvenir_architect',route:['🧱','📏','🟦','🪟','📦','🏠','🔢','🛋️'],steps:['Пол','Лента','Планы','Измерения','Полка','Пристройка','Узор','Комната']},
  {id:'packing',subject:'en',icon:'🎒',title:'Собираем рюкзак',story:'Помоги питомцу отправиться в путь.',gift:'souvenir_packing',route:['🎒','⚽','💬','🖊️','✏️','📏','📖','👋'],steps:['Рюкзак','Мяч','Рассказ','Ручка','Карандаши','Вещи','Записка','В путь']},
  {id:'party',subject:'en',icon:'🎉',title:'Welcome, friends!',story:'Подготовь праздник и встречай гостей.',gift:'souvenir_party',route:['🛒','🏠','💬','🍎','🥕','☕','🎵','🎉'],steps:['Покупки','Встреча','Спасибо','Яблоко','Заказ','Чашки','Угощение','Праздник']},
];

const multiTask = (prompt,options,answers,extra={}) => ({kind:'multi',prompt,options:U.shuffle(options.map((label,i)=>opt(String(i),label))),answer:answers.map(String).sort().join('|'),...extra});
const orderTask = (prompt,pieces,extra={}) => ({kind:'order',prompt,pieces:U.shuffle(pieces),answers:[pieces.join(' ')],...extra});
const questChoice = (prompt,options,answer,extra={}) => T.choice(prompt,options.map(String),String(answer),extra);
const questPaper = text => `<div class="quest-paper">${text}</div>`;
const questObjects = cards => `<div class="quest-visual">${cards.map(([icon,value,label])=>`<div class="quest-price"><span>${icon}</span><b>${U.esc(value)}</b>${label?`<small>${U.esc(label)}</small>`:''}</div>`).join('')}</div>`;
const questMatch = (prompt,pairs,extra={}) => sceneTask('match',prompt,{pairs:pairs.map(([left,right],i)=>({id:String(i),left,right})),...extra});

const QUEST_STAGES = {
  mail: [
    ()=>questChoice('Исправь название улицы',['лесная','Лесная'],'Лесная',{show:questPaper('Улица <span class="mistake-word">лесная</span>'),explain:'Название улицы — <b>Лесная</b>, с большой буквы.',hint:'Название улицы — собственное имя.'}),
    ()=>multiTask('Проверь букву в слове «л_са́»',['лес','леса́','ле́сом','лиса́'],[0,2],{show:questObjects([['🌳','л_са́','много деревьев']]),explain:'<b>Лес, ле́сом</b>: Е под ударением.',hint:'Нужна проверка с ударной Е.'}),
    ()=>questChoice('Как объяснить букву И?',['ЖИ пишем с И','Ж — мягкий звук','Перед Р пишем И'],'ЖИ пишем с И',{show:questObjects([['🦒','жираф','']]),explain:'ЖИ–ШИ пишем с <b>И</b>. Ж остаётся твёрдым.',hint:'Вспомни правило ЖИ–ШИ.'}),
    ()=>orderTask('Собери приглашение',['Приходи','к','нам','в','гости!'],{show:questObjects([['✉️','Для друга','']]),explain:'Приходи к нам в гости!',hint:'Начни с «Приходи».'}),
    ()=>questChoice('Поставь знак вопроса',['.','?','!'],'?',{show:questPaper('Ты придёшь в гости<span class="mistake-word">…</span>'),explain:'В конце вопроса ставим <b>?</b>',hint:'Ты спрашиваешь друга.'}),
    ()=>questChoice('Выбери верную подпись',['За рекой','Зарекой'],'За рекой',{show:questObjects([['🌉','🏠','дом друга']]),explain:'Предлог <b>за</b> пишем отдельно: за широкой рекой.',hint:'Можно вставить слово: за широкой рекой.'}),
    ()=>multiTask('Найди проверки, где ясно слышен Г',['друга́','дру́гом','дружить','друк'],[0,1],{show:questObjects([['🐾','дру_','один друг']]),explain:'Друга́, дру́гом: после Г стоит гласный. Пишем <b>друг</b>.',hint:'Нужны формы слова с ясно слышимым Г.'}),
    ()=>questChoice('Поздоровайся с другом',['Привет, Миша!','До свидания!','Кто это?'],'Привет, Миша!',{show:questObjects([['📮','Письмо доставлено!','']]),explain:'Дружеское письмо начинается с приветствия.',hint:'Мы приглашаем Мишу в гости.'}),
  ],
  detective: [
    ()=>multiTask('Найди родственников слова «лес»',['лесник','лесной','лестница','лесок'],[0,1,3],{show:questObjects([['🔎','ЛЕС','первая улика']]),explain:'Лесник, лесной, лесок связаны с лесом по смыслу.',hint:'Нужны общая часть и общий смысл.'}),
    ()=>questChoice('Исправь записку',['жираф','жыраф'],'жираф',{show:questPaper('Здесь был <span class="mistake-word">жыраф</span> 🦒'),explain:'ЖИ–ШИ пишем с И: <b>жираф</b>.',hint:'Вспомни правило ЖИ–ШИ.'}),
    ()=>questChoice('Найди слово-действие',['прыгает','пушистый','мяч'],'прыгает',{show:questObjects([['🐾','Что делает?','след питомца']]),explain:'Прыгает — глагол, действие.',hint:'Задай вопрос «что делает?».'}),
    ()=>orderTask('Прочитай, где спрятан ключ',['Ключ','лежит','под','столом.'],{show:questObjects([['🗝️','Секретная записка','']]),explain:'Ключ лежит под столом.',hint:'Начни со слова «Ключ».'}),
    ()=>multiTask('Подбери слова к комнате',['уютная','светлая','большой','новая'],[0,1,3],{show:questObjects([['🏠','Комната','она моя']]),explain:'Комната — она: уютная, светлая, новая.',hint:'Проверь сочетание с существительным.'}),
    ()=>questMatch('Подбери значения к словам',[['за́мок','🏰 здание'],['замо́к','🔒 на двери'],['ключ','🗝️ открывает дверь']],{explain:'Ударение меняет значение: за́мок и замо́к.',hint:'Вслух произнеси каждое слово.'}),
    ()=>questChoice('Сколько слогов в шифре?',['2','3','4'],'3',{show:questPaper('КОМНАТА'),explain:'Ком-на-та: три гласных, <b>3 слога</b>.',hint:'Найди гласные О, А, А.'}),
    ()=>questChoice('Открой тайник верной фразой',['Я не знаю.','Я незнаю.'],'Я не знаю.',{show:questObjects([['🔐','Последний шифр','']]),explain:'НЕ с глаголом «знаю» пишется отдельно.',hint:'НЕ с глаголами пишем отдельно.'}),
  ],
  cafe: [
    (a,b)=>sceneTask('cart','Собери заказ на нужную сумму',{target:a*3,maxItems:6,items:[{id:'juice',icon:'🥤',label:'Сок',price:a},{id:'cake',icon:'🧁',label:'Кекс',price:a*2},{id:'apple',icon:'🍎',label:'Яблоко',price:b}],explain:`Нужен заказ ровно на <b>${a*3}</b> монет. Подходят разные покупки.`,hint:`Например, сок и кекс: ${a} + ${a*2}.`}),
    (a,b)=>inTask('Дай гостю сдачу',questObjects([['🪙','50','гость заплатил'],['🧁',String(a*2),'монет'],['🥤',String(b),'монет']]),50-a*2-b,{explain:`50 − (${a*2} + ${b}) = <b>${50-a*2-b}</b>.`,hint:'Из 50 вычти стоимость кекса и сока.'}),
    (a,b)=>inTask('Посчитай стоимость трёх пирогов',questObjects([['🥧',`${b} 🪙`,'за один'],['🛍️','× 3','заказ']]),b*3,{explain:`${b} · 3 = <b>${b*3}</b>.`,hint:'Одна цена повторяется три раза.'}),
    (a,b)=>inTask('Раздели печенье поровну',questObjects([['🍪',String(a*b),'всего'],['🍽️',String(b),'тарелок']]),a,{explain:`${a*b} : ${b} = <b>${a}</b> на каждой тарелке.`,hint:`Найди число, которое при умножении на ${b} даёт ${a*b}.`}),
    ()=>questChoice('Исправь расчёт питомца',['3 · 7 = 21','7 − 3 = 4','7 + 3 = 10'],'3 · 7 = 21',{show:questPaper('🥐 × 3<br>Одна булочка: 7 🪙<br><span class="mistake-word">Всего 10 🪙</span>'),explain:'7 + 7 + 7 = <b>21</b>.',hint:'Повторяется цена каждой булочки.'}),
    (a,b)=>inTask('Восстанови цену кекса',questObjects([['🥤',`${b} 🪙`,'сок'],['🧁','?','кекс'],['🧾',`${a+b} 🪙`,'вместе']]),a,{explain:`${a+b} − ${b} = <b>${a}</b>.`,hint:'Из общей стоимости вычти цену сока.'}),
    (a)=>multiTask(`Найди способы: ${a*10+8} + 7`,[`${a*10+8} + 2 + 5`,`${a*10+8} + 10 − 3`,`${a*10+8} + 3 + 5`,`${a*10} + 8 + 7`],[0,1,3],{explain:'Подходят способы, где в итоге прибавили ровно 7.',hint:'2 + 5 = 7, 10 − 3 = 7.'}),
    (a)=>inTask('Сколько кексов ещё испечь?',questObjects([['🐾',String(a),'друзей'],['🧁','по 2','каждому'],['✅',String(a),'уже готовы']]),a,{explain:`Нужно ${a*2}, готово ${a}. Ещё <b>${a}</b>.`,hint:'Сначала посчитай, сколько кексов нужно всем.'}),
  ],
  architect: [
    ()=>sceneTask('area','Построй прямоугольную комнату',{cols:6,rows:4,target:12,explain:'Подходит любой прямоугольник из <b>12 клеток</b>.',hint:'Попробуй 3 ряда по 4 клетки.'}),
    (a,b)=>inTask('Сколько метров ленты нужно вокруг?',`<div class="quest-visual"><div class="quest-dimension"><b>${a} м ↔</b><span>↕ ${b} м</span></div></div>`,2*(a+b),{explain:`(${a} + ${b}) · 2 = <b>${2*(a+b)}</b> м.`,hint:'Сложи длины всех четырёх сторон.'}),
    ()=>questMatch('Подбери площадь к каждому плану',[['2 × 6','12 клеток'],['3 × 5','15 клеток'],['2 × 4','8 клеток']],{explain:'Площадь прямоугольника — длина, умноженная на ширину.',hint:'Перемножь числа на каждом плане.'}),
    ()=>questChoice('Что посчитал питомец?',['Периметр','Площадь','Высоту'],'Периметр',{show:questPaper('📏 5 + 4 + 5 + 4 = 18'),explain:'Сумма всех сторон — <b>периметр</b>.',hint:'Питомец обошёл края комнаты.'}),
    (a,b)=>inTask('Узнай ширину одной коробки',questObjects([['📦 📦 📦',`${b*3} см`,'три одинаковые коробки'],['📦','? см','одна коробка']]),b,{explain:`${b*3} : 3 = <b>${b}</b> см.`,hint:'Раздели общую ширину на три.'}),
    ()=>questChoice('На сколько вырастет периметр?',['На 2 м','На 1 м','Не изменится'],'На 2 м',{show:questObjects([['🏠','Длина +1 м','ширина прежняя']]),explain:'Две длинные стороны выросли на 1 м: всего <b>+2 м</b>.',hint:'Сколько длинных сторон у прямоугольника?'}),
    (a,b)=>inTask('Продолжи узор строителя',`<div class="quest-paper">${b} → ${b*2} → ${b*3} → ${b*4} → [?]</div>`,b*5,{explain:`Каждый раз +${b}. Далее <b>${b*5}</b>.`,hint:'Сравни два соседних числа.'}),
    ()=>sceneTask('area','Построй комнату по двум условиям',{cols:6,rows:4,target:12,perimeter:14,explain:'Размеры 3 × 4 или 4 × 3: площадь 12, периметр 14.',hint:'Произведение размеров — 12, сумма — 7.'}),
  ],
  packing: [
    ()=>sceneTask('pack','Собери вещи по записке',{items:[{id:'book',icon:'📖',label:'book'},{id:'pencil',icon:'✏️',label:'pencil'},{id:'ball',icon:'⚽',label:'ball'},{id:'cap',icon:'🧢',label:'cap'}],want:['book','pencil'],request:'Take a book and a pencil.',explain:'Book — книга, pencil — карандаш.',hint:'Нужны книга и карандаш.'}),
    ()=>questChoice('Куда положить мяч?',['Под стул','На стул','В коробку'],'Под стул',{show:questPaper('Put the ball <b>under</b> the chair.'),say:'Put the ball under the chair.',explain:'Under the chair — <b>под стул</b>.',hint:'Under означает «под».'}),
    ()=>orderTask('Расскажи: «У меня есть рюкзак»',['I','have','got','a','bag.'],{pic:'🎒',sayAfter:'I have got a bag.',explain:'I have got a bag.',hint:'Начни с I have got…'}),
    ()=>questChoice('Ответь другу',['Yes, I have.','Yes, I am.','Yes, I can.'],'Yes, I have.',{show:questPaper('Have you got a pen?'),say:'Have you got a pen?',sayAfter:'Yes, I have.',explain:'Have you got…? — Yes, I have.',hint:'В вопросе have — и в ответе have.'}),
    ()=>questChoice('Подпиши рисунок',['three pencils','three pencil','a pencils'],'three pencils',{show:questObjects([['✏️ ✏️ ✏️','3','']]),sayAfter:'three pencils',explain:'Несколько карандашей: <b>three pencils</b>.',hint:'Во множественном числе нужно -s.'}),
    ()=>questMatch('Проверь школьные вещи',[['ruler','📏'],['notebook','📓'],['pen','🖊️']],{explain:'Ruler — линейка, notebook — тетрадь, pen — ручка.',hint:'Вспомни английские названия предметов.'}),
    ()=>questChoice('Исправь записку',['a book','an book','an books'],'a book',{show:questPaper('I have got <span class="mistake-word">an book</span>.'),sayAfter:'a book',explain:'Book начинается с согласного звука: <b>a book</b>.',hint:'Перед book нужен a.'}),
    ()=>questChoice('Пожелай другу хорошего дня',['Have a nice day!','Good night!','I am a pencil.'],'Have a nice day!',{pic:'👋',sayAfter:'Have a nice day!',explain:'Have a nice day! — Хорошего дня!',hint:'Day — день.'}),
  ],
  party: [
    ()=>sceneTask('pack','Собери продукты по списку',{bagIcon:'🛒',items:[{id:'apples',icon:'🍎',label:'apples'},{id:'milk',icon:'🥛',label:'milk'},{id:'bread',icon:'🍞',label:'bread'},{id:'cheese',icon:'🧀',label:'cheese'}],want:['apples','milk','bread'],request:'apples + milk + bread',explain:'Apples — яблоки, milk — молоко, bread — хлеб.',hint:'В списке три продукта.'}),
    ()=>orderTask('Пригласи друга в свой дом',['Welcome','to','my','house!'],{pic:'🏠',sayAfter:'Welcome to my house!',explain:'Welcome to my house! — Добро пожаловать в мой дом!',hint:'Начни с Welcome.'}),
    ()=>questChoice('Ответь на благодарность',["You're welcome.",'I am nine.','It is red.'],"You're welcome.",{show:questPaper('Thank you! 💬'),say:'Thank you!',sayAfter:"You're welcome.",explain:"You're welcome. — Пожалуйста.",hint:'Нужен вежливый ответ.'}),
    ()=>questChoice('Подпиши угощение',['an apple','a apple','an apples'],'an apple',{pic:'🍎',sayAfter:'an apple',explain:'Apple начинается с гласного звука: <b>an apple</b>.',hint:'Перед гласным звуком — an.'}),
    ()=>sceneTask('pack','Угости питомца по его просьбе',{bagIcon:'🍽️',items:[{id:'carrots',icon:'🥕',label:'carrots'},{id:'cake',icon:'🍰',label:'cake'},{id:'bananas',icon:'🍌',label:'bananas'}],want:['carrots'],request:'I like carrots.',explain:'Carrots — морковь.',hint:'Питомец просит морковь.'}),
    ()=>multiTask('Найди несколько предметов',['two cakes','three apples','a banana','four cups'],[0,1,3],{explain:'Two, three, four — несколько. A banana — один.',hint:'Посмотри на числа и окончание -s.'}),
    ()=>orderTask('Скажи: «Я люблю яблоки»',['I','like','apples.'],{pic:'🍎',sayAfter:'I like apples.',explain:'I like apples. — Я люблю яблоки.',hint:'Кто? I. Что делает? Like.'}),
    ()=>questChoice('Ответь гостю',['Yes, I do.','Yes, I am.','Yes, it is.'],'Yes, I do.',{show:questPaper('Do you like cake? 🍰'),say:'Do you like cake?',sayAfter:'Yes, I do.',explain:'Do you like…? — Yes, I do.',hint:'В вопросе do — в ответе тоже do.'}),
  ],
};

const Quest = {
  tasks(id) { return Array.from({length:8},(_,i)=>({t:Quest.make(id,i),d:i})); },
  make(id,i) {
    const t=QUEST_STAGES[id][i](mr(3,8),mr(2,5)),q=QUESTS.find(q=>q.id===id);
    t.qid=id;t.idx=i;t.label=t.label||q.title+' · '+(i+1);return t;
  },
  hud() {
    if(!L || L.mode!=='quest')return '';
    const q=QUESTS.find(q=>q.id===L.ref),index=Math.min(7,curTask().t.idx||0);
    return `<div class="quest-hud"><div class="quest-companion">${petSVG({uid:'quest-companion',mood:'happy'})}</div><div class="quest-hud-body"><div class="quest-hud-title"><b>${q.steps[index]}</b><small>${index+1} / 8</small></div><div class="quest-path">${q.route.map((icon,i)=>`<span class="${i<index?'done':i===index?'current':''}" ${i===index?'aria-current="step"':''}>${i<index?'✓':icon}</span>`).join('')}</div></div><span class="quest-hud-goal">${q.icon}</span></div>`;
  },
  capture(persist=true) {
    if(!L || L.mode!=='quest' || L.finished)return;
    const drafts=S.house.questDrafts||(S.house.questDrafts={}),old=drafts[L.ref],pos=L.pos+(L.answered?1:0);
    const queue=old?.pos===pos && Array.isArray(old.queue) && old.queue.length===L.queue.length ? old.queue : JSON.parse(JSON.stringify(L.queue));
    const draft={queue,pos,total:L.total,stepHint:!L.answered&&!!L.hint,sceneState:!L.answered&&old?.pos===pos?old.sceneState:null};
    for(const key of ['first','clean','wrongs','hints','coins','xp','combo','maxCombo','correctAll','fixed'])draft[key]=L[key]||0;
    drafts[L.ref]=draft;if(persist)save();
  },
  restore() {
    if(!L || L.mode!=='quest')return false;
    const draft=S.house.questDrafts?.[L.ref];
    if(!draft || !Array.isArray(draft.queue) || !draft.queue.length || !Number.isInteger(draft.pos) || draft.pos<0 || draft.pos>draft.queue.length)return false;
    if(draft.queue.some(e=>!e.t || e.t.qid!==L.ref))return false;
    L.queue=JSON.parse(JSON.stringify(draft.queue));L.pos=draft.pos;L.total=draft.total||8;
    for(const key of ['first','clean','wrongs','hints','coins','xp','combo','maxCombo','correctAll','fixed'])L[key]=draft[key]||0;
    return true;
  },
  sceneState() {
    if(!L || L.mode!=='quest')return null;
    const draft=S.house.questDrafts?.[L.ref];
    return draft?.pos===L.pos && draft.sceneState ? JSON.parse(JSON.stringify(draft.sceneState)) : null;
  },
  saveScene(state) {
    if(!L || L.mode!=='quest' || L.answered || L.finished)return;
    Quest.capture(false);S.house.questDrafts[L.ref].sceneState=JSON.parse(JSON.stringify(state));save();
  },
  open() {
    const m=modal({cls:'sheet quest-book',html:`<h2>🧭 Куда отправимся?</h2><div class="quest-cards">${QUESTS.map(q=>{const p=S.house.quests[q.id],draft=S.house.questDrafts?.[q.id];return `<button data-quest="${q.id}" class="quest-card"><span>${q.icon}</span><div><small>${SUBJ[q.subject].name}</small><b>${q.title}</b><p>${q.story}</p><small>${draft?`▶ Продолжить · ${Math.min(8,draft.pos)}/8`:p?.done?'✓ Подарок уже дома':`🎁 ${ITEMS[q.gift].name}`}</small></div></button>`;}).join('')}</div>`,buttons:[{label:'В домик',cls:'ghost'}]});
    m.addEventListener('click',e=>{const button=e.target.closest('[data-quest]');if(!button)return;m.close();startSession('quest',button.dataset.quest);});
  },
  finish() {
    if(L.finished)return;
    const stage=petStage(),q=QUESTS.find(q=>q.id===L.ref),old=S.house.quests[q.id]||{best:0,plays:0,done:false};
    if(S.house.questDrafts)delete S.house.questDrafts[q.id];
    commonFinish();
    const success=L.first>=Math.ceil(L.total*.6),first=success&&!old.done;
    S.house.quests[q.id]={best:Math.max(old.best,L.first),plays:old.plays+1,done:old.done||success};
    markPlayed('quest:'+q.id);S.counters.lessons++;
    const got=earnCoins(L.coins+(first?50:0));addXP(L.xp+(first?40:0));
    if(first){S.owned[q.gift]=true;House.remember('quest_'+q.id,q.title,q.icon);}
    afterFinish(stage);
    showResult(`<div class="result"><div class="m-icon">${q.icon}</div><h2>${success?'Получилось!':'Потренируемся ещё?'}</h2><p>${L.first} / ${L.total} · ${success?'История пройдена':'Питомец поможет разобраться'}</p>${first?`<div class="prize-card">${ITEMS[q.gift].icon} <b>${ITEMS[q.gift].name}</b> — теперь дома!</div>`:''}<div class="res-coins">+${got} <i class="ci"></i></div><div class="res-btns"><button class="btn" data-act="questAgain" data-arg="${q.id}">Ещё раз</button><button class="btn primary" data-act="questHome">В домик</button></div></div>`);
  },
  multiHTML(t) {
    const count=t.answer.split('|').length;
    return `<div class="multi-progress">Выбери ${count} ${Array.from({length:count},()=>'<i></i>').join('')}</div><div class="multi-options">${t.options.map(option=>`<button class="multi-option" data-multi="${U.esc(option.v)}" aria-pressed="false">${U.esc(option.label)}</button>`).join('')}</div><button class="btn primary" id="multiCheck" disabled>Проверить</button>`;
  },
  multiBind(t,body) {
    const selected=new Set(),check=body.querySelector('#multiCheck'),needed=t.answer.split('|').length;
    body.querySelectorAll('[data-multi]').forEach(button=>button.addEventListener('click',()=>{
      if(L.answered)return;const value=button.dataset.multi;
      if(selected.has(value))selected.delete(value);else selected.add(value);
      button.setAttribute('aria-pressed',String(selected.has(value)));check.disabled=selected.size!==needed;
      body.querySelectorAll('.multi-progress i').forEach((dot,i)=>dot.classList.toggle('on',i<selected.size));
    }));
    check.addEventListener('click',()=>{
      if(L.answered)return;answer([...selected].sort().join('|'));const correct=new Set(t.answer.split('|'));
      body.querySelectorAll('[data-multi]').forEach(button=>{button.disabled=true;button.classList.toggle('right',correct.has(button.dataset.multi));button.classList.toggle('wrong',selected.has(button.dataset.multi)&&!correct.has(button.dataset.multi));});check.disabled=true;
    });
  },
};
