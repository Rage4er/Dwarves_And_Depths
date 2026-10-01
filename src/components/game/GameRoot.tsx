'use client';

// §4: корневой роутер по ScreenId + тосты разблокировок + отчёт об офлайне

import { useEffect, useState } from 'react';
import { useGame } from '@/lib/game/store';
import { MenuScreen } from './MenuScreen';
import { MapScreen } from './MapScreen';
import { BattleScreen } from './BattleScreen';
import { EndScreen } from './EndScreen';
import {
  DeathScreen, EventScreen, InventoryScreen, PartyScreen, PrepareScreen, RewardScreen,
} from './OtherScreens';
import { DwarfSprite } from './sprites';
import { playSfx } from '@/lib/game/sfx';

export function GameRoot() {
  const { state, dispatch } = useGame();
  const [offlineSeen, setOfflineSeen] = useState(false);

  useEffect(() => {
    const beforeUnload = () => {
      try {
        localStorage.setItem('gnomes_seen_v1', String(Date.now()));
      } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  // звук при появлении тостов (разблокировки §3.3.5.1)
  useEffect(() => {
    if (state.toasts.length > 0) playSfx('levelup');
  }, [state.toasts.length]);

  // автозакрытие тостов
  useEffect(() => {
    if (!state.toasts.length) return;
    const t = setTimeout(() => {
      for (const toast of state.toasts) dispatch({ type: 'DISMISS_TOAST', id: toast.id });
    }, 4500);
    return () => clearTimeout(t);
  }, [state.toasts, dispatch]);

  if (!state.loaded) {
    return (
      <div className="scene scene-depths flex min-h-dvh items-center justify-center text-stone-500">
      <div className="flex items-center justify-center gap-3 text-stone-500">
        <span className="animate-march inline-block">
          <DwarfSprite name="Бром" roleBias="tank" size={64} />
        </span>
        <span className="animate-pulse font-runic text-lg">Кузница греется…</span>
      </div>
      </div>
    );
  }

  const scene =
    state.screen === 'battle' ? 'scene-cavern'
    : state.screen === 'menu' || state.screen === 'party' || state.screen === 'end' ? 'scene-tavern'
    : 'scene-depths';

  const content = (() => {
    switch (state.screen) {
      case 'battle': return state.battle ? <BattleScreen /> : <MenuScreen />;
      case 'party': return <PartyScreen />;
      case 'prepare': return state.run ? <PrepareScreen /> : <MenuScreen />;
      case 'reward': return state.rewardOptions.length ? <RewardScreen /> : <MenuScreen />;
      case 'event': return <EventScreen />;
      case 'inventory': return state.run ? <InventoryScreen /> : <MenuScreen />;
      case 'death': return <DeathScreen />;
      case 'end': return <EndScreen />;
      case 'map': return state.run ? <MapScreen /> : <MenuScreen />;
      default: return <MenuScreen />;
    }
  })();

  return (
    <div className={`scene ${scene}`}>
      {content}

      {/* отчёт об офлайне: наследие + «сон кузницы» (§3.2) */}
      {state.offline && state.screen === 'menu' && !offlineSeen && (
        <OfflineReport
          legacy={state.offline.legacy}
          itemCount={state.offline.items}
          onClose={() => setOfflineSeen(true)}
        />
      )}

      {/* тосты разблокировок */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {state.toasts.map((t) => (
          <div
            key={t.id}
            className="animate-pop pointer-events-auto max-w-sm rounded-xl bg-amber-600/95 px-4 py-3 text-sm font-bold text-stone-950 shadow-lg shadow-amber-950/50 ring-2 ring-amber-300/60"
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function OfflineReport({ legacy, itemCount, onClose }: { legacy: number; itemCount: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-stone-900 p-6 ring-1 ring-amber-700/50">
        <div className="text-center text-4xl" aria-hidden>💤</div>
        <h3 className="mt-2 text-center font-runic text-xl font-black text-amber-300">Пока вас не было…</h3>
        <p className="mt-2 text-center text-sm text-stone-300">
          Кузница стучала без остановки: <b className="text-amber-300">+{legacy} наследия</b>
          {itemCount > 0 && <> и <b className="text-amber-300">{itemCount} шт.</b> со снаряжением</>}
          {' '}ушли в закрома.
        </p>
        <button
          onClick={onClose}
          className="mt-5 min-h-[48px] w-full rounded-xl bg-amber-600 px-4 py-3 text-base font-black text-stone-950 transition hover:bg-amber-500"
        >
          Отлично
        </button>
      </div>
    </div>
  );
}
