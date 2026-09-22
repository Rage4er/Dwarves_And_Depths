import Phaser from 'phaser';

// Placeholder main.ts - Phase 0 bootstrap
// Game initialization will be implemented in Phase 1

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [],
};

new Phaser.Game(config);

console.log('Dwarves & Depths - Phase 0 Bootstrap');
console.log('Phaser version:', Phaser.VERSION);
