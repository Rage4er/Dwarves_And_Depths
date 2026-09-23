/**
 * §2.3 Типы данных — строгий контракт
 * НИКАКИХ упрощений. Все поля обязательны согласно ТЗ.
 */

// --- Enums & Unions ---

export type Role = 'warrior' | 'archer' | 'mage' | 'cleric' | 'engineer';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Slot = 'head' | 'chest' | 'legs' | 'weapon' | 'trinket';

export type Position = 'front' | 'middle' | 'back';

export type RunStatus = 'active' | 'won' | 'lost' | 'aborted';

export type Tag = 
  | 'hero' 
  | 'elite' 
  | 'boss' 
  | 'flying' 
  | 'armored' 
  | 'poisonous' 
  | 'fast' 
  | 'slow' 
  | 'undead' 
  | 'demon' 
  | 'beast' 
  | 'construct';

export type NodeType = 'battle' | 'event' | 'shop' | 'rest' | 'elite' | 'boss' | 'start' | 'end';

// --- Effects ---

export interface Effect {
  id: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'shield' | 'dot' | 'hot';
  value: number;
  duration?: number; // ходов
  source?: 'dwarf' | 'enemy' | 'environment';
}

export interface StatusEffect {
  id: string;
  type: 'stun' | 'poison' | 'burn' | 'freeze' | 'bleed' | 'buff_atk' | 'buff_def' | 'debuff_atk' | 'debuff_def';
  value: number;
  duration: number; // ходов
  stacks?: number;
}

// --- Equipment ---

export interface Equipment {
  head?: { id: string; name: string; bonus?: Record<string, number> };
  chest?: { id: string; name: string; bonus?: Record<string, number> };
  legs?: { id: string; name: string; bonus?: Record<string, number> };
  weapon?: { id: string; name: string; bonus?: Record<string, number> };
  trinket?: { id: string; name: string; bonus?: Record<string, number> };
}

// --- Dwarf ---

export interface Dwarf {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  role: Role;
  rarity: Rarity;
  level: number;
  exp: number;
  attack: number;
  defense: number;
  speed: number;
  slot: Position;
  isHero: boolean;
  equipment: Equipment;
  roleBias?: Partial<Record<Role, number>>;
  localSlotBonus?: Partial<Record<Position, number>>;
  statusEffects: StatusEffect[];
  tags: Tag[];
}

// --- Enemy ---

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  isBoss: boolean;
  isElite: boolean;
  tags: Tag[];
  loot?: string[];
}

// --- Shop & Run ---

export interface ShopItem {
  id: string;
  type: 'equipment' | 'potion' | 'recruit' | 'upgrade';
  name: string;
  cost: number;
  data?: Dwarf | Equipment | { potionType: string; value: number };
}

export interface RunNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  connections: string[]; // IDs connected nodes
  cleared: boolean;
  data?: {
    enemy?: Enemy;
    enemies?: Enemy[];
    event?: string;
    shopItems?: ShopItem[];
    reward?: { gold: number; items?: string[] };
  };
}

export interface RunState {
  id: string;
  status: RunStatus;
  floor: number;
  gold: number;
  dwarves: Dwarf[];
  currentNodeId: string | null;
  visitedNodes: string[];
  defeatedEnemies: string[];
  startTime: number;
  endTime?: number;
}

// --- Battle ---

export interface BattleConfig {
  maxRounds: number;
  heroDeathEndsBattle: boolean;
  enableStatusEffects: boolean;
  debug: boolean;
}

export interface BattleState {
  round: number;
  heroes: Dwarf[];
  enemies: Enemy[];
  config: BattleConfig;
  effects: Effect[];
  log: string[];
  winner?: 'heroes' | 'enemies' | 'draw';
}

// --- Meta Progression ---

export interface Choice {
  id: string;
  text: string;
  effect: (state: RunState) => void;
  requirements?: { gold?: number; dwarves?: number; floor?: number };
}

export interface AutoEquipTemplate {
  id: string;
  name: string;
  rules: {
    role: Role;
    priority: Slot[];
  }[];
}

export interface MetaState {
  totalGoldEarned: number;
  totalEnemiesDefeated: number;
  totalRunsCompleted: number;
  unlockedDwarves: string[]; // IDs
  unlockedEquipment: string[]; // IDs
  autoEquipTemplates: AutoEquipTemplate[];
  settings: {
    soundEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
    fastForward: boolean;
  };
}
