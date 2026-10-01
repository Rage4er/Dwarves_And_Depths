// §6.5 Event table — 6 событий, тексты и выборы по ТЗ

import type { Rarity } from '../types';

export type EventCost =
  | { kind: 'hp_all_pct'; pct: number }
  | { kind: 'gold'; amount: number }
  | { kind: 'item'; count: number };

export type EventReward =
  | { kind: 'item'; rarity: Rarity }
  | { kind: 'item_rarity_up' }
  | { kind: 'gold'; amount: number }
  | { kind: 'gold_gamble'; stake: number; win: number; chance: number }
  | { kind: 'dwarf'; price: number }
  | { kind: 'legacy'; amount: number }
  | { kind: 'hp_all_gamble'; goodPct: number; badPct: number; chance: number }
  | { kind: 'item_or_battle'; rarity: Rarity; chance: number }
  | { kind: 'none' };

export interface EventChoice {
  text: string;
  cost?: EventCost;
  reward?: EventReward;
  disabledIf?: 'party_full' | 'inventory_empty' | 'gold_lt_10';
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
}

export const EVENTS: EventDef[] = [
  {
    id: 'ev_altar',
    title: 'Древний алтарь',
    text: 'Древний алтарь. Голос шепчет: «Отдай — и получишь».',
    choices: [
      { text: 'Отдать кровь', cost: { kind: 'hp_all_pct', pct: 20 }, reward: { kind: 'item', rarity: 'rare' } },
      { text: 'Отдать золото', cost: { kind: 'gold', amount: 5 }, reward: { kind: 'item', rarity: 'common' } },
      { text: 'Уйти', reward: { kind: 'none' } },
    ],
  },
  {
    id: 'ev_gambler',
    title: 'Гном-картёжник',
    text: 'Гном-картёжник предлагает сыграть.',
    choices: [
      { text: 'Ставка 10 золота', cost: { kind: 'gold', amount: 10 }, reward: { kind: 'gold_gamble', stake: 10, win: 30, chance: 50 } },
      { text: 'Отказаться', reward: { kind: 'none' } },
    ],
  },
  {
    id: 'ev_forge_spirit',
    title: 'Дух кузнеца',
    text: 'Дух кузнеца предлагает улучшить предмет.',
    choices: [
      { text: 'Отдать 1 предмет', cost: { kind: 'item', count: 1 }, reward: { kind: 'item_rarity_up' }, disabledIf: 'inventory_empty' },
      { text: 'Отдать 15 золота', cost: { kind: 'gold', amount: 15 }, reward: { kind: 'item', rarity: 'rare' } },
      { text: 'Уйти', reward: { kind: 'none' } },
    ],
  },
  {
    id: 'ev_lost_dwarf',
    title: 'Заблудившийся гном',
    text: 'Заблудившийся гном просит о помощи.',
    choices: [
      { text: 'Взять в отряд', cost: { kind: 'gold', amount: 10 }, reward: { kind: 'dwarf', price: 10 }, disabledIf: 'party_full' },
      { text: 'Дать 5 золота', cost: { kind: 'gold', amount: 5 }, reward: { kind: 'legacy', amount: 5 } },
      { text: 'Пройти мимо', reward: { kind: 'none' } },
    ],
  },
  {
    id: 'ev_mushroom',
    title: 'Светящиеся грибы',
    text: 'Светящиеся грибы. Пахнут странно.',
    choices: [
      { text: 'Съесть', reward: { kind: 'hp_all_gamble', goodPct: 30, badPct: 20, chance: 60 } },
      { text: 'Собрать в мешок', reward: { kind: 'item', rarity: 'common' } },
      { text: 'Не трогать', reward: { kind: 'none' } },
    ],
  },
  {
    id: 'ev_prisoner',
    title: 'Пленник',
    text: 'В клетке — враг. Он смотрит на тебя.',
    choices: [
      { text: 'Освободить', reward: { kind: 'item_or_battle', rarity: 'rare', chance: 50 } },
      { text: 'Обыскать', reward: { kind: 'gold', amount: 8 } },
      { text: 'Уйти', reward: { kind: 'none' } },
    ],
  },
];

export function eventById(id: string): EventDef | null {
  return EVENTS.find((e) => e.id === id) ?? null;
}
