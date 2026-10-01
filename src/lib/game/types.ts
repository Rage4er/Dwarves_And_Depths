// §2.3 Контракты данных (единственный источник истины)

export type Role = 'tank' | 'warrior' | 'ranged' | 'mage' | 'support' | 'any';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Slot = 'weapon' | 'armor' | 'trinket' | 'rune';
export type Position = 'front' | 'mid' | 'back';
export type RunStatus = 'active' | 'victory' | 'victory_endless' | 'defeat' | 'abandoned';
export type Tag = 'metal' | 'cloth' | 'runic' | 'wood' | 'bone';
export type NodeType = 'battle' | 'elite' | 'shop' | 'event' | 'rest' | 'boss' | 'forge';

// v7.0 §2.3: тип атаки врага (ranged — стреляет издалека, урон ×0.7, без позиционного множителя)
export type AttackType = 'melee' | 'ranged';

// v6.9 §2.3: причина окончания боя. Расхождение ТЗ (коммент §2.3 «элита/босс» против
// §3.1.2.1) решено по §3.1.2.1: обвал — обычный бой/элита, Древний — только босс (см. defects.md)
export type BattleEndReason =
  | 'victory'
  | 'defeat'
  | 'timeout_collapse'    // обвал пещеры (обычный бой/элита)
  | 'timeout_ancient'     // пробуждение Древнего (босс)
  | 'abandoned';

export type EffectType =
  | 'stun' | 'lifesteal' | 'splash' | 'pierce' | 'taunt'
  | 'aura_def' | 'aura_atk' | 'aura_spd' | 'conditional_atk'
  | 'double_strike' | 'hp_regen' | 'extra_slot' | 'poison' | 'burn'
  | 'summon';

// Effect.value — единицы по типу (§2.3):
//   stun/double_strike → % шанса, taunt → ходов, hp_regen → абс. HP/ход,
//   poison/burn → HP за ход (chance = % срабатывания, по умолчанию 100),
//   aura_* / conditional_atk / splash / lifesteal / pierce → %,
//   extra_slot → value игнорируется (булев флаг).
export interface Effect {
  type: EffectType;
  value: number;
  chance?: number;
  radius?: number;
  condition?: 'hp_below_30';
  duration?: number;
}

export interface StatusEffect {
  id: string;
  type: 'poison' | 'burn' | 'stun' | 'bleed';
  remainingTurns: number;
  value: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: Slot;
  role: Role; // 'any' → не задаёт роль гному
  atk: number;
  def: number;
  hp: number;
  effects: Effect[];
  rarity: Rarity;
  tags: Tag[];
  stage: 1 | 2 | 3;
}

export interface Dwarf {
  id: string;
  name: string;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  baseSpeed: number;
  equipment: Equipment[];
  position: Position;
  currentHP: number;
  isAlive: boolean;
  speed: number;
  role: Role; // resolved по §3.1.3, никогда не 'any'
  roleBias: Role;
  statusEffects: StatusEffect[];
  localSlotBonus: number; // 0 или 1 (§3.1.6)
}

export interface Enemy {
  id: string;
  name: string;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  speed: number;
  attackType: AttackType; // v7.0
  attackRange: number; // v7.0: 80 melee, 260 ranged (пошаговый маркер типа атаки)
  effects: Effect[];
  statusEffects: StatusEffect[];
  isBoss: boolean;
  isElite: boolean;
  currentHP: number;
  isAlive: boolean;
  position: Position;
}

export interface ShopItem {
  type: 'equipment' | 'dwarf';
  id: string;
  price: number;
}

export interface RunNode {
  id: string;
  floor: number;
  type: NodeType;
  difficulty: number;
  rewards: { gold: number; itemIds: string[] };
  next: string[];
  data?: {
    enemyIds?: string[];
    enemyTypes?: string[]; // v7.0: уникальные типы волны — превью на экране подготовки без статов и количества
    eventId?: string;
    shopStock?: ShopItem[];
  };
  visited?: boolean;
}

export interface RunState {
  runId: string;
  seed: number;
  floor: number;
  depth: number; // v6.8 Growing Depth: 8 + bossesKilledTotal (обычный) / 8 + maxDepthEver + endlessFloor (бесконечный)
  gold: number;
  dwarves: Dwarf[];
  inventory: Equipment[];
  currentNodeId: string;
  map: RunNode[];
  status: RunStatus;
  bossKilled: boolean;
  elitesKilled: number;
  bossesKilled: number; // v6.8: боссов повержено за забег (экран 9, бесконечный режим)
  startedAt: number;
  isEndless: boolean; // v6.8 бесконечный режим (§3.3.1)
  endlessFloor: number; // v6.8: 0 на старте бесконечного, +1 с каждым пройденным слоем
  eliteLegacyGranted: boolean; // v6.8 §3.3.7: +10 наследия за элиту — один раз за забег
  endReason: BattleEndReason | null; // v6.9 §4.3: причина финала последнего боя (экран 9)
}

export interface Choice {
  nodeId: string;
  choiceIndex: number;
}

export interface EquipSlots {
  weapon?: string;
  armor?: string;
  trinket?: string;
}

export interface AutoEquipTemplate {
  tank: EquipSlots;
  warrior: EquipSlots;
  ranged: EquipSlots;
  mage: EquipSlots;
  support: EquipSlots;
}

export interface MetaState {
  legacy: number;
  maxSlots: number; // слотов экипировки на ОДНОГО гнома (2 → 4)
  maxPartySize: number; // стартовый лимит отряда (1 → 3)
  smithyLevel: number;
  offlineBonusPerHour: number;
  maxFloorEverReached: number;
  maxDepthEver: number; // v6.8: рекорд глубины (§3.3.1 бесконечный режим)
  bossesKilledTotal: number; // v6.8: всего убито боссов (Growing Depth)
  deadDwarves: string[]; // v6.8 §3.1.2: перманентная смерть — id павших
  endlessUnlocked: boolean; // v6.8: победа над e_forge_demon
  unlockedDwarves: string[];
  unlockedEquipment: string[];
  lastSeenAt: number;
  runCount: number;
  unlocks: {
    autoBattle: boolean;
    autoRepeat: boolean;
    autoEquip: boolean;
  };
  autoEquipTemplate?: AutoEquipTemplate;
  sleepLoot: string[]; // ключи каталога, накопленные «сном кузницы» вне забега (§3.2)
}

export const MAX_TURNS = 50;
export const MAX_TURNS_BOSS = 100;

// v6.9 §6.4: капы суммарного hp_regen за ход — стек предметов не пробивает лимит
export const HP_REGEN_CAP = 3;
export const ENEMY_HP_REGEN_CAP = 2;

// §3.1 формация: множитель ПОЛУЧАЕМОГО урона по линии цели
export const POSITION_DAMAGE: Record<Position, number> = { front: 1.5, mid: 1.0, back: 0.5 };

export const SLOT_ORDER: Slot[] = ['weapon', 'armor', 'trinket', 'rune'];
export const ROLE_ORDER: Exclude<Role, 'any'>[] = ['tank', 'warrior', 'ranged', 'mage', 'support'];

export const RARITY_RANK: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
export const RARITY_PRICE: Record<Rarity, number> = { common: 5, rare: 12, epic: 25, legendary: 50 };
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#a8a29e', rare: '#7dd3fc', epic: '#d8b4fe', legendary: '#fbbf24',
};
export const RARITY_NAME: Record<Rarity, string> = {
  common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legendary: 'Легендарное',
};
export const SLOT_NAME: Record<Slot, string> = {
  weapon: 'Оружие', armor: 'Броня', trinket: 'Амулет', rune: 'Руна',
};
export const ROLE_NAME: Record<Role, string> = {
  tank: 'Страж', warrior: 'Воин', ranged: 'Стрелок', mage: 'Маг',
  support: 'Жрец', any: 'Любой',
};
export const POSITION_NAME: Record<Position, string> = {
  front: 'Авангард', mid: 'Центр', back: 'Тыл',
};
export const EFFECT_NAME: Record<EffectType, string> = {
  stun: 'Оглушение',
  lifesteal: 'Вампиризм',
  splash: 'Удар по площади',
  pierce: 'Пробитие брони',
  taunt: 'Провокация',
  aura_def: 'Аура защиты',
  aura_atk: 'Аура атаки',
  aura_spd: 'Аура скорости',
  conditional_atk: 'Ярость раненого',
  double_strike: 'Двойной удар',
  hp_regen: 'Регенерация',
  extra_slot: 'Доп. слот',
  poison: 'Отравление',
  burn: 'Горение',
  summon: 'Призыв',
};
export const NODE_NAME: Record<NodeType, string> = {
  battle: 'Бой', elite: 'Элита', shop: 'Лавка', event: 'Событие',
  rest: 'Привал', boss: 'Босс', forge: 'Кузня',
};

// ── Бой (§3.1.7: POJO, без DOM/Phaser) ──

export type Side = 'ally' | 'foe';

export interface Combatant {
  uid: string;
  side: Side;
  name: string;
  hp: number;
  hpMax: number;
  atk: number;
  def: number;
  speed: number;
  position: Position;
  alive: boolean;
  statuses: StatusEffect[];
  effects: Effect[];
  role: Role;
  iconSeed: number;
  tauntLeft: number;
  attackType?: AttackType; // v7.0: только у врагов; гномы всегда melee
  isBoss?: boolean;
  isElite?: boolean;
}

export type BattleEventKind =
  | 'start' | 'turn' | 'hit' | 'double' | 'splash' | 'lifesteal'
  | 'dot' | 'regen' | 'stun' | 'status' | 'heal' | 'death' | 'end';

export interface BattleEvent {
  kind: BattleEventKind;
  actor?: string;
  target?: string;
  value?: number;
  text: string;
}

export type BattleOutcome = 'active' | 'won' | 'lost' | 'timeout';

export interface BattleState {
  allies: Combatant[];
  foes: Combatant[];
  round: number;
  log: BattleEvent[];
  status: BattleOutcome;
  seed: number;
  floor: number; // §6.4: minDamage = max(1, floor/2) зависит от слоя узла
  endReason: BattleEndReason | null; // v6.9 §2.3: почему бой закончился
  // §3.1.1 пошаговая адаптация потока: enemiesTotal = enemyIds узла (§6.3 enemyCount),
  // подкрепления входят по одному врагу в раунд, пока не исчерпан резерв
  enemiesTotal: number;
  enemiesSpawned: number;
  enemyReserve: string[];
}

export interface BattleResult {
  state: BattleState;
  round: number;
  status: 'won' | 'lost';
  deadAllies: string[];
  endReason: BattleEndReason | null; // v6.9: проброс причины в стор (экран 9)
}

export type ScreenId =
  | 'menu' | 'party' | 'prepare' | 'battle' | 'reward'
  | 'map' | 'inventory' | 'event' | 'death' | 'end';
