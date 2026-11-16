'use strict';
/* Пространственные головоломки: выбрать деталь, повернуть, заполнить силуэт. */
const ShapeGame = {
  levels: [
    {name:'Башня',n:5,pieces:[[[0,0],[0,1],[1,0],[1,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[1,1],[2,1]]],places:[[0,1],[1,0],[2,2]]},
    {name:'Корабль',n:6,pieces:[[[0,0],[1,0],[2,0],[2,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,1]],[[0,0],[0,1],[1,0],[1,1]]],places:[[0,1],[0,3],[3,1],[4,0]]},
    {name:'Кристалл',n:6,pieces:[[[0,0],[0,1],[1,1],[1,2]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,1]]],places:[[0,1],[2,0],[2,2],[4,2]]},
    {name:'Робот',n:6,pieces:[[[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[1,0],[1,1]]],places:[[0,2],[2,1],[3,1],[3,4],[3,2]]},
  ],
  normalize(shape) {const minR=Math.min(...shape.map(p=>p[0])),minC=Math.min(...shape.map(p=>p[1]));return shape.map(([r,c])=>[r-minR,c-minC]);},
  transform(shape,turns,flip=false) {
    let result=shape.map(([r,c])=>[r,flip?-c:c]);
    for(let i=0;i<turns;i++)result=result.map(([r,c])=>[c,-r]);
    return ShapeGame.normalize(result);
  },
  mask(level) {return new Set(level.pieces.flatMap((shape,i)=>shape.map(([r,c])=>(r+level.places[i][0])*level.n+c+level.places[i][1])));},
  pieceSVG(shape,color) {
    const rows=Math.max(...shape.map(p=>p[0]))+1,cols=Math.max(...shape.map(p=>p[1]))+1;
    return `<svg viewBox="0 0 ${cols*24} ${rows*24}" aria-hidden="true">${shape.map(([r,c])=>`<rect x="${c*24+1}" y="${r*24+1}" width="22" height="22" rx="4" fill="${color}"/>`).join('')}</svg>`;
  },
  valid(level,placements,id,shape,row,col) {
    const mask=ShapeGame.mask(level),used=new Set(placements.filter(p=>p.id!==id).flatMap(p=>p.cells));
    const cells=shape.map(([r,c])=>[r+row,c+col]);
    return cells.every(([r,c])=>r>=0&&c>=0&&r<level.n&&c<level.n&&mask.has(r*level.n+c)&&!used.has(r*level.n+c));
  },
  solve(level, fixed, allowFlip) {
    const ids=level.pieces.map((_,i)=>i).filter(i=>!fixed.some(p=>p.id===i));
    const search=(placed,remaining)=>{
      if(!remaining.length)return [];
      let best=null;
      for(const id of remaining){
        const seen=new Set(),options=[];
        for(const flip of allowFlip?[false,true]:[false])for(let turns=0;turns<4;turns++){
          const shape=ShapeGame.transform(level.pieces[id],turns,flip),signature=shape.map(p=>p.join(',')).sort().join(';');
          if(seen.has(signature))continue;seen.add(signature);
          for(let row=0;row<level.n;row++)for(let col=0;col<level.n;col++)if(ShapeGame.valid(level,placed,id,shape,row,col))options.push({id,turns,flip,row,col,cells:shape.map(([r,c])=>(r+row)*level.n+c+col)});
        }
        if(!options.length)return null;
        if(!best||options.length<best.options.length)best={id,options};
      }
      for(const option of best.options){const tail=search([...placed,option],remaining.filter(id=>id!==best.id));if(tail)return [option,...tail];}
      return null;
    };
    return search(fixed,ids);
  },
  preview(level,placements) {
    return `<svg viewBox="0 0 ${level.n*24} ${level.n*24}" class="work-svg" aria-hidden="true"><rect width="100%" height="100%" rx="8" fill="#F3EDFA"/>${placements.map(p=>p.cells.map(i=>`<rect x="${i%level.n*24+1}" y="${Math.floor(i/level.n)*24+1}" width="22" height="22" rx="4" fill="${Play.colors[p.id]}"/>`).join('')).join('')}</svg>`;
  },
  mount(root) {
    const state=Play.state('shapes',{level:0,boards:{},wins:{}});
    const render=()=>{
      const number=state.level,level=ShapeGame.levels[number],mask=ShapeGame.mask(level);
      const board=state.boards[number]||(state.boards[number]={placements:[],turns:Object.fromEntries(level.pieces.map((_,i)=>[i,(i+number+1)%4])),flips:{}});
      let selected=level.pieces.findIndex((_,i)=>!board.placements.some(p=>p.id===i));
      const body=Play.shell(root,{goal:'Собери: '+level.name,icon:'🧩',help:'Выбери деталь снизу и нажми на её место на тени. ↻ поворачивает деталь, ↶ возвращает последнюю.',level:number,levels:ShapeGame.levels.length,change:i=>{state.level=i;save();render();}});
      body.classList.add('shape-body');
      body.innerHTML=`<div class="shape-layout"><div class="shape-board" style="--n:${level.n}">${Array.from({length:level.n**2},(_,i)=>`<button data-shape-cell="${i}" class="${mask.has(i)?'target':'outside'}" aria-label="Клетка ${i+1}"></button>`).join('')}</div><div class="shape-tray">${level.pieces.map((shape,i)=>`<button data-piece="${i}" aria-label="Деталь ${i+1}">${ShapeGame.pieceSVG(shape,Play.colors[i])}</button>`).join('')}</div></div><div class="play-controls"><button class="btn" data-shape-undo aria-label="Вернуть деталь">↶</button><button class="btn" data-shape-turn>↻ Повернуть</button>${House.count()>=5?'<button class="btn" data-shape-flip>⇋ Отразить</button>':''}<button class="btn" data-shape-hint>💡</button></div><div class="shape-progress" aria-label="Собрано деталей"></div>`;
      const grid=body.querySelector('.shape-board'),cells=[...grid.children];
      const current=()=>selected<0?[]:ShapeGame.transform(level.pieces[selected],board.turns[selected]||0,board.flips[selected]||false);
      const draw=()=>{
        cells.forEach((c,i)=>{const piece=board.placements.find(p=>p.cells.includes(i));c.style.background=piece?Play.colors[piece.id]:'';c.classList.remove('ghost','invalid','point-here');});
        body.querySelectorAll('[data-piece]').forEach(b=>{const id=+b.dataset.piece,placed=board.placements.some(p=>p.id===id);b.disabled=placed;b.setAttribute('aria-pressed',String(id===selected));b.innerHTML=ShapeGame.pieceSVG(ShapeGame.transform(level.pieces[id],board.turns[id]||0,board.flips[id]||false),Play.colors[id]);});
        body.querySelector('[data-shape-undo]').disabled=!board.placements.length;
        body.querySelector('[data-shape-turn]').disabled=selected<0;
        body.querySelector('[data-shape-flip]')?.toggleAttribute('disabled',selected<0);
        body.querySelector('.shape-progress').innerHTML=level.pieces.map((_,i)=>`<i class="${i<board.placements.length?'done':''}"></i>`).join('');save();
      };
      const place=index=>{
        if(selected<0)return;
        const row=Math.floor(index/level.n),col=index%level.n,shape=current();
        if(!ShapeGame.valid(level,board.placements,selected,shape,row,col)){Play.message(root,'Пока не помещается. Попробуй повернуть ↻');cells[index].classList.add('invalid');return;}
        board.placements.push({id:selected,cells:shape.map(([r,c])=>(r+row)*level.n+c+col)});
        selected=level.pieces.findIndex((_,i)=>!board.placements.some(p=>p.id===i));Sound.play('pop');draw();
        if(selected<0){state.wins[number]=true;Play.award(root,'shape_'+number,level.name+' из деталей','🧩',ShapeGame.preview(level,board.placements));}
        else Play.message(root,'Есть! Теперь следующая деталь.');
      };
      const hint=()=>{
        if(selected<0)return;
        const solution=ShapeGame.solve(level,board.placements,House.count()>=5);
        if(!solution){Play.message(root,'Верни последнюю деталь ↶ — всем нужно место.');return;}
        const next=solution.find(p=>p.id===selected);if(!next)return;
        board.turns[selected]=next.turns;board.flips[selected]=next.flip;draw();
        cells[next.row*level.n+next.col].classList.add('point-here');Play.message(root,'👆 Деталь повёрнута. Попробуй подсвеченное место.');
      };
      root._demonstrate=hint;
      body.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>{selected=+b.dataset.piece;draw();});
      body.querySelectorAll('[data-piece]').forEach(button=>{
        button.addEventListener('pointerdown',e=>{
          if(button.disabled)return;
          const id=+button.dataset.piece,start={x:e.clientX,y:e.clientY};
          selected=id;draw();let ghost=null,moved=false;
          button.setPointerCapture(e.pointerId);
          const move=ev=>{
            if(!moved&&Math.hypot(ev.clientX-start.x,ev.clientY-start.y)<8)return;
            moved=true;
            const rect=grid.getBoundingClientRect(),unit=rect.width/level.n,shape=current();
            if(!ghost){ghost=document.createElement('div');ghost.className='shape-drag-ghost';ghost.innerHTML=ShapeGame.pieceSVG(shape,Play.colors[id]);document.body.appendChild(ghost);}
            ghost.style.width=((Math.max(...shape.map(p=>p[1]))+1)*unit)+'px';
            ghost.style.height=((Math.max(...shape.map(p=>p[0]))+1)*unit)+'px';
            ghost.style.left=(ev.clientX-unit/2)+'px';ghost.style.top=(ev.clientY-unit/2)+'px';
            cells.forEach(c=>c.classList.remove('ghost'));
            const row=Math.floor((ev.clientY-rect.top)/unit),col=Math.floor((ev.clientX-rect.left)/unit);
            if(ShapeGame.valid(level,board.placements,id,shape,row,col))shape.forEach(([r,c])=>cells[(r+row)*level.n+c+col]?.classList.add('ghost'));
          };
          const end=ev=>{
            button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',end);button.removeEventListener('pointercancel',cancel);
            ghost?.remove();cells.forEach(c=>c.classList.remove('ghost'));
            if(moved){const rect=grid.getBoundingClientRect(),unit=rect.width/level.n;const row=Math.floor((ev.clientY-rect.top)/unit),col=Math.floor((ev.clientX-rect.left)/unit);if(row>=0&&col>=0&&row<level.n&&col<level.n)place(row*level.n+col);}
          };
          const cancel=()=>{ghost?.remove();button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',end);button.removeEventListener('pointercancel',cancel);button.removeEventListener('lostpointercapture',cancel);cells.forEach(c=>c.classList.remove('ghost'));};
          root._cleanup=cancel;
          button.addEventListener('pointermove',move);button.addEventListener('pointerup',end);button.addEventListener('pointercancel',cancel);
          button.addEventListener('lostpointercapture',cancel,{once:true});
        });
      });
      grid.addEventListener('click',e=>{const b=e.target.closest('[data-shape-cell]');if(b)place(+b.dataset.shapeCell);});
      body.querySelector('[data-shape-turn]').onclick=()=>{if(selected<0)return;board.turns[selected]=((board.turns[selected]||0)+1)%4;draw();Sound.play('tap');};
      body.querySelector('[data-shape-flip]')?.addEventListener('click',()=>{if(selected<0)return;board.flips[selected]=!board.flips[selected];draw();});
      body.querySelector('[data-shape-undo]').onclick=()=>{const old=board.placements.pop();if(old){selected=old.id;draw();Play.message(root,'Деталь вернулась. Можно поставить иначе.');}};
      body.querySelector('[data-shape-hint]').onclick=hint;
      root._shapes={level,board,place};draw();
    };
    render();
  },
};
