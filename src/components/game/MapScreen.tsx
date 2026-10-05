'use client';

// §4 экран 4 «Карта подземелья» (§4.2 v6.8): вертикальный граф слоёв со связями,
// состояния узлов (пройден/текущий/доступный/будущий), панели лавки/привала/кузни

import { useState } from 'react';
import { useGame } from '@/lib/game/store';
import { mapDepth, nodeById } from '@/lib/game/logic/run';
import { NODE_NAME } from '@/lib/game/types';
import type { RunNode } from '@/lib/game/types';
import { ENEMY_TABLE } from '@/lib/game/data';
import type { EnemyKind } from '@/lib/game/data';
import { DwarfCard, Gold } from './bits';
import { ShopPanel, RestPanel, ForgePanel } from './OtherScreens';
import { NodeIcon, FoeSprite } from './sprites';
import { MapBackdrop, ROW_H } from './art/MapBackdrop';
import { playSfx } from '@/lib/game/sfx';

const NODE_STYLE: Record<string, { ring: string; chip: string }> = {
  battle: { ring: 'ring-stone-600/60', chip: 'text-stone-300' },
  elite: { ring: 'ring-purple-600', chip: 'text-purple-300' },
  boss: { ring: 'ring-red-600', chip: 'text-red-300' },
  shop: { ring: 'ring-amber-600', chip: 'text-amber-300' },
  event: { ring: 'ring-sky-600', chip: 'text-sky-300' },
  rest: { ring: 'ring-teal-600', chip: 'text-teal-300' },
  forge: { ring: 'ring-orange-600', chip: 'text-orange-300' },
};

// геометрия узла (§4.2: узел 96×96, мобильный — 64); высота яруса — ROW_H из MapBackdrop
const NODE_CLS = 'h-16 w-16 sm:h-24 sm:w-24';

export function MapScreen() {
  const { state, dispatch } = useGame();
  const run = state.run;
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  if (!run) return null;

  const depth = mapDepth(run);
  const current = nodeById(run, run.currentNodeId);
  const reach = new Set(current?.next ?? []);
  const countOf = (floor: number) => run.map.filter((n) => n.floor === floor).length;
  const gateElite = state.meta.maxFloorEverReached < 3;
  // если гейт элиты закрывает ВСЕ доступные узлы — открываем их, иначе тупик на карте
  const anyOpen = gateElite
    ? run.map.some((n) => reach.has(n.id) && !n.visited && n.type !== 'elite')
    : true;

  const nodeEnabled = (n: RunNode): boolean => {
    if (n.visited) return false;
    if (!reach.has(n.id)) return false;
    // §3.3.6: элитные стражи доступны, когда пройден хотя бы 3-й этаж когда-либо
    if (n.type === 'elite' && gateElite && anyOpen) return false;
    return true;
  };

  const pick = (n: RunNode) => {
    playSfx('click');
    dispatch({ type: 'CHOOSE_NODE', nodeId: n.id });
  };

  // панель текущего узла: лавка/привал/кузня до посещения, незавершённый бой — к бою
  let panel: React.ReactNode = null;
  if (current && !current.visited) {
    if (current.type === 'shop') panel = <ShopPanel key={current.id} />;
    else if (current.type === 'rest') panel = <RestPanel key={current.id} />;
    else if (current.type === 'forge') panel = <ForgePanel key={current.id} />;
    else if (current.type === 'battle' || current.type === 'elite' || current.type === 'boss') {
      panel = <BattlePrompt key={current.id} node={current} />;
    }
  }

  // связи: пройденный путь 2px, доступный 4px (амбер), остальное 1px
  const links: { a: RunNode; b: RunNode; kind: 'active' | 'traveled' | 'idle' }[] = [];
  for (const a of run.map) {
    for (const nextId of a.next) {
      const b = run.map.find((n) => n.id === nextId);
      if (!b) continue;
      const kind =
        a.id === current?.id && !a.visited && reach.has(b.id) ? 'active'
        : a.visited && b.visited ? 'traveled'
        : 'idle';
      links.push({ a, b, kind });
    }
  }

  const xPct = (floor: number, i: number) => ((i + 1) / (countOf(floor) + 1)) * 100;
  // спуск сверху вниз: 1-й этаж — верх карты, глубина — низ
  const yPx = (floor: number) => (floor - 1) * ROW_H + ROW_H / 2;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-8">
      {/* верхняя панель: золото, глубина, отряд, рюкзак */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-runic text-2xl font-black text-amber-300">
            {run.isEndless
              ? `♾️ Слой ${run.endlessFloor} · этаж ${run.floor}/${depth}`
              : `Глубины · этаж ${run.floor}/${depth}`}
          </h2>
          <p className="text-xs text-stone-500">Семя забега: {run.seed}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-stone-900/70 px-3 py-2 text-sm ring-1 ring-stone-700"><Gold amount={run.gold} /></span>
          <button
            onClick={() => {
              playSfx('click');
              dispatch({ type: 'GOTO', screen: 'inventory' });
            }}
            className="min-h-[44px] rounded-lg bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 ring-1 ring-stone-600 transition hover:bg-stone-700"
          >
            🎒 {run.inventory.length}
          </button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {run.dwarves.map((d) => (
          <DwarfCard key={d.id} dwarf={d} compact />
        ))}
      </div>

      {panel && <div className="mt-4">{panel}</div>}

      {/* граф карты: разрез подземелья сверху вниз, связи между узлами */}
      <div
        className="relative mx-auto mt-4 w-full max-w-[440px] overflow-hidden rounded-2xl bg-stone-950 shadow-[inset_0_0_44px_rgba(0,0,0,0.55)] ring-1 ring-stone-800/80"
        style={{ height: depth * ROW_H }}
      >
        <MapBackdrop depth={depth} seed={run.seed} />
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {links.map(({ a, b, kind }) => (
            <line
              key={`${a.id}_${b.id}`}
              x1={`${xPct(a.floor, run.map.filter((n) => n.floor === a.floor).findIndex((n) => n.id === a.id))}%`}
              y1={yPx(a.floor)}
              x2={`${xPct(b.floor, run.map.filter((n) => n.floor === b.floor).findIndex((n) => n.id === b.id))}%`}
              y2={yPx(b.floor)}
              stroke={kind === 'active' ? '#fbbf24' : kind === 'traveled' ? '#78716c' : '#44403c'}
              strokeWidth={kind === 'active' ? 4 : kind === 'traveled' ? 2 : 1}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {[...Array.from({ length: depth }, (_, i) => depth - i)].map((floor) =>
          run.map
            .filter((n) => n.floor === floor)
            .map((n, i) => {
              const st = NODE_STYLE[n.type] ?? NODE_STYLE.battle;
              const enabled = nodeEnabled(n);
              const isCurrent = current?.id === n.id;
              const here = n.floor === run.floor;
              const tooltip = `Этаж ${n.floor} · ${NODE_NAME[n.type]} · сложность ${n.difficulty} · ${n.rewards.gold} 🪙${
                n.rewards.itemIds.length ? ` · +${n.rewards.itemIds.length} предм.` : ''
              }`;
              return (
                <button
                  key={n.id}
                  disabled={!enabled}
                  onClick={() => pick(n)}
                  title={tooltip}
                  style={{ left: `${xPct(n.floor, i)}%`, top: yPx(n.floor) }}
                  className={`absolute flex ${NODE_CLS} -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl ring-4 transition duration-200 ${
                    enabled
                      ? `z-10 bg-stone-800 shadow-lg ${st.ring} hover:scale-110 hover:brightness-125 active:scale-95`
                      : 'bg-stone-900/70 ring-stone-800/60'
                  } ${isCurrent ? 'animate-pulse !ring-amber-400' : ''} ${n.visited ? 'opacity-35 grayscale' : ''} ${
                    here && !n.visited ? 'brightness-110' : ''
                  }`}
                >
                  <NodeIcon type={n.type} size={34} className={enabled ? '' : 'opacity-50 grayscale'} />
                  <span className={`mt-0.5 text-[9px] font-black uppercase tracking-wide sm:text-[10px] ${enabled ? st.chip : 'text-stone-500'}`}>
                    {n.visited ? '✓' : NODE_NAME[n.type]}
                  </span>
                </button>
              );
            }),
        )}
      </div>

      {/* отступление */}
      <div className="mt-6 text-center">
        {confirmAbandon ? (
          <div className="inline-flex gap-2">
            <button
              onClick={() => dispatch({ type: 'ABANDON' })}
              className="min-h-[44px] rounded-lg bg-red-800/60 px-4 py-2 text-xs font-bold text-red-200 ring-1 ring-red-600/50 hover:bg-red-800/80"
            >
              Точно бросить поход?
            </button>
            <button
              onClick={() => setConfirmAbandon(false)}
              className="min-h-[44px] rounded-lg bg-stone-800 px-4 py-2 text-xs font-bold text-stone-300 ring-1 ring-stone-600"
            >
              Остаться
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmAbandon(true)}
            className="min-h-[44px] rounded-lg px-4 py-2 text-xs text-stone-500 transition hover:text-red-300"
          >
            Отступить в таверну
          </button>
        )}
      </div>
    </div>
  );
}

function BattlePrompt({ node }: { node: RunNode }) {
  const { dispatch } = useGame();
  const isBoss = node.type === 'boss';
  // §3.1.1 волны: передовой отряд + счётчик подмоги
  const allIds = (node.data?.enemyIds ?? []).map((id) => ENEMY_TABLE[id as EnemyKind]).filter(Boolean);
  const shownFoes = isBoss ? allIds : allIds.slice(0, 3);
  const hidden = allIds.length - shownFoes.length;
  const bossName = allIds[0]?.name ?? 'Босс';
  return (
    <section className={`rounded-2xl bg-stone-900/85 p-4 ring-1 ${isBoss ? 'ring-red-700/60' : 'ring-red-900/40'}`}>
      <h3 className="font-runic text-lg font-black text-red-300">
        {isBoss ? `👑 ${bossName} ждёт` : node.type === 'elite' ? '💀 Элитный страж' : '⚔️ Впереди засада'}
      </h3>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
        {shownFoes.map((f, i) => (
          <span key={`${f.id}_${i}`} className="flex items-center gap-1.5 rounded bg-black/40 px-2 py-1">
            <FoeSprite name={f.name} size={20} />
            {f.name}
          </span>
        ))}
        {hidden > 0 && (
          <span className="rounded bg-black/40 px-2 py-1 font-bold text-red-300/90">+{hidden} в подмоге</span>
        )}
      </div>
      <button
        onClick={() => {
          playSfx('crit');
          dispatch({ type: 'START_BATTLE' });
        }}
        className="mt-3 min-h-[48px] w-full rounded-xl bg-red-700 px-6 py-3 text-base font-black text-stone-50 shadow-lg shadow-red-950/50 transition hover:bg-red-600"
      >
        ⚔️ В бой
      </button>
    </section>
  );
}
