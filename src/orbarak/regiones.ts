/**
 * Las cinco regiones, con nombre de Or Barak.
 *
 * Los identificadores internos (sewers, prison, caves, city, halls) no se
 * tocan: son los que usa el generador, los tiles y las partidas guardadas.
 * Aquí sólo se decide cómo se llaman en pantalla.
 */

import { Region } from '../core/grid.js';

interface Lugar {
  nombre: string;
  entrada: string;
}

const LUGARES: Record<Region, Lugar> = {
  [Region.SEWERS]: {
    nombre: 'Bet Hamidrash',
    entrada:
      'El Bet Hamidrash, a oscuras. Algo se mueve entre los libreros.',
  },
  [Region.PRISON]: {
    nombre: 'Los Salones',
    entrada:
      'Los salones, pasada la hora. Las butacas están volteadas.',
  },
  [Region.CAVES]: {
    nombre: 'El Cerro',
    entrada:
      'El cerro, de noche. La fogata sigue prendida.',
  },
  [Region.CITY]: {
    nombre: 'La Biblioteca',
    entrada:
      'Una biblioteca que no termina. Alguien la acomodó y se fue.',
  },
  [Region.HALLS]: {
    nombre: 'El Pardés',
    entrada:
      'Aquí ya no hay paredes de verdad. Lo que hay son preguntas.',
  },
};

export function nombreRegion(region: Region): string {
  return LUGARES[region]?.nombre ?? String(region);
}

export function entradaRegion(region: Region): string {
  return LUGARES[region]?.entrada ?? '';
}

/** Cómo se llama cada tipo de objeto en la mochila. */
const CLASES: Record<string, string> = {
  weapon: 'arma',
  armor: 'armadura',
  missile: 'para aventar',
  potion: 'poción',
  food: 'comida',
  scroll: 'pergamino',
  wand: 'varita',
  ring: 'anillo',
  seed: 'semilla',
  misc: 'otro',
  equipped: 'puesto',
};

export function nombreClase(kind: string): string {
  return CLASES[kind] ?? kind;
}
