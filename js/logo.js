/*
 * Logo de Davivienda Seguros con destello animado.
 * Dibuja el PNG oficial (sin alterarlo) en un <canvas> con margen extra,
 * para poder pasar un brillo por encima y un destello de lente que lo cruza.
 */
(function () {
  'use strict';
  const BTS = window.BTS;
  const PAD = 170; // margen del canvas alrededor del logo (px del PNG)

  BTS.LogoGlint = class {
    constructor(src) {
      this.el = document.createElement('div');
      this.el.className = 'logo-glint';
      this.c = document.createElement('canvas');
      this.g = this.c.getContext('2d');
      this.el.appendChild(this.c);
      this.img = new Image();
      this.ready = false;
      this.raf = 0;
      this.auto = 0;
      this.img.onload = () => {
        const w = this.img.naturalWidth, h = this.img.naturalHeight;
        this.w = w; this.h = h;
        this.c.width = w + PAD * 2; this.c.height = h + PAD * 2;
        // El canvas desborda el contenedor exactamente el margen PAD.
        Object.assign(this.c.style, {
          left: (-PAD / w * 100) + '%', top: (-PAD / h * 100) + '%',
          width: ((w + PAD * 2) / w * 100) + '%', height: ((h + PAD * 2) / h * 100) + '%'
        });
        this.el.style.aspectRatio = w + ' / ' + h;
        this.ready = true;
        this.draw(-1);
      };
      this.img.onerror = () => this.fallback();
      this.img.src = src;
    }

    draw(u) {
      const g = this.g, cw = this.c.width, ch = this.c.height;
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.clearRect(0, 0, cw, ch);
      g.drawImage(this.img, PAD, PAD, this.w, this.h);
      if (!(u >= 0 && u <= 1)) return;
      // Brillo solo sobre los píxeles del logo.
      const x = PAD - this.w * 0.35 + u * this.w * 1.7;
      const lg = g.createLinearGradient(x - 170, PAD, x + 170, PAD + this.h * 0.5);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(0.5, 'rgba(255,255,255,0.75)');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = lg; g.fillRect(0, 0, cw, ch);
      // Destello de lente que cruza el logo.
      const flare = BTS.FX && BTS.FX.tex && BTS.FX.tex.flare;
      if (flare) {
        const a = Math.sin(u * Math.PI);
        const s = 300 + 120 * a, fy = PAD + this.h * 0.56;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.85 * a;
        g.drawImage(flare, x - s / 2, fy - s / 2, s, s);
        g.globalAlpha = 1;
      }
      g.globalCompositeOperation = 'source-over';
    }

    glint(dur) {
      if (!this.ready) return;
      cancelAnimationFrame(this.raf);
      const d = dur || 1500, t0 = performance.now();
      const step = (now) => {
        const u = (now - t0) / d;
        if (u < 1) { this.draw(u); this.raf = requestAnimationFrame(step); } else this.draw(-1);
      };
      this.raf = requestAnimationFrame(step);
    }

    autoGlint(minS, maxS) {
      clearTimeout(this.auto);
      const loop = () => {
        this.auto = setTimeout(() => { this.glint(); loop(); }, BTS.rand(minS, maxS) * 1000);
      };
      loop();
    }

    destroy() { clearTimeout(this.auto); cancelAnimationFrame(this.raf); }

    // Si el PNG no carga, se muestra el nombre en texto para no dejar un hueco.
    fallback() {
      this.el.classList.add('is-fallback');
      this.el.innerHTML = '<span class="lg-name">DAVIVIENDA</span><span class="lg-sub">Seguros</span>';
      console.error('No se pudo cargar el logo: ' + this.img.src);
    }
  };
})();
