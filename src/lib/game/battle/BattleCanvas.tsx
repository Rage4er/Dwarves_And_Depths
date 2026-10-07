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
  const dataRef = useRef({ battle, dwarves, speed });

  const dwarfInfo = useMemo(() => {
    return dwarves.map((d) => ({ id: d.id, name: d.name, role: d.role }));
  }, [dwarves]);

  // Создаём Phaser.Game один раз
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
        scene: [BattleSceneClass],
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

      // Запускаем сцену с данными
      gameInstance.scene.start(BATTLE_SCENE_KEY, {
        battle,
        dwarves: dwarfInfo,
        speed,
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

  // Обновляем battle state и запускаем сцену заново при смене боя
  useEffect(() => {
    dataRef.current = { battle, dwarves: dwarfInfo, speed };
    if (!gameRef.current) return;

    // Перезапускаем сцену с новыми данными
    const scene = gameRef.current.scene.getScene(BATTLE_SCENE_KEY);
    if (scene) {
      (scene as any).sceneData = { battle, dwarves: dwarfInfo, speed };
    }
    gameRef.current.scene.restart(BATTLE_SCENE_KEY, {
      battle,
      dwarves: dwarfInfo,
      speed,
    });
  }, [battle.seed, battle.floor]); // Пересоздаём при смене seed/floor

  return (
    <div
      ref={containerRef}
      id={`phaser-battle-${battle.seed}`}
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: '896/504' }}
    />
  );
}
