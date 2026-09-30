/*
 * Transición "telón de rayas": franjas verticales (como el arte del evento)
 * que cubren la pantalla desde el centro, se cambia la escena por debajo
 * y se retiran hacia abajo. Se puede interrumpir en cualquier momento.
 */
(function () {
  'use strict';
  const BTS = window.BTS;
  const STRIPS = 16, COVER_MS = 480, STAGGER = 26, UNCOVER_MS = 650;

  BTS.Transitions = {
    init(root) {
      this.root = root;
      for (let i = 0; i < STRIPS; i++) {
        const s = document.createElement('i');
        s.style.setProperty('--dl', Math.round(Math.abs(i - (STRIPS - 1) / 2) * STAGGER) + 'ms');
        root.appendChild(s);
      }
      this.state = 'idle';
      this.waiters = [];
      this.tm = 0;
    },

    cover() {
      return new Promise((resolve) => {
        if (this.state === 'covered') { resolve(); return; }
        this.waiters.push(resolve);
        if (this.state === 'covering') return;
        clearTimeout(this.tm);
        this.root.classList.remove('is-uncover', 'is-reset');
        this.root.classList.add('is-cover');
        this.state = 'covering';
        this.tm = setTimeout(() => {
          this.state = 'covered';
          this.flush();
        }, COVER_MS + STAGGER * STRIPS / 2 + 40);
      });
    },

    flush() {
      const w = this.waiters;
      this.waiters = [];
      w.forEach((f) => f());
    },

    uncover(instant) {
      if (this.state === 'idle' || this.state === 'uncovering') return;
      clearTimeout(this.tm);
      this.flush();
      const r = this.root;
      if (instant) { this.reset(); return; }
      r.classList.add('is-uncover');
      r.classList.remove('is-cover');
      this.state = 'uncovering';
      this.tm = setTimeout(() => this.reset(), UNCOVER_MS + STAGGER * STRIPS / 2 + 60);
    },

    reset() {
      const r = this.root;
      r.classList.add('is-reset');
      r.classList.remove('is-cover', 'is-uncover');
      void r.offsetWidth;
      r.classList.remove('is-reset');
      this.state = 'idle';
    }
  };
})();
