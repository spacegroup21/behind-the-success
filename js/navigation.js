/*
 * Controles de teclado, presentador (clicker) y mouse.
 * La misma función handle() atiende al teclado local y a las teclas que
 * reenvía la ventana del operador.
 */
(function () {
  'use strict';
  const BTS = window.BTS;

  BTS.Nav = {
    init(app) {
      this.app = app;
      this.lastNav = 0;
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return; // deja libres los atajos del navegador
        if (this.handle(e)) e.preventDefault();
      });

      const vp = document.getElementById('viewport');
      // Clic izquierdo = avanzar, clic derecho = retroceder.
      vp.addEventListener('click', (e) => {
        if (e.button !== 0 || app.currentType() === 'surprise') return;
        app.next();
      });
      vp.addEventListener('contextmenu', (e) => { e.preventDefault(); app.prev(); });

      document.getElementById('mouse-nav').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.nav === 'next') app.next(); else app.prev();
      });
      document.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });

      // Cursor oculto tras 2.5 s sin movimiento (no se ve en la LED).
      let idle = 0;
      const wake = () => {
        document.body.classList.remove('is-idle');
        clearTimeout(idle);
        idle = setTimeout(() => document.body.classList.add('is-idle'), 2500);
      };
      window.addEventListener('mousemove', wake);
      wake();
    },

    // Devuelve true si la tecla fue atendida.
    handle(e) {
      const A = this.app, code = e.code || '';
      if (code === 'F5') return true;   // botón "iniciar" de algunos presentadores: evita recargar
      if (code === 'Tab') return true;
      if (e.repeat) return /^(Arrow|Space|Page|Enter)/.test(code);

      const digit = /^(?:Digit|Numpad)([1-9])$/.exec(code);
      if (digit) {
        const n = +digit[1];
        if (A.currentType() === 'surprise') A.command({ type: 'sp-select', i: n - 1, force: !!e.shiftKey });
        else A.goBlock(n - 1);
        return true;
      }

      switch (code) {
        case 'ArrowRight': case 'Space': case 'PageDown': case 'Enter': case 'NumpadEnter':
          return this.nav(() => A.next());
        case 'ArrowLeft': case 'PageUp': case 'Backspace':
          return this.nav(() => A.prev());
        case 'ArrowDown': return this.nav(() => A.nextBlock());
        case 'ArrowUp': return this.nav(() => A.prevBlock());
        case 'Home': A.home(); return true;
        case 'End': A.goType('finale'); return true;
        case 'KeyS': A.goType('surprise'); return true;
        case 'KeyC': A.goClosing(); return true;
        case 'KeyE': A.toggleStandby(); return true;
        case 'KeyB': case 'Period': case 'NumpadDecimal': A.toggleBlack(); return true;
        case 'KeyF': A.toggleFullscreen(); return true;
        case 'KeyO': BTS.Operator.openWindow(); return true;
        case 'KeyH': BTS.Operator.toggleHud(); return true;
        case 'KeyR': if (e.shiftKey) { A.command({ type: 'sp-reset' }); return true; } return false;
        case 'Escape':
          if (BTS.Operator.hudOpen()) BTS.Operator.toggleHud(false);
          else A.command({ type: 'sp-close' });
          return true;
      }
      return false;
    },

    // Filtro anti-rebote (presentadores que envían dos pulsaciones).
    nav(fn) {
      const now = performance.now();
      if (now - this.lastNav < 140) return true;
      this.lastNav = now;
      fn();
      return true;
    }
  };
})();
