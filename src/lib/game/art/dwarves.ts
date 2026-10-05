// §5 Гномы 96×96: процедурный пиксель-арт (борода, шлем по роли, оружие).
// Вид сбоку, лицом вправо. Логическая сетка 32×32, масштаб ×3.

import { makeGrid, put, rect, hspan, vspan, gridToDataUrl } from './px';
import type { Grid } from './px';

const SKIN = '#d9a066';
const SKIN_D = '#b07d4a';
const BOOT = '#4a3118';
const BOOT_D = '#33210f';
const METAL = '#9aa3ad';
const METAL_D = '#5c646d';
const METAL_L = '#c8d0d8';
const WOOD = '#7a5230';
const WOOD_D = '#4a3118';
const GOLD = '#e8b83d';
const BONE = '#e0d8c4';
const LEATHER = '#8a5a2e';
const LEATHER_D = '#5e3c1c';

// Цвет туники по роли
const ROLE_TUNIC: Record<string, [string, string]> = {
  tank: ['#5a6b8c', '#3e4c66'],
  warrior: ['#8c4a2e', '#66331e'],
  ranged: ['#4a6b3a', '#34502a'],
  mage: ['#3d4f9c', '#2a3a72'],
  support: ['#c8b98a', '#a08f60'],
  any: ['#7a6a52', '#5c4f3c'],
};

// Борода/убранство по гному
const DWARF_LOOK: Record<string, { beard: string; beardD: string; trim: string }> = {
  d_brom: { beard: '#8a5a2e', beardD: '#5e3c1c', trim: '#e8b83d' },
  d_grim: { beard: '#c9622e', beardD: '#8f4218', trim: '#d8d0c0' },
  d_torvin: { beard: '#e8d27a', beardD: '#b8a54e', trim: '#7de8ff' },
  d_dvalin: { beard: '#46424a', beardD: '#2e2b33', trim: '#c94df0' },
  d_nori: { beard: '#e07b39', beardD: '#a8531c', trim: '#5ec24d' },
  d_bofur: { beard: '#c9c9d4', beardD: '#9494a4', trim: '#6db8ff' },
  d_bombur: { beard: '#d8a24e', beardD: '#a8742c', trim: '#ffb84d' },
  d_bifur: { beard: '#f0e0b0', beardD: '#c0a878', trim: '#e84d4d' },
  d_bofur_2: { beard: '#9494b4', beardD: '#6a6a8a', trim: '#6db8ff' },
  d_balin: { beard: '#b86a2e', beardD: '#8a4a1c', trim: '#ffd24d' },
  d_bifur_2: { beard: '#e8d8a8', beardD: '#b8a074', trim: '#e84d4d' },
  d_bombur_2: { beard: '#c88a3e', beardD: '#985c22', trim: '#ffb84d' },
  d_dwalin_2: { beard: '#5a5662', beardD: '#3a3742', trim: '#c94df0' },
  d_dori: { beard: '#e8984e', beardD: '#b06a24', trim: '#8ad8ff' },
  d_nori_2: { beard: '#f08a3e', beardD: '#b85a1c', trim: '#5ec24d' },
  d_oin: { beard: '#d8b87a', beardD: '#a8894e', trim: '#c8e8ff' },
  d_gloin: { beard: '#c25a2e', beardD: '#8f3c18', trim: '#ffe08a' },
  d_balin_2: { beard: '#a87a3e', beardD: '#7a5424', trim: '#ffd24d' },
  d_thorin: { beard: '#3a3640', beardD: '#241f2a', trim: '#e8b83d' },
  d_fili: { beard: '#f0d898', beardD: '#c0a868', trim: '#7dffde' },
};

function baseBody(g: Grid, tunic: string, tunicD: string, pants = '#4a3a28'): void {
  // сапоги и ноги
  rect(g, 9, 28, 5, 3, BOOT);
  rect(g, 17, 28, 5, 3, BOOT);
  hspan(g, 9, 31, 5, BOOT_D);
  hspan(g, 17, 31, 5, BOOT_D);
  rect(g, 10, 25, 4, 3, pants);
  rect(g, 17, 25, 4, 3, pants);
  // туника
  rect(g, 9, 15, 12, 10, tunic);
  rect(g, 18, 15, 3, 10, tunicD);
  // ремень с пряжкой
  rect(g, 9, 22, 12, 1, '#3a2a1a');
  rect(g, 14, 22, 2, 1, GOLD);
  // руки: задняя и передняя
  rect(g, 7, 16, 2, 5, tunicD);
  put(g, 7, 21, SKIN);
  rect(g, 20, 16, 2, 4, tunic);
  rect(g, 20, 20, 2, 2, SKIN);
}

function headAndBeard(g: Grid, beard: string, beardD: string): void {
  // голова
  rect(g, 11, 6, 9, 9, SKIN);
  rect(g, 11, 13, 9, 2, SKIN_D);
  put(g, 11, 10, SKIN_D); // ухо
  put(g, 16, 9, '#241a12'); // глаз
  put(g, 20, 10, SKIN); // нос
  put(g, 20, 11, SKIN_D);
  // борода во всю грудь
  hspan(g, 15, 12, 6, beard);
  hspan(g, 12, 13, 10, beard);
  put(g, 12, 13, beardD);
  put(g, 21, 13, beardD);
  for (let y = 14; y <= 17; y++) {
    hspan(g, 11, y, 11, beard);
    put(g, 11, y, beardD);
    put(g, 21, y, beardD);
  }
  hspan(g, 12, 18, 9, beard);
  hspan(g, 13, 19, 7, beard);
  put(g, 13, 19, GOLD);
  put(g, 19, 19, GOLD);
  hspan(g, 14, 20, 5, beard);
  hspan(g, 15, 21, 3, beardD);
}

function helm(g: Grid, role: string, trim: string): void {
  switch (role) {
    case 'tank':
      rect(g, 10, 3, 11, 5, METAL);
      rect(g, 10, 8, 11, 1, METAL_D);
      put(g, 11, 4, GOLD);
      put(g, 19, 4, GOLD);
      vspan(g, 18, 8, 3, METAL_D); // наносник
      rect(g, 9, 6, 1, 4, METAL_D);
      break;
    case 'warrior':
      rect(g, 11, 4, 9, 3, METAL);
      hspan(g, 11, 7, 9, METAL_D);
      // рога
      put(g, 10, 3, BONE);
      put(g, 9, 2, BONE);
      put(g, 8, 1, BONE);
      put(g, 20, 3, BONE);
      put(g, 21, 2, BONE);
      put(g, 22, 1, BONE);
      break;
    case 'ranged':
      rect(g, 11, 4, 9, 4, LEATHER);
      hspan(g, 10, 8, 11, LEATHER_D);
      put(g, 20, 3, trim); // перо
      put(g, 20, 2, trim);
      break;
    case 'mage': {
      const hat = '#3d5aa8';
      const hatD = '#2a3f78';
      rect(g, 15, 1, 2, 1, hat);
      rect(g, 14, 2, 4, 1, hat);
      rect(g, 13, 3, 6, 1, hat);
      rect(g, 11, 4, 10, 3, hat);
      hspan(g, 10, 7, 12, hatD);
      put(g, 16, 2, GOLD);
      break;
    }
    case 'support': {
      const hood = '#d8cdb4';
      const hoodD = '#a89a78';
      rect(g, 10, 3, 11, 7, hood);
      hspan(g, 10, 9, 11, hoodD);
      rect(g, 12, 6, 7, 5, SKIN); // лицо под капюшоном
      rect(g, 12, 10, 7, 1, SKIN_D);
      put(g, 16, 8, '#241a12');
      vspan(g, 11, 4, 4, hoodD);
      break;
    }
    default:
      rect(g, 11, 4, 9, 3, LEATHER);
      hspan(g, 11, 7, 9, LEATHER_D);
  }
}

function weapon(g: Grid, role: string, trim: string): void {
  switch (role) {
    case 'warrior':
      vspan(g, 24, 7, 15, WOOD);
      put(g, 24, 21, WOOD_D);
      rect(g, 21, 5, 7, 5, METAL);
      vspan(g, 27, 5, 5, METAL_L);
      hspan(g, 22, 4, 5, METAL_L);
      break;
    case 'tank':
      // башенный щит
      rect(g, 21, 11, 8, 10, METAL);
      hspan(g, 21, 11, 8, METAL_L);
      hspan(g, 21, 20, 8, METAL_D);
      vspan(g, 21, 12, 9, METAL_D);
      vspan(g, 28, 12, 9, METAL_D);
      rect(g, 24, 15, 3, 3, trim);
      break;
    case 'ranged': {
      vspan(g, 26, 6, 13, WOOD);
      put(g, 25, 5, WOOD);
      put(g, 25, 19, WOOD);
      put(g, 24, 4, WOOD_D);
      put(g, 24, 20, WOOD_D);
      vspan(g, 22, 5, 14, '#d8d0c0'); // тетива
      hspan(g, 21, 12, 5, '#c8a05a'); // стрела
      put(g, 26, 12, METAL_L);
      break;
    }
    case 'mage':
      vspan(g, 25, 5, 17, WOOD);
      put(g, 25, 21, WOOD_D);
      rect(g, 23, 1, 5, 5, '#6db8ff');
      rect(g, 24, 2, 3, 3, '#dff2ff');
      put(g, 23, 0, trim);
      put(g, 28, 3, trim);
      break;
    case 'support':
      vspan(g, 24, 9, 12, WOOD);
      put(g, 24, 20, WOOD_D);
      rect(g, 21, 5, 8, 5, METAL);
      hspan(g, 21, 7, 8, trim);
      vspan(g, 21, 5, 5, METAL_L);
      break;
    default:
      vspan(g, 24, 8, 14, WOOD);
      rect(g, 22, 6, 6, 4, METAL);
  }
}

export function dwarfGrid(id: string, role: string): Grid {
  const g = makeGrid(32, 32);
  const look = DWARF_LOOK[id] ?? { beard: '#8a5a2e', beardD: '#5e3c1c', trim: '#e8b83d' };
  const [tunic, tunicD] = ROLE_TUNIC[role] ?? ROLE_TUNIC.any;
  baseBody(g, tunic, tunicD);
  headAndBeard(g, look.beard, look.beardD);
  helm(g, role, look.trim);
  weapon(g, role, look.trim);
  return g;
}

export function dwarfSpriteUrl(id: string, role: string = 'any', scale = 3): string {
  return gridToDataUrl(dwarfGrid(id, role), scale, `d:${id}:${role}:${scale}`);
}
