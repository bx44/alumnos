/**
 * Or Barak — Construye tu campus (motor)
 * Archivo NUEVO dentro del proyecto GestionAcademica.
 *
 * Depende de Codigo-API.gs (SS, COL, DIAS, filas_, txt_, claveFecha_, props_)
 * y de Codigo-Alumnos.gs (alSesion_, alClavesDe_, AL_H, AL_COL, alHojaPropia_).
 *
 * PRINCIPIO DE DISEÑO
 * El XP NO se guarda. Se recalcula en cada llamada a partir de datos que ya
 * existen: Asistencia, Evaluaciones, Temario y la bitácora del propio alumno.
 * Consecuencias:
 *   - un alumno no puede darse XP: no hay campo que escribir
 *   - si corriges un dato en la hoja, el campus se corrige solo
 *   - no hace falta libro de transacciones ni saldos que cuadrar
 * Lo único que el alumno escribe es DÓNDE pone sus cosas, y eso se valida
 * contra su nivel antes de guardarse.
 */

var CAMPUS_H = {
  campus:   'CampusAlumno',
  reconoce: 'ReconocimientosAlumno'
};

var CAMPUS_COL = {
  campus:   { id: 1, nombre: 2, layout: 3, actualizado: 4 },
  reconoce: { fecha: 1, id: 2, nombre: 3, motivo: 4, xp: 5, objeto: 6, otorga: 7 }
};

var CAMPUS_REJILLA = 12;      // el terreno es de 12 x 12 casillas
var CAMPUS_MAX_PIEZAS = 120;  // tope de objetos colocados, para que no crezca sin fin

// ---------- Cuánto vale cada cosa ----------
// Deliberadamente NO depende solo de la calificación: presentarse a una bejiná
// da la mayor parte del XP, y sacar buena nota da un extra moderado.
var XP = {
  asistio:        10,
  retardo:         5,
  justificada:     2,
  bejina:         40,   // por presentarla, sea cual sea el resultado
  bejinaBuena:    20,   // extra si la calificación es 8 o más
  bitacora:       15,   // por cada registro propio de kriá / jazará / jevruta
  bitacoraTope:    2,   // cuántos registros cuentan por día
  meta:           50,   // por cada meta propia cumplida
  temario:         6    // por cada sesión de su temario ya cubierta
};

// ---------- Escalera de niveles ----------
var NIVELES = [0, 500, 1000, 1750, 2500, 3500, 5000, 7000, 9500, 12500];
var NIVEL_PASO = 3500;   // a partir del 10, cada nivel cuesta esto

function campusNivel_(xp) {
  var n = 1;
  for (var i = 0; i < NIVELES.length; i++) if (xp >= NIVELES[i]) n = i + 1;
  if (xp >= NIVELES[NIVELES.length - 1]) {
    n = NIVELES.length + Math.floor((xp - NIVELES[NIVELES.length - 1]) / NIVEL_PASO);
  }
  return n;
}

function campusXpDeNivel_(n) {
  if (n <= NIVELES.length) return NIVELES[n - 1];
  return NIVELES[NIVELES.length - 1] + (n - NIVELES.length) * NIVEL_PASO;
}

// ---------- Catálogo ----------
// w y h son casillas. nivel es el nivel en que se desbloquea.
// El sprite lo dibuja el frontend a partir del id; aquí no hay imágenes.
var CATALOGO = [
  // Edificios
  { id: 'principal',  nombre: 'Edificio principal', tipo: 'edificio', w: 3, h: 3, nivel: 1,
    desc: 'Donde empieza todo.' },
  { id: 'beitmidrash',nombre: 'Beit Midrash',       tipo: 'edificio', w: 3, h: 3, nivel: 2,
    desc: 'Se abrió cuando llevabas ya varias semanas viniendo.' },
  { id: 'salon',      nombre: 'Salón',              tipo: 'edificio', w: 3, h: 2, nivel: 3,
    desc: 'Tu salón de clases.' },
  { id: 'biblioteca', nombre: 'Biblioteca',         tipo: 'edificio', w: 2, h: 3, nivel: 4,
    desc: 'Libros de kodesh y de todo lo demás.' },
  { id: 'comedor',    nombre: 'Comedor',            tipo: 'edificio', w: 3, h: 2, nivel: 5,
    desc: 'Donde se junta todo el mundo.' },
  { id: 'carpinteria',nombre: 'Carpintería',        tipo: 'edificio', w: 3, h: 2, nivel: 6,
    desc: 'Serrucho, madera y aserrín.' },
  { id: 'cancha',     nombre: 'Cancha',             tipo: 'edificio', w: 4, h: 3, nivel: 7,
    desc: 'Para cuando hay que moverse.' },
  { id: 'huerto',     nombre: 'Shorashim',          tipo: 'edificio', w: 3, h: 2, nivel: 8,
    desc: 'El huerto. Lo que siembras tarda, pero sale.' },
  { id: 'musica',     nombre: 'Sala de música',     tipo: 'edificio', w: 2, h: 2, nivel: 9,
    desc: 'Instrumentos y ruido del bueno.' },
  { id: 'plaza',      nombre: 'Plaza central',      tipo: 'edificio', w: 3, h: 3, nivel: 10,
    desc: 'El corazón del campus.' },

  // Naturaleza y decoración
  { id: 'arbol',      nombre: 'Árbol',              tipo: 'natural', w: 1, h: 1, nivel: 1 },
  { id: 'banca',      nombre: 'Banca',              tipo: 'mueble',  w: 1, h: 1, nivel: 1 },
  { id: 'camino',     nombre: 'Tramo de camino',    tipo: 'suelo',   w: 1, h: 1, nivel: 1 },
  { id: 'arbusto',    nombre: 'Arbusto',            tipo: 'natural', w: 1, h: 1, nivel: 2 },
  { id: 'lampara',    nombre: 'Lámpara',            tipo: 'mueble',  w: 1, h: 1, nivel: 2 },
  { id: 'maceta',     nombre: 'Maceta',             tipo: 'natural', w: 1, h: 1, nivel: 3 },
  { id: 'bici',       nombre: 'Bicicleta',          tipo: 'mueble',  w: 1, h: 1, nivel: 3 },
  { id: 'arbolgrande',nombre: 'Árbol grande',       tipo: 'natural', w: 2, h: 2, nivel: 4 },
  { id: 'fuente',     nombre: 'Fuente',             tipo: 'especial',w: 2, h: 2, nivel: 5 },
  { id: 'olivo',      nombre: 'Olivo',              tipo: 'natural', w: 2, h: 2, nivel: 6 },
  { id: 'invernadero',nombre: 'Invernadero',        tipo: 'especial',w: 2, h: 2, nivel: 7 },
  { id: 'escultura',  nombre: 'Escultura',          tipo: 'especial',w: 1, h: 1, nivel: 9 }
];

function campusPieza_(id) {
  for (var i = 0; i < CATALOGO.length; i++) if (CATALOGO[i].id === id) return CATALOGO[i];
  return null;
}


// ═══════════════════ CÁLCULO DEL XP ═══════════════════

/**
 * Recorre los datos reales del alumno y arma el desglose.
 * Devuelve { total, partes: [{clave, etiqueta, xp, detalle}] }
 */
function campusCalcularXp_(id, claves) {
  var partes = [];

  // --- Asistencia ---
  var asistio = 0, retardo = 0, justif = 0;
  var aRows = filas_('Asistencia', 6);
  for (var i = 0; i < aRows.length; i++) {
    if (txt_(aRows[i][COL.asistencia.alumno - 1]) !== id) continue;
    var est = txt_(aRows[i][COL.asistencia.estado - 1]);
    if (est === 'Asistió') asistio++;
    else if (est === 'Retardo') retardo++;
    else if (est === 'Falta justificada') justif++;
  }
  var xpAsis = asistio * XP.asistio + retardo * XP.retardo + justif * XP.justificada;
  if (xpAsis) partes.push({ clave: 'asistencia', etiqueta: 'Por venir a clases', xp: xpAsis,
    detalle: asistio + ' asistencias' + (retardo ? ', ' + retardo + ' retardos' : '') });

  // --- Bejinot: pesa presentarse, no solo la nota ---
  var bej = 0, buenas = 0;
  var eRows = filas_('Evaluaciones', 8);
  for (var j = 0; j < eRows.length; j++) {
    if (txt_(eRows[j][COL.evaluaciones.alumno - 1]) !== id) continue;
    var f = eRows[j][COL.evaluaciones.fecha - 1];
    if (Object.prototype.toString.call(f) !== '[object Date]') continue;
    bej++;
    var cal = Number(eRows[j][COL.evaluaciones.calif - 1]);
    if (!isNaN(cal) && cal >= 8) buenas++;
  }
  var xpBej = bej * XP.bejina + buenas * XP.bejinaBuena;
  if (xpBej) partes.push({ clave: 'bejinot', etiqueta: 'Por presentar bejinot', xp: xpBej,
    detalle: bej + ' presentadas' + (buenas ? ', ' + buenas + ' de 8 o más' : '') });

  // --- Temario cubierto de sus materias ---
  var sesiones = 0;
  if (claves.length) {
    var hoy = new Date(); hoy.setHours(23, 59, 59, 0);
    var tRows = filas_('Temario', 7);
    for (var k = 0; k < tRows.length; k++) {
      if (claves.indexOf(txt_(tRows[k][COL.temario.clave - 1])) < 0) continue;
      var ft = tRows[k][COL.temario.fecha - 1];
      if (Object.prototype.toString.call(ft) !== '[object Date]') continue;
      if (ft <= hoy) sesiones++;
    }
  }
  var xpTem = sesiones * XP.temario;
  if (xpTem) partes.push({ clave: 'temario', etiqueta: 'Temario avanzado', xp: xpTem,
    detalle: sesiones + ' sesiones cubiertas' });

  // --- Su propia bitácora, con tope diario para que no se infle ---
  var porDia = {};
  var sh = SS.getSheetByName(AL_H.reg);
  if (sh && sh.getLastRow() > 1) {
    var rRows = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues();
    for (var m = 0; m < rRows.length; m++) {
      if (txt_(rRows[m][AL_COL.reg.id - 1]) !== id) continue;
      var fr = rRows[m][AL_COL.reg.fecha - 1];
      if (Object.prototype.toString.call(fr) !== '[object Date]') continue;
      var cf = claveFecha_(fr);
      porDia[cf] = (porDia[cf] || 0) + 1;
    }
  }
  var cuentan = 0, dias = 0;
  for (var d in porDia) { cuentan += Math.min(porDia[d], XP.bitacoraTope); dias++; }
  var xpBit = cuentan * XP.bitacora;
  if (xpBit) partes.push({ clave: 'bitacora', etiqueta: 'Lo que registraste tú', xp: xpBit,
    detalle: dias + ' días con registro' });

  // --- Metas propias cumplidas ---
  var metas = 0;
  var shm = SS.getSheetByName(AL_H.metas);
  if (shm && shm.getLastRow() > 1) {
    var mRows = shm.getRange(2, 1, shm.getLastRow() - 1, 7).getValues();
    for (var p = 0; p < mRows.length; p++) {
      if (txt_(mRows[p][AL_COL.metas.alumno - 1]) !== id) continue;
      if (txt_(mRows[p][AL_COL.metas.estado - 1]) === 'Cumplida') metas++;
    }
  }
  var xpMeta = metas * XP.meta;
  if (xpMeta) partes.push({ clave: 'metas', etiqueta: 'Metas que cumpliste', xp: xpMeta,
    detalle: metas + ' cumplidas' });

  // --- Reconocimientos otorgados a mano ---
  var rec = campusReconocimientos_(id);
  var xpRec = 0;
  for (var q = 0; q < rec.length; q++) xpRec += rec[q].xp;
  if (xpRec) partes.push({ clave: 'reconocimientos', etiqueta: 'Reconocimientos', xp: xpRec,
    detalle: rec.length + ' otorgados' });

  var total = 0;
  for (var r = 0; r < partes.length; r++) total += partes[r].xp;
  return { total: total, partes: partes, reconocimientos: rec };
}

/** Reconocimientos manuales de un alumno, en orden reciente primero. */
function campusReconocimientos_(id) {
  var sh = SS.getSheetByName(CAMPUS_H.reconoce);
  var out = [];
  if (!sh || sh.getLastRow() < 2) return out;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues();
  var tz = Session.getScriptTimeZone();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][CAMPUS_COL.reconoce.id - 1]) !== id) continue;
    var f = rows[i][CAMPUS_COL.reconoce.fecha - 1];
    var esFecha = Object.prototype.toString.call(f) === '[object Date]';
    out.push({
      fecha:  esFecha ? Utilities.formatDate(f, tz, 'd MMM yyyy') : '',
      orden:  esFecha ? f.getTime() : 0,
      motivo: txt_(rows[i][CAMPUS_COL.reconoce.motivo - 1]),
      xp:     Number(rows[i][CAMPUS_COL.reconoce.xp - 1]) || 0,
      objeto: txt_(rows[i][CAMPUS_COL.reconoce.objeto - 1]),
      otorga: txt_(rows[i][CAMPUS_COL.reconoce.otorga - 1])
    });
  }
  out.sort(function (a, b) { return b.orden - a.orden; });
  return out;
}

/** Convierte el nombre de un objeto único en un id estable. */
function campusIdUnico_(nombre) {
  var s = String(nombre).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return 'unico:' + s;
}


// ═══════════════════ ESTADO DEL CAMPUS ═══════════════════

function campusLayoutDe_(id) {
  var sh = SS.getSheetByName(CAMPUS_H.campus);
  if (!sh || sh.getLastRow() < 2) return { fila: 0, piezas: [] };
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][CAMPUS_COL.campus.id - 1]) !== id) continue;
    var crudo = txt_(rows[i][CAMPUS_COL.campus.layout - 1]);
    var piezas = [];
    if (crudo) { try { piezas = JSON.parse(crudo) || []; } catch (e) { piezas = []; } }
    return { fila: i + 2, piezas: piezas };
  }
  return { fila: 0, piezas: [] };
}

/**
 * Devuelve todo lo que la pantalla del campus necesita.
 */
function alCampus(p) {
  var s = alSesion_(p);
  var claves = alClavesDe_(s.id);
  var calc = campusCalcularXp_(s.id, claves);

  var nivel = campusNivel_(calc.total);
  var base = campusXpDeNivel_(nivel);
  var meta = campusXpDeNivel_(nivel + 1);

  // Catálogo con su estado de desbloqueo
  var catalogo = [];
  for (var i = 0; i < CATALOGO.length; i++) {
    var c = CATALOGO[i];
    catalogo.push({
      id: c.id, nombre: c.nombre, tipo: c.tipo, w: c.w, h: c.h,
      nivel: c.nivel, desc: c.desc || '',
      abierto: nivel >= c.nivel
    });
  }

  // Objetos únicos que le dieron por reconocimiento
  var unicos = [];
  for (var j = 0; j < calc.reconocimientos.length; j++) {
    var r = calc.reconocimientos[j];
    if (!r.objeto) continue;
    unicos.push({
      id: campusIdUnico_(r.objeto), nombre: r.objeto, tipo: 'unico',
      w: 1, h: 1, nivel: 0, abierto: true,
      desc: r.motivo, otorga: r.otorga, fecha: r.fecha
    });
  }

  var estado = campusLayoutDe_(s.id);

  return {
    ok: true,
    nombre: s.nombre,
    xp: calc.total,
    partes: calc.partes,
    nivel: nivel,
    xpNivel: base,
    xpSiguiente: meta,
    rejilla: CAMPUS_REJILLA,
    catalogo: catalogo,
    unicos: unicos,
    piezas: estado.piezas,
    reconocimientos: calc.reconocimientos.slice(0, 10),
    estrenando: estado.fila === 0 && estado.piezas.length === 0
  };
}

/**
 * Guarda la colocación. Valida en el servidor:
 *   - que la pieza exista en el catálogo o sea un único suyo
 *   - que su nivel ya la tenga desbloqueada
 *   - que quepa dentro del terreno
 *   - que no se encime con otra
 * Si algo no pasa, la pieza se descarta en silencio y las demás sí se guardan.
 */
function alCampusGuardar(p) {
  var s = alSesion_(p);
  var claves = alClavesDe_(s.id);
  var calc = campusCalcularXp_(s.id, claves);
  var nivel = campusNivel_(calc.total);

  var entrada;
  try { entrada = JSON.parse(p.piezas || '[]'); }
  catch (e) { return { ok: false, error: 'No entendí la distribución del campus.' }; }
  if (!(entrada instanceof Array)) return { ok: false, error: 'Formato inválido.' };
  if (entrada.length > CAMPUS_MAX_PIEZAS) {
    return { ok: false, error: 'Demasiados objetos en el campus.' };
  }

  // Únicos permitidos para este alumno
  var permitidosUnicos = {};
  for (var u = 0; u < calc.reconocimientos.length; u++) {
    var ob = calc.reconocimientos[u].objeto;
    if (ob) permitidosUnicos[campusIdUnico_(ob)] = true;
  }

  var ocupado = {}, limpias = [], descartadas = 0;
  for (var i = 0; i < entrada.length; i++) {
    var pz = entrada[i] || {};
    var id = txt_(pz.id);
    var x = Math.round(Number(pz.x)), y = Math.round(Number(pz.y));
    if (isNaN(x) || isNaN(y)) { descartadas++; continue; }

    var w = 1, h = 1;
    if (id.indexOf('unico:') === 0) {
      if (!permitidosUnicos[id]) { descartadas++; continue; }
    } else {
      var def = campusPieza_(id);
      if (!def) { descartadas++; continue; }
      if (nivel < def.nivel) { descartadas++; continue; }   // todavía no lo tiene
      w = def.w; h = def.h;
    }

    if (x < 0 || y < 0 || x + w > CAMPUS_REJILLA || y + h > CAMPUS_REJILLA) { descartadas++; continue; }

    var choca = false;
    for (var dx = 0; dx < w && !choca; dx++) {
      for (var dy = 0; dy < h; dy++) {
        if (ocupado[(x + dx) + ',' + (y + dy)]) { choca = true; break; }
      }
    }
    if (choca) { descartadas++; continue; }
    for (var ax = 0; ax < w; ax++) {
      for (var ay = 0; ay < h; ay++) ocupado[(x + ax) + ',' + (y + ay)] = true;
    }

    limpias.push({ id: id, x: x, y: y });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = SS.getSheetByName(CAMPUS_H.campus);
    if (!sh) throw new Error('Falta la hoja CampusAlumno.');
    var estado = campusLayoutDe_(s.id);
    var texto = JSON.stringify(limpias);
    if (estado.fila) {
      sh.getRange(estado.fila, CAMPUS_COL.campus.layout).setValue(texto);
      sh.getRange(estado.fila, CAMPUS_COL.campus.actualizado).setValue(new Date());
    } else {
      sh.appendRow([s.id, s.nombre, texto, new Date()]);
    }
    return { ok: true, piezas: limpias, descartadas: descartadas };
  } finally { lock.releaseLock(); }
}
