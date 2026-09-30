/*
 * FX — fondo animado en <canvas> (1920×1080).
 * Recrea el telón de rayas verticales del arte BEHIND THE SUCCESS y le suma:
 * barridos de luz, reflectores, partículas, destellos tipo "flash de cámara"
 * y un visual conceptual por bloque (despertar, fortaleza, evolución, legado, futuro).
 * Todo es procedural: no carga imágenes ni librerías.
 */
(function () {
  'use strict';
  const BTS = window.BTS;
  const W = 1920, H = 1080, TAU = Math.PI * 2;

  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function seeded(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  // ---------- Texturas pre-renderizadas ----------
  // Misma semilla en ambas versiones: las rayas brillantes coinciden con las tenues.
  function buildStripes(bright) {
    const c = makeCanvas(W, H), g = c.getContext('2d'), rnd = seeded(7);
    if (!bright) { g.fillStyle = '#060607'; g.fillRect(0, 0, W, H); }
    let x = 0;
    while (x < W) {
      x += 14 + rnd() * 34;
      const w = rnd() < 0.22 ? 2 : 1;
      const a = bright ? 0.35 + rnd() * 0.45 : 0.045 + rnd() * 0.085;
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgba(255,255,255,${a * 0.85})`);
      grad.addColorStop(0.45, `rgba(255,255,255,${a})`);
      grad.addColorStop(1, `rgba(255,255,255,${a * 0.3})`);
      g.fillStyle = grad;
      g.fillRect(Math.round(x), 0, w, H);
    }
    return c;
  }

  function buildVignette() {
    const c = makeCanvas(W, H), g = c.getContext('2d');
    const rg = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 1.05);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.82)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    return c;
  }

  function buildFlare() {
    const s = 512, m = s / 2, c = makeCanvas(s, s), g = c.getContext('2d');
    const rg = g.createRadialGradient(m, m, 0, m, m, m);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.05, 'rgba(255,255,255,0.9)');
    rg.addColorStop(0.16, 'rgba(255,244,238,0.28)');
    rg.addColorStop(0.45, 'rgba(255,236,230,0.06)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = 'lighter';
    const streak = (angle, len, width, alpha) => {
      g.save(); g.translate(m, m); g.rotate(angle);
      const lg = g.createLinearGradient(-len, 0, len, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lg; g.beginPath(); g.ellipse(0, 0, len, width, 0, 0, TAU); g.fill();
      g.restore();
    };
    streak(0, m, 3, 0.9);
    streak(Math.PI / 2, m * 0.8, 2.5, 0.8);
    streak(Math.PI / 4, m * 0.42, 1.5, 0.45);
    streak(-Math.PI / 4, m * 0.42, 1.5, 0.45);
    return c;
  }

  function buildStreak() {
    const c = makeCanvas(1024, 64), g = c.getContext('2d');
    g.save(); g.translate(512, 32); g.scale(1, 0.06);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, 512);
    rg.addColorStop(0, 'rgba(255,235,235,0.9)');
    rg.addColorStop(0.3, 'rgba(255,120,120,0.25)');
    rg.addColorStop(1, 'rgba(255,60,60,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 512, 0, TAU); g.fill();
    g.restore();
    return c;
  }

  function buildDot(r, gr, b) {
    const c = makeCanvas(64, 64), g = c.getContext('2d');
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, `rgba(${r},${gr},${b},1)`);
    rg.addColorStop(0.35, `rgba(${r},${gr},${b},0.45)`);
    rg.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return c;
  }

  // ---------- Visuales conceptuales por bloque ----------
  // draw(g, t, k, tex, dt): k = intensidad 0..1. Se dibujan en modo 'lighter'.
  const MODES = {
    // 01 DESPERTAR — amanecer: horizonte que se abre, resplandor y rayos que suben.
    despertar: {
      draw(g, t, k) {
        const cx = W * 0.62, hy = H * 0.82;
        const glow = g.createRadialGradient(cx, hy + 80, 0, cx, hy + 80, 980);
        glow.addColorStop(0, `rgba(255,214,196,${0.5 * k})`);
        glow.addColorStop(0.1, `rgba(237,28,36,${0.42 * k})`);
        glow.addColorStop(0.42, `rgba(150,10,18,${0.13 * k})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = glow; g.fillRect(0, 0, W, H);
        g.save(); g.translate(cx, hy);
        for (let i = 0; i < 15; i++) {
          const a = -Math.PI / 2 + (i - 7) * 0.15 + Math.sin(t * 0.13 + i) * 0.035;
          const wd = 0.03 + 0.018 * Math.sin(t * 0.45 + i * 1.7);
          const len = 1400;
          const lg = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
          lg.addColorStop(0, `rgba(255,190,180,${0.11 * k})`);
          lg.addColorStop(1, 'rgba(255,190,180,0)');
          g.fillStyle = lg; g.beginPath(); g.moveTo(0, 0);
          g.lineTo(Math.cos(a - wd) * len, Math.sin(a - wd) * len);
          g.lineTo(Math.cos(a + wd) * len, Math.sin(a + wd) * len);
          g.closePath(); g.fill();
        }
        g.restore();
        const lw = W * 0.55 * k;
        const hl = g.createLinearGradient(cx - lw, 0, cx + lw, 0);
        hl.addColorStop(0, 'rgba(255,255,255,0)');
        hl.addColorStop(0.5, `rgba(255,255,255,${0.85 * k})`);
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = hl; g.fillRect(cx - lw, hy - 1, lw * 2, 2);
      }
    },

    // 02 FORTALEZA — pilares de luz que se sostienen juntos, unidos por un haz
    // horizontal; un pulso sube por todos a la vez.
    fortaleza: {
      init() {
        const r = seeded(11), n = 17;
        this.cols = [];
        for (let i = 0; i < n; i++) {
          const u = i / (n - 1);
          const x = W * 0.5 + (u - 0.5) * W * 1.02;
          const arch = 1 - Math.pow((u - 0.64) * 1.7, 2);
          this.cols.push({ x, w: 8 + r() * 10, h: 0.3 + 0.36 * Math.max(0, arch), ph: r() * TAU });
        }
      },
      draw(g, t, k, tex) {
        const pulse = (t % 5) / 5, grow = 0.35 + 0.65 * k;
        let topAvg = 0;
        for (const c of this.cols) {
          const h = H * c.h * (0.96 + 0.04 * Math.sin(t * 0.5 + c.ph)) * grow;
          const y = H - h, x = c.x - c.w / 2;
          topAvg += y;
          // halo ancho y núcleo fino: se lee como columna de luz, no como barra
          const halo = g.createLinearGradient(0, y, 0, H);
          halo.addColorStop(0, `rgba(237,28,36,${0.09 * k})`);
          halo.addColorStop(1, 'rgba(237,28,36,0)');
          g.fillStyle = halo; g.fillRect(x - c.w * 2, y, c.w * 5, h);
          const core = g.createLinearGradient(0, y, 0, H);
          core.addColorStop(0, `rgba(255,235,235,${0.55 * k})`);
          core.addColorStop(0.35, `rgba(237,28,36,${0.35 * k})`);
          core.addColorStop(1, 'rgba(237,28,36,0)');
          g.fillStyle = core; g.fillRect(c.x - 1.5, y, 3, h);
          g.globalAlpha = 0.7 * k; g.drawImage(tex.dot, c.x - 14, y - 14, 28, 28); g.globalAlpha = 1;
          const py = H - pulse * h, pa = 0.5 * k * Math.sin(pulse * Math.PI);
          if (pa > 0.01) { g.globalAlpha = pa; g.drawImage(tex.dot, c.x - 22, py - 22, 44, 44); g.globalAlpha = 1; }
        }
        // haz que une las columnas
        const by = topAvg / this.cols.length + 40;
        const bl = g.createLinearGradient(0, 0, W, 0);
        bl.addColorStop(0, 'rgba(255,255,255,0)');
        bl.addColorStop(0.6, `rgba(255,255,255,${0.35 * k})`);
        bl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = bl; g.fillRect(0, by, W, 1.5);
      }
    },

    // 03 EVOLUCIÓN — doble hélice que crece y asciende de izquierda a derecha.
    evolucion: {
      draw(g, t, k, tex) {
        const N = 110, x0 = W * 0.26, x1 = W + 60;
        const pt = (u, s) => {
          const ph = u * 9 - t * 1.05 + s * Math.PI;
          return { x: x0 + (x1 - x0) * u, y: H * 0.8 - u * H * 0.42 + Math.sin(ph) * (40 + 150 * u), z: (Math.cos(ph) + 1) / 2 };
        };
        g.strokeStyle = `rgba(255,255,255,${0.1 * k})`; g.lineWidth = 1.5; g.beginPath();
        for (let i = 0; i <= N; i += 3) { const a = pt(i / N, 0), b = pt(i / N, 1); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
        g.stroke();
        for (let s = 0; s < 2; s++) {
          for (let i = 0; i <= N; i++) {
            const u = i / N, p = pt(u, s);
            const size = (6 + 18 * p.z) * (0.6 + 0.6 * u);
            g.globalAlpha = k * (0.12 + 0.6 * p.z) * Math.min(1, u * 4);
            g.drawImage(s ? tex.dotRed : tex.dot, p.x - size / 2, p.y - size / 2, size, size);
          }
        }
        g.globalAlpha = 1;
      }
    },

    // 04 EL LEGADO — anillos concéntricos que se expanden: huella que perdura.
    legado: {
      draw(g, t, k, tex) {
        const cx = W * 0.72, cy = H * 0.68, R = 1150, N = 13, sp = R / N;
        g.lineWidth = 2;
        for (let i = 0; i < N; i++) {
          const r = (t * 32 + i * sp) % R;
          const a = k * 0.42 * (1 - r / R) * Math.min(1, r / 90);
          if (a < 0.005) continue;
          g.strokeStyle = i % 3 === 0 ? `rgba(237,28,36,${a})` : `rgba(255,255,255,${a * 0.65})`;
          g.setLineDash(i % 2 ? [3, 13] : []);
          g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
        }
        g.setLineDash([]);
        const s = 300 + 30 * Math.sin(t * 0.8);
        g.globalAlpha = k * 0.75; g.drawImage(tex.dotRed, cx - s / 2, cy - s / 2, s, s);
        g.globalAlpha = k * 0.9; g.drawImage(tex.dot, cx - 30, cy - 30, 60, 60);
        g.globalAlpha = 1;
      }
    },

    // 05 EL FUTURO — horizonte con retícula en perspectiva y estrellas hacia el espectador.
    futuro: {
      init() {
        this.stars = [];
        for (let i = 0; i < 150; i++) this.stars.push(this.star(Math.random()));
      },
      star(d) { return { a: Math.PI + Math.random() * Math.PI, d, sp: 0.12 + Math.random() * 0.3 }; },
      draw(g, t, k, tex, dt) {
        const vx = W * 0.64, vy = H * 0.58;
        const hg = g.createLinearGradient(0, vy - 140, 0, vy + 140);
        hg.addColorStop(0, 'rgba(237,28,36,0)');
        hg.addColorStop(0.5, `rgba(237,28,36,${0.3 * k})`);
        hg.addColorStop(1, 'rgba(237,28,36,0)');
        g.fillStyle = hg; g.fillRect(0, vy - 140, W, 280);
        g.fillStyle = `rgba(255,255,255,${0.7 * k})`; g.fillRect(0, vy - 1, W, 2);
        g.lineWidth = 1.4; g.strokeStyle = `rgba(237,28,36,${0.38 * k})`; g.beginPath();
        for (let i = -16; i <= 16; i++) { g.moveTo(vx + i * 6, vy + 2); g.lineTo(vx + i * 240, H + 20); }
        g.stroke();
        const M = 14, off = (t * 0.55) % 1;
        for (let j = 0; j < M; j++) {
          const z = (j + off) / M, y = vy + (H - vy) * Math.pow(z, 2.3);
          g.fillStyle = `rgba(255,120,120,${0.35 * k * z})`; g.fillRect(0, y, W, 1.4);
        }
        g.lineWidth = 1.6;
        for (let i = 0; i < this.stars.length; i++) {
          const s = this.stars[i];
          s.d += dt * s.sp * (0.15 + s.d);
          if (s.d > 1) { this.stars[i] = this.star(0.02); continue; }
          const d1 = s.d * 1250, d0 = d1 * 0.86;
          const c = Math.cos(s.a), sn = Math.sin(s.a) * 0.72;
          g.strokeStyle = `rgba(255,255,255,${0.8 * k * s.d})`;
          g.beginPath(); g.moveTo(vx + c * d0, vy + sn * d0); g.lineTo(vx + c * d1, vy + sn * d1); g.stroke();
        }
      }
    }
  };

  // ---------- Motor ----------
  const FX = (BTS.FX = {
    init(canvas) {
      this.canvas = canvas;
      this.g = canvas.getContext('2d');
      this.tex = {
        dim: buildStripes(false), bright: buildStripes(true), vig: buildVignette(),
        flare: buildFlare(), streak: buildStreak(), dot: buildDot(255, 255, 255), dotRed: buildDot(237, 28, 36)
      };
      for (const k in MODES) if (MODES[k].init) MODES[k].init();
      // p = valores actuales, pt = objetivos (se interpolan suavemente)
      this.p = { sweep: 0.8, spot: 0, flares: 0.15, dust: 0.9, corners: 0.6, floor: 0 };
      this.pt = Object.assign({}, this.p);
      this.layers = {};
      this.flares = [];
      this.acc = 0;
      this.dust = [];
      for (let i = 0; i < 80; i++) {
        this.dust.push({
          x: Math.random() * W, y: Math.random() * H, s: 8 + Math.random() * 22,
          vy: -(5 + Math.random() * 14), vx: -3 + Math.random() * 6, ph: Math.random() * TAU,
          tw: 0.4 + Math.random() * 1.2, red: Math.random() < 0.25
        });
      }
      this.t = 0;
      this.last = performance.now();
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    },

    // set({ mode, intensity, params })
    set(o) {
      if (!o) return;
      if ('mode' in o) {
        for (const n in this.layers) this.layers[n].target = 0;
        if (o.mode && MODES[o.mode]) {
          const L = this.layers[o.mode] || (this.layers[o.mode] = { k: 0, target: 0 });
          L.target = o.intensity == null ? 1 : o.intensity;
        }
      }
      if (o.params) Object.assign(this.pt, o.params);
    },

    flash(x, y, s, delay) {
      if (this.flares.length > 48) return;
      this.flares.push({ x, y, s: s || BTS.rand(0.35, 0.7), age: -(delay || 0), life: BTS.rand(0.7, 1.3) });
    },

    // Ráfaga de destellos dentro de un rectángulo (coordenadas del escenario).
    burst(n, rect, spread) {
      const r = rect || { x: 0, y: 0, w: W, h: H };
      for (let i = 0; i < n; i++) {
        this.flash(r.x + Math.random() * r.w, r.y + Math.random() * r.h, BTS.rand(0.3, 0.75), Math.random() * (spread == null ? 1 : spread));
      }
    },

    spawnAmbient() {
      // Evita el centro de la pantalla, donde vive el texto.
      let x = 0, y = 0;
      for (let i = 0; i < 8; i++) {
        x = BTS.rand(40, W - 40); y = BTS.rand(40, H - 40);
        if (!(x > 360 && x < W - 360 && y > 200 && y < H - 200)) break;
      }
      this.flash(x, y, BTS.rand(0.22, 0.6), 0);
    },

    drawFlare(x, y, scale, alpha) {
      const g = this.g, t = this.tex;
      if (alpha <= 0.005) return;
      g.globalAlpha = Math.min(1, alpha);
      const s = 512 * scale;
      g.drawImage(t.flare, x - s / 2, y - s / 2, s, s);
      const sw = 1024 * scale * 1.3, sh = 64 * scale;
      g.globalAlpha = Math.min(1, alpha * 0.6);
      g.drawImage(t.streak, x - sw / 2, y - sh / 2, sw, sh);
      g.globalAlpha = 1;
    },

    frame(now) {
      requestAnimationFrame(this.frame);
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (!(dt > 0)) return;
      if (dt > 0.1) dt = 0.1;
      this.t += dt;
      try { this.draw(dt); } catch (e) {
        if (!this.warned) { this.warned = true; console.error('FX', e); }
      }
    },

    draw(dt) {
      const g = this.g, t = this.t, p = this.p, tex = this.tex;
      const ease = Math.min(1, dt * 1.8);
      for (const k in this.pt) p[k] += (this.pt[k] - p[k]) * ease;

      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.drawImage(tex.dim, 0, 0);

      // Barridos de luz sobre las rayas (dos bandas a velocidades distintas: no se nota el loop).
      if (p.sweep > 0.01) {
        const bands = [
          { pos: (t / 17) % 1, dir: 1, width: 760, a: 1 },
          { pos: (t / 27.5 + 0.5) % 1, dir: -1, width: 520, a: 0.6 }
        ];
        for (const b of bands) {
          const span = W + b.width * 2;
          let cx = -b.width + b.pos * span;
          if (b.dir < 0) cx = W - cx;
          const slices = 24, sw = (b.width * 2) / slices;
          for (let i = 0; i < slices; i++) {
            let x0 = cx - b.width + i * sw, x1 = x0 + sw;
            if (x1 <= 0 || x0 >= W) continue;
            const u = ((i + 0.5) / slices) * 2 - 1;
            const a = p.sweep * b.a * Math.pow(1 - u * u, 2) * 0.55;
            if (a < 0.01) continue;
            x0 = Math.max(0, x0); x1 = Math.min(W, x1);
            g.globalAlpha = a;
            g.drawImage(tex.bright, x0, 0, x1 - x0, H, x0, 0, x1 - x0, H);
          }
        }
        g.globalAlpha = 1;
      }

      g.globalCompositeOperation = 'lighter';

      // Reflectores desde arriba.
      if (p.spot > 0.01) {
        const beams = [{ x: W * 0.16, ph: 0, side: -1 }, { x: W * 0.84, ph: 2.1, side: 1 }];
        for (const s of beams) {
          const ang = Math.sin(t * 0.33 + s.ph) * 0.3 - s.side * 0.2;
          const len = 1500, half = 250;
          const ex = s.x + Math.sin(ang) * len, ey = -40 + Math.cos(ang) * len;
          const nx = Math.cos(ang) * half, ny = -Math.sin(ang) * half;
          const lg = g.createLinearGradient(s.x, -40, ex, ey);
          lg.addColorStop(0, `rgba(255,255,255,${0.16 * p.spot})`);
          lg.addColorStop(0.6, `rgba(255,255,255,${0.04 * p.spot})`);
          lg.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = lg; g.beginPath(); g.moveTo(s.x, -40); g.lineTo(ex + nx, ey + ny); g.lineTo(ex - nx, ey - ny); g.closePath(); g.fill();
        }
      }

      // Visual del bloque (con fundido entre bloques).
      for (const name in this.layers) {
        const L = this.layers[name];
        L.k += (L.target - L.k) * Math.min(1, dt * 1.5);
        if (L.target === 0 && L.k < 0.004) { delete this.layers[name]; continue; }
        if (L.k > 0.004) MODES[name].draw(g, t, L.k, tex, dt);
      }

      // Piso de escenario: línea de luz a media pantalla y resplandor por debajo.
      // Separa la zona legible (arriba) de la zona de motion (abajo).
      if (p.floor > 0.01) {
        const fy = 540, k = p.floor, breathe = 0.85 + 0.15 * Math.sin(t * 0.6);
        const haze = g.createRadialGradient(W / 2, fy, 0, W / 2, fy, 900);
        haze.addColorStop(0, `rgba(237,28,36,${0.16 * k * breathe})`);
        haze.addColorStop(0.5, `rgba(237,28,36,${0.05 * k})`);
        haze.addColorStop(1, 'rgba(237,28,36,0)');
        g.save(); g.translate(0, fy); g.scale(1, 0.34); g.translate(0, -fy);
        g.fillStyle = haze; g.fillRect(0, fy, W, 900);
        g.restore();
        const ln = g.createLinearGradient(0, 0, W, 0);
        ln.addColorStop(0, 'rgba(255,255,255,0)');
        ln.addColorStop(0.5, `rgba(255,255,255,${0.55 * k * breathe})`);
        ln.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = ln; g.fillRect(0, fy, W, 2);
        // destello que recorre la línea del piso
        const sx = ((t / 9) % 1) * (W + 600) - 300;
        g.globalAlpha = 0.5 * k; g.drawImage(tex.streak, sx - 400, fy - 24, 800, 48); g.globalAlpha = 1;
        // líneas de perspectiva muy tenues sobre el piso
        g.strokeStyle = `rgba(255,255,255,${0.035 * k})`; g.lineWidth = 1; g.beginPath();
        for (let i = -12; i <= 12; i++) { g.moveTo(W / 2 + i * 40, fy + 2); g.lineTo(W / 2 + i * 260, H); }
        g.stroke();
        // luces que avanzan por el piso hacia el público
        for (let i = -12; i <= 12; i++) {
          for (let j = 0; j < 2; j++) {
            const u = ((t * 0.07 + j * 0.5 + ((i * 0.37) % 1 + 1) % 1) % 1), z = u * u;
            const x = W / 2 + i * 40 + (i * 220) * z, y = fy + 2 + (H - fy) * z, sz = 6 + 26 * z;
            g.globalAlpha = k * 0.55 * Math.sin(u * Math.PI);
            g.drawImage((i + j) % 3 === 0 ? tex.dotRed : tex.dot, x - sz / 2, y - sz / 2, sz, sz);
          }
        }
        g.globalAlpha = 1;
      }

      // Partículas de polvo luminoso.
      if (p.dust > 0.01) {
        for (const d of this.dust) {
          d.y += d.vy * dt;
          d.x += (d.vx + Math.sin(t * 0.3 + d.ph) * 4) * dt;
          if (d.y < -30) { d.y = H + 30; d.x = Math.random() * W; }
          if (d.x < -30) d.x = W + 30; else if (d.x > W + 30) d.x = -30;
          g.globalAlpha = p.dust * (0.12 + 0.34 * (0.5 + 0.5 * Math.sin(t * d.tw + d.ph)));
          g.drawImage(d.red ? tex.dotRed : tex.dot, d.x - d.s / 2, d.y - d.s / 2, d.s, d.s);
        }
        g.globalAlpha = 1;
      }

      // Destellos fijos en esquinas (como en el arte del evento).
      if (p.corners > 0.01) {
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.7);
        this.drawFlare(W - 150, 95, 1.05 * pulse, 0.5 * p.corners);
        this.drawFlare(165, H - 110, 0.9 * (1.4 - pulse * 0.4), 0.42 * p.corners);
      }

      // Destellos transitorios (flashes de cámara).
      this.acc += p.flares * dt * 3;
      while (this.acc >= 1) { this.acc -= 1; this.spawnAmbient(); }
      for (let i = this.flares.length - 1; i >= 0; i--) {
        const f = this.flares[i];
        f.age += dt;
        if (f.age < 0) continue;
        const u = f.age / f.life;
        if (u >= 1) { this.flares.splice(i, 1); continue; }
        const a = u < 0.08 ? u / 0.08 : Math.pow(1 - (u - 0.08) / 0.92, 2);
        this.drawFlare(f.x, f.y, f.s * (0.8 + 0.4 * u), a * 0.95);
      }

      g.globalCompositeOperation = 'source-over';
      g.drawImage(tex.vig, 0, 0);
    }
  });
})();
