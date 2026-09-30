/*
 * Dinámica de PREGUNTAS SORPRESA.
 * - N cuadros numerados (uno por pregunta de content/forum.js).
 * - Tecla 1..N o clic → animación de selección → el cuadro se abre como un telón
 *   y revela la pregunta que estaba "detrás".
 * - Una pregunta revelada queda marcada como utilizada y no se puede volver a
 *   escoger por accidente (Shift + número la vuelve a mostrar a propósito).
 * - El estado sobrevive a recargas de la página (localStorage).
 */
(function () {
  'use strict';
  const BTS = window.BTS;
  const { esc, pad, splitWords } = BTS;
  const PANEL = { x: 96, y: 150, w: 1728, h: 440 }; // pregunta revelada: siempre en la mitad superior

  const S = (BTS.Surprise = {
    init(app) {
      this.app = app;
      this.qs = (app.C.surprise && app.C.surprise.questions) || [];
      this.revealed = [];
      this.active = null;
      this.busy = false;
      this.view = null;
    },

    setRevealed(list) {
      this.revealed = (list || []).filter((i, k, a) => Number.isInteger(i) && i >= 0 && i < this.qs.length && a.indexOf(i) === k);
    },

    changed() { this.app.onSurpriseChange(); },

    render(scene, app) {
      const C = app.C.surprise;
      const n = this.qs.length;
      const [w1, ...rest] = String(C.title).split(' ');
      const root = document.createElement('section');
      root.className = 'scene scene--surprise';
      root.innerHTML = `
        <header class="sp-head">
          <h1 class="sp-title" data-in style="--d:200ms">${esc(w1)} <span class="r">${esc(rest.join(' '))}</span></h1>
          <p class="sp-sub" data-in style="--d:500ms">${esc(C.instruction || '')}</p>
        </header>
        <div class="sp-grid" style="--n:${n}">
          ${this.qs.map((q, i) => `
          <div class="sp-card" data-i="${i}" role="button" style="--i:${i}">
            <div class="sp-card-in">
              <i class="sp-card-bar"></i>
              <span class="sp-card-label">Pregunta</span>
              <span class="sp-card-num">${pad(i + 1)}</span>
              <span class="sp-card-tag">✓ Revelada</span>
              <i class="sp-card-shine"></i>
            </div>
          </div>`).join('')}
        </div>
        <div class="sp-reveal">
          <div class="sp-panel">
            <div class="sp-panel-num"></div>
            <i class="sp-panel-rule"></i>
            <div class="sp-panel-body">
              <div class="sp-panel-kicker"></div>
              <p class="sp-panel-text"></p>
            </div>
            <div class="sp-curtain sp-curtain-l"></div>
            <div class="sp-curtain sp-curtain-r"></div>
            <div class="sp-cnum"></div>
          </div>
          <i class="sp-frame"></i>
        </div>`;

      const v = {
        root,
        grid: root.querySelector('.sp-grid'),
        cards: Array.from(root.querySelectorAll('.sp-card')),
        reveal: root.querySelector('.sp-reveal'),
        panel: root.querySelector('.sp-panel'),
        frame: root.querySelector('.sp-frame'),
        T: new BTS.Timers()
      };
      this.view = v;
      this.active = null;
      this.busy = false;
      this.paintCards();

      v.cards.forEach((card) => {
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          const i = +card.dataset.i;
          if (this.revealed.includes(i) && this.active !== i) return this.deny(i);
          this.select(i, false);
        });
      });
      v.reveal.addEventListener('click', (e) => { e.stopPropagation(); if (this.active !== null) this.close(); });

      return {
        el: root,
        chrome: { lockup: true, logo: true },
        fx: { mode: null, params: { sweep: 0.7, spot: 0.9, flares: 0.08, dust: 0.9, corners: 0.4 } },
        enter: () => {
          v.cards.forEach((c, i) => c.animate(
            [{ opacity: 0, transform: 'translateY(120px) rotateX(35deg)' }, { opacity: 1, transform: 'none' }],
            { duration: 1100, delay: 650 + i * 120, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
          const p = app.pendingSurprise;
          app.pendingSurprise = null;
          if (p) v.T.after(1500, () => this.select(p.i, p.force));
        },
        dispose: () => {
          v.T.clear();
          if (this.view === v) { this.view = null; this.active = null; this.busy = false; }
          this.changed();
        },
        onAction: (a) => {
          if (a !== 'next' && a !== 'prev' && a !== 'close') return false;
          if (this.busy && this.active !== null) return true; // no interrumpir la animación de revelado
          if (this.active !== null) { this.close(); return true; }
          return false;
        }
      };
    },

    paintCards() {
      const v = this.view;
      if (!v) return;
      v.cards.forEach((c, i) => c.classList.toggle('is-used', this.revealed.includes(i)));
    },

    deny(i) {
      const v = this.view;
      if (!v || !v.cards[i]) return;
      const c = v.cards[i];
      c.classList.remove('is-denied');
      void c.offsetWidth;
      c.classList.add('is-denied');
      v.T.after(650, () => c.classList.remove('is-denied'));
      BTS.Operator.log('La pregunta ' + pad(i + 1) + ' ya fue revelada. Usa Shift+' + (i + 1) + ' para mostrarla otra vez.');
    },

    select(i, force) {
      const v = this.view;
      if (!v || i < 0 || i >= this.qs.length || this.busy || this.active === i) return;
      const used = this.revealed.includes(i);
      if (used && !force) return this.deny(i);
      if (this.active !== null) { this.close(() => this.select(i, force)); return; }

      this.busy = true;
      v.T.after(4000, () => { this.busy = false; }); // seguro anti-bloqueo
      if (!used) this.revealed.push(i);
      this.active = i;
      this.changed();

      const card = v.cards[i];
      v.grid.classList.add('is-picking');
      card.classList.add('is-picked');
      v.T.after(used ? 100 : 700, () => { if (this.active === i) v.root.classList.add('is-revealing'); });
      const r = BTS.stageRect(card);
      BTS.FX.burst(6, { x: r.x - 60, y: r.y - 60, w: r.w + 120, h: r.h + 120 }, 0.6);
      BTS.FX.set({ params: { spot: 1.2, flares: 0.2 } });
      v.T.after(used ? 150 : 850, () => this.open(i, r));
    },

    open(i, r) {
      const v = this.view;
      if (!v || this.active !== i) return;
      const p = v.panel;
      p.querySelector('.sp-panel-num').textContent = pad(i + 1);
      p.querySelector('.sp-cnum').textContent = pad(i + 1);
      p.querySelector('.sp-panel-kicker').textContent = 'Pregunta sorpresa ' + pad(i + 1);
      const text = p.querySelector('.sp-panel-text');
      text.innerHTML = splitWords(this.qs[i]);
      text.classList.remove('is-show');
      v.reveal.classList.add('is-open');
      BTS.fitText(text, { max: 88, min: 52, maxHeight: 300 });

      // Recorte: el panel "crece" desde el rectángulo del cuadro elegido.
      const ins = {
        t: Math.max(0, r.y - PANEL.y), l: Math.max(0, r.x - PANEL.x),
        r: Math.max(0, PANEL.x + PANEL.w - (r.x + r.w)), b: Math.max(0, PANEL.y + PANEL.h - (r.y + r.h))
      };
      const from = `inset(${ins.t}px ${ins.r}px ${ins.b}px ${ins.l}px)`;
      const E = 'cubic-bezier(.76,0,.24,1)';
      this.panelAnim = p.animate([{ clipPath: from, opacity: 1 }, { clipPath: 'inset(0px 0px 0px 0px)', opacity: 1 }], { duration: 750, easing: E, fill: 'both' });
      this.frameAnim = v.frame.animate([
        { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', opacity: 1 },
        { left: PANEL.x + 'px', top: PANEL.y + 'px', width: PANEL.w + 'px', height: PANEL.h + 'px', opacity: 1 }
      ], { duration: 750, easing: E, fill: 'both' });

      const cnum = p.querySelector('.sp-cnum');
      const dx = (r.x + r.w / 2) - (PANEL.x + PANEL.w / 2), dy = (r.y + r.h / 2) - (PANEL.y + PANEL.h / 2);
      cnum.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(.62)`, opacity: 1 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.55 },
        { transform: 'translate(0,0) scale(1.08)', opacity: 1 }
      ], { duration: 1150, easing: E, fill: 'both' });

      const curtains = p.querySelectorAll('.sp-curtain');
      curtains.forEach((c) => c.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(0)' }], { duration: 1, fill: 'both' }));

      v.T.after(1150, () => {
        // Se abre el telón: lo que hay DETRÁS del éxito.
        curtains[0].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-101%)' }], { duration: 1000, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'both' });
        curtains[1].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(101%)' }], { duration: 1000, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'both' });
        cnum.animate([{ transform: 'scale(1.08)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 600, easing: 'ease-in', fill: 'both' });
        BTS.FX.flash(960, 580, 0.9);
        BTS.FX.burst(8, { x: 96, y: 170, w: 1728, h: 820 }, 0.8);
        text.classList.add('is-show');
        v.T.after(900, () => { this.busy = false; BTS.FX.set({ params: { spot: 0.9, flares: 0.08 } }); });
      });
    },

    close(then) {
      const v = this.view;
      if (!v || this.active === null) { if (then) then(); return; }
      const i = this.active;
      const card = v.cards[i];
      const text = v.panel.querySelector('.sp-panel-text');
      text.classList.remove('is-show');
      card.classList.remove('is-picked');
      card.classList.add('is-used');
      v.grid.classList.remove('is-picking');
      v.root.classList.remove('is-revealing');
      const r = BTS.stageRect(card);
      const ins = {
        t: Math.max(0, r.y - PANEL.y), l: Math.max(0, r.x - PANEL.x),
        r: Math.max(0, PANEL.x + PANEL.w - (r.x + r.w)), b: Math.max(0, PANEL.y + PANEL.h - (r.y + r.h))
      };
      const E = 'cubic-bezier(.76,0,.24,1)';
      if (this.panelAnim) this.panelAnim.cancel();
      if (this.frameAnim) this.frameAnim.cancel();
      v.panel.animate([
        { clipPath: 'inset(0px 0px 0px 0px)', opacity: 1 },
        { clipPath: `inset(${ins.t}px ${ins.r}px ${ins.b}px ${ins.l}px)`, opacity: 0 }
      ], { duration: 600, easing: E, fill: 'both' });
      v.frame.animate([
        { left: PANEL.x + 'px', top: PANEL.y + 'px', width: PANEL.w + 'px', height: PANEL.h + 'px', opacity: 1 },
        { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', opacity: 0 }
      ], { duration: 600, easing: E, fill: 'both' });
      this.active = null;
      this.busy = true;
      this.changed();
      BTS.FX.set({ params: { spot: 0.9, flares: 0.08 } });
      v.T.after(620, () => {
        v.reveal.classList.remove('is-open');
        this.busy = false;
        if (then) then();
      });
    },

    reset() {
      const v = this.view;
      this.revealed = [];
      if (v) {
        v.T.clear();
        v.reveal.classList.remove('is-open');
        v.root.classList.remove('is-revealing');
        v.grid.classList.remove('is-picking');
        v.cards.forEach((c, i) => {
          c.classList.remove('is-picked', 'is-used', 'is-denied');
          c.animate([{ transform: 'rotateY(90deg)', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 700, delay: i * 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        });
      }
      this.active = null;
      this.busy = false;
      this.changed();
      BTS.Operator.log('Dinámica sorpresa reiniciada.');
    }
  });
})();
