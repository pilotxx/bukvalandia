'use strict';
/* Общие элементы новых игр. Все результаты остаются в прежнем сохранении. */
const Play = {
  colors: ['#8A73D6', '#F3B75C', '#64B7AD', '#EC899A', '#659FCB'],
  state(id, initial) {
    S.house.play = S.house.play || {};
    if (!S.house.play[id]) S.house.play[id] = JSON.parse(JSON.stringify(initial));
    return S.house.play[id];
  },
  alive(root) {
    return root.isConnected && !root.closest('.modal-wrap')?.classList.contains('out');
  },
  shell(root, { goal, help, icon = '🐾', level, levels, change }) {
    root.innerHTML = `<div class="play-goal"><span>${icon}</span><b>${U.esc(goal)}</b>
      <button class="play-help" aria-label="Показать, как играть" data-play-help>?</button></div>
      ${levels ? `<div class="play-levels" aria-label="Выбор задачи">${Array.from({length:levels}, (_, i) => `<button data-play-level="${i}" aria-label="Задача ${i+1}" aria-pressed="${i===level}">${i+1}</button>`).join('')}</div>` : ''}
      <p class="play-help-text" hidden>${U.esc(help)}</p><div class="play-body"></div>
      <p class="play-message" role="status" aria-live="polite"></p>`;
    root.querySelector('[data-play-help]').onclick = () => {
      const note = root.querySelector('.play-help-text'); note.hidden = !note.hidden;
      if (root._demonstrate) root._demonstrate();
    };
    root.querySelectorAll('[data-play-level]').forEach(b => {
      b.onclick = () => change(+b.dataset.playLevel);
    });
    return root.querySelector('.play-body');
  },
  message(root, text, good = false) {
    const line = root.querySelector('.play-message');
    if (line) { line.textContent = text; line.classList.toggle('success', good); }
  },
  award(root, key, name, icon, preview) {
    S.house.gallery = S.house.gallery || {};
    const fresh = !S.house.gallery[key];
    S.house.gallery[key] = { name, icon, preview, t: Date.now() };
    if (fresh) House.remember(key, name, icon);
    Play.registerWorks(); save();
    Play.message(root, fresh ? 'Получилось! Работа сохранена в альбоме.' : 'Получилось! Можно попробовать другую задачу.', true);
    root.querySelector('.play-exhibit')?.remove();
    const exhibit=document.createElement('button');exhibit.className='btn play-exhibit';exhibit.textContent='🖼️ Выставить в комнате';
    exhibit.onclick=()=>House.inventory('work_'+key);root.appendChild(exhibit);
    if (fresh) Sound.play('star');
  },
  registerWorks() {
    Object.entries(S.house.gallery || {}).forEach(([key, work], i) => {
      if(!/^[a-z0-9_]{1,80}$/.test(key)||!work||typeof work!=='object')return;
      const id = 'work_' + key;
      if (!ITEMS[id]) {
        const item = {id, cat:'decor', icon:'🖼️', name:U.esc(String(work.name||'Наша работа').slice(0,80)), gallery:key, zone:'wall', x:90+(i%5)*110, y:75+Math.floor(i/5)%2*95, h:82, ps:1, play:'look'};
        ITEMS[id] = item; HOUSE_ITEMS.push(item);
      }
      S.owned[id] = true;
      if(S.hidden[id]===undefined)S.hidden[id]=true;
    });
  },
  preview(key) {
    const work = S.house.gallery?.[key];
    if(typeof work?.preview!=='string'||work.preview.length>20000)return '🖼️';
    const template=document.createElement('template');template.innerHTML=work.preview;
    const tags=new Set(['svg','g','path','rect','circle','line','text','ellipse','polygon','polyline','div','span','i']);
    const attrs=new Set(['viewbox','width','height','x','y','x1','y1','x2','y2','rx','ry','r','cx','cy','d','points','fill','stroke','stroke-width','transform','font-size','class','style','aria-hidden']);
    template.content.querySelectorAll('*').forEach(el=>{
      if(!tags.has(el.tagName.toLowerCase())){el.remove();return;}
      [...el.attributes].forEach(a=>{
        const name=a.name.toLowerCase(),value=a.value;
        if(!attrs.has(name)||/url\s*\(|javascript:|data:/i.test(value)||(name==='style'&&!/^(?:background|color):\s*#[0-9a-f]{3,8};?$/i.test(value))||(name==='class'&&!/^(?:work-svg|work-comic|work-notes)$/.test(value)))el.removeAttribute(a.name);
      });
    });
    return template.innerHTML;
  },
  miniPet(uid, mood = 'happy') { return petSVG({uid, mood}); },
};

/* Более содержательные игры подключаются после старых функций: старые рисунки
   building/painting сохраняются и доступны в альбоме как наброски. */
HouseActivities.blocks = root => BridgeGame.mount(root);
HouseActivities.art = root => ShapeGame.mount(root);

const houseMigrateBeforePlay = House.migrate.bind(House);
House.migrate = function () { houseMigrateBeforePlay(); Play.registerWorks(); };

House.activities = function () {
  const m = modal({cls:'sheet play-menu', html:`<h2>Во что сыграем?</h2><div class="play-menu-grid">${HOUSE_STATIONS.map(s => `<button data-choose-game="${s.id}" class="${House.unlocked(s)?'':'locked'}"><span>${s.icon}</span><b>${s.name}</b><small>${House.unlocked(s)?'▶ Играть':`🏆 ${House.count()}/${s.at}`}</small></button>`).join('')}</div>`, buttons:[{label:'В комнату',cls:'ghost'}]});
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-choose-game]'); if (!b) return;
    const s = HOUSE_STATIONS.find(x=>x.id===b.dataset.chooseGame);
    if (!House.unlocked(s)) { m.close(); House.unlocks(); return; }
    m.close(); House.openStation(s.id);
  });
};

House.album = function () {
  const entries = Object.entries(S.house.album).sort((a,b)=>b[1].t-a[1].t);
  const oldArt = (Array.isArray(S.house.painting) && S.house.painting.some(Boolean)) || (Array.isArray(S.house.building) && S.house.building.some(Boolean));
  const m = modal({cls:'sheet play-album', html:`<h2>Наши работы и открытия</h2><div class="play-gallery">${entries.map(([key,e])=>`<div class="play-gallery-card"><div class="play-preview">${S.house.gallery?.[key] ? Play.preview(key) : U.esc(e.icon||'⭐')}</div><b>${U.esc(e.name)}</b></div>`).join('') || '<p>Пройди первую задачу — здесь появится результат!</p>'}</div>${oldArt?'<button class="btn" data-old-sketches>🖼️ Прежние наброски</button>':''}`, buttons:[{label:'В комнату',cls:'primary'}]});
  m.querySelector('[data-old-sketches]')?.addEventListener('click',()=>{
    const draw = (cells, cols) => `<div class="old-sketch" style="--cols:${cols}">${cells.map(c=>`<i style="background:${/^#[0-9a-f]{6}$/i.test(c)?c:'#fff'}"></i>`).join('')}</div>`;
    modal({cls:'sheet',html:`<h2>Прежние наброски</h2>${draw(S.house.building||[],10)}${draw(S.house.painting||[],16)}`,buttons:[{label:'Готово',cls:'primary'}]});
  });
};
