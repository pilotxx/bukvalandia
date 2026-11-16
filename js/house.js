'use strict';
/* Дом приключений. Старые координаты гостиной остаются в room.pos. */
const HOUSE_ROOMS = [
  { id: 'living', name: 'Гостиная', icon: '🛋️', at: 0, note: 'Твой уютный дом' },
  { id: 'workshop', name: 'Мастерская', icon: '🛠️', at: 1, note: 'Место для открытий и творчества' },
  { id: 'observatory', name: 'Обсерватория', icon: '🌌', at: 3, note: 'Звёзды, музыка и удивительные истории' },
];
const HOUSE_STATIONS = [
  { id: 'blocks', name: 'Конструктор', icon: '🧱', at: 1, room: 'workshop', desc: 'Строй замки и узоры. Сохрани свою постройку.', play: 'build' },
  { id: 'art', name: 'Студия красок', icon: '🎨', at: 2, room: 'workshop', desc: 'Рисуй пальцем. После 5 побед откроется зеркальное рисование.', play: 'paint' },
  { id: 'stars', name: 'Звёздные маршруты', icon: '🔭', at: 3, room: 'observatory', desc: 'Соединяй звёзды по числовой закономерности.', play: 'look' },
  { id: 'music', name: 'Музыкальная шкатулка', icon: '🎹', at: 4, room: 'observatory', desc: 'Сочиняй мелодии и повторяй музыку питомца.', play: 'music' },
  { id: 'aquarium', name: 'Подводный сад', icon: '🐠', at: 6, room: 'living', desc: 'Заселяй аквариум, меняй пейзаж и корми рыбок.', play: 'look' },
  { id: 'theatre', name: 'Театр историй', icon: '🎭', at: 8, room: 'observatory', desc: 'Собери историю и посмотри спектакль с питомцем.', play: 'wow' },
];
const HOUSE_UPGRADES = [
  {id:'mirror',icon:'🪞',name:'Зеркальное рисование',at:5},
  {id:'reef',icon:'🐙',name:'Новые жители аквариума',at:12},
  {id:'reverseStars',icon:'🌠',name:'Обратные звёздные маршруты',at:18},
  {id:'festival',icon:'🎆',name:'Домашний фестиваль',at:25},
];
const HOUSE_ITEMS = HOUSE_STATIONS.map((s, n) => ({
  id: 'home_' + s.id, cat: 'decor', icon: s.icon, name: s.name, station: s.id,
  zone: 'floor', x: 115 + (n % 3) * 195, y: 300 + (n % 2) * 54, h: 86, ps: 1, play: s.play,
}));
const HOUSE_SOUVENIRS = [
  ['mail', '📮', 'Почта приключений'], ['detective', '🔎', 'Лупа сыщика'],
  ['cafe', '🧁', 'Кафе питомца'], ['architect', '🏗️', 'Башня архитектора'],
  ['packing', '🎒', 'Рюкзак путешественника'], ['party', '🎉', 'Праздничный фонарик'],
].map(([id, icon, name], n) => ({ id: 'souvenir_' + id, cat: 'decor', icon, name, zone: 'floor', x: 75 + n * 85, y: 350, h: 60, ps: 1, play: 'wow' }));
[...HOUSE_ITEMS, ...HOUSE_SOUVENIRS].forEach(i => { ITEMS[i.id] = i; });

const House = {
  editing: false,
  count: () => ALL_WORLDS.filter(w => S.bosses[w.id]).length,
  room: () => HOUSE_ROOMS.find(r => r.id === S.house.room) || HOUSE_ROOMS[0],
  unlocked: s => House.count() >= s.at,
  allDecor: () => [...SHOP, ...EXCLUSIVE, ...BOSS_TOYS, ...HOUSE_ITEMS, ...HOUSE_SOUVENIRS].filter(i => i.cat === 'decor' && S.owned[i.id]),
  itemRoom: id => S.house.placements[id] || HOUSE_STATIONS.find(s => 'home_' + s.id === id)?.room || 'living',
  positions() {
    if (House.room().id === 'living') return S.room.pos;
    return S.house.positions[House.room().id] || (S.house.positions[House.room().id] = {});
  },
  migrate() {
    HOUSE_STATIONS.filter(House.unlocked).forEach(s => { S.owned['home_' + s.id] = true; });
    if (!House.unlocked(House.room())) S.house.room = 'living';
  },
  unlockNames(before) {
    return [...HOUSE_ROOMS, ...HOUSE_STATIONS, ...HOUSE_UPGRADES].filter(s => s.at > before && s.at <= House.count()).map(s => `${s.icon} ${s.name}`);
  },
  header() {
    House.migrate();
    const room = House.room(), n = House.count();
    return `<div class="house-heading"><div><small>ДОМ ПРИКЛЮЧЕНИЙ</small><h2>${room.icon} ${room.name}</h2></div><button class="house-boss-count" data-act="houseUnlocks">🏆 ${n} / 25</button></div>
      <div class="house-tabs" role="tablist" aria-label="Комнаты">${HOUSE_ROOMS.map(r => `<button role="tab" aria-selected="${room.id === r.id}" class="${room.id === r.id ? 'on' : ''}" data-act="houseRoom" data-arg="${r.id}">${r.icon} ${r.name}${House.unlocked(r) ? '' : ` <small>🔒 ${r.at} 🏆</small>`}</button>`).join('')}</div>`;
  },
  footer() {
    const room = House.room();
    return `<div class="house-tools"><button class="btn ${House.editing ? 'primary' : ''}" data-act="houseEdit">${House.editing ? '✓ Готово' : '🪑 Обустроить'}</button><button class="btn" data-act="houseInventory">📦 Мои вещи</button><button class="btn" data-act="houseAlbum">📒 Альбом</button></div>
      <p class="room-hint">${House.editing ? 'Перетаскивай вещи пальцем. Нажми на предмет, чтобы убрать его или перенести в другую комнату.' : 'Нажми на подарок — поиграем! В режиме «Обустроить» можно менять расстановку.'}</p>
      ${House.count()===25?'<button class="btn primary" data-act="houseFestival">🎆 Устроить домашний фестиваль</button>':''}
      <button class="house-adventure" data-act="houseQuests"><span>🧭</span><div><b>Приключения с питомцем</b><small>6 историй · новые задачи · подарки своими руками</small></div><span>›</span></button>
      <div class="house-stations">${HOUSE_STATIONS.filter(s => s.room === room.id).map(s => `<button class="house-station ${House.unlocked(s) ? '' : 'locked'}" data-act="houseStation" data-arg="${s.id}"><span>${s.icon}</span><b>${s.name}</b><small>${House.unlocked(s) ? 'Открыть и играть' : `${House.count()} / ${s.at} побед 🏆`}</small></button>`).join('')}</div>
      <div class="house-training"><b>🐾 Школа питомца</b><p class="small">Учи друга трюкам и выступайте вместе.</p><div class="house-tools">${[['hop','Прыжок','🐾'],['dance','Танец','💃'],['bow','Поклон','🎩']].map(([id,nm,em]) => `<button class="btn" data-act="houseTrain" data-arg="${id}">${em} ${nm} <small>${Math.min(3,S.house.skills[id]||0)}/3</small></button>`).join('')}</div></div>`;
  },
  switchRoom(id) {
    const r = HOUSE_ROOMS.find(x => x.id === id); if (!r) return;
    if (!House.unlocked(r)) return House.unlocks();
    S.house.room = id; House.editing = false; save(); render(); Sound.play('tap');
  },
  unlocks() {
    modal({ cls: 'sheet', html: `<h2>🏆 Победы меняют твой дом</h2><p>Побеждай боссов в любом предмете. Каждая первая победа считается один раз. Прежние победы уже учтены!</p><div class="house-unlocks">${[...HOUSE_ROOMS.slice(1), ...HOUSE_STATIONS, ...HOUSE_UPGRADES].sort((a,b)=>a.at-b.at).map(s=>`<div class="${House.unlocked(s)?'earned':''}"><span>${s.icon}</span><div><b>${s.name}</b><small>${House.unlocked(s)?'✓ Открыто':`Нужно ${s.at} побед · ещё ${s.at-House.count()}`}</small></div></div>`).join('')}</div>`, buttons: [{label:'В домик',cls:'primary'}] });
  },
  inventory(selected) {
    const rooms = HOUSE_ROOMS.filter(House.unlocked);
    const m = modal({ cls: 'sheet house-inventory', html: `<h2>📦 Мои вещи</h2><p class="small">Выбери комнату для подарка. «В коробку» — спрятать до следующего переезда.</p><div class="house-inventory-list">${House.allDecor().filter(i=>!selected||i.id===selected).map(i => `<div class="house-inventory-item"><span>${i.icon}</span><div><b>${i.name}</b><small>${S.hidden[i.id]?'В коробке':HOUSE_ROOMS.find(r=>r.id===House.itemRoom(i.id)).name}</small><div class="house-place-buttons">${rooms.map(r=>`<button class="btn sm ${!S.hidden[i.id]&&House.itemRoom(i.id)===r.id?'primary':''}" data-place="${i.id}" data-room="${r.id}">${r.icon} ${r.name}</button>`).join('')}<button class="btn sm" data-place="${i.id}" data-room="box">📦 В коробку</button></div></div></div>`).join('') || '<p>Первые подарки ждут в магазине!</p>'}</div>`, buttons: [{label:'Готово',cls:'primary'}] });
    m.addEventListener('click',ev=>{
      const b=ev.target.closest('[data-place]'); if(!b) return;
      const id=b.dataset.place, room=b.dataset.room;
      if (!S.owned[id] || (room !== 'box' && !rooms.some(r=>r.id===room))) return;
      S.hidden[id]=room==='box';
      if(room!=='box') S.house.placements[id]=room;
      save(); render(); m.close(); House.inventory(selected);
    });
  },
  openStation(id) {
    const s = HOUSE_STATIONS.find(x=>x.id===id); if (!s) return;
    if (!House.unlocked(s)) return House.unlocks();
    if (petStage()===0) return toast('Получи первую звезду — питомец вылупится и будет играть с тобой!');
    const m=modal({cls:'sheet house-activity',html:`<div class="activity-heading"><span>${s.icon}</span><div><small>ИГРАЕМ ВМЕСТЕ</small><h2>${s.name}</h2></div></div><p>${s.desc}</p><div id="houseActivity"></div>`,buttons:[{label:'В комнату',cls:'primary'}],onClose:()=>{save();if(TAB==='pet')render();}});
    HouseActivities[id](m.querySelector('#houseActivity'));
  },
  remember(id, name, icon) {
    S.house.album[id] = { name, icon, t: Date.now() };
    S.counters.play++; save();
  },
  album() {
    const entries=Object.values(S.house.album).sort((a,b)=>b.t-a.t);
    modal({cls:'sheet',html:`<h2>📒 Наши приключения</h2><p class="small">Здесь живут твои открытия, постройки и первые победы.</p><div class="house-album">${entries.map(e=>`<div><span>${e.icon}</span><b>${U.esc(e.name)}</b><small>${new Date(e.t).toLocaleDateString('ru-RU')}</small></div>`).join('')||'<p>Создай первую постройку или отправляйся в приключение!</p>'}</div>`,buttons:[{label:'Здорово!',cls:'primary'}]});
  },
  festival() {
    if(House.count()<25||!Room.root||Room.busy)return;
    Room.anim('a-dance');Room.melody('dance');confetti(90);
    Room.say('Наш дом полон приключений! Спасибо, друг!',true);
    House.remember('festival','Домашний фестиваль победителей','🎆');
    const g=Room.gen;setTimeout(()=>{if(Room.alive(g))Room.anim('');},2800);
  },
  train(id) {
    if(petStage()===0) return toast('Сначала помоги питомцу вылупиться — получи звезду!');
    const tricks={hop:{name:'Прыжок',seq:['🐾','⬆️','⭐'],anim:'a-hop'},dance:{name:'Танец',seq:['🎵','🐾','🎵','💃'],anim:'a-dance'},bow:{name:'Поклон',seq:['🎩','🐾','⬇️'],anim:'a-hop'}};
    const t=tricks[id]; if(!t) return;
    let at=0,done=false;
    const learned=(S.house.skills[id]||0)>=3;
    const m=modal({cls:'sheet',html:`<h2>🐾 ${t.name}</h2><div class="training-pet">${petSVG({uid:'tr',mood:'happy'})}</div><p>${learned?'Питомец знает этот трюк! Подайте сигналы для выступления.':'Помоги другу запомнить сигналы. После трёх тренировок трюк будет освоен.'}</p><div class="training-signals">${t.seq.join(' → ')}</div><p id="trainMsg" aria-live="polite">Выбери первый сигнал</p><div class="house-tools">${U.shuffle([...new Set(t.seq)]).map(x=>`<button class="btn training-key" data-signal="${x}">${x}</button>`).join('')}</div>`,buttons:[{label:'В домик',cls:'primary'}]});
    m.addEventListener('click',ev=>{
      const b=ev.target.closest('[data-signal]'); if(!b||done)return;
      if(b.dataset.signal!==t.seq[at]) {m.querySelector('#trainMsg').textContent='Попробуем ещё: посмотри на следующий сигнал.';Sound.play('tap');return;}
      at++; Sound.play('pop');
      m.querySelector('#trainMsg').textContent=`Получилось ${at} из ${t.seq.length}!`;
      if(at===t.seq.length){done=true;S.house.skills[id]=Math.min(3,(S.house.skills[id]||0)+1);House.remember('trick_'+id,t.name+': тренируемся вместе','🐾');m.querySelector('.training-pet').classList.add(t.anim);m.querySelector('#trainMsg').textContent=learned?'Браво! Питомец выступает для тебя!':`Отличная команда! Трюк освоен на ${S.house.skills[id]}/3.`;Sound.play('star');}
    });
  },
};

const HouseActivities = {
  blocks(root) { HouseActivities.pixel(root, 'building', 10, 7, ['#FFE9B5','#AC8BFF','#67CFBA','#FF8C98','#70B9EF','#F7C94E'], 'Моя постройка', '🏰'); },
  art(root) { HouseActivities.pixel(root, 'painting', 16, 10, ['#FFFFFF','#6B50BE','#FF8C98','#67CFBA','#70B9EF','#F7C94E','#F28B56','#30436C'], 'Картина для нашего дома', '🖼️'); },
  pixel(root,key,w,h,colors,name,icon) {
    const old=S.house[key];
    const cells=Array.isArray(old)&&old.length===w*h?old.slice():Array(w*h).fill('');
    let color=colors[1],mirror=false,painting=false;
    root.innerHTML=`<div class="activity-palette">${colors.map(c=>`<button style="--paint:${c}" data-color="${c}" aria-label="Цвет ${c}"></button>`).join('')}<button data-color="" aria-label="Ластик">🧽</button></div><p class="small">Выбери цвет и рисуй пальцем. Цвет можно менять сколько угодно.</p>${key==='painting'&&House.count()>=5?'<label class="mirror-switch"><input type="checkbox" id="mirrorPaint"> 🪞 Рисовать зеркально</label>':''}<div class="pixel-board ${key}" style="--cols:${w}">${cells.map((c,i)=>`<button data-cell="${i}" style="background:${c||'#FFFFFF'}" aria-label="Клетка ${i+1}"></button>`).join('')}</div><div class="house-tools"><button class="btn primary" data-save-art>💾 Сохранить</button><button class="btn" data-clear-art>🧽 Очистить</button></div><p class="activity-message" aria-live="polite"></p>`;
    const board=root.querySelector('.pixel-board'), msg=root.querySelector('.activity-message');
    const paint=i=>{if(!Number.isInteger(i)||i<0||i>=cells.length)return;const indices=[i];if(mirror)indices.push(Math.floor(i/w)*w+w-1-i%w);indices.forEach(j=>{cells[j]=color;board.children[j].style.background=color||'#FFFFFF';});S.house[key]=cells.slice();};
    const fromPoint=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);if(t&&board.contains(t)&&t.dataset.cell!==undefined)paint(+t.dataset.cell);};
    board.addEventListener('pointerdown',e=>{e.preventDefault();painting=true;board.setPointerCapture(e.pointerId);fromPoint(e);});
    board.addEventListener('pointermove',e=>{if(painting)fromPoint(e);});
    const end=()=>{painting=false;save();};board.addEventListener('pointerup',end);board.addEventListener('pointercancel',end);
    board.addEventListener('click',e=>{const b=e.target.closest('[data-cell]');if(b){paint(+b.dataset.cell);save();}});
    root.addEventListener('click',e=>{
      const b=e.target.closest('[data-color]');if(b){color=b.dataset.color;root.querySelectorAll('[data-color]').forEach(x=>x.classList.toggle('chosen',x===b));}
      if(e.target.closest('[data-save-art]')){House.remember(key,name,icon);msg.textContent='Сохранено! Работа останется здесь и после закрытия приложения.';Sound.play('star');}
      if(e.target.closest('[data-clear-art]'))confirmBox('<h2>Очистить эту работу?</h2><p>Можно сразу начать новую.</p>','Очистить',()=>{cells.fill('');[...board.children].forEach(c=>c.style.background='#FFFFFF');S.house[key]=cells.slice();save();});
    });
    root.querySelector('#mirrorPaint')?.addEventListener('change',e=>{mirror=e.target.checked;});
  },
  music(root) {
    const frequencies=[262,294,330,349,392,440,494];
    let notes=[],target=[],at=0,playing=false;
    root.innerHTML=`<p class="small">Сочини мелодию или выбери «Повтори за питомцем». Слушать можно несколько раз.</p><div class="music-keys">${['До','Ре','Ми','Фа','Соль','Ля','Си'].map((n,i)=>`<button data-note="${i}">${n}</button>`).join('')}</div><div class="house-tools"><button class="btn" data-music="challenge">🐾 Повтори за мной</button><button class="btn" data-music="listen">🔊 Послушать</button><button class="btn" data-music="compose">🎼 Сочинять</button><button class="btn primary" data-music="save">💾 Сохранить мелодию</button></div><p class="activity-message" aria-live="polite">Твоя мелодия: 0 / 16 нот</p>`;
    const msg=root.querySelector('.activity-message');
    const tone=n=>{Sound.init();if(Sound.enabled)Sound.tone(frequencies[n],0,.3,'triangle',.16);};
    const play=async seq=>{if(playing)return;playing=true;for(const n of seq){if(!root.isConnected)break;tone(n);const k=root.querySelector(`[data-note="${n}"]`);k.classList.add('lit');await wait(430);k.classList.remove('lit');}playing=false;};
    root.addEventListener('click',e=>{
      const key=e.target.closest('[data-note]');
      if(key&&!playing){const n=+key.dataset.note;tone(n);if(target.length){if(n===target[at]){at++;msg.textContent=`Верно: ${at} из ${target.length}`;if(at===target.length){House.remember('music','Концерт с питомцем','🎹');msg.textContent='Браво! Ты повторил всю мелодию. Можно попробовать новую.';target=[];at=0;}}else{at=0;msg.textContent='Начнём сначала. Послушай мелодию ещё раз.';}}else if(notes.length<16){notes.push(n);msg.textContent=`Твоя мелодия: ${notes.length} / 16 нот`;}}
      const b=e.target.closest('[data-music]');if(!b||playing)return;
      const act=b.dataset.music;
      if(act==='challenge'){target=Array.from({length:Math.min(6,3+Math.floor(House.count()/5))},()=>mr(0,6));at=0;msg.textContent='Слушай, затем сыграй эти ноты в том же порядке.';play(target);}
      if(act==='listen'){const seq=target.length?target:notes.length?notes:S.house.melody||[];if(seq.length)play(seq);else msg.textContent='Сначала сыграй несколько нот.';}
      if(act==='compose'){notes=[];target=[];at=0;msg.textContent='Сочиняем новую мелодию: 0 / 16 нот';}
      if(act==='save'){if(!notes.length){msg.textContent='Сначала сочини мелодию.';return;}S.house.melody=notes.slice();House.remember('melody','Моя первая мелодия','🎼');msg.textContent='Мелодия сохранена! Кнопка «Послушать» сыграет её при следующем визите.';}
    });
  },
  stars(root) {
    let seq=[],at=0,coords=[];
    root.innerHTML='<p class="small">Найди закономерность и нажимай на звёзды по порядку. Неверный выбор можно исправить.</p><div class="constellation"></div><p class="activity-message" aria-live="polite"></p><button class="btn" data-new-stars>✨ Новый маршрут</button>';
    const board=root.querySelector('.constellation'),msg=root.querySelector('.activity-message');
    const fresh=()=>{const step=House.count()>=18&&Math.random()<.5?-U.rnd([2,3,4,5]):U.rnd([2,3,4,5]),start=step<0?mr(40,70):mr(1,6);seq=Array.from({length:6},(_,i)=>start+i*step);at=0;coords=U.shuffle([[12,22],[39,14],[72,20],[86,52],[58,72],[22,72]]);board.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>`+U.shuffle(seq).map(n=>{const i=seq.indexOf(n);return `<button data-star="${n}" style="left:${coords[i][0]}%;top:${coords[i][1]}%">${n}</button>`;}).join('');msg.textContent=`Начни с ${start}, каждый раз ${step<0?'вычитай':'прибавляй'} ${Math.abs(step)}.`;};
    root.addEventListener('click',e=>{if(e.target.closest('[data-new-stars]'))return fresh();const b=e.target.closest('[data-star]');if(!b||at>=seq.length)return;if(+b.dataset.star!==seq[at]){msg.textContent=`Следующая звезда ${seq[1]>seq[0]?'больше':'меньше'} предыдущей на ${Math.abs(seq[1]-seq[0])}. Попробуй ещё!`;return;}b.classList.add('found');if(at){const a=coords[at-1],c=coords[at];board.querySelector('svg').insertAdjacentHTML('beforeend',`<line x1="${a[0]}" y1="${a[1]}" x2="${c[0]}" y2="${c[1]}"/>`);}at++;Sound.play('pop');msg.textContent=at===seq.length?'Созвездие открыто! Оно записано в альбом.':`Нашли ${at} из ${seq.length}. Продолжай закономерность.`;if(at===seq.length)House.remember('stars','Наше созвездие','🌟');});fresh();
  },
  aquarium(root) {
    const state=S.house.aquarium;let fed=false;
    root.innerHTML=`<div class="home-aquarium"><div class="aquarium-fish"></div><div class="aquarium-plants">🌿 🪸 🌱 🐚 🌿</div></div><div class="house-tools">${(House.count()>=12?['🐠','🐟','🐡','🐙','🐢']:['🐠','🐟','🐡']).map(f=>`<button class="btn" data-fish="${f}">＋ ${f}</button>`).join('')}<button class="btn" data-aqua="feed">🥣 Покормить</button><button class="btn" data-aqua="sky">🌊 Сменить воду</button></div><p class="activity-message" aria-live="polite">Нажми на рыбку, чтобы переселить её в другой аквариум. Здесь помещается 8 рыбок.</p>`;
    const tank=root.querySelector('.home-aquarium'),fish=root.querySelector('.aquarium-fish'),msg=root.querySelector('.activity-message');
    const draw=()=>{fish.innerHTML=state.fish.map((f,i)=>`<button data-remove-fish="${i}" style="left:${8+(i*29)%76}%;top:${15+(i*23)%52}%;--delay:${i*.3}s" aria-label="Переселить рыбку">${f}</button>`).join('');tank.dataset.water=state.water;save();};
    root.addEventListener('click',e=>{const f=e.target.closest('[data-fish]');if(f){if(state.fish.length>=8){msg.textContent='В аквариуме уже 8 рыбок. Сначала пересели одну.';return;}state.fish.push(f.dataset.fish);draw();House.remember('aquarium','Мой подводный сад','🐠');}const rm=e.target.closest('[data-remove-fish]');if(rm){state.fish.splice(+rm.dataset.removeFish,1);draw();}const b=e.target.closest('[data-aqua]');if(!b)return;if(b.dataset.aqua==='sky'){state.water=(state.water+1)%3;draw();}else{if(!state.fish.length){msg.textContent='Сначала засели рыбок.';return;}fed=!fed;tank.classList.toggle('feeding',fed);msg.textContent='Рыбки плывут к угощению!';Sound.play('pet');}});draw();
  },
  theatre(root) {
    const stories=[
      ['Находка в саду',['Питомец нашёл под кустом семечко.','Мы посадили его в горшок и полили.','Вскоре появился зелёный росток.','На окне расцвёл удивительный цветок!'],['🌰','🪴','🌱','🌻']],
      ['Письмо другу',['Мы решили пригласить друга в гости.','Питомец нарисовал открытку, а я написал адрес.','Почтальон доставил наше письмо.','Друг пришёл, и мы устроили чаепитие.'],['💌','✍️','📮','🫖']],
      ['Звёздная ночь',['На небе появилась первая звезда.','Мы вынесли телескоп к окну.','Питомец заметил необычное созвездие.','Мы нарисовали его в альбоме открытий.'],['🌠','🔭','✨','📒']],
    ];let story,order=[],done=false;
    const fresh=()=>{story=U.rnd(stories);order=[];done=false;root.innerHTML=`<p>Восстанови историю «${story[0]}»: нажимай на события от первого к последнему.</p><div class="story-stage">${petSVG({uid:'actor',mood:'happy'})}<span id="stageProp">🎭</span></div><div class="story-cards">${U.shuffle(story[1].map((s,i)=>({s,i}))).map(x=>`<button data-story="${x.i}">${x.s}</button>`).join('')}</div><p class="activity-message" aria-live="polite"></p><button class="btn" data-new-story>🎬 Другая история</button>`;};
    root.addEventListener('click',e=>{if(e.target.closest('[data-new-story]'))return fresh();const b=e.target.closest('[data-story]');if(!b||done||b.disabled)return;const i=+b.dataset.story,msg=root.querySelector('.activity-message');if(i!==order.length){msg.textContent='Что должно случиться раньше? Посмотри на начало истории.';return;}order.push(i);b.disabled=true;b.classList.add('right');root.querySelector('#stageProp').textContent=story[2][i];msg.textContent=story[1][i];Sound.play('pop');if(order.length===4){done=true;House.remember('theatre_'+stories.indexOf(story),story[0],'🎭');msg.textContent+=' Занавес! История сохранена в альбоме.';Sound.play('star');}});fresh();
  },
};
