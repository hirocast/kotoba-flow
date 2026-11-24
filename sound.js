// File: sound.js
'use strict';

window.Sound = {
  ctx: null,
  enabled: true,
  PENTA: [0, 2, 4, 7, 9, 12, 14, 16],

  init() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  tone(freq, dur, gainVal, type = 'triangle', delay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gainVal, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  playTap() {
    this.tone(520, 0.06, 0.08, 'sine');
  },

  playOk(combo = 0) {
    const idx = Math.min(combo, this.PENTA.length - 1);
    const semi = this.PENTA[idx];
    const f1 = 440 * Math.pow(2, semi / 12);
    const f2 = f1 * Math.pow(2, 4 / 12);
    this.tone(f1, 0.14, 0.14, 'triangle', 0);
    this.tone(f2, 0.18, 0.11, 'triangle', 0.055);
  },

  playNg() {
    this.tone(240, 0.14, 0.12, 'sawtooth', 0);
    this.tone(196, 0.20, 0.10, 'sawtooth', 0.09);
  },

  playClear() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone(f, 0.24, 0.13, 'triangle', i * 0.08));
  },

  speakWord(text) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
};
