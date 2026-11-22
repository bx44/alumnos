/**
 * Scroll catalog data only — no hero / action imports.
 *
 * Split from scrolls.ts so items.ts can merge SCROLL_DEFS into ITEMS at
 * module init without the cycle:
 *   items → scrolls → hero → items
 * (same class of failure as POTION_DEFS under Bun).
 */
import type { ItemDef } from './item_types.js';

/** Catalog ids in vanilla class order (Scroll.java:41). */
export const SCROLL_CLASS_ORDER: readonly string[] = [
  'scroll_identify',
  'scroll_magicmapping',
  'scroll_recharging',
  'scroll_removecurse',
  'scroll_teleportation',
  'scroll_challenge',
  'scroll_terror',
  'scroll_lullaby',
  'scroll_psionicblast',
  'scroll_mirrorimage',
  'scroll_upgrade',
  'scroll_enchantment',
];

const SCROLL_ID_SET = new Set<string>(SCROLL_CLASS_ORDER);

/** True for the 12 vanilla scroll catalog ids. */
export function isScrollId(id: string): boolean {
  return SCROLL_ID_SET.has(id);
}

function def(id: string, name: string, sprite: string, desc: string): ItemDef {
  return {
    id,
    name,
    sprite,
    type: 'scroll',
    stackable: true,
    desc,
    /** Scroll.price() = 15 unidentified (Scroll.java); known prices vary. */
    price: 15,
  };
}

/**
 * The 11 new scroll defs (Upgrade already exists in items.ts). Names and
 * descs are verbatim from the Java classes; sprite keys are the extracted
 * ItemSpriteSheet frames (Worker 6).
 */
export const SCROLL_DEFS: Record<string, ItemDef> = {
  scroll_identify: def(
    'scroll_identify',
    'Scroll of Identify',
    'item_scroll_identify',
    // ScrollOfIdentify.java desc()
    'Permanently reveals all of the secrets of a single item.',
  ),
  scroll_teleportation: def(
    'scroll_teleportation',
    'Scroll of Teleportation',
    'item_scroll_teleportation',
    // ScrollOfTeleportation.java desc()
    'The spell on this parchment will teleport the reader to a random ' +
      'location on the current level.',
  ),
  scroll_removecurse: def(
    'scroll_removecurse',
    'Scroll of Remove Curse',
    'item_scroll_removecurse',
    // ScrollOfRemoveCurse.java desc()
    "The incantation on this scroll will instantly strip from the reader's " +
      'weapon, armor, rings and carried items any evil enchantments that ' +
      'might prevent the wearer from removing them.',
  ),
  scroll_recharging: def(
    'scroll_recharging',
    'Scroll of Recharging',
    'item_scroll_recharging',
    // ScrollOfRecharging.java desc()
    'The spell on this scroll will instantly recharge all of the wands ' +
      'the reader has.',
  ),
  scroll_magicmapping: def(
    'scroll_magicmapping',
    'Scroll of Magic Mapping',
    'item_scroll_magicmapping',
    // ScrollOfMagicMapping.java desc()
    'When this scroll is read, an image of crystal clarity will be etched ' +
      'into your memory, alerting you to the precise layout of the level ' +
      'and revealing all hidden secrets. The locations of items and ' +
      'creatures will remain unknown.',
  ),
  scroll_challenge: def(
    'scroll_challenge',
    'Scroll of Challenge',
    'item_scroll_challenge',
    // ScrollOfChallenge.java desc()
    'When this scroll is read, it lets out a challenging cry that ' +
      'compels all of the creatures on the level to pay attention to the ' +
      'reader.',
  ),
  scroll_terror: def(
    'scroll_terror',
    'Scroll of Terror',
    'item_scroll_terror',
    // ScrollOfTerror.java desc()
    'A fearsome magic will course through your enemies when this scroll ' +
      'is read, causing them to flee from your presence in terror.',
  ),
  scroll_lullaby: def(
    'scroll_lullaby',
    'Scroll of Lullaby',
    'item_scroll_lullaby',
    // ScrollOfLullaby.java desc()
    'Soothing notes will drift from this scroll, sending all nearby ' +
      'creatures into a deep slumber.',
  ),
  scroll_psionicblast: def(
    'scroll_psionicblast',
    'Scroll of Psionic Blast',
    'item_scroll_psionicblast',
    // ScrollOfPsionicBlast.java desc()
    'This scroll contains a devastating blast of psychic energy. It will ' +
      'damage and stun all creatures on the level that can see the reader, ' +
      'but it will also blind and damage the reader.',
  ),
  scroll_mirrorimage: def(
    'scroll_mirrorimage',
    'Scroll of Mirror Image',
    'item_scroll_mirrorimage',
    // ScrollOfMirrorImage.java desc()
    'The incantation on this scroll will create illusory duplicates of ' +
      'the reader, which will needle and distract the enemies.',
  ),
  scroll_enchantment: def(
    'scroll_enchantment',
    'Scroll of Enchantment',
    'item_scroll_enchantment',
    // ScrollOfEnchantment.java desc()
    'This scroll is able to imbue a weapon or a suit of armor with a ' +
      'magical enchantment, or to strengthen an enchantment which ' +
      'already exists on the item.',
  ),
};

/** Known prices (per Java price() overrides; base 15 unidentified). */
export const SCROLL_KNOWN_PRICES: Readonly<Record<string, number>> = {
  scroll_identify: 30, // ScrollOfIdentify.java
  scroll_teleportation: 40, // ScrollOfTeleportation.java
  scroll_removecurse: 30, // ScrollOfRemoveCurse.java
  scroll_recharging: 40, // ScrollOfRecharging.java
  scroll_magicmapping: 25, // ScrollOfMagicMapping.java
  scroll_challenge: 15,
  scroll_terror: 50, // ScrollOfTerror.java
  scroll_lullaby: 50, // ScrollOfLullaby.java
  scroll_psionicblast: 80, // ScrollOfPsionicBlast.java
  scroll_mirrorimage: 15,
  scroll_upgrade: 15,
  scroll_enchantment: 15,
};
