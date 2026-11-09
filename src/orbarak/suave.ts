/**
 * Movimiento suave.
 *
 * El juego piensa en casillas enteras, pero si lo dibujas así el personaje
 * brinca de casilla en casilla y se ve pésimo. Aquí se guarda, para cada
 * quien, de dónde venía y a dónde va, y se devuelve la posición de en medio
 * según el tiempo que lleve el paso. El original hace lo mismo
 * (CharSprite.move -> posTweener, Char.java / CharSprite.java).
 *
 * No toca la lógica: sólo el dibujo.
 */

/**
 * Cuánto dura un paso. Shattered usa CharSprite.DEFAULT_MOVE_INTERVAL = 0.1 s
 * (CharSprite.java:72) con un PosTweener, que interpola en línea recta.
 */
const PASO_MS = 100;

/** Cuadros por segundo de la caminata: HeroSprite.RUN_FRAMERATE = 20. */
export const CUADROS_POR_SEG = 20;
export const CUADROS_CAMINATA = 6;

interface Rastro {
  deX: number;
  deY: number;
  aX: number;
  aY: number;
  inicio: number;
  mira: number;      // 1 derecha, -1 izquierda
}

const rastros = new Map<string, Rastro>();

function ahora(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Dónde dibujar a alguien que la lógica pone en (x, y).
 * La primera vez aparece de golpe; de ahí en adelante se desliza.
 */
export function posSuave(id: string, x: number, y: number): { x: number; y: number } {
  const t = ahora();
  const r = rastros.get(id);

  if (r === undefined) {
    rastros.set(id, { deX: x, deY: y, aX: x, aY: y, inicio: t - PASO_MS, mira: 1 });
    return { x, y };
  }

  if (r.aX !== x || r.aY !== y) {
    // cambió de casilla: el paso nuevo arranca donde se haya quedado el dibujo
    const p = avance(r, t);
    r.deX = r.deX + (r.aX - r.deX) * p;
    r.deY = r.deY + (r.aY - r.deY) * p;
    if (x !== r.aX) r.mira = x > r.aX ? 1 : -1;
    r.aX = x;
    r.aY = y;
    r.inicio = t;

    // Un salto largo no es caminar: es una escalera, un teletransporte o un
    // piso nuevo. Esos no se deslizan, aparecen.
    if (Math.abs(r.deX - x) > 1.6 || Math.abs(r.deY - y) > 1.6) {
      r.deX = x;
      r.deY = y;
    }
  }

  const p = avance(r, t);
  return {
    x: r.deX + (r.aX - r.deX) * p,
    y: r.deY + (r.aY - r.deY) * p,
  };
}

/** De 0 a 1, en línea recta: PosTweener no suaviza las orillas. */
function avance(r: Rastro, t: number): number {
  return Math.min(1, Math.max(0, (t - r.inicio) / PASO_MS));
}

/** Al cambiar de piso nadie se desliza: todos aparecen donde les toca. */
export function olvidaTodo(): void {
  rastros.clear();
}

/** Para que no se acumulen los que ya murieron. */
export function olvida(id: string): void {
  rastros.delete(id);
}

export function limpiaSalvo(vivos: Set<string>): void {
  for (const id of rastros.keys()) {
    if (!vivos.has(id)) rastros.delete(id);
  }
}

/**
 * Todo lo que el dibujo necesita de alguien: dónde va, si está caminando,
 * y para qué lado mira.
 */
export function pasoDe(id: string, x: number, y: number): {
  x: number; y: number; caminando: boolean; mira: number; avance: number; cuadro: number;
} {
  const v = posSuave(id, x, y);
  const r = rastros.get(id);
  if (r === undefined) return { ...v, caminando: false, mira: 1, avance: 1, cuadro: 0 };
  const t = ahora();
  const p = avance(r, t);
  const quieto = r.deX === r.aX && r.deY === r.aY;
  // Entre paso y paso hay un hueco: el deslizamiento dura 100 ms pero el turno
  // siguiente tarda un poco mas en resolverse. Si en ese hueco se volviera a
  // la pose quieta, el monito parpadearia en cada paso. Shattered no lo hace:
  // la animacion de caminar sigue corriendo y solo se corta cuando de verdad
  // se detiene (CharSprite.update: vuelve a idle al terminar de moverse, y el
  // siguiente paso entra sin soltar la animacion). Se le da ese respiro.
  const GRACIA = PASO_MS * 1.6;
  const andando = !quieto && t - r.inicio < GRACIA;
  // La caminata corre con su propio reloj a 20 cuadros por segundo y no se
  // reinicia en cada paso, igual que la Animation de Shattered.
  const cuadro = Math.floor((t / 1000) * CUADROS_POR_SEG) % CUADROS_CAMINATA;
  return { x: v.x, y: v.y, caminando: andando, mira: r.mira, avance: p, cuadro };
}
