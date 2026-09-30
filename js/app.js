/*
 * BEHIND THE SUCCESS — núcleo de la aplicación.
 * Estado, navegación entre escenas, escalado 16:9, persistencia y arranque.
 */
(function () {
  'use strict';
  const BTS = window.BTS;
  const STORE_KEY = 'bts-davivienda-state-v1';
  const RESUME_HOURS = 4;
  // Escenas que entran con la transición de telón.
  const HEAVY = new Set(['standby', 'event', 'forum', 'block', 'surprise', 'closing', 'finale']);

  const App = (BTS.App = {
    scale: 1,

    init() {
      const C = window.FORUM_CONTENT;
      if (!C || !Array.isArray(C.blocks) || !C.blocks.length) {
        return bootError('No se encontró el contenido del foro (content/forum.js) o tiene un error de escritura.');
      }
      this.C = C;
      this.seq = BTS.buildSequence(C);
      this.stage = document.getElementById('stage');
      this.scenesEl = document.getElementById('scenes');
      this.chromeEl = document.getElementById('chrome');
      this.blackEl = document.getElementById('blackout');
      this.index = -1;
      this.current = null;
      this.mounted = null;
      this.token = 0;
      this.leaving = [];
      this.black = false;
      this.standbyReturn = null;
      this.pendingSurprise = null;

      this.fit();
      window.addEventListener('resize', () => this.fit());

      BTS.FX.init(document.getElementById('fx'));
      BTS.Transitions.init(document.getElementById('shutter'));
      BTS.Surprise.init(this);
      BTS.Operator.init(this);
      BTS.Nav.init(this);

      const saved = this.restore();
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        document.body.classList.add('is-ready');
        this.go(saved ? saved.index : 0, { instant: true });
        if (saved && saved.index > 0) BTS.Operator.log('Se retomó la presentación donde quedó. Tecla Inicio para empezar desde cero.');
      };
      // Se espera a las fuentes (están incrustadas, tarda milisegundos) antes de medir textos.
      const fonts = document.fonts
        ? Promise.all(['400 100px "Bebas Neue"', '600 100px Barlow', '700 100px "Barlow Condensed"', '500 100px "Barlow Condensed"'].map((f) => document.fonts.load(f)))
        : Promise.resolve();
      fonts.then(start, start);
      setTimeout(start, 2500);
      this.keepAwake();
    },

    // Escala el escenario 1920×1080 para ocupar la pantalla sin deformarse.
    fit() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.min(vw / 1920, vh / 1080);
      this.scale = s;
      const ox = (vw - 1920 * s) / 2, oy = (vh - 1080 * s) / 2;
      this.stage.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
    },

    currentScene() { return this.seq[this.index] || null; },
    currentType() { const s = this.currentScene(); return s ? s.type : ''; },
    indexOf(pred) { return this.seq.findIndex(pred); },

    go(i, o) {
      o = o || {};
      i = BTS.clamp(i | 0, 0, this.seq.length - 1);
      if (this.black) this.setBlack(false);
      if (i === this.index && this.current) return;
      const s = this.seq[i], prev = this.mounted;
      if (s.type !== 'standby') this.standbyReturn = null;
      this.index = i;
      const tok = ++this.token;
      this.persist();
      this.notify();

      if (o.instant) { this.mount(s); BTS.Transitions.uncover(true); return; }
      const heavy = HEAVY.has(s.type) || !prev;
      if (heavy) {
        BTS.Transitions.cover().then(() => {
          if (tok !== this.token) return;
          this.mount(s);
          BTS.Transitions.uncover();
        });
      } else {
        this.mount(s);
        BTS.Transitions.uncover();
      }
    },

    mount(s) {
      const prev = this.mounted;
      this.mounted = s;
      if (this.current) this.retire(this.current);
      this.current = null;

      let node;
      try { node = BTS.Scenes.render(s, this, prev); } catch (e) {
        console.error(e);
        node = BTS.Scenes.fallback(s);
      }
      this.current = node;
      this.scenesEl.appendChild(node.el);
      try { if (node.layout) node.layout(); } catch (e) { console.error(e); }
      this.applyChrome(node.chrome || {});
      BTS.FX.set(node.fx || { mode: null });
      void node.el.offsetWidth; // fija el estado inicial antes de animar
      node.el.classList.add('is-in');
      try { if (node.enter) node.enter(); } catch (e) { console.error(e); }
      this.notify();
    },

    retire(old) {
      try { if (old.dispose) old.dispose(); } catch (e) { console.error(e); }
      const el = old.el;
      el.classList.remove('is-in');
      el.classList.add('is-out');
      this.leaving.push(el);
      while (this.leaving.length > 1) this.leaving.shift().remove();
      setTimeout(() => {
        el.remove();
        this.leaving = this.leaving.filter((x) => x !== el);
      }, 900);
    },

    applyChrome(c) {
      const el = this.chromeEl;
      el.classList.toggle('show-lockup', !!c.lockup);
      el.classList.toggle('show-logo', !!c.logo);
    },

    // ---------------- Acciones ----------------
    next() {
      if (this.black) { this.setBlack(false); return; }
      if (this.current && this.current.onAction && this.current.onAction('next')) return;
      if (this.currentType() === 'standby' && this.standbyReturn != null) {
        const r = this.standbyReturn;
        this.standbyReturn = null;
        this.go(r);
        return;
      }
      if (this.index < this.seq.length - 1) this.go(this.index + 1);
    },

    prev() {
      if (this.black) { this.setBlack(false); return; }
      if (this.current && this.current.onAction && this.current.onAction('prev')) return;
      if (this.index > 0) this.go(this.index - 1);
    },

    goBlock(b) {
      const i = this.indexOf((s) => s.type === 'block' && s.block === b);
      if (i >= 0) this.go(i);
    },

    currentBlock() {
      const s = this.currentScene();
      if (!s) return -1;
      if (s.block != null) return s.block;
      return ['surprise', 'closing', 'finale'].includes(s.type) ? this.C.blocks.length : -1;
    },

    nextBlock() {
      const b = this.currentBlock();
      if (b + 1 < this.C.blocks.length) this.goBlock(b + 1);
      else if (b < this.C.blocks.length) this.goType('surprise');
    },

    prevBlock() {
      const b = this.currentBlock();
      if (b > 0) this.goBlock(b - 1);
      else if (b === 0) this.goType('forum');
    },

    goType(t) {
      const i = this.indexOf((s) => s.type === t);
      if (i >= 0) this.go(i);
    },

    goClosing() {
      const i = this.indexOf((s) => s.type === 'closing');
      this.go(i >= 0 ? i : this.seq.length - 1);
    },

    home() {
      this.standbyReturn = null;
      this.go(0);
    },

    // Espera: pausa la presentación y recuerda dónde estaba (E otra vez para volver).
    toggleStandby() {
      if (this.currentType() === 'standby') {
        if (this.standbyReturn != null) { const r = this.standbyReturn; this.standbyReturn = null; this.go(r); }
        return;
      }
      const from = this.index;
      this.go(0);
      this.standbyReturn = from;
      this.persist();
      this.notify();
    },

    setBlack(on) {
      this.black = !!on;
      this.blackEl.classList.toggle('is-on', this.black);
      this.notify();
    },
    toggleBlack() { this.setBlack(!this.black); },

    toggleFullscreen() {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else {
          const p = document.documentElement.requestFullscreen({ navigationUI: 'hide' });
          if (p && p.catch) p.catch(() => BTS.Operator.log('Pantalla completa no disponible: usa F11.'));
        }
      } catch (e) { BTS.Operator.log('Pantalla completa no disponible: usa F11.'); }
    },

    // Comandos del panel de operador (y teclas reenviadas desde su ventana).
    command(c) {
      if (!c || typeof c.type !== 'string') return;
      const onSurprise = this.currentType() === 'surprise';
      switch (c.type) {
        case 'next': return this.next();
        case 'prev': return this.prev();
        case 'home': return this.home();
        case 'go': return this.go(c.i);
        case 'block': return this.goBlock(c.i);
        case 'standby': return this.toggleStandby();
        case 'black': return this.toggleBlack();
        case 'surprise-go': return this.goType('surprise');
        case 'closing': return this.goClosing();
        case 'fullscreen': return this.toggleFullscreen();
        case 'hud-close': return BTS.Operator.toggleHud(false);
        case 'key': return BTS.Nav.handle(c);
        case 'sp-select':
          if (onSurprise) BTS.Surprise.select(c.i | 0, !!c.force);
          else { this.pendingSurprise = { i: c.i | 0, force: !!c.force }; this.goType('surprise'); }
          return;
        case 'sp-close':
          if (onSurprise && this.current && this.current.onAction) this.current.onAction('close');
          return;
        case 'sp-reset': return BTS.Surprise.reset();
      }
    },

    onSurpriseChange() { this.persist(); this.notify(); },

    // ---------------- Estado ----------------
    state() {
      const s = this.currentScene() || {};
      const C = this.C, b = s.block != null ? C.blocks[s.block] : null;
      // Guía del moderador: preguntas que se hacen en vivo (no se proyectan).
      let text = '', list = null, listTitle = '';
      if (s.type === 'block') { list = b.questions || []; listTitle = 'Preguntas del bloque · guía del moderador (no se proyectan)'; }
      else if (s.type === 'closing' && C.closing.question) {
        list = [C.closing.question];
        listTitle = C.closing.showQuestion ? 'Pregunta de cierre (en pantalla)' : 'Pregunta de cierre · guía del moderador (no se proyecta)';
      }
      else if (s.type === 'surprise' && BTS.Surprise.active != null) text = C.surprise.questions[BTS.Surprise.active];
      const nx = this.seq[this.index + 1];
      return {
        index: this.index,
        total: this.seq.length,
        scenes: this.seq.map((x) => ({ title: x.title, group: x.group, type: x.type })),
        blocks: C.blocks.map((x) => x.name),
        current: { title: s.title || '', type: s.type, text, list, listTitle, notes: b ? b.notes || '' : '' },
        next: nx ? nx.title : null,
        surprise: {
          questions: C.surprise ? C.surprise.questions : [],
          revealed: BTS.Surprise.revealed.slice(),
          active: BTS.Surprise.active,
          onScreen: s.type === 'surprise'
        },
        black: this.black,
        standby: s.type === 'standby',
        standbyReturn: this.standbyReturn != null ? this.seq[this.standbyReturn].title : null
      };
    },

    notify() {
      if (!this.C) return;
      BTS.Operator.broadcast(this.state());
    },

    persist() {
      BTS.store.set(STORE_KEY, {
        index: this.index,
        standbyReturn: this.standbyReturn,
        revealed: BTS.Surprise.revealed.slice(),
        n: this.seq.length,
        t: Date.now()
      });
    },

    // Si el navegador se cierra o recarga en pleno evento, se retoma donde estaba.
    restore() {
      if (/[?&]reset\b/.test(location.search)) { BTS.store.remove(STORE_KEY); return null; }
      const s = BTS.store.get(STORE_KEY);
      if (!s || typeof s.t !== 'number' || Date.now() - s.t > RESUME_HOURS * 3600e3 || s.n !== this.seq.length) return null;
      BTS.Surprise.setRevealed(Array.isArray(s.revealed) ? s.revealed : []);
      if (Number.isInteger(s.standbyReturn) && s.standbyReturn < this.seq.length) this.standbyReturn = s.standbyReturn;
      return { index: BTS.clamp(s.index | 0, 0, this.seq.length - 1) };
    },

    // Evita que la pantalla entre en reposo durante el loop de espera.
    keepAwake() {
      const req = () => {
        try {
          if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').catch(() => {});
        } catch (e) { /* no disponible */ }
      };
      req();
      document.addEventListener('visibilitychange', req);
    }
  });

  function bootError(msg) {
    const el = document.getElementById('boot-error');
    el.innerHTML = '<b>No se pudo iniciar la presentación</b><p>' + BTS.esc(msg) + '</p><p>Revisa el archivo y recarga con F5.</p>';
    el.style.display = 'block';
  }

  window.addEventListener('error', (e) => {
    if (BTS.Operator && BTS.Operator.panel) BTS.Operator.log('Error: ' + (e.message || 'desconocido'));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => App.init());
  else App.init();
})();
