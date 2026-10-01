'use client';

// §5.4 Параллакс-фон боя: 5 слоёв, скорость прокрутки падает с глубиной слоя.

import { useEffect, useMemo, useState } from 'react';
import { backdropLayerUrl } from '@/lib/game/art/backdrop';
import { tierForFloor } from '@/lib/game/art/palette';

// [длительность цикла (с), bottom (%), height (%), прозрачность]
const LAYERS: Array<[number, string, string, number]> = [
  [0, '0%', '100%', 1], // небо-стена (без прокрутки)
  [110, '24%', '52%', 0.85], // дальние скалы
  [70, '14%', '44%', 0.95], // средние камни и кристаллы
  [50, '34%', '40%', 0.9], // парящие руны
  [32, '0%', '32%', 1], // ближние камни + земля
];

export function ParallaxBackdrop({ floor }: { floor: number }) {
  const tier = tierForFloor(floor);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const urls = useMemo(
    () => LAYERS.map((_, i) => backdropLayerUrl(tier, i)),
    [tier],
  );

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {mounted &&
        LAYERS.map(([dur, bottom, height, op], i) => {
          if (i === 0 || dur === 0) {
            return (
              <img
                key={i}
                src={urls[i]}
                className="pixelated absolute inset-0 h-full w-full"
                style={{ opacity: op }}
                alt=""
              />
            );
          }
          return (
            <div
              key={i}
              className="absolute inset-x-0 overflow-hidden"
              style={{ bottom, height, opacity: op }}
            >
              <div
                className="flex h-full w-[200%]"
                style={{ animation: `drift ${dur}s linear infinite` }}
              >
                <img src={urls[i]} className="pixelated h-full w-1/2" alt="" />
                <img src={urls[i]} className="pixelated h-full w-1/2" alt="" />
              </div>
            </div>
          );
        })}

      {/* дымка */}
      <div
        className="pointer-events-none absolute inset-0 animate-mist"
        style={{ background: `radial-gradient(120% 60% at 50% 100%, ${tierMist(tier)} 0%, transparent 70%)` }}
      />
      {/* виньетка */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(100% 100% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)' }}
      />
    </div>
  );
}

function tierMist(tier: number): string {
  const mists = [
    'rgba(84, 56, 30, 0.34)',
    'rgba(40, 70, 90, 0.36)',
    'rgba(90, 30, 80, 0.38)',
  ];
  return mists[tier] ?? mists[0];
}
