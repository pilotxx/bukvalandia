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
  enOk() { return this.available() && !!this.enVoice; },
  /* Английская речь звучит всегда (это часть задания), даже если озвучка русских заданий выключена */
  sayEn(text, slow = false) {
    if (!this.enOk()) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = this.enVoice; u.lang = this.enVoice.lang;
    u.rate = slow ? 0.55 : 0.85; u.pitch = 1.05;
    speechSynthesis.speak(u);
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
