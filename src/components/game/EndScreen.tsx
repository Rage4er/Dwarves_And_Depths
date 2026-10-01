'use client';

// §4 экран 9 «Итоги забега»: статус, статы, наследие (§3.3.1), бесконечный спуск

import { useEffect } from 'react';
import { useGame } from '@/lib/game/store';
import { ENDLESS_BONUS_LEGACY, legacyGain, mapDepth } from '@/lib/game/logic/run';
import type { BattleEndReason } from '@/lib/game/types';
import { DwarfSprite } from './sprites';
import { playSfx } from '@/lib/game/sfx';

// §4.3 v6.9: варианты финала экрана 9 — иконка, заголовок и эпитафия по run.endReason
const FINALS: Record<Exclude<BattleEndReason, null>, { icon: string; title: string; epitaph: (floor: number) => string }> = {
  victory: { icon: '👑', title: 'Победа!', epitaph: () => 'Гномы вернулись с добычей.' },
  defeat: { icon: '🛡️', title: 'Поражение', epitaph: () => 'Гномы пали в бою.' },
  timeout_collapse: {
    icon: '🪨',
    title: 'Обвал',
    epitaph: (f) => `Пещера обрушилась на глубине ${f}. Гномы погребены заживо.`,
  },
  timeout_ancient: {
    icon: '👁️',
    title: 'Пробуждение Древнего',
    epitaph: (f) => `Древний пробудился на глубине ${f}. Гномы пали перед тем, кто старше мира.`,
  },
  abandoned: { icon: '👣', title: 'Отступление', epitaph: () => 'Гномы отступили. Глубины запомнят.' },
};

export function EndScreen() {
  const { state, dispatch } = useGame();
  const run = state.run;
  if (!run) return null;

  const won = run.status === 'victory' || run.status === 'victory_endless';
  const endlessWin = run.status === 'victory_endless';
  const gain = legacyGain(run) + (endlessWin ? ENDLESS_BONUS_LEGACY : 0);
  const depth = mapDepth(run);

  useEffect(() => {
    playSfx(won ? 'victory' : 'defeat');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // §4.3: финал по endReason; victory_endless — приоритетная ветка над victory-эпитафией
  const fin = endlessWin
    ? { icon: '♾️', title: 'БЕЗДНА ПОКОРЕНА!', epitaph: () => '' }
    : FINALS[run.endReason ?? (won ? 'victory' : run.status === 'abandoned' ? 'abandoned' : 'defeat')];
  const titleColor = won
    ? 'text-amber-300'
    : run.endReason === 'timeout_ancient'
      ? 'text-purple-300'
      : run.status === 'abandoned'
        ? 'text-stone-300'
        : 'text-red-400';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <div className="flex items-end justify-center gap-1" aria-hidden>
        {won
          ? run.dwarves.slice(0, 5).map((d, i) => (
              <span key={d.id} className="animate-march inline-block" style={{ animationDelay: `${i * 0.12}s` }}>
                <DwarfSprite name={d.name} roleBias={d.roleBias} size={i === 0 ? 76 : 58} />
              </span>
            ))
          : run.dwarves.slice(0, 4).map((d) => (
              <span
                key={d.id}
                className={`inline-block ${d.isAlive ? '' : '-rotate-90 opacity-60 grayscale'}`}
              >
                <DwarfSprite name={d.name} roleBias={d.roleBias} size={run.status === 'abandoned' ? 58 : 50} />
              </span>
            ))}
      </div>
      <div className="text-4xl drop-shadow" aria-hidden>{fin.icon}</div>
      <h2 className={`text-center font-runic text-3xl font-black ${titleColor}`}>
        {fin.title}
      </h2>
      <p className="max-w-xs text-sm text-stone-400">
        {endlessWin
          ? `Слой ${depth} пройден от начала до конца. Молоты затихают — но Глубины запомнят это поколение! (+${ENDLESS_BONUS_LEGACY} наследия)`
          : fin.epitaph(run.floor)}
      </p>

      <div className="w-full space-y-1.5 rounded-xl bg-stone-900/70 p-4 text-sm ring-1 ring-stone-700/60">
        <Row label="Этаж" value={`${run.floor} / ${depth}`} />
        {run.isEndless && <Row label="Слоёв пройдено" value={String(run.endlessFloor)} />}
        <Row label="Отряд" value={`${run.dwarves.filter((d) => d.isAlive).length} живых из ${run.dwarves.length}`} />
        <Row label="Элит повержено" value={String(run.elitesKilled)} />
        <Row label="Боссов повержено" value={String(run.bossesKilled)} />
        <Row label="Золото" value={`${run.gold} 🪙`} />
        {(run.endReason === 'timeout_collapse' || run.endReason === 'timeout_ancient') && (
          <Row label="Причина поражения" value="последний бой не решён за лимит ходов" />
        )}
        <div className="mt-2 border-t border-stone-700/60 pt-2">
          <Row label="Наследие получено" value={<b className="text-amber-300">+{gain}</b>} />
        </div>
      </div>

      {won && state.meta.endlessUnlocked && (
        <button
          onClick={() => {
            playSfx('open');
            dispatch({ type: 'CONTINUE_ENDLESS' });
          }}
          className="w-full rounded-xl bg-purple-700/60 px-6 py-4 text-lg font-black text-purple-100 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/40 transition hover:bg-purple-600/70"
        >
          ♾️ Спускаться дальше
          <span className="mt-0.5 block text-[11px] font-semibold text-purple-300/80">
            тот же отряд, глубина растёт, HP восстановлено
          </span>
        </button>
      )}

      <button
        onClick={() => {
          playSfx('click');
          dispatch({ type: 'END_TO_MENU' });
        }}
        className={`min-h-[52px] w-full rounded-xl px-6 py-4 text-lg font-black shadow-lg transition ${
          won && state.meta.endlessUnlocked
            ? 'bg-stone-800 text-stone-200 ring-1 ring-stone-600 hover:bg-stone-700'
            : 'bg-amber-600 text-stone-950 shadow-amber-900/40 hover:bg-amber-500'
        }`}
      >
        В таверну 🍺
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-400">{label}</span>
      <span className="font-bold text-stone-200">{value}</span>
    </div>
  );
}
