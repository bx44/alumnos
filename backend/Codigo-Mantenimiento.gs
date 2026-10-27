/**
 * Or Barak — Mantenimiento de fechas
 * Archivo NUEVO en el proyecto GestionAcademica. No toca ningún otro archivo
 * ni agrega opciones al menú: se corre a mano desde el editor de Apps Script.
 *
 * CÓMO SE USA
 *   1. Arriba, en el selector de función, elige  arreglarFechas
 *   2. Ejecutar
 *   3. Lee el resumen y confirma
 *   4. Después, menú Or Barak → Generar fechas del temario
 *
 * QUÉ ARREGLA
 * La hoja Horario tiene "Vigente desde / hasta". Cuando esas fechas se quedan
 * atrás, Or+ deja de mostrarle clases al alumno. Lo mismo pasa con la fecha fin
 * de cada materia: si ya pasó, el temario no alcanza el día de hoy.
 *
 * Esta función empuja ambas fechas al final del ciclo que tú le indiques.
 * No borra nada y no toca filas que ya estén vigentes.
 */

/** Muestra qué está vencido, sin cambiar nada. Corre esto primero si quieres ver. */
function revisarFechas() {
  var r = analizarFechas_();
  SpreadsheetApp.getUi().alert('Revisión de fechas', r.texto, SpreadsheetApp.getUi().ButtonSet.OK);
}

function arreglarFechas() {
  var ui = SpreadsheetApp.getUi();
  var r = analizarFechas_();

  if (!r.horario.length && !r.materias.length) {
    ui.alert('Nada que arreglar', r.texto, ui.ButtonSet.OK);
    return;
  }

  var p = ui.prompt('Arreglar fechas',
    r.texto + '\n\n' +
    'Escribe la fecha de fin del ciclo escolar (aaaa-mm-dd).\n' +
    'Ejemplo: 2027-07-15\n\n' +
    'Voy a poner esa fecha en las filas vencidas que te listé arriba.',
    ui.ButtonSet.OK_CANCEL);
  if (p.getSelectedButton() !== ui.Button.OK) return;

  var fin = fecha_(txt_(p.getResponseText()));
  if (!fin || isNaN(fin.getTime())) { ui.alert('No entendí la fecha. Usa el formato aaaa-mm-dd.'); return; }
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (fin < hoy) { ui.alert('Esa fecha ya pasó. Escribe una fecha futura.'); return; }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var nH = 0, nM = 0;
  try {
    var shH = SS.getSheetByName('Horario');
    for (var i = 0; i < r.horario.length; i++) {
      shH.getRange(r.horario[i].fila, COL.horario.hasta).setValue(fin);
      nH++;
    }
    var shM = SS.getSheetByName('Materias');
    for (var j = 0; j < r.materias.length; j++) {
      shM.getRange(r.materias[j].fila, 6).setValue(fin);   // F = Fecha fin
      nM++;
    }
  } finally { lock.releaseLock(); }

  ui.alert('Listo',
    nH + ' fila(s) de Horario y ' + nM + ' materia(s) ahora llegan hasta ' +
    claveFecha_(fin) + '.\n\n' +
    'Falta un paso: menú Or Barak → "Generar fechas del temario", para que el ' +
    'temario alcance el día de hoy.\n\n' +
    'Después de eso, recarga Or+ en el celular.',
    ui.ButtonSet.OK);
}

/** Junta lo vencido sin modificar nada. */
function analizarFechas_() {
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var tz = Session.getScriptTimeZone();
  var horario = [], materias = [], sinFecha = 0;

  // ---- Horario: filas cuya vigencia ya terminó ----
  var shH = SS.getSheetByName('Horario');
  if (shH && shH.getLastRow() > 1) {
    var filasH = shH.getRange(2, 1, shH.getLastRow() - 1, 9).getDisplayValues();
    for (var i = 0; i < filasH.length; i++) {
      var clave = txt_(filasH[i][COL.horario.clave - 1]);
      if (!clave) continue;
      if (txt_(filasH[i][COL.horario.estatus - 1]) === 'Suspendido') continue;
      var hasta = fecha_(filasH[i][COL.horario.hasta - 1]);
      if (!hasta) { sinFecha++; continue; }
      if (hasta >= hoy) continue;
      horario.push({ fila: i + 2, clave: clave,
                     dia: txt_(filasH[i][COL.horario.dia - 1]),
                     hasta: Utilities.formatDate(hasta, tz, 'yyyy-MM-dd') });
    }
  }

  // ---- Materias en curso cuya fecha fin ya pasó ----
  var shM = SS.getSheetByName('Materias');
  if (shM && shM.getLastRow() > 1) {
    var filasM = shM.getRange(2, 1, shM.getLastRow() - 1, 9).getValues();
    for (var j = 0; j < filasM.length; j++) {
      var cv = txt_(filasM[j][COL.materias.clave - 1]);
      if (!cv) continue;
      var est = txt_(filasM[j][COL.materias.estatus - 1]);
      if (est === 'Concluida' || est === 'Cancelada') continue;
      var ffin = filasM[j][5];   // F = Fecha fin
      if (Object.prototype.toString.call(ffin) !== '[object Date]') continue;
      if (ffin >= hoy) continue;
      materias.push({ fila: j + 2, clave: cv,
                      fin: Utilities.formatDate(ffin, tz, 'yyyy-MM-dd') });
    }
  }

  // ---- Hasta dónde llega el temario ----
  var ultimo = null;
  var shT = SS.getSheetByName('Temario');
  if (shT && shT.getLastRow() > 1) {
    var filasT = shT.getRange(2, COL.temario.fecha, shT.getLastRow() - 1, 1).getValues();
    for (var k = 0; k < filasT.length; k++) {
      var f = filasT[k][0];
      if (Object.prototype.toString.call(f) !== '[object Date]') continue;
      if (!ultimo || f > ultimo) ultimo = f;
    }
  }

  // ---- Resumen legible ----
  var t = 'Hoy es ' + Utilities.formatDate(hoy, tz, 'yyyy-MM-dd') + '.\n\n';

  if (horario.length) {
    var porClave = {};
    for (var a = 0; a < horario.length; a++) {
      porClave[horario[a].clave] = (porClave[horario[a].clave] || 0) + 1;
    }
    var lista = [];
    for (var c in porClave) lista.push(c + ' (' + porClave[c] + ')');
    t += 'HORARIO: ' + horario.length + ' fila(s) con la vigencia vencida.\n' +
         '  ' + lista.join(', ') + '\n' +
         '  La más antigua termina el ' + horario[0].hasta + '.\n' +
         '  Mientras sigan así, Or+ no le muestra clases a nadie.\n\n';
  } else {
    t += 'HORARIO: sin filas vencidas.\n\n';
  }
  if (sinFecha) t += '  (' + sinFecha + ' fila(s) sin fecha de corte: esas siempre salen, está bien.)\n\n';

  if (materias.length) {
    var ms = [];
    for (var b = 0; b < materias.length; b++) ms.push(materias[b].clave + ' → ' + materias[b].fin);
    t += 'MATERIAS: ' + materias.length + ' en curso con fecha fin pasada.\n  ' +
         ms.join('\n  ') + '\n\n';
  } else {
    t += 'MATERIAS: todas las fechas fin están al día.\n\n';
  }

  t += 'TEMARIO: ' + (ultimo
    ? 'la última sesión fechada es el ' + Utilities.formatDate(ultimo, tz, 'yyyy-MM-dd') +
      (ultimo < hoy ? '. Ya pasó: hay que regenerar las fechas.' : '. Alcanza el día de hoy.')
    : 'no hay ninguna sesión con fecha planeada.');

  return { texto: t, horario: horario, materias: materias, ultimoTemario: ultimo };
}
