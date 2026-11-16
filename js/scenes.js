'use strict';

/* Задания с предметами. Все условия остаются обычными JSON-данными. */
function sceneTask(sceneType, prompt, data = {}) {
  return Object.assign({ kind: 'scene', sceneType, prompt, answer: 'ok' }, data);
}

const SceneTasks = {
  check(t, state) {
    if (t.sceneType === 'cart') {
      const counts = state.counts || {};
      if (Object.keys(counts).some(id => !t.items.some(item => item.id === id))) return false;
      let total = 0, count = 0;
      for (const item of t.items) {
        const n = counts[item.id] || 0;
        if (!Number.isInteger(n) || n < 0 || n > (item.max || t.maxItems || 6)) return false;
        total += n * item.price; count += n;
      }
      return count > 0 && count <= (t.maxItems || 6) && total === t.target;
    }
    if (t.sceneType === 'pack') {
      const picked = [...new Set(state.picked || [])].sort();
      return picked.length === t.want.length && picked.join('|') === t.want.slice().sort().join('|');
    }
    if (t.sceneType === 'area') {
      const cells = [...new Set(state.cells || [])];
      if (cells.length !== t.target || cells.some(n => !Number.isInteger(n) || n < 0 || n >= t.cols * t.rows)) return false;
      const xs = cells.map(n => n % t.cols), ys = cells.map(n => Math.floor(n / t.cols));
      const width = Math.max(...xs) - Math.min(...xs) + 1;
      const height = Math.max(...ys) - Math.min(...ys) + 1;
      return width * height === cells.length && (!t.perimeter || 2 * (width + height) === t.perimeter);
    }
    if (t.sceneType === 'match') {
      const links = state.links || [];
      const ids = t.pairs.map(pair => String(pair.id));
      return links.length === ids.length && new Set(links.map(p => p.left)).size === ids.length
        && new Set(links.map(p => p.right)).size === ids.length
        && links.every(p => ids.includes(p.left) && p.left === p.right);
    }
    return false;
  },

  html(t) {
    const tools = '<div class="scene-tools"><button class="btn" data-scene-undo aria-label="Отменить последний ход">↶ Назад</button><button class="btn primary" data-scene-check disabled>Проверить</button></div><p class="scene-message" aria-live="polite"></p>';
    let content = '';
    if (t.sceneType === 'cart') {
      content = `<div class="scene-goal"><span>🧾</span><b>Заказ на ${t.target} 🪙</b><small>до ${t.maxItems || 6} покупок</small></div>
        <div class="scene-shelf">${t.items.map(item => `<button class="scene-item" data-cart-add="${U.esc(item.id)}"><span>${item.icon}</span><b>${U.esc(item.label)}</b><small>${item.price} 🪙</small></button>`).join('')}</div>
        <div class="scene-basket" aria-label="Твой заказ"><span class="scene-basket-icon">🛒</span><div data-cart-basket></div></div>`;
    } else if (t.sceneType === 'pack') {
      content = `<div class="scene-goal"><span>${t.bagIcon || '🎒'}</span><b>${U.esc(t.request || '')}</b></div>
        <div class="scene-shelf">${t.items.map(item => `<button class="scene-item" data-pack-item="${U.esc(item.id)}" aria-pressed="false"><span>${item.icon}</span><b>${U.esc(item.label)}</b><small class="scene-packed-label">＋</small></button>`).join('')}</div>
        <div class="scene-pack-target"><span>${t.bagIcon || '🎒'}</span><div data-pack-basket></div></div>`;
    } else if (t.sceneType === 'area') {
      content = `<div class="scene-goal"><span>🏠</span><b>${t.target} клеток</b><small>${t.perimeter ? `периметр ${t.perimeter}` : 'один прямоугольник'}</small></div>
        <div class="scene-floor" style="--scene-cols:${t.cols}" aria-label="План комнаты">${Array.from({length:t.cols*t.rows}, (_, i) => `<button data-area-cell="${i}" aria-label="Клетка ${i+1}" aria-pressed="false"></button>`).join('')}</div>
        <div class="scene-area-meter"><span>🧱 <b data-area-count>0</b> / ${t.target}</span><small>Нажми или проведи пальцем</small></div>`;
    } else if (t.sceneType === 'match') {
      const column = (side, pairs) => `<div class="scene-match-column">${pairs.map(pair => `<button data-match-${side}="${U.esc(pair.id)}" class="scene-match-card" aria-pressed="false"><i class="scene-link-number"></i><span>${U.esc(pair[side])}</span></button>`).join('')}</div>`;
      content = `<div class="scene-match-help">● → ●</div><div class="scene-matching">${column('left', U.shuffle(t.pairs))}<span class="scene-match-arrow" aria-hidden="true">↔</span>${column('right', U.shuffle(t.pairs))}</div><div class="scene-pair-progress" aria-live="polite">${Array.from({length:t.pairs.length}, () => '<i>○</i>').join('')}</div>`;
    }
    return `<div class="scene-task scene-${t.sceneType}" data-scene-type="${t.sceneType}">${content}${tools}</div>`;
  },

  bind(t, body) {
    const root = body.querySelector('.scene-task');
    const state = { counts: {}, picked: [], cells: [], links: [] };
    const restored = typeof Quest !== 'undefined' ? Quest.sceneState() : null;
    if (restored) Object.assign(state, restored);
    const history = [];
    let selectedLeft = null, submitted = false, painting = false, paintValue = true, painted = new Set();
    root._sceneState = state;
    const message = root.querySelector('.scene-message');
    const check = root.querySelector('[data-scene-check]');
    const undo = root.querySelector('[data-scene-undo]');
    const locked = () => submitted || (typeof L !== 'undefined' && L && L.answered);
    const snapshot = () => history.push(JSON.stringify(state));
    const say = text => { message.textContent = text; };
    const draw = () => {
      undo.disabled = !history.length;
      if (t.sceneType === 'cart') {
        const basket = root.querySelector('[data-cart-basket]');
        const items = t.items.flatMap(item => Array.from({length:state.counts[item.id] || 0}, () => item));
        basket.innerHTML = items.map(item => `<button data-cart-remove="${U.esc(item.id)}" aria-label="Убрать ${U.esc(item.label)}">${item.icon}<small>−</small></button>`).join('') || '<span class="scene-placeholder">Положи покупки сюда ↓</span>';
        check.disabled = !items.length;
      }
      if (t.sceneType === 'pack') {
        root.querySelectorAll('[data-pack-item]').forEach(button => {
          const selected = state.picked.includes(button.dataset.packItem);
          button.setAttribute('aria-pressed', String(selected));
          button.querySelector('.scene-packed-label').textContent = selected ? '✓ Выбрано' : '＋';
        });
        root.querySelector('[data-pack-basket]').textContent = state.picked.map(id => t.items.find(item => item.id === id).icon).join(' ') || '…';
        check.disabled = !state.picked.length;
      }
      if (t.sceneType === 'area') {
        root.querySelectorAll('[data-area-cell]').forEach(button => button.setAttribute('aria-pressed', String(state.cells.includes(+button.dataset.areaCell))));
        root.querySelector('[data-area-count]').textContent = state.cells.length;
        check.disabled = state.cells.length !== t.target;
      }
      if (t.sceneType === 'match') {
        root.querySelectorAll('[data-match-left],[data-match-right]').forEach(button => {
          const side = button.dataset.matchLeft !== undefined ? 'left' : 'right';
          const id = side === 'left' ? button.dataset.matchLeft : button.dataset.matchRight;
          const n = state.links.findIndex(link => link[side] === id);
          button.classList.toggle('linked', n >= 0);
          button.classList.toggle('selected', side === 'left' && id === selectedLeft);
          button.setAttribute('aria-pressed', String(n >= 0 || (side === 'left' && id === selectedLeft)));
          button.style.setProperty('--link', ['#7C5CFF','#128878','#BC4C61','#736015'][Math.max(0,n) % 4]);
          button.querySelector('.scene-link-number').textContent = n >= 0 ? String(n + 1) : '';
        });
        root.querySelectorAll('.scene-pair-progress i').forEach((dot,i) => { dot.classList.toggle('paired', i < state.links.length);dot.textContent=i < state.links.length ? '●' : '○'; });
        check.disabled = state.links.length !== t.pairs.length;
      }
      if (typeof Quest !== 'undefined' && !locked()) Quest.saveScene(state);
    };
    root.addEventListener('click', event => {
      if (locked()) return;
      const add = event.target.closest('[data-cart-add]');
      if (add) {
        const count = Object.values(state.counts).reduce((a,b) => a+b, 0);
        const item = t.items.find(item => item.id === add.dataset.cartAdd);
        if (count >= (t.maxItems || 6) || (state.counts[item.id] || 0) >= (item.max || 6)) { say('Корзина полна. Нажми на покупку, чтобы убрать.'); return; }
        snapshot();state.counts[item.id] = (state.counts[item.id] || 0) + 1;say('');Sound.play('pop');draw();
      }
      const remove = event.target.closest('[data-cart-remove]');
      if (remove) { snapshot();state.counts[remove.dataset.cartRemove]--;say('');draw(); }
      const pack = event.target.closest('[data-pack-item]');
      if (pack) { snapshot();const id = pack.dataset.packItem;state.picked = state.picked.includes(id) ? state.picked.filter(x => x !== id) : [...state.picked,id];say('');Sound.play('pop');draw(); }
      const left = event.target.closest('[data-match-left]');
      if (left) { selectedLeft = left.dataset.matchLeft; say('Теперь найди пару справа');draw(); }
      const right = event.target.closest('[data-match-right]');
      if (right) {
        if (!selectedLeft) { say('Сначала выбери карточку слева');return; }
        snapshot();state.links = state.links.filter(link => link.left !== selectedLeft && link.right !== right.dataset.matchRight);
        state.links.push({left:selectedLeft,right:right.dataset.matchRight});selectedLeft = null;say('');Sound.play('pop');draw();
      }
      if (event.target.closest('[data-scene-undo]') && history.length) { Object.assign(state,JSON.parse(history.pop()));selectedLeft = null;say('');draw(); }
      if (event.target.closest('[data-scene-check]') && !check.disabled) {
        submitted = true;const ok = SceneTasks.check(t,state);
        root.classList.add(ok ? 'scene-correct' : 'scene-incorrect');
        root.querySelectorAll('button').forEach(button => { button.disabled = true; });
        answer(ok ? 'ok' : 'bad');
      }
    });
    if (t.sceneType === 'area') {
      const floor = root.querySelector('.scene-floor');
      const paint = cell => {
        if (!cell || painted.has(+cell.dataset.areaCell)) return;
        const n = +cell.dataset.areaCell; painted.add(n);
        if (paintValue && !state.cells.includes(n)) state.cells.push(n);
        if (!paintValue) state.cells = state.cells.filter(i => i !== n);
        say('');draw();
      };
      floor.addEventListener('pointerdown', event => {
        if (locked()) return;
        const cell = event.target.closest('[data-area-cell]');if (!cell) return;
        event.preventDefault();snapshot();painting = true;painted = new Set();paintValue = !state.cells.includes(+cell.dataset.areaCell);
        floor.setPointerCapture(event.pointerId);paint(cell);
      });
      floor.addEventListener('pointermove', event => { if (painting && !locked()) {const cell = document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-area-cell]');if(cell && floor.contains(cell))paint(cell);} });
      floor.addEventListener('pointerup', () => {painting = false;});
      floor.addEventListener('pointercancel', () => {painting = false;});
      floor.addEventListener('click', event => {if(event.detail===0&&!locked()){const cell=event.target.closest('[data-area-cell]');if(cell){snapshot();painted=new Set();paintValue=!state.cells.includes(+cell.dataset.areaCell);paint(cell);}}});
    }
    draw();
  },
};
