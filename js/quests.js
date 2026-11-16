'use strict';
/* Новые истории и задания. Индекс задания устойчив, параметры сохраняются при ошибке. */
const QUESTS = [
  {id:'mail',subject:'ru',icon:'📮',title:'Письмо из Букваландии',story:'Питомец пригласил друзей в гости. Помоги починить письмо и доставить его по адресу.',gift:'souvenir_mail'},
  {id:'detective',subject:'ru',icon:'🔎',title:'Дело о пропавших словах',story:'В комнате перепутались подписи. Проверь улики и верни словам их места.',gift:'souvenir_detective'},
  {id:'cafe',subject:'math',icon:'🧁',title:'Кафе для друзей',story:'Сегодня питомец открывает кафе. Проверь заказы, сдачу и расчёты.',gift:'souvenir_cafe'},
  {id:'architect',subject:'math',icon:'🏗️',title:'Архитектор домика',story:'Для новой комнаты нужен точный план. Исследуй размеры и найди разные решения.',gift:'souvenir_architect'},
  {id:'packing',subject:'en',icon:'🎒',title:'Рюкзак путешественника',story:'Друзья прислали список по-английски. Собери вещи и помоги питомцу ответить.',gift:'souvenir_packing'},
  {id:'party',subject:'en',icon:'🎉',title:'Welcome to the party!',story:'К нам идут гости! Подготовь угощение и разберись с английскими приглашениями.',gift:'souvenir_party'},
];
const multiTask = (prompt,options,answers,extra={}) => ({kind:'multi',prompt,options:U.shuffle(options.map((label,i)=>opt(String(i),label))),answer:answers.map(String).sort().join('|'),...extra});
const orderTask = (prompt,pieces,extra={}) => ({kind:'order',prompt,pieces:U.shuffle(pieces),answers:[pieces.join(' ')],...extra});
const questChoice = (prompt,options,answer,extra={}) => T.choice(prompt,options.map(String),String(answer),extra);
const Quest = {
  tasks(id) {return U.shuffle(Array.from({length:8},(_,i)=>({t:Quest.make(id,i),d:i})));},
  make(id,i) {
    const a=mr(3,8),b=mr(2,5),c=mr(1,3);let t;
    if(id==='mail') t=[
      ()=>questChoice('Питомец написал: «Наша улица называется лесная». Что нужно исправить?',['лесная → Лесная','улице → Улице','Мы → мы'],'лесная → Лесная',{explain:'Название улицы пишется с большой буквы: на улице <b>Лесной</b>.',hint:'Найди собственное имя — название улицы.'}),
      ()=>multiTask('Выбери <b>все</b> слова, которые помогут проверить букву Е в слове «л_са» — участки леса.',['лес','леса́','ле́сом','лиса́'],[0,2],{explain:'Проверяем: <b>лес, ле́сом</b>. Безударная буква в слове «леса́» — Е. «Лиса́» — другое слово.',hint:'В хорошем проверочном слове нужная гласная должна быть под ударением.'}),
      ()=>questChoice('В письме два варианта: «жыраф» и «жираф». Выбери объяснение правильного написания.',['ЖИ пишется с И','Нужно услышать мягкий Ж','Перед Р всегда пишется И'],'ЖИ пишется с И',{explain:'ЖИ–ШИ пишем с <b>И</b>, хотя Ж и Ш — твёрдые согласные.',hint:'Вспомни правило ЖИ–ШИ.'}),
      ()=>orderTask('Собери приглашение из слов',['Приходи','к','нам','в','гости!'],{explain:'Приходи к нам в гости! Предлог <b>к</b> пишется отдельно.',hint:'Начни с просьбы «Приходи».'}),
      ()=>questChoice('Питомец хочет спросить, придёт ли друг. Как закончить предложение «Ты придёшь в гости…»?',['.','?','!'],'?',{explain:'Это вопрос. В конце нужен <b>вопросительный знак</b>.',hint:'Прочитай фразу с вопросительной интонацией.'}),
      ()=>questChoice('Друг живёт за рекой. Как написать адрес без ошибки?',['За рекой стоит дом.','Зарекой стоит дом.','За рекойстоит дом.'],'За рекой стоит дом.',{explain:'<b>За</b> — предлог: за широкой рекой. Пишем отдельно.',hint:'Попробуй вставить слово «широкой».'}),
      ()=>multiTask('Выбери <b>все</b> подходящие проверки для слова «дру_» (один друг).',['друзья́','друга́','другом','друк'],[0,1,2],{explain:'Друзья́, друга́, другом — родственные слова: слышим звонкий согласный. Пишем <b>друг</b>.',hint:'Измени слово или найди родственное: согласный должен быть слышен ясно.'}),
      ()=>questChoice('Какое обращение подойдёт для начала дружеского письма?',['Привет, Миша!','Конец.','Кому: неизвестно.'],'Привет, Миша!',{explain:'Письмо начинается с приветствия и обращения к другу.',hint:'Как ты поздоровался бы с другом?'}),
    ][i]();
    if(id==='detective') t=[
      ()=>multiTask('Сыщик ищет родственников слова «лес». Выбери <b>все</b> родственные слова.',['лесник','лесной','лестница','лесок'],[0,1,3],{explain:'Лесник, лесной, лесок связаны с лесом по смыслу. Лестница — другое слово.',hint:'Похожих букв мало: нужен общий смысл.'}),
      ()=>questChoice('В какой подписи ошибка?',['На столе лежит книга.','В саду растёт жыраф.','У двери стоит мяч.'],'В саду растёт жыраф.',{explain:'Правильное написание — <b>жираф</b>. По смыслу жираф ещё и не растёт, как растение!',hint:'Проверь правило ЖИ–ШИ и смысл фразы.'}),
      ()=>questChoice('Какое слово называет действие питомца?',['прыгает','пушистый','мяч'],'прыгает',{explain:'Прыгает — глагол: отвечает на вопрос <b>что делает?</b>.',hint:'Задай вопрос «что делает?».'}),
      ()=>orderTask('Восстанови улику — предложение',['Питомец','нашёл','под','столом','ключ.'],{explain:'Питомец нашёл под столом ключ. В предложении есть тот, кто действует, и его действие.',hint:'Кто нашёл? Что сделал? Где? Что?'}),
      ()=>multiTask('Какие слова подходят к слову «комната»? Выбери <b>все</b>.',['уютная','светлая','большой','новая'],[0,1,3],{explain:'Комната — она: <b>уютная, светлая, новая</b>. «Большой» подходит к словам мужского рода.',hint:'Подставь «она моя». Как изменится прилагательное?'}),
      ()=>questChoice('В какой паре ударение меняет значение слова?',['за́мок — замо́к','дом — домик','кот — коты'],'за́мок — замо́к',{explain:'За́мок — здание, замо́к — устройство для запирания.',hint:'Ищи одинаково написанные слова с разным ударением.'}),
      ()=>questChoice('Сколько слогов в слове «комната»?',['2','3','4'],'3',{explain:'Ком-на-та: <b>3 слога</b>, три гласных звука.',hint:'Произнеси слово и найди гласные О, А, А.'}),
      ()=>questChoice('Питомец написал «Я незнаю». Как исправить?',['Я не знаю.','Я нез наю.','Я незнаю.'],'Я не знаю.',{explain:'НЕ с глаголом <b>знаю</b> пишется отдельно.',hint:'Знаю — глагол. Вспомни правило с НЕ.'}),
    ][i]();
    if(id==='cafe') t=[
      ()=>multiTask(`У друга ${a*3} монет. Выбери <b>все</b> заказы ровно на эту сумму.`,[`Сок ${a} + пирог ${a*2}`,`Чай ${a-1} + торт ${a*2+1}`,`Сок ${a} + торт ${a*2+1}`,`Три булочки по ${a}`],[0,1,3],{explain:`В каждом подходящем заказе сумма равна <b>${a*3}</b>.`,hint:'Сложи цены каждого заказа отдельно.'}),
      ()=>inTask('Сколько сдачи получит гость?',`<div class="quest-scene">🪙 → 🧁 🥤</div><div class="story">Гость дал 50 монет. Кекс стоит ${a*2}, сок — ${b} монет.</div>`,50-a*2-b,{explain:`50 − (${a*2} + ${b}) = <b>${50-a*2-b}</b>.`,hint:'Сначала найди стоимость всего заказа, затем вычти её из 50.'}),
      ()=>questChoice('Для заказа нужно узнать общую стоимость пирогов. Каких данных не хватает?',['Сколько пирогов и цена одного','Какого цвета тарелка','Как зовут гостя'],'Сколько пирогов и цена одного',{explain:'Нужны <b>количество</b> пирогов и <b>цена одного</b>.',hint:'Подумай, какие числа нужно перемножить.'}),
      ()=>inTask('Разложи угощение поровну',`<div class="quest-scene">🍪 🍪 🍪 → 🍽️</div><div class="story">${a*b} печений разложили поровну на ${b} тарелок. Сколько печений на каждой?</div>`,a,{explain:`${a*b} : ${b} = <b>${a}</b>. Проверка: ${a} · ${b} = ${a*b}.`,hint:`Найди число, которое при умножении на ${b} даёт ${a*b}.`}),
      ()=>questChoice('Как исправить расчёт питомца: «3 булочки по 7 монет стоят 10 монет»?',['Нужно 3 · 7 = 21','Нужно 7 − 3 = 4','Нужно 7 + 3 = 10'],'Нужно 3 · 7 = 21',{explain:'Одинаковая цена повторяется трижды: 7 + 7 + 7 = <b>21</b>.',hint:'Цена каждой из трёх булочек — 7 монет.'}),
      ()=>inTask('Восстанови цену в чеке',`<div class="story">Сок стоит ${b} монет. Сок и кекс вместе стоят ${a+b}. Сколько стоит кекс?</div>`,a,{explain:`${a+b} − ${b} = <b>${a}</b>.`,hint:'Из общей стоимости вычти цену сока.'}),
      ()=>multiTask(`Как можно вычислить ${a*10+8} + 7? Выбери <b>все</b> верные способы.`,[`${a*10+8} + 2 + 5`,`${a*10+8} + 10 − 3`,`${a*10+8} + 3 + 5`,`${a*10} + 8 + 7`],[0,1,3],{explain:'Можно дополнить до десятка, прибавить 10 и вычесть 3 или сложить по частям.',hint:'В каждой записи нужно в итоге прибавить ровно 7.'}),
      ()=>inTask('Хватит ли угощения всем?',`<div class="story">Пришли ${a} друзей. Каждому нужно по 2 кекса. Уже готовы ${a} кексов. Сколько ещё нужно испечь?</div>`,a,{explain:`Нужно ${a} · 2 = ${a*2}. Осталось испечь ${a*2} − ${a} = <b>${a}</b>.`,hint:'Сначала посчитай, сколько нужно всего.'}),
    ][i]();
    if(id==='architect') t=[
      ()=>inTask('Сколько плиток нужно для пола?',`<div class="quest-scene">🟦 🟦 🟦</div><div class="story">На плане ${b} ряда по ${a} плиток. Найди количество плиток.</div>`,a*b,{explain:`${a} · ${b} = <b>${a*b}</b> плиток.`,hint:'Количество плиток в ряду умножь на количество рядов.'}),
      ()=>inTask('Сколько метров ленты нужно на все стороны коврика?',`<div class="story">Коврик прямоугольный: длина ${a} м, ширина ${b} м. Найди периметр.</div>`,2*(a+b),{explain:`${a} + ${b} + ${a} + ${b} = <b>${2*(a+b)}</b> м.`,hint:'У прямоугольника две длинные и две короткие стороны.'}),
      ()=>multiTask('Выбери <b>все</b> прямоугольники площадью 12 клеток.',['3 ряда по 4','2 ряда по 6','2 ряда по 5','1 ряд из 12'],[0,1,3],{explain:'3 · 4 = 12, 2 · 6 = 12, 1 · 12 = 12. А 2 · 5 = 10.',hint:'Площадь — это количество клеток. Перемножь размеры.'}),
      ()=>questChoice('Питомец считает площадь комнаты: «5 + 4 + 5 + 4 = 18». Что он нашёл?',['Периметр','Площадь','Высоту'],'Периметр',{explain:'Сумма длин сторон — <b>периметр</b>. Площадь этого прямоугольника: 5 · 4 = 20.',hint:'Он обошёл края комнаты или посчитал клетки внутри?'}),
      ()=>inTask('Найди ширину полки',`<div class="story">Три одинаковые коробки занимают ${b*3} см. Какова ширина одной коробки в сантиметрах?</div>`,b,{explain:`${b*3} : 3 = <b>${b}</b> см.`,hint:'Вся длина разделена на три равные части.'}),
      ()=>questChoice('Комнату сделали длиннее на 1 метр, ширину не меняли. Как изменится периметр?',['Увеличится на 2 м','Увеличится на 1 м','Не изменится'],'Увеличится на 2 м',{explain:'У прямоугольника <b>две</b> длинные стороны. Каждая выросла на 1 м: всего +2 м.',hint:'Нарисуй прямоугольник. Сколько сторон изменилось?'}),
      ()=>inTask('Продолжи узор строителя',`<div class="eq">${b}, ${b*2}, ${b*3}, ${b*4}, [?]</div>`,b*5,{explain:`Каждый раз прибавляем ${b}. Следующее число — <b>${b*5}</b>.`,hint:`Найди разность соседних чисел: ${b*2} − ${b}.`}),
      ()=>multiTask('Какие измерения пригодятся, чтобы подобрать ковёр на пол? Выбери <b>все</b>.',['Длина свободного места','Ширина свободного места','Имя питомца','Длина и ширина ковра'],[0,1,3],{explain:'Сравниваем длину и ширину ковра с доступным местом на полу.',hint:'Ковёр должен помещаться в комнате по двум направлениям.'}),
    ][i]();
    if(id==='packing') t=[
      ()=>multiTask('Питомец просит: <b>Take a book and a pencil.</b> Выбери всё, что нужно.',['📖 book','✏️ pencil','⚽ ball','🧢 cap'],[0,1],{say:'Take a book and a pencil.',explain:'Возьми <b>книгу и карандаш</b>.',hint:'Book — книга, pencil — карандаш.'}),
      ()=>questChoice('Прочитай просьбу: <b>Put the ball under the chair.</b> Где должен быть мяч?',['Под стулом','На стуле','В коробке'],'Под стулом',{say:'Put the ball under the chair.',explain:'Under the chair — <b>под стулом</b>.',hint:'Under означает «под».'}),
      ()=>orderTask('Скажи питомцу: «У меня есть рюкзак»',['I','have','got','a','bag.'],{sayAfter:'I have got a bag.',explain:'I have got a bag. — У меня есть рюкзак / сумка.',hint:'Начни с I have got…'}),
      ()=>questChoice('Друг спрашивает: <b>Have you got a pen?</b> Как ответить «Да»?',['Yes, I have.','Yes, I am.','Yes, I can.'],'Yes, I have.',{say:'Have you got a pen?',sayAfter:'Yes, I have.',explain:'Have you got…? — Yes, I have.',hint:'В вопросе есть have. Используй его и в коротком ответе.'}),
      ()=>questChoice('На картинке три карандаша: ✏️ ✏️ ✏️. Выбери подпись.',['three pencils','three pencil','a pencils'],'three pencils',{sayAfter:'three pencils',explain:'Три — это несколько: <b>three pencils</b>, добавляем -s.',hint:'У существительного во множественном числе обычно есть -s.'}),
      ()=>multiTask('Что можно положить в школьный рюкзак? Выбери <b>все школьные принадлежности</b>.',['ruler 📏','notebook 📓','elephant 🐘','pen 🖊️'],[0,1,3],{explain:'Ruler — линейка, notebook — тетрадь, pen — ручка.',hint:'Ищи вещи для занятий в школе.'}),
      ()=>questChoice('Питомец написал <b>an book</b>. Как исправить?',['a book','an books','book a'],'a book',{sayAfter:'a book',explain:'Book начинается с согласного звука [b]: <b>a book</b>.',hint:'Слушай первый звук слова book.'}),
      ()=>questChoice('Как пожелать другу хорошего дня перед дорогой?',['Have a nice day!','I am a pencil.','It is under.'],'Have a nice day!',{sayAfter:'Have a nice day!',explain:'Have a nice day! — Хорошего дня!',hint:'Ищи пожелание с day — день.'}),
    ][i]();
    if(id==='party') t=[
      ()=>multiTask('Список покупок: <b>apples, milk and bread</b>. Выбери всё из списка.',['🍎 apples','🥛 milk','🍞 bread','🧀 cheese'],[0,1,2],{say:'apples, milk and bread',explain:'Apples — яблоки, milk — молоко, bread — хлеб.',hint:'В списке три продукта.'}),
      ()=>orderTask('Пригласи друга: «Добро пожаловать в мой дом!»',['Welcome','to','my','house!'],{sayAfter:'Welcome to my house!',explain:'Welcome to my house! — Добро пожаловать в мой дом!',hint:'Начни с Welcome — добро пожаловать.'}),
      ()=>questChoice('Гость говорит: <b>Thank you!</b> Что ответить?',["You're welcome.",'I am nine.','It is red.'],"You're welcome.",{say:'Thank you!',sayAfter:"You're welcome.",explain:"You're welcome. — Пожалуйста (ответ на благодарность).",hint:'Выбери вежливый ответ на благодарность.'}),
      ()=>questChoice('На столе одно яблоко 🍎. Какая подпись верная?',['an apple','a apple','an apples'],'an apple',{sayAfter:'an apple',explain:'Apple начинается с гласного звука: <b>an apple</b>.',hint:'Перед гласным звуком нужен an.'}),
      ()=>questChoice('Питомец говорит: <b>I like carrots.</b> Что ему предложить?',['🥕','🍫','🍌'],'🥕',{say:'I like carrots.',explain:'Carrots — морковь. I like carrots. — Мне нравится морковь.',hint:'Carrot — оранжевый овощ.'}),
      ()=>multiTask('Выбери <b>все</b> подписи, в которых речь о нескольких предметах.',['two cakes','three apples','a banana','four cups'],[0,1,3],{explain:'Two, three, four — несколько предметов. A banana — один банан.',hint:'Проверь число и окончание -s.'}),
      ()=>orderTask('Скажи: «Я люблю яблоки»',['I','like','apples.'],{sayAfter:'I like apples.',explain:'I like apples. — Я люблю яблоки.',hint:'Кто? I. Что делает? Like. Что? Apples.'}),
      ()=>questChoice('Друг спрашивает: <b>Do you like cake?</b> Как ответить «Да»?',['Yes, I do.','Yes, I am.','Yes, it is.'],'Yes, I do.',{say:'Do you like cake?',sayAfter:'Yes, I do.',explain:'Do you like…? — Yes, I do.',hint:'В вопросе do — в ответе тоже do.'}),
    ][i]();
    t.qid=id;t.idx=i;t.label=t.label||QUESTS.find(q=>q.id===id).title+' · '+(i+1);return t;
  },
  open() {
    const m=modal({cls:'sheet quest-book',html:`<h2>🧭 Приключения с питомцем</h2><p>Выбери историю. В каждой — 8 заданий и свой подарок для дома. Можно пользоваться подсказками.</p><div class="quest-cards">${QUESTS.map(q=>{const p=S.house.quests[q.id];return `<button data-quest="${q.id}" class="quest-card"><span>${q.icon}</span><div><small>${SUBJ[q.subject].name}</small><b>${q.title}</b><p>${q.story}</p><small>${p?.done?'✓ Подарок уже в доме':`🎁 ${ITEMS[q.gift].name}`}${p?` · лучший результат ${p.best}/8`:''}</small></div></button>`;}).join('')}</div>`,buttons:[{label:'В домик',cls:'ghost'}]});
    m.addEventListener('click',e=>{const b=e.target.closest('[data-quest]');if(!b)return;m.close();startSession('quest',b.dataset.quest);});
  },
  finish() {
    if(L.finished)return;
    const stage=petStage(),q=QUESTS.find(q=>q.id===L.ref),old=S.house.quests[q.id]||{best:0,plays:0,done:false};
    commonFinish();
    const success=L.first>=Math.ceil(L.total*.6),first=success&&!old.done;
    S.house.quests[q.id]={best:Math.max(old.best,L.first),plays:old.plays+1,done:old.done||success};
    markPlayed('quest:'+q.id);S.counters.lessons++;
    const got=earnCoins(L.coins+(first?50:0));addXP(L.xp+(first?40:0));
    if(first){S.owned[q.gift]=true;House.remember('quest_'+q.id,q.title,q.icon);}
    afterFinish(stage);
    showResult(`<div class="result"><div class="m-icon">${q.icon}</div><h2>${success?'Приключение завершено!':'Продолжим исследование!'}</h2><p>Самостоятельно или с подсказкой: <b>${L.first} из ${L.total}</b>.</p><p>${success?'Вы с питомцем — отличная команда!':'Попробуй ещё раз. Подсказки помогут разобраться.'}</p>${first?`<div class="prize-card">🎁 В доме появился подарок: <b>${ITEMS[q.gift].name}</b>!</div>`:''}<div class="res-coins">+${got} <i class="ci"></i></div><div class="res-btns"><button class="btn" data-act="questAgain" data-arg="${q.id}">Ещё раз</button><button class="btn primary" data-act="questHome">В домик</button></div></div>`);
  },
  multiHTML(t) {return `<p class="multi-note">Выбери все подходящие ответы, затем нажми «Проверить».</p><div class="multi-options">${t.options.map(o=>`<button class="multi-option" data-multi="${U.esc(o.v)}" aria-pressed="false">${U.esc(o.label)}</button>`).join('')}</div><button class="btn primary" id="multiCheck" disabled>Проверить</button>`;},
  multiBind(t,body) {
    const selected=new Set(),check=body.querySelector('#multiCheck');
    body.querySelectorAll('[data-multi]').forEach(b=>b.addEventListener('click',()=>{if(L.answered)return;const v=b.dataset.multi;if(selected.has(v))selected.delete(v);else selected.add(v);b.setAttribute('aria-pressed',String(selected.has(v)));check.disabled=!selected.size;}));
    check.addEventListener('click',()=>{if(L.answered)return;answer([...selected].sort().join('|'));const correct=new Set(t.answer.split('|'));body.querySelectorAll('[data-multi]').forEach(b=>{b.disabled=true;b.classList.toggle('right',correct.has(b.dataset.multi));b.classList.toggle('wrong',selected.has(b.dataset.multi)&&!correct.has(b.dataset.multi));});check.disabled=true;});
  },
};
