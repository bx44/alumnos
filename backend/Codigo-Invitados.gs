/**
 * Or Barak — Invitados y reto semanal
 * Archivo NUEVO en el proyecto GestionAcademica.
 *
 * Depende de Codigo-API.gs (SS, txt_, fecha_, claveFecha_)
 * y de Codigo-Alumnos.gs (alSesion_, alHojaPropia_).
 *
 * QUIÉN ENTRA AQUÍ
 * Estas acciones son las únicas que funcionan SIN token. Un invitado solo
 * alcanza el reto semanal y la lista de juegos. Todo lo demás de Or+ pide
 * token, así que la puerta de invitados no abre el canal de Dirección, ni el
 * campus, ni el horario, ni el avance: no hace falta bloquearlos uno por uno,
 * ya están cerrados por no tener sesión.
 *
 * QUÉ SE GUARDA
 * De un invitado, nada. No se registra nombre, ni respuesta, ni dispositivo.
 * Un invitado es alguien de quien no sabemos nada y así se queda.
 * De un alumno identificado sí se guarda su respuesta, para que la dirección
 * vea quién participó.
 *
 * LA RESPUESTA CORRECTA NUNCA SALE DEL SERVIDOR
 * al_reto manda la pregunta y las opciones, nunca cuál es la buena. El
 * teléfono manda la opción elegida y el servidor contesta si atinó. Si la
 * respuesta viajara al teléfono, cualquiera la ve en el código de la página.
 */

var INV_H = {
  retos:      'RetosSemanales',
  respuestas: 'RespuestasReto',
  juego:      'RetosJuego'
};

var INV_COL = {
  retos:      { semana: 1, pregunta: 2, a: 3, b: 4, c: 5, d: 6,
                correcta: 7, pista: 8, activo: 9 },
  respuestas: { sello: 1, id: 2, nombre: 3, semana: 4, respuesta: 5, acerto: 6 }
};

/** Los juegos que Or+ ofrece. Para agregar uno, agrega un renglón. */
var INV_JUEGOS = [
  {
    id: 'hexterra',
    nombre: 'Hexterra',
    linea: 'Coloniza islas por turnos. El tablero en una pantalla y las cartas en cada teléfono.',
    jugadores: 'De 2 a 4, cada quien en su teléfono',
    // Ruta relativa = se juega dentro de Or+, en una capa a pantalla completa.
    // Una direccion que empiece con http se abriria aparte, en otra pestana.
    url: './juegos/hexterra/',
    listo: true
  },
  {
    id: 'rompeelmuro',
    nombre: 'Rompe el muro',
    linea: 'Hay un muro entre tú y la puerta. No lo rodees.',
    jugadores: 'Un jugador, diez niveles',
    url: './juegos/rompeelmuro/',
    listo: true
  },
  {
    id: 'pardes',
    nombre: 'Pardés',
    linea: 'Doce pisos para abajo, del Bet Hamidrash al Pardés. Cada portón te hace una pregunta.',
    jugadores: 'Un jugador · las preguntas salen de la hoja RetosJuego',
    url: './juegos/pardes/',
    listo: true
  }
];


// ═══════════════════ RETO SEMANAL ═══════════════════

function invFilasRetos_() {
  var sh = SS.getSheetByName(INV_H.retos);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 9).getValues();
}

/** El reto activo más reciente, o null. */
function invRetoActivo_() {
  var filas = invFilasRetos_();
  var mejor = null, mejorFecha = null;
  for (var i = 0; i < filas.length; i++) {
    if (txt_(filas[i][INV_COL.retos.activo - 1]) === 'No') continue;
    if (!txt_(filas[i][INV_COL.retos.pregunta - 1])) continue;
    var f = filas[i][INV_COL.retos.semana - 1];
    var esFecha = Object.prototype.toString.call(f) === '[object Date]';
    if (!mejor || (esFecha && (!mejorFecha || f > mejorFecha))) {
      mejor = { fila: i + 2, datos: filas[i] };
      if (esFecha) mejorFecha = f;
    }
  }
  return mejor;
}

/**
 * Manda el reto de la semana. No pide token.
 * Si viene un token válido, además dice si ese alumno ya contestó.
 */
function alReto(p) {
  var r = invRetoActivo_();
  if (!r) return { ok: true, hay: false };

  var d = r.datos;
  var opciones = [];
  var letras = ['A', 'B', 'C', 'D'];
  var cols = [INV_COL.retos.a, INV_COL.retos.b, INV_COL.retos.c, INV_COL.retos.d];
  for (var i = 0; i < 4; i++) {
    var t = txt_(d[cols[i] - 1]);
    if (t) opciones.push({ letra: letras[i], texto: t });
  }
  if (opciones.length < 2) return { ok: true, hay: false };

  var semana = invClaveSemana_(d[INV_COL.retos.semana - 1]);
  var yaContesto = null;

  // El token es opcional aquí: si viene y sirve, personalizamos; si no, da igual.
  if (txt_(p.token)) {
    try {
      var s = alSesion_(p);
      yaContesto = invRespuestaDe_(s.id, semana);
    } catch (e) { yaContesto = null; }
  }

  return {
    ok: true,
    hay: true,
    semana: semana,
    pregunta: txt_(d[INV_COL.retos.pregunta - 1]),
    opciones: opciones,
    yaContesto: yaContesto      // null, o {respuesta, acerto}
  };
}

/**
 * Recibe la opción elegida y contesta si atinó.
 * Con token válido, guarda la respuesta del alumno. Sin token, no guarda nada.
 */
function alRetoResponder(p) {
  var r = invRetoActivo_();
  if (!r) return { ok: false, error: 'Ahorita no hay reto.' };

  var elegida = txt_(p.opcion).toUpperCase();
  if (['A', 'B', 'C', 'D'].indexOf(elegida) < 0) {
    return { ok: false, error: 'Elige una de las opciones.' };
  }

  var d = r.datos;
  var correcta = txt_(d[INV_COL.retos.correcta - 1]).toUpperCase().charAt(0);
  var acerto = (elegida === correcta);
  var semana = invClaveSemana_(d[INV_COL.retos.semana - 1]);

  var guardado = false;
  if (txt_(p.token)) {
    try {
      var s = alSesion_(p);
      if (!invRespuestaDe_(s.id, semana)) {       // una sola vez por semana
        var lock = LockService.getScriptLock();
        lock.waitLock(30000);
        try {
          alHojaPropia_(INV_H.respuestas).appendRow([
            new Date(), s.id, s.nombre, semana, elegida, acerto ? 'Sí' : 'No'
          ]);
        } finally { lock.releaseLock(); }
        guardado = true;
      }
    } catch (e) { /* token vencido: se contesta igual, solo no se guarda */ }
  }

  return {
    ok: true,
    acerto: acerto,
    correcta: correcta,
    pista: txt_(d[INV_COL.retos.pista - 1]),
    guardado: guardado
  };
}

function invClaveSemana_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return claveFecha_(v);
  return txt_(v) || 'sin-fecha';
}

function invRespuestaDe_(id, semana) {
  var sh = SS.getSheetByName(INV_H.respuestas);
  if (!sh || sh.getLastRow() < 2) return null;
  var filas = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  for (var i = 0; i < filas.length; i++) {
    if (txt_(filas[i][INV_COL.respuestas.id - 1]) !== id) continue;
    if (txt_(filas[i][INV_COL.respuestas.semana - 1]) !== semana) continue;
    return {
      respuesta: txt_(filas[i][INV_COL.respuestas.respuesta - 1]),
      acerto: txt_(filas[i][INV_COL.respuestas.acerto - 1]) === 'Sí'
    };
  }
  return null;
}


// ═══════════════════ JUEGOS ═══════════════════

/** Lista de juegos. No pide token: un invitado también la ve. */
function alJuegos(p) {
  var out = [];
  for (var i = 0; i < INV_JUEGOS.length; i++) {
    var j = INV_JUEGOS[i];
    if (!j.listo) continue;
    out.push({ id: j.id, nombre: j.nombre, linea: j.linea,
               jugadores: j.jugadores, url: j.url });
  }
  return { ok: true, juegos: out };
}


// ═══════════════════ PREGUNTAS DEL JUEGO PARDÉS ═══════════════════
/**
 * Manda todo lo que haya en la hoja RetosJuego. No pide token: el juego
 * también lo juegan invitados, y aquí no hay nada de ningún alumno.
 *
 * OJO, y conviene saberlo: la respuesta correcta sí viaja al teléfono,
 * porque el juego tiene que funcionar sin internet. Un alumno curioso puede
 * verla si se mete al código de la página. Por eso esto es un juego y no
 * cuenta para calificaciones: para lo que sí cuenta está el reto semanal,
 * donde la respuesta nunca sale del servidor.
 *
 * La hoja sirve para dos cosas según la columna Tipo:
 *   Pregunta → C es la pregunta, D-G las opciones, H cuál es la buena.
 *   Palabra  → C es la palabra en hebreo o arameo y D lo que quiere decir.
 *              El juego arma solo las opciones malas con otras palabras.
 */
function alJuegoRetos(p) {
  var cache = CacheService.getScriptCache();
  var listo = cache.get('pardes_retos');
  if (listo) return JSON.parse(listo);

  var out = { ok: true, preguntas: [], palabras: [] };
  var sh = SS.getSheetByName(INV_H.juego);
  if (sh && sh.getLastRow() > 1) {
    var filas = sh.getRange(2, 1, sh.getLastRow() - 1, 10).getValues();
    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      if (txt_(f[9]) === 'No') continue;
      var tipo = txt_(f[0]).toLowerCase();
      var hondura = Math.min(4, Math.max(1, parseInt(f[1], 10) || 1));
      var texto = txt_(f[2]);
      if (!texto) continue;

      if (tipo.indexOf('palab') === 0) {
        var trad = txt_(f[3]);
        if (trad) out.palabras.push({ n: hondura, h: texto, t: trad });
        continue;
      }
      var ops = [], correcta = -1;
      var letras = ['A', 'B', 'C', 'D'];
      var buena = txt_(f[7]).toUpperCase().charAt(0);
      for (var k = 0; k < 4; k++) {
        var o = txt_(f[3 + k]);
        if (!o) continue;
        if (letras[k] === buena) correcta = ops.length;
        ops.push(o);
      }
      if (ops.length < 2 || correcta < 0) continue;
      out.preguntas.push({ n: hondura, p: texto, o: ops, c: correcta, e: txt_(f[8]) });
    }
  }
  try { cache.put('pardes_retos', JSON.stringify(out), 600); } catch (e) {}
  return out;
}


// ═══════════════════ INSTALACIÓN ═══════════════════
// Se corre a mano desde el editor: elige invitadosInstalar y Ejecutar.

function invitadosInstalar() {
  var creadas = [];

  var esquema = {
    RetosSemanales: ['Semana (fecha)', 'Pregunta', 'Opción A', 'Opción B', 'Opción C',
                     'Opción D', 'Correcta (A/B/C/D)', 'Qué decir al contestar', 'Activo'],
    RespuestasReto: ['Fecha y hora', 'ID del alumno', 'Nombre', 'Semana', 'Respuesta', '¿Acertó?'],
    RetosJuego: ['Tipo', 'Hondura (1-4)', 'Pregunta o palabra', 'Opción A / Traducción',
                 'Opción B', 'Opción C', 'Opción D', 'Correcta (A/B/C/D)',
                 'Qué decir al contestar', 'Activo']
  };

  for (var nombre in esquema) {
    var sh = SS.getSheetByName(nombre);
    if (!sh) { sh = SS.insertSheet(nombre); creadas.push(nombre); }
    sh.getRange(1, 1, 1, esquema[nombre].length).setValues([esquema[nombre]])
      .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#29235C');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, esquema[nombre].length, 150);
  }

  var sr = SS.getSheetByName(INV_H.retos);
  sr.getRange('G2:G500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['A', 'B', 'C', 'D'], true).build());
  sr.getRange('I2:I500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Sí', 'No'], true).build());
  sr.getRange('B1').setNote('La pregunta de la semana. La ven los alumnos y también ' +
    'quien entre como invitado, así que escríbela para cualquiera.');
  sr.getRange('H1').setNote('Lo que aparece después de contestar, acierte o no. ' +
    'Sirve para explicar, no para regañar.');
  sr.getRange('I1').setNote('Solo se muestra el reto activo más reciente. ' +
    'Para cambiar de reto, agrega un renglón nuevo con la fecha de esta semana.');

  if (sr.getLastRow() < 2) {
    sr.getRange(2, 1, 1, 9).setValues([[
      new Date(), '¿Cuántos tipos de korbanot se describen en Vayikra?',
      'Dos', 'Tres', 'Cuatro', 'Cinco', 'C',
      'Son cuatro. Si no te lo sabías, ya te lo sabes.', 'Sí'
    ]]);
  }

  var sj = SS.getSheetByName(INV_H.juego);
  sj.getRange('A2:A500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Pregunta', 'Palabra'], true).build());
  sj.getRange('H2:H500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['A', 'B', 'C', 'D'], true).build());
  sj.getRange('J2:J500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Sí', 'No'], true).build());
  sj.getRange('A1').setNote('Pregunta = de opción múltiple. Palabra = traducción: en la columna C ' +
    'va la palabra en hebreo o arameo y en la D lo que quiere decir. Las opciones malas las arma ' +
    'el juego solo, con las traducciones de las otras palabras.');
  sj.getRange('B1').setNote('Qué tan hondo aparece: 1 en el Bet Hamidrash (pisos 1 a 3), ' +
    '2 en los Salones, 3 en la Excursión, 4 en el Pardés. Si no sabes, pon 1 o 2.');
  sj.getRange('I1').setNote('Lo que se lee después de contestar, acierte o no. Es para explicar.');
  sj.getRange('J1').setNote('Pon No para sacar un renglón del juego sin borrarlo.');
  if (sj.getLastRow() < 2) {
    sj.getRange(2, 1, 3, 10).setValues([
      ['Pregunta', 1, '¿Cómo se llama el libro que se usa para apoyar el sefer al estudiar de pie?',
       'Shtender', 'Bimá', 'Arón', 'Amud', 'A', 'El shtender.', 'Sí'],
      ['Palabra', 2, 'תָּא שְׁמַע', 'ven y escucha', '', '', '', '', '', 'Sí'],
      ['Palabra', 3, 'קוּשְׁיָא', 'pregunta difícil', '', '', '', '', '', 'Sí']
    ]);
  }

  var resumen = (creadas.length ? 'Hojas creadas: ' + creadas.join(', ') : 'Las hojas ya existían.') +
    '\n\nEn RetosSemanales te dejé un reto de ejemplo. Cámbialo o agrega un renglón nuevo ' +
    'con la fecha de esta semana.\n\nDe los invitados no se guarda nada: ni nombre, ' +
    'ni respuesta. En RespuestasReto solo caen los alumnos identificados.' +
    '\n\nEn RetosJuego van las preguntas del juego Pardés. Cada renglón que agregues ' +
    'aparece en el juego al rato (tarda hasta 10 minutos en actualizarse).';

  // getUi() solo existe cuando esto corre desde la hoja. Si se corre desde el
  // editor de Apps Script, la ventana no se puede abrir y no importa: las hojas
  // ya quedaron creadas arriba. El aviso nunca debe tumbar la instalación.
  try { SpreadsheetApp.getUi().alert('Listo', resumen, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { Logger.log(resumen); }
  return resumen;
}
