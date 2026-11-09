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

/** Dos dedos para acercar, rueda del ratón también. */
export function conectaAcercamiento(
  lienzo: HTMLCanvasElement,
  r: Acercador,
  alCambiar: () => void,
): () => void {
  let distanciaInicial = 0;
  let acercamientoInicial = 0;

  const distancia = (t: TouchList): number => {
    const a = t[0], b = t[1];
    if (!a || !b) return 0;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const inicio = (e: TouchEvent): void => {
    if (e.touches.length !== 2) return;
    distanciaInicial = distancia(e.touches);
    acercamientoInicial = r.acercamientoActual;
    e.preventDefault();
  };

  const mueve = (e: TouchEvent): void => {
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

const ESTILO = `
#pd-completa{position:fixed;top:calc(4px + env(safe-area-inset-top));
  right:calc(4px + env(safe-area-inset-right));z-index:50;width:30px;height:30px;
  display:grid;place-items:center;border:0;border-radius:8px;cursor:pointer;
  background:rgba(12,10,20,.45);color:#E8D7A8;font-size:15px;line-height:1;
  font-family:system-ui,sans-serif;opacity:.55;padding:0}
#pd-completa:hover,#pd-completa:active{opacity:1}
`;

function enPantallaCompleta(): boolean {
  return document.fullscreenElement !== null;
}

/**
 * Pone el botón de pantalla completa. Si el navegador no la permite —en el
 * iPhone, Safari no deja pantalla completa en páginas— no pone nada, para
 * no dejar un botón que no hace nada.
 */
export function ponBotonPantallaCompleta(): void {
  const raiz = document.documentElement;
  const puede =
    typeof raiz.requestFullscreen === 'function' &&
    (document.fullscreenEnabled ?? false);
  if (!puede) return;
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
    if (enPantallaCompleta()) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void raiz.requestFullscreen().catch(() => {});
    }
  });
  document.addEventListener('fullscreenchange', () => {
    b.textContent = enPantallaCompleta() ? '⤡' : '⛶';
    b.title = enPantallaCompleta() ? 'Salir de pantalla completa' : 'Pantalla completa';
  });
  document.body.appendChild(b);
}
