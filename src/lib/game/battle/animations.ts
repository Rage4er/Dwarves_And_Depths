// §5.3 Phaser-tweens: отскоки, ragdoll, удары, всплывающий урон

export interface BattlePopup {
  uid: string;
  text: string;
  kind: 'dmg' | 'heal';
}

// Отскок при ударе (BOUNCE_DISTANCE = 100 px → в Phaser scale 2 → 50 px)
export function tweenHit(sprite: any, side: 'ally' | 'foe'): void {
  const dir = side === 'ally' ? -1 : 1;
  sprite.tween = sprite.scene.tweens.add({
    targets: sprite,
    x: sprite.x + dir * 50,
    duration: 80,
    yoyo: true,
    ease: 'Sine.easeInOut',
  });
}

// Выпад при атаке (ally → вправо, foe → влево)
export function tweenLunge(sprite: any, side: 'ally' | 'foe'): void {
  const dir = side === 'ally' ? 1 : -1;
  sprite.tween = sprite.scene.tweens.add({
    targets: sprite,
    x: sprite.x + dir * 30,
    duration: 100,
    yoyo: true,
    ease: 'Sine.easeInOut',
  });
}

// Искра при дальнем ударе
export function spawnSpark(scene: any, x: number, y: number, color: string): void {
  const g = scene.add.graphics();
  g.fillStyle(parseHexColor(color), 1);
  g.fillCircle(0, 0, 8);
  g.setPixelRatio(2);
  g.setPosition(x, y);
  g.setDepth(20);

  scene.tweens.add({
    targets: g,
    alpha: 0,
    scale: 2.5,
    duration: 300,
    ease: 'Sine.easeOut',
    onComplete: () => g.destroy(),
  });
}

// Всплывающий урон/лечение
export function spawnPopup(
  scene: any,
  x: number,
  y: number,
  text: string,
  kind: 'dmg' | 'heal',
): void {
  const textColor = kind === 'heal' ? 0x66dd44 : 0xffaa33;
  const txt = scene.add.text(x, y, text, {
    fontSize: '16px',
    fontFamily: 'monospace',
    color: '#' + textColor.toString(16).padStart(6, '0'),
    stroke: '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(25);

  scene.tweens.add({
    targets: txt,
    y: y - 50,
    alpha: 0,
    duration: 900,
    ease: 'Sine.easeOut',
    onComplete: () => txt.destroy(),
  });
}

// Смерть гнома — сжатие и затухание (drag-left с фоном)
export function tweenAllyDeath(sprite: any): void {
  sprite.tween = sprite.scene.tweens.add({
    targets: sprite,
    alpha: 0.4,
    scale: 0.6,
    angle: -10,
    duration: 500,
    ease: 'Sine.easeIn',
    delay: 200,
  });
}

// Смерть врага — ragdoll: отскок + затухание
export function tweenFoeDeath(sprite: any): void {
  sprite.tween = sprite.scene.tweens.add({
    targets: sprite,
    alpha: 0.3,
    scale: 0.5,
    angle: 25,
    y: sprite.y + 20,
    duration: 600,
    ease: 'Cubic.easeIn',
    delay: 300,
  });
}

// HP-бар над юнитом
export function createHpBar(
  scene: any,
  parent: any,
  maxHp: number,
  currentHp: number,
): any {
  const barW = 60;
  const barH = 5;
  const g = scene.add.graphics();
  g.setDepth(30);
  g.setPosition(parent.x, parent.y - parent.height * 0.5 - 14);
  g.setOrigin(0.5, 0);

  // Фон
  g.fillStyle(0x1a1a1a, 0.8);
  g.fillRect(-barW / 2, 0, barW, barH);

  // HP
  updateHpBar(g, barW, barH, maxHp, currentHp);

  return { graphics: g, barW, barH, update: (hp: number) => {
    updateHpBar(g, barW, barH, maxHp, hp);
  }};
}

function updateHpBar(g: any, barW: number, barH: number, maxHp: number, hp: number): void {
  g.clear(true);
  // Фон
  g.fillStyle(0x1a1a1a, 0.8);
  g.fillRect(-barW / 2, 0, barW, barH);
  // HP цвет
  const pct = Math.max(0, hp / maxHp);
  const color = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xcccc44 : 0xcc4444;
  g.fillStyle(color, 1);
  g.fillRect(-barW / 2, 0, barW * pct, barH);
}

function parseHexColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
