/**
 * Or Barak — Avisos al celular (push)
 * Archivo NUEVO en el proyecto GestionAcademica.
 *
 * Depende de Codigo-API.gs (SS, txt_, props_, claveFecha_)
 * y de Codigo-Alumnos.gs (alSesion_, AL_H, AL_COL).
 *
 * POR QUÉ FIREBASE Y NO OTRA COSA
 * Un aviso web se manda firmando una credencial. El estándar suelto pide una
 * firma ECDSA que Apps Script no sabe hacer, así que obligaría a montar un
 * servicio aparte. Firebase Cloud Messaging usa firma RSA, que Apps Script sí
 * hace, y por eso todo el emisor cabe aquí dentro. Un servicio menos que cuidar.
 *
 * QUÉ HAY QUE CONFIGURAR ANTES (una sola vez, lo haces tú)
 *   1. Crea un proyecto en console.firebase.google.com
 *   2. Configuración del proyecto → Cuentas de servicio → Generar clave privada.
 *      Baja el archivo .json.
 *   3. En el editor de Apps Script: Configuración del proyecto (el engrane) →
 *      Propiedades de la secuencia de comandos → agrega dos propiedades:
 *        FIREBASE_SA    = el contenido COMPLETO del .json, pegado tal cual
 *        FIREBASE_PROJ  = el ID del proyecto de Firebase
 *      Van en Propiedades y no en el código a propósito: así la credencial no
 *      queda escrita en ningún archivo ni viaja a GitHub.
 *   4. En Firebase: Configuración → Cloud Messaging → Certificados push web.
 *      Copia la clave pública (empieza con B…) al index.html de Or+.
 *
 * QUÉ SE MANDA Y QUÉ NO
 * El texto de un aviso aparece en la pantalla bloqueada del celular, donde
 * lo puede leer cualquiera que lo tenga en la mano. Por eso aquí nunca se
 * mandan calificaciones, faltas ni nada del expediente: solo avisos generales
 * y, cuando es personal, un texto neutro que invita a abrir la app.
 */

var PUSH_H = { dispositivos: 'DispositivosAlumnos' };
var PUSH_COL = { id: 1, nombre: 2, ficha: 3, agregado: 4, ultimo: 5, activo: 6 };

var PUSH_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';


// ═══════════════════ REGISTRO DEL APARATO ═══════════════════
// Solo alumnos identificados. Un invitado no recibe avisos: no sabemos quién
// es, y no vamos a guardar un identificador de su teléfono para averiguarlo.

function alPushRegistrar(p) {
  var s = alSesion_(p);
  var ficha = txt_(p.ficha);
  if (ficha.length < 20) return { ok: false, error: 'Registro inválido.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = pushHoja_();
    var filas = pushFilas_();
    for (var i = 0; i < filas.length; i++) {
      if (txt_(filas[i][PUSH_COL.ficha - 1]) !== ficha) continue;
      sh.getRange(i + 2, PUSH_COL.ultimo).setValue(new Date());
      sh.getRange(i + 2, PUSH_COL.activo).setValue('Sí');
      return { ok: true, nuevo: false };
    }
    sh.appendRow([s.id, s.nombre, ficha, new Date(), new Date(), 'Sí']);
    return { ok: true, nuevo: true };
  } finally { lock.releaseLock(); }
}

/** El alumno apaga los avisos desde la app. */
function alPushBaja(p) {
  var s = alSesion_(p);
  var ficha = txt_(p.ficha);
  var sh = pushHoja_();
  var filas = pushFilas_();
  var n = 0;
  for (var i = 0; i < filas.length; i++) {
    if (txt_(filas[i][PUSH_COL.id - 1]) !== s.id) continue;
    if (ficha && txt_(filas[i][PUSH_COL.ficha - 1]) !== ficha) continue;
    sh.getRange(i + 2, PUSH_COL.activo).setValue('No');
    n++;
  }
  return { ok: true, apagados: n };
}

function pushHoja_() {
  var sh = SS.getSheetByName(PUSH_H.dispositivos);
  if (!sh) throw new Error('Falta la hoja DispositivosAlumnos. Corre pushInstalar.');
  return sh;
}

function pushFilas_() {
  var sh = pushHoja_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
}


// ═══════════════════ AUTENTICACIÓN CON FIREBASE ═══════════════════

function pushConfig_() {
  var raw = props_().getProperty('FIREBASE_SA');
  var proj = txt_(props_().getProperty('FIREBASE_PROJ'));
  if (!raw || !proj) {
    throw new Error('Falta configurar FIREBASE_SA y FIREBASE_PROJ en las ' +
      'Propiedades de la secuencia de comandos.');
  }
  var sa;
  try { sa = JSON.parse(raw); }
  catch (e) { throw new Error('FIREBASE_SA no es un JSON válido.'); }
  if (!sa.client_email || !sa.private_key) {
    throw new Error('El JSON de la cuenta de servicio viene incompleto.');
  }
  return { sa: sa, proyecto: proj };
}

/** Pide un token de acceso a Google firmando un JWT con la cuenta de servicio. */
function pushToken_() {
  var guardado = CacheService.getScriptCache().get('push_token');
  if (guardado) return guardado;

  var cfg = pushConfig_();
  var ahora = Math.floor(Date.now() / 1000);
  var cabeza = { alg: 'RS256', typ: 'JWT' };
  var cuerpo = {
    iss: cfg.sa.client_email,
    scope: PUSH_SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: ahora,
    exp: ahora + 3600
  };

  var sinFirma = pushB64_(JSON.stringify(cabeza)) + '.' + pushB64_(JSON.stringify(cuerpo));
  var firma = Utilities.computeRsaSha256Signature(sinFirma, cfg.sa.private_key);
  var jwt = sinFirma + '.' + pushB64Bytes_(firma);

  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
    muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) {
    throw new Error('Google rechazó la credencial de Firebase: ' + r.getContentText().slice(0, 200));
  }
  var tok = JSON.parse(r.getContentText()).access_token;
  CacheService.getScriptCache().put('push_token', tok, 3000);   // dura 1 hora, guardo 50 min
  return tok;
}

function pushB64_(texto) { return pushB64Bytes_(Utilities.newBlob(texto).getBytes()); }

function pushB64Bytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}


// ═══════════════════ ENVÍO ═══════════════════

/**
 * Manda un aviso a una lista de alumnos.
 * ids vacío o nulo = a todos los que tengan avisos encendidos.
 * Devuelve { enviados, fallidos, limpiados }.
 */
function pushEnviar_(ids, titulo, cuerpo, ruta) {
  var cfg = pushConfig_();
  var token = pushToken_();
  var url = 'https://fcm.googleapis.com/v1/projects/' + cfg.proyecto + '/messages:send';

  var filas = pushFilas_();
  var destinos = [];
  for (var i = 0; i < filas.length; i++) {
    if (txt_(filas[i][PUSH_COL.activo - 1]) === 'No') continue;
    var idA = txt_(filas[i][PUSH_COL.id - 1]);
    if (ids && ids.length && ids.indexOf(idA) < 0) continue;
    var f = txt_(filas[i][PUSH_COL.ficha - 1]);
    if (f) destinos.push({ fila: i + 2, ficha: f });
  }
  if (!destinos.length) return { enviados: 0, fallidos: 0, limpiados: 0 };

  var enviados = 0, fallidos = 0, limpiar = [];
  for (var j = 0; j < destinos.length; j++) {
    // Mensaje de solo datos: la notificación la dibuja el service worker de
    // Or+, no Firebase. Así el aspecto es el de la app y no el genérico.
    var mensaje = {
      message: {
        token: destinos[j].ficha,
        data: {
          titulo: String(titulo || 'Or+'),
          cuerpo: String(cuerpo || ''),
          ruta: String(ruta || '/alumnos/')
        },
        webpush: { headers: { Urgency: 'normal', TTL: '86400' } }
      }
    };
    var r = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify(mensaje),
      muteHttpExceptions: true
    });
    var codigo = r.getResponseCode();
    if (codigo === 200) { enviados++; }
    else {
      fallidos++;
      // 404 y 403 significan que ese teléfono ya no existe o desinstaló la app.
      if (codigo === 404 || codigo === 403) limpiar.push(destinos[j].fila);
    }
  }

  var sh = pushHoja_();
  for (var k = 0; k < limpiar.length; k++) {
    sh.getRange(limpiar[k], PUSH_COL.activo).setValue('No');
  }

  return { enviados: enviados, fallidos: fallidos, limpiados: limpiar.length };
}


// ═══════════════════ DESDE EL MENÚ ═══════════════════

/** Manda el aviso activo más reciente de AvisosAlumnos a todos. */
function pushAvisoMasReciente() {
  var sh = SS.getSheetByName(AL_H.avisos);
  if (!sh || sh.getLastRow() < 2) { pushDecir_('No hay avisos capturados.'); return; }

  var filas = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  var elegido = null;
  for (var i = 0; i < filas.length; i++) {
    if (txt_(filas[i][AL_COL.avisos.activo - 1]) === 'No') continue;
    if (!txt_(filas[i][AL_COL.avisos.titulo - 1])) continue;
    elegido = filas[i];
  }
  if (!elegido) { pushDecir_('No hay ningún aviso activo.'); return; }

  var titulo = txt_(elegido[AL_COL.avisos.titulo - 1]);
  var cuerpo = txt_(elegido[AL_COL.avisos.mensaje - 1]);
  var para = txt_(elegido[AL_COL.avisos.para - 1]);
  var ids = (para && para !== 'Todos') ? [para] : null;

  var r;
  try { r = pushEnviar_(ids, titulo, cuerpo, '/alumnos/'); }
  catch (e) { pushDecir_('No se pudo enviar.\n\n' + e.message); return; }

  pushDecir_('Aviso: ' + titulo + '\n\n' +
    r.enviados + ' entregados, ' + r.fallidos + ' fallidos' +
    (r.limpiados ? ', ' + r.limpiados + ' teléfonos dados de baja porque ya no existen' : '') + '.');
}

/** Prueba de un solo aviso, para ver si la configuración quedó bien. */
function pushPrueba() {
  var r;
  try { r = pushEnviar_(null, 'Or+', 'Prueba de avisos. Si ves esto, ya jala.', '/alumnos/'); }
  catch (e) { pushDecir_('La configuración todavía no está lista.\n\n' + e.message); return; }
  pushDecir_(r.enviados + ' entregados, ' + r.fallidos + ' fallidos.\n\n' +
    (r.enviados ? 'Revisa tu celular.' :
     'Nadie tiene los avisos encendidos todavía. Abre Or+ como alumno y acéptalos.'));
}

function pushDecir_(texto) {
  try { SpreadsheetApp.getUi().alert('Avisos de Or+', texto, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { Logger.log(texto); }
  return texto;
}

function pushInstalar() {
  var enc = ['ID del alumno', 'Nombre', 'Ficha del aparato', 'Agregado', 'Último uso', 'Activo'];
  var sh = SS.getSheetByName(PUSH_H.dispositivos);
  var creada = false;
  if (!sh) { sh = SS.insertSheet(PUSH_H.dispositivos); creada = true; }
  sh.getRange(1, 1, 1, enc.length).setValues([enc])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#29235C');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 120); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 320);
  sh.setColumnWidths(4, 3, 130);
  sh.getRange('C1').setNote('Es el identificador que Firebase le da a ese teléfono. ' +
    'No lo edites a mano. Si un alumno cambia de celular, aparece un renglón nuevo.');

  var falta = [];
  if (!props_().getProperty('FIREBASE_SA')) falta.push('FIREBASE_SA');
  if (!props_().getProperty('FIREBASE_PROJ')) falta.push('FIREBASE_PROJ');

  return pushDecir_((creada ? 'Hoja DispositivosAlumnos creada.' : 'La hoja ya existía.') +
    (falta.length
      ? '\n\nFalta configurar en Propiedades de la secuencia de comandos: ' + falta.join(' y ') + '.'
      : '\n\nLa configuración de Firebase ya está puesta. Corre pushPrueba para probar.'));
}
