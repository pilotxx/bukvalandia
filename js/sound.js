'use strict';
/* ============================================================
   Букваландия — звуки (синтез WebAudio, без файлов) и озвучка
   ============================================================ */

const Sound = {
  ctx: null,
  enabled: true,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  tone(freq, start, dur, type = 'sine', vol = 0.18) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  play(name) {
    if (!this.enabled) return;
    this.init();
    const c = this.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    const T = (f, s, d, ty, v) => this.tone(f, s, d, ty, v);
    switch (name) {
      case 'tap': T(660, 0, 0.06, 'triangle', 0.08); break;
      case 'right': T(784, 0, 0.12, 'triangle'); T(1046, 0.09, 0.22, 'triangle'); break;
      case 'combo': T(784, 0, 0.1, 'triangle'); T(988, 0.07, 0.1, 'triangle'); T(1318, 0.14, 0.25, 'triangle'); break;
      case 'wrong': T(220, 0, 0.18, 'sine', 0.2); T(185, 0.12, 0.25, 'sine', 0.18); break;
      case 'coin': T(1318, 0, 0.08, 'square', 0.06); T(1760, 0.06, 0.18, 'square', 0.06); break;
      case 'star': [880, 1108, 1318, 1760].forEach((f, i) => T(f, i * 0.08, 0.3, 'triangle', 0.14)); break;
      case 'level': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => T(f, i * 0.11, 0.28, 'triangle', 0.16)); break;
      case 'hit': T(140, 0, 0.15, 'sawtooth', 0.12); T(90, 0.05, 0.2, 'sine', 0.2); break;
      case 'pop': T(900, 0, 0.05, 'square', 0.07); T(500, 0.03, 0.08, 'sine', 0.1); break;
      case 'buy': T(660, 0, 0.08, 'triangle'); T(990, 0.07, 0.08, 'triangle'); T(1320, 0.14, 0.2, 'triangle'); break;
      case 'lose': [392, 349, 311, 262].forEach((f, i) => T(f, i * 0.16, 0.3, 'triangle', 0.14)); break;
      case 'pet': T(1046, 0, 0.08, 'sine', 0.12); T(1396, 0.08, 0.14, 'sine', 0.1); break;
    }
  },
};

const Speech = {
  enabled: true,
  voice: null,
  enVoice: null,
  init() {
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const all = speechSynthesis.getVoices();
      const vs = all.filter(v => /^ru/i.test(v.lang));
      this.voice = vs.find(v => /google|милена|milena|irina|ирина/i.test(v.name)) || vs[0] || null;
      /* Английский: британский вариант, как в школе; иначе американский; иначе любой английский */
      const en = all.filter(v => /^en/i.test(v.lang));
      const gb = en.filter(v => /en[-_]GB/i.test(v.lang));
      const us = en.filter(v => /en[-_]US/i.test(v.lang));
      const good = list => list.find(v => /google|natural|enhanced|premium/i.test(v.name)) || list.find(v => v.localService) || list[0];
      this.enVoice = good(gb) || good(us) || good(en) || null;
    };
    pick();
    speechSynthesis.onvoiceschanged = pick;
  },
  available: () => 'speechSynthesis' in window,
  /* Английский звучит, если есть записи (EnVoice) или системный английский голос */
  enOk() { return EnVoice.ready() || (this.available() && !!this.enVoice); },
  /* Английская речь звучит всегда (это часть задания), даже если озвучка русских заданий выключена */
  sayEn(text, slow = false) {
    EnVoice.stop();
    if (this.available()) speechSynthesis.cancel();
    if (!EnVoice.play(text, slow)) this.synthEn(text, slow);
  },
  /* системный английский голос (если записи нет) */
  synthEn(text, slow = false) {
    if (!this.available() || !this.enVoice) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = this.enVoice; u.lang = this.enVoice.lang;
    u.rate = slow ? 0.55 : 0.85; u.pitch = 1.05;
    speechSynthesis.speak(u);
  },
  /* Голос питомца — записи нейроголосом (PetVoice), а где записи нет — «звериный лепет».
     Звучит, только если в настройках включён «Голос питомца» (не зависит от озвучки заданий) */
  petOn: true,
  sayPet(text, stage = 2, whisper = false) {
    if (!this.petOn) return;
    PetVoice.say(text, stage, whisper);
  },
  say(html) {
    if (!this.enabled || !this.available()) return;
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent.replace(/_+/g, ' пропуск ').replace(/\s+/g, ' ').trim();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU'; u.rate = 0.92; u.pitch = 1.1;
    if (this.voice) u.voice = this.voice;
    speechSynthesis.speak(u);
  },
};

/* ---------- Записи голоса частями ----------
   Записи лежат частями не больше 4 МБ: voice/<имя>-1.js, voice/<имя>-2.js … (GitHub в браузере не принимает большие файлы).
   Каждая часть вызывает voicePart(имя, номер, всего, {ключ фразы: mp3 в base64}); всего частей узнаём из первой.
   done(pack) — когда пришли все части (если часть не пришла — то, что успело, или null). */
const VoiceParts = {
  wait: {},
  load(name, done) {
    const pack = {};
    let total = 1;
    const fin = () => done(Object.keys(pack).length ? pack : null);
    const part = n => {
      const id = name + '-' + n;
      let got = false;
      this.wait[id] = (tot, data) => { total = tot; Object.assign(pack, data); got = true; };
      const s = document.createElement('script');
      s.src = `voice/${id}.js`;
      s.onload = () => { delete this.wait[id]; s.remove(); if (got && n < total) part(n + 1); else fin(); };
      s.onerror = () => { delete this.wait[id]; s.remove(); fin(); };
      document.head.appendChild(s);
    };
    part(1);
  },
};
function voicePart(name, n, total, data) { const f = VoiceParts.wait[name + '-' + n]; if (f) f(total, data); }

/* ---------- Голос питомца ----------
   Все постоянные фразы заранее озвучены нейроголосом (свой голос у каждого вида питомца) и лежат в voice/<вид>-N.js.
   Фраза ищется по тексту; если записи нет (числа, имя) — питомец «лепечет» милыми звуками, текст — в облачке.
   С возрастом голос чуть ниже и спокойнее (скорость/тон записи). Файлы делает «Букваландия (разработка)/озвучка/озвучить.py». */
const PetVoice = {
  sp: null, pack: null, cur: null,
  key: t => String(t).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, ''),
  load(species) {
    if (!species || this.sp === species) return;
    this.sp = species; this.pack = null;
    VoiceParts.load(species, p => { if (this.sp === species) this.pack = p; });   // нет файлов или сети — будет лепет
  },
  stop() { if (this.cur) { try { this.cur.pause(); } catch (e) { /* */ } this.cur = null; } },
  say(text, stage = 2, whisper = false) {
    this.stop(); EnVoice.stop();
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* */ }
    const b64 = this.pack && this.pack[this.key(text)];
    if (!b64) { this.babble(text, stage, whisper); return; }
    const a = new Audio('data:audio/mpeg;base64,' + b64);
    a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false;
    a.playbackRate = [1.1, 1.1, 1.05, 1, 0.96][Math.max(0, Math.min(4, stage))];
    a.volume = whisper ? 0.5 : 1;
    this.cur = a;
    a.play().catch(() => this.babble(text, stage, whisper));
  },
  /* «Звериный язык»: по слогу — короткий звук; у каждого вида свой тон, к концу вопроса тон поднимается */
  babble(text, stage = 2, whisper = false) {
    Sound.init(); const c = Sound.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    const t = String(text);
    const syl = Math.max(2, Math.min(14, [...t.toLowerCase()].filter(ch => 'аоуыэеёюяиaeiouy'.includes(ch)).length));
    const base = { dragon: 260, cat: 420, bunny: 540 }[S && S.pet ? S.pet.species : 'cat'] * [1.25, 1.25, 1.12, 1, 0.92][Math.max(0, Math.min(4, stage))];
    const ask = /\?\s*$/.test(t);
    const vol = whisper ? 0.04 : 0.09;
    let at = 0;
    for (let i = 0; i < syl; i++) {
      const f = base * (0.88 + Math.random() * 0.3) * (ask && i >= syl - 2 ? 1.3 : 1);
      const d = 0.06 + Math.random() * 0.05;
      const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + at;
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.18, t0 + d);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + d + 0.03);
      at += d + 0.035 + (/[,.!…]/.test(t[Math.floor((i + 1) * t.length / syl)] || '') ? 0.12 : 0);
    }
  },
};

/* ---------- Английский голос ----------
   Все английские слова и фразы уроков заранее озвучены британским нейроголосом (Libby) и лежат в voice/en-N.js —
   так английский звучит и там, где на устройстве нет английского системного голоса. Фраза ищется по тексту
   (только латинские буквы и цифры); нет записи — говорит системный голос, если он есть.
   Медленно (🐢) — та же запись на 0,7 скорости без смены тона. Файл делает «озвучка/озвучить.py en». */
const EnVoice = {
  pack: null, cur: null, loading: false,
  key: t => String(t).toLowerCase().replace(/[^a-z0-9]/g, ''),
  load() {
    if (this.pack || this.loading) return;
    this.loading = true;
    VoiceParts.load('en', p => { this.pack = p; if (!p) this.loading = false; });   // нет файлов или сети — системный голос
  },
  ready() { return !!this.pack; },
  stop() { if (this.cur) { try { this.cur.pause(); } catch (e) { /* */ } this.cur = null; } },
  /* true — запись нашлась и запущена */
  play(text, slow = false) {
    const b64 = this.pack && this.pack[this.key(text)];
    if (!b64) return false;
    const a = new Audio('data:audio/mpeg;base64,' + b64);
    a.preservesPitch = true; a.mozPreservesPitch = true; a.webkitPreservesPitch = true;
    a.playbackRate = slow ? 0.7 : 1;
    this.cur = a;
    a.play().catch(() => {
      /* не дали играть (нет касания экрана) или запись испорчена — пробуем системный голос */
      if (this.cur === a) Speech.synthEn(text, slow);
    });
    return true;
  },
};
