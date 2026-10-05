'use client';

import type { Dwarf, Equipment } from '@/lib/game/types';
import { POSITION_NAME, RARITY_COLOR, RARITY_NAME, ROLE_NAME, SLOT_NAME, EFFECT_NAME } from '@/lib/game/types';
import { dwarfStats } from '@/lib/game/logic/stats';
import { sellPrice } from '@/lib/game/data';
import { CoinIcon, DwarfSprite, ItemIcon } from './sprites';

export function HpBar({ hp, hpMax, className = '' }: { hp: number; hpMax: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (hp / hpMax) * 100));
  const color = pct > 55 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-600';
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-black/60 ring-1 ring-black/40 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-300">
      <span className="text-stone-500">{label}</span>
      {value}
    </span>
  );
}

export function effectList(item: Equipment): string[] {
  return item.effects.map((f) => {
    if (f.type === 'extra_slot') return EFFECT_NAME[f.type];
    if (f.type === 'hp_regen') return `${EFFECT_NAME[f.type]} ${f.value}/ход`;
    if (f.type === 'poison' || f.type === 'burn') {
      return `${EFFECT_NAME[f.type]} ${f.value}/ход${f.chance ? ` (${f.chance}%)` : ''}`;
    }
    if (f.type === 'taunt') return `${EFFECT_NAME[f.type]} ${f.value} хода`;
    if (f.type === 'stun' || f.type === 'double_strike') return `${EFFECT_NAME[f.type]} ${f.value}%`;
    return `${EFFECT_NAME[f.type]} +${f.value}%`;
  });
}

const STATUS_ICON: Record<string, string> = { poison: '☠️', burn: '🔥', stun: '💫', bleed: '🩸' };

export function DwarfCard({
  dwarf,
  onUnequip,
  onOpenInventory,
  footer,
  compact = false,
}: {
  dwarf: Dwarf;
  onUnequip?: (slot: Equipment['slot']) => void;
  onOpenInventory?: () => void;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  const stats = dwarfStats(dwarf);
  const dead = !dwarf.isAlive || dwarf.currentHP <= 0;
  return (
    <div
      className={`rounded-lg border border-stone-700/70 bg-stone-900/80 p-3 ${dead ? 'opacity-50 grayscale' : ''} ${
        compact ? '' : 'min-w-[180px]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded bg-black/40 ring-1 ring-stone-700/60" aria-hidden>
          <DwarfSprite name={dwarf.name} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-stone-100">{dwarf.name}</div>
          <div className="text-[10px] uppercase tracking-wide text-amber-400/80">
            {ROLE_NAME[dwarf.role]} · {POSITION_NAME[dwarf.position]}
          </div>
        </div>
        {onOpenInventory && (
          <button
            onClick={onOpenInventory}
            className="shrink-0 rounded bg-amber-700/30 px-2 py-1.5 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-600/40 transition hover:bg-amber-700/50"
          >
            Снарядить
          </button>
        )}
      </div>
      <div className="mt-2">
        <HpBar hp={dwarf.currentHP} hpMax={stats.hp} />
        <div className="mt-1 flex flex-wrap gap-1">
          <StatChip label="НР" value={`${Math.max(0, dwarf.currentHP)}/${stats.hp}`} />
          <StatChip label="АТК" value={stats.atk} />
          <StatChip label="ЗАЩ" value={stats.def} />
        </div>
      </div>
      {dwarf.statusEffects.length > 0 && (
        <div className="mt-1 flex gap-1 text-[10px]">
          {dwarf.statusEffects.map((s) => (
            <span key={s.id} title={s.type}>
              {STATUS_ICON[s.type] ?? '💫'} {s.remainingTurns}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 space-y-1">
        {dwarf.equipment.length === 0 && (
          <div className="text-[11px] italic text-stone-500">Снаряжения нет — голыми руками по Глубинам</div>
        )}
        {dwarf.equipment.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-2 rounded bg-black/30 px-2 py-1">
            <span className="truncate text-[11px] text-stone-300">
              <span style={{ color: RARITY_COLOR[e.rarity] }}>◆</span> {e.name}
            </span>
            {onUnequip && (
              <button
                onClick={() => onUnequip(e.slot)}
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-stone-400 ring-1 ring-stone-600/50 transition hover:bg-stone-700/40 hover:text-stone-200"
              >
                снять
              </button>
            )}
          </div>
        ))}
      </div>
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}

export function ItemCard({
  item,
  actions,
  compact = false,
}: {
  item: Equipment;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  const rc = RARITY_COLOR[item.rarity];
  return (
    <div
      className={`rounded-lg border bg-stone-900/80 p-2.5 shadow-sm ${compact ? '' : 'min-w-[180px]'}`}
      style={{ borderColor: `${rc}55` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="slot-frame shrink-0 rounded p-1 ring-1" style={{ borderColor: `${rc}88` }}>
            <ItemIcon itemId={item.id} size={32} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-stone-100">{item.name}</div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: rc }}>
              {RARITY_NAME[item.rarity]} · {SLOT_NAME[item.slot]} · ст. {item.stage}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {item.atk !== 0 && <StatChip label="АТК" value={`${item.atk > 0 ? '+' : ''}${item.atk}`} />}
        {item.def !== 0 && <StatChip label="ЗАЩ" value={`${item.def > 0 ? '+' : ''}${item.def}`} />}
        {item.hp !== 0 && <StatChip label="НР" value={`${item.hp > 0 ? '+' : ''}${item.hp}`} />}
      </div>
      {item.effects.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {effectList(item).map((t, i) => (
            <li key={i} className="text-[11px] text-amber-300/90">
              ◆ {t}
            </li>
          ))}
        </ul>
      )}
      {actions && <div className="mt-2 flex flex-wrap gap-1.5">{actions}</div>}
    </div>
  );
}

export function SellPrice({ item }: { item: Equipment }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-300">
      {sellPrice(item)} <CoinIcon size={13} />
    </span>
  );
}

export function Gold({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
      <CoinIcon size={15} />
      {amount}
    </span>
  );
}
