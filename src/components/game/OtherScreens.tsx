'use client';

// §4 экраны: 2 «Отряд», 3 «Подготовка», 5 «Награда», 6 «Событие», 7 «Инвентарь», 8 «Смерть»
// и панели узлов карты: лавка (§3.3.2), привал (§3.3.4), кузня (§3.3.3)

import { useState } from 'react';
import { useGame } from '@/lib/game/store';
import { nodeById } from '@/lib/game/logic/run';
import { canEquip, slotLimit } from '@/lib/game/logic/stats';
import {
  DWARF_TABLE, ENEMY_TABLE, defByCatalogId, eventById, forgeCost, nextRarity,
} from '@/lib/game/data';
import type { EventCost, EventDef, EventReward, EnemyKind } from '@/lib/game/data';
import { POSITION_NAME, RARITY_NAME, ROLE_NAME, SLOT_NAME } from '@/lib/game/types';
import type { Dwarf, Equipment, Position } from '@/lib/game/types';
import { DwarfCard, Gold, HpBar, ItemCard } from './bits';
import { DwarfSprite, FoeSprite } from './sprites';
import { playSfx } from '@/lib/game/sfx';

// Почему предмет нельзя надеть ни на кого из живых (порядок причин — как в canEquip)
function whyNotEquip(item: Equipment, dwarves: Dwarf[], maxSlots: number): string {
  const alive = dwarves.filter((d) => d.isAlive);
  if (!alive.length) return 'В отряде нет живых гномов';
  const byRole = item.role === 'any' ? alive : alive.filter((d) => d.role === item.role);
  if (!byRole.length) return `Роль предмета: ${ROLE_NAME[item.role]} — таких гномов в отряде нет`;
  if (byRole.every((d) => d.equipment.some((e) => e.slot === item.slot))) {
    return `Слот «${SLOT_NAME[item.slot]}» занят у всех подходящих — сначала снимите предмет`;
  }
  return `Лимит слотов гнома (${slotLimit(byRole[0], maxSlots)}) — расширяется в кузне за наследие`;
}

// ── Экран 2: сбор отряда (§3.4) ──────────────────────────────────────

export function PartyScreen() {
  const { state, dispatch } = useGame();
  const { meta } = state;
  const [picked, setPicked] = useState<string[]>([]);
  const endless = state.partyEndless;

  const toggle = (id: string) => {
    playSfx('click');
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < meta.maxPartySize ? [...p, id] : p,
    );
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-8">
      <header className="mb-1 text-center">
        <h2 className="font-runic text-2xl font-black text-amber-300">Сбор отряда</h2>
        <p className="mt-1 text-xs text-stone-400">
          Выбрано {picked.length} из {meta.maxPartySize} · новые гномы открываются по мере спуска, продаются в лавках и прячутся в событиях
        </p>
        {endless && (
          <p className="mx-auto mt-2 max-w-md rounded-lg bg-purple-900/40 px-3 py-2 text-xs font-bold text-purple-200 ring-1 ring-purple-600/50">
            ♾️ Бесконечный спуск: карта растёт с каждым слоем, боссы каждые 3 слоя, глубина 100 венчает путь
          </p>
        )}
      </header>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DWARF_TABLE.map((def) => {
          const unlocked = meta.unlockedDwarves.includes(def.id);
          const dead = meta.deadDwarves.includes(def.id); // §3.1.2: павший выбыл навсегда
          const active = picked.includes(def.id);
          return (
            <button
              key={def.id}
              disabled={!unlocked || dead}
              onClick={() => toggle(def.id)}
              className={`rounded-xl p-4 text-left ring-1 transition ${
                active
                  ? 'bg-amber-700/25 ring-2 ring-amber-400'
                  : unlocked && !dead
                    ? 'bg-stone-900/80 ring-stone-700/60 hover:ring-amber-600/60'
                    : 'cursor-not-allowed bg-stone-950/60 opacity-45 ring-stone-800'
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="rounded bg-black/40 ring-1 ring-stone-700/60" aria-hidden>
                  <DwarfSprite name={def.name} size={96} />
                </span>
                <div>
                  <div className="font-runic text-lg font-black text-stone-100">{def.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400/90">
                    {def.unlockFloor <= state.meta.maxFloorEverReached || meta.unlockedDwarves.includes(def.id) ? 'Гном' : '???'}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1 text-[11px] font-semibold text-stone-200">
                <span className="rounded bg-black/40 px-1.5 py-0.5">❤️ {def.baseHP}</span>
                <span className="rounded bg-black/40 px-1.5 py-0.5">⚔️ {def.baseATK}</span>
                <span className="rounded bg-black/40 px-1.5 py-0.5">🛡️ {def.baseDEF}</span>
                <span className="rounded bg-black/40 px-1.5 py-0.5">👟 {def.baseSpeed}</span>
              </div>
              {!unlocked && (
                <div className="mt-2 text-[11px] italic text-stone-500">
                  Откроется на этаже {def.unlockFloor}
                </div>
              )}
              {dead && (
                <div className="mt-2 text-[11px] italic text-red-400/80">
                  ⚰️ Пал в Глубинах — больше не вернётся
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => dispatch({ type: 'GOTO', screen: 'menu' })}
          className="min-h-[48px] rounded-xl bg-stone-800 px-5 py-3 text-sm font-bold text-stone-300 ring-1 ring-stone-600 transition hover:bg-stone-700"
        >
          Назад
        </button>
        <button
          disabled={!picked.length}
          onClick={() => {
            playSfx('open');
            dispatch({
              type: 'START_RUN',
              partyIds: picked,
              seed: Date.now() >>> 0,
              now: Date.now(),
            });
          }}
          className="min-h-[48px] flex-1 rounded-xl bg-amber-600 px-6 py-3 text-lg font-black text-stone-950 shadow-lg shadow-amber-900/40 transition enabled:hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {endless ? 'Начать вечный спуск ♾️' : 'Начать спуск ⛏️'}
        </button>
      </div>
    </div>
  );
}

// ── Экран 3: подготовка к бою ────────────────────────────────────────

export function PrepareScreen() {
  const { state, dispatch } = useGame();
  const run = state.run;
  if (!run) return null;
  const node = nodeById(run, run.currentNodeId);
  if (!node) return null;
  const isBoss = node.type === 'boss';
  const allIds = (node.data?.enemyIds ?? []) as string[];
  // §4.4 v7.0: превью — ТОЛЬКО уникальные типы, без статов и количества
  const foeDefs = [...new Set(allIds)]
    .map((id) => ENEMY_TABLE[id as EnemyKind])
    .filter(Boolean);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className={`font-runic text-2xl font-black ${isBoss ? 'text-red-400' : 'text-amber-300'}`}>
            {isBoss ? '👑 Логово босса' : node.type === 'elite' ? '💀 Элитный страж' : '⚔️ Засада'}
          </h2>
          <p className="text-xs text-stone-500">Этаж {node.floor} · расставьте отряд перед схваткой</p>
        </div>
        <button
          onClick={() => {
            playSfx('click');
            dispatch({ type: 'GOTO', screen: 'inventory' });
          }}
          className="min-h-[44px] rounded-lg bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 ring-1 ring-stone-600 transition hover:bg-stone-700"
        >
          🎒 Рюкзак ({run.inventory.length})
        </button>
      </header>

      <div className="rounded-xl bg-red-950/25 p-3 ring-1 ring-red-900/40">
        <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-red-300/80">Впереди</div>
        <div className="flex flex-wrap gap-2">
          {foeDefs.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg bg-stone-900/80 px-3 py-2 ring-1 ring-red-900/40">
              <span className="shrink-0" aria-hidden>
                <FoeSprite name={f.name} size={56} />
              </span>
              <span className="font-runic text-sm font-bold text-stone-100">{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {run.dwarves.map((d) => (
          <DwarfCard
            key={d.id}
            dwarf={d}
            onOpenInventory={() => dispatch({ type: 'GOTO', screen: 'inventory' })}
            footer={
              <div className="flex gap-1">
                {(['front', 'mid', 'back'] as Position[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => dispatch({ type: 'SET_POSITION', dwarfId: d.id, position: p })}
                    className={`min-h-[36px] flex-1 rounded px-1 py-1 text-[10px] font-bold ring-1 transition ${
                      d.position === p
                        ? 'bg-amber-600/30 text-amber-200 ring-amber-500/60'
                        : 'text-stone-400 ring-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {POSITION_NAME[p]}
                  </button>
                ))}
              </div>
            }
          />
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => dispatch({ type: 'GOTO', screen: 'map' })}
          className="min-h-[48px] rounded-xl bg-stone-800 px-5 py-3 text-sm font-bold text-stone-300 ring-1 ring-stone-600 transition hover:bg-stone-700"
        >
          На карту
        </button>
        <button
          onClick={() => {
            playSfx('crit');
            dispatch({ type: 'START_BATTLE' });
          }}
          className="min-h-[48px] flex-1 rounded-xl bg-red-700 px-6 py-3 text-lg font-black text-stone-50 shadow-lg shadow-red-950/50 transition hover:bg-red-600"
        >
          ⚔️ В бой
        </button>
      </div>
    </div>
  );
}

// ── Экран 5: награда — выбор 1 из 2–3 (§4) ───────────────────────────

export function RewardScreen() {
  const { state, dispatch } = useGame();
  const options = state.rewardOptions;
  if (!options.length) return null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-4 py-10">
      <h2 className="font-runic text-2xl font-black text-amber-300">Добыча побеждённых</h2>
      <p className="mt-1 text-xs text-stone-400">Возьмите одну вещь — остальное достаётся Глубинам</p>
      <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((item, i) => (
          <button
            key={item.id}
            onClick={() => {
              playSfx('coin');
              dispatch({ type: 'REWARD_PICK', index: i });
            }}
            className="rounded-xl text-left transition hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]"
          >
            <ItemCard item={item} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Экран 6: событие (§6.5) ──────────────────────────────────────────

function costText(c: EventCost): string {
  switch (c.kind) {
    case 'hp_all_pct': return `−${c.pct}% HP всему отряду`;
    case 'gold': return `−${c.amount} золота`;
    case 'item': return `−${c.count} предмет(а) из рюкзака`;
  }
}

function rewardText(r: EventReward): string {
  switch (r.kind) {
    case 'item': return `предмет (${RARITY_NAME[r.rarity].toLowerCase()})`;
    case 'item_rarity_up': return 'предмет станет на редкость выше';
    case 'gold': return `+${r.amount} золота`;
    case 'gold_gamble': return `${r.chance}%: +${r.win - r.stake} золота · иначе −${r.stake}`;
    case 'dwarf': return `новый гном за ${r.price} золота`;
    case 'legacy': return `+${r.amount} наследия в конце забега`;
    case 'hp_all_gamble': return `${r.chance}%: +${r.goodPct}% HP · иначе −${r.badPct}% HP`;
    case 'item_or_battle': return `${r.chance}%: предмет · иначе засада`;
    case 'none': return 'без последствий';
  }
}

export function EventScreen() {
  const { state, dispatch } = useGame();
  const run = state.run;
  if (!run) return null;
  const node = nodeById(run, run.currentNodeId);
  const def: EventDef | null = node?.data?.eventId ? eventById(node.data.eventId) : null;
  if (!node || !def) return null;

  const chosen = state.eventResult !== null;

  const disabled = (i: number) => {
    const c = def.choices[i];
    if (chosen) return true;
    if (c.disabledIf === 'party_full' && run.dwarves.length >= 10) return true;
    if (c.disabledIf === 'inventory_empty' && run.inventory.length === 0) return true;
    if (c.disabledIf === 'gold_lt_10' && run.gold < 10) return true;
    if (c.cost?.kind === 'gold' && run.gold < c.cost.amount) return true;
    if (c.cost?.kind === 'item' && run.inventory.length < c.cost.count) return true;
    return false;
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10">
      <div className="rounded-2xl bg-stone-900/85 p-6 ring-1 ring-sky-800/40">
        <div className="text-[11px] font-black uppercase tracking-widest text-sky-400/80">Событие</div>
        <h2 className="mt-1 font-runic text-2xl font-black text-sky-200">{def.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-300">{def.text}</p>

        {!chosen ? (
          <div className="mt-5 space-y-2">
            {def.choices.map((c, i) => (
              <button
                key={i}
                disabled={disabled(i)}
                onClick={() => {
                  playSfx('magic');
                  dispatch({ type: 'EVENT_CHOICE', index: i });
                }}
                className="w-full rounded-xl bg-stone-800/80 px-4 py-3 text-left ring-1 ring-stone-600/60 transition enabled:hover:bg-stone-700 enabled:hover:ring-sky-600/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="text-sm font-bold text-stone-100">{c.text}</div>
                <div className="mt-0.5 text-[11px] text-stone-400">
                  {[c.cost ? costText(c.cost) : null, c.reward ? rewardText(c.reward) : null]
                    .filter(Boolean)
                    .join(' → ')}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <div className="rounded-xl bg-black/40 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-700/40">
              {state.eventResult}
            </div>
            <button
              onClick={() => {
                playSfx('click');
                dispatch({ type: 'EVENT_CONTINUE' });
              }}
              className="mt-4 min-h-[48px] w-full rounded-xl bg-amber-600 px-6 py-3 text-base font-black text-stone-950 transition hover:bg-amber-500"
            >
              Дальше
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Экран 7: инвентарь ───────────────────────────────────────────────

export function InventoryScreen() {
  const { state, dispatch } = useGame();
  const run = state.run;
  if (!run) return null;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-4xl px-4 pb-16 pt-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-runic text-2xl font-black text-amber-300">Рюкзак</h2>
          <p className="text-xs text-stone-500">{run.inventory.length} предметов · лимит 100, при переполнении худшее продаётся само</p>
        </div>
        <div className="flex items-center gap-3">
          <Gold amount={run.gold} />
          <button
            onClick={() => {
              playSfx('click');
              dispatch({ type: 'GOTO', screen: 'map' });
            }}
            className="min-h-[44px] rounded-lg bg-stone-800 px-3 py-2 text-xs font-bold text-stone-200 ring-1 ring-stone-600 transition hover:bg-stone-700"
          >
            На карту
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {run.inventory.map((item) => {
          const fits = run.dwarves.filter((d) => d.isAlive && canEquip(item, d, state.meta.maxSlots));
          return (
            <ItemCard
              key={item.id}
              item={item}
              actions={
                fits.length ? (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        playSfx('forge');
                        dispatch({ type: 'EQUIP', dwarfId: e.target.value, itemId: item.id });
                      }
                    }}
                    className="min-h-[32px] rounded bg-stone-800 px-1.5 py-1 text-[11px] text-amber-200 ring-1 ring-amber-700/40"
                  >
                    <option value="">Надеть на…</option>
                    {fits.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({ROLE_NAME[d.role]})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[10px] italic text-stone-500">{whyNotEquip(item, run.dwarves, state.meta.maxSlots)}</span>
                )
              }
            />
          );
        })}
        {run.inventory.length === 0 && (
          <p className="col-span-full py-8 text-center text-xs italic text-stone-500">
            Пусто. Добыча ждёт в глубинах.
          </p>
        )}
      </div>

      <h3 className="mb-2 mt-8 text-sm font-black uppercase tracking-wide text-stone-300">Отряд</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {run.dwarves.map((d) => (
          <DwarfCard
            key={d.id}
            dwarf={d}
            onUnequip={(slot) => {
              playSfx('click');
              dispatch({ type: 'UNEQUIP', dwarfId: d.id, slot });
            }}
            footer={
              <div className="text-[10px] text-stone-500">
                Слоты: {d.equipment.length}/{slotLimit(d, state.meta.maxSlots)}
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

// ── Экран 8: смерть гнома (§3.1.2) ───────────────────────────────────

export function DeathScreen() {
  const { state, dispatch } = useGame();
  const names = state.deathNames;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <div aria-hidden className="flex items-end justify-center gap-3">
        {names.slice(0, 3).map((n) => (
          <span key={n} className="inline-block -rotate-90 opacity-70 grayscale">
            <DwarfSprite name={n} size={56} />
          </span>
        ))}
      </div>
      <h2 className="mt-4 font-runic text-2xl font-black text-red-400">
        {names.length > 1 ? 'Гномы пали' : 'Гном пал'}
      </h2>
      <p className="mt-2 text-sm font-bold text-stone-200">{names.join(', ')}</p>
      <p className="mt-2 max-w-xs text-sm text-stone-400">
        В Глубинах нет возврата: павший выбывает навсегда, а его снаряжение оседает в рюкзаке.
      </p>
      <button
        onClick={() => {
          playSfx('click');
          dispatch({ type: 'DEATH_CONTINUE' });
        }}
        className="mt-6 min-h-[48px] w-full max-w-xs rounded-xl bg-amber-600 px-6 py-3 text-base font-black text-stone-950 transition hover:bg-amber-500"
      >
        Дальше
      </button>
    </div>
  );
}

// ── Панели узлов карты ───────────────────────────────────────────────

export function ShopPanel() {
  const { state, dispatch } = useGame();
  const run = state.run!;
  const node = nodeById(run, run.currentNodeId);
  const stock = node?.data?.shopStock ?? [];

  return (
    <PanelShell title="🛒 Лавка" subtitle="Товар меняется от этажа к этажу">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {stock.map((entry, i) => {
          if (entry.type === 'dwarf') {
            return (
              <div key={`${entry.type}_${i}`} className="rounded-lg bg-stone-900/80 p-3 ring-1 ring-emerald-800/40">
                <div className="text-sm font-bold text-stone-100">🧔 Случайный гном</div>
                <div className="mt-0.5 text-[11px] text-stone-400">Присоединится к отряду сразу</div>
                <button
                  disabled={run.gold < entry.price || run.dwarves.length >= 10}
                  onClick={() => {
                    playSfx('coin');
                    dispatch({ type: 'BUY', index: i });
                  }}
                  className="mt-2 min-h-[40px] w-full rounded-lg bg-emerald-700/40 px-3 py-2 text-xs font-bold text-emerald-200 ring-1 ring-emerald-600/50 transition enabled:hover:bg-emerald-700/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {entry.price} 🪙
                </button>
              </div>
            );
          }
          const def = defByCatalogId(entry.id);
          if (!def) return null;
          return (
            <div key={`${entry.id}_${i}`} className="rounded-lg bg-stone-900/80 p-3 ring-1 ring-stone-700/50">
              <div className="text-sm font-bold text-stone-100">{def.name}</div>
              <div className="text-[10px] uppercase tracking-wide text-stone-500">
                {RARITY_NAME[def.rarity]}
              </div>
              <button
                disabled={run.gold < entry.price}
                onClick={() => {
                  playSfx('coin');
                  dispatch({ type: 'BUY', index: i });
                }}
                className="mt-2 min-h-[40px] w-full rounded-lg bg-amber-700/40 px-3 py-2 text-xs font-bold text-amber-200 ring-1 ring-amber-600/50 transition enabled:hover:bg-amber-700/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {entry.price} 🪙
              </button>
            </div>
          );
        })}
        {stock.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs italic text-stone-500">Лавка пуста.</p>
        )}
      </div>
      <LeaveButton />
    </PanelShell>
  );
}

export function RestPanel() {
  const { state, dispatch } = useGame();
  const run = state.run!;
  const [used, setUsed] = useState<number | null>(null);

  const pick = (i: number) => {
    playSfx('heal');
    setUsed(i);
    dispatch({ type: 'REST_CHOICE', index: i });
  };

  return (
    <PanelShell title="🔥 Привал" subtitle="Передышка перед следующим спуском">
      {used === null ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={() => pick(0)}
            className="rounded-xl bg-stone-900/80 p-4 text-left ring-1 ring-teal-700/50 transition hover:bg-stone-800"
          >
            <div className="text-sm font-black text-teal-200">Отдых у костра</div>
            <div className="mt-1 text-[11px] text-stone-400">Живые гномы восстанавливают 50% здоровья</div>
          </button>
          <button
            onClick={() => pick(1)}
            className="rounded-xl bg-stone-900/80 p-4 text-left ring-1 ring-teal-700/50 transition hover:bg-stone-800"
          >
            <div className="text-sm font-black text-teal-200">Целебные зелья</div>
            <div className="mt-1 text-[11px] text-stone-400">Снять все эффекты с отряда (яд, горение…)</div>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {run.dwarves.map((d) => (
            <div key={d.id} className="rounded-lg bg-stone-900/80 p-2.5 ring-1 ring-stone-700/50">
              <div className="flex items-center justify-between text-xs font-bold text-stone-200">
                <span>{d.name}</span>
                <span className="tabular-nums text-stone-400">{Math.max(0, d.currentHP)} HP</span>
              </div>
              <div className="mt-1.5">
                <HpBar hp={d.currentHP} hpMax={d.baseHP + d.equipment.reduce((s, e) => s + e.hp, 0)} />
              </div>
            </div>
          ))}
        </div>
      )}
      <LeaveButton />
    </PanelShell>
  );
}

export function ForgePanel() {
  const { state, dispatch } = useGame();
  const run = state.run!;

  return (
    <PanelShell title="🔨 Кузня" subtitle="Перековка поднимает редкость предмета (§3.3.3)">
      {run.inventory.length === 0 ? (
        <p className="py-4 text-center text-xs italic text-stone-500">Рюкзак пуст — ковать нечего.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {run.inventory.map((item) => {
            const next = nextRarity(item.rarity);
            const cost = forgeCost(item.rarity);
            return (
              <ItemCard
                key={item.id}
                item={item}
                compact
                actions={
                  next ? (
                    <button
                      disabled={run.gold < cost}
                      onClick={() => {
                        playSfx('forge');
                        dispatch({ type: 'FORGE', itemId: item.id });
                      }}
                      className="min-h-[36px] rounded bg-orange-700/40 px-2 py-1.5 text-[11px] font-bold text-orange-200 ring-1 ring-orange-600/50 transition enabled:hover:bg-orange-700/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Перековать → {RARITY_NAME[next]} · {cost} 🪙
                    </button>
                  ) : (
                    <span className="text-[10px] italic text-amber-400/70">Легендарное — выше некуда</span>
                  )
                }
              />
            );
          })}
        </div>
      )}
      <LeaveButton />
    </PanelShell>
  );
}

function PanelShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-stone-900/85 p-4 ring-1 ring-amber-800/40">
      <div className="mb-3">
        <h3 className="font-runic text-lg font-black text-amber-300">{title}</h3>
        <p className="text-[11px] text-stone-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function LeaveButton() {
  const { dispatch } = useGame();
  return (
    <button
      onClick={() => {
        playSfx('click');
        dispatch({ type: 'LEAVE_NODE' });
      }}
      className="mt-4 min-h-[48px] w-full rounded-xl bg-amber-600 px-6 py-3 text-base font-black text-stone-950 transition hover:bg-amber-500"
    >
      Идти дальше ⬇
    </button>
  );
}
