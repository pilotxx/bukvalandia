'use strict';
/* Три фазы боя, загадки по теме мира и управляемые способности питомца. */
const Battle = {
  phases: ['🧭 Разведка', '🧩 Ловушки босса', '✨ Решающая загадка'],
  phase: () => L.hp / L.hpMax > .67 ? 0 : L.hp / L.hpMax > .34 ? 1 : 2,
  intro(w) {
    const next=[...HOUSE_ROOMS.slice(1),...HOUSE_STATIONS,...HOUSE_UPGRADES].filter(x=>x.at>House.count()).sort((a,b)=>a.at-b.at)[0];
    return `<div class="battle-intro battle-guide"><span>🎯 Ответь</span><i>→</i><span>🧩 Обойди ловушку</span><i>→</i><span>🔐 Соедини пары</span></div>${next?`<p class="small">🏠 ${next.icon} ${next.name}: ещё ${next.at-House.count()} 🏆</p>`:''}`;
  },
  footer() {
    return `<div class="battle-controls"><span class="battle-energy">⚡ ${L.energy}/3</span><button class="btn" data-act="battlePower" data-arg="guard" ${L.energy<2||L.guard?'disabled':''}>🛡️ ${L.guard?'Щит готов':'Щит · 2⚡'}</button><button class="btn" data-act="battlePower" data-arg="hint" ${L.energy<2||L.hint?'disabled':''}>💡 Совет · 2⚡</button><button class="btn" data-act="battlePower" data-arg="strike" ${L.energy<3||L.chargedStrike||curTask().t.battleFinal?'disabled':''}>💥 ${L.chargedStrike?'Удар заряжен':'Усилить · 3⚡'}</button></div>`;
  },
  update() {
    if(!L||L.mode!=='boss'||L.finished)return;
    const foot=$('#lFoot');if(!foot)return;
    const order=curTask().t.kind==='order'?'<button class="btn primary" data-act="ordCheck" id="ordCheck" disabled>Проверить</button>':'';
    foot.innerHTML=order+Battle.footer();
    if(curTask().t.kind==='order')renderOrder();
  },
  power(id) {
    if(!L||L.mode!=='boss'||L.answered||L.finished)return;
    const cost=id==='strike'?3:2;if(L.energy<cost)return;
    if(id==='guard'){if(L.guard)return;L.guard=true;Boss.petSay('Я прикрою тебя! Следующая ошибка не отнимет сердечко.');}
    else if(id==='strike'){if(L.chargedStrike)return;L.chargedStrike=true;Boss.petSay('Следующий верный ответ даст усиленный удар!');}
    else if(id==='hint'){if(L.hint)return;useHint();}
    else return;
    L.energy-=cost;Sound.play('pet');Battle.update();
  },
  hintUsed() { Boss.clearFx(); },
  afterAnswer() {
    $$('#lFoot [data-act="battlePower"]').forEach(b=>{b.disabled=true;});
    const meter=$('#lFoot .battle-energy');if(meter)meter.textContent=`⚡ ${L.energy}/3`;
  },
  challenge(w) {
    const a=mr(3,8),b=mr(2,5),c=mr(1,4),n=w.wi;
    let t;
    if(w.subject.id==='math')t=[
      ()=>multiTask(`Енот спрятал число <b>${a*10+b}</b>. Выбери все верные подсказки.`,[`${a} десятков и ${b} единиц`,`${a*10} + ${b}`,`${b} десятков и ${a+1} единиц`,`${a*10+b-1} + 1`],[0,1,3],{hint:'Разложи число на десятки и единицы.',explain:`${a*10+b} = ${a*10} + ${b}. На один меньше — ${a*10+b-1}.`}),
      ()=>multiTask(`Крокодил запутал переход через десяток. Выбери все способы найти <b>8 + ${b+3}</b>.`,[`8 + 2 + ${b+1}`,`10 + ${b+1}`,`8 + 3 + ${b+1}`,`${8+b+3}`],[0,1,3],{hint:`До 10 не хватает 2. Разложи ${b+3} на 2 и ${b+1}.`,explain:`8 + ${b+3} = 10 + ${b+1} = <b>${b+11}</b>.`}),
      ()=>multiTask(`Какие записи дают <b>${a*10+8} + 7</b>? Выбери все верные.`,[`${a*10+8} + 2 + 5`,`${a*10+8} + 10 − 3`,`${a*10+8} + 3 + 5`,`${a*10+15}`],[0,1,3],{hint:'В каждом способе в итоге нужно прибавить 7.',explain:`2 + 5 = 7, 10 − 3 = 7. Ответ: <b>${a*10+15}</b>.`}),
      ()=>multiTask(`У кальмара ${b} ${U.plural(b,'корзина','корзины','корзин')}, в каждой по ${a} ракушек. Выбери все верные записи.`,[`${Array(b).fill(a).join(' + ')}`,`${a} · ${b}`,`${a} + ${b}`,`${a*b}`],[0,1,3],{hint:'Повторяется одно и то же количество ракушек.',explain:`По ${a} взяли ${b} раза: <b>${a*b}</b>.`}),
      ()=>multiTask(`Открой замок числа <b>${a*b}</b>: выбери все верные равенства.`,[`${a} · ${b} = ${a*b}`,`${a*b} : ${a} = ${b}`,`${a*b} : ${b} = ${a}`,`${a*b} : ${a} = ${b+1}`],[0,1,2],{hint:'Умножение и деление — обратные действия.',explain:`${a} · ${b} = ${a*b}; ${a*b} : ${a} = ${b}; ${a*b} : ${b} = ${a}.`}),
      ()=>multiTask('Сова перепутала меры. Выбери все верные записи.',['1 час = 60 минут','2 дм = 20 см','1 кг = 100 г','3 м = 300 см'],[0,1,3],{hint:'1 дм = 10 см, 1 м = 100 см, 1 кг = 1000 г.',explain:'Один час — 60 минут; 2 дм — 20 см; 3 м — 300 см. В килограмме 1000 граммов.'}),
      ()=>multiTask(`Прямоугольник ${a} на ${b} клетки. Выбери все верные утверждения.`,[`Площадь ${a*b}`,`Периметр ${2*(a+b)}`,`Площадь ${a+b}`,`Две стороны длиной ${a}`],[0,1,3],{hint:'Площадь — клетки внутри, периметр — сумма всех сторон.',explain:`Площадь ${a} · ${b} = ${a*b}. Периметр (${a} + ${b}) · 2 = ${2*(a+b)}.`}),
      ()=>multiTask(`Призрак спрятал условие: «Было ${a*b} яблок, ${c} съели». Выбери все подходящие вопросы.`,['Сколько яблок осталось?','На сколько яблок стало меньше?','Какого цвета были яблоки?','Сколько груш было в корзине?'],[0,1],{hint:'На какие вопросы хватает данных в условии?',explain:`Осталось ${a*b-c} яблок, стало меньше на ${c}. Про цвет и груши данных нет.`}),
      ()=>multiTask(`Тысячник охраняет число <b>${a*100+b*10+c}</b>. Найди все равные ему записи.`,[`${a} сотен, ${b} десятков, ${c} единиц`,`${a*100} + ${b*10} + ${c}`,`${a*100+b*10+c-10} + 10`,`${a*100+b*10+c+10}`],[0,1,2],{hint:'Сотни, десятки и единицы складываются.',explain:`${a*100+b*10+c} = ${a*100} + ${b*10} + ${c}.`}),
    ][n]();
    if(w.subject.id==='ru')t=[
      ()=>multiTask('Глушитель спрятал гласные. Верни все буквы, обозначающие гласные звуки.',['А','И','Б','Ю'],[0,1,3],{hint:'Гласные можно петь.',explain:'А, И, Ю — гласные буквы. Б — согласная.'}),
      ()=>multiTask('Слогоед пропустит только слова из двух слогов. Выбери все подходящие.',['кошка','река','кот','машина'],[0,1],{hint:'Сколько гласных звуков, столько и слогов.',explain:'Кош-ка и ре-ка — два слога. Кот — один, ма-ши-на — три.'}),
      ()=>multiTask('Змей перепутал написания. Верни все правильно написанные слова.',['жираф','шишка','чюдо','щука'],[0,1,3],{hint:'ЖИ–ШИ с И, ЧУ–ЩУ с У.',explain:'Правильно: жираф, шишка, чудо, щука.'}),
      ()=>multiTask('Туман скрывает букву Е в слове «л_сной». Выбери все проверочные слова.',['лес','ле́сом','лиса́','лесни́к'],[0,1],{hint:'Нужная гласная должна быть под ударением. В слове «лесни́к» ударение на И.',explain:'Лес, ле́сом: под ударением Е. Пишем «лесной». Слово «лесни́к» нужную гласную не проверяет.'}),
      ()=>multiTask('Каменный Молчун спрятал согласные. Найди все верные проверки.',['гриб — грибы','дуб — дубы','луг — лук','зуб — зубы'],[0,1,3],{hint:'Измени слово так, чтобы после согласного был гласный. Проверка должна быть родственным словом.',explain:'Грибы, дубы, зубы ясно показывают согласный. Лук — другое слово; для луга подходят «луга».'}),
      ()=>multiTask('Робот собрал семью слова «сад». Найди всех родственников.',['садик','садовый','садовник','досада'],[0,1,2],{hint:'Нужны и общая часть, и общий смысл.',explain:'Садик, садовый, садовник связаны с садом. Досада — другое по смыслу слово.'}),
      ()=>multiTask('Дракон собирает только глаголы. Выбери все слова-действия.',['бежит','рисовать','весёлый','поёт'],[0,1,3],{hint:'Глагол отвечает на вопросы «что делать?», «что делает?».',explain:'Бежит, рисовать, поёт — действия. Весёлый — признак.'}),
      ()=>orderTask('Разрушь чары Кляксуса: восстанови предложение',['Мы','помогли','питомцу','найти','дом.'],{hint:'Кто? Мы. Что сделали? Помогли. Кому? Питомцу.',explain:'Мы помогли питомцу найти дом. Предложение начинается с большой буквы и заканчивается точкой.'}),
    ][n]();
    if(w.subject.id==='en')t=[
      ()=>orderTask('Попугай перепутал алфавит. Расставь буквы',['A','B','C','D'],{hint:'Начало английского алфавита: A, B, C, D.',explain:'A → B → C → D.'}),
      ()=>multiTask('Найди все слова со звуком [æ], как в cat.',['cat','bag','dog','hat'],[0,1,3],{hint:'Вспомни короткий звук a в слове cat.',explain:'Cat, bag, hat содержат [æ]. Dog — с другим гласным звуком.'}),
      ()=>multiTask('Верни в зоопарк всех животных.',['tiger 🐯','lion 🦁','chair 🪑','bear 🐻'],[0,1,3],{hint:'Chair — стул. Остальные слова называют животных.',explain:'Tiger — тигр, lion — лев, bear — медведь.'}),
      ()=>multiTask('Павлин просит: <b>Choose green things.</b> Выбери всё зелёное.',['🟢 green circle','🟩 green square','🔴 red circle','🟨 yellow square'],[0,1],{say:'Choose green things.',hint:'Green — зелёный.',explain:'Green circle и green square — зелёные круг и квадрат.'}),
      ()=>multiTask('Мышонок перепутал am, is, are. Выбери все верные фразы.',['I am happy.','She is my sister.','They is friends.','We are friends.'],[0,1,3],{hint:'I am, he/she/it is, we/you/they are.',explain:'I am; she is; we are. Нужно: They are friends.'}),
      ()=>multiTask('Тыквоголов подписал предметы. Какие подписи верные?',['a book 📖','an apple 🍎','an pen 🖊️','a ruler 📏'],[0,1,3],{hint:'A перед согласным звуком, an — перед гласным.',explain:'A book, an apple, a ruler. Перед pen нужно a.'}),
      ()=>multiTask('Хомяк просит <b>fruit</b>. Выбери все фрукты.',['apple 🍎','banana 🍌','bread 🍞','orange 🍊'],[0,1,3],{hint:'Fruit — фрукты. Bread — хлеб.',explain:'Apple, banana, orange — фрукты.'}),
      ()=>orderTask('Ответь Биг-Бену: «Мы друзья»',['We','are','friends.'],{hint:'Начни с We — мы. С ним используется are.',sayAfter:'We are friends.',explain:'We are friends. — Мы друзья.'}),
    ][n]();
    const mathGoals=[`Верни число ${a*10+b}`,`Найди все способы: 8 + ${b+3}`,`Найди все способы: ${a*10+8} + 7`,'Сколько ракушек? Выбери все записи.',`Открой замок числа ${a*b}`,'Почини меры','Выбери верные подписи','Что можно узнать?',`Собери число ${a*100+b*10+c}`];
    const ruGoals=['Верни гласные','Найди слова: 2 слога','Выбери слова без ошибок','Проверь слово «л_сной»','Найди верные проверки','Семья слова «сад»','Найди действия','Собери предложение'];
    const enGoals=['Расставь буквы','Найди звук [æ], как в cat','Верни животных','Choose green things','Почини фразы','Выбери верные подписи','Найди фрукты','Собери фразу'];
    t.prompt=(w.subject.id==='math'?mathGoals:w.subject.id==='ru'?ruGoals:enGoals)[n];
    if(w.subject.id==='math'&&n===3)t.show=`<div class="battle-picture">${'🧺'.repeat(b)}<b>по ${a} 🐚</b></div>`;
    if(w.subject.id==='math'&&n===6)t.show=`<div class="battle-rectangle"><span>${a}</span><b>${b}</b></div>`;
    if(w.subject.id==='math'&&n===7)t.show=`<div class="battle-picture">🍎 ${a*b} <b>− ${c}</b></div>`;
    if(w.subject.id==='en'&&n===0){const first=mr(0,20),letters=Array.from({length:5},(_,i)=>String.fromCharCode(65+first+i));t=orderTask(t.prompt,letters,{hint:letters.join(' → '),explain:letters.join(' → ')});}
    t.label='Загадка: '+w.boss.name;t.battleChallenge=true;return t;
  },
};

const battleStart=Boss.start.bind(Boss),battlePrep=Boss.prepTask.bind(Boss),battleOnTask=Boss.onTask.bind(Boss),battleCorrect=Boss.correct.bind(Boss),battleWrong=Boss.wrong.bind(Boss);
Battle.finalTask = function (w) {
  const a=mr(3,8),b=mr(2,5),c=mr(1,4),n=w.wi;
  let values;
  if(w.subject.id==='math') {
    const x=mr(2,5),y=mr(2,7);
    values=[
      [[`${a} дес. ${b} ед.`,a*10+b],[`${a+1} дес. ${b} ед.`,a*10+b+10],[`${a} дес. ${b+1} ед.`,a*10+b+1]],
      [[`8 + ${b+3}`,b+11],[`7 + ${b+3}`,b+10],[`9 + ${b+3}`,b+12]],
      [[`${a*10+8} + 7`,a*10+15],[`${a*10+8} + 8`,a*10+16],[`${a*10+8} − 9`,a*10-1]],
      [[`${x} · ${y}`,x*y],[`${x} · ${y+1}`,x*(y+1)],[`${x} · ${y+2}`,x*(y+2)]],
      [[`${a*b} : ${a}`,b],[`${a*b+a} : ${a}`,b+1],[`${a*b+2*a} : ${a}`,b+2]],
      [[`${a} м`,`${a*100} см`],[`${b} ч`,`${b*60} мин`],[`${c} кг`,`${c*1000} г`]],
      [[`Площадь ${a}×${b}`,`${a*b} клеток`],[`Периметр ${a}×${b}`,`${2*(a+b)} ед.`],['Площадь 9×9','81 клетка']],
      [['На 3 больше',`${a} + 3`],['На 3 меньше',`${a} − 3`],['В 3 раза больше',`${a} · 3`]],
      [[`${a*100} + ${b*10} + ${c}`,a*100+b*10+c],[`${a*100} + ${b*10}`,a*100+b*10],[`${a*100} + ${c}`,a*100+c]],
    ][n];
  } else if(w.subject.id==='ru') {
    values=[
      [['дом','Д'],['кот','К'],['мак','М']],
      [['кот','1 слог'],['кошка','2 слога'],['машина','3 слога']],
      [['ж_раф','И'],['ч_до','У'],['ч_й','А']],
      [['л_сной','лес'],['с_ды','сад'],['в_да','во́ды']],
      [['гри_','грибы́'],['ду_','дубы́'],['лу_','луга́']],
      [['домик','дом'],['лесник','лес'],['рыбак','рыб']],
      [['кот','Кто? Что?'],['прыгает','Что делает?'],['рыжий','Какой?']],
      [['Питомец','Кто?'],['играет','Что делает?'],['с мячом.','С чем?']],
    ][n];
  } else {
    values=[
      [['a','A'],['g','G'],['r','R']],
      [['sh','ship 🚢'],['ch','chick 🐥'],['th','three 3']],
      [['cat','🐱'],['dog','🐶'],['rabbit','🐰']],
      [['red','🔴'],['green','🟢'],['blue','🔵']],
      [['mum','👩'],['dad','👨'],['grandpa','👴']],
      [['book','📖'],['ruler','📏'],['pencil','✏️']],
      [['apple','🍎'],['carrot','🥕'],['bread','🍞']],
      [['I ___ nine.','am'],['He ___ got a dog.','has'],['They ___ friends.','are']],
    ][n];
  }
  return {kind:'scene',sceneType:'match',answer:'ok',prompt:'Соедини пары — открой замок',pairs:values.map(([left,right],i)=>({id:String(i),left:String(left),right:String(right)})),battleChallenge:true,battleFinal:true,label:'Замок: '+w.boss.name,hint:'Нажми на карточку слева, затем на её пару справа.',explain:'Каждая верная пара открывает часть замка.'};
};
Boss.start=function(){battleStart();L.energy=2;L.guard=false;L.chargedStrike=false;};
Boss.prepTask=function(){
  battlePrep();const e=curTask(),phase=Battle.phase();
  if(phase===2&&!e.t.battleFinal){L.queue[L.pos]={...e,t:Battle.finalTask(L.world),battlePrepared:true};}
  else if(phase===1&&!e.battlePrepared&&(L.pos%2===0||e.shield)){const t=Battle.challenge(L.world);L.queue[L.pos]={...e,t,battlePrepared:true};}
};
Boss.onTask=function(e){
  battleOnTask(e);const phase=Battle.phase();
  $('#lBody').insertAdjacentHTML('afterbegin',`<div class="battle-phase"><span>${Battle.phases[phase]}</span><small>${e.t.battleChallenge?'Разгадай особый приём':'Темы этого мира'}</small></div>`);
  if(e.t.battleChallenge)$('#aBoss').classList.add('puzzling');else $('#aBoss').classList.remove('puzzling');
  Battle.update();
};
Boss.correct=function(e,t){L.energy=Math.min(3,L.energy+1);battleCorrect(e,t);};
Boss.wrong=function(){if(L.guard){L.guard=false;Boss.clearFx();Boss.petSay('Щит сработал! Сердечко цело.');Sound.play('pet');return;}battleWrong();};
// Варианты остаются на месте, пока ребёнок читает. Приём виден на самом боссе.
Boss.T.shuffle=function(){this.re($('#aBoss'),'swirl');this.tones([[500,0,.08],[700,.08,.08]],'triangle',.05);};
Boss.T.ghost=function(){this.re($('#aBoss'),'ghosty');};
