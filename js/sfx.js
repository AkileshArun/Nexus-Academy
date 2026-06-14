/* =========================================================================
   sfx.js — tiny synthesized sound effects via the Web Audio API.
   No audio files needed. Attaches to window.NEXUS as .sfx / mute helpers.
   ========================================================================= */
(function () {
  'use strict';
  const N = window.NEXUS || (window.NEXUS = {});
  let ctx = null;
  const MUTE_KEY = 'nexus_muted';

  function isMuted(){ return localStorage.getItem(MUTE_KEY) === '1'; }
  function setMuted(v){ localStorage.setItem(MUTE_KEY, v ? '1' : '0'); }
  function toggleMute(){ setMuted(!isMuted()); return isMuted(); }

  function ac(){ if(!ctx){ try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ctx=null; } } if(ctx && ctx.state==='suspended'){ ctx.resume(); } return ctx; }

  // Play a single tone.
  function tone(freq, dur, type, gain, when){
    const a = ac(); if(!a || isMuted()) return;
    const t = a.currentTime + (when||0);
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = type||'sine'; osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain||0.18, t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    osc.connect(g); g.connect(a.destination);
    osc.start(t); osc.stop(t+dur+0.02);
  }
  function chord(freqs, dur, type, gain){ freqs.forEach((f,i)=>tone(f, dur, type, gain, i*0.0)); }
  function arp(freqs, step, dur, type, gain){ freqs.forEach((f,i)=>tone(f, dur||0.14, type||'triangle', gain||0.16, i*(step||0.08))); }

  const SOUNDS = {
    click:    () => tone(420, 0.05, 'square', 0.07),
    correct:  () => arp([523, 660], 0.06, 0.12, 'triangle', 0.16),
    wrong:    () => { tone(180, 0.18, 'sawtooth', 0.14); tone(120, 0.22, 'sawtooth', 0.1, 0.02); },
    powerup:  () => arp([523, 784, 1047], 0.06, 0.16, 'sine', 0.16),
    phase:    () => arp([392, 523, 659], 0.07, 0.16, 'triangle', 0.18),
    win:      () => arp([523, 659, 784, 1047, 1319], 0.09, 0.22, 'triangle', 0.2),
    lose:     () => arp([330, 262, 196], 0.1, 0.2, 'sawtooth', 0.14),
    open:     () => tone(660, 0.08, 'sine', 0.12)
  };
  function sfx(name){ const f = SOUNDS[name]; if(f) try{ f(); }catch(e){} }

  N.sfx = sfx; N.isMuted = isMuted; N.toggleMute = toggleMute; N.setMuted = setMuted;
})();
