/*
 * Escenas. Cada renderizador devuelve:
 *   el       → <section> de la escena
 *   chrome   → qué elementos fijos mostrar { lockup, logo }
 *   fx       → configuración del fondo animado
 *   layout() → ajustes de tamaño (se llama con la escena ya en el DOM)
 *   enter()  → animaciones de entrada
 *   dispose()→ limpia temporizadores al salir
 *   onAction(a) → opcional, intercepta 'next' / 'prev'
 *
 * COMPOSICIÓN PARA LED FRENTE A PÚBLICO SENTADO:
 * todo lo que se lee vive en la mitad superior (.upper, y < 540 px).
 * La mitad inferior es un "piso de escenario": reflejo tenue, luces y motion.
 */
(function () {
  'use strict';
  const BTS = window.BTS;
  const { esc, pad, splitWords, splitChars } = BTS;
  const LOGO = 'assets/logos/davivienda-seguros-blanco.png';
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const FLOOR = 540; // línea del piso: nada legible por debajo

  function section(type, html, extra) {
    const s = document.createElement('section');
    s.className = 'scene scene--' + type + (extra ? ' ' + extra : '');
    s.innerHTML = html;
    return s;
  }
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));
  const btsLine = (extraCls, d) =>
    `<div class="bts-line ${extraCls || ''}"${d ? ` data-in style="--d:${d}ms"` : ''}><i class="ln"></i><span><b class="r">BEHIND</b> THE SUCCESS</span><i class="ln"></i></div>`;

  // Caída de letras con desenfoque (BEHIND, GRACIAS…)
  function dropChars(chars, delay, gap, onLand) {
    chars.forEach((ch, i) => {
      ch.animate(
        [
          { opacity: 0, transform: 'translateY(-150px) scale(1.5)', filter: 'blur(14px)' },
          { opacity: 1, transform: 'none', filter: 'blur(0px)' }
        ],
        { duration: 720, delay: delay + i * gap, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'both' }
      );
      if (onLand) onLand(ch, delay + i * gap + 520);
    });
  }
  const flashOn = (T) => (ch, at) => T.after(at, () => {
    const r = BTS.stageRect(ch);
    BTS.FX.flash(r.x + r.w / 2, r.y + BTS.rand(0, r.h), 0.45);
  });

  const R = {};

  // ------------------------------------------------------------ ESPERA (inicio y final)
  // Loop del logo Davivienda Seguros. Se usa al inicio y también como pantalla final.
  function logoLoop(captions) {
    const root = section('standby', `
      <div class="upper">
        <div class="sb-logo"><div class="sb-logo-anim"></div></div>
        <div class="sb-caption"><div class="sb-caption-text"></div><i class="sb-caption-rule"></i></div>
      </div>`);
    const logo = new BTS.LogoGlint(LOGO);
    const anim = $(root, '.sb-logo-anim');
    anim.appendChild(logo.el);
    const cap = $(root, '.sb-caption'), capText = $(root, '.sb-caption-text');
    const T = new BTS.Timers();
    const caps = (captions || []).filter(Boolean);
    let ci = 0, cycle = 0, cur = null;

    const ENTER = [
      { d: 1700, f: [{ opacity: 1, clipPath: 'inset(-40% 120% -40% -20%)' }, { opacity: 1, clipPath: 'inset(-40% -20% -40% -20%)' }] },
      { d: 2300, f: [{ opacity: 0, transform: 'scale(1.16)', filter: 'blur(22px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }] },
      { d: 1900, f: [{ opacity: 0, transform: 'translateY(80px)' }, { opacity: 1, transform: 'translateY(0)' }] }
    ];
    const EXIT = [
      { d: 1100, f: [{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }, { opacity: 0, transform: 'scale(.9)', filter: 'blur(18px)' }] },
      { d: 1000, f: [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-70px)' }] },
      { d: 1100, f: [{ opacity: 1, clipPath: 'inset(-40% -20% -40% -20%)' }, { opacity: 1, clipPath: 'inset(-40% -20% -40% 120%)' }] }
    ];
    const play = (def) => {
      if (cur) cur.cancel();
      cur = anim.animate(def.f, { duration: def.d, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' });
    };

    function showCaption(text) {
      capText.innerHTML = splitChars(text);
      cap.classList.remove('is-hide', 'is-show');
      void cap.offsetWidth;
      cap.classList.add('is-show');
    }
    function hideCaption() {
      if (cap.classList.contains('is-show')) { cap.classList.remove('is-show'); cap.classList.add('is-hide'); }
    }
    function phaseLogo() {
      root.classList.remove('is-caption');
      hideCaption();
      T.after(BTS.rand(11000, 16000), phaseCaption);
    }
    function phaseCaption() {
      if (!caps.length) return phaseRenew();
      root.classList.add('is-caption');
      T.after(1000, () => showCaption(caps[ci++ % caps.length]));
      T.after(BTS.rand(7500, 9500), () => { cycle++; if (cycle % 2 === 0) phaseRenew(); else phaseLogo(); });
    }
    // Cada cierto tiempo el logo sale y vuelve a entrar con otra animación.
    function phaseRenew() {
      hideCaption();
      root.classList.remove('is-caption');
      T.after(1200, () => {
        play(EXIT[BTS.randInt(0, EXIT.length - 1)]);
        T.after(1500, () => {
          play(ENTER[BTS.randInt(0, ENTER.length - 1)]);
          BTS.FX.burst(3, { x: 560, y: 120, w: 800, h: 360 }, 1.2);
          T.after(1400, () => logo.glint());
          T.after(2200, phaseLogo);
        });
      });
    }

    return {
      el: root,
      chrome: {},
      fx: { mode: null, params: { sweep: 1, spot: 0, flares: 0.22, dust: 1, corners: 0.7, floor: 1 } },
      enter() {
        play(ENTER[1]);
        T.after(900, () => logo.glint());
        logo.autoGlint(6, 10);
        T.after(1500, phaseLogo);
      },
      dispose() { T.clear(); logo.destroy(); }
    };
  }
  R.standby = (scene, app) => logoLoop(app.C.standby && app.C.standby.captions);

  // ------------------------------------------------------------ EVENTO
  R.event = (scene, app) => {
    const root = section('event', `
      <div class="upper">
        <div class="ev-wrap">
          <div class="ev-logo"></div>
          <div class="bts-one">
            <i class="ln ln-l"></i>
            <div class="bts-text"><span class="bts-b">${splitChars('BEHIND')}</span><span class="bts-ts"><span class="mask"><span class="in">THE SUCCESS</span></span></span></div>
            <i class="ln ln-r"></i>
          </div>
          <div class="bts-tag"><span>${esc(app.C.event.tagline)}</span></div>
        </div>
      </div>`);
    const logo = new BTS.LogoGlint(LOGO);
    $(root, '.ev-logo').appendChild(logo.el);
    const T = new BTS.Timers();

    return {
      el: root,
      chrome: {},
      fx: { mode: null, params: { sweep: 1, spot: 1, flares: 0.12, dust: 1, corners: 0.6, floor: 1 } },
      layout() { BTS.fitWidth($(root, '.bts-text'), 1380); },
      enter() {
        const a = (sel, frames, opts) => $(root, sel).animate(frames, Object.assign({ easing: EASE, fill: 'both' }, opts));
        a('.ev-wrap', [{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 7000 });
        dropChars($$(root, '.bts-b .ch'), 450, 95, flashOn(T));
        a('.bts-ts .in', [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], { duration: 1100, delay: 1250 });
        a('.ln-l', [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 950, delay: 1500 });
        a('.ln-r', [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 950, delay: 1500 });
        a('.bts-tag span', [{ opacity: 0, transform: 'scaleX(1.25)', filter: 'blur(8px)' }, { opacity: 1, transform: 'scaleX(1)', filter: 'blur(0px)' }], { duration: 1200, delay: 2200 });
        a('.ev-logo', [{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1200, delay: 2800 });
        // "Flashes de cámara": el éxito tiene protagonistas.
        T.after(1900, () => BTS.FX.burst(16, { x: 0, y: 0, w: 1920, h: 1080 }, 1.8));
        T.after(2400, () => BTS.FX.set({ params: { flares: 0.3 } }));
        T.after(3500, () => logo.glint(1700));
        T.after(4200, () => { root.classList.add('is-idle'); BTS.FX.set({ params: { flares: 0.16, spot: 0.7 } }); });
        logo.autoGlint(8, 12);
      },
      dispose() { T.clear(); logo.destroy(); }
    };
  };

  // ------------------------------------------------------------ PANEL (FORO)
  R.forum = (scene, app) => {
    const C = app.C;
    const root = section('forum', `
      <div class="upper">
        <div class="fo-label" data-in style="--d:500ms"><i></i><span>${esc(C.forum.label)}</span><i></i></div>
        <h1 class="fo-title">${splitWords(C.forum.name)}</h1>
        <ol class="fo-timeline">${C.blocks.map((b, i) =>
          `<li data-in style="--d:${1900 + i * 170}ms"><em></em><b>${pad(i + 1)}</b><span>${esc(b.name)}</span></li>`).join('')}</ol>
      </div>`);
    const T = new BTS.Timers();
    return {
      el: root,
      chrome: { lockup: true, logo: true },
      fx: { mode: null, params: { sweep: 0.8, spot: 0.8, flares: 0.1, dust: 0.9, corners: 0.5, floor: 1 } },
      enter() { T.after(1300, () => BTS.FX.burst(6, { x: 200, y: 200, w: 1520, h: 240 }, 0.8)); },
      dispose() { T.clear(); }
    };
  };

  // ------------------------------------------------------------ PORTADA DE BLOQUE
  // Se queda en pantalla durante toda la conversación del bloque (varios minutos),
  // por eso tiene vida propia: visual en loop y acentos periódicos.
  R.block = (scene, app) => {
    const C = app.C, b = C.blocks[scene.block], n = pad(scene.block + 1);
    const hasImg = !!b.image;
    const root = section('block', `
      <ol class="bl-track">${C.blocks.map((bb, i) =>
        `<li class="${i < scene.block ? 'is-done' : i === scene.block ? 'is-now' : ''}" data-in style="--d:${1300 + i * 90}ms;--from:translateY(-20px)"><b>${pad(i + 1)}</b></li>`).join('')}</ol>
      ${hasImg ? `<figure class="bl-image"><img src="${esc(b.image)}" alt=""></figure>` : ''}
      <div class="bl-bignum"><span>${n}</span></div>
      <div class="bl-content">
        <h1 class="bl-name">${splitChars(b.name)}</h1>
        ${b.tagline ? `<p class="bl-tagline" data-in style="--d:1150ms">${esc(b.tagline)}</p>` : ''}
      </div>`,
      (hasImg ? 'has-image ' : '') + 'v-' + (b.visual || 'none'));
    if (hasImg) {
      const img = $(root, '.bl-image img');
      img.onerror = () => { console.warn('Imagen de bloque no encontrada: ' + b.image); img.parentNode.remove(); root.classList.remove('has-image'); };
    }
    const T = new BTS.Timers();
    const accent = () => {
      const name = $(root, '.bl-name');
      if (!name) return;
      const r = BTS.stageRect(name);
      BTS.FX.burst(2, { x: r.x + r.w * 0.2, y: r.y, w: r.w * 0.9, h: r.h }, 0.8);
      const num = $(root, '.bl-bignum span');
      num.classList.remove('is-pulse'); void num.offsetWidth; num.classList.add('is-pulse');
      T.after(BTS.rand(16000, 24000), accent);
    };
    return {
      el: root,
      chrome: { lockup: true, logo: true },
      fx: { mode: b.visual, intensity: 1, params: { sweep: 0.45, spot: 0, flares: 0.06, dust: 0.8, corners: 0.3, floor: 0 } },
      enter() {
        const chars = $$(root, '.bl-name .ch');
        chars.forEach((ch, i) => ch.animate(
          [{ transform: 'translateY(115%)' }, { transform: 'translateY(0)' }],
          { duration: 900, delay: 480 + i * 55, easing: EASE, fill: 'both' }));
        $(root, '.bl-bignum span').animate(
          [{ opacity: 0, transform: 'translateX(160px) scale(1.12)' }, { opacity: 1, transform: 'none' }],
          { duration: 2200, delay: 150, easing: EASE, fill: 'both' });
        if (hasImg && $(root, '.bl-image')) {
          $(root, '.bl-image').animate(
            [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
            { duration: 1400, delay: 600, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
        }
        T.after(480 + chars.length * 55 + 350, () => {
          const r = BTS.stageRect($(root, '.bl-name'));
          BTS.FX.burst(3, { x: r.x + r.w - 60, y: r.y, w: 120, h: r.h }, 0.3);
        });
        T.after(BTS.rand(12000, 16000), accent);
      },
      dispose() { T.clear(); }
    };
  };

  // ------------------------------------------------------------ SORPRESA
  R.surprise = (scene, app) => BTS.Surprise.render(scene, app);

  // ------------------------------------------------------------ CIERRE: logo BEHIND THE SUCCESS
  // (o la pregunta de cierre si closing.showQuestion es true)
  R.closing = (scene, app) => {
    const C = app.C, cl = C.closing || {};
    const show = !!cl.showQuestion && !!cl.question;
    const root = section('closing', show ? `
      <div class="upper">
        <div class="cq-kicker" data-in style="--d:300ms"><i></i><span>${esc(cl.label)}</span><i></i></div>
        <p class="cq-text">${splitWords(cl.question)}</p>
      </div>` : `
      <div class="upper">
        <div class="cl-stack">
          <div class="st-behind">${splitChars('BEHIND')}</div>
          <div class="st-the"><i class="ln ln-l"></i><span>THE</span><i class="ln ln-r"></i></div>
          <div class="st-success"><span class="mask"><span class="in">SUCCESS</span></span></div>
          <div class="st-tag"><span>${esc(C.event.tagline)}</span></div>
        </div>
      </div>`, show ? 'is-question' : '');
    const T = new BTS.Timers();
    return {
      el: root,
      chrome: show ? { lockup: true, logo: true } : { logo: true },
      fx: { mode: null, params: { sweep: 1, spot: 1, flares: 0.18, dust: 1, corners: 0.6, floor: 1 } },
      layout() {
        if (show) { BTS.fitText($(root, '.cq-text'), { max: 84, min: 50, maxHeight: 290 }); return; }
        // Logo apilado (como el arte oficial): todas las líneas del mismo ancho y
        // el conjunto completo por encima de la mitad de la pantalla.
        const stack = $(root, '.cl-stack'), maxH = 470;
        const fit = (w) => {
          BTS.fitWidth($(root, '.st-behind'), w);
          BTS.fitWidth($(root, '.st-success'), w);
          BTS.fitWidth($(root, '.st-tag'), w);
          const fs = parseFloat($(root, '.st-behind').style.fontSize) || 200;
          $(root, '.st-the').style.fontSize = (fs * 0.36).toFixed(1) + 'px';
          stack.style.width = w + 'px';
        };
        let w = 600;
        fit(w);
        if (stack.offsetHeight > maxH) { w = Math.floor(w * maxH / stack.offsetHeight); fit(w); }
      },
      enter() {
        if (show) return;
        const a = (sel, frames, opts) => $(root, sel).animate(frames, Object.assign({ easing: EASE, fill: 'both' }, opts));
        a('.cl-stack', [{ transform: 'translateX(-50%) scale(1.06)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 7000 });
        dropChars($$(root, '.st-behind .ch'), 400, 90, flashOn(T));
        a('.st-the .ln-l', [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 950, delay: 1050 });
        a('.st-the .ln-r', [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 950, delay: 1050 });
        a('.st-the span', [{ opacity: 0, letterSpacing: '.7em' }, { opacity: 1, letterSpacing: '.04em' }], { duration: 1100, delay: 1250 });
        a('.st-success .in', [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], { duration: 1100, delay: 1500 });
        a('.st-tag span', [{ opacity: 0, transform: 'scaleX(1.25)', filter: 'blur(8px)' }, { opacity: 1, transform: 'scaleX(1)', filter: 'blur(0px)' }], { duration: 1200, delay: 2150 });
        T.after(1800, () => BTS.FX.burst(12, { x: 0, y: 0, w: 1920, h: 1080 }, 1.6));
        T.after(4000, () => root.classList.add('is-idle'));
      },
      dispose() { T.clear(); }
    };
  };

  // ------------------------------------------------------------ FINAL
  // Mismas animaciones que la pantalla de inicio (loop del logo), con sus propios textos.
  R.finale = (scene, app) => logoLoop(app.C.closing && app.C.closing.captions);

  BTS.Scenes = {
    FLOOR,
    render(scene, app, prev) {
      const fn = R[scene.type];
      if (!fn) throw new Error('Escena desconocida: ' + scene.type);
      return fn(scene, app, prev);
    },
    // Si una escena fallara, se muestra al menos su título (nunca pantalla vacía).
    fallback(scene) {
      const root = section('fallback', `<div class="upper"><p class="fb-text">${esc(scene.title || '')}</p></div>`);
      return { el: root, chrome: { lockup: true, logo: true }, fx: { mode: null } };
    }
  };
})();
