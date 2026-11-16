'use strict';

House.footer = function () {
  const room=House.room();
  return `<div class="house-tools compact-house-tools">
    <button class="btn primary" data-act="houseActivities">▶ Играть</button>
    <button class="btn ${House.editing?'primary':''}" data-act="houseEdit">${House.editing?'✓ Готово':'🪑 Обустроить'}</button>
    <button class="btn" data-act="houseInventory">📦 Вещи</button><button class="btn" data-act="houseAlbum">🖼️ Альбом</button></div>
    ${House.editing?'<p class="room-hint">Двигай вещи пальцем. Нажми на вещь — выберем комнату.</p>':''}
    <div class="house-stations">${HOUSE_STATIONS.filter(s=>s.room===room.id).map(s=>`<button class="house-station ${House.unlocked(s)?'':'locked'}" data-act="houseStation" data-arg="${s.id}"><span>${s.icon}</span><b>${s.name}</b><small>${House.unlocked(s)?'▶':`🏆 ${House.count()}/${s.at}`}</small></button>`).join('')}</div>
    <div class="house-next-actions"><button class="house-adventure" data-act="houseQuests"><span>🧭</span><div><b>В путь с питомцем!</b><small>Выбери историю</small></div><span>›</span></button><button class="btn" data-act="houseTricks">🐾 Наши номера</button></div>
    ${House.count()===25?'<button class="btn" data-act="houseFestival">🎆 Фестиваль</button>':''}`;
};

House.tricks = function () {
  if(petStage()===0)return toast('Получи звезду — питомец вылупится!');
  const m=modal({cls:'sheet play-routines-menu',html:`<h2>🐾 Наши номера</h2><div class="routines-menu">${[['hop','Прыжки','🐾'],['dance','Танец','💃'],['bow','Выступление','🎭']].map(([id,name,icon])=>`<div><span>${icon}</span><b>${name}</b><button class="btn" data-routine-edit="${id}">${S.house.routines?.[id]?'✏️ Изменить':'✨ Придумать'}</button>${(S.house.skills[id]||0)>=3?`<button class="btn primary" data-routine-perform="${id}">▶ В комнате</button>`:''}</div>`).join('')}</div>`,buttons:[{label:'В комнату',cls:'ghost'}]});
  m.addEventListener('click',e=>{const edit=e.target.closest('[data-routine-edit]'),show=e.target.closest('[data-routine-perform]');if(edit){m.close();House.train(edit.dataset.routineEdit);}if(show){m.close();setTimeout(()=>House.performRoutine(show.dataset.routinePerform),200);}});
};

House.train = function (id) {
  if(petStage()===0)return toast('Получи звезду — питомец вылупится!');
  if(!['hop','dance','bow'].includes(id))return;
  const m=modal({cls:'sheet play-activity',html:'<div class="routine-editor"></div>',buttons:[{label:'В комнату',cls:'primary'}]});
  const root=m.querySelector('.routine-editor');
  const state=Play.state('routine_'+id,{queue:(S.house.routines?.[id]||[]).slice(),history:[]});
  const commands={hop:{icon:'🐾',name:'Прыжок'},dance:{icon:'💃',name:'Танец'},bow:{icon:'🎩',name:'Поклон'},spin:{icon:'🌀',name:'Поворот'}};
  const body=Play.shell(root,{goal:'Придумай номер питомцу',icon:'🎬',help:'Добавь команды снизу. ▶ покажет номер. Крестик убирает команду, ↶ отменяет действие. Сохрани номер — питомец сможет показать его в комнате.'});
  body.innerHTML=`<div class="routine-stage"><div class="routine-actor">${Play.miniPet('routine')}</div><span class="routine-cue">🎬</span></div><div class="routine-timeline"></div><div class="routine-commands">${Object.entries(commands).map(([key,c])=>`<button data-command="${key}"><span>${c.icon}</span><b>${c.name}</b></button>`).join('')}</div><div class="play-controls"><button class="btn" data-routine-undo aria-label="Отменить действие">↶</button><button class="btn primary" data-routine-play>▶ Показать</button><button class="btn" data-routine-save>💾 Научить</button></div>`;
  const timeline=body.querySelector('.routine-timeline'),actor=body.querySelector('.routine-actor');let generation=0,busy=false;
  const remember=()=>{state.history.push(state.queue.slice());state.history=state.history.slice(-15);};
  const draw=()=>{timeline.innerHTML=Array.from({length:6},(_,i)=>state.queue[i]?`<button data-remove-command="${i}" aria-label="Убрать команду ${i+1}">${commands[state.queue[i]].icon}<small>×</small></button>`:'<span>＋</span>').join('');body.querySelector('[data-routine-undo]').disabled=!state.history.length||busy;save();};
  body.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>{if(busy)return;if(state.queue.length===6){Play.message(root,'6 команд. Нажми ×, чтобы изменить номер.');return;}remember();state.queue.push(b.dataset.command);draw();});
  timeline.onclick=e=>{const b=e.target.closest('[data-remove-command]');if(b&&!busy){remember();state.queue.splice(+b.dataset.removeCommand,1);draw();}};
  body.querySelector('[data-routine-undo]').onclick=()=>{if(!busy&&state.history.length){state.queue=state.history.pop();draw();}};
  body.querySelector('[data-routine-play]').onclick=async()=>{
    if(busy){generation++;busy=false;actor.dataset.move='';draw();return;}
    if(!state.queue.length){Play.message(root,'Добавь первую команду снизу.');return;}
    busy=true;const mine=++generation;
    for(let i=0;i<state.queue.length;i++){
      if(!Play.alive(root)||mine!==generation)return;
      const command=state.queue[i];actor.dataset.move='';void actor.offsetWidth;actor.dataset.move=command;
      body.querySelector('.routine-cue').textContent=commands[command].icon;
      [...timeline.children].forEach((c,n)=>c.classList.toggle('now',n===i));Sound.play('pet');await wait(650);
    }
    if(!Play.alive(root)||mine!==generation)return;busy=false;actor.dataset.move='';draw();Play.message(root,'Браво! Сохраним этот номер?',true);
  };
  body.querySelector('[data-routine-save]').onclick=()=>{
    if(busy||!state.queue.length){if(!state.queue.length)Play.message(root,'Добавь команды для питомца.');return;}
    S.house.routines=S.house.routines||{};S.house.routines[id]=state.queue.slice();S.house.skills[id]=Math.max(3,S.house.skills[id]||0);
    Play.award(root,'routine_'+id,'Номер питомца','🐾',`<div class="work-comic">${state.queue.map(k=>`<span>${commands[k].icon}</span>`).join('')}</div>`);
    Play.message(root,'Питомец запомнил! «Наши номера» → ▶ в комнате.',true);
  };
  root._demonstrate=()=>body.querySelector('[data-command]')?.classList.add('point-here');draw();
};

House.performRoutine = async function (id) {
  const presets={hop:['hop'],dance:['dance','hop'],bow:['bow']};
  const sequence=S.house.routines?.[id]||((S.house.skills[id]||0)>=3?presets[id]:null);
  if(!sequence||!Room.root||Room.busy||Room.night())return;
  const g=Room.gen;Room.busy=true;clearTimeout(Room.idleT);
  for(const command of sequence){
    if(!Room.alive(g))return;
    Room.draw('happy');Room.anim(command==='dance'?'a-dance':command==='bow'?'a-bow':command==='spin'?'a-spin':'a-hop');Sound.play('pet');await wait(650);
  }
  if(Room.alive(g)){Room.anim('');Room.busy=false;Room.scheduleIdle();}
};
