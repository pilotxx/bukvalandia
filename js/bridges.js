'use strict';
/* Поворот дорожек → пробный проход питомца → исправление маршрута. */
const BridgeGame = {
  directions: [[-1,0],[0,1],[1,0],[0,-1]],
  levels: [
    {n:4, path:[[1,0],[1,1],[2,1],[2,2],[2,3]]},
    {n:5, path:[[2,0],[1,0],[1,1],[1,2],[2,2],[3,2],[3,3],[3,4]]},
    {n:5, path:[[0,0],[0,1],[1,1],[1,2],[1,3],[2,3],[3,3],[3,2],[3,1],[4,1],[4,2],[4,3],[4,4]]},
    {n:6, path:[[3,0],[3,1],[2,1],[1,1],[1,2],[1,3],[2,3],[3,3],[4,3],[4,4],[4,5]]},
    {n:6, path:[[5,0],[4,0],[3,0],[3,1],[3,2],[2,2],[1,2],[1,3],[1,4],[2,4],[3,4],[3,5]]},
    {n:6, path:[[0,0],[0,1],[1,1],[2,1],[2,2],[3,2],[4,2],[4,3],[4,4],[3,4],[2,4],[2,5]]},
  ],
  rotate(mask, turns) {
    let out = 0;
    for (let d=0; d<4; d++) if(mask & (1<<d)) out |= 1<<((d+turns)%4);
    return out;
  },
  solution(level) {
    const {n,path} = level;
    return path.map(([r,c],i) => {
      const prev = i ? path[i-1] : [r,-1], next = i+1<path.length ? path[i+1] : [r,n];
      const dirs = [prev,next].map(([y,x])=>BridgeGame.directions.findIndex(([dy,dx])=>y-r===dy&&x-c===dx));
      return {index:r*n+c, mask:(1<<dirs[0])|(1<<dirs[1])};
    });
  },
  create(level) {
    const cells = Array.from({length:level.n**2},()=>({mask:U.rnd([3,6,9,12,5,10]),turns:mr(0,3)}));
    BridgeGame.solution(level).forEach((p,i)=>{cells[p.index]={mask:p.mask,turns:i%3===0?0:mr(1,3)};});
    return {cells,history:[],done:false};
  },
  trace(level, board) {
    const {n,path} = level, visited=new Set(), route=[];
    let r=path[0][0], c=0, incoming=3;
    while(r>=0&&r<n&&c>=0&&c<n) {
      const index=r*n+c;
      if(visited.has(index)) return {route,stop:index,win:false};
      visited.add(index);route.push(index);
      const mask=BridgeGame.rotate(board.cells[index].mask,board.cells[index].turns);
      if(!(mask&(1<<incoming))) return {route,stop:index,win:false};
      const outgoing=[0,1,2,3].find(d=>d!==incoming&&(mask&(1<<d)));
      if(outgoing===undefined) return {route,stop:index,win:false};
      const [dy,dx]=BridgeGame.directions[outgoing];r+=dy;c+=dx;incoming=(outgoing+2)%4;
      if(c===n&&r===path[path.length-1][0]) return {route,stop:null,win:true};
    }
    return {route,stop:route.at(-1),win:false};
  },
  tileSVG(mask) {
    const ends=[[50,0],[100,50],[50,100],[0,50]];
    const d=ends.filter((_,i)=>mask&(1<<i)).map(([x,y])=>`M50 50 L${x} ${y}`).join(' ');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${d}" stroke="#805A3D" stroke-width="30" fill="none"/><path d="${d}" stroke="#F6D9A5" stroke-width="20" fill="none"/><circle cx="50" cy="50" r="8" fill="#F6D9A5"/></svg>`;
  },
  preview(level, board) {
    const solution=BridgeGame.solution(level),n=level.n;
    return `<svg viewBox="0 0 ${n*25} ${n*25}" class="work-svg" aria-hidden="true"><rect width="100%" height="100%" rx="8" fill="#B5DEE5"/>${solution.map(p=>{const r=Math.floor(p.index/n),c=p.index%n;return `<g transform="translate(${c*25} ${r*25}) scale(.25)">${BridgeGame.tileSVG(p.mask).replace(/<svg[^>]*>|<\/svg>/g,'')}</g>`;}).join('')}</svg>`;
  },
  mount(root) {
    const state=Play.state('bridges',{level:0,boards:{},wins:{}});
    let generation=0;
    const render=()=>{
      generation++;
      const number=state.level,level=BridgeGame.levels[number];
      const board=state.boards[number]||(state.boards[number]=BridgeGame.create(level));
      const body=Play.shell(root,{goal:'Проведи питомца к сундуку',icon:'🌉',help:'Нажимай на дорожки: они поворачиваются. Затем нажми ▶. На красном месте путь нужно починить.',level:number,levels:BridgeGame.levels.length,change:i=>{state.level=i;save();render();}});
      body.classList.add('bridge-body');
      let busy=false;
      body.innerHTML=`<div class="bridge-route-caption"><span>🐾 Старт</span><span>🏁 Сундук</span></div><div class="bridge-board" style="--n:${level.n}">${board.cells.map((tile,i)=>`<button class="bridge-tile" data-bridge="${i}" aria-label="Повернуть дорожку ${i+1}">${BridgeGame.tileSVG(BridgeGame.rotate(tile.mask,tile.turns))}</button>`).join('')}<div class="bridge-runner" aria-hidden="true">${Play.miniPet('runner')}</div><span class="bridge-entry" style="top:${(level.path[0][0]+.5)/level.n*100}%">➜</span><span class="bridge-exit" style="top:${(level.path.at(-1)[0]+.5)/level.n*100}%">🎁</span></div><div class="play-controls"><button class="btn" data-bridge-undo ${board.history.length?'':'disabled'} aria-label="Отменить поворот">↶</button><button class="btn primary" data-bridge-run>▶ Пустить</button><button class="btn" data-bridge-hint>💡 Намёк</button></div>`;
      const grid=body.querySelector('.bridge-board'),runner=body.querySelector('.bridge-runner');
      const tiles=[...grid.querySelectorAll('[data-bridge]')];
      const refresh=()=>{
        tiles.forEach((el,i)=>{el.innerHTML=BridgeGame.tileSVG(BridgeGame.rotate(board.cells[i].mask,board.cells[i].turns));el.classList.remove('passed','blocked','point-here');});
        body.querySelector('[data-bridge-undo]').disabled=!board.history.length;
        runner.style.opacity='0';save();
      };
      const hint=()=>{
        const p=BridgeGame.solution(level).find(p=>BridgeGame.rotate(board.cells[p.index].mask,board.cells[p.index].turns)!==p.mask);
        if(p){tiles[p.index].classList.add('point-here');Play.message(root,'👆 Попробуй повернуть эту дорожку.');}
        else Play.message(root,'Путь готов. Нажми ▶!');
      };
      root._demonstrate=hint;
      grid.addEventListener('click',e=>{
        const b=e.target.closest('[data-bridge]');if(!b||busy)return;
        const i=+b.dataset.bridge;board.history.push({i,turns:board.cells[i].turns});board.history=board.history.slice(-30);
        board.cells[i].turns=(board.cells[i].turns+1)%4;board.done=false;refresh();Sound.play('tap');
      });
      body.querySelector('[data-bridge-undo]').onclick=()=>{if(busy)return;const old=board.history.pop();if(old){board.cells[old.i].turns=old.turns;refresh();}};
      body.querySelector('[data-bridge-hint]').onclick=hint;
      body.querySelector('[data-bridge-run]').onclick=async()=>{
        if(busy)return;busy=true;
        const mine=generation;
        const result=BridgeGame.trace(level,board);
        body.querySelectorAll('button').forEach(b=>b.disabled=true);
        runner.style.opacity='1';
        for(const i of result.route){
          if(!Play.alive(root)||mine!==generation)return;
          runner.style.left=((i%level.n+.5)/level.n*100)+'%';runner.style.top=((Math.floor(i/level.n)+.5)/level.n*100)+'%';
          tiles[i].classList.add('passed');await wait(280);
        }
        if(!Play.alive(root)||mine!==generation)return;
        if(result.win){board.done=true;state.wins[number]=true;Play.award(root,'bridge_'+number,'Мост №'+(number+1),'🌉',BridgeGame.preview(level,board));}
        else {tiles[result.stop]?.classList.add('blocked');Play.message(root,'Здесь путь оборвался. Поверни дорожку и попробуй ещё.');Sound.play('tap');}
        busy=false;body.querySelectorAll('button').forEach(b=>b.disabled=false);body.querySelector('[data-bridge-undo]').disabled=!board.history.length;save();
      };
      root._bridge={level,board,trace:()=>BridgeGame.trace(level,board)};
      root._cleanup=()=>{generation++;};
      save();
    };
    render();
  },
};
