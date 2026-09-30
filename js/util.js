/* Utilidades compartidas (sin dependencias). Todo cuelga de window.BTS. */
(function () {
  'use strict';
  const BTS = (window.BTS = window.BTS || {});

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  BTS.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  BTS.pad = (n) => String(n).padStart(2, '0');
  BTS.rand = (a, b) => a + Math.random() * (b - a);
  BTS.randInt = (a, b) => Math.floor(BTS.rand(a, b + 1));
  BTS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Palabras envueltas en máscaras para animarlas una a una.
  BTS.splitWords = (text) =>
    String(text).trim().split(/\s+/)
      .map((w, i) => `<span class="w"><span class="wi" style="--i:${i}">${BTS.esc(w)}</span></span>`)
      .join(' ');

  // Letras envueltas en máscaras (los espacios se conservan).
  BTS.splitChars = (text) =>
    Array.from(String(text))
      .map((c, i) =>
        c === ' '
          ? '<span class="chm sp">&nbsp;</span>'
          : `<span class="chm"><span class="ch" style="--i:${i}">${BTS.esc(c)}</span></span>`)
      .join('');

  // Reduce el tamaño de letra hasta que el texto quepa en la altura dada.
  BTS.fitText = (el, { max, min, maxHeight, step = 2 }) => {
    let size = max;
    el.style.fontSize = size + 'px';
    while (size > min && el.scrollHeight > maxHeight) {
      size -= step;
      el.style.fontSize = size + 'px';
    }
    return size;
  };

  // Ajusta el tamaño de letra para que la línea mida exactamente `target` px
  // (el elemento debe tener width:max-content).
  BTS.fitWidth = (el, target) => {
    el.style.fontSize = '';
    const size = parseFloat(getComputedStyle(el).fontSize);
    const w = el.offsetWidth;
    if (w > 0 && size > 0) el.style.fontSize = (size * target / w).toFixed(2) + 'px';
  };

  // Rectángulo de un elemento en coordenadas del escenario 1920×1080.
  BTS.stageRect = (el) => {
    const stage = document.getElementById('stage');
    const s = (BTS.App && BTS.App.scale) || 1;
    const sr = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: (r.left - sr.left) / s, y: (r.top - sr.top) / s, w: r.width / s, h: r.height / s };
  };

  // Temporizadores agrupados: una escena los cancela todos al salir.
  BTS.Timers = class {
    constructor() { this.ids = new Set(); }
    after(ms, fn) {
      const id = setTimeout(() => {
        this.ids.delete(id);
        try { fn(); } catch (e) { console.error(e); }
      }, ms);
      this.ids.add(id);
      return id;
    }
    clear() { this.ids.forEach(clearTimeout); this.ids.clear(); }
  };

  // localStorage tolerante a fallos (modo privado, almacenamiento bloqueado…).
  BTS.store = {
    get(key) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* sin persistencia */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* nada */ }
    }
  };
})();
