/*
 * Panel del operador. Se usa en dos lugares con el mismo código:
 *  - Ventana aparte (operator.html, tecla O) → para la laptop, fuera de la LED.
 *  - Panel superpuesto (tecla H) dentro de la presentación.
 * Solo dibuja el estado que recibe y envía comandos; no tiene lógica propia.
 */
(function () {
  'use strict';
  const BTS = (window.BTS = window.BTS || {});
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  const pad = (n) => String(n).padStart(2, '0');

  const KEYS = [
    ['→ / Espacio / AvPág', 'Avanzar'], ['← / RePág', 'Retroceder'],
    ['↓ / ↑', 'Bloque siguiente / anterior'], ['1 – 5', 'Ir al bloque'],
    ['1 – 5 (en sorpresa)', 'Revelar cuadro'], ['Shift + nº', 'Mostrar otra vez'],
    ['Shift + R', 'Reiniciar sorpresa'], ['S / C', 'Sorpresa / Cierre'],
    ['E', 'Espera (y volver)'], ['B o .', 'Pantalla negra'],
    ['Inicio', 'Volver al inicio'], ['F', 'Pantalla completa'],
    ['O', 'Ventana de operador'], ['H', 'Este panel']
  ];

  class OperatorPanel {
    constructor(root, send, opts) {
      this.root = root;
      this.send = send;
      this.mode = (opts && opts.mode) || 'hud';
      this.sig = '';
      this.state = null;
      this.sceneSince = Date.now();
      this.lastIndex = -1;
      this.confirmUntil = 0;
      root.classList.add('op', 'op--' + this.mode);
      root.innerHTML = '<div class="op-wait">Conectando con la presentación…</div>';
      root.addEventListener('mousedown', (e) => { if (e.target.closest('button,[data-cmd]')) e.preventDefault(); });
      root.addEventListener('click', (e) => this.onClick(e));
      setInterval(() => this.tick(), 1000);
    }

    build(s) {
      const hud = this.mode === 'hud';
      let lastGroup = '';
      const list = s.scenes.map((sc, i) => {
        let head = '';
        if (sc.group !== lastGroup) { lastGroup = sc.group; head = `<li class="op-grp">${esc(sc.group)}</li>`; }
        return head + `<li class="op-sc" data-cmd="go" data-i="${i}"><span>${pad(i)}</span>${esc(sc.title)}</li>`;
      }).join('');

      this.root.innerHTML = `
        <header class="op-head">
          <div class="op-brand"><b>BEHIND</b> THE SUCCESS <small>Operador</small></div>
          <div class="op-chips">
            <span class="op-chip is-bad" data-f="disc">SIN CONEXIÓN</span>
            <span class="op-chip is-warn" data-f="standby">ESPERA</span>
            <span class="op-chip is-warn" data-f="black">PANTALLA NEGRA</span>
          </div>
          <div class="op-clock"><b data-f="clock">--:--</b><small data-f="since"></small></div>
          ${hud ? '<button class="op-x" data-cmd="hud-close" title="Cerrar (H)">✕</button>' : ''}
        </header>
        <div class="op-body">
          <section class="op-card op-now">
            <div class="op-label">En pantalla <span data-f="pos"></span></div>
            <div class="op-title" data-f="title"></div>
            <div class="op-text" data-f="text"></div>
            <div class="op-notes" data-f="notes"></div>
            <div class="op-next">Siguiente → <b data-f="next"></b></div>
          </section>
          <section class="op-card op-ctrl">
            <div class="op-row op-row-big">
              <button class="op-btn op-big" data-cmd="prev">◀ Anterior</button>
              <button class="op-btn op-big is-primary" data-cmd="next">Siguiente ▶</button>
            </div>
            <div class="op-label">Ir a bloque</div>
            <div class="op-row">${s.blocks.map((b, i) =>
              `<button class="op-btn op-blk" data-cmd="block" data-i="${i}"><b>${pad(i + 1)}</b>${esc(b)}</button>`).join('')}</div>
            <div class="op-row">
              <button class="op-btn" data-cmd="home">⌂ Inicio</button>
              <button class="op-btn" data-cmd="standby" data-f="standbyBtn">Espera</button>
              <button class="op-btn" data-cmd="black" data-f="blackBtn">Negro</button>
              <button class="op-btn" data-cmd="surprise-go">Sorpresa</button>
              <button class="op-btn" data-cmd="closing">Cierre</button>
              ${hud ? '<button class="op-btn" data-cmd="fullscreen">Pantalla completa</button>' : ''}
            </div>
          </section>
          <section class="op-card op-sp">
            <div class="op-label">Preguntas sorpresa <span data-f="spcount"></span></div>
            <div class="op-sp-list">${s.surprise.questions.map((q, i) => `
              <div class="op-sp-item" data-sp="${i}">
                <b>${pad(i + 1)}</b><span class="q">${esc(q)}</span>
                <span class="st"></span>
                <button class="op-btn op-sm" data-cmd="sp-select" data-i="${i}"></button>
              </div>`).join('')}</div>
            <div class="op-row">
              <button class="op-btn" data-cmd="sp-close">Cerrar pregunta</button>
              <button class="op-btn is-danger" data-cmd="sp-reset" data-f="resetBtn">Reiniciar dinámica</button>
            </div>
          </section>
          <section class="op-card op-list">
            <div class="op-label">Recorrido completo <span>(clic para saltar)</span></div>
            <ol>${list}</ol>
          </section>
          <section class="op-card op-keys">
            <div class="op-label">Teclado</div>
            <dl>${KEYS.map(([k, d]) => `<dt>${esc(k)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>
          </section>
          <div class="op-log" data-f="log"></div>
        </div>`;
      this.f = {};
      this.root.querySelectorAll('[data-f]').forEach((el) => { this.f[el.dataset.f] = el; });
      this.setConnected(this.connected !== false);
    }

    update(s) {
      if (!s || !s.scenes) return;
      const sig = s.scenes.map((x) => x.title).join('|') + '#' + s.surprise.questions.join('|');
      if (sig !== this.sig) { this.sig = sig; this.build(s); }
      if (s.index !== this.lastIndex) { this.lastIndex = s.index; this.sceneSince = Date.now(); }
      this.state = s;
      const f = this.f, cur = s.current;
      f.pos.textContent = `· ${pad(s.index)} de ${pad(s.total - 1)}`;
      f.title.textContent = cur.title || '';
      if (cur.list && cur.list.length) {
        f.text.innerHTML = `<div class="op-guide">${esc(cur.listTitle)}</div><ol class="op-qlist">${cur.list.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`;
      } else {
        f.text.textContent = cur.text || '';
      }
      f.text.style.display = cur.text || (cur.list && cur.list.length) ? '' : 'none';
      f.notes.textContent = cur.notes ? 'Nota: ' + cur.notes : '';
      f.notes.style.display = cur.notes ? '' : 'none';
      f.next.textContent = s.next || '— fin del recorrido —';
      f.standby.style.display = s.standby ? '' : 'none';
      f.black.style.display = s.black ? '' : 'none';
      f.standbyBtn.textContent = s.standbyReturn ? 'Volver de espera' : 'Espera';
      f.standbyBtn.classList.toggle('is-on', s.standby);
      f.blackBtn.classList.toggle('is-on', s.black);

      const sp = s.surprise;
      f.spcount.textContent = `· ${sp.revealed.length} de ${sp.questions.length} reveladas` + (sp.onScreen ? '' : ' · (fuera de la dinámica)');
      this.root.querySelectorAll('.op-sp-item').forEach((row) => {
        const i = +row.dataset.sp, used = sp.revealed.includes(i), live = sp.active === i;
        row.classList.toggle('is-used', used);
        row.classList.toggle('is-live', live);
        row.querySelector('.st').textContent = live ? 'EN PANTALLA' : used ? 'Revelada' : 'Disponible';
        const b = row.querySelector('button');
        b.textContent = used ? 'Mostrar otra vez' : 'Revelar';
        b.dataset.force = used ? '1' : '';
      });

      this.root.querySelectorAll('.op-sc').forEach((li) => {
        const i = +li.dataset.i;
        li.classList.toggle('is-now', i === s.index);
        li.classList.toggle('is-past', i < s.index);
      });
      const now = this.root.querySelector('.op-sc.is-now');
      if (now && this.lastScrolled !== s.index) {
        this.lastScrolled = s.index;
        const ol = now.parentNode;
        ol.scrollTop = Math.max(0, now.offsetTop - ol.offsetTop - ol.clientHeight / 2 + now.offsetHeight / 2);
      }
      this.tick();
    }

    setConnected(on) {
      this.connected = on;
      if (this.f && this.f.disc) this.f.disc.style.display = on ? 'none' : '';
    }

    pushLog(msg) {
      if (!this.f || !this.f.log) return;
      const t = new Date();
      const line = document.createElement('div');
      line.textContent = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}  ${msg}`;
      this.f.log.prepend(line);
      while (this.f.log.childNodes.length > 6) this.f.log.lastChild.remove();
    }

    tick() {
      if (!this.f || !this.f.clock) return;
      const t = new Date();
      this.f.clock.textContent = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
      const s = Math.floor((Date.now() - this.sceneSince) / 1000);
      this.f.since.textContent = `en escena ${Math.floor(s / 60)}:${pad(s % 60)}`;
      if (this.f.resetBtn && this.confirmUntil && Date.now() > this.confirmUntil) {
        this.confirmUntil = 0;
        this.f.resetBtn.textContent = 'Reiniciar dinámica';
        this.f.resetBtn.classList.remove('is-confirm');
      }
    }

    onClick(e) {
      const b = e.target.closest('[data-cmd]');
      if (!b) return;
      e.stopPropagation();
      const type = b.dataset.cmd;
      const cmd = { type };
      if (b.dataset.i != null) cmd.i = +b.dataset.i;
      if (type === 'sp-select') cmd.force = b.dataset.force === '1';
      // Reiniciar pide un segundo clic de confirmación.
      if (type === 'sp-reset' && Date.now() > this.confirmUntil) {
        this.confirmUntil = Date.now() + 3000;
        b.textContent = '¿Seguro? Clic otra vez';
        b.classList.add('is-confirm');
        return;
      }
      if (type === 'sp-reset') { this.confirmUntil = 0; b.textContent = 'Reiniciar dinámica'; b.classList.remove('is-confirm'); }
      this.send(cmd);
    }
  }

  BTS.OperatorPanel = OperatorPanel;
})();
