import { ART_PX, PALETTE, REGION_TINTS, SPRITES } from '../assets/sprites.js';
import { ORIGINAL_SPRITES } from '../assets/original_sprites.js';
import { WATER_SPRITES } from '../assets/water_sprites.js';
import { Terrain, regionForDepth, type Region } from '../core/grid.js';
import type { Level } from '../dungeon/level.js';
import type { Game } from './loop.js';
import { posSuave, pasoDe, limpiaSalvo } from '../orbarak/suave.js';

/** Rendered tile size: 3x of the 16px art (SPEC). */
export const TILE_PX = 48;

/**
 * Cuanto acercar, con la cuenta de Shattered (PixelScene.updateCamera).
 *
 * La pantalla, medida en pixeles de juego, no puede quedar mas angosta que
 * 135 ni mas baja que 225 de pie (240 x 160 acostada). De ahi sale el
 * acercamiento maximo; el de arranque es 2.5 veces la densidad, recortado
 * entre 2 y ese maximo. El jugador lo puede mover entre 1 y el doble.
 */
export function acercamientoBase(
  anchoFisico: number,
  altoFisico: number,
  densidad: number,
): number {
  const acostada = anchoFisico > altoFisico;
  const minAncho = acostada ? 240 : 135;
  const minAlto = acostada ? 160 : 225;
  const tope = Math.max(2, Math.floor(Math.min(anchoFisico / minAncho, altoFisico / minAlto)));
  return Math.max(2, Math.min(Math.ceil(densidad * 2.5), tope));
}

/** Chars with per-region overrides in REGION_TINTS. */
const TINTABLE = new Set(['F', 'f', 'W', 'w']);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * Synthesized magenta/black "missing sprite" marker (16x16 char grid).
 * Used when a sprite key is absent from the atlas — never touches art files.
 */
function missingSpriteRows(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < ART_PX; y++) {
    let row = '';
    for (let x = 0; x < ART_PX; x++) row += (x + y) % 2 === 0 ? 'M' : 'k';
    rows.push(row);
  }
  return rows;
}

/**
 * Vanilla camera geometry (exact-copy port of noosa Camera.main behavior):
 * GameScene.java:125 `Camera.main.zoom( defaultZoom + PixelDungeon.zoom() )`
 * on a FULL-SCREEN camera (PixelScene resets Camera.main to a fullscreen
 * PixelCamera; the HUD gets a separate fullscreen uiCamera), and
 * GameScene.java:289 `Camera.main.target = hero`. noosa's Camera.update()
 * centers exactly on the target every frame via focusOn — there is no
 * fixed sub-rectangle viewport and no clamping to level bounds anywhere
 * (verified: zero camera-bounds code in game source, no bounds fields in
 * noosa Camera). Near map edges the original shows black void beyond the
 * boundary, so camX/camY are NEVER clamped; only the tile INDEX range is
 * clamped for array safety.
 *
 * Pure + exported so the geometry is unit-testable (regression: full-window
 * camera coverage, exact hero centering, no clamping).
 */
export interface CameraRect {
  /** Camera top-left in tile units (fractional for smooth centering). */
  camX: number;
  camY: number;
  /** Tile indices the renderer draws (level-clamped for array safety). */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Que cuenta como tierra al orillar el agua.
 *
 * Es la lista de Shattered tal cual (DungeonTileSheet.waterStitcheable):
 * piso, pasto, escaleras, brasas, barricada, trampas, pozo, estatua,
 * alquimia y puertas. Lo que no esta aqui -pared, abismo, mas agua, puerta
 * secreta, muebles- no lleva orilla: el agua llega hasta el borde.
 */
const ORILLABLE = new Set<Terrain>([
  Terrain.FLOOR,
  Terrain.GRASS,
  Terrain.HIGH_GRASS,
  Terrain.ENTRANCE,
  Terrain.EXIT,
  Terrain.EMBERS,
  Terrain.BARRICADE,
  Terrain.WELL,
  Terrain.ALCHEMY,
  Terrain.STATUE,
  Terrain.TRAP_INACTIVE,
  Terrain.DOOR,
  Terrain.OPEN_DOOR,
  Terrain.DOOR_LOCKED,
  Terrain.EXIT_LOCKED,
  Terrain.TRAP_TOXIC,
  Terrain.TRAP_TOXIC_HIDDEN,
  Terrain.TRAP_FIRE,
  Terrain.TRAP_FIRE_HIDDEN,
  Terrain.TRAP_PARALYTIC,
  Terrain.TRAP_PARALYTIC_HIDDEN,
  Terrain.TRAP_POISON,
  Terrain.TRAP_POISON_HIDDEN,
  Terrain.TRAP_ALARM,
  Terrain.TRAP_ALARM_HIDDEN,
  Terrain.TRAP_LIGHTNING,
  Terrain.TRAP_LIGHTNING_HIDDEN,
  Terrain.TRAP_GRIPPING,
  Terrain.TRAP_GRIPPING_HIDDEN,
  Terrain.TRAP_SUMMONING,
  Terrain.TRAP_SUMMONING_HIDDEN,
]);

/**
 * Cual de los 16 dibujos del agua va en esta casilla.
 * stitchWaterTile: +1 arriba, +2 derecha, +4 abajo, +8 izquierda.
 */
export function orillaDelAgua(level: Level, x: number, y: number): number {
  return (
    (ORILLABLE.has(level.get(x, y - 1)) ? 1 : 0) +
    (ORILLABLE.has(level.get(x + 1, y)) ? 2 : 0) +
    (ORILLABLE.has(level.get(x, y + 1)) ? 4 : 0) +
    (ORILLABLE.has(level.get(x - 1, y)) ? 8 : 0)
  );
}

export function cameraTileRect(
  heroX: number,
  heroY: number,
  vw: number,
  vh: number,
  levelW: number,
  levelH: number,
  tilePx: number = TILE_PX,
): CameraRect {
  const viewTilesW = vw / tilePx;
  const viewTilesH = vh / tilePx;
  const camX = heroX + 0.5 - viewTilesW / 2;
  const camY = heroY + 0.5 - viewTilesH / 2;
  return {
    camX,
    camY,
    x0: Math.max(0, Math.floor(camX)),
    y0: Math.max(0, Math.floor(camY)),
    x1: Math.min(levelW - 1, Math.ceil(camX + viewTilesW)),
    y1: Math.min(levelH - 1, Math.ceil(camY + viewTilesH)),
  };
}

/**
 * Canvas 2D renderer + camera. Draws tiles from the sprite atlas
 * (SPEC contract §2 format), entities, FOV/explored dimming.
 * UI screens (HUD, inventory, minimap) are the UI designer's; this only
 * paints the dungeon view.
 */
export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  /** Prerendered 48px sprites: key `${region}:${name}` for tinted tiles. */
  private readonly cache = new Map<string, HTMLCanvasElement>();
  /** Camera top-left in tile units (fractional for smooth centering). */
  private camX = 0;
  private camY = 0;
  private dpr = 1;
  /** Acercamiento actual, en pixeles de arte por casilla, y sus topes. */
  private acercamiento = 3;
  private acercamientoMin = 1;
  private acercamientoMax = 6;

  /** Pixeles de pantalla (CSS) que mide una casilla ahora mismo. */
  get tile(): number {
    return (ART_PX * this.acercamiento) / this.dpr;
  }

  get acercamientoActual(): number {
    return this.acercamiento;
  }

  get acercamientoTopes(): [number, number] {
    return [this.acercamientoMin, this.acercamientoMax];
  }

  /** Cambia el acercamiento dentro de sus topes. Devuelve true si cambio. */
  acerca(nuevo: number): boolean {
    const v = Math.max(this.acercamientoMin, Math.min(this.acercamientoMax, Math.round(nuevo)));
    if (v === this.acercamiento) return false;
    this.acercamiento = v;
    this.cache.clear(); // los dibujos vienen precocinados a un tamano
    return true;
  }

  /** Recalcula el acercamiento de arranque para la pantalla de ahora. */
  private baseCalculada = false;

  private recalculaAcercamiento(): void {
    const base = acercamientoBase(this.canvas.width, this.canvas.height, this.dpr);
    this.acercamientoMin = 1;
    this.acercamientoMax = base * 2;
    // La primera vez se toma el de arranque; despues solo se recorta, para
    // no pisar lo que el jugador haya escogido con los dedos.
    if (!this.baseCalculada) {
      this.baseCalculada = true;
      this.acercamiento = base;
      this.cache.clear();
    } else if (this.acercamiento < this.acercamientoMin || this.acercamiento > this.acercamientoMax) {
      this.acercamiento = Math.max(this.acercamientoMin, Math.min(this.acercamientoMax, this.acercamiento));
      this.cache.clear();
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Renderer: 2d context unavailable');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.recalculaAcercamiento();
  }

  /**
   * Reconcile the canvas backing store with its CSS size.
   * Called every frame by the UI loop (public so screens/HUD share it).
   * Sizing established once (constructor / window resize) can go stale:
   * construction before first layout, DPR changes without a resize event
   * (dragging the window across monitors, some browser zooms), or CSS
   * changes. A stale backing store makes the dungeon paint a small region
   * while UI laid out in CSS pixels spans the full window — so re-derive
   * it here, the single source of truth for canvas geometry.
   */
  syncSize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round((this.canvas.clientWidth || window.innerWidth) * dpr);
    const h = Math.round((this.canvas.clientHeight || window.innerHeight) * dpr);
    if (w !== this.canvas.width || h !== this.canvas.height || dpr !== this.dpr) {
      this.dpr = dpr;
      this.canvas.width = w;
      this.canvas.height = h;
      // El lienzo todavia no tiene tamano cuando se construye el
      // renderizador, asi que el acercamiento hay que rehacerlo aqui, la
      // primera vez que se sabe de verdad cuanta pantalla hay.
      this.recalculaAcercamiento();
    }
  }

  /** CSS-pixel size of the drawing surface (single source for UI layout). */
  viewSize(): { w: number; h: number } {
    return { w: this.canvas.width / this.dpr, h: this.canvas.height / this.dpr };
  }

  /** Current device pixel ratio applied to the canvas transform. */
  pixelRatio(): number {
    return this.dpr;
  }

  /** Convert a CSS-pixel screen point to a tile coordinate. */
  screenToTile(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const px = sx - rect.left;
    const py = sy - rect.top;
    return {
      x: Math.floor(this.camX + px / this.tile),
      y: Math.floor(this.camY + py / this.tile),
    };
  }

  /** CSS-pixel center of a tile (inverse of screenToTile; for UI overlays). */
  tileToScreen(tx: number, ty: number): { x: number; y: number } {
    return {
      x: (tx + 0.5 - this.camX) * this.tile,
      y: (ty + 0.5 - this.camY) * this.tile,
    };
  }

  render(game: Game): void {
    const { ctx } = this;
    this.syncSize();
    const { w: vw, h: vh } = this.viewSize();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const level = game.level;
    const heroePaso = pasoDe('heroe', game.hero.x, game.hero.y);
    const heroeVis = { x: heroePaso.x, y: heroePaso.y };
    const cam = cameraTileRect(heroeVis.x, heroeVis.y, vw, vh, level.w, level.h, this.tile);
    this.camX = cam.camX;
    this.camY = cam.camY;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, vw, vh);

    const { x0, y0, x1, y1 } = cam;

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = level.idx(x, y);
        const dx = (x - this.camX) * this.tile;
        const dy = (y - this.camY) * this.tile;
        if (!level.explored[i]) {
          ctx.fillStyle = '#000';
          ctx.fillRect(dx, dy, this.tile, this.tile);
          continue;
        }
        const seen = level.visible[i] === 1;
        ctx.globalAlpha = seen ? 1 : 0.45;
        const sprite = this.tileSprite(level, x, y);
        ctx.drawImage(sprite, dx, dy, this.tile, this.tile);
        ctx.globalAlpha = 1;
      }
    }

    // Items (shown on explored tiles, dimmed outside FOV).
    for (const item of level.items) {
      const i = item.pos;
      if (!level.explored[i]) continue;
      const x = i % level.w;
      const y = Math.floor(i / level.w);
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      ctx.globalAlpha = level.visible[i] ? 1 : 0.45;
      ctx.drawImage(
        this.entitySprite(item.sprite),
        (x - this.camX) * this.tile,
        (y - this.camY) * this.tile,
        this.tile,
        this.tile,
      );
      ctx.globalAlpha = 1;
    }

    // Mobs (only when actually visible).
    const vivos = new Set<string>(['heroe']);
    for (const m of game.mobs) {
      const i = level.idx(m.x, m.y);
      const id = 'm' + (m.id ?? m.sprite + ':' + i);
      vivos.add(id);
      if (!level.visible[i]) continue;
      const v = posSuave(id, m.x, m.y);
      ctx.drawImage(
        this.entitySprite(m.sprite),
        (v.x - this.camX) * this.tile,
        (v.y - this.camY) * this.tile,
        this.tile,
        this.tile,
      );
    }
    limpiaSalvo(vivos);

    // Tap-to-move path preview.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (const p of game.currentPath) {
      const i = level.idx(p.x, p.y);
      if (!level.visible[i]) continue;
      const cx = (p.x - this.camX) * this.tile + this.tile / 2;
      const cy = (p.y - this.camY) * this.tile + this.tile / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hero: cuadro de caminata mientras se mueve, y volteado hacia donde va.
    const hx = (heroeVis.x - this.camX) * this.tile;
    const hy = (heroeVis.y - this.camY) * this.tile;
    const cuadro = heroePaso.caminando
      ? 'hero_run' + heroePaso.cuadro
      : game.hero.sprite;
    const dibujo = this.entitySprite(cuadro);
    if (heroePaso.mira < 0) {
      ctx.save();
      ctx.translate(hx + this.tile, hy);
      ctx.scale(-1, 1);
      ctx.drawImage(dibujo, 0, 0, this.tile, this.tile);
      ctx.restore();
    } else {
      ctx.drawImage(dibujo, hx, hy, this.tile, this.tile);
    }
  }

  /** Sprite for a terrain cell (hidden traps/doors render as their cover). */
  private tileSprite(level: Level, x: number, y: number): HTMLCanvasElement {
    const t = level.get(x, y);
    const region = regionForDepth(level.depth);
    let name: string;
    switch (t) {
      case Terrain.WALL:
      case Terrain.BARRICADE:
        name = 'wall';
        break;
      case Terrain.DOOR_SECRET:
        name = 'door_secret';
        break;
      case Terrain.FLOOR:
      case Terrain.WALKWAY:
        name = (x * 7 + y * 13) % 3 === 0 ? 'floor1' : 'floor0';
        break;
      case Terrain.TRAP_INACTIVE:
        name = 'trap_inactive'; // Terrain.INACTIVE_TRAP tile 23: visible, inert
        break;
      case Terrain.EMBERS:
        name = 'embers';
        break;
      case Terrain.DOOR:
        name = 'door';
        break;
      case Terrain.DOOR_LOCKED:
        name = 'door_locked';
        break;
      case Terrain.ENTRANCE:
        name = 'stairs_up';
        break;
      case Terrain.EXIT:
      case Terrain.EXIT_LOCKED:
        name = 'stairs_down';
        break;
      case Terrain.WATER:
        // Shattered no pinta el agua cuadrada: escoge entre 16 dibujos segun
        // que vecinos son tierra, y asi la orilla queda redondeada
        // (DungeonTerrainTilemap.getTileVisual -> stitchWaterTile).
        name = 'water_' + orillaDelAgua(level, x, y);
        break;
      case Terrain.GRASS:
        name = 'grass';
        break;
      case Terrain.HIGH_GRASS:
        name = 'high_grass'; // Terrain.HIGH_GRASS tile 15
        break;
      case Terrain.CHASM:
        name = 'chasm';
        break;
      case Terrain.WELL:
        name = 'well';
        break;
      case Terrain.TRAP_TOXIC:
        name = 'trap_toxic';
        break;
      case Terrain.TRAP_TOXIC_HIDDEN:
        name = 'trap_toxic_secret';
        break;
      case Terrain.TRAP_FIRE:
        name = 'trap_fire';
        break;
      case Terrain.TRAP_FIRE_HIDDEN:
        name = 'trap_fire_secret';
        break;
      case Terrain.TRAP_PARALYTIC:
        name = 'trap_paralytic';
        break;
      case Terrain.TRAP_PARALYTIC_HIDDEN:
        name = 'trap_paralytic_secret';
        break;
      case Terrain.TRAP_POISON:
        name = 'trap_poison';
        break;
      case Terrain.TRAP_POISON_HIDDEN:
        name = 'trap_poison_secret';
        break;
      case Terrain.TRAP_ALARM:
        name = 'trap_alarm';
        break;
      case Terrain.TRAP_ALARM_HIDDEN:
        name = 'trap_alarm_secret';
        break;
      case Terrain.TRAP_LIGHTNING:
        name = 'trap_lightning';
        break;
      case Terrain.TRAP_LIGHTNING_HIDDEN:
        name = 'trap_lightning_secret';
        break;
      case Terrain.TRAP_GRIPPING:
        name = 'trap_gripping';
        break;
      case Terrain.TRAP_GRIPPING_HIDDEN:
        name = 'trap_gripping_secret';
        break;
      case Terrain.TRAP_SUMMONING:
        name = 'trap_summoning';
        break;
      case Terrain.TRAP_SUMMONING_HIDDEN:
        name = 'trap_summoning_secret';
        break;
      // Special-room tiles (indices = original Terrain.java constants).
      case Terrain.ALCHEMY:
        name = 'alchemy';
        break;
      case Terrain.PEDESTAL:
        name = 'pedestal';
        break;
      case Terrain.STATUE:
        name = 'statue';
        break;
      case Terrain.BOOKSHELF:
        name = 'bookshelf';
        break;
      // Chests/tombs/bones are heap sprites in the original (Heap.image ->
      // ItemSpriteSheet), drawn on floor cells; map to the same frames here.
      case Terrain.CHEST:
        name = 'chest';
        break;
      case Terrain.CHEST_LOCKED:
        name = 'chest_locked';
        break;
      case Terrain.TOMB:
        name = 'tomb';
        break;
      default:
        // Unmapped terrain renders as floor.
        name = (x * 7 + y * 13) % 3 === 0 ? 'floor1' : 'floor0';
    }
    return this.getSprite(name, region);
  }

  /** Non-tinted sprite for entities (hero, mobs, items). */
  entitySprite(name: string): HTMLCanvasElement {
    return this.getSprite(name, undefined);
  }

  private getSprite(name: string, region: Region | undefined): HTMLCanvasElement {
    const key = `${region ?? '-'}:${name}`;
    let c = this.cache.get(key);
    if (!c) {
      c = this.prerender(name, region);
      this.cache.set(key, c);
    }
    return c;
  }

  private prerender(name: string, region: Region | undefined): HTMLCanvasElement {
    // Original Watabou sprites (GPL-3.0): embedded RGBA, decoded
    // synchronously — no async image loading, no palette remap. These are
    // pre-colored, so region tinting does not apply to them.
    const orig = ORIGINAL_SPRITES[name] ?? WATER_SPRITES[name];
    if (orig) {
      const bin = atob(orig.rgba);
      const bytes = new Uint8ClampedArray(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const img = document.createElement('canvas');
      img.width = orig.w;
      img.height = orig.h;
      const g = img.getContext('2d')!;
      g.putImageData(new ImageData(bytes, orig.w, orig.h), 0, 0);
      return this.scaleUp(img);
    }
    const rows = SPRITES[name] ?? missingSpriteRows();
    // Per-region char overrides (art director's REGION_TINTS table).
    const overrides = region ? REGION_TINTS[region] : undefined;
    const img = document.createElement('canvas');
    img.width = ART_PX;
    img.height = ART_PX;
    const g = img.getContext('2d')!;
    const data = g.createImageData(ART_PX, ART_PX);
    for (let y = 0; y < ART_PX; y++) {
      const row = rows[y]!;
      for (let x = 0; x < ART_PX; x++) {
        const ch = row[x]!;
        const o = (y * ART_PX + x) * 4;
        if (ch === '.') {
          data.data[o + 3] = 0;
          continue;
        }
        let hex = PALETTE[ch] ?? '#ff00ff';
        if (overrides && TINTABLE.has(ch)) hex = overrides[ch] ?? hex;
        const rgb = hexToRgb(hex);
        data.data[o] = rgb[0];
        data.data[o + 1] = rgb[1];
        data.data[o + 2] = rgb[2];
        data.data[o + 3] = 255;
      }
    }
    g.putImageData(data, 0, 0);
    return this.scaleUp(img);
  }

  /** Scale a sprite canvas up to render size with smoothing off (crisp pixels). */
  private scaleUp(img: HTMLCanvasElement): HTMLCanvasElement {
    // Se precocina en pixeles fisicos (16 x acercamiento), que siempre es
    // entero. Si se hiciera en pixeles CSS, con densidad 3 saldria 42.67 y
    // el reescalado dejaria el dibujo despintado.
    const lado = ART_PX * this.acercamiento;
    const big = document.createElement('canvas');
    big.width = lado;
    big.height = lado;
    const bg = big.getContext('2d')!;
    bg.imageSmoothingEnabled = false;
    bg.drawImage(img, 0, 0, lado, lado);
    return big;
  }
}
