'use client';

// §4 экран 1 «Главное меню»: поход, кузница наследия (§3.5), справка

import { useState } from 'react';
import { useGame } from '@/lib/game/store';
import { SMITHY_UPGRADES, upgradeCost } from '@/lib/game/data';
import { DWARF_TABLE } from '@/lib/game/data';
import { playSfx } from '@/lib/game/sfx';
import { CoinIcon, DwarfSprite } from './sprites';

export function MenuScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<'main' | 'legacy' | 'help'>('main');
  const { meta, run } = state;

  const go = (t: 'main' | 'legacy' | 'help') => {
    playSfx('click');
    setTab(t);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center px-4 py-10">
      <div className="mb-2 flex items-end justify-center gap-1" aria-hidden>
        {DWARF_TABLE.slice(0, 6).map((d, i) => (
          <span key={d.id} className="animate-march inline-block" style={{ animationDelay: `${i * 0.12}s` }}>
            <DwarfSprite name={d.name} roleBias={d.roleBias} size={i === 0 ? 84 : 64} />
          </span>
        ))}
      </div>
      <h1 className="text-center font-runic text-4xl font-black tracking-tight text-amber-300 drop-shadow-[0_2px_12px_rgba(217,164,65,0.25)]">
        ГНОМЫ И ГЛУБИНЫ
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-stone-400">
        Собери отряд и спускайся: глубина растёт с каждым повержённым боссом, элитные стражи сторожат проходы, а в конце — Сердце Глубин и Демон Кузни.
      </p>

      <div className="mt-6 flex gap-2">
        {(['main', 'legacy', 'help'] as const).map((t) => (
          <button
            key={t}
            onClick={() => go(t)}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-bold ring-1 transition ${
              tab === t
                ? 'bg-amber-600/20 text-amber-200 ring-amber-500/50'
                : 'bg-stone-900/60 text-stone-400 ring-stone-700/50 hover:text-stone-200'
            }`}
          >
            {t === 'main' ? 'Поход' : t === 'legacy' ? `Кузница (${meta.legacy})` : 'Как играть'}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        <div className="mt-8 w-full max-w-sm space-y-3">
          {run && run.status === 'active' && (
            <button
              onClick={() => dispatch({ type: 'GOTO', screen: 'map' })}
              className="w-full rounded-xl bg-amber-600 px-6 py-4 text-lg font-black text-stone-950 shadow-lg shadow-amber-900/40 transition hover:bg-amber-500"
            >
              ⛏️ Продолжить спуск · этаж {run.floor}
            </button>
          )}
          <button
            onClick={() => {
              playSfx('open');
              dispatch({ type: 'OPEN_PARTY' });
            }}
            className={`w-full rounded-xl px-6 py-4 font-runic text-lg font-black shadow-lg transition ${
              run && run.status === 'active'
                ? 'bg-stone-800 text-stone-200 ring-1 ring-stone-600 hover:bg-stone-700'
                : 'bg-amber-600 text-stone-950 shadow-amber-900/40 hover:bg-amber-500'
            }`}
          >
            🧭 Новый поход
          </button>
          {meta.endlessUnlocked && (
            <button
              onClick={() => {
                playSfx('open');
                dispatch({ type: 'OPEN_PARTY', endless: true });
              }}
              className="w-full rounded-xl bg-purple-700/40 px-6 py-3 text-sm font-black text-purple-200 ring-1 ring-purple-500/50 transition hover:bg-purple-700/60"
            >
              ♾️ Бесконечный спуск
              <span className="mt-0.5 block text-[11px] font-semibold text-purple-300/70">
                Рекорд глубины: {meta.maxDepthEver} · боссы каждые 3 слоя
              </span>
            </button>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs text-stone-400 sm:grid-cols-4">
            <div className="rounded-lg bg-stone-900/60 p-3 ring-1 ring-stone-800">
              <div className="text-xl font-black text-stone-200">{meta.runCount}</div>
              походов
            </div>
            <div className="rounded-lg bg-stone-900/60 p-3 ring-1 ring-stone-800">
              <div className="text-xl font-black text-amber-300">{meta.maxFloorEverReached}</div>
              лучший этаж
            </div>
            <div className="rounded-lg bg-stone-900/60 p-3 ring-1 ring-stone-800">
              <div className="text-xl font-black text-stone-200">{meta.bossesKilledTotal}</div>
              боссов повержено
            </div>
            <div className="rounded-lg bg-stone-900/60 p-3 ring-1 ring-stone-800">
              <div className="text-xl font-black text-amber-300">{meta.legacy}</div>
              наследия
            </div>
          </div>
          {(meta.unlocks.autoBattle || meta.unlocks.autoRepeat || meta.unlocks.autoEquip) && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-1 text-[11px]">
              {meta.unlocks.autoBattle && (
                <span className="rounded-full bg-emerald-900/40 px-2.5 py-1 font-semibold text-emerald-300 ring-1 ring-emerald-700/50">
                  ⚡ Авто-бой
                </span>
              )}
              {meta.unlocks.autoRepeat && (
                <span className="rounded-full bg-emerald-900/40 px-2.5 py-1 font-semibold text-emerald-300 ring-1 ring-emerald-700/50">
                  🔁 Авто-повтор
                </span>
              )}
              {meta.unlocks.autoEquip && (
                <span className="rounded-full bg-emerald-900/40 px-2.5 py-1 font-semibold text-emerald-300 ring-1 ring-emerald-700/50">
                  🎒 Авто-экипировка
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'legacy' && (
        <div className="mt-6 w-full space-y-2">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-stone-900/70 px-4 py-3 ring-1 ring-stone-800">
            <span className="text-sm font-bold text-stone-300">Наследие предков</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
              <CoinIcon size={15} />
              {meta.legacy}
            </span>
          </div>
          {SMITHY_UPGRADES.map((def) => {
            const level = meta[def.metaField];
            const cost = upgradeCost(def.baseCost, level);
            const maxed = level >= def.maxLevel;
            return (
              <div key={def.id} className="flex items-center justify-between gap-3 rounded-lg bg-stone-900/70 p-3 ring-1 ring-stone-800">
                <div>
                  <div className="text-sm font-bold text-stone-100">
                    {def.name} <span className="text-amber-400">ур. {level}</span>
                  </div>
                  <div className="text-[11px] text-stone-400">{def.effectPerLevel}</div>
                </div>
                <button
                  disabled={maxed || meta.legacy < cost}
                  onClick={() => {
                    playSfx('coin');
                    dispatch({ type: 'SMITHY_BUY', id: def.id });
                  }}
                  className="shrink-0 rounded-lg bg-amber-700/40 px-3 py-2 text-xs font-bold text-amber-200 ring-1 ring-amber-600/50 transition enabled:hover:bg-amber-700/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {maxed ? 'МАКС' : (
                    <span className="inline-flex items-center gap-1">
                      {Math.ceil(cost)} <CoinIcon size={12} />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          <p className="pt-1 text-center text-[11px] italic text-stone-500">
            Уровень кузницы также усиливает отряд в бою и «сон кузницы» между походами.
          </p>
        </div>
      )}

      {tab === 'help' && (
        <div className="mt-6 w-full space-y-3 rounded-xl bg-stone-900/70 p-5 text-sm leading-relaxed text-stone-300 ring-1 ring-stone-800">
          <p><b className="text-amber-300">Карта.</b> На каждом этаже — 1–3 пути: бой, событие, лавка, привал или кузня. Глубина растёт (8 + повержённые боссы), а перед боссом гарантированно встретится лавка или привал. После победы над Демоном Кузни открывается бесконечный спуск.</p>
          <p><b className="text-amber-300">Отряд.</b> Гном занимает линию: авангард принимает +50% урона, тыл — лишь половину. Роль задаёт лучшее оружие: страж провоцирует и держит удар, маг поджигает, стрелок бьёт издалека.</p>
          <p><b className="text-amber-300">Бой.</b> Автоматический, по инициативе. Горение, яд, оглушение, вампиризм, удары по площади. Бой на лимите ходов — поражение, у босса лимит больше.</p>
          <p><b className="text-amber-300">Смерть.</b> Павший гном выбывает навсегда, его снаряжение падает в рюкзак. Проигранный бой завершает поход — но в бесконечном спуске отряд возрождается новым поколением, а глубина не сбрасывается.</p>
          <p><b className="text-amber-300">Таверна.</b> Пока вас нет, кузня работает: наследие капает само (до 8 часов), а «сон кузницы» приносит предметы. После 3/5/7 походов открываются авто-бой, авто-повтор и авто-экипировка.</p>
        </div>
      )}
    </div>
  );
}
