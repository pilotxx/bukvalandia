'use strict';
/* Получение награды — одна операция: проверка → списание → выдача → сохранение. */
const Economy = {
  total: () => S.coins + S.piggy.saved,
  waiting: id => S.parent.requests.some(r=>r.prize===id&&r.status==='wait'),
  prizeButton(p) {
    if(Economy.waiting(p.id))return '<span class="eq">⏳ Ждёт выдачи</span>';
    return `<button class="btn sm ${S.coins>=p.price?'primary':''}" data-act="prizeClaim" data-arg="${p.id}">🎁 Получить · ${fmt(p.price)}</button>`;
  },
  claimPrize(id) {
    const p=S.parent.prizes.find(x=>x.id===id);if(!p||Economy.waiting(id))return;
    Economy.confirmGift({t:'prize',id:p.id,name:p.name,price:p.price,icon:'🎁'},'wallet');
  },
  confirmGift(g,source) {
    const balance=source==='piggy'?S.piggy.saved:S.coins;
    if(!Number.isFinite(g.price)||g.price<=0)return;
    if(balance<g.price){toast(`Для приза нужно ещё ${fmt(g.price-balance)} монет ${source==='piggy'?'в копилке':'в кошельке'}.`);return;}
    let settled=false;
    confirmBox(`<div class="m-icon">${g.icon}</div><h2>${U.esc(g.name)}</h2><div class="money-equation"><span><small>${source==='piggy'?'🐷 Копилка':'🪙 Кошелёк'}</small>${fmt(balance)}</span><b>−</b><span><small>Цена</small>${fmt(g.price)}</span><b>=</b><span><small>Останется</small>${fmt(balance-g.price)}</span></div><p class="small">${g.t==='prize'?'После оплаты взрослый увидит заявку.':'Подарок появится в доме.'}</p>`,'Получить',()=>{
      if(settled)return;settled=true;
      if(!Economy.spendGift(g,source))return;
      setTimeout(()=>Economy.receipt(),220);
    });
  },
  spendGift(g,source) {
    const actual=g.t==='prize'?S.parent.prizes.find(p=>p.id===g.id):ITEMS[g.id];
    if(!actual||actual.price!==g.price||!Number.isFinite(g.price)||g.price<=0)return false;
    if(g.t==='prize'&&Economy.waiting(g.id))return false;
    if(g.t==='item'&&S.owned[g.id])return false;
    if(source==='piggy'){
      const goal=piggyGoal();
      if(!goal||goal.id!==g.id||goal.t!==g.t||S.piggy.saved<g.price)return false;
    }else if(source!=='wallet'||S.coins<g.price)return false;
    const before=Economy.total();
    if(source==='piggy')S.piggy.saved-=g.price;else S.coins-=g.price;
    if(S.piggy.goal?.id===g.id&&S.piggy.goal.t===g.t){S.piggy.goal=null;S.coins+=S.piggy.saved;S.piggy.saved=0;}
    if(source==='piggy')S.counters.piggy=(S.counters.piggy||0)+1;
    const payment={id:'pay_'+Date.now()+'_'+S.payments.length,name:g.name,price:g.price,source,kind:g.t,before,after:Economy.total(),t:Date.now()};
    if(g.t==='prize')S.parent.requests.push({id:payment.id,prize:g.id,name:g.name,price:g.price,t:payment.t,status:'wait',charged:true,paidFrom:source});
    else grant(actual);
    S.payments.push(payment);S.payments=S.payments.slice(-30);
    checkAch();payment.bonus=Economy.total()-payment.after;payment.balance=Economy.total();
    save();render();Sound.play('buy');confetti(35);
    return true;
  },
  receipt() {
    const p=S.payments[S.payments.length-1];if(!p)return;
    modal({html:`<div class="m-icon">🎁</div><h2>Оплачено!</h2><p>${U.esc(p.name)}</p><div class="payment-receipt money-equation"><span><small>Было всего</small>${fmt(p.before)}</span><b>−</b><span><small>Цена</small>${fmt(p.price)}</span><b>=</b><span><small>После оплаты</small>${fmt(p.after)}</span></div>${p.bonus?`<p class="payment-bonus">🏅 Бонус +${fmt(p.bonus)} · сейчас ${fmt(p.balance)}</p>`:''}<p class="small">${p.kind==='item'?'Подарок уже в доме.':'Заказ ждёт взрослого.'}</p>`,buttons:[{label:'Здорово!',cls:'primary'}]});
  },
  resolve(id,status) {
    const r=S.parent.requests.find(x=>x.id===id);
    if(!r||r.status!=='wait'||!['given','cancel'].includes(status))return;
    r.status=status;
    if(status==='cancel')S.coins+=r.price;
    save();parentPanel('prizes');renderTop();
  },
};
