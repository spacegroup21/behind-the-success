/* Ventana del operador (operator.html). Recibe el estado y envía comandos a la presentación. */
(function () {
  'use strict';
  const BTS = window.BTS;
  const root = document.getElementById('op');
  let lastState = 0;

  function target() { const o = window.opener; return o && !o.closed ? o : null; }
  function send(cmd) {
    const o = target();
    if (!o) { panel.setConnected(false); return; }
    o.postMessage({ bts: 'cmd', cmd }, '*');
  }

  const panel = new BTS.OperatorPanel(root, send, { mode: 'window' });

  window.addEventListener('message', (e) => {
    if (!e.source || e.source !== window.opener) return;
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.bts === 'state' && d.state) { lastState = Date.now(); panel.setConnected(true); panel.update(d.state); }
    else if (d.bts === 'log') panel.pushLog(String(d.msg));
  });

  function hello() {
    const o = target();
    if (!o) {
      panel.setConnected(false);
      if (!window.opener) root.innerHTML = '<div class="op-wait">Esta ventana se abre desde la presentación: pulsa la tecla <b>O</b> en la pantalla principal.</div>';
      return;
    }
    if (Date.now() - lastState > 2500) panel.setConnected(false);
    o.postMessage({ bts: 'hello' }, '*');
  }
  hello();
  setInterval(hello, 1000);

  // Las teclas pulsadas aquí controlan la presentación igual que en la pantalla principal.
  const SKIP = new Set(['KeyO', 'KeyH', 'KeyF']);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || SKIP.has(e.code)) return;
    if (/^(Arrow|Space|Page|Enter|NumpadEnter|Backspace|Tab|F5|Home|End)/.test(e.code)) e.preventDefault();
    send({ type: 'key', code: e.code, key: e.key, shiftKey: e.shiftKey, repeat: e.repeat });
  });
})();
