/*
 * Construye el recorrido lineal del foro a partir de content/forum.js:
 * Espera → Evento → Panel → Bloque 01…05 → Sorpresa → Logo BTS → Pantalla final (loop)
 * Las preguntas de los bloques no son escenas: se hacen en vivo durante la
 * conversación y solo las ve el operador.
 */
(function () {
  'use strict';
  const BTS = window.BTS;

  BTS.buildSequence = function (C) {
    const pad = BTS.pad, S = [];
    S.push({ type: 'standby', title: 'Pantalla de espera', group: 'Inicio' });
    S.push({ type: 'event', title: 'BEHIND THE SUCCESS', group: 'Inicio' });
    S.push({ type: 'forum', title: C.forum.label + ': ' + C.forum.name, group: 'Inicio' });
    C.blocks.forEach((b, bi) => {
      S.push({ type: 'block', block: bi, title: 'Bloque ' + pad(bi + 1) + ' — ' + b.name, group: 'Bloques del foro' });
    });
    if (C.surprise && C.surprise.questions && C.surprise.questions.length) {
      S.push({ type: 'surprise', title: C.surprise.title, group: 'Dinámica' });
    }
    if (C.closing) {
      S.push({ type: 'closing', title: C.closing.showQuestion ? 'Pregunta de cierre' : 'Cierre — logo BEHIND THE SUCCESS', group: 'Cierre' });
    }
    S.push({ type: 'finale', title: 'Pantalla final (loop del logo)', group: 'Cierre' });
    S.forEach((s, i) => { s.index = i; });
    return S;
  };
})();
