/**
 * Or Barak — App del alumno (Or+)
 * Archivo NUEVO dentro del mismo proyecto de Apps Script.
 *
 * Depende del Codigo-API.gs existente y reutiliza sus globales y helpers:
 *   SS, COL, DIAS, APP_KEY, json_, hoja_, filas_, txt_, fecha_, fechaCorta_,
 *   claveFecha_, hhmm_, bandas_, diasSinClases_, props_
 *
 * NO define onOpen() ni doGet(): esos viven en Codigo-API.gs.
 * NO escribe en Bitacora, Asistencia ni Evaluaciones: solo las lee.
 * Sus cinco hojas propias no tienen columnas con fórmula.
 */

// ---------- Parámetros ----------
var AL_DIAS_TOKEN  = 30;   // duración de la sesión guardada en el celular
var AL_MAX_FALLOS  = 5;    // PINs errados antes de bloquear
var AL_MIN_BLOQUEO = 15;   // minutos de bloqueo

var AL_H = {
  acceso: 'AccesoAlumnos',
  avisos: 'AvisosAlumnos',
  reg:    'RegistroAlumno',
  metas:  'MetasAlumno',
  sol:    'SolicitudesAlumnos'
};

// Mapa de columnas de las hojas propias (1 = A)
var AL_COL = {
  acceso: { id: 1, nombre: 2, codigo: 3, pin: 4, activo: 5, ultimo: 6 },
  avisos: { fecha: 1, titulo: 2, mensaje: 3, para: 4, vence: 5, activo: 6 },
  reg:    { sello: 1, fecha: 2, id: 3, nombre: 4, tipo: 5, detalle: 6, minutos: 7 },
  metas:  { id: 1, alumno: 2, nombre: 3, meta: 4, estado: 5, creada: 6, cumplida: 7 },
  sol:    { id: 1, sello: 2, alumno: 3, nombre: 4, tipo: 5, mensaje: 6,
            estado: 7, respuesta: 8, fresp: 9 }
};

var AL_ESQUEMA = {
  AccesoAlumnos:      ['ID del alumno', 'Nombre', 'Código', 'PIN', 'Activo', 'Último acceso'],
  AvisosAlumnos:      ['Fecha', 'Título', 'Mensaje', 'Para', 'Vence', 'Activo'],
  RegistroAlumno:     ['Fecha y hora', 'Fecha', 'ID del alumno', 'Nombre', 'Tipo', 'Detalle', 'Minutos'],
  MetasAlumno:        ['ID de la meta', 'ID del alumno', 'Nombre', 'Meta', 'Estado', 'Creada', 'Cumplida'],
  SolicitudesAlumnos: ['ID', 'Fecha y hora', 'ID del alumno', 'Nombre', 'Tipo', 'Mensaje',
                       'Estado', 'Respuesta', 'Fecha de respuesta'],
  CampusAlumno:       ['ID del alumno', 'Nombre', 'Distribución', 'Actualizado'],
  ReconocimientosAlumno: ['Fecha', 'ID del alumno', 'Nombre', 'Motivo', 'XP', 'Objeto único',
                          'Otorgado por']
};

// ---------- Fechas en español ----------
// Utilities.formatDate usa el idioma de la cuenta, que aquí es inglés, y
// escupía "26 de October". Los nombres van a mano para que no dependa de eso.
var AL_MESES = ['enero','febrero','marzo','abril','mayo','junio',
                'julio','agosto','septiembre','octubre','noviembre','diciembre'];
var AL_MESES_CORTOS = ['ene','feb','mar','abr','may','jun',
                       'jul','ago','sep','oct','nov','dic'];

function alMes_(d)         { return AL_MESES[d.getMonth()]; }
function alFechaLarga_(d)  { return d.getDate() + ' de ' + AL_MESES[d.getMonth()]; }
function alFechaCorta_(d)  { return d.getDate() + ' ' + AL_MESES_CORTOS[d.getMonth()]; }
function alFechaAnio_(d)   { return alFechaCorta_(d) + ' ' + d.getFullYear(); }
function alDiaCorto_(d)    { return DIAS[d.getDay()].substring(0, 3).toLowerCase(); }
function alHora_(d) {
  var h = d.getHours(), m = d.getMinutes();
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

var AL_TIPOS_SOL = ['Permiso', 'Pregunta', 'Reportar algo', 'Quiero hablar con alguien'];


// ═══════════════════ ROUTER ═══════════════════
// Lo llama doGet() de Codigo-API.gs cuando la acción empieza con "al_".

function apiAlumnos(p) {
  try {
    switch (String(p.accion || '')) {
      case 'al_login':       return alLogin(p);
      case 'al_inicio':      return alInicio(p);
      case 'al_avance':      return alAvance(p);
      case 'al_horario':     return alHorario(p);
      case 'al_registrar':   return alRegistrar(p);
      case 'al_meta_nueva':  return alMetaNueva(p);
      case 'al_meta_estado': return alMetaEstado(p);
      case 'al_solicitar':   return alSolicitar(p);
      case 'al_solicitudes': return alSolicitudes(p);
      case 'al_salir':       return alSalir(p);
      // Construye tu campus — el motor vive en Codigo-Campus.gs
      case 'al_campus':         return alCampus(p);
      case 'al_campus_guardar': return alCampusGuardar(p);
      // Estas tres NO piden token: son la puerta de invitados.
      // Viven en Codigo-Invitados.gs y no tocan datos de ningún alumno.
      case 'al_reto':           return alReto(p);
      case 'al_reto_responder': return alRetoResponder(p);
      case 'al_juegos':         return alJuegos(p);
      // Avisos al celular. Viven en Codigo-Push.gs y sí piden token:
      // un invitado no recibe avisos y no se guarda nada de su teléfono.
      case 'al_push_registrar': return alPushRegistrar(p);
      case 'al_push_baja':      return alPushBaja(p);
      default: return { ok: false, error: 'Acción no reconocida.' };
    }
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}


// ═══════════════════ SESIÓN ═══════════════════

function alHojaAcceso_() {
  var sh = SS.getSheetByName(AL_H.acceso);
  if (!sh) throw new Error('Falta la hoja AccesoAlumnos. Córrela desde el menú Or Barak.');
  return sh;
}

function alFilasAcceso_() {
  var sh = alHojaAcceso_();
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 6).getValues();
}

function alBloqueado_(codigo) {
  var raw = props_().getProperty('falA_' + codigo);
  if (!raw) return 0;
  var f = JSON.parse(raw);
  if (!f.hasta || f.hasta < Date.now()) return 0;
  return Math.ceil((f.hasta - Date.now()) / 60000);
}

function alFallo_(codigo, nombre) {
  var raw = props_().getProperty('falA_' + codigo);
  var f = raw ? JSON.parse(raw) : { n: 0, hasta: 0 };
  f.n = (f.n || 0) + 1;
  var restantes = AL_MAX_FALLOS - f.n;
  if (f.n >= AL_MAX_FALLOS) {
    f.hasta = Date.now() + AL_MIN_BLOQUEO * 60000;
    f.n = 0;
    restantes = 0;
    registraAcceso_(nombre || codigo, 'ALUMNO BLOQUEADO por ' + AL_MAX_FALLOS + ' PINs errados');
  }
  props_().setProperty('falA_' + codigo, JSON.stringify(f));
  return restantes;
}

function alLogin(p) {
  var codigo = txt_(p.codigo).toUpperCase();
  var pin    = txt_(p.pin);
  if (!codigo || !pin) return { ok: false, error: 'Escribe tu código y tu PIN.' };

  var min = alBloqueado_(codigo);
  if (min) return { ok: false, error: 'Demasiados intentos. Vuelve a intentar en ' + min + ' minuto(s).' };

  var rows = alFilasAcceso_();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.acceso.codigo - 1]).toUpperCase() !== codigo) continue;

    var nombre = txt_(rows[i][AL_COL.acceso.nombre - 1]);
    if (txt_(rows[i][AL_COL.acceso.activo - 1]) === 'No') {
      return { ok: false, error: 'Tu acceso está desactivado. Habla con la dirección.' };
    }
    if (txt_(rows[i][AL_COL.acceso.pin - 1]) !== pin) {
      var quedan = alFallo_(codigo, nombre);
      registraAcceso_(nombre, 'Alumno: PIN incorrecto');
      return { ok: false, error: quedan
        ? 'PIN incorrecto. Te quedan ' + quedan + ' intento(s).'
        : 'Demasiados intentos. Espera ' + AL_MIN_BLOQUEO + ' minutos.' };
    }

    props_().deleteProperty('falA_' + codigo);
    var id = txt_(rows[i][AL_COL.acceso.id - 1]);
    var t = Utilities.getUuid();
    props_().setProperty('tka_' + t, JSON.stringify({
      a: id, n: nombre, exp: Date.now() + AL_DIAS_TOKEN * 86400000
    }));
    alHojaAcceso_().getRange(i + 2, AL_COL.acceso.ultimo).setValue(new Date());
    registraAcceso_(nombre, 'Alumno entró con PIN');
    return { ok: true, token: t, nombre: nombre };
  }
  return { ok: false, error: 'No encontramos ese código.' };
}

/** Devuelve {id, nombre} o lanza error. */
function alSesion_(p) {
  var t = txt_(p.token);
  if (!t) throw new Error('Sesión no iniciada.');
  var raw = props_().getProperty('tka_' + t);
  if (!raw) throw new Error('Tu sesión ya no es válida. Vuelve a entrar con tu PIN.');
  var d = JSON.parse(raw);
  if (d.exp < Date.now()) {
    props_().deleteProperty('tka_' + t);
    throw new Error('Tu sesión venció. Vuelve a entrar con tu PIN.');
  }
  // pudo haber sido desactivado después de entrar
  var rows = alFilasAcceso_();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.acceso.id - 1]) !== d.a) continue;
    if (txt_(rows[i][AL_COL.acceso.activo - 1]) === 'No') {
      props_().deleteProperty('tka_' + t);
      throw new Error('Tu acceso está desactivado.');
    }
    return { id: d.a, nombre: txt_(rows[i][AL_COL.acceso.nombre - 1]) || d.n };
  }
  throw new Error('Tu usuario ya no está en la lista.');
}

function alSalir(p) {
  try {
    var raw = props_().getProperty('tka_' + txt_(p.token));
    if (raw) registraAcceso_(JSON.parse(raw).n, 'Alumno cerró sesión');
    props_().deleteProperty('tka_' + txt_(p.token));
  } catch (e) {}
  return { ok: true };
}


// ═══════════════════ LECTURA DEL SISTEMA ACADÉMICO ═══════════════════

/** Claves de las materias en que el alumno está inscrito (sin bajas). */
function alClavesDe_(id) {
  var out = [];
  var rows = filas_('Inscripciones', 5);
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][COL.inscripciones.alumno - 1]) !== id) continue;
    if (txt_(rows[i][COL.inscripciones.estatus - 1]) === 'Baja') continue;
    var c = txt_(rows[i][COL.inscripciones.clave - 1]);
    if (c && out.indexOf(c) < 0) out.push(c);
  }
  return out;
}

/** clave -> {materia, maestro} */
function alMapaMaterias_() {
  var m = {};
  var rows = filas_('Materias', 9);
  for (var i = 0; i < rows.length; i++) {
    var c = txt_(rows[i][COL.materias.clave - 1]);
    if (!c) continue;
    m[c] = {
      materia: txt_(rows[i][COL.materias.materia - 1]) || c,
      maestro: txt_(rows[i][COL.materias.maestro - 1]),
      estatus: txt_(rows[i][COL.materias.estatus - 1])
    };
  }
  return m;
}

/** Datos del alumno en la hoja Alumnos: D programa, F tutor, G meta, H estatus. */
function alDatosAlumno_(id) {
  var rows = filas_('Alumnos', 8);
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][COL.alumnos.id - 1]) !== id) continue;
    return {
      nombre:   txt_(rows[i][COL.alumnos.nombre - 1]),
      programa: txt_(rows[i][3]),
      tutor:    txt_(rows[i][5]),
      meta:     txt_(rows[i][6]),
      estatus:  txt_(rows[i][COL.alumnos.estatus - 1])
    };
  }
  return { nombre: '', programa: '', tutor: '', meta: '', estatus: '' };
}


// ═══════════════════ INICIO ═══════════════════

function alInicio(p) {
  var s = alSesion_(p);
  var claves = alClavesDe_(s.id);
  var mats = alMapaMaterias_();
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var cHoy = claveFecha_(hoy);
  var tz = Session.getScriptTimeZone();

  // ¿Hoy hay clases?
  var bloqueadas = diasSinClases_();
  var especial = bloqueadas[cHoy]
    ? { titulo: bloqueadas[cHoy], sinClases: true }
    : null;

  // Clases de hoy, desde el Horario de sus materias.
  // Las bandas traen "Vigente desde / hasta". Si esas fechas se quedan sin
  // actualizar, el filtro deja al alumno sin horario y la pantalla se ve rota.
  // Por eso se arman dos listas: la vigente y la de todas las de hoy. Si la
  // vigente queda vacía pero la otra no, se muestra la otra y se avisa que el
  // horario está vencido, en lugar de no mostrar nada.
  var clases = [], vencido = false;
  if (!especial) {
    var bs = bandas_();
    var vigentes = [], todas = [];
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      if (claves.indexOf(b.clave) < 0 || b.dia !== hoy.getDay()) continue;
      var mi = mats[b.clave] || {};
      var fila = {
        inicio: hhmm_(b.ini), fin: hhmm_(b.fin),
        materia: mi.materia || b.clave, maestro: mi.maestro || '', lugar: b.lugar
      };
      todas.push(fila);
      if (b.desde && hoy < b.desde) continue;
      if (b.hasta && hoy > b.hasta) continue;
      vigentes.push(fila);
    }
    if (vigentes.length) clases = vigentes;
    else if (todas.length) { clases = todas; vencido = true; }
    clases.sort(function (a, c) { return String(a.inicio).localeCompare(String(c.inicio)); });
  }

  // Tema de hoy, por materia. De paso se mira hasta dónde llega el temario:
  // si la última fecha planeada ya pasó, nadie lo ha regenerado.
  var temas = [], ultimoTema = null;
  var tRows = filas_('Temario', 7);
  for (var j = 0; j < tRows.length; j++) {
    var cv = txt_(tRows[j][COL.temario.clave - 1]);
    if (claves.indexOf(cv) < 0) continue;
    var f = tRows[j][COL.temario.fecha - 1];
    if (Object.prototype.toString.call(f) !== '[object Date]') continue;
    if (!ultimoTema || f > ultimoTema) ultimoTema = f;
    if (claveFecha_(f) !== cHoy) continue;
    temas.push({
      materia: (mats[cv] || {}).materia || cv,
      tema: txt_(tRows[j][COL.temario.tema - 1]),
      tarea: txt_(tRows[j][COL.temario.tarea - 1]),
      material: txt_(tRows[j][COL.temario.material - 1])
    });
  }

  return {
    ok: true,
    nombre: s.nombre,
    dia: DIAS[hoy.getDay()],
    fecha: alFechaLarga_(hoy),
    especial: especial,
    clases: clases,
    temas: temas,
    horarioVencido: vencido,
    temarioVencido: !!(ultimoTema && ultimoTema < hoy),
    sinMaterias: claves.length === 0,
    avisos: alAvisosDe_(s.id),
    metas: alMetasDe_(s.id, true),
    registroHoy: alRegistroHoy_(s.id)
  };
}

function alAvisosDe_(id) {
  var sh = SS.getSheetByName(AL_H.avisos);
  var out = [];
  if (!sh) return out;
  var n = sh.getLastRow() - 1;
  if (n < 1) return out;
  var rows = sh.getRange(2, 1, n, 6).getValues();
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var tz = Session.getScriptTimeZone();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.avisos.activo - 1]) === 'No') continue;
    var para = txt_(rows[i][AL_COL.avisos.para - 1]);
    if (para && para !== 'Todos' && para !== id) continue;
    var v = rows[i][AL_COL.avisos.vence - 1];
    if (Object.prototype.toString.call(v) === '[object Date]' && v < hoy) continue;
    var f = rows[i][AL_COL.avisos.fecha - 1];
    out.push({
      titulo: txt_(rows[i][AL_COL.avisos.titulo - 1]),
      mensaje: txt_(rows[i][AL_COL.avisos.mensaje - 1]),
      fecha: Object.prototype.toString.call(f) === '[object Date]'
        ? alFechaCorta_(f) : ''
    });
  }
  return out.reverse().slice(0, 5);
}


// ═══════════════════ AVANCE ═══════════════════

function alAvance(p) {
  var s = alSesion_(p);
  var datos = alDatosAlumno_(s.id);
  var mats = alMapaMaterias_();
  var tz = Session.getScriptTimeZone();

  // Evaluaciones: A fecha, B alumno, D clave, E tipo, F calificación, H obs
  var bejinot = [];
  var eRows = filas_('Evaluaciones', 8);
  for (var i = 0; i < eRows.length; i++) {
    if (txt_(eRows[i][COL.evaluaciones.alumno - 1]) !== s.id) continue;
    var f = eRows[i][COL.evaluaciones.fecha - 1];
    if (Object.prototype.toString.call(f) !== '[object Date]') continue;
    var cv = txt_(eRows[i][COL.evaluaciones.clave - 1]);
    var cal = eRows[i][COL.evaluaciones.calif - 1];
    bejinot.push({
      fecha: alFechaAnio_(f),
      orden: f.getTime(),
      materia: (mats[cv] || {}).materia || cv,
      tipo: txt_(eRows[i][COL.evaluaciones.tipo - 1]),
      resultado: (cal === '' || cal === null) ? '' : String(cal),
      nota: txt_(eRows[i][COL.evaluaciones.obs - 1])
    });
  }
  bejinot.sort(function (a, b) { return b.orden - a.orden; });

  // Asistencia: A fecha, B clave, C alumno, E estado
  var hoy = new Date();
  var mesIni = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var presentes = 0, delMes = 0, porDia = {};
  var aRows = filas_('Asistencia', 6);
  for (var j = 0; j < aRows.length; j++) {
    if (txt_(aRows[j][COL.asistencia.alumno - 1]) !== s.id) continue;
    var fa = aRows[j][COL.asistencia.fecha - 1];
    if (Object.prototype.toString.call(fa) !== '[object Date]') continue;
    var est = txt_(aRows[j][COL.asistencia.estado - 1]);
    var vino = (est === 'Asistió' || est === 'Retardo');
    var cf = claveFecha_(fa);
    porDia[cf] = (porDia[cf] === undefined) ? vino : (porDia[cf] && vino);
    if (fa >= mesIni) { delMes++; if (est === 'Asistió') presentes++; }
  }

  var dias = Object.keys(porDia).sort().reverse();
  var racha = 0;
  for (var k = 0; k < dias.length; k++) { if (porDia[dias[k]]) racha++; else break; }

  return {
    ok: true,
    nombre: s.nombre,
    programa: datos.programa,
    tutor: datos.tutor,
    meta: datos.meta,
    bejinot: bejinot.slice(0, 25),
    bejinotTotal: bejinot.length,
    asistencia: {
      mes: alMes_(hoy),
      presentes: presentes,
      total: delMes,
      porcentaje: delMes ? Math.round(presentes / delMes * 100) : null,
      racha: racha
    },
    sesionesRegistradas: alRegistroTotal_(s.id)
  };
}


// ═══════════════════ HORARIO ═══════════════════

function alHorario(p) {
  var s = alSesion_(p);
  var claves = alClavesDe_(s.id);
  var mats = alMapaMaterias_();
  var tz = Session.getScriptTimeZone();

  var dias = DIAS.slice(0, 6);            // Domingo a Viernes
  var semana = {};
  for (var d = 0; d < dias.length; d++) semana[dias[d]] = [];

  var bs = bandas_();
  for (var i = 0; i < bs.length; i++) {
    var b = bs[i];
    if (claves.indexOf(b.clave) < 0 || b.dia > 5) continue;
    var mi = mats[b.clave] || {};
    semana[DIAS[b.dia]].push({
      inicio: hhmm_(b.ini), fin: hhmm_(b.fin),
      materia: mi.materia || b.clave, maestro: mi.maestro || ''
    });
  }
  for (var k in semana) {
    semana[k].sort(function (a, c) { return String(a.inicio).localeCompare(String(c.inicio)); });
  }

  // Próximos temas: 14 días hacia adelante
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var tope = new Date(hoy.getTime() + 14 * 86400000);
  var prox = [];
  var tRows = filas_('Temario', 7);
  for (var j = 0; j < tRows.length; j++) {
    var cv = txt_(tRows[j][COL.temario.clave - 1]);
    if (claves.indexOf(cv) < 0) continue;
    var f = tRows[j][COL.temario.fecha - 1];
    if (Object.prototype.toString.call(f) !== '[object Date]') continue;
    if (f < hoy || f > tope) continue;
    prox.push({
      fecha: alDiaCorto_(f) + ' ' + alFechaCorta_(f),
      orden: f.getTime(),
      materia: (mats[cv] || {}).materia || cv,
      tema: txt_(tRows[j][COL.temario.tema - 1]),
      tarea: txt_(tRows[j][COL.temario.tarea - 1])
    });
  }
  prox.sort(function (a, b) { return a.orden - b.orden; });

  return { ok: true, dias: dias, semana: semana, proximos: prox.slice(0, 20) };
}


// ═══════════════════ BITÁCORA DEL ALUMNO ═══════════════════

function alHojaPropia_(nombre) {
  var sh = SS.getSheetByName(nombre);
  if (!sh) throw new Error('Falta la hoja ' + nombre + '. Córrela desde el menú Or Barak.');
  return sh;
}

function alRegistroHoy_(id) {
  var sh = SS.getSheetByName(AL_H.reg);
  var out = [];
  if (!sh) return out;
  var n = sh.getLastRow() - 1;
  if (n < 1) return out;
  var rows = sh.getRange(2, 1, n, 7).getValues();
  var cHoy = claveFecha_(new Date());
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.reg.id - 1]) !== id) continue;
    var f = rows[i][AL_COL.reg.fecha - 1];
    if (Object.prototype.toString.call(f) !== '[object Date]') continue;
    if (claveFecha_(f) !== cHoy) continue;
    out.push({ tipo: txt_(rows[i][AL_COL.reg.tipo - 1]),
               detalle: txt_(rows[i][AL_COL.reg.detalle - 1]) });
  }
  return out;
}

function alRegistroTotal_(id) {
  var sh = SS.getSheetByName(AL_H.reg);
  if (!sh) return 0;
  var n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  var rows = sh.getRange(2, AL_COL.reg.id, n, 1).getValues();
  var c = 0;
  for (var i = 0; i < rows.length; i++) if (txt_(rows[i][0]) === id) c++;
  return c;
}

function alRegistrar(p) {
  var s = alSesion_(p);
  var tipo = txt_(p.tipo);
  if (!tipo) return { ok: false, error: 'Falta el tipo de registro.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    alHojaPropia_(AL_H.reg).appendRow([
      new Date(), new Date(), s.id, s.nombre, tipo,
      txt_(p.detalle).slice(0, 300), Number(p.minutos) || ''
    ]);
    return { ok: true, registroHoy: alRegistroHoy_(s.id) };
  } finally { lock.releaseLock(); }
}

function alMetasDe_(id, soloAbiertas) {
  var sh = SS.getSheetByName(AL_H.metas);
  var out = [];
  if (!sh) return out;
  var n = sh.getLastRow() - 1;
  if (n < 1) return out;
  var rows = sh.getRange(2, 1, n, 7).getValues();
  var tz = Session.getScriptTimeZone();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.metas.alumno - 1]) !== id) continue;
    var estado = txt_(rows[i][AL_COL.metas.estado - 1]) || 'Abierta';
    if (soloAbiertas && estado === 'Cumplida') continue;
    var f = rows[i][AL_COL.metas.creada - 1];
    out.push({
      id: txt_(rows[i][AL_COL.metas.id - 1]),
      meta: txt_(rows[i][AL_COL.metas.meta - 1]),
      estado: estado,
      fecha: Object.prototype.toString.call(f) === '[object Date]'
        ? alFechaCorta_(f) : ''
    });
  }
  return out;
}

function alMetaNueva(p) {
  var s = alSesion_(p);
  var texto = txt_(p.meta);
  if (!texto) return { ok: false, error: 'Escribe tu meta.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    alHojaPropia_(AL_H.metas).appendRow([
      'M' + new Date().getTime(), s.id, s.nombre, texto.slice(0, 200),
      'Abierta', new Date(), ''
    ]);
    return { ok: true, metas: alMetasDe_(s.id, true) };
  } finally { lock.releaseLock(); }
}

function alMetaEstado(p) {
  var s = alSesion_(p);
  var idMeta = txt_(p.id_meta);
  var sh = alHojaPropia_(AL_H.metas);
  var n = sh.getLastRow() - 1;
  if (n < 1) return { ok: false, error: 'No encontramos esa meta.' };
  var rows = sh.getRange(2, 1, n, 7).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.metas.id - 1]) !== idMeta) continue;
    if (txt_(rows[i][AL_COL.metas.alumno - 1]) !== s.id) break;   // no es suya
    var nuevo = txt_(p.estado) || 'Cumplida';
    sh.getRange(i + 2, AL_COL.metas.estado).setValue(nuevo);
    if (nuevo === 'Cumplida') sh.getRange(i + 2, AL_COL.metas.cumplida).setValue(new Date());
    return { ok: true, metas: alMetasDe_(s.id, true) };
  }
  return { ok: false, error: 'No encontramos esa meta.' };
}


// ═══════════════════ CANAL CON DIRECCIÓN ═══════════════════

function alSolicitudesDe_(id) {
  var sh = SS.getSheetByName(AL_H.sol);
  var out = [];
  if (!sh) return out;
  var n = sh.getLastRow() - 1;
  if (n < 1) return out;
  var rows = sh.getRange(2, 1, n, 9).getValues();
  var tz = Session.getScriptTimeZone();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.sol.alumno - 1]) !== id) continue;
    var f = rows[i][AL_COL.sol.sello - 1];
    out.push({
      fecha: Object.prototype.toString.call(f) === '[object Date]'
        ? alFechaCorta_(f) + ' · ' + alHora_(f) : '',
      orden: Object.prototype.toString.call(f) === '[object Date]' ? f.getTime() : 0,
      tipo: txt_(rows[i][AL_COL.sol.tipo - 1]),
      mensaje: txt_(rows[i][AL_COL.sol.mensaje - 1]),
      estado: txt_(rows[i][AL_COL.sol.estado - 1]) || 'Nueva',
      respuesta: txt_(rows[i][AL_COL.sol.respuesta - 1])
    });
  }
  out.sort(function (a, b) { return b.orden - a.orden; });
  return out;
}

function alSolicitudes(p) {
  var s = alSesion_(p);
  return { ok: true, solicitudes: alSolicitudesDe_(s.id) };
}

function alSolicitar(p) {
  var s = alSesion_(p);
  var mensaje = txt_(p.mensaje);
  if (mensaje.length < 5) return { ok: false, error: 'Escribe un poco más de detalle.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    alHojaPropia_(AL_H.sol).appendRow([
      'S' + new Date().getTime(), new Date(), s.id, s.nombre,
      txt_(p.tipo) || 'Mensaje', mensaje.slice(0, 800), 'Nueva', '', ''
    ]);
    return { ok: true, solicitudes: alSolicitudesDe_(s.id) };
  } finally { lock.releaseLock(); }
}


// ═══════════════════ MENÚ: INSTALACIÓN Y ADMINISTRACIÓN ═══════════════════

function alumnosInstalar() {
  var ui = SpreadsheetApp.getUi();
  var creadas = [], revisadas = [];
  for (var nombre in AL_ESQUEMA) {
    var sh = SS.getSheetByName(nombre);
    if (!sh) { sh = SS.insertSheet(nombre); creadas.push(nombre); }
    else revisadas.push(nombre);
    var enc = AL_ESQUEMA[nombre];
    sh.getRange(1, 1, 1, enc.length).setValues([enc])
      .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#29235C');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, enc.length, 150);
  }

  var sa = SS.getSheetByName(AL_H.acceso);
  sa.getRange('E2:E1000').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Sí', 'No'], true).build());

  var sv = SS.getSheetByName(AL_H.avisos);
  sv.getRange('F2:F1000').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Sí', 'No'], true).build());

  var ss = SS.getSheetByName(AL_H.sol);
  ss.getRange('G2:G1000').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Nueva', 'Leída', 'Respondida'], true).build());

  var sm = SS.getSheetByName(AL_H.metas);
  sm.getRange('E2:E1000').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Abierta', 'Cumplida', 'Cancelada'], true).build());

  var sc = SS.getSheetByName('CampusAlumno');
  sc.setColumnWidth(3, 420);
  sc.getRange('C1').setNote('No edites esta columna a mano: la escribe la app ' +
    'cuando el alumno acomoda su campus.');

  var sr = SS.getSheetByName('ReconocimientosAlumno');
  sr.getRange('D1').setNote('Escríbelo para el alumno, no para el expediente. ' +
    'Él lo va a leer tal cual.');
  sr.getRange('E1').setNote('XP que le das. Referencia: una bejiná presentada vale 40, ' +
    'un día de asistencia 10. Un reconocimiento fuerte va bien entre 200 y 500.');
  sr.getRange('F1').setNote('Opcional. El nombre de un objeto que solo él va a tener, ' +
    'por ejemplo "Trofeo de constancia". Aparece en su campus y puede colocarlo.');

  ui.alert('Hojas de la app de alumnos',
    (creadas.length ? 'Creadas: ' + creadas.join(', ') + '\n' : '') +
    (revisadas.length ? 'Ya existían (encabezados verificados): ' + revisadas.join(', ') + '\n' : '') +
    '\nSiguiente paso: "Generar accesos faltantes".', ui.ButtonSet.OK);
}

function alCodigoNuevo_(usados) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // sin I ni O, se confunden con 1 y 0
  var num = '23456789';
  for (var t = 0; t < 300; t++) {
    var c = '';
    for (var i = 0; i < 3; i++) c += abc.charAt(Math.floor(Math.random() * abc.length));
    for (var j = 0; j < 3; j++) c += num.charAt(Math.floor(Math.random() * num.length));
    if (usados.indexOf(c) < 0) { usados.push(c); return c; }
  }
  return 'OB' + String(new Date().getTime()).slice(-6);
}

function alumnosGenerarAccesos() {
  var ui = SpreadsheetApp.getUi();
  var sh = SS.getSheetByName(AL_H.acceso);
  if (!sh) { ui.alert('Primero corre "Instalar hojas de la app".'); return; }

  var previos = alFilasAcceso_();
  var yaTiene = {}, usados = [];
  for (var i = 0; i < previos.length; i++) {
    yaTiene[txt_(previos[i][AL_COL.acceso.id - 1])] = true;
    usados.push(txt_(previos[i][AL_COL.acceso.codigo - 1]).toUpperCase());
  }

  var nuevos = [];
  var rows = filas_('Alumnos', 8);
  for (var j = 0; j < rows.length; j++) {
    var id = txt_(rows[j][COL.alumnos.id - 1]);
    var nombre = txt_(rows[j][COL.alumnos.nombre - 1]);
    var estatus = txt_(rows[j][COL.alumnos.estatus - 1]);
    if (!id || !nombre) continue;
    if (nombre.indexOf('Ejemplo:') === 0) continue;
    if (estatus === 'Baja' || estatus === 'Inactivo') continue;
    if (yaTiene[id]) continue;
    nuevos.push([id, nombre, alCodigoNuevo_(usados),
                 String(Math.floor(1000 + Math.random() * 9000)), 'Sí', '']);
  }

  if (!nuevos.length) { ui.alert('Todos los alumnos activos ya tienen acceso.'); return; }
  sh.getRange(sh.getLastRow() + 1, 1, nuevos.length, 6).setValues(nuevos);
  ui.alert('Listo', nuevos.length + ' acceso(s) generados.\n\n' +
    'Usa "Ver credenciales para repartir" y entrégalos uno por uno.', ui.ButtonSet.OK);
}

function alumnosVerCredenciales() {
  var rows = alFilasAcceso_();
  var h = '<style>body{font-family:Mulish,system-ui,sans-serif;padding:14px;margin:0}' +
          'table{border-collapse:collapse;width:100%}' +
          'td,th{border:1px solid #E2E1EA;padding:7px 9px;font-size:13px;text-align:left}' +
          'th{background:#29235C;color:#fff}' +
          'code{font-family:ui-monospace,monospace;font-size:15px;letter-spacing:1px}' +
          'p{color:#6E6A85;font-size:12px;line-height:1.5}</style>' +
          '<table><tr><th>Alumno</th><th>Código</th><th>PIN</th></tr>';
  var n = 0;
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.acceso.activo - 1]) === 'No') continue;
    if (!txt_(rows[i][AL_COL.acceso.codigo - 1])) continue;
    h += '<tr><td>' + txt_(rows[i][AL_COL.acceso.nombre - 1]) + '</td>' +
         '<td><code>' + txt_(rows[i][AL_COL.acceso.codigo - 1]) + '</code></td>' +
         '<td><code>' + txt_(rows[i][AL_COL.acceso.pin - 1]) + '</code></td></tr>';
    n++;
  }
  h += '</table><p>' + n + ' alumno(s) con acceso. Entrega cada código y PIN de forma individual, ' +
       'no en un grupo de WhatsApp.</p>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(h).setWidth(480).setHeight(580), 'Credenciales de Or+');
}

function alumnosReiniciarPin() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Reiniciar PIN', 'Escribe el código del alumno (por ejemplo ABC234):',
                    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;

  var codigo = txt_(r.getResponseText()).toUpperCase();
  var sh = alHojaAcceso_();
  var rows = alFilasAcceso_();
  for (var i = 0; i < rows.length; i++) {
    if (txt_(rows[i][AL_COL.acceso.codigo - 1]).toUpperCase() !== codigo) continue;
    var pin = String(Math.floor(1000 + Math.random() * 9000));
    sh.getRange(i + 2, AL_COL.acceso.pin).setValue(pin);
    props_().deleteProperty('falA_' + codigo);
    ui.alert('Listo', 'Nuevo PIN de ' + txt_(rows[i][AL_COL.acceso.nombre - 1]) + ': ' + pin +
      '\n\nSu sesión abierta sigue activa. Si quieres cerrarla, usa ' +
      '"Cerrar todas las sesiones abiertas".', ui.ButtonSet.OK);
    return;
  }
  ui.alert('No encontré ese código.');
}

function alumnosPublicarAviso() {
  var ui = SpreadsheetApp.getUi();
  var sh = SS.getSheetByName(AL_H.avisos);
  if (!sh) { ui.alert('Primero corre "Instalar hojas de la app".'); return; }

  var t = ui.prompt('Aviso a los alumnos', 'Título del aviso:', ui.ButtonSet.OK_CANCEL);
  if (t.getSelectedButton() !== ui.Button.OK || !txt_(t.getResponseText())) return;
  var m = ui.prompt('Aviso a los alumnos', 'Mensaje:', ui.ButtonSet.OK_CANCEL);
  if (m.getSelectedButton() !== ui.Button.OK) return;

  var vence = new Date();
  vence.setDate(vence.getDate() + 7);
  sh.appendRow([new Date(), txt_(t.getResponseText()), txt_(m.getResponseText()),
                'Todos', vence, 'Sí']);
  ui.alert('Publicado', 'El aviso aparecerá en Or+ durante 7 días.\n\n' +
    'Puedes cambiar la fecha de "Vence" o poner "No" en Activo directamente en la hoja.',
    ui.ButtonSet.OK);
}

function alumnosSolicitudesPendientes() {
  var sh = SS.getSheetByName(AL_H.sol);
  var ui = SpreadsheetApp.getUi();
  if (!sh) { ui.alert('Primero corre "Instalar hojas de la app".'); return; }
  var n = sh.getLastRow() - 1;
  if (n < 1) { ui.alert('No hay solicitudes.'); return; }

  var rows = sh.getRange(2, 1, n, 9).getValues();
  var tz = Session.getScriptTimeZone();
  var h = '<style>body{font-family:Mulish,system-ui,sans-serif;padding:14px;margin:0;color:#1E1B33}' +
          '.s{border-left:3px solid #C99B52;background:#F7F7FA;padding:11px 13px;margin-bottom:11px;border-radius:0 9px 9px 0}' +
          '.c{display:flex;justify-content:space-between;font-size:12px;color:#6E6A85;margin-bottom:5px}' +
          'b{font-size:14px}p{margin:5px 0 0;font-size:14px;line-height:1.45}</style>';
  var pend = 0;
  for (var i = rows.length - 1; i >= 0; i--) {
    var est = txt_(rows[i][AL_COL.sol.estado - 1]);
    if (est === 'Respondida') continue;
    if (!txt_(rows[i][AL_COL.sol.mensaje - 1])) continue;
    var f = rows[i][AL_COL.sol.sello - 1];
    h += '<div class="s"><div class="c"><b>' + txt_(rows[i][AL_COL.sol.nombre - 1]) + '</b><span>' +
         (Object.prototype.toString.call(f) === '[object Date]'
            ? alFechaCorta_(f) + ' · ' + alHora_(f) : '') + '</span></div>' +
         '<div class="c">' + txt_(rows[i][AL_COL.sol.tipo - 1]) + ' · fila ' + (i + 2) + '</div>' +
         '<p>' + txt_(rows[i][AL_COL.sol.mensaje - 1]) + '</p></div>';
    pend++;
  }
  if (!pend) h += '<p>No hay solicitudes sin responder.</p>';
  else h += '<p style="color:#6E6A85;font-size:12px">Para responder, escribe en la columna ' +
            '<b>Respuesta</b> de la fila indicada y cambia <b>Estado</b> a "Respondida". ' +
            'El alumno lo verá en Or+.</p>';

  ui.showModalDialog(HtmlService.createHtmlOutput(h).setWidth(500).setHeight(600),
                     pend + ' solicitud(es) sin responder');
}
