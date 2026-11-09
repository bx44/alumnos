/**
 * Acercar con los dedos, y pantalla completa.
 *
 * Shattered deja acercar y alejar con dos dedos y guarda el acercamiento
 * entre partidas (PixelScene.updateCamera + SPDSettings.scale), con topes
 * de 1 al doble del de arranque. Aquí va lo mismo, más un botón de pantalla
 * completa, que en el celular es lo que quita la barra del navegador.
 *
 * Vive aparte del resto del juego: solo necesita el lienzo y saber acercar.
 */

export interface Acercador {
  acercamientoActual: number;
  acercamientoTopes: [number, number];
  acerca(nuevo: number): boolean;
  /** Pixeles de pantalla que mide una casilla ahora. */
  readonly tile: number;
  corre(dxPx: number, dyPx: number, nivel: { w: number; h: number }): void;
}

/**
 * Si el ultimo toque fue un arrastre, no es un toque.
 *
 * Shattered lo separa igual (CellSelector: si te pasas del umbral, `dragging`
 * se prende y onSelect ya no corre), para que asomarse no mande al heroe a
 * caminar hasta donde quedo el dedo.
 */
let arrastro = false;
export function fueArrastre(): boolean {
  return arrastro;
}

const LLAVE_ZOOM = 'pardes-acercamiento';

export function acercamientoGuardado(): number | null {
  try {
    const v = localStorage.getItem(LLAVE_ZOOM);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function guardaAcercamiento(v: number): void {
  try {
    localStorage.setItem(LLAVE_ZOOM, String(v));
  } catch {
    // modo privado: se juega igual, nada más no se recuerda
  }
}

/**
 * Dos dedos para acercar, uno para asomarse, rueda del ratón también.
 *
 * `nivel` dice de qué tamaño es el piso de ahora, para no dejar que el dedo
 * se lleve la cámara al vacío.
 */
export function conectaAcercamiento(
  lienzo: HTMLCanvasElement,
  r: Acercador,
  alCambiar: () => void,
  nivel: () => { w: number; h: number },
): () => void {
  let distanciaInicial = 0;
  let acercamientoInicial = 0;
  // un dedo: asomarse
  let dedoX = 0;
  let dedoY = 0;
  let partidaX = 0;
  let partidaY = 0;
  let corriendo = false;

  const distancia = (t: TouchList): number => {
    const a = t[0], b = t[1];
    if (!a || !b) return 0;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const inicio = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      const t = e.touches[0] as Touch;
      dedoX = partidaX = t.clientX;
      dedoY = partidaY = t.clientY;
      corriendo = false;
      arrastro = false;
      return;
    }
    if (e.touches.length !== 2) return;
    distanciaInicial = distancia(e.touches);
    acercamientoInicial = r.acercamientoActual;
    e.preventDefault();
  };

  const mueve = (e: TouchEvent): void => {
    // Un dedo: correr la cámara. No arranca hasta pasar media casilla, que es
    // el umbral de Shattered (CellSelector: defaultZoom * SIZE / 2).
    if (e.touches.length === 1 && distanciaInicial === 0) {
      const t = e.touches[0] as Touch;
      if (!corriendo) {
        const d = Math.hypot(t.clientX - partidaX, t.clientY - partidaY);
        if (d <= r.tile / 2) return;
        corriendo = true;
        arrastro = true;
        dedoX = t.clientX;
        dedoY = t.clientY;
      }
      e.preventDefault();
      r.corre(t.clientX - dedoX, t.clientY - dedoY, nivel());
      dedoX = t.clientX;
      dedoY = t.clientY;
      alCambiar();
      return;
    }
    if (e.touches.length !== 2 || distanciaInicial === 0) return;
    e.preventDefault();
    const razon = distancia(e.touches) / distanciaInicial;
    if (r.acerca(acercamientoInicial * razon)) {
      guardaAcercamiento(r.acercamientoActual);
      alCambiar();
    }
  };

  const fin = (e: TouchEvent): void => {
    if (e.touches.length < 2) distanciaInicial = 0;
    if (e.touches.length === 0) corriendo = false;
  };

  const rueda = (e: WheelEvent): void => {
    e.preventDefault();
    if (r.acerca(r.acercamientoActual + (e.deltaY < 0 ? 1 : -1))) {
      guardaAcercamiento(r.acercamientoActual);
      alCambiar();
    }
  };

  lienzo.addEventListener('touchstart', inicio, { passive: false });
  lienzo.addEventListener('touchmove', mueve, { passive: false });
  lienzo.addEventListener('touchend', fin);
  lienzo.addEventListener('touchcancel', fin);
  lienzo.addEventListener('wheel', rueda, { passive: false });

  return () => {
    lienzo.removeEventListener('touchstart', inicio);
    lienzo.removeEventListener('touchmove', mueve);
    lienzo.removeEventListener('touchend', fin);
    lienzo.removeEventListener('touchcancel', fin);
    lienzo.removeEventListener('wheel', rueda);
  };
}

/* ─────────────────────── pantalla completa ─────────────────────── */

/** Un recado corto encima del juego, para lo que el botón no puede hacer. */
function avisa(texto: string): void {
  const viejo = document.getElementById('pd-aviso');
  if (viejo !== null) viejo.remove();
  const d = document.createElement('div');
  d.id = 'pd-aviso';
  d.textContent = texto;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 6000);
  d.addEventListener('click', () => d.remove());
}

const ESTILO = `
#pd-aviso{position:fixed;left:12px;right:12px;top:calc(42px + env(safe-area-inset-top));
  z-index:60;padding:11px 13px;border-radius:10px;background:rgba(12,10,20,.95);
  border:1px solid #3A3558;color:#E8D7A8;font-size:14px;line-height:1.4;
  font-family:system-ui,sans-serif}
#pd-completa{position:fixed;top:calc(4px + env(safe-area-inset-top));
  right:calc(4px + env(safe-area-inset-right));z-index:50;width:30px;height:30px;
  display:grid;place-items:center;border:0;border-radius:8px;cursor:pointer;
  background:rgba(12,10,20,.45);color:#E8D7A8;font-size:15px;line-height:1;
  font-family:system-ui,sans-serif;opacity:.55;padding:0}
#pd-completa:hover,#pd-completa:active{opacity:1}
`;

interface ConWebkit {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  standalone?: boolean;
}

function enPantallaCompleta(): boolean {
  const d = document as Document & ConWebkit;
  return d.fullscreenElement !== null || (d.webkitFullscreenElement ?? null) !== null;
}

/** Ya se abrió desde la pantalla de inicio: no hay barras que quitar. */
function yaSinBarras(): boolean {
  const nav = navigator as Navigator & ConWebkit;
  return (
    nav.standalone === true ||
    (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches)
  );
}

function esIPhone(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Pone el botón de pantalla completa. Si el navegador no la permite —en el
 * iPhone, Safari no deja pantalla completa en páginas— no pone nada, para
 * no dejar un botón que no hace nada.
 */
export function ponBotonPantallaCompleta(): void {
  const raiz = document.documentElement as HTMLElement & ConWebkit;
  const puede =
    (typeof raiz.requestFullscreen === 'function' && (document.fullscreenEnabled ?? false)) ||
    typeof raiz.webkitRequestFullscreen === 'function';
  // Si ya se abrió desde la pantalla de inicio no hay nada que quitar.
  if (yaSinBarras()) return;
  // El iPhone no deja pantalla completa en una página web; el botón diría
  // una mentira. Ahí se avisa cuál es el camino que sí funciona.
  if (!puede && !esIPhone()) return;
  if (document.getElementById('pd-completa') !== null) return;

  const hoja = document.createElement('style');
  hoja.textContent = ESTILO;
  document.head.appendChild(hoja);

  const b = document.createElement('button');
  b.id = 'pd-completa';
  b.type = 'button';
  b.title = 'Pantalla completa';
  b.textContent = '⛶';
  b.addEventListener('click', () => {
    if (!puede) {
      avisa('En iPhone, Safari no deja pantalla completa. Toca Compartir y ' +
            '«Agregar a inicio»: así se abre sin barras.');
      return;
    }
    const d = document as Document & ConWebkit;
    if (enPantallaCompleta()) {
      if (typeof d.exitFullscreen === 'function') void Promise.resolve(d.exitFullscreen()).catch(() => {});
      else d.webkitExitFullscreen?.();
    } else if (typeof raiz.requestFullscreen === 'function') {
      void raiz.requestFullscreen().catch(() => {
        raiz.webkitRequestFullscreen?.();
      });
    } else {
      raiz.webkitRequestFullscreen?.();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    b.textContent = enPantallaCompleta() ? '⤡' : '⛶';
    b.title = enPantallaCompleta() ? 'Salir de pantalla completa' : 'Pantalla completa';
  });
  document.body.appendChild(b);
}
