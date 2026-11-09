import { Grid } from '../core/grid.js';
import { findPath } from '../core/path.js';
import type { Game } from './loop.js';
import type { HeroIntent } from './seams.js';
import { fueArrastre } from '../orbarak/pantalla.js';

/**
 * Keyboard + pointer input. Produces HeroIntents and feeds them to the Game;
 * the Game (via MechanicsHooks) decides what they do. UI panels attach via
 * the onToggle* callbacks (owned by the UI designer).
 *
 * Keys: arrows / WASD / QEZC = 8-dir move, Space or . = wait, G = pickup,
 * F = search for secrets, M = minimap, I = inventory, > = descend, < = ascend.
 * Tap/click: adjacent enemy = attack, adjacent NPC = talk, stairs underfoot
 * = use, else A* path.
 */
export class InputHandler {
  onToggleMinimap: () => void = () => {};
  onToggleInventory: () => void = () => {};

  private game: Game | null = null;
  private screenToTile: ((sx: number, sy: number) => { x: number; y: number }) | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private detachFns: Array<() => void> = [];

  attach(
    canvas: HTMLCanvasElement,
    screenToTile: (sx: number, sy: number) => { x: number; y: number },
    game: Game,
  ): void {
    this.detach();
    this.canvas = canvas;
    this.screenToTile = screenToTile;
    this.game = game;

    const onKey = (e: KeyboardEvent): void => this.handleKey(e);
    // Al soltar, no al tocar: asi un arrastre para asomarse no manda al heroe
    // a caminar. Shattered hace lo mismo (CellSelector: onSelect va en el
    // PointerEvent de soltar, y no corre si hubo arrastre).
    const onPointer = (e: PointerEvent): void => {
      const t = this.screenToTile;
      const g = this.game;
      if (!t || !g) return;
      if (fueArrastre()) return;
      const tile = t(e.clientX, e.clientY);
      this.handleTileTap(tile.x, tile.y);
    };
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerup', onPointer);
    this.detachFns = [
      () => window.removeEventListener('keydown', onKey),
      () => canvas.removeEventListener('pointerup', onPointer),
    ];
  }

  detach(): void {
    for (const fn of this.detachFns) fn();
    this.detachFns = [];
    this.game = null;
    this.screenToTile = null;
    this.canvas = null;
  }

  handleKey(e: KeyboardEvent): void {
    const game = this.game;
    if (!game || game.gameOver) return;
    const k = e.key;

    const move = DIRS[k.toLowerCase()];
    if (move) {
      e.preventDefault();
      game.queueIntent({ kind: 'move', dx: move[0], dy: move[1] });
      return;
    }
    switch (k) {
      case ' ':
      case '.':
        e.preventDefault();
        game.queueIntent({ kind: 'wait' });
        break;
      case 'g':
      case 'G':
        game.queueIntent({ kind: 'pickup' });
        break;
      case 'f':
      case 'F':
        // Intentional search (Hero.search(true), Hero.java:1295): reveals
        // secret doors within radius 1, costs 2 turns.
        game.queueIntent({ kind: 'search' });
        break;
      case 'm':
      case 'M':
        this.onToggleMinimap();
        break;
      case 'i':
      case 'I':
        this.onToggleInventory();
        break;
      case '>':
        game.queueIntent({ kind: 'descend' });
        break;
      case '<':
        game.queueIntent({ kind: 'ascend' });
        break;
      default:
        break;
    }
  }

  /** Tap/click a tile: attack adjacent mob, use stairs, or path there. */
  handleTileTap(tx: number, ty: number): void {
    const game = this.game;
    if (!game || game.gameOver) return;
    const { level, hero } = game;
    if (!level.inBounds(tx, ty)) return;

    // Tapping the hero waits a turn.
    if (tx === hero.x && ty === hero.y) {
      game.queueIntent({ kind: 'wait' });
      return;
    }

    // Tapping an adjacent mob attacks it — or talks to it when it is an NPC
    // (vanilla Hero.actInteract: adjacent taps on talkable NPCs talk).
    const mob = level.mobAt(tx, ty);
    if (mob && Grid.chebyshev(tx, ty, hero.x, hero.y) === 1) {
      const live = game.mobs.find((m) => m.id === mob.id);
      if (live) {
        if (typeof live.onTalk === 'function') {
          game.queueIntent({ kind: 'talk', targetId: live.id } satisfies HeroIntent);
        } else {
          game.queueIntent({ kind: 'attack', targetId: live.id } satisfies HeroIntent);
        }
      }
      return;
    }

    // Tapping stairs while standing on them uses them.
    const here = level.idx(hero.x, hero.y);
    const tapped = level.idx(tx, ty);

    // Tocar algo tirado lo recoge. Regla de Shattered (Hero.java:1967-1971):
    // si ya estas encima, siempre; si no, solo cuando no hay enemigos a la
    // vista, para no perder un turno agachandote en plena pelea.
    const algoAhi = level.items.some((it) => it.pos === tapped);
    const enemigosALaVista = game.mobs.some(
      (m) => m.hostile && level.visible[level.idx(m.x, m.y)] === 1,
    );
    if (algoAhi && tapped === here) {
      game.queueIntent({ kind: 'pickup' });
      return;
    }
    // Tocar una escalera, aunque este lejos, es "usa esa escalera": el heroe
    // camina y la usa al llegar (Hero.handle -> HeroAction.LvlTransition,
    // Hero.java:1992-1999). Con enemigos a la vista no se activa sola, salvo
    // que ya estes encima, igual que alla.
    const escalera: HeroIntent | null =
      tapped === level.stairsDown
        ? { kind: 'descend' }
        : tapped === level.stairsUp
          ? { kind: 'ascend' }
          : null;
    if (escalera !== null && (!enemigosALaVista || tapped === here)) {
      if (tapped === here) {
        game.queueIntent(escalera);
        return;
      }
      const camino = findPath(
        level,
        (x, y) => level.isPassable(x, y) && !level.mobAt(x, y),
        hero.x,
        hero.y,
        tx,
        ty,
      );
      if (camino && camino.length > 0) {
        game.setPath(camino, escalera);
        return;
      }
    }

    const hayAlgo = algoAhi && !enemigosALaVista ? ({ kind: 'pickup' } as HeroIntent) : null;

    // Otherwise: A* tap-to-move, one step per hero turn.
    const path = findPath(
      level,
      (x, y) => level.isPassable(x, y) && !level.mobAt(x, y),
      hero.x,
      hero.y,
      tx,
      ty,
    );
    if (!path || path.length === 0) {
      if (tx !== hero.x || ty !== hero.y) game.logMsg('No route there.');
      game.cancelPath();
      return;
    }
    game.setPath(path, hayAlgo);
  }
}

/** Key -> [dx, dy]. Lowercased before lookup. */
const DIRS: Record<string, [number, number]> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
  q: [-1, -1],
  e: [1, -1],
  z: [-1, 1],
  c: [1, 1],
};
