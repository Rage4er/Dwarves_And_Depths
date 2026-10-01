// §5.2 Иконки предметов 32×32: рамка по редкости + процедурный значок слота.

import { makeGrid, put, rect, hspan, vspan, paste, gridToDataUrl } from './px';
import type { Grid } from './px';
import { RARITY_COLOR } from '@/lib/game/types';
import type { Rarity } from '@/lib/game/types';

const BG = '#17110c';
const FRAME_IN = '#2a2018';
const WOOD = '#7a5230';
const WOOD_D = '#4a3118';
const METAL = '#9aa3ad';
const METAL_L = '#d0d8e0';
const METAL_D = '#5c646d';
const GOLD = '#e8b83d';
const BONE = '#e8e4d8';

type IconFn = (g: Grid) => void;

function axe(blade: string, edge: string): IconFn {
  return (g) => {
    vspan(g, 12, 5, 16, WOOD);
    put(g, 12, 20, WOOD_D);
    rect(g, 13, 5, 8, 7, blade);
    vspan(g, 20, 5, 7, edge);
    hspan(g, 14, 4, 6, edge);
    rect(g, 13, 11, 3, 2, METAL_D);
  };
}

function greatAxe(blade: string, edge: string): IconFn {
  return (g) => {
    vspan(g, 12, 3, 19, WOOD);
    put(g, 12, 21, WOOD_D);
    rect(g, 5, 4, 7, 9, blade);
    vspan(g, 5, 4, 9, edge);
    rect(g, 14, 4, 7, 9, blade);
    vspan(g, 20, 4, 9, edge);
    hspan(g, 7, 3, 12, edge);
  };
}

function hammer(gem: string): IconFn {
  return (g) => {
    vspan(g, 12, 10, 12, WOOD);
    put(g, 12, 21, WOOD_D);
    rect(g, 6, 3, 13, 7, METAL);
    hspan(g, 6, 3, 13, METAL_L);
    hspan(g, 6, 9, 13, METAL_D);
    rect(g, 10, 5, 4, 3, gem);
  };
}

function bow(limb: string, tip: string): IconFn {
  return (g) => {
    vspan(g, 17, 4, 16, limb);
    put(g, 16, 3, tip);
    put(g, 18, 3, tip);
    put(g, 16, 19, tip);
    put(g, 18, 19, tip);
    vspan(g, 9, 4, 16, '#e0d8c0'); // тетива
    hspan(g, 9, 11, 9, '#c8a05a'); // стрела
    put(g, 18, 11, METAL_L);
    put(g, 9, 10, '#e8d0a0');
    put(g, 9, 12, '#e8d0a0');
  };
}

function staff(orb: string, core: string): IconFn {
  return (g) => {
    vspan(g, 11, 7, 16, WOOD);
    put(g, 11, 22, WOOD_D);
    rect(g, 8, 2, 7, 6, orb);
    rect(g, 10, 3, 3, 3, core);
    put(g, 7, 3, core);
    put(g, 15, 5, core);
  };
}

function dagger(blade: string, edge: string): IconFn {
  return (g) => {
    vspan(g, 11, 4, 12, blade);
    vspan(g, 13, 4, 12, edge);
    put(g, 12, 3, edge);
    hspan(g, 8, 16, 9, WOOD_D);
    vspan(g, 11, 17, 5, '#3a2a1a');
    put(g, 12, 19, GOLD);
  };
}

function sword(edge: string, guard: string, gem: string): IconFn {
  return (g) => {
    vspan(g, 11, 3, 13, edge);
    vspan(g, 12, 3, 13, '#ffffff');
    put(g, 12, 2, edge);
    hspan(g, 8, 16, 9, guard);
    vspan(g, 11, 17, 5, '#3a2a1a');
    put(g, 12, 19, gem);
  };
}

function shieldRing(base: string, rim: string, boss: string): IconFn {
  return (g) => {
    rect(g, 5, 5, 14, 14, base);
    hspan(g, 5, 5, 14, rim);
    hspan(g, 5, 18, 14, rim);
    vspan(g, 5, 5, 14, rim);
    vspan(g, 18, 5, 14, rim);
    rect(g, 10, 10, 4, 4, boss);
    put(g, 8, 8, '#ffffff22');
  };
}

function towerShield(): IconFn {
  return (g) => {
    rect(g, 7, 3, 10, 18, '#7a828c');
    hspan(g, 7, 3, 10, METAL_L);
    hspan(g, 7, 20, 10, METAL_D);
    vspan(g, 7, 3, 18, METAL_D);
    vspan(g, 16, 3, 18, METAL_D);
    hspan(g, 7, 11, 10, GOLD);
    rect(g, 11, 6, 3, 3, METAL_D);
  };
}

function magnetShield(): IconFn {
  return (g) => {
    rect(g, 5, 5, 14, 14, '#8a929c');
    hspan(g, 5, 5, 14, '#b8c0c8');
    hspan(g, 5, 18, 14, METAL_D);
    rect(g, 8, 8, 3, 8, '#c03a3a');
    rect(g, 13, 8, 3, 8, '#c03a3a');
    hspan(g, 8, 7, 8, '#c03a3a');
    hspan(g, 8, 6, 3, BONE);
    hspan(g, 13, 6, 3, BONE);
    hspan(g, 8, 15, 3, BONE);
    hspan(g, 13, 15, 3, BONE);
  };
}

function helmLeather(): IconFn {
  return (g) => {
    rect(g, 6, 9, 12, 7, '#8a5a2e');
    hspan(g, 5, 15, 14, '#6a421e');
    hspan(g, 7, 8, 10, '#a8784a');
    put(g, 8, 11, '#4a2f14');
    put(g, 15, 11, '#4a2f14');
  };
}

function helmIron(): IconFn {
  return (g) => {
    rect(g, 6, 8, 12, 7, METAL);
    hspan(g, 5, 15, 14, METAL_D);
    hspan(g, 7, 7, 10, METAL_L);
    vspan(g, 11, 15, 4, METAL_D); // наносник
    put(g, 8, 10, GOLD);
    put(g, 15, 10, GOLD);
  };
}

function plate(): IconFn {
  return (g) => {
    rect(g, 4, 6, 3, 5, METAL_D); // наплечники
    rect(g, 17, 6, 3, 5, METAL_D);
    rect(g, 6, 6, 12, 12, METAL);
    hspan(g, 7, 5, 10, METAL_L);
    rect(g, 10, 6, 4, 2, BG); // вырез
    vspan(g, 12, 8, 8, METAL_D);
    put(g, 8, 16, GOLD);
    put(g, 15, 16, GOLD);
  };
}

function ringIcon(gem: string): IconFn {
  return (g) => {
    const c = 12;
    const r = 5;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = x * x + y * y;
        if (d <= r * r && d >= (r - 1.6) * (r - 1.6)) put(g, c + x, 15 + y, GOLD);
      }
    }
    rect(g, 10, 5, 5, 4, gem);
    put(g, 11, 6, '#ffffff');
  };
}

function charmBone(): IconFn {
  return (g) => {
    for (let i = 0; i < 10; i++) put(g, 6 + i, 18 - i, BONE);
    rect(g, 4, 17, 4, 4, BONE);
    rect(g, 15, 4, 4, 4, BONE);
    put(g, 5, 18, '#b8b4a4');
    put(g, 17, 5, '#b8b4a4');
    put(g, 11, 12, '#8c4a2e'); // шнур
  };
}

function amulet(gem: string): IconFn {
  return (g) => {
    for (let x = 6; x <= 18; x++) put(g, x, 6 + Math.round(2 * Math.sin(((x - 6) / 12) * Math.PI)), '#c0a860');
    rect(g, 9, 10, 6, 6, '#3a8a4a');
    rect(g, 10, 11, 4, 4, gem);
    vspan(g, 11, 11, 3, '#e8ffe8');
    hspan(g, 10, 12, 4, '#e8ffe8');
  };
}

function boots(): IconFn {
  return (g) => {
    rect(g, 5, 9, 5, 8, '#7a4a28');
    rect(g, 4, 16, 7, 3, '#5e3c1c');
    rect(g, 12, 11, 5, 8, '#7a4a28');
    rect(g, 11, 18, 7, 3, '#5e3c1c');
    hspan(g, 5, 8, 5, '#a8784a');
    hspan(g, 12, 10, 5, '#a8784a');
    put(g, 19, 7, '#e8dcc0'); // линии скорости
    put(g, 20, 10, '#e8dcc0');
    put(g, 19, 13, '#e8dcc0');
  };
}

function drum(): IconFn {
  return (g) => {
    rect(g, 5, 9, 14, 9, '#8a5a2e');
    hspan(g, 5, 9, 14, '#d8c8a8');
    hspan(g, 5, 17, 14, '#d8c8a8');
    hspan(g, 5, 8, 14, '#5a3a1e');
    hspan(g, 5, 18, 14, '#5a3a1e');
    put(g, 8, 12, '#5a3a1e');
    put(g, 10, 14, '#5a3a1e');
    put(g, 15, 12, '#5a3a1e');
    put(g, 13, 14, '#5a3a1e');
  };
}

function beardIcon(): IconFn {
  return (g) => {
    const c = '#d8dce4';
    const cD = '#9494a4';
    hspan(g, 8, 6, 8, c);
    for (let y = 7; y <= 12; y++) hspan(g, 6, y, 12, c);
    for (let y = 13; y <= 15; y++) hspan(g, 8, y, 8, c);
    hspan(g, 10, 16, 4, c);
    hspan(g, 11, 17, 2, cD);
    put(g, 6, 7, cD);
    put(g, 17, 7, cD);
    put(g, 6, 12, cD);
    put(g, 17, 12, cD);
    put(g, 7, 13, GOLD);
    put(g, 16, 13, GOLD);
  };
}

function scale(): IconFn {
  return (g) => {
    const base = '#c05a2e';
    const lit = '#e88a4a';
    for (const [x, y] of [[5, 5], [11, 5], [17, 5], [8, 10], [14, 10], [5, 15], [11, 15], [17, 15]] as const) {
      rect(g, x, y, 5, 4, base);
      hspan(g, x, y, 5, lit);
      put(g, x + 2, y + 1, '#8c3a1a');
    }
  };
}

function tome(): IconFn {
  return (g) => {
    rect(g, 5, 5, 13, 14, '#5a3a8c');
    hspan(g, 5, 5, 13, '#7a5ab0');
    rect(g, 17, 6, 2, 12, '#e8dcc0'); // страницы
    rect(g, 5, 5, 2, 14, '#3a2460');
    put(g, 10, 8, '#c9a0ff'); // руна
    put(g, 11, 9, '#c9a0ff');
    put(g, 12, 10, '#c9a0ff');
    put(g, 10, 12, '#c9a0ff');
    put(g, 12, 12, '#c9a0ff');
    put(g, 11, 13, GOLD);
  };
}

const ICONS: Record<string, IconFn> = {
  e_rusty_axe: axe('#8a6a4a', '#5e3c1c'),
  e_wood_shield: shieldRing('#8a5a2e', '#5a3a1e', GOLD),
  e_short_bow: bow(WOOD, WOOD_D),
  e_apprentice_staff: staff('#6db8ff', '#dff2ff'),
  e_leather_cap: helmLeather(),
  e_lucky_ring: ringIcon('#7de8ff'),
  e_bone_charm: charmBone(),
  e_rune_hammer: hammer('#7de8ff'),
  e_tower_shield: towerShield(),
  e_2h_axe: greatAxe(METAL, METAL_L),
  e_magnet_shield: magnetShield(),
  e_poison_dagger: dagger('#7ac07a', '#b0e8a8'),
  e_fire_staff: staff('#ff9a3d', '#ffe0b0'),
  e_iron_helm: helmIron(),
  e_swift_boots: boots(),
  e_healing_charm: amulet('#7ade8a'),
  e_war_drum: drum(),
  e_slayer_axe: axe('#b04a3a', '#e88a6a'),
  e_guardian_plate: plate(),
  e_hunter_bow: bow('#5a8a4a', GOLD),
  e_vamp_blade: sword('#c8d0d8', '#8c2a3a', '#ff4a5a'),
  e_mithril_beard: beardIcon(),
  e_dragon_scale: scale(),
  e_arcane_tome: tome(),
};

function framed(icon: Grid, rarity: Rarity): Grid {
  const g = makeGrid(32, 32, BG);
  const c = RARITY_COLOR[rarity];
  hspan(g, 0, 0, 32, c);
  hspan(g, 0, 31, 32, c);
  vspan(g, 0, 0, 32, c);
  vspan(g, 31, 0, 32, c);
  hspan(g, 1, 1, 30, FRAME_IN);
  hspan(g, 1, 30, 30, FRAME_IN);
  vspan(g, 1, 1, 30, FRAME_IN);
  vspan(g, 30, 1, 30, FRAME_IN);
  put(g, 1, 1, '#4a3a28');
  put(g, 30, 1, '#4a3a28');
  put(g, 1, 30, '#4a3a28');
  put(g, 30, 30, '#4a3a28');
  paste(g, icon, 4, 4);
  return g;
}

export function itemIconUrl(key: string, rarity: Rarity, scale = 2): string {
  const draw = ICONS[key];
  if (!draw) return '';
  const icon = makeGrid(24, 24);
  draw(icon);
  return gridToDataUrl(framed(icon, rarity), scale, `i:${key}:${rarity}:${scale}`);
}
