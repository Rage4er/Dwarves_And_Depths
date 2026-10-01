// §3.5 Экономика кузницы — апгрейды как данные

import type { MetaState } from '../types';

export type UpgradableMetaField =
  | 'maxSlots' | 'maxPartySize' | 'smithyLevel' | 'offlineBonusPerHour';

export interface SmithyUpgradeDef {
  id: UpgradableMetaField;
  metaField: UpgradableMetaField;
  name: string;
  effectPerLevel: string;
  baseCost: number;
  maxLevel: number; // Infinity для smithyLevel
  iconId: string;
}

export const SMITHY_UPGRADES: SmithyUpgradeDef[] = [
  { id: 'maxSlots', metaField: 'maxSlots', name: 'Слоты экипировки', effectPerLevel: '+1 слот на гнома', baseCost: 50, maxLevel: 2, iconId: 'icon_slot' },
  { id: 'maxPartySize', metaField: 'maxPartySize', name: 'Размер отряда', effectPerLevel: '+1 стартовый гном', baseCost: 80, maxLevel: 1, iconId: 'icon_party' },
  { id: 'smithyLevel', metaField: 'smithyLevel', name: 'Уровень кузницы', effectPerLevel: '+0.5× к offline-доходу', baseCost: 30, maxLevel: Infinity, iconId: 'icon_smithy' },
  { id: 'offlineBonusPerHour', metaField: 'offlineBonusPerHour', name: 'Ускорение простоя', effectPerLevel: '+0.1× к offline-доходу', baseCost: 60, maxLevel: 5, iconId: 'icon_clock' },
];

// §6.4: upgradeCost = baseCost × 1.5^level
export function upgradeCost(baseCost: number, level: number): number {
  return baseCost * Math.pow(1.5, level);
}

export function purchaseUpgrade(meta: MetaState, def: SmithyUpgradeDef): MetaState {
  const currentLevel = meta[def.metaField];
  const cost = upgradeCost(def.baseCost, currentLevel);
  if (meta.legacy < cost || currentLevel >= def.maxLevel) return meta;
  return {
    ...meta,
    legacy: meta.legacy - cost,
    [def.metaField]: currentLevel + 1,
  };
}
