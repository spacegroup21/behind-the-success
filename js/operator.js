/*
 * Modo operador (lado de la presentación).
 *  - H: panel superpuesto (útil con una sola pantalla o en ensayos).
 *  - O: abre operator.html en otra ventana; se comunica por postMessage,
 *       que funciona incluso abriendo el archivo con doble clic (file://).
 */
(function () {
  'use strict';
  const BTS = window.BTS;

  BTS.Operator = {
    init(app) {
      this.app = app;
      this.hud = document.getElementById('hud');
      this.panel = new BTS.OperatorPanel(this.hud, (cmd) => app.command(cmd), { mode: 'hud' });
      this.win = null;
      this.lastState = null;
      window.addEventListener('message', (e) => this.onMessage(e));
    },

    // Solo se aceptan mensajes de una ventana abierta por esta presentación.
    isOurs(src) {
      try { return !!src && src.opener === window; } catch (e) { return false; }
    },

    onMessage(e) {
      const d = e.data;
      if (!d || typeof d !== 'object' || typeof d.bts !== 'string') return;
      if (!this.isOurs(e.source)) return;
      this.win = e.source;
      if (d.bts === 'hello') this.send();
      else if (d.bts === 'cmd' && d.cmd && typeof d.cmd.type === 'string') this.app.command(d.cmd);
    },

    openWindow() {
      if (this.win && !this.win.closed) { try { this.win.focus(); } catch (e) { /* nada */ } return; }
      let w = null;
      try {
        if (window.BTS_OPERATOR_HTML) {
          // Versión de archivo único: la ventana del operador se escribe desde aquí.
          w = window.open('', 'bts-operador', 'popup=yes,width=1360,height=880');
          if (w && !w.document.getElementById('op')) {
            w.document.open();
            w.document.write(window.BTS_OPERATOR_HTML);
            w.document.close();
            const fonts = document.getElementById('bts-fonts');
            if (fonts) {
              const st = w.document.createElement('style');
              st.textContent = fonts.textContent;
              w.document.head.appendChild(st);
            }
          }
        } else {
          w = window.open('operator.html', 'bts-operador', 'popup=yes,width=1360,height=880');
        }
      } catch (e) { w = null; }
      if (w) this.win = w;
      else this.log('El navegador bloqueó la ventana del operador: permite ventanas emergentes para este archivo.');
    },

    hudOpen() { return this.hud.classList.contains('is-open'); },

    toggleHud(force) {
      const on = force == null ? !this.hudOpen() : !!force;
      this.hud.classList.toggle('is-open', on);
      document.body.classList.toggle('hud-open', on);
      if (on) this.panel.update(this.app.state());
    },

    broadcast(state) {
      this.lastState = state;
      if (this.hudOpen()) this.panel.update(state);
      this.send();
    },

    send() {
      if (!this.win || this.win.closed) return;
      try { this.win.postMessage({ bts: 'state', state: this.lastState || this.app.state() }, '*'); } catch (e) { /* nada */ }
    },

    log(msg) {
      console.info('[operador] ' + msg);
      this.panel.pushLog(msg);
      if (this.win && !this.win.closed) {
        try { this.win.postMessage({ bts: 'log', msg }, '*'); } catch (e) { /* nada */ }
      }
    }
  };
})();
