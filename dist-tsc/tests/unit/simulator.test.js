/**
 * Unit-тесты для BattleSimulator (§3.1.7)
 * Тестируем строго по контракту §2.3 (полные типы)
 */
import { describe, it, expect } from 'vitest';
import { BattleSimulator, simulateBattle } from '../../src/battle/simulator';
// Helper: создание гнома с полными полями §2.3
function createDwarf(overrides = {}) {
    const base = {
        id: 'd1',
        name: 'Test Dwarf',
        hp: 100,
        maxHp: 100,
        role: 'warrior',
        rarity: 'common',
        level: 1,
        exp: 0,
        attack: 15,
        defense: 5,
        speed: 10,
        slot: 'front',
        isHero: false,
        equipment: {},
        statusEffects: [],
        tags: [],
        ...overrides,
    };
    return base;
}
// Helper: создание врага с полными полями §2.3
function createEnemy(overrides = {}) {
    const base = {
        id: 'e1',
        name: 'Test Enemy',
        hp: 50,
        maxHp: 50,
        attack: 10,
        defense: 2,
        speed: 8,
        isBoss: false,
        isElite: false,
        tags: [],
        ...overrides,
    };
    return base;
}
// Конфиг по умолчанию
const defaultConfig = {
    maxRounds: 10,
    heroDeathEndsBattle: true,
    enableStatusEffects: true,
    debug: false,
};
describe('BattleSimulator', () => {
    it('should initialize with correct state', () => {
        const hero = createDwarf({ id: 'h1', name: 'Hero', isHero: true });
        const enemy = createEnemy({ id: 'e1', name: 'Goblin' });
        const simulator = new BattleSimulator([hero], [enemy], defaultConfig);
        const state = simulator.getState();
        expect(state.round).toBe(1);
        expect(state.heroes.length).toBe(1);
        expect(state.enemies.length).toBe(1);
        expect(state.winner).toBeUndefined();
        expect(state.log.length).toBe(0);
    });
    it('should end battle when all enemies defeated (гном vs крыса e_rat)', () => {
        // Крыса из §6.3: HP 30, ATK 5, DEF 2, SPD 12
        const rat = createEnemy({
            id: 'e_rat',
            name: 'Giant Rat',
            hp: 30,
            maxHp: 30,
            attack: 5,
            defense: 2,
            speed: 12,
            tags: ['beast', 'fast'],
        });
        // Гном-герой
        const hero = createDwarf({
            id: 'h1',
            name: 'Thorin',
            hp: 100,
            maxHp: 100,
            attack: 15,
            defense: 5,
            speed: 10,
            isHero: true,
            role: 'warrior',
        });
        const config = { ...defaultConfig, maxRounds: 20 };
        const result = simulateBattle([hero], [rat], config);
        expect(result.winner).toBe('heroes');
        expect(result.heroes.some(h => h.hp > 0)).toBe(true);
        expect(result.enemies.every(e => e.hp <= 0)).toBe(true);
    });
    it('should end battle when hero dies (heroDeathEndsBattle=true)', () => {
        // Сильный враг
        const boss = createEnemy({
            id: 'e_boss',
            name: 'Dragon',
            hp: 200,
            maxHp: 200,
            attack: 50,
            defense: 10,
            speed: 15,
            isBoss: true,
        });
        // Слабый гном-герой
        const hero = createDwarf({
            id: 'h1',
            name: 'Weak Hero',
            hp: 30,
            maxHp: 30,
            attack: 5,
            defense: 1,
            speed: 8,
            isHero: true,
        });
        const config = { ...defaultConfig, heroDeathEndsBattle: true, maxRounds: 5 };
        const result = simulateBattle([hero], [boss], config);
        expect(result.winner).toBe('enemies');
        expect(result.log.some(l => l.includes('hero died'))).toBe(true);
    });
    it('should reach max rounds and end in draw', () => {
        // Два бессмертных юнита (очень много HP)
        const immortalHero = createDwarf({
            id: 'h_immortal',
            name: 'Immortal',
            hp: 10000,
            maxHp: 10000,
            attack: 1,
            defense: 1000,
            speed: 10,
            isHero: true,
        });
        const immortalEnemy = createEnemy({
            id: 'e_immortal',
            name: 'Immortal Enemy',
            hp: 10000,
            maxHp: 10000,
            attack: 1,
            defense: 1000,
            speed: 9,
        });
        const config = { ...defaultConfig, maxRounds: 3, heroDeathEndsBattle: false };
        const result = simulateBattle([immortalHero], [immortalEnemy], config);
        expect(result.winner).toBe('draw');
        expect(result.round).toBe(4); // round инкрементится после последнего раунда
        expect(result.log.some(l => l.includes('max rounds'))).toBe(true);
    });
});
