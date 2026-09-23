import Phaser from 'phaser';
// BootScene — показывает "Phase 1 OK"
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    preload() {
        // Загрузка плейсхолдер-атласа
        this.load.atlas('dwarf_base', 'atlas/dwarf_base.png', 'atlas/dwarf_base.json');
    }
    create() {
        const { width, height } = this.scale;
        // Тёмный фон
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
        // Белый текст "Phase 1 OK"
        this.add.text(width / 2, height / 2, 'Phase 1 OK', {
            font: '32px Arial',
            color: '#ffffff',
        }).setOrigin(0.5);
        console.log('[BootScene] Phase 1 accepted: types §2.3 + simulator §3.1.7');
    }
}
// Конфиг игры
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene],
};
// Инициализация игры
const game = new Phaser.Game(config);
console.log('[main.ts] Dwarves & Depths initialized');
