/**
 * Potion catalog data only — no hero / action imports.
 *
 * Split from potions.ts so items.ts can merge POTION_DEFS into ITEMS at
 * module init without the cycle:
 *   items → potions → hero → items
 * which throws "Cannot access POTION_DEFS before initialization" under Bun.
 */
import type { ItemDef } from './item_types.js';

/** Catalog ids in vanilla class order (Potion.java:40-41). */
export const POTION_CLASS_ORDER: readonly string[] = [
  'potion_healing',
  'potion_experience',
  'potion_toxicgas',
  'potion_liquidflame',
  'potion_strength',
  'potion_paralyticgas',
  'potion_levitation',
  'potion_mindvision',
  'potion_purity',
  'potion_invisibility',
  'potion_might',
  'potion_frost',
];

const POTION_ID_SET = new Set<string>(POTION_CLASS_ORDER);

/** True for the 12 vanilla potion catalog ids (incl. Stage-1 healing/strength). */
export function isPotionId(id: string): boolean {
  return POTION_ID_SET.has(id);
}

function def(
  id: string,
  name: string,
  sprite: string,
  desc: string,
): ItemDef {
  return {
    id,
    name,
    sprite,
    type: 'potion',
    stackable: true,
    desc,
    /** Potion.price() = 20 unidentified (Potion.java:228); known prices vary. */
    price: 20,
  };
}

/**
 * The 10 new potion defs. Names/descs are verbatim from the Java classes;
 * sprite keys are the extracted ItemSpriteSheet frames (Worker 6).
 * Healing/Strength remain defined in items.ts (Stage 1).
 */
export const POTION_DEFS: Record<string, ItemDef> = {
  potion_experience: def(
    'potion_experience',
    'Potion of Experience',
    'item_potion_experience',
    // PotionOfExperience.java desc()
    'The storied experiences of multitudes of battles reduced to vapours, ' +
      'this draught will instantly raise your experience level.',
  ),
  potion_toxicgas: def(
    'potion_toxicgas',
    'Potion of Toxic Gas',
    'item_potion_toxicgas',
    // PotionOfToxicGas.java desc()
    'Uncorking or shattering this pressurized glass will cause its contents ' +
      'to explode into a deadly cloud of toxic green gas. You might choose ' +
      'to fling this potion at distant enemies instead of uncorking it by hand.',
  ),
  potion_liquidflame: def(
    'potion_liquidflame',
    'Potion of Liquid Flame',
    'item_potion_liquidflame',
    // PotionOfLiquidFlame.java desc()
    'This flask contains an unstable compound which will burst violently ' +
      'into flame upon exposure to open air.',
  ),
  potion_paralyticgas: def(
    'potion_paralyticgas',
    'Potion of Paralytic Gas',
    'item_potion_paralyticgas',
    // PotionOfParalyticGas.java desc()
    'Uncorking or shattering this pressurized glass will cause its contents ' +
      'to explode into a cloud of paralyzing gas. You might choose to fling ' +
      'this potion at distant enemies instead of uncorking it by hand.',
  ),
  potion_levitation: def(
    'potion_levitation',
    'Potion of Levitation',
    'item_potion_levitation',
    // PotionOfLevitation.java desc()
    'This curious solution will fill you with buoyancy. If you drink it, ' +
      'you will begin to float.',
  ),
  potion_mindvision: def(
    'potion_mindvision',
    'Potion of Mind Vision',
    'item_potion_mindvision',
    // PotionOfMindVision.java desc()
    'After drinking this, your mind will become attuned to the psychic ' +
      'signature of distant creatures, enabling you to sense biological ' +
      'presences through walls. Also this potion will permit you to see ' +
      'through nearby walls and darkness.',
  ),
  potion_purity: def(
    'potion_purity',
    'Potion of Purification',
    'item_potion_purity',
    // PotionOfPurity.java desc()
    'This cloudy fluid will disperse any noxious clouds of gas which may be ' +
      'plaguing your vicinity. When you drink it, any gas effects afflicting ' +
      'you will be neutralized.',
  ),
  potion_invisibility: def(
    'potion_invisibility',
    'Potion of Invisibility',
    'item_potion_invisibility',
    // PotionOfInvisibility.java desc()
    'Drinking this potion will render you temporarily invisible. Enemies ' +
      'will be unable to see you, although any action you take (such as ' +
      'attacking) will dispel the effect.',
  ),
  potion_might: def(
    'potion_might',
    'Potion of Might',
    'item_potion_might',
    // PotionOfMight.java desc()
    'This powerful liquid will course through your muscles, permanently ' +
      'increasing your strength by one point and health by five points.',
  ),
  potion_frost: def(
    'potion_frost',
    'Potion of Frost',
    'item_potion_frost',
    // PotionOfFrost.java desc()
    'Upon exposure to open air, the fluid will evaporate, releasing an icy ' +
      'blast.',
  ),
};

/** Known prices (per Java price() overrides; base 20 unidentified). */
export const POTION_KNOWN_PRICES: Readonly<Record<string, number>> = {
  potion_healing: 30, // PotionOfHealing.java
  potion_experience: 80, // PotionOfExperience.java
  potion_toxicgas: 40,
  potion_liquidflame: 40,
  potion_strength: 100, // PotionOfStrength.java
  potion_paralyticgas: 40,
  potion_levitation: 35, // PotionOfLevitation.java
  potion_mindvision: 35, // PotionOfMindVision.java
  potion_purity: 50, // PotionOfPurity.java
  potion_invisibility: 40, // PotionOfInvisibility.java
  potion_might: 200, // PotionOfMight.java
  potion_frost: 50, // PotionOfFrost.java
};
