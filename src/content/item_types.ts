/**
 * Shared item catalog types.
 *
 * Kept in a leaf module so potion_defs / scroll_defs can describe catalog
 * entries without importing items.ts (which pulls in those defs and would
 * form a circular init cycle under Bun's test runner).
 */
import type { ArmorDef, WeaponDef } from '../mechanics/char.js';

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'missile'
  | 'potion'
  | 'food'
  | 'scroll'
  | 'gold'
  | 'key'
  | 'dewdrop'
  | 'seed'
  | 'bag'
  | 'misc'
  | 'quest'
  | 'wand'
  | 'ring';

export interface ItemDef {
  /** Catalog id. Gold drops encode the amount as `gold:<n>` (see Gold below). */
  id: string;
  name: string;
  /** Key into the art director's SPRITES atlas. */
  sprite: string;
  type: ItemType;
  /** Stacks merge in the inventory (Item.stackable). */
  stackable: boolean;
  desc: string;
  /** Melee stats (type 'weapon'). */
  weapon?: WeaponDef;
  /** Armor stats (type 'armor'). */
  armor?: ArmorDef;
  /** Hunger energy restored (type 'food'; Food.energy, Food.java:41). */
  energy?: number;
  /**
   * Shop price in gold (Item.price() in vanilla; STAGE 1: populated for the
   * shop system — the hero SELLS at price() and BUYS shop stock at
   * price()*5*(depth/5+1) per WndTradeItem.java:168-199.
   */
  price?: number;
}
