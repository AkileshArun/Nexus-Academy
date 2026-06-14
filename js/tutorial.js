/* =========================================================================
   tutorial.js — first-run walkthrough
   A spotlight "ring" moves around real mock elements with a caption card,
   like the coachmarks in most apps. Finishing marks the tutorial done.
   ========================================================================= */
(function () {
  'use strict';

  const steps = [
    { el: 'm-node', text: 'This is a gate on the world map. Tap one to read its story, then start the episode.' },
    { el: 'm-grid', text: 'Each episode has 6 challenge panels. Clear a panel\u2019s mini-game and its art lights up in colour.' },
    { el: 'm-boss', text: 'Clear all 6 panels to unlock the boss. Beat the boss to win the episode and unlock the next gate.' },
    { el: 'm-pill', text: 'Your access code saves your progress. You can switch between saves from the title screen anytime.' }
  ];

  const coach = document.getElementById('coach');
  const ring = document.getElementById('coachRing');
  const card = document.getElementById('coachCard');
  const stepLabel = document.getElementById('coachStep');
  const textEl = document.getElementById('coachText');
  const nextBtn = document.getElementById('coachNext');
  let i = 0;

  function place() {
    const s = steps[i];
    const target = document.getElementById(s.el);
    const r = target.getBoundingClientRect();
    const pad = 10;
    ring.style.left = (r.left - pad) + 'px';
    ring.style.top = (r.top - pad) + 'px';
    ring.style.width = (r.width + pad * 2) + 'px';
    ring.style.height = (r.height + pad * 2) + 'px';

    stepLabel.textContent = (i + 1) + ' / ' + steps.length;
    textEl.textContent = s.text;
    nextBtn.textContent = (i === steps.length - 1) ? 'Enter the Academy' : 'Next';

    // Put the caption above the target if it's low on screen, else below.
    const below = r.bottom + 170 < window.innerHeight;
    card.style.top = below ? (r.bottom + 18) + 'px' : '';
    card.style.bottom = below ? '' : (window.innerHeight - r.top + 18) + 'px';
  }

  function finish() { NEXUS.markTutorialDone(); (NEXUS.fx ? NEXUS.fx.pageTransition('map.html') : window.location.href='map.html'); }

  nextBtn.addEventListener('click', () => { if (i === steps.length - 1) finish(); else { i++; place(); } });
  document.getElementById('coachSkip').addEventListener('click', finish);
  document.getElementById('skipBtn').addEventListener('click', finish);
  window.addEventListener('resize', place);

  NEXUS.spawnParticles();
  place();
})();
