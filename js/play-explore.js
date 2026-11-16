'use strict';

HouseActivities.music = function (root) {
  const state=Play.state('music',{mode:'echo',level:0,notes:(S.house.melody||[]).slice(),target:[],answer:[],wins:0});
  state.history=state.history||[];
  const names=['До','Ре','Ми','Фа','Соль','Ля','Си'],freq=[262,294,330,349,392,440,494];
  let generation=0,playing=false,selected=-1;
  const tone=n=>{Sound.init();if(Sound.enabled)Sound.tone(freq[n],0,.32,'triangle',.15);};
  const preview=()=>`<svg viewBox="0 0 200 100" class="work-svg" aria-hidden="true"><rect width="200" height="100" rx="9" fill="#F5EFF9"/>${[30,42,54,66,78].map(y=>`<path d="M10 ${y}H190" stroke="#C9B9DD"/>`).join('')}${state.notes.slice(0,12).map((n,i)=>`<ellipse cx="${18+i*14}" cy="${76-n*7}" rx="5" ry="4" fill="${Play.colors[n%5]}"/><path d="M${23+i*14} ${76-n*7}v-24" stroke="${Play.colors[n%5]}" stroke-width="2"/>`).join('')}</svg>`;
  const newTarget=()=>{state.target=Array.from({length:4+state.level},()=>mr(0,Math.min(6,3+state.level)));state.answer=[];save();};
  const render=()=>{
    generation++;playing=false;selected=-1;
    const body=Play.shell(root,{goal:state.mode==='echo'?'Послушай → повтори':'Сочини музыку для питомца',icon:'🎹',help:'▶ играет мелодию. Нажимай цветные клавиши. ↶ отменяет ноту. В режиме «Сочинять» можно выбрать ноту в записи и заменить её.'});
    body.innerHTML=`<div class="play-tabs"><button data-music-mode="echo" aria-pressed="${state.mode==='echo'}">🐾 Повтори</button><button data-music-mode="compose" aria-pressed="${state.mode==='compose'}">🎼 Сочинять</button><button data-music-sound aria-label="Включить или выключить звук">${Sound.enabled?'🔊':'🔇'}</button></div>
      <div class="music-pet">${Play.miniPet('musician')}<div class="music-notes"></div></div><div class="music-pads">${names.map((name,n)=>`<button data-note="${n}" style="--note-color:${Play.colors[n%5]}" aria-label="Нота ${name}"><i></i><b>${name}</b></button>`).join('')}</div>
      <div class="play-controls"><button class="btn" data-note-undo aria-label="Отменить последнюю ноту">↶</button><button class="btn primary" data-note-play>▶ Слушать</button>${state.mode==='echo'?'<button class="btn" data-new-tune>✨ Другая</button>':'<button class="btn" data-note-delete aria-label="Убрать выбранную или последнюю ноту">⌫</button><button class="btn" data-save-tune>💾 В альбом</button>'}</div>${state.mode==='echo'?`<div class="play-levels">${[0,1,2,3].map(i=>`<button data-tune-level="${i}" aria-pressed="${i===state.level}">${'●'.repeat(i+1)}</button>`).join('')}</div>`:'<small class="music-capacity"></small>'}`;
    const pads=[...body.querySelectorAll('[data-note]')],strip=body.querySelector('.music-notes');
    if(!state.target.length)newTarget();
    const draw=()=>{
      const notes=state.mode==='echo'?state.answer:state.notes;
      strip.innerHTML=state.mode==='echo'?state.target.map((_,i)=>`<span class="note-slot ${i<notes.length?'filled':''}" style="--note-color:${Play.colors[(notes[i]||0)%5]}">${i<notes.length?names[notes[i]]:'●'}</span>`).join(''):
        (notes.map((n,i)=>`<button data-edit-note="${i}" aria-label="Изменить ноту ${i+1}" class="${selected===i?'selected':''}" style="--note-color:${Play.colors[n%5]}">${names[n]}</button>`).join('')||'<span class="music-empty">♪ ♪ ♪</span>');
      strip.querySelectorAll('[data-edit-note]').forEach(b=>b.onclick=()=>{selected=+b.dataset.editNote;draw();});
      body.querySelector('[data-note-undo]').disabled=(state.mode==='echo'?!notes.length:!state.history.length)||playing;
      const count=body.querySelector('.music-capacity');if(count)count.textContent=notes.length+' / 16 нот';
      pads.forEach(b=>b.disabled=playing);save();
    };
    const play=async()=>{
      if(playing){generation++;playing=false;pads.forEach(b=>b.classList.remove('lit'));body.querySelector('[data-note-play]').textContent='▶ Слушать';draw();return;}
      const sequence=(state.mode==='echo'?state.target:state.notes).slice();
      if(!sequence.length){Play.message(root,'Нажми на клавиши — появятся ноты.');return;}
      playing=true;draw();const mine=++generation;
      body.querySelector('[data-note-play]').textContent='■ Стоп';
      for(const n of sequence){if(!Play.alive(root)||generation!==mine)return;tone(n);pads[n].classList.add('lit');await wait(420);pads[n].classList.remove('lit');await wait(110);}
      if(!Play.alive(root)||generation!==mine)return;
      playing=false;body.querySelector('[data-note-play]').textContent='▶ Слушать';draw();
      Play.message(root,state.mode==='echo'?'Теперь твоя очередь!':'Вот твоя мелодия. Можно изменить любую ноту.');
    };
    pads.forEach(b=>b.onclick=()=>{
      if(playing)return;const n=+b.dataset.note;tone(n);
      if(state.mode==='echo'){
        if(state.answer.length===state.target.length){Play.message(root,'✨ «Другая» — новая мелодия.');return;}
        if(n!==state.target[state.answer.length]){b.classList.add('miss');setTimeout(()=>b.classList.remove('miss'),350);Play.message(root,'Попробуй другую клавишу. ▶ поможет вспомнить.');return;}
        state.answer.push(n);draw();
        if(state.answer.length===state.target.length){state.wins++;Play.award(root,'music_echo','Концерт с питомцем','🎹',`<div class="work-notes">${state.target.map(n=>`<i style="background:${Play.colors[n%5]}">${names[n]}</i>`).join('')}</div>`);}
      }else{
        if(selected>=0){state.history.push(state.notes.slice());state.notes[selected]=n;selected=-1;}
        else if(state.notes.length<16){state.history.push(state.notes.slice());state.notes.push(n);}
        else {Play.message(root,'16 нот. Выбери ноту, чтобы заменить, или нажми ↶.');return;}
        state.history=state.history.slice(-30);S.house.melody=state.notes.slice();draw();
      }
    });
    body.querySelector('[data-note-play]').onclick=play;
    body.querySelector('[data-note-undo]').onclick=()=>{if(playing)return;if(state.mode==='echo')state.answer.pop();else if(state.history.length)state.notes=state.history.pop();selected=-1;S.house.melody=state.notes.slice();draw();};
    body.querySelector('[data-note-delete]')?.addEventListener('click',()=>{if(playing||!state.notes.length)return;state.history.push(state.notes.slice());state.notes.splice(selected>=0?selected:state.notes.length-1,1);selected=-1;S.house.melody=state.notes.slice();draw();});
    body.querySelector('[data-new-tune]')?.addEventListener('click',()=>{generation++;newTarget();render();});
    body.querySelector('[data-save-tune]')?.addEventListener('click',()=>{if(!state.notes.length){Play.message(root,'Сначала сыграй несколько нот.');return;}Play.award(root,'melody','Моя мелодия','🎼',preview());});
    body.querySelectorAll('[data-music-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.musicMode;save();render();});
    body.querySelectorAll('[data-tune-level]').forEach(b=>b.onclick=()=>{state.level=+b.dataset.tuneLevel;newTarget();render();});
    body.querySelector('[data-music-sound]').onclick=()=>{S.settings.sound=!S.settings.sound;Sound.enabled=S.settings.sound;body.querySelector('[data-music-sound]').textContent=Sound.enabled?'🔊':'🔇';save();};
    root._demonstrate=play;draw();
  };
  render();
};

HouseActivities.stars = function (root) {
  const state=Play.state('stars',{level:0,puzzles:{}});
  const points=[[15,24],[39,13],[63,24],[78,50],[60,76],[29,72],[13,51],[83,18],[85,80],[46,48]];
  const make=level=>{
    let seq,delta;
    if(level===2){const start=mr(1,3);seq=Array.from({length:6},(_,i)=>start*2**i);delta='×2';}
    else if(level===1){const start=mr(1,8);seq=[start];for(let i=1;i<7;i++)seq.push(seq.at(-1)+(i%2?2:4));delta='+2, +4';}
    else {const step=(level===3?-1:1)*U.rnd([3,4,5,6]);const start=level===3?mr(45,75):mr(1,8);seq=Array.from({length:6},(_,i)=>start+i*step);delta=(step<0?'−':'+')+Math.abs(step);}
    const prefix=level===1?4:3;
    const distract=U.sample(Array.from({length:100},(_,i)=>i+1).filter(n=>!seq.includes(n)),3);
    return {seq,delta,prefix,values:U.shuffle([...seq.slice(prefix),...distract]),picked:[]};
  };
  const render=()=>{
    const level=state.level;
    if(level===1&&state.puzzles[level]?.seq.length<7)delete state.puzzles[level];
    const puzzle=state.puzzles[level]||(state.puzzles[level]=make(level)),prefix=puzzle.prefix||3;
    const body=Play.shell(root,{goal:'Какая звезда следующая?',icon:'🌌',help:'Посмотри на числа сверху. Найди закономерность и выбирай продолжение среди звёзд.',level,levels:House.count()>=18?4:3,change:i=>{state.level=i;save();render();}});
    body.innerHTML=`<div class="star-sequence">${puzzle.seq.slice(0,prefix).map(n=>`<span>${n}</span>`).join('<i>→</i>')}<i>→</i><span class="star-question">?</span></div><div class="star-sky"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>${puzzle.values.map((n,i)=>`<button data-star="${n}" style="left:${points[i+prefix][0]}%;top:${points[i+prefix][1]}%">${n}</button>`).join('')}${puzzle.seq.slice(0,prefix).map((n,i)=>`<span class="star-known" style="left:${points[i][0]}%;top:${points[i][1]}%">${n}</span>`).join('')}</div><div class="play-controls"><button class="btn" data-star-rule>💡 Намёк</button><button class="btn" data-new-stars>✨ Другой маршрут</button></div>`;
    const sky=body.querySelector('.star-sky');
    const draw=()=>{
      const positions=points.slice(0,prefix).concat(puzzle.picked.map(n=>points[prefix+puzzle.values.indexOf(n)]));
      sky.querySelector('svg').innerHTML=positions.slice(1).map((p,i)=>`<line x1="${positions[i][0]}" y1="${positions[i][1]}" x2="${p[0]}" y2="${p[1]}"/>`).join('');
      sky.querySelectorAll('[data-star]').forEach(b=>{b.classList.toggle('found',puzzle.picked.includes(+b.dataset.star));b.disabled=puzzle.picked.includes(+b.dataset.star);});
      body.querySelector('.star-question').textContent=puzzle.picked.length?puzzle.picked.at(-1):'?';save();
    };
    const hint=()=>{Play.message(root,'Правило: '+puzzle.delta);const next=sky.querySelector(`[data-star="${puzzle.seq[prefix+puzzle.picked.length]}"]`);next?.classList.add('point-here');};
    sky.addEventListener('click',e=>{
      const b=e.target.closest('[data-star]');if(!b||puzzle.picked.length===3)return;
      if(+b.dataset.star!==puzzle.seq[prefix+puzzle.picked.length]){b.classList.add('miss');setTimeout(()=>b.classList.remove('miss'),350);Play.message(root,'Сравни соседние числа. Можно взять 💡.');return;}
      puzzle.picked.push(+b.dataset.star);Sound.play('pop');draw();
      if(puzzle.picked.length===3){const svg=sky.querySelector('svg').innerHTML;Play.award(root,'stars_'+level,'Созвездие №'+(level+1),'🌟',`<svg viewBox="0 0 100 100" class="work-svg"><rect width="100" height="100" rx="8" fill="#283758"/>${svg.replace(/<line /g,'<line stroke="#FFD67C" stroke-width="2" ')}</svg>`);}
    });
    body.querySelector('[data-star-rule]').onclick=hint;
    body.querySelector('[data-new-stars]').onclick=()=>{state.puzzles[level]=make(level);save();render();};
    root._demonstrate=hint;root._stars=puzzle;draw();
  };
  render();
};

HouseActivities.aquarium = function (root) {
  const tank=S.house.aquarium;
  const state=Play.state('aquarium',{mode:'reef',mission:0,feed:{},history:[]});
  const prices={'🐠':1,'🐟':2,'🐡':3,'🐙':4,'🐢':3};
  let removing=false;
  const snapshot=()=>{state.history.push({fish:tank.fish.slice(),water:tank.water,feed:{...state.feed}});state.history=state.history.slice(-20);};
  const render=()=>{
    const species=House.count()>=12?['🐠','🐟','🐡','🐙','🐢']:['🐠','🐟','🐡'];
    const goals=['Посели рыбок по заказу','Раздай 12 порций поровну','5 рыбок за 10 жемчужин'];
    const body=Play.shell(root,{goal:state.mode==='reef'?'Твой подводный сад':goals[state.mission],icon:'🐠',help:'Нажимай на рыбок снизу, чтобы поселить их. Кнопка «В сачок» включает переселение. В задачах сравни рыбок с заказом сверху. ↶ отменяет действие.'});
    body.innerHTML=`<div class="play-tabs"><button data-aqua-mode="reef" aria-pressed="${state.mode==='reef'}">🌿 Мой риф</button><button data-aqua-mode="mission" aria-pressed="${state.mode==='mission'}">🧩 Задачи</button></div>${state.mode==='mission'?`<div class="play-levels">${[0,1,2].map(i=>`<button data-aqua-level="${i}" aria-pressed="${state.mission===i}">${i+1}</button>`).join('')}</div><div class="aqua-order"></div>`:''}<div class="home-aquarium rich-aquarium" data-water="${tank.water}"><div class="aquarium-fish"></div><div class="aquarium-plants">🌿 🪸 🌱 🐚 🌿</div></div><div class="aqua-species">${species.map(f=>`<button class="btn" data-fish="${f}" aria-label="Поселить ${f}">＋ ${f}${state.mode==='mission'&&state.mission===2?`<small>${prices[f]} ◇</small>`:''}</button>`).join('')}</div><div class="aqua-feeding"></div><div class="play-controls"><button class="btn" data-aqua-undo aria-label="Отменить действие">↶</button><button class="btn" data-aqua-remove aria-pressed="false">🥅 В сачок</button><button class="btn" data-aqua-water>🌊 Цвет</button>${state.mode==='mission'?'<button class="btn primary" data-aqua-check>✓ Проверить</button>':'<button class="btn primary" data-aqua-photo>📸 В альбом</button>'}</div>`;
    const aquarium=body.querySelector('.home-aquarium'),fish=body.querySelector('.aquarium-fish');
    const visibleFish=()=>state.mode==='mission'&&state.mission===1?['🐠','🐠','🐠','🐟','🐟','🐡']:tank.fish;
    const counts=()=>Object.fromEntries(species.map(f=>[f,visibleFish().filter(x=>x===f).length]));
    const preview=()=>`<svg viewBox="0 0 200 130" class="work-svg"><rect width="200" height="130" rx="10" fill="${['#9AD6E1','#A3D6B7','#BAB4DC'][tank.water]}"/><text x="8" y="122" font-size="28">🌿 🪸 🌿</text>${visibleFish().map((f,i)=>`<text x="${10+i*23%155}" y="${33+i*19%55}" font-size="25">${f}</text>`).join('')}</svg>`;
    const draw=()=>{
      fish.innerHTML=visibleFish().map((f,i)=>`<button data-aqua-fish="${i}" style="left:${8+i*29%76}%;top:${15+i*23%52}%;--delay:${i*.3}s" aria-label="Рыбка ${i+1}">${f}</button>`).join('');
      aquarium.dataset.water=tank.water;aquarium.classList.toggle('net-mode',removing);
      body.querySelector('[data-aqua-remove]').setAttribute('aria-pressed',String(removing));
      body.querySelector('.aqua-species').hidden=state.mode==='mission'&&state.mission===1;body.querySelector('[data-aqua-remove]').hidden=state.mode==='mission'&&state.mission===1;
      body.querySelector('[data-aqua-undo]').disabled=!state.history.length;
      const order=body.querySelector('.aqua-order'),feeding=body.querySelector('.aqua-feeding'),have=counts();
      if(order){
        if(state.mission===0)order.innerHTML=[['🐠',3],['🐟',2],['🐡',1]].map(([f,n])=>`<span class="${have[f]===n?'done':''}">${f} ${have[f]}/${n}</span>`).join('');
        if(state.mission===1)order.innerHTML='<span>🥣 12</span><span>🐠 = 🐟 = 🐡</span>';
        if(state.mission===2)order.innerHTML=`<span>🐠 ${tank.fish.length}/5</span><span>◇ ${tank.fish.reduce((s,f)=>s+prices[f],0)}/10</span><small>Хотя бы 2 вида</small>`;
      }
      feeding.innerHTML=state.mode==='mission'&&state.mission===1?Object.entries(have).filter(([,n])=>n).map(([f,n])=>`<div class="feed-group"><b>${f} ×${n}</b><button class="btn" data-feed-minus="${f}" aria-label="Убрать порцию">−</button><span>${state.feed[f]||0} 🥣</span><button class="btn" data-feed-plus="${f}" aria-label="Добавить порцию">＋</button></div>`).join(''):'';
      save();
    };
    const complete=()=>{
      if(!visibleFish().length){Play.message(root,'Сначала посели рыбок.');return;}
      Play.award(root,'aquarium_'+(state.mode==='reef'?'photo':state.mission),'Мой подводный сад','🐠',preview());
    };
    body.addEventListener('click',e=>{
      const add=e.target.closest('[data-fish]');
      if(add){if(state.mode==='mission'&&state.mission===1)return;if(tank.fish.length>=8){Play.message(root,'8 рыбок. «В сачок» освободит место.');return;}snapshot();tank.fish.push(add.dataset.fish);draw();Sound.play('pop');}
      const f=e.target.closest('[data-aqua-fish]');
      if(f){if(removing&&!(state.mode==='mission'&&state.mission===1)){snapshot();const removed=tank.fish.splice(+f.dataset.aquaFish,1)[0];if(!tank.fish.includes(removed))delete state.feed[removed];draw();}else{f.classList.remove('fish-hello');void f.offsetWidth;f.classList.add('fish-hello');Sound.play('pet');}}
      const plus=e.target.closest('[data-feed-plus]'),minus=e.target.closest('[data-feed-minus]');
      if(plus||minus){const kind=plus?plus.dataset.feedPlus:minus.dataset.feedMinus;if(plus&&Object.values(state.feed).reduce((a,b)=>a+b,0)>=12)return;snapshot();state.feed[kind]=Math.max(0,(state.feed[kind]||0)+(plus?1:-1));draw();}
    });
    body.querySelector('[data-aqua-undo]').onclick=()=>{const old=state.history.pop();if(!old)return;tank.fish=old.fish;tank.water=old.water;state.feed=old.feed;draw();};
    body.querySelector('[data-aqua-remove]').onclick=()=>{removing=!removing;draw();Play.message(root,removing?'Нажми на рыбку — она попадёт в сачок.':'Нажми на рыбку — она поздоровается.');};
    body.querySelector('[data-aqua-water]').onclick=()=>{snapshot();tank.water=(tank.water+1)%3;draw();};
    body.querySelector('[data-aqua-photo]')?.addEventListener('click',complete);
    body.querySelector('[data-aqua-check]')?.addEventListener('click',()=>{
      const have=counts();let ok=false;
      if(state.mission===0)ok=tank.fish.length===6&&have['🐠']===3&&have['🐟']===2&&have['🐡']===1;
      if(state.mission===1){const kinds=Object.entries(have).filter(([,n])=>n),total=Object.values(state.feed).reduce((a,b)=>a+b,0);ok=!!kinds.length&&total===12&&kinds.every(([f,n])=>(state.feed[f]||0)*visibleFish().length===12*n);}
      if(state.mission===2)ok=tank.fish.length===5&&tank.fish.reduce((s,f)=>s+prices[f],0)===10&&new Set(tank.fish).size>=2;
      if(ok)complete();else Play.message(root,state.mission===1?'Каждой рыбке — одинаковая доля. Сравни порции.':'Сравни рыбок с заказом сверху. Можно менять риф.');
    });
    body.querySelectorAll('[data-aqua-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.aquaMode;save();render();});
    body.querySelectorAll('[data-aqua-level]').forEach(b=>b.onclick=()=>{state.mission=+b.dataset.aquaLevel;if(state.mission===1){state.feed={};}save();render();});
    root._demonstrate=()=>{body.querySelector('[data-fish]')?.classList.add('point-here');};draw();
  };
  render();
};

const TheatreGame = {
  episodes:[
    {name:'Цветок для дома',icon:'🌻',start:['🪴','🌰'],finish:['🌻','☀️'],actions:[['plant','Посадить','🌰',[]],['water','Полить','💧',['plant']],['sun','К свету','☀️',['plant']],['bloom','Подождать','🌻',['water','sun']]]},
    {name:'Письмо другу',icon:'📮',start:['💌','📄'],finish:['🐾','🫖'],actions:[['write','Открытка','✍️',[]],['address','Адрес','🏷️',[]],['post','Отправить','📮',['write','address']],['visit','В гости','🫖',['post']]]},
    {name:'Игрушка на острове',icon:'⛵',start:['🌊','🧸'],finish:['🧸','🎉'],actions:[['boat','Построить','⛵',[]],['oar','Взять весло','🛶',[]],['launch','На воду','🌊',['boat','oar']],['rescue','Спасти','🧸',['launch']]]},
    {name:'Наш концерт',icon:'🎹',start:['🎹','🎟️'],finish:['🎉','👏'],actions:[['stage','Сцена','🎭',[]],['practice','Репетиция','🎵',['stage']],['invite','Пригласить','🎟️',[]],['perform','Выступить','🎹',['practice','invite']],['bow','Поклон','🎩',['perform']]]},
    {name:'Поймать комету',icon:'☄️',start:['🪟','🔭'],finish:['☄️','📒'],actions:[['curtain','Шторы','🪟',[]],['dark','Свет выкл.','💡',[]],['tripod','Телескоп','🔭',[]],['focus','Настроить','🔎',['curtain','dark','tripod']],['watch','Наблюдать','☄️',['focus']],['draw','Зарисовать','📒',['watch']]]},
    {name:'Экспедиция',icon:'🏝️',start:['🗺️','🌊'],finish:['🏝️','🚩'],actions:[['map','Карта','🗺️',[]],['bag','Рюкзак','🎒',[]],['boat','Лодка','⛵',[]],['launch','В путь','🌊',['bag','boat']],['navigate','По карте','🧭',['launch','map']],['flag','Открытие','🚩',['navigate']]]},
  ],
  mount(root) {
    const state=Play.state('theatre',{episode:0,orders:{},wins:{}});
    let generation=0;
    const render=()=>{
      generation++;const episode=TheatreGame.episodes[state.episode],order=state.orders[state.episode]||(state.orders[state.episode]=[]),bankOrder=U.shuffle(episode.actions);let busy=false;
      const body=Play.shell(root,{goal:'Сними историю: '+episode.name,icon:'🎭',help:'Нажимай на карточки — они станут кадрами. Крестик возвращает карточку. ▶ покажет историю и место, которое нужно исправить.',level:state.episode,levels:TheatreGame.episodes.length,change:i=>{state.episode=i;save();render();}});
      body.innerHTML=`<div class="theatre-goal"><span>${episode.start.join(' ')}</span><i>→</i><span>${episode.finish.join(' ')}</span></div><div class="theatre-screen"><div class="theatre-props">${episode.start.join(' ')}</div><div class="theatre-actor">${Play.miniPet('director')}</div><div class="theatre-frame">🎬</div></div><div class="theatre-timeline"></div><div class="theatre-bank"></div><div class="play-controls"><button class="btn" data-film-undo aria-label="Вернуть последний кадр">↶</button><button class="btn primary" data-film-play>▶ Спектакль</button></div>`;
      const timeline=body.querySelector('.theatre-timeline'),bank=body.querySelector('.theatre-bank');
      const draw=()=>{
        timeline.innerHTML=Array.from({length:episode.actions.length},(_,i)=>{const act=episode.actions.find(a=>a[0]===order[i]);return act?`<button data-remove-frame="${i}" aria-label="Убрать кадр ${i+1}"><small>${i+1}</small><span>${act[2]}</span><b>${act[1]}</b><i>×</i></button>`:`<span class="empty-frame">${i+1}</span>`;}).join('');
        bank.innerHTML=bankOrder.map(a=>`<button data-film-action="${a[0]}" ${order.includes(a[0])?'disabled':''}><span>${a[2]}</span><b>${a[1]}</b></button>`).join('');
        body.querySelector('[data-film-undo]').disabled=!order.length||busy;save();
      };
      bank.onclick=e=>{const b=e.target.closest('[data-film-action]');if(!b||busy)return;order.push(b.dataset.filmAction);draw();Sound.play('tap');};
      timeline.onclick=e=>{const b=e.target.closest('[data-remove-frame]');if(!b||busy)return;order.splice(+b.dataset.removeFrame,1);draw();};
      body.querySelector('[data-film-undo]').onclick=()=>{if(!busy){order.pop();draw();}};
      body.querySelector('[data-film-play]').onclick=async()=>{
        if(busy)return;if(order.length!==episode.actions.length){Play.message(root,'Добавь все кадры в ленту.');return;}
        busy=true;const mine=++generation,done=new Set();
        body.querySelector('.theatre-props').textContent=episode.start.join(' ');
        for(let i=0;i<order.length;i++){
          if(!Play.alive(root)||mine!==generation)return;
          const action=episode.actions.find(a=>a[0]===order[i]),missing=action[3].filter(k=>!done.has(k));
          [...timeline.children].forEach(c=>c.classList.remove('now','blocked'));timeline.children[i].classList.add('now');
          if(missing.length){const needed=episode.actions.find(a=>a[0]===missing[0]);timeline.children[i].classList.add('blocked');Play.message(root,`Сначала ${needed[2]} «${needed[1]}». Верни кадр и переставь.`);busy=false;return;}
          done.add(action[0]);body.querySelector('.theatre-frame').textContent=action[2];body.querySelector('.theatre-props').textContent=[...done].map(k=>episode.actions.find(a=>a[0]===k)[2]).join(' ');body.querySelector('.theatre-actor').classList.remove('a-hop');void body.offsetWidth;body.querySelector('.theatre-actor').classList.add('a-hop');Sound.play('pop');await wait(650);
        }
        if(!Play.alive(root)||mine!==generation)return;
        body.querySelector('.theatre-props').textContent=episode.finish.join(' ');state.wins[state.episode]=true;busy=false;
        Play.award(root,'film_'+state.episode,episode.name,'🎭',`<div class="work-comic">${order.map(k=>`<span>${episode.actions.find(a=>a[0]===k)[2]}</span>`).join('')}</div>`);
      };
      root._demonstrate=()=>{bank.querySelector('button')?.classList.add('point-here');};root._theatre={episode,order};draw();
    };
    render();
  },
};
HouseActivities.theatre = root => TheatreGame.mount(root);
