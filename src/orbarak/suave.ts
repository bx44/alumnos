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

/** Cuánto dura un paso, en milisegundos. El original usa 0.1 s. */
const PASO_MS = 110;

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

/** De 0 a 1, con las orillas suavizadas para que no arranque ni frene de golpe. */
function avance(r: Rastro, t: number): number {
  const bruto = Math.min(1, Math.max(0, (t - r.inicio) / PASO_MS));
  return bruto * bruto * (3 - 2 * bruto);
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
  x: number; y: number; caminando: boolean; mira: number; avance: number;
} {
  const v = posSuave(id, x, y);
  const r = rastros.get(id);
  if (r === undefined) return { ...v, caminando: false, mira: 1, avance: 1 };
  const p = avance(r, ahora());
  const quieto = r.deX === r.aX && r.deY === r.aY;
  return { x: v.x, y: v.y, caminando: !quieto && p < 1, mira: r.mira, avance: p };
}
