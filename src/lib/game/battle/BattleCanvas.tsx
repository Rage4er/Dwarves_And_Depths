'use client';

// §5 Phaser-холст боя: React-обёртка над Phaser.Game
// Рендерит бой на canvas, логика остаётся в simulateBattleTick (детерминизм).

import { useEffect, useRef, useMemo } from 'react';
import type { BattleState } from '@/lib/game/types';
import { BATTLE_SCENE_KEY, createBattleScene } from './BattleScene';

interface BattleCanvasProps {
  battle: BattleState;
  dwarves: Array<{ id: string; name: string; role: string }>;
  speed: number;
}

export function BattleCanvas({ battle, dwarves, speed }: BattleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);

  // Refs для live-обновления — избегаем stale closure в useEffect
  const battleRef = useRef(battle);
  const dwarvesRef = useRef(dwarves);
  const speedRef = useRef(speed);

  useEffect(() => { battleRef.current = battle; }, [battle]);
  useEffect(() => { dwarvesRef.current = dwarves; }, [dwarves]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const dwarfInfo = useMemo(() => {
    return dwarves.map((d) => ({ id: d.id, name: d.name, role: d.role }));
  }, [dwarves]);

  // Создаём Phaser.Game один раз — без auto-start сцены
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const container = containerRef.current;

    let gameInstance: any = null;

    const init = async () => {
      const PhaserModule = await import('phaser');
      const BattleSceneClass = createBattleScene(PhaserModule);

      const config: any = {
        type: (PhaserModule as any).TYPES?.CANVAS ?? 1,
        width: 896,
        height: 504,
        parent: container.id,
        // FIX: НЕ передаём scene в config — сцена auto-startится без данных.
        // Добавляем вручную с active: false, затем стартуем с данными.
        pixelArt: true,
        roundPixels: true,
        backgroundColor: '#141018',
        scale: {
          mode: (PhaserModule.Scale as any)?.FIT ?? 1,
          autoCenter: (PhaserModule.Scale as any)?.CENTER_BOTH ?? 1,
        },
        physics: { default: 'arcade' },
      };

      gameInstance = new PhaserModule.Game(config);
      gameRef.current = gameInstance;

      // FIX: добавляем сцену БЕЗ auto-start, затем стартуем с данными
      gameInstance.scene.add(BATTLE_SCENE_KEY, BattleSceneClass, false);
      gameInstance.scene.start(BATTLE_SCENE_KEY, {
        battle: battleRef.current,
        dwarves: dwarvesRef.current.map((d) => ({ id: d.id, name: d.name, role: d.role })),
        speed: speedRef.current,
      });
    };

    init();

    return () => {
      if (gameInstance) {
        gameInstance.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: live-обновление battle state на каждый React-рендер.
  // Сцена получает snapshot при старте — без этого HP-бары не обновляются.
  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene(BATTLE_SCENE_KEY);
    if (scene?.updateFromBattle) {
      scene.updateFromBattle(battleRef.current);
    }
  }, [battle]);

  // Обновляем при смене seed/floor — перезапускаем сцену
  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.scene.start(BATTLE_SCENE_KEY, {
      battle: battleRef.current,
      dwarves: dwarvesRef.current,
      speed: speedRef.current,
    });
  }, [battle.seed, battle.floor]);

  return (
    <div
      ref={containerRef}
      id={`phaser-battle-${battle.seed}`}
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: '896/504' }}
    />
  );
}

