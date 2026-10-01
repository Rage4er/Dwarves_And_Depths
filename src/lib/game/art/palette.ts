// §5.1 Палитры: тёплая подземная гамма + 3 тира глубины для фонов боя.

export interface DepthTier {
  sky: string[];
  rock: string;
  rockLit: string;
  rockDark: string;
  crystal: string;
  crystalLit: string;
  rune: string;
  runeDim: string;
  ground: string;
  groundLit: string;
  mist: string;
  label: string;
}

export const DEPTH_TIERS: DepthTier[] = [
  {
    // Этажи 1–3: тёплые верхние галереи
    label: 'Верхние галереи',
    sky: ['#2a1a12', '#211409', '#180d06', '#100804'],
    rock: '#41301f',
    rockLit: '#54402a',
    rockDark: '#291d12',
    crystal: '#e8a33d',
    crystalLit: '#ffd98a',
    rune: '#ffb84d',
    runeDim: '#8a5a1c',
    ground: '#2f2114',
    groundLit: '#453321',
    mist: 'rgba(84, 56, 30, 0.28)',
  },
  {
    // Этажи 4–7: сырые пещеры с бирюзой
    label: 'Сырые пещеры',
    sky: ['#14202a', '#0f1820', '#0a1116', '#060a0d'],
    rock: '#2a3644',
    rockLit: '#3a4a5c',
    rockDark: '#18212b',
    crystal: '#4dd2c4',
    crystalLit: '#b0fff4',
    rune: '#7de8ff',
    runeDim: '#2a6a80',
    ground: '#1c2630',
    groundLit: '#2e3c4a',
    mist: 'rgba(40, 70, 90, 0.3)',
  },
  {
    // Этажи 8+: сердцевина Глубин
    label: 'Сердце Глубин',
    sky: ['#22101e', '#190a16', '#110610', '#090309'],
    rock: '#3a2340',
    rockLit: '#4c2f54',
    rockDark: '#241229',
    crystal: '#c94df0',
    crystalLit: '#ff9af5',
    rune: '#ff7de8',
    runeDim: '#7a2270',
    ground: '#261430',
    groundLit: '#3a1f44',
    mist: 'rgba(90, 30, 80, 0.32)',
  },
];

export function tierForFloor(floor: number): number {
  if (floor <= 3) return 0;
  if (floor <= 7) return 1;
  return 2;
}
