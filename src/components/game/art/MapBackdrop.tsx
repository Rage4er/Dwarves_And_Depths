// Фон карты-разреза подземелья: каждый этаж — ярус со своей темой
// (пещеры → гроты → лазы → реки → копи → пустоты → лавовые жилы → лава внизу).
// Декор детерминирован сидом забега: один seed → одна карта (§2.4).
import type { ReactNode } from 'react';
import { mulberry32, type PRNG } from '@/lib/game/rng';

export const ROW_H = 136;
const MAP_W = 440;

interface TierTheme {
  label: string;
  top: string;
  bottom: string;
  line: string;
  labelCls: string;
}

// чем ниже ярус, тем мрачнее палитра и страшнее декор
const TIERS: TierTheme[] = [
  { label: 'Верхние пещеры', top: '#4a3826', bottom: '#3a2b1c', line: '#2b1f13', labelCls: 'text-amber-200/70' },
  { label: 'Гроты', top: '#3e2f20', bottom: '#302417', line: '#261b10', labelCls: 'text-amber-100/60' },
  { label: 'Лазы и ходы', top: '#352a1e', bottom: '#281f15', line: '#20180e', labelCls: 'text-stone-300/60' },
  { label: 'Подземные реки', top: '#23313e', bottom: '#182430', line: '#131d26', labelCls: 'text-sky-300/70' },
  { label: 'Кристальные копи', top: '#2b2540', bottom: '#1d1830', line: '#151024', labelCls: 'text-violet-300/80' },
  { label: 'Пустоты', top: '#221a2a', bottom: '#150f1d', line: '#0f0a16', labelCls: 'text-purple-300/60' },
  { label: 'Лавовые жилы', top: '#2e1a16', bottom: '#1f100d', line: '#170a08', labelCls: 'text-orange-300/80' },
  { label: 'Сердце Глубин', top: '#26100e', bottom: '#170807', line: '#120505', labelCls: 'text-red-400/90' },
];

// глубже 8-го яруса темы Пустот/Жил/Сердца циклятся — дно всегда жаркое
function tierIndex(floor: number): number {
  return floor <= 8 ? floor - 1 : 5 + ((floor - 6) % 3);
}

function wavy(r: PRNG, y: number, amp: number, step = 55): string {
  let d = `M 0 ${y.toFixed(1)}`;
  for (let x = 0; x < MAP_W; x += step) {
    d += ` Q ${(x + step / 2).toFixed(1)} ${(y + (r() * 2 - 1) * amp).toFixed(1)} ${(x + step).toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

function jagged(r: PRNG, y: number, spread: number, segs = 9): string {
  let d = `M 0 ${y.toFixed(1)}`;
  for (let i = 1; i <= segs; i++) {
    d += ` L ${((MAP_W * i) / segs).toFixed(1)} ${(y + (r() * 2 - 1) * spread).toFixed(1)}`;
  }
  return d;
}

function crack(r: PRNG, x: number, y: number): string {
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  let cx = x;
  let cy = y;
  for (let i = 0; i < 4; i++) {
    cx += (r() * 2 - 1) * 14;
    cy += (r() * 2 - 1) * 10;
    d += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  return d;
}

function crackV(r: PRNG, x: number, y: number, len: number): string {
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 1; i <= 4; i++) {
    d += ` L ${(x + (r() * 2 - 1) * 6).toFixed(1)} ${(y + (len * i) / 4).toFixed(1)}`;
  }
  return d;
}

// точечный декор — по краям яруса, чтобы не спорить с узлами карты
function edgeX(r: PRNG): number {
  return r() < 0.5 ? 10 + r() * 66 : MAP_W - 76 + r() * 66;
}

function pebbles(r: PRNG, n: number): ReactNode {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = 16 + r() * (MAP_W - 32);
        const y = 30 + r() * (ROW_H - 56);
        const w = 2.5 + r() * 4.5;
        return (
          <ellipse
            key={i}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            rx={w.toFixed(1)}
            ry={(w * 0.55).toFixed(1)}
            fill={r() < 0.55 ? '#140d07' : '#6a573d'}
            opacity={(0.16 + r() * 0.16).toFixed(2)}
          />
        );
      })}
    </g>
  );
}

function strata(r: PRNG): ReactNode {
  return (
    <g>
      {[34, 70, 104].map((y, i) => (
        <path
          key={i}
          d={wavy(r, y, 4, 78)}
          fill="none"
          stroke="#000"
          strokeOpacity="0.12"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

function torch(r: PRNG): ReactNode {
  const x = edgeX(r);
  const y = 34 + r() * 34;
  return (
    <g>
      <circle cx={x.toFixed(1)} cy={(y - 3).toFixed(1)} r="11" fill="#ffb14d" opacity="0.13" />
      <circle cx={x.toFixed(1)} cy={(y - 3).toFixed(1)} r="5.5" fill="#ffb14d" opacity="0.16" />
      <path d={`M ${x.toFixed(1)} ${y.toFixed(1)} v 9`} stroke="#4a3520" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={`M ${(x - 2.6).toFixed(1)} ${y.toFixed(1)} q 2.6 -7 5.2 0 q -2.6 5.4 -5.2 0 Z`} fill="#ffcf6f" />
      <path d={`M ${(x - 1.3).toFixed(1)} ${(y - 0.6).toFixed(1)} q 1.3 -3.6 2.6 0 q -1.3 2.8 -2.6 0 Z`} fill="#fff3c4" />
    </g>
  );
}

function skull(x: number, y: number, s: number, dim = false): ReactNode {
  const c = dim ? '#8d8574' : '#d8cdb4';
  return (
    <g opacity={dim ? 0.55 : 0.8}>
      <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={(3.2 * s).toFixed(1)} fill={c} />
      <rect x={(x - 2.4 * s).toFixed(1)} y={(y + 1.6 * s).toFixed(1)} width={(4.8 * s).toFixed(1)} height={(1.9 * s).toFixed(1)} rx={(0.7 * s).toFixed(1)} fill={c} />
      <circle cx={(x - 1.3 * s).toFixed(1)} cy={(y - 0.5 * s).toFixed(1)} r={(0.85 * s).toFixed(1)} fill="#141018" />
      <circle cx={(x + 1.3 * s).toFixed(1)} cy={(y - 0.5 * s).toFixed(1)} r={(0.85 * s).toFixed(1)} fill="#141018" />
      {[-1.6, 0, 1.6].map((dx) => (
        <path
          key={dx}
          d={`M ${(x + dx * s).toFixed(1)} ${(y + 1.7 * s).toFixed(1)} v ${(1.5 * s).toFixed(1)}`}
          stroke="#141018"
          strokeWidth={(0.35 * s).toFixed(2)}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

function bones(r: PRNG, n: number): ReactNode {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = edgeX(r);
        const y = 40 + r() * 70;
        const a = -40 + r() * 80;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})`} opacity="0.6">
            <path d="M -6 0 H 6" stroke="#cfc4ae" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle cx="-7" cy="-1.4" r="1.5" fill="#cfc4ae" />
            <circle cx="-7" cy="1.4" r="1.5" fill="#cfc4ae" />
            <circle cx="7" cy="-1.4" r="1.5" fill="#cfc4ae" />
            <circle cx="7" cy="1.4" r="1.5" fill="#cfc4ae" />
          </g>
        );
      })}
    </g>
  );
}

function sparkle(x: number, y: number, s: number, c = '#ffffff'): ReactNode {
  return (
    <path
      d={`M ${(x - s).toFixed(1)} ${y.toFixed(1)} H ${(x + s).toFixed(1)} M ${x.toFixed(1)} ${(y - s).toFixed(1)} V ${(y + s).toFixed(1)}`}
      stroke={c}
      strokeWidth="0.9"
      opacity="0.85"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function mineFrame(x: number, y: number, h: number): ReactNode {
  return (
    <g opacity="0.9">
      <path
        d={`M ${(x - 11).toFixed(1)} ${y.toFixed(1)} v ${h.toFixed(1)} M ${(x + 11).toFixed(1)} ${y.toFixed(1)} v ${h.toFixed(1)} M ${(x - 15).toFixed(1)} ${y.toFixed(1)} h 30`}
        stroke="#5a4126"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M ${(x - 11).toFixed(1)} ${(y + 7).toFixed(1)} L ${(x + 11).toFixed(1)} ${(y + h - 5).toFixed(1)}`}
        stroke="#3f2d1a"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function railsCart(r: PRNG): ReactNode {
  const y = ROW_H - 20;
  const cx = 90 + r() * (MAP_W - 180);
  return (
    <g>
      <path d={`M 10 ${y.toFixed(1)} H ${(MAP_W - 10).toFixed(1)}`} stroke="#6b563a" strokeWidth="1.8" opacity="0.65" vectorEffect="non-scaling-stroke" />
      {Array.from({ length: 16 }, (_, i) => {
        const x = 16 + i * 26;
        return <path key={i} d={`M ${x} ${(y + 3).toFixed(1)} v 5`} stroke="#54432c" strokeWidth="2" opacity="0.5" vectorEffect="non-scaling-stroke" />;
      })}
      <rect x={(cx - 14).toFixed(1)} y={(y - 14).toFixed(1)} width="28" height="13" rx="1.5" fill="#4a3520" stroke="#2b1d10" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {[-8, 0, 8].map((dx) => (
        <circle key={dx} cx={(cx + dx).toFixed(1)} cy={(y - 15).toFixed(1)} r="4" fill="#1c1712" />
      ))}
      {[-8, 8].map((dx) => (
        <circle key={dx} cx={(cx + dx).toFixed(1)} cy={(y - 1).toFixed(1)} r="3" fill="#241b10" stroke="#0f0a06" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

function cobweb(x: number, y: number): ReactNode {
  const R = 20;
  const angs = [0, Math.PI / 6, Math.PI / 3, Math.PI / 2];
  const pt = (a: number, rad: number) => `${(x + rad * Math.cos(a)).toFixed(1)} ${(y + rad * Math.sin(a)).toFixed(1)}`;
  return (
    <g stroke="#cfc4ae" strokeWidth="0.7" opacity="0.3" fill="none">
      {angs.map((a) => (
        <path key={`r${a}`} d={`M ${x} ${y} L ${pt(a, R)}`} />
      ))}
      {[7, 13, 19].map((rad) => (
        <path key={rad} d={`M ${pt(angs[0], rad)} A ${rad} ${rad} 0 0 1 ${pt(angs[3], rad)}`} />
      ))}
    </g>
  );
}

function planks(cx: number, w: number): ReactNode {
  return (
    <g fill="#6b563a" opacity="0.85">
      <rect x={(cx - w / 2 - 5).toFixed(1)} y="46" width={(w + 10).toFixed(1)} height="4.5" rx="1" transform={`rotate(-3 ${cx.toFixed(1)} 48)`} />
      <rect x={(cx - w / 2 + 3).toFixed(1)} y="60" width={(w - 10).toFixed(1)} height="4.5" rx="1" transform={`rotate(2.5 ${cx.toFixed(1)} 62)`} />
    </g>
  );
}

function monolith(r: PRNG): ReactNode {
  const x = edgeX(r);
  const w = 20 + r() * 16;
  const h = 44 + r() * 36;
  const top = ROW_H - h;
  return (
    <g>
      <path
        d={`M ${(x - w / 2).toFixed(1)} ${ROW_H} L ${(x - w / 2 + 3).toFixed(1)} ${top.toFixed(1)} L ${(x + w / 2 - 3).toFixed(1)} ${(top + 5).toFixed(1)} L ${(x + w / 2).toFixed(1)} ${ROW_H} Z`}
        fill="#1c0d09"
        opacity="0.96"
      />
      <path d={crackV(r, x, top + 8, Math.max(12, h - 16))} fill="none" stroke="#ff7a2f" strokeWidth="1.1" opacity="0.75" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function gem(x: number, y: number, s: number, c: string): ReactNode {
  return (
    <g>
      <path d={`M ${x.toFixed(1)} ${(y - s).toFixed(1)} L ${(x + s).toFixed(1)} ${y.toFixed(1)} L ${x.toFixed(1)} ${(y + s).toFixed(1)} L ${(x - s).toFixed(1)} ${y.toFixed(1)} Z`} fill={c} />
      <path
        d={`M ${x.toFixed(1)} ${(y - s).toFixed(1)} L ${x.toFixed(1)} ${(y + s).toFixed(1)} M ${(x - s).toFixed(1)} ${y.toFixed(1)} H ${(x + s).toFixed(1)}`}
        stroke="#ffffff"
        strokeWidth="0.7"
        opacity="0.55"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

const GEM_COLORS = ['#8b5cf6', '#22d3ee', '#c084fc', '#f472b6'];

function bandCaves(r: PRNG): ReactNode {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const x = 18 + (i * (MAP_W - 36)) / 7 + (r() * 2 - 1) * 10;
        const len = 8 + r() * 16;
        const wdt = 3 + r() * 3;
        return <path key={i} d={`M ${(x - wdt).toFixed(1)} 0 L ${(x + wdt).toFixed(1)} 0 L ${x.toFixed(1)} ${len.toFixed(1)} Z`} fill="#241a0f" opacity="0.8" />;
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const x = 24 + r() * (MAP_W - 48);
        const len = 6 + r() * 12;
        return <path key={`sg${i}`} d={`M ${(x - 4).toFixed(1)} ${ROW_H} L ${(x + 4).toFixed(1)} ${ROW_H} L ${x.toFixed(1)} ${(ROW_H - len).toFixed(1)} Z`} fill="#241a0f" opacity="0.7" />;
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={`m${i}`} cx={(12 + r() * (MAP_W - 24)).toFixed(1)} cy={(24 + r() * 88).toFixed(1)} r={(1.6 + r() * 1.6).toFixed(1)} fill="#7d9455" opacity="0.4" />
      ))}
      {Array.from({ length: 3 }, (_, i) => {
        const x = 40 + r() * (MAP_W - 80);
        const y = ROW_H - 10 - r() * 10;
        return (
          <g key={`f${i}`}>
            <rect x={(x - 1).toFixed(1)} y={(y - 7).toFixed(1)} width="2" height="7" fill="#c9b68e" opacity="0.7" />
            <path d={`M ${(x - 4).toFixed(1)} ${(y - 7).toFixed(1)} q 4 -6 8 0 q -4 4 -8 0 Z`} fill="#b06a3a" opacity="0.85" />
          </g>
        );
      })}
      {torch(r)}
    </g>
  );
}

function bandGrottos(r: PRNG): ReactNode {
  return (
    <g>
      {Array.from({ length: 2 }, (_, i) => {
        const cx = i === 0 ? 66 : MAP_W - 66;
        const cy = 56 + r() * 20;
        return (
          <g key={i} fill="none" stroke="#241a0f" opacity="0.55">
            <ellipse cx={cx} cy={cy} rx="52" ry="30" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <ellipse cx={cx} cy={cy} rx="40" ry="22" strokeWidth="1" opacity="0.6" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {Array.from({ length: 2 }, (_, i) => {
        const x = 46 + r() * (MAP_W - 92);
        const len = 26 + r() * 18;
        return (
          <g key={`c${i}`} opacity="0.75">
            <path d={`M ${(x - 3).toFixed(1)} 0 L ${(x + 3).toFixed(1)} 0 L ${x.toFixed(1)} ${len.toFixed(1)} Z`} fill="#2a3a48" />
            <path d={`M ${(x - 3.5).toFixed(1)} ${ROW_H} L ${(x + 3.5).toFixed(1)} ${ROW_H} L ${x.toFixed(1)} ${(ROW_H - len * 0.6).toFixed(1)} Z`} fill="#2a3a48" />
          </g>
        );
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const x = 40 + r() * (MAP_W - 80);
        const len = 8 + r() * 12;
        return (
          <g key={`d${i}`} opacity="0.6">
            <path d={`M ${x.toFixed(1)} 4 v ${len.toFixed(1)}`} stroke="#6f9db8" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
            <circle cx={x.toFixed(1)} cy={(6 + len).toFixed(1)} r="1.5" fill="#8fc3dd" />
          </g>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={`g${i}`} cx={(20 + r() * (MAP_W - 40)).toFixed(1)} cy={(14 + r() * 26).toFixed(1)} r="1.2" fill="#9fe8c8" opacity={(0.35 + r() * 0.3).toFixed(2)} />
      ))}
      <ellipse cx={(MAP_W / 2).toFixed(1)} cy={(ROW_H - 8).toFixed(1)} rx="90" ry="10" fill="#33607f" opacity="0.28" />
      <ellipse cx={(MAP_W / 2).toFixed(1)} cy={(ROW_H - 9).toFixed(1)} rx="70" ry="6" fill="#9fd4f0" opacity="0.2" />
    </g>
  );
}

function bandWarrens(r: PRNG): ReactNode {
  return (
    <g>
      {[42, 96].map((y, i) => (
        <path
          key={i}
          d={wavy(r, y, 10, 64)}
          fill="none"
          stroke="#1a120a"
          strokeWidth="3.5"
          strokeDasharray="7 9"
          opacity="0.55"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {Array.from({ length: 3 }, (_, i) => {
        const x = edgeX(r);
        const y = 34 + r() * 60;
        return (
          <g key={`h${i}`}>
            <ellipse cx={x.toFixed(1)} cy={y.toFixed(1)} rx="12" ry="7.5" fill="#0e0905" />
            <ellipse cx={x.toFixed(1)} cy={(y - 1.5).toFixed(1)} rx="12" ry="7" fill="none" stroke="#3a2c1a" strokeWidth="1.2" opacity="0.8" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {mineFrame(72 + r() * 30, ROW_H - 30, 26)}
      {railsCart(r)}
      {Array.from({ length: 3 }, (_, i) => (
        <path
          key={`c${i}`}
          d={crack(r, edgeX(r), 24 + r() * 60)}
          fill="none"
          stroke="#170f08"
          strokeWidth="1.4"
          opacity="0.6"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

function bandRivers(r: PRNG): ReactNode {
  const wfSide = r() < 0.5 ? 30 : MAP_W - 30;
  return (
    <g>
      <path d={wavy(r, 58, 12, 48)} fill="none" stroke="#233a4c" strokeWidth="18" opacity="0.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <g filter="url(#mb-glow)">
        <path d={wavy(r, 58, 12, 48)} fill="none" stroke="#3f78a0" strokeWidth="8" opacity="0.7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </g>
      <path d={wavy(r, 56, 12, 44)} fill="none" stroke="#9fd4f0" strokeWidth="2" opacity="0.6" vectorEffect="non-scaling-stroke" />
      <path d={wavy(r, 62, 12, 60)} fill="none" stroke="#d8f2ff" strokeWidth="1" strokeDasharray="10 14" opacity="0.45" vectorEffect="non-scaling-stroke" />
      {Array.from({ length: 4 }, (_, i) => {
        const x = 60 + r() * (MAP_W - 120);
        const y = 48 + r() * 24;
        return (
          <circle key={`s${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(2.4 + r() * 1.6).toFixed(1)} fill="#22303c" stroke="#3f78a0" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        );
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const x = 50 + r() * (MAP_W - 100);
        const y = 70 + r() * 16;
        return <path key={`r${i}`} d={`M ${(x - 5).toFixed(1)} ${y.toFixed(1)} q 5 -4.5 10 0`} fill="none" stroke="#9fd4f0" strokeWidth="1.1" opacity="0.5" vectorEffect="non-scaling-stroke" />;
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const x = 26 + r() * (MAP_W - 52);
        return (
          <g key={`re${i}`} opacity="0.6">
            <path d={`M ${x.toFixed(1)} ${ROW_H} q ${(r() * 2 - 1).toFixed(1)} -12 ${(r() * 2 - 1).toFixed(1)} -20`} stroke="#4a6a52" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
            <circle cx={x.toFixed(1)} cy={(ROW_H - 22).toFixed(1)} r="1.3" fill="#4a6a52" />
          </g>
        );
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const x = wfSide - 10 + i * 5;
        const y2 = 30 + r() * 14;
        return (
          <g key={`w${i}`}>
            <path d={`M ${x} 6 V ${y2.toFixed(1)}`} stroke="#bfe6fa" strokeWidth="1.4" opacity={(0.3 + i * 0.08).toFixed(2)} vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={(y2 + 3).toFixed(1)} r="1.2" fill="#bfe6fa" opacity="0.5" />
          </g>
        );
      })}
    </g>
  );
}

function bandGems(r: PRNG): ReactNode {
  return (
    <g>
      {Array.from({ length: 2 }, (_, i) => {
        const cx = i === 0 ? 70 + r() * 40 : MAP_W - 110 + r() * 40;
        const cy = 40 + r() * 50;
        return (
          <g key={i}>
            <polygon
              points={[[cx - 16, cy + 6], [cx - 10, cy - 8], [cx + 4, cy - 12], [cx + 16, cy + 2], [cx + 8, cy + 12], [cx - 8, cy + 13]]
                .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
                .join(' ')}
              fill="#3a3050"
              opacity="0.9"
            />
            {gem(cx - 5, cy - 1, 4 + r() * 2, GEM_COLORS[i % 4])}
            {gem(cx + 7, cy + 4, 3 + r() * 2, GEM_COLORS[(i + 1) % 4])}
            {gem(cx + 1, cy + 8, 2.4, GEM_COLORS[(i + 2) % 4])}
            {sparkle(cx - 5, cy - 1, 6.5)}
            {sparkle(cx + 9, cy + 2, 4.5)}
          </g>
        );
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const x = 30 + r() * (MAP_W - 60);
        const h = 14 + r() * 14;
        const w = 5 + r() * 3;
        return (
          <g key={`k${i}`}>
            <path
              d={`M ${(x - w).toFixed(1)} ${ROW_H} L ${(x + w).toFixed(1)} ${ROW_H} L ${(x + w * 0.3).toFixed(1)} ${(ROW_H - h).toFixed(1)} L ${(x - w * 0.4).toFixed(1)} ${(ROW_H - h * 0.8).toFixed(1)} Z`}
              fill="#4a3b70"
            />
            <path
              d={`M ${x.toFixed(1)} ${ROW_H} L ${(x + w * 0.3).toFixed(1)} ${(ROW_H - h).toFixed(1)} L ${(x - w * 0.4).toFixed(1)} ${(ROW_H - h * 0.8).toFixed(1)} Z`}
              fill={r() < 0.5 ? '#6a55a0' : '#3a2e5c'}
              opacity="0.9"
            />
          </g>
        );
      })}
      {Array.from({ length: 3 }, (_, i) => {
        const x = 30 + r() * (MAP_W - 60);
        const s = 2 + r() * 1.5;
        return <g key={`t${i}`}>{gem(x, 8 + s, s, GEM_COLORS[Math.floor(r() * 4)])}</g>;
      })}
      {sparkle(30 + r() * (MAP_W - 60), 60 + r() * 40, 3.5)}
    </g>
  );
}

function bandVoids(r: PRNG): ReactNode {
  const cx = 130 + r() * (MAP_W - 260);
  const half = 26 + r() * 12;
  const steps = [0, ROW_H * 0.3, ROW_H * 0.62, ROW_H];
  const leftPts = steps.map((y) => `${(cx - half + (r() * 2 - 1) * 9).toFixed(1)},${y.toFixed(1)}`);
  const rightPts = [...steps].reverse().map((y) => `${(cx + half + (r() * 2 - 1) * 9).toFixed(1)},${y.toFixed(1)}`);
  return (
    <g>
      <polygon points={[...leftPts, ...rightPts].join(' ')} fill="#07030c" opacity="0.94" />
      {planks(cx, half * 2)}
      <g opacity="0.8">
        <circle cx={(cx - 6).toFixed(1)} cy="86" r="1.3" fill="#ff5a3c" />
        <circle cx={(cx + 2).toFixed(1)} cy="87" r="1.3" fill="#ff5a3c" />
        <circle cx={(cx - 2).toFixed(1)} cy="110" r="1.1" fill="#ff5a3c" />
        <circle cx={(cx + 6).toFixed(1)} cy="111" r="1.1" fill="#ff5a3c" />
      </g>
      {Array.from({ length: 5 }, (_, i) => {
        const x = edgeX(r);
        const h = 12 + r() * 16;
        return <path key={`sp${i}`} d={`M ${(x - 4).toFixed(1)} ${ROW_H} L ${(x + 4).toFixed(1)} ${ROW_H} L ${x.toFixed(1)} ${(ROW_H - h).toFixed(1)} Z`} fill="#120b1a" opacity="0.9" />;
      })}
      {skull(40 + r() * (MAP_W - 80), 34 + r() * 30, 1.1, true)}
      {bones(r, 2)}
      {cobweb(r() < 0.5 ? 4 : MAP_W - 4, 4)}
      <path d={wavy(r, 100, 14, 80)} fill="none" stroke="#0c0614" strokeWidth="4" opacity="0.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {[[edgeX(r), 36 + r() * 50], [edgeX(r), 60 + r() * 40]].map(([ex, ey], i) => (
        <g key={`e${i}`} opacity="0.7">
          <circle cx={ex.toFixed(1)} cy={ey.toFixed(1)} r="1.2" fill="#ff5a3c" />
          <circle cx={(ex + 6).toFixed(1)} cy={(ey + 1).toFixed(1)} r="1.2" fill="#ff5a3c" />
        </g>
      ))}
    </g>
  );
}

function bandLava(r: PRNG): ReactNode {
  const main = jagged(r, 56, 12, 8);
  const sec = jagged(r, 100, 9, 7);
  return (
    <g>
      <g filter="url(#mb-glow)">
        <path d={main} fill="none" stroke="#ff7a2f" strokeWidth="2.8" opacity="0.95" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={sec} fill="none" stroke="#ff7a2f" strokeWidth="2.2" opacity="0.9" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={crackV(r, 80 + r() * (MAP_W - 160), 60, 26)} fill="none" stroke="#ff7a2f" strokeWidth="1.4" opacity="0.8" vectorEffect="non-scaling-stroke" />
      </g>
      <path d={main} fill="none" stroke="#ffd23f" strokeWidth="1.1" opacity="0.95" vectorEffect="non-scaling-stroke" />
      <path d={sec} fill="none" stroke="#ffd23f" strokeWidth="0.9" opacity="0.9" vectorEffect="non-scaling-stroke" />
      <path d={crackV(r, 80 + r() * (MAP_W - 160), 60, 22)} fill="none" stroke="#ff7a2f" strokeWidth="1.2" opacity="0.7" vectorEffect="non-scaling-stroke" />
      {Array.from({ length: 4 }, (_, i) => (
        <path
          key={`k${i}`}
          d={crack(r, edgeX(r), 24 + r() * 80)}
          fill="none"
          stroke="#170a08"
          strokeWidth="1.4"
          opacity="0.7"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={`e${i}`} cx={(24 + r() * (MAP_W - 48)).toFixed(1)} cy={(16 + r() * 96).toFixed(1)} r={(1 + r() * 1.4).toFixed(1)} fill={r() < 0.5 ? '#ffb14d' : '#ff7a2f'} opacity="0.7" />
      ))}
      {Array.from({ length: 3 }, (_, i) => {
        const x = 40 + r() * (MAP_W - 80);
        const y = 30 + r() * 70;
        return <circle key={`h${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(5 + r() * 4).toFixed(1)} fill="#ff7a2f" opacity="0.12" />;
      })}
    </g>
  );
}

function bandCore(r: PRNG): ReactNode {
  return (
    <g>
      {monolith(r)}
      {monolith(r)}
      <ellipse cx={(MAP_W / 2).toFixed(1)} cy={(ROW_H - 16).toFixed(1)} rx={(MAP_W / 2).toFixed(1)} ry="36" fill="#ff6a2a" opacity="0.14" />
      <rect x="0" y={(ROW_H - 30).toFixed(1)} width={MAP_W} height="30" fill="url(#mb-lava)" opacity="0.96" />
      <path d={wavy(r, ROW_H - 29, 3, 46)} fill="none" stroke="#ffcf6f" strokeWidth="2" opacity="0.9" vectorEffect="non-scaling-stroke" />
      {[[MAP_W * 0.3, ROW_H - 16], [MAP_W * 0.66, ROW_H - 20]].map(([ix, iy], i) => (
        <polygon
          key={i}
          points={`${(ix - 16).toFixed(1)},${(iy + 5).toFixed(1)} ${(ix - 6).toFixed(1)},${(iy - 6).toFixed(1)} ${(ix + 10).toFixed(1)},${(iy - 4).toFixed(1)} ${(ix + 15).toFixed(1)},${(iy + 6).toFixed(1)}`}
          fill="#1c0d09"
          opacity="0.95"
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={`b${i}`} cx={(16 + r() * (MAP_W - 32)).toFixed(1)} cy={(ROW_H - 26 + r() * 22).toFixed(1)} r={(1.3 + r() * 1.8).toFixed(1)} fill="#ffe08a" opacity={(0.35 + r() * 0.45).toFixed(2)} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={`e${i}`} cx={(30 + r() * (MAP_W - 60)).toFixed(1)} cy={(ROW_H - 74 + r() * 36).toFixed(1)} r="1.2" fill="#ff9a4d" opacity="0.55" />
      ))}
      {skull(MAP_W * 0.78, ROW_H - 6, 1.6, true)}
    </g>
  );
}

const BAND_ART: Array<(r: PRNG) => ReactNode> = [
  bandCaves,
  bandGrottos,
  bandWarrens,
  bandRivers,
  bandGems,
  bandVoids,
  bandLava,
  bandCore,
];

function compass(): ReactNode {
  const cx = MAP_W / 2;
  const cy = 32;
  const R = 13;
  return (
    <g opacity="0.45">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e8d5ae" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path
        d={`M ${cx} ${(cy - R - 4).toFixed(1)} L ${(cx + 3.2).toFixed(1)} ${cy} L ${cx} ${(cy + R + 4).toFixed(1)} L ${(cx - 3.2).toFixed(1)} ${cy} Z`}
        fill="#e8d5ae"
        opacity="0.55"
      />
      <circle cx={cx} cy={cy} r="2" fill="#141018" />
      <circle cx={cx} cy={cy} r="1" fill="#e8d5ae" />
    </g>
  );
}

export function MapBackdrop({ depth, seed }: { depth: number; seed: number }) {
  const floors = Array.from({ length: Math.max(1, depth) }, (_, i) => i + 1);
  const h = floors.length * ROW_H;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${MAP_W} ${h}`} preserveAspectRatio="none">
        <defs>
          {TIERS.map((t, i) => (
            <linearGradient key={i} id={`mb-band-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={t.top} />
              <stop offset="1" stopColor={t.bottom} />
            </linearGradient>
          ))}
          <linearGradient id="mb-lava" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffcf6f" />
            <stop offset="0.45" stopColor="#ff7a2f" />
            <stop offset="1" stopColor="#8a2410" />
          </linearGradient>
          <linearGradient id="mb-shaft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd296" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ffd296" stopOpacity="0" />
          </linearGradient>
          <pattern id="mb-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M 0 0 V 9" stroke="#000" strokeOpacity="0.06" strokeWidth="1.5" />
          </pattern>
          <filter id="mb-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {floors.map((floor) => {
          const tier = tierIndex(floor);
          const t = TIERS[tier];
          const r = mulberry32((seed ^ (floor * 0x9e3779)) >>> 0);
          return (
            <g key={floor} transform={`translate(0 ${(floor - 1) * ROW_H})`}>
              <rect x="0" y="0" width={MAP_W} height={ROW_H} fill={`url(#mb-band-${tier})`} />
              <rect x="0" y="0" width={MAP_W} height={ROW_H} fill="url(#mb-hatch)" />
              {strata(r)}
              {pebbles(r, 6)}
              {BAND_ART[tier](r)}
              {floor === 1 && compass()}
              <path d={jagged(r, 3, 7, 12)} fill="none" stroke={t.line} strokeWidth="2.5" opacity="0.9" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={jagged(r, 5, 6, 12)} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
        <rect x="0" y="0" width={MAP_W} height="72" fill="url(#mb-shaft)" />
      </svg>
      {floors.map((floor) => {
        const t = TIERS[tierIndex(floor)];
        return (
          <div key={floor}>
            <span
              className={`absolute left-2 text-[9px] font-black uppercase tracking-[0.18em] ${t.labelCls}`}
              style={{ top: (floor - 1) * ROW_H + 6 }}
            >
              {t.label}
            </span>
            <span
              className="absolute right-2 text-[9px] font-bold tracking-wider text-stone-600"
              style={{ top: (floor - 1) * ROW_H + 6 }}
            >
              ярус {floor}
            </span>
          </div>
        );
      })}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 95% at 50% 32%, transparent 52%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  );
}
