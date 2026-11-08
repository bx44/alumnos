/**
 * Item catalog — data-driven item definitions for the dungeon.
 *
 * Every def carries Java citations (file + line). Stats mirror the Java item
 * classes exactly; behavior (drink/eat/equip/throw) is implemented in
 * src/content/actions.ts and hooks into src/mechanics/ (combat, hunger).
 *
 * Scope: the Sewer depths 1-4 catalog (+ Goo's skeleton key on depth 5),
 * quest items (Sad Ghost / Wandmaker), and the Stage 1 shop stock
 * (ShopPainter.java): melee tiers 2-5, armor tiers 2-5, bags, weightstone,
 * torch, ankh, shop scrolls, overpriced rations.
 *
 * Prices are vanilla Item.price() for one unit. The port has no
 * identification system, so potions/scrolls always price at the unidentified
 * base (Potion 20, Scroll 15); weapons/armor are identified in shop stock
 * (ShopPainter.java) and price at the tier formula.
 */
import type { ArmorDef, WeaponDef } from '../mechanics/char';
import { SPRITES } from '../assets/sprites';
import { ORIGINAL_SPRITES } from '../assets/original_sprites';
import { POTION_DEFS } from './potions.js';
import { SCROLL_DEFS } from './scrolls.js';
import { HONEYPOT_DEF } from './honeypot.js';
import { WAND_SPECS } from '../mechanics/wands.js';
import { RING_SPECS } from '../mechanics/rings.js';

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

/** DarkGold (DarkGold.java): stackable quest ore, non-upgradable, always
 *  identified; price() = quantity (DarkGold.java:63-65). The blacksmith's
 *  gold variant wants 15 of these plus the pickaxe. */
const DARK_GOLD: ItemDef = {
  id: 'darkgold',
  name: 'mineral de oro oscuro',
  sprite: 'item_darkgold',
  type: 'misc',
  stackable: true,
  desc: 'Un pedazo de mineral de oro oscuro. Al herrero de las cuevas le encanta.',
  price: 1,
};

/** Pickaxe (Pickaxe.java): STR 14, min 3, max 12 (Pickaxe.java:33-35),
 *  non-upgradable, always identified; mines dark gold veins on depths
 *  11-15 and can be blood-stained by killing a bat with it. */
const PICKAXE: ItemDef = {
  id: 'pickaxe',
  name: 'pico',
  sprite: 'item_pickaxe',
  type: 'weapon',
  stackable: false,
  desc: 'Un pico resistente, bueno para sacar vetas de oro oscuro.',
  weapon: {
    name: 'pico',
    tier: 1,
    level: 0,
    min: 3,
    max: 12,
    str: 14,
    acu: 1,
    dly: 1,
    missile: false,
    bloodStained: false,
    upgradable: false, // Pickaxe.isUpgradable (Pickaxe.java:110-112)
  },
  price: 0,
};

/** ShortSword: tier 1 (super(1, 1f, 1f), ShortSword.java:54-55), STR 11
 *  (ShortSword.java:57); min = tier = 1 (MeleeWeapon.java:41-42);
 *  max = max0() = 12 (ShortSword.java:60-62). */
const SHORT_SWORD: ItemDef = {
  id: 'shortsword',
  name: 'espada corta',
  sprite: 'shortsword',
  type: 'weapon',
  stackable: false,
  desc: 'De veras está corta: apenas unos dedos más larga que una daga.',
  weapon: { name: 'espada corta', tier: 1, level: 0, min: 1, max: 12, str: 11, acu: 1, dly: 1, missile: false },
  /** MeleeWeapon.price() = 20 * 2^(tier-1), tier 1 (MeleeWeapon.java). */
  price: 20,
};

/** Dart: min 1 / max 4 (Dart.java:41-46); STR default 10 (Weapon.java:47);
 *  random() quantity 5..15 (Dart.java:77-80). Thrown via MissileWeapon. */
const DART: ItemDef = {
  id: 'dart',
  name: 'dardo',
  sprite: 'dart',
  type: 'missile',
  stackable: true,
  desc: 'Estas puntas de metal están balanceadas para volar derecho con un movimiento de muñeca.',
  weapon: { name: 'dardo', tier: 1, level: 0, min: 1, max: 4, str: 10, acu: 1, dly: 1, missile: true },
  /** Dart.price() = quantity * 2 (Dart.java:64-66) -> 2 per unit. */
  price: 2,
};

/** ClothArmor: tier 1 (ClothArmor.java:30-32); STR = typicalSTR() = 7 + tier*2
 *  = 9 (Armor.java:289-291); DR() = tier * (2 + effectiveLevel()) = 2 at
 *  level 0 (Armor.java:145-147). */
const CLOTH_ARMOR: ItemDef = {
  id: 'cloth_armor',
  name: 'armadura de tela',
  sprite: 'armor_cloth',
  type: 'armor',
  stackable: false,
  desc: 'Esta armadura ligera protege lo básico.',
  armor: { name: 'armadura de tela', level: 0, tier: 1, str: 9, dr: 2 },
  /** Armor.price() = 10 * 2^(tier-1), tier 1 (Armor.java). */
  price: 10,
};

/** PotionOfHealing: apply() heals to full and cures poison
 *  (PotionOfHealing.java:36-45; heal() sets HP = HT and detaches Poison).
 *  M1: cures the M1 poison buff; ooze is NOT cured (vanilla heal() does not
 *  detach Ooze). TIME_TO_DRINK = 1 (Potion.java:53). */
const POTION_HEALING: ItemDef = {
  id: 'potion_healing',
  name: 'poción de curación',
  sprite: 'potion_red',
  type: 'potion',
  stackable: true,
  desc: 'Un elixir que te deja entero al instante y te quita el veneno.',
  /**
   * Unidentified base price: Potion.price() = 20 (Potion.java). The port has
   * no identification system, so isKnown() is never true and price() never
   * reaches the known 30 (PotionOfHealing.java: price = isKnown ? 30 : 20).
   * Shop stock is unidentified in vanilla too (ShopPainter.java).
   */
  price: 20,
};

/** PotionOfStrength: apply() does hero.STR++ (PotionOfStrength.java:36-45).
 *  TIME_TO_DRINK = 1 (Potion.java:53). */
const POTION_STRENGTH: ItemDef = {
  id: 'potion_strength',
  name: 'poción de fuerza',
  sprite: 'potion_strength',
  type: 'potion',
  stackable: true,
  desc: 'Este líquido te recorre los músculos y te sube la fuerza un punto, para siempre.',
  /** PotionOfStrength has no price override: Potion.price() = 20 (Potion.java). */
  price: 20,
};

/** Food ("ration of food"): stackable (Food.java:41-46); energy =
 *  Hunger.HUNGRY = 260 (Food.java:41); warrior heals 5 HP when hurt
 *  (Food.java:74-82); TIME_TO_EAT = 3 (Food.java:34). */
const RATION: ItemDef = {
  id: 'ration',
  name: 'ración de comida',
  sprite: 'ration',
  type: 'food',
  stackable: true,
  desc: 'Nada del otro mundo: carne seca, galletas, cosas así.',
  energy: 260,
  /** Food.price() = 10 (Food.java). */
  price: 10,
};

/** Scroll placeholder. M1 ships no identification system and no scroll
 *  effects (later milestone), so scrolls exist as loot/quest items only.
 *  Vanilla shape: stackable, AC_READ, TIME_TO_READ = 1 (Scroll.java). */
const SCROLL: ItemDef = {
  id: 'scroll',
  name: 'pergamino',
  sprite: 'scroll',
  type: 'scroll',
  stackable: true,
  desc: 'Un pergamino lleno de signos que no se entienden.',
  /** Scroll.price() = 15, unidentified base (Scroll.java). */
  price: 15,
};

/** ScrollOfUpgrade: upgrades one equipped weapon/armor by +1
 *  (ScrollOfUpgrade.java:38-48). M1 note: auto-identified — the full
 *  identification system (rune labels, scrolls identify on read) arrives
 *  in M2; until then the scroll is readable directly. */
const SCROLL_UPGRADE: ItemDef = {
  id: 'scroll_upgrade',
  name: 'pergamino de mejora',
  sprite: 'scroll_upgrade',
  type: 'scroll',
  stackable: true,
  desc: 'This scroll will upgrade a single item, improving its quality. A weapon will inflict more damage; a suit of armor will deflect additional blows. Weapons and armor will also require less strength to use.',
  /** ScrollOfUpgrade has no price override: Scroll.price() = 15 (Scroll.java). */
  price: 15,
};

/** Gold: stackable item (Gold.java:44); doPickUp adds quantity to the purse
 *  (Gold.java:65-75). Amounts on the floor are encoded in the placed item id
 *  as `gold:<n>` (matching the generator's `gold:<n>` tag convention).
 *  Gnoll loot rolls Gold.random(): 20 + depth*10 .. 40 + depth*20
 *  (Gold.java:100-103). */
const GOLD: ItemDef = {
  id: 'gold',
  name: 'oro',
  sprite: 'gold',
  type: 'gold',
  stackable: true,
  desc: 'Junta monedas de oro para gastarlas luego en una tienda.',
  /** Item.price() base = 0 (Item.java); gold is currency, never sold. */
  price: 0,
};

/** IronKey: unlocks LOCKED_DOOR (Hero.actUnlock, Hero.java:666-689);
 *  Key.TIME_TO_UNLOCK = 1 (Key.java:26). name "iron key" (IronKey.java:34). */
const IRON_KEY: ItemDef = {
  id: 'iron_key',
  name: 'llave de hierro',
  sprite: 'key_iron',
  type: 'key',
  stackable: true,
  desc: 'Los dientes de esta llave vieja de hierro están bien gastados.',
  /** Key has no price override: Item.price() = 0 (Item.java). */
  price: 0,
};

/** SkeletonKey: dropped by Goo on death (Goo.die, Goo.java:188-214);
 *  unlocks LOCKED_EXIT (Hero.actUnlock, Hero.java:666-689). */
const SKELETON_KEY: ItemDef = {
  id: 'skeleton_key',
  name: 'llave maestra',
  sprite: 'key_skeleton',
  type: 'key',
  stackable: true,
  desc: 'Una llave tallada en hueso. Ha de abrir la bajada.',
  /** Key has no price override: Item.price() = 0 (Item.java). */
  price: 0,
};

/** GoldenKey: opens LOCKED_CHEST and CRYSTAL_CHEST heaps (Hero.actOpenChest,
 *  Hero.java:615-648). name "golden key" (GoldenKey.java:32). Like vanilla,
 *  keys are depth-specific (Key.depth); the port does not track key depth
 *  yet — a golden key opens any locked chest (same gap as iron keys). */
const GOLDEN_KEY: ItemDef = {
  id: 'golden_key',
  name: 'llave dorada',
  sprite: 'key_gold',
  type: 'key',
  stackable: true,
  desc: 'Los dientes de esta llave dorada son chiquitos y complicados. ¿Abrirá algún cofre?',
  /** Key has no price override: Item.price() = 0 (Item.java). */
  price: 0,
};

/** Dewdrop: dropped by trampling high grass (HighGrass.trample,
 *  HighGrass.java:44-47). name "dewdrop" (Dewdrop.java:33); stackable
 *  (Dewdrop.java:36). Never sits in the backpack: doPickUp heals the hero
 *  immediately (Dewdrop.java:41-64) — see pickupDewdrop in actions.ts.
 *  STAGE 0 SCOPE: the DewVial is not ported, so the vial branch of
 *  doPickUp (vial.collectDew) cannot fire; with no vial the drop always
 *  takes the direct-heal branch (Dewdrop.java:45). */
const DEWDROP: ItemDef = {
  id: 'dewdrop',
  name: 'gota de rocío',
  sprite: 'dewdrop',
  type: 'dewdrop',
  stackable: true,
  desc: 'Una gota de rocío, transparente.',
  /** Dewdrop has no price override: Item.price() = 0 (Item.java). */
  price: 0,
};

/** Seed: dropped by trampling high grass (HighGrass.trample,
 *  HighGrass.java:40-42). Vanilla drops a random plant Seed subtype
 *  (Generator.Category.SEED); the plant/seed system is not ported yet, so
 *  this is a single generic stackable seed item — it can be picked up and
 *  dropped, but planting/throwing effects arrive with the plant system.
 *  The trample drop probabilities are exact (HighGrass.java). */
const SEED: ItemDef = {
  id: 'seed',
  name: 'semilla',
  sprite: 'seed',
  type: 'seed',
  stackable: true,
  desc: 'Una semilla rara. A lo mejor se puede sembrar.',
  /** Plant.Seed has no price override: Item.price() = 0 (Item.java). */
  price: 0,
};

/**
 * Quest items (Sad Ghost / Wandmaker quests). All are unique, identified,
 * non-upgradable quest items (DriedRose.java:24-45, RatSkull.java:24-51,
 * CorpseDust.java:24-42, PhantomFish.java:30-81, Rotberry.Seed via
 * Rotberry.java:53). They have no use action in Stage 1 — they are only
 * carried back to the quest giver. Type 'quest' (new): they are none of the
 * existing catalog types. Sprites come from the original-sprite pipeline
 * (ItemSpriteSheet indices, see scripts/extract_original_sprites.ts).
 */
const DRIED_ROSE: ItemDef = {
  id: 'dried_rose',
  name: 'rosa seca',
  sprite: 'rose',
  type: 'quest',
  stackable: false,
  desc: 'La rosa se secó hace mucho, pero de algún modo conserva todos sus pétalos.',
};

const RAT_SKULL: ItemDef = {
  id: 'rat_skull',
  name: 'cráneo de rata gigante',
  sprite: 'skull',
  type: 'quest',
  stackable: false,
  desc: 'Sería un buen trofeo de cacería, pero huele demasiado feo para colgarlo.',
  price: 100, // RatSkull.price() (RatSkull.java:49-51)
};

const CORPSE_DUST: ItemDef = {
  id: 'corpse_dust',
  name: 'polvo de cadáver',
  sprite: 'dust',
  type: 'quest',
  stackable: false,
  desc:
    "The ball of corpse dust doesn't differ outwardly from a regular dust ball. " +
    "However, you know somehow that it's better to get rid of it as soon as possible.",
};

const PHANTOM_FISH: ItemDef = {
  id: 'phantom_fish',
  name: 'pez fantasma',
  sprite: 'phantom',
  type: 'quest',
  stackable: false,
  desc:
    'You can barely see this tiny translucent fish in the air. ' +
    'In the water it becomes effectively invisible.',
};

const ROTBERRY_SEED: ItemDef = {
  id: 'rotberry_seed',
  name: 'semilla de baya podrida', // Rotberry.Seed: name = "seed of " + plantName (Rotberry.java:52)
  sprite: 'seed_rotberry',
  type: 'quest',
  stackable: false,
  desc: 'Una semilla rara. A lo mejor se puede sembrar.',
};

/**
 * Shop-stock weapons (ShopPainter.java depth tiers) — Stage 1 shop system.
 * Stats: min0() = tier (MeleeWeapon.java:39-41);
 * max0() = (int)((tier*tier - tier + 10) / ACU * DLY) (MeleeWeapon.java:43-45);
 * typicalSTR() = 8 + tier*2 (MeleeWeapon.java:77-79);
 * price() = 20 * 2^(tier-1) (MeleeWeapon.java:173-178).
 */

/** Quarterstaff: tier 2 (super(2, 1f, 1f), Quarterstaff.java); shop depth 6. */
const QUARTERSTAFF: ItemDef = {
  id: 'quarterstaff',
  name: 'bastón',
  sprite: 'weapon_quarterstaff',
  type: 'weapon',
  stackable: false,
  desc: 'Un bastón de madera dura con los extremos forrados de hierro.',
  weapon: { name: 'bastón', tier: 2, level: 0, min: 2, max: 12, str: 12, acu: 1, dly: 1, missile: false },
  price: 40,
};

/** Spear: tier 2 (super(2, 1f, 1.5f), Spear.java); shop depth 6. */
const SPEAR: ItemDef = {
  id: 'spear',
  name: 'lanza',
  sprite: 'weapon_spear',
  type: 'weapon',
  stackable: false,
  desc: 'Una vara delgada de madera con punta de hierro afilado.',
  weapon: { name: 'lanza', tier: 2, level: 0, min: 2, max: 18, str: 12, acu: 1, dly: 1.5, missile: false },
  price: 40,
};

/** Sword: tier 3 (super(3, 1f, 1f), Sword.java); shop depth 11. */
const SWORD: ItemDef = {
  id: 'sword',
  name: 'espada',
  sprite: 'weapon_sword',
  type: 'weapon',
  stackable: false,
  desc: 'La hoja de acero, filosa como navaja, brilla de un modo que tranquiliza.',
  weapon: { name: 'espada', tier: 3, level: 0, min: 3, max: 16, str: 14, acu: 1, dly: 1, missile: false },
  price: 80,
};

/** Mace: tier 3 (super(3, 1f, 0.8f), Mace.java); shop depth 11. */
const MACE: ItemDef = {
  id: 'mace',
  name: 'maza',
  sprite: 'weapon_mace',
  type: 'weapon',
  stackable: false,
  desc: 'La cabeza de hierro de esta arma hace un daño considerable.',
  weapon: { name: 'maza', tier: 3, level: 0, min: 3, max: 12, str: 14, acu: 1, dly: 0.8, missile: false },
  price: 80,
};

/** Longsword: tier 4 (super(4, 1f, 1f), Longsword.java); shop depth 16. */
const LONGSWORD: ItemDef = {
  id: 'longsword',
  name: 'espada larga',
  sprite: 'weapon_longsword',
  type: 'weapon',
  stackable: false,
  desc: 'Esta hoja enorme hace mucho daño metiendo todo su peso en cada tajo.',
  weapon: { name: 'espada larga', tier: 4, level: 0, min: 4, max: 22, str: 16, acu: 1, dly: 1, missile: false },
  price: 160,
};

/** BattleAxe: tier 4 (super(4, 1.2f, 1f), BattleAxe.java); shop depth 16. */
const BATTLE_AXE: ItemDef = {
  id: 'battle_axe',
  name: 'hacha de guerra',
  sprite: 'weapon_battle_axe',
  type: 'weapon',
  stackable: false,
  desc: 'La enorme cabeza de acero de esta hacha le mete todo su peso a cada golpe.',
  weapon: { name: 'hacha de guerra', tier: 4, level: 0, min: 4, max: 18, str: 16, acu: 1.2, dly: 1, missile: false },
  price: 160,
};

/** Glaive: tier 5 (super(5, 1f, 1f), Glaive.java); shop depth 21. */
const GLAIVE: ItemDef = {
  id: 'glaive',
  name: 'guja',
  sprite: 'weapon_glaive',
  type: 'weapon',
  stackable: false,
  desc: 'Un asta larga con una hoja de espada en la punta.',
  weapon: { name: 'guja', tier: 5, level: 0, min: 5, max: 30, str: 18, acu: 1, dly: 1, missile: false },
  price: 320,
};

/** WarHammer: tier 5 (super(5, 1.2f, 1f), WarHammer.java); shop depth 21. */
const WAR_HAMMER: ItemDef = {
  id: 'war_hammer',
  name: 'martillo de guerra',
  sprite: 'weapon_war_hammer',
  type: 'weapon',
  stackable: false,
  desc: 'Few creatures can withstand the crushing blow of this towering mass of lead and steel, but only the strongest of adventurers can use it effectively.',
  weapon: { name: 'martillo de guerra', tier: 5, level: 0, min: 5, max: 25, str: 18, acu: 1.2, dly: 1, missile: false },
  price: 320,
};

/**
 * Shop-stock armor (ShopPainter.java depth tiers).
 * STR = typicalSTR() = 7 + tier*2 (Armor.java:289-291);
 * DR() = tier * (2 + effectiveLevel()) = tier*2 at level 0 (Armor.java:145-147);
 * price() = 10 * 2^(tier-1) (Armor.java:298-303).
 */

/** LeatherArmor: tier 2 (LeatherArmor.java); shop depth 6. */
const LEATHER_ARMOR: ItemDef = {
  id: 'leather_armor',
  name: 'armadura de cuero',
  sprite: 'armor_leather',
  type: 'armor',
  stackable: false,
  desc: 'Armadura de piel curtida de monstruo. Pesa más que la de tela, pero aguanta mucho más.',
  armor: { name: 'armadura de cuero', level: 0, tier: 2, str: 11, dr: 4 },
  price: 20,
};

/** MailArmor: tier 3 (MailArmor.java); shop depth 11. */
const MAIL_ARMOR: ItemDef = {
  id: 'mail_armor',
  name: 'cota de malla',
  sprite: 'armor_mail',
  type: 'armor',
  stackable: false,
  desc: 'Anillos de metal entrelazados: dura y a la vez flexible.',
  armor: { name: 'cota de malla', level: 0, tier: 3, str: 13, dr: 6 },
  price: 40,
};

/** ScaleArmor: tier 4 (ScaleArmor.java); shop depth 16. */
const SCALE_ARMOR: ItemDef = {
  id: 'scale_armor',
  name: 'armadura de escamas',
  sprite: 'armor_scale',
  type: 'armor',
  stackable: false,
  desc: 'Las escamas de metal cosidas sobre cuero hacen una armadura flexible pero protectora.',
  armor: { name: 'armadura de escamas', level: 0, tier: 4, str: 15, dr: 8 },
  price: 80,
};

/** PlateArmor: tier 5 (PlateArmor.java); shop depth 21. */
const PLATE_ARMOR: ItemDef = {
  id: 'plate_armor',
  name: 'armadura de placas',
  sprite: 'armor_plate',
  type: 'armor',
  stackable: false,
  desc: 'Enormous plates of metal are joined together into a suit that provides unmatched protection to any adventurer strong enough to bear its staggering weight.',
  armor: { name: 'armadura de placas', level: 0, tier: 5, str: 17, dr: 10 },
  price: 160,
};

/**
 * Shop-stock bags (ShopPainter.java). Vanilla Bags are containers
 * (items/bags/Bag.java); the port has no container mechanics yet, so these
 * are buyable/sellable/misc inventory items with no use action.
 * price() = 50 each (SeedPouch.java / ScrollHolder.java / WandHolster.java).
 */

/** SeedPouch: "seed pouch" (SeedPouch.java); shop depth 6. */
const SEED_POUCH: ItemDef = {
  id: 'seed_pouch',
  name: 'bolsa de semillas',
  sprite: 'seed_pouch',
  type: 'bag',
  stackable: false,
  desc: 'Esta bolsita de terciopelo guarda todas las semillas que quieras. Muy práctica.',
  price: 50,
};

/** ScrollHolder: "scroll holder" (ScrollHolder.java); shop depth 11. */
const SCROLL_HOLDER: ItemDef = {
  id: 'scroll_holder',
  name: 'portapergaminos',
  sprite: 'scroll_holder',
  type: 'bag',
  stackable: false,
  desc: 'Puedes meter todos los pergaminos que quieras en este tubo. Ahorra lugar en la mochila y los protege del fuego.',
  price: 50,
};

/** WandHolster: "wand holster", size 12 (WandHolster.java); shop depth 16. */
const WAND_HOLSTER: ItemDef = {
  id: 'wand_holster',
  name: 'funda de varitas',
  sprite: 'wand_holster',
  type: 'bag',
  stackable: false,
  desc: 'Esta funda delgada es de cuero de algún animal raro. Carga hasta 12 varitas sin estorbar.',
  price: 50,
};

/**
 * Shop-stock misc items (ShopPainter.java). Type 'misc': plain Items with no
 * use action in the port (torch light, ankh resurrection, weightstone
 * weapon-balancing are later milestones).
 */

/** Weightstone: stackable (Weightstone.java); shop depths 6/11/16. */
const WEIGHTSTONE: ItemDef = {
  id: 'weightstone',
  name: 'piedra de afilar',
  sprite: 'weightstone',
  type: 'misc',
  stackable: true,
  desc: 'Con una piedra de afilar puedes balancear tu arma para que sea más rápida o más certera.',
  /** Weightstone.price() = 40 (Weightstone.java). */
  price: 40,
};

/** Torch: stackable (Torch.java); shop depth 21 (x2). */
const TORCH: ItemDef = {
  id: 'torch',
  name: 'antorcha',
  sprite: 'torch',
  type: 'misc',
  stackable: true,
  desc: "It's an indispensable item in The Demon Halls, which are notorious for their poor ambient lighting.",
  /** Torch.price() = 10 (Torch.java). */
  price: 10,
};

/** Ankh: stackable (Ankh.java); every shop. */
const ANKH: ItemDef = {
  id: 'ankh',
  name: 'Ankh',
  sprite: 'ankh',
  type: 'misc',
  stackable: true,
  desc: 'El símbolo antiguo de la inmortalidad te deja volver a la vida. Al revivir se pierde todo lo que no traigas puesto.',
  /** Ankh.price() = 50 (Ankh.java). */
  price: 50,
};

/** OverpricedRation: "overpriced food ration" (OverpricedRation.java);
 *  energy = STARVING - HUNGRY = 360 - 260 = 100 (Hunger.java:36-37);
 *  price() = 20 (OverpricedRation.java). Shop common stock (x2). */
const OVERPRICED_RATION: ItemDef = {
  id: 'overpriced_ration',
  name: 'ración carísima',
  sprite: 'overpriced_ration',
  type: 'food',
  stackable: true,
  desc: 'Se ve igual que una ración normal, nada más que más chica.',
  energy: 100,
  price: 20,
};

/**
 * Base catalog defs for the 13 wands (bare `wand_of_<id>` ids, before
 * pickup normalization mints an instance). Price: Wand.price() base 50
 * (Wand.java:381); per-instance pricing lives in the wand system.
 */
const WAND_BASE_DEFS: Record<string, ItemDef> = {};
for (const spec of WAND_SPECS) {
  const id = `wand_of_${spec.id}`;
  WAND_BASE_DEFS[id] = {
    id,
    name: spec.name,
    sprite: spec.sprite,
    type: 'wand',
    stackable: false,
    desc: spec.desc,
    price: 50,
  };
}

/**
 * Base catalog defs for the 12 rings (bare `ring_of_<id>` ids).
 * Price: Ring.price() base 80 (Ring.java:322); per-instance pricing
 * (considerState) lives in the ring system.
 */
const RING_BASE_DEFS: Record<string, ItemDef> = {};
for (const spec of RING_SPECS) {
  const id = `ring_of_${spec.id}`;
  RING_BASE_DEFS[id] = {
    id,
    name: spec.name,
    sprite: spec.spriteKey,
    type: 'ring',
    stackable: false,
    desc: spec.desc,
    price: 80,
  };
}

export const ITEMS: Readonly<Record<string, ItemDef>> = {
  shortsword: SHORT_SWORD,
  dart: DART,
  cloth_armor: CLOTH_ARMOR,
  potion_healing: POTION_HEALING,
  potion_strength: POTION_STRENGTH,
  ration: RATION,
  scroll: SCROLL,
  scroll_upgrade: SCROLL_UPGRADE,
  gold: GOLD,
  iron_key: IRON_KEY,
  skeleton_key: SKELETON_KEY,
  golden_key: GOLDEN_KEY,
  dewdrop: DEWDROP,
  seed: SEED,
  dried_rose: DRIED_ROSE,
  rat_skull: RAT_SKULL,
  corpse_dust: CORPSE_DUST,
  phantom_fish: PHANTOM_FISH,
  rotberry_seed: ROTBERRY_SEED,
  quarterstaff: QUARTERSTAFF,
  spear: SPEAR,
  sword: SWORD,
  mace: MACE,
  longsword: LONGSWORD,
  battle_axe: BATTLE_AXE,
  glaive: GLAIVE,
  war_hammer: WAR_HAMMER,
  leather_armor: LEATHER_ARMOR,
  mail_armor: MAIL_ARMOR,
  scale_armor: SCALE_ARMOR,
  plate_armor: PLATE_ARMOR,
  seed_pouch: SEED_POUCH,
  scroll_holder: SCROLL_HOLDER,
  wand_holster: WAND_HOLSTER,
  weightstone: WEIGHTSTONE,
  torch: TORCH,
  ankh: ANKH,
  overpriced_ration: OVERPRICED_RATION,
  // Stage 2 (Worker 4): full potion/scroll catalogs + honeypot.
  ...POTION_DEFS,
  ...SCROLL_DEFS,
  honeypot: HONEYPOT_DEF,
  darkgold: DARK_GOLD,
  pickaxe: PICKAXE,
  // Stage 2 (wands/rings): base defs for the 13 wands + 12 rings. These are
  // the static catalog entries for bare base ids (wand_of_firebolt);
  // per-instance state (charges/level/identification) lives in the
  // wand/ring instance systems (wands.ts/rings.ts instanceItemDef).
  ...WAND_BASE_DEFS,
  ...RING_BASE_DEFS,
};

export function getItem(id: string): ItemDef {
  const { defId } = parseItemId(id);
  const def = ITEMS[defId];
  if (!def) throw new Error(`unknown item id: ${id}`);
  return def;
}

/**
 * Parse a placed item id into its catalog id + quantity.
 * Stackable catalog items may carry a ":qty" suffix (e.g. "gold:25",
 * "dart:8"); everything else is quantity 1.
 */
export function parseItemId(id: string): { defId: string; qty: number } {
  const colon = id.indexOf(':');
  if (colon === -1) return { defId: id, qty: 1 };
  const n = parseInt(id.slice(colon + 1), 10);
  return {
    defId: id.slice(0, colon),
    qty: Number.isFinite(n) && n > 0 ? n : 1,
  };
}

/**
 * Sprite keys referenced by the catalog that are NOT in the art atlas yet.
 * The renderer falls back to a magenta marker (never crashes), but these
 * need art: flagged for the art director / coordinator.
 */
/** Sprite keys still missing from the atlas (magenta fallback shown).
 * Empty: the M1 catalog's sprites are all present as of the items-b merge. */
export const MISSING_SPRITES: readonly string[] = [];

/** Sprite keys the catalog needs (for the completeness test). */
export function catalogSpriteKeys(): string[] {
  return Object.values(ITEMS).map((d) => d.sprite);
}

/** True when every catalog sprite key exists in an atlas.
 * The renderer prefers ORIGINAL_SPRITES (exact-copy extraction pipeline) and
 * falls back to the ASCII atlas, so both count as present. */
export function missingCatalogSprites(): string[] {
  return catalogSpriteKeys().filter(
    (k) => !(k in ORIGINAL_SPRITES) && !(k in SPRITES),
  );
}
