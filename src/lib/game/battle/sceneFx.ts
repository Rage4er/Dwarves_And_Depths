// §5.3 Эффекты боя: удар, выпад урона, искра, смерть (ragdoll).
//
// Все твины идут по ДОЧЕРНЕМУ объекту (rig.body), никогда по rig.container:
// координата контейнера принадлежит логике (BattleState.x/y) и перезаписывается
// каждый тик, поэтому твин контейнера конфликтовал бы с симуляцией.

import type { UnitRig } from './sceneUnits';

export type FxSide = 'ally' | 'foe';

const HIT_TINT = 0xff7043;
const POPUP_MS = 800;
const MAX_POPUPS = 10;

function tween(scene: any, config: any): any {
  return scene.tweens.add(config);
}

// Удар: короткая вспышка цвета + тряска тела назад (назад — от атакующего)
export function tweenHit(scene: any, rig: UnitRig, dir: number): void {
  const body = rig.body;
  body.setTint(HIT_TINT);
  tween(scene, {
    targets: body,
    x: dir * -16,
    duration: 70,
    ease: 'Quad.easeOut',
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      body.setX(0);
      body.clearTint();
    },
  });
}

// Рывок атакующего к цели
export function tweenLunge(scene: any, rig: UnitRig, dir: number): void {
  if (rig.busy) return;
  rig.busy = true;
  tween(scene, {
    targets: rig.body,
    x: dir * 30,
    duration: 90,
    ease: 'Quad.easeOut',
    yoyo: true,
    onComplete: () => {
      rig.body.setX(0);
      rig.busy = false;
    },
  });
}

// Искра в точке удара: летит вверх-вбок и гаснет
export function spawnSpark(scene: any, x: number, y: number, color: number): void {
  const dot = scene.add.circle(x, y, 8, color, 1);
  dot.setDepth(40);
  tween(scene, {
    targets: dot,
    x: x + (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 50),
    y: y - 60 - Math.random() * 40,
    alpha: 0,
    scale: 0.3,
    duration: 380,
    ease: 'Cubic.easeOut',
    onComplete: () => dot.destroy(),
  });
}

// Всплывающее число урона/лечения
export function spawnPopup(scene: any, x: number, y: number, text: string, color: number): void {
  const list: any[] = scene._popups ?? (scene._popups = []);
  while (list.length >= MAX_POPUPS) {
    const oldest = list.shift();
    if (oldest) oldest.destroy();
  }
  const label = scene.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: '40px',
    color: '#' + color.toString(16).padStart(6, '0'),
    stroke: '#000000',
    strokeThickness: 6,
  });
  label.setOrigin(0.5, 1).setDepth(50);
  list.push(label);
  tween(scene, {
    targets: label,
    y: y - 90,
    alpha: 0,
    duration: POPUP_MS,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      const i = list.indexOf(label);
      if (i >= 0) list.splice(i, 1);
      label.destroy();
    },
  });
}

// Смерть: ragdoll — тело падает вокруг ног (origin 0.5,1) и гаснет
export function tweenDeath(scene: any, rig: UnitRig, dir: number): void {
  rig.setBarVisible(false);
  tween(scene, {
    targets: rig.body,
    angle: dir * 88,
    y: 8,
    alpha: 0.4,
    duration: 520,
    ease: 'Bounce.easeOut',
    onComplete: () => rig.body.setAngle(dir * 88).setAlpha(0.4),
  });
}
