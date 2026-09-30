/*
 * CONTENIDO DEL FORO — BEHIND THE SUCCESS · Davivienda Seguros
 * ------------------------------------------------------------------
 * Este es el ÚNICO archivo que hay que tocar para cambiar textos.
 * Fuente oficial: assets/reference/documento-fuente-panel.pdf
 *
 * Por qué es .js y no .json: al abrir index.html con doble clic (file://)
 * los navegadores bloquean la lectura de archivos .json. Un .js se carga
 * siempre, con o sin servidor, con o sin internet.
 *
 * Reglas para editar:
 *  - Cada texto va entre comillas dobles "..." y separado por comas.
 *  - Si una pregunta lleva comillas dentro, usa comillas tipográficas “ ”.
 *  - Las preguntas de los bloques NO se proyectan: en la LED solo se ve la
 *    portada de cada bloque. Aparecen como guía en la ventana del operador.
 *  - Puedes agregar o quitar preguntas: la presentación se ajusta sola.
 *  - Después de editar, recarga el navegador (F5).
 */
window.FORUM_CONTENT = {
  event: {
    name: "BEHIND THE SUCCESS",
    tagline: "El éxito tiene protagonistas",
    occasion: "Día del Intermediario"
  },

  forum: {
    label: "Panel",
    name: "Historias que aseguran"
  },

  // Textos que rotan en la pantalla de espera (debajo del logo).
  standby: {
    captions: ["Bienvenidos", "Día del Intermediario"]
  },

  blocks: [
    {
      id: 1,
      name: "Despertar",
      tagline: "Inicio · Transformación · Nuevas perspectivas",
      // Fondo animado del bloque. Todos usan "futuro" (retícula en perspectiva).
      // Otras opciones: "despertar", "fortaleza", "evolucion", "legado".
      visual: "futuro",
      // Imagen opcional para la intro del bloque, p. ej. "assets/images/bloque-01.jpg"
      image: null,
      // Nota del documento fuente: solo se muestra al operador, nunca en la LED.
      // Las preguntas de cada bloque también son solo para el operador.
      notes: "Aquí queremos conocer cómo llegaron al mundo de los seguros.",
      questions: [
        "¿Cómo llegaste al mundo de los seguros? ¿Fue algo que buscaste o algo que simplemente apareció en tu camino?",
        "¿Recuerdas cuál fue tu primera venta o tu primer cliente? ¿Qué aprendiste de esa experiencia?",
        "Cuando comenzaste, ¿qué era lo que más te costaba como intermediario?",
        "¿Hubo algún momento en tus primeros años en el que pensaste: “Esto definitivamente es para mí”?"
      ]
    },
    {
      id: 2,
      name: "Fortaleza",
      tagline: "Unión · Resistencia · Determinación",
      visual: "futuro",
      image: null,
      notes: "Aquí entramos en las experiencias reales.",
      questions: [
        "A lo largo de tu trayectoria, ¿cuál ha sido uno de los retos más grandes que has enfrentado como intermediario?",
        "¿Cuál ha sido la lección más importante que te ha dejado un cliente?",
        "¿Existe alguna venta, cliente o experiencia que recuerdes especialmente y por qué?",
        "¿Qué habilidad crees que ha sido determinante para construir una carrera sostenible en seguros?"
      ]
    },
    {
      id: 3,
      name: "Evolución",
      tagline: "Transformación · Cambio · Innovación",
      visual: "futuro",
      image: null,
      notes: "Aquí conectamos trayectoria con transformación.",
      questions: [
        "¿Qué ha cambiado más en la profesión desde que comenzaste hasta hoy?",
        "¿Cómo ha cambiado la relación con los clientes?",
        "¿Qué herramientas, tecnología o nuevas formas de trabajar han transformado tu manera de hacer negocios?",
        "¿Qué diferencia existe entre vender un seguro y realmente asesorar a un cliente?",
        "¿Qué crees que hace que un cliente confíe y permanezca con un intermediario durante años?"
      ]
    },
    {
      id: 4,
      name: "El legado",
      tagline: "Trayectoria · Huella · Experiencia",
      visual: "futuro",
      image: null,
      notes: "La idea es hablar de cómo la profesión trasciende y se convierte en legado familiar.",
      questions: [
        "¿Qué significa para ti haber recibido esta profesión de parte de tu padre o de tu familia?",
        "¿Qué fue lo primero que aprendiste de tu padre sobre ser intermediario que todavía aplicas hoy?",
        "¿Hay algún consejo o frase de tu padre que se haya quedado contigo a lo largo de tu carrera?",
        "¿Qué valores de tu padre sientes que siguen presentes en tu manera de trabajar?",
        "¿Qué ha cambiado entre la forma de ejercer esta profesión de tu padre y la tuya?",
        "¿Qué has podido aportar tú a ese legado y qué te gustaría que la siguiente generación conserve?"
      ]
    },
    {
      id: 5,
      name: "El futuro",
      tagline: "Visión · Posibilidades · Crecimiento",
      visual: "futuro",
      image: null,
      notes: "Este bloque para cerrar con visión.",
      questions: [
        "¿Cómo imaginas al intermediario del futuro?",
        "¿Qué habilidades debería desarrollar un nuevo intermediario para tener éxito en los próximos años?",
        "¿Qué oportunidades ven hoy en la industria que quizás antes no existían?",
        "¿Qué consejo le darías a alguien que está comenzando hoy su carrera como intermediario?"
      ]
    }
  ],

  // Dinámica de preguntas sorpresa: un cuadro por pregunta (funciona con 2 a 6).
  // El cuadro 01 oculta la primera pregunta, el 02 la segunda, etc.
  surprise: {
    title: "Preguntas sorpresa",
    instruction: "Escoge un número",
    questions: [
      "¿Cuál fue el momento que cambió tu carrera?",
      "¿Cuál ha sido tu cliente más memorable?",
      "¿Qué error te hizo crecer?",
      "¿Qué ha cambiado radicalmente en la profesión?",
      "¿Qué le dirías al intermediario que está comenzando?"
    ]
  },

  closing: {
    label: "Para cierre",
    // false: en la LED solo se ve la portada "Para cierre" (la pregunta la ve el operador).
    // true: la pregunta de cierre se proyecta.
    showQuestion: false,
    question: "Si tu trayectoria como intermediario pudiera resumirse en una sola palabra, ¿cuál sería y por qué?",
    // Pantalla final: mismo loop animado del inicio (logo Davivienda Seguros).
    // Textos que rotan debajo del logo; se puede agregar, p. ej., "Gracias".
    captions: ["Día del Intermediario"]
  }
};
