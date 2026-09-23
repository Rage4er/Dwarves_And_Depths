/**
 * §3.1.7 Симулятор боёв — ЧИСТАЯ ЛОГИКА
 * КОНТРАКТ: Никаких импортов Phaser, Matter.js, DOM.
 * Только TypeScript + типы из §2.3
 */
export class BattleSimulator {
    state;
    constructor(heroes, enemies, config) {
        this.state = {
            round: 1,
            heroes,
            enemies,
            config,
            effects: [],
            log: [],
        };
    }
    getState() {
        return { ...this.state };
    }
    simulateRound() {
        if (this.state.winner) {
            return;
        }
        this.state.log.push(`=== Round ${this.state.round} ===`);
        // Сортируем по скорости (кто быстрее — ходит первым)
        const allUnits = [
            ...this.state.heroes.map(h => ({ unit: h, side: 'hero' })),
            ...this.state.enemies.map(e => ({ unit: e, side: 'enemy' })),
        ].sort((a, b) => b.unit.speed - a.unit.speed);
        for (const { unit, side } of allUnits) {
            if (this.checkBattleEnd()) {
                break;
            }
            if (unit.hp <= 0) {
                continue;
            }
            // Применение эффектов статуса
            this.applyStatusEffects(unit);
            if (side === 'hero') {
                this.heroAttack(unit);
            }
            else {
                this.enemyAttack(unit);
            }
        }
        this.state.round++;
        if (this.state.round > this.state.config.maxRounds) {
            this.state.winner = 'draw';
            this.state.log.push('Battle ended: draw (max rounds reached)');
        }
    }
    applyStatusEffects(unit) {
        if (!('statusEffects' in unit) || !unit.statusEffects) {
            return;
        }
        const dwarf = unit;
        const remainingEffects = [];
        for (const effect of dwarf.statusEffects) {
            if (effect.duration > 0) {
                remainingEffects.push(effect);
                effect.duration--;
                // Применение эффекта
                if (effect.type === 'poison' || effect.type === 'burn' || effect.type === 'bleed') {
                    dwarf.hp = Math.max(0, dwarf.hp - effect.value);
                    this.state.log.push(`${dwarf.name} takes ${effect.value} damage from ${effect.type}`);
                }
            }
        }
        dwarf.statusEffects = remainingEffects;
    }
    heroAttack(hero) {
        const targets = this.state.enemies.filter(e => e.hp > 0);
        if (targets.length === 0) {
            return;
        }
        // Простая логика: атакуем случайного живого врага
        const targetIndex = Math.floor(Math.random() * targets.length);
        const target = targets[targetIndex];
        const damage = Math.max(0, hero.attack - target.defense);
        target.hp = Math.max(0, target.hp - damage);
        this.state.log.push(`${hero.name} attacks ${target.name} for ${damage} damage (${target.hp} HP left)`);
        if (target.hp <= 0) {
            this.state.log.push(`${target.name} defeated!`);
        }
    }
    enemyAttack(enemy) {
        const targets = this.state.heroes.filter(h => h.hp > 0);
        if (targets.length === 0) {
            return;
        }
        // Простая логика: атакуем случайного живого гнома
        const targetIndex = Math.floor(Math.random() * targets.length);
        const target = targets[targetIndex];
        const damage = Math.max(0, enemy.attack - target.defense);
        target.hp = Math.max(0, target.hp - damage);
        this.state.log.push(`${enemy.name} attacks ${target.name} for ${damage} damage (${target.hp} HP left)`);
        if (target.hp <= 0) {
            this.state.log.push(`${target.name} defeated!`);
            if (target.isHero && this.state.config.heroDeathEndsBattle) {
                this.state.winner = 'enemies';
                this.state.log.push('Battle ended: hero died');
            }
        }
    }
    checkBattleEnd() {
        const heroesAlive = this.state.heroes.some(h => h.hp > 0);
        const enemiesAlive = this.state.enemies.some(e => e.hp > 0);
        if (!enemiesAlive) {
            this.state.winner = 'heroes';
            this.state.log.push('Battle ended: all enemies defeated');
            return true;
        }
        if (!heroesAlive) {
            this.state.winner = 'enemies';
            this.state.log.push('Battle ended: all heroes defeated');
            return true;
        }
        // Проверка на смерть героя (если включена)
        if (this.state.config.heroDeathEndsBattle) {
            const heroAlive = this.state.heroes.some(h => h.isHero && h.hp > 0);
            if (!heroAlive) {
                this.state.winner = 'enemies';
                this.state.log.push('Battle ended: hero died');
                return true;
            }
        }
        return false;
    }
    simulateUntilEnd(maxRoundsOverride) {
        const maxRounds = maxRoundsOverride || this.state.config.maxRounds;
        while (!this.state.winner && this.state.round <= maxRounds) {
            this.simulateRound();
        }
        return this.state;
    }
}
// Фабричная функция для создания симуляции
export function simulateBattle(heroes, enemies, config) {
    const simulator = new BattleSimulator(heroes, enemies, config);
    return simulator.simulateUntilEnd();
}
