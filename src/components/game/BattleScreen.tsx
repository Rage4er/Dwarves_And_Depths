'use client';

// §4 экран 4 + §5.2/§5.3: беговой бой — отряд бежит вправо на месте, фон (параллакс
// + земля) прокручивается синхронно темпу шага (--run × скорость боя); враги выбегают
// навстречу справа, живые перестраиваются к точке контакта по мере гибели передних —
// убиваем на ходу и бежим к следующим; павшие (обе стороны) лежат на земле и
// уезжают влево вместе с фоном. Tween-эффекты: выпад, отскок-пружина, ragdoll.

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useGame } from '@/lib/game/store';
import { simulateBattleTick, initTauntState, FIXED_TIMESTEP_MS } from '@/lib/game/logic/battle';
import { mulberry32 } from '@/lib/game/rng';
import type { BattleState, Combatant, Position, Role } from '@/lib/game/types';
import { HpBar } from './bits';
import { DwarfSprite, FoeSprite } from './sprites';
import { playSfx } from '@/lib/game/sfx';
import type { SfxName } from '@/lib/game/sfx';

// §3.1.1 v6.9: за 3 раунда до лимита — приближение (тряска, камнепад, гул, HUD-строка);
// в финале — обвал (обычный/элита) или Древний (босс)
const WARN_ROUNDS = 3;
type VanishKind = 'collapse' | 'ancient' | null;

interface Stone { id: number; left: number; size: number }

interface Popup {
  id: number;
  uid: string;
  text: string;
  kind: 'dmg' | 'heal';
}

interface UnitView {
  flash: 'hit' | 'heal' | null;
  lunge: boolean;
  spark: string | null;
}

type Slot = { left: number; bottom: number; size: number; z: number; delay?: number };

// мир едет влево: скорость земли = плитка 62px за такт шага 0.55s (см. groundScroll)
const GROUND_SPEED = 62 / 0.55;
const ALLY_DEATH_S = 0.5;
const FOE_DEATH_S = 0.9;

// павший лежит на земле и уезжает влево с фоном: дистанция — до края сцены,
// длительность — дистанция / скорость земли, задержка — пока играет анимация смерти
function deadDragStyle(left: number, size: number, deathS: number): CSSProperties {
  const dist = Math.round(left + size + 24);
  return {
    '--drag-dist': `${dist}px`,
    '--drag-time': `${(dist / GROUND_SPEED).toFixed(2)}s`,
    '--drag-delay': `${deathS}s`,
  } as CSSProperties;
}

const SPEEDS = [
  { label: '1×', ms: 800, run: 1 },
  { label: '2×', ms: 400, run: 2 },
  { label: '4×', ms: 140, run: 4 },
];

// порядок внутри линии (§5.2): танк → воин → лучник → маг → поддержка
const COLUMN_ORDER: Role[] = ['tank', 'warrior', 'ranged', 'mage', 'support'];

function roleRank(r: Role): number {
  const i = COLUMN_ORDER.indexOf(r);
  return i < 0 ? 9 : i;
}

const RUNE_CHARS = ['ᚠ', 'ᚱ', 'ᚦ', 'ᛉ', 'ᛟ', 'ᛝ', 'ᚹ', 'ᛇ'];

function statusIcons(c: Combatant): string {
  return c.statuses
    .map((s) => (s.type === 'burn' ? '🔥' : s.type === 'poison' ? '☠️' : s.type === 'bleed' ? '🩸' : '💫'))
    .join('');
}

interface TurnDiff {
  popups: Omit<Popup, 'id'>[];
  lunges: Set<string>;
  sparks: { uid: string; color: string }[];
  sfx: SfxName;
}

function diffTurns(prev: BattleState, next: BattleState): TurnDiff {
  const prevByUid = new Map([...prev.allies, ...prev.foes].map((c) => [c.uid, c]));
  const popups: Omit<Popup, 'id'>[] = [];
  const lunges = new Set<string>();
  const sparks: { uid: string; color: string }[] = [];
  const kinds = new Set(next.log.map((e) => e.kind));
  const everyone = [...next.allies, ...next.foes];

  for (const c of everyone) {
    const p = prevByUid.get(c.uid);
    if (!p || !p.alive) continue;
    const delta = c.hp - p.hp;
    if (delta < 0) popups.push({ uid: c.uid, text: `−${Math.round(-delta)}`, kind: 'dmg' });
    else if (delta > 0) popups.push({ uid: c.uid, text: `+${Math.round(delta)}`, kind: 'heal' });
  }

  for (const ev of next.log) {
    if (!(ev.kind === 'hit' || ev.kind === 'double' || ev.kind === 'splash') || !ev.actor) continue;
    const actor = everyone.find((x) => x.name === ev.actor && x.alive);
    if (!actor) continue;
    const target = ev.target ? everyone.find((x) => x.name === ev.target) : undefined;
    // дальние роли и ranged-враги (§5.2, v7.0 §3.1.5) бьют с дистанции — искра на цели вместо выпада
    const distAttack =
      (actor.side === 'ally' && (actor.role === 'ranged' || actor.role === 'mage')) ||
      actor.attackType === 'ranged';
    if (distAttack && target) {
      sparks.push({
        uid: target.uid,
        color: actor.attackType === 'ranged' ? '#b8e05a' : actor.role === 'mage' ? '#7fb2ff' : '#e0c070',
      });
    } else {
      lunges.add(actor.uid);
    }
  }

  let sfx: SfxName = 'click';
  if (kinds.has('death')) sfx = 'death';
  else if (kinds.has('hit') || kinds.has('double') || kinds.has('splash')) sfx = 'hit';
  else if (kinds.has('heal') || kinds.has('regen') || kinds.has('lifesteal')) sfx = 'heal';
  else if (kinds.has('dot') || kinds.has('status') || kinds.has('stun')) sfx = 'magic';

  return { popups, lunges, sparks, sfx };
}

function clearAnimations(v: UnitView): UnitView {
  return v.flash === null && !v.lunge && v.spark === null ? v : { flash: null, lunge: false, spark: null };
}

export function BattleScreen() {
  const { state, dispatch } = useGame();
  const battle = state.battle!;
  const [cur, setCur] = useState<BattleState>(() => initTauntState(battle));
  const [views, setViews] = useState<Record<string, UnitView>>(() =>
    Object.fromEntries([...battle.allies, ...battle.foes].map((c) => [c.uid, { flash: null, lunge: false, spark: null }])),
  );
  const [popups, setPopups] = useState<Popup[]>([]);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [speedIdx, setSpeedIdx] = useState(1);
  const popupId = useRef(0);
  const prngRef = useRef<(() => number) | null>(null);
  // последняя слотовая позиция врага — павший остаётся на месте падения
  const foeSlotRef = useRef(new Map<string, Slot>());
  // v6.9: раунд гибели каждого юнита — финальные анимации только для погибших в финальном раунде
  const deathTurnRef = useRef(new Map<string, number>());
  const warnedRef = useRef(false);
  const stoneId = useRef(0);
  const [stones, setStones] = useState<Stone[]>([]);

  const isBoss = cur.foes.some((f) => f.isBoss);
  const turnLimit = isBoss ? 60000 : 30000; // мс, боевое время
  const finished = cur.status !== 'active';
  // §3.1.1: зона предупреждения (последние 5 секунд) и эпичный финал
  const warning = cur.status === 'active' && cur.timeElapsed >= turnLimit - 5000;
  const isCollapse = cur.endReason === 'timeout_collapse';
  const isAncient = cur.endReason === 'timeout_ancient';
  const rumbling = warning || (finished && (isCollapse || isAncient));

  // новый бой (START_BATTLE при уже открытом экране) — сброс
  useEffect(() => {
    foeSlotRef.current.clear();
    deathTurnRef.current.clear();
    warnedRef.current = false;
    setStones([]);
    setCur(initTauntState(battle));
    setViews(Object.fromEntries([...battle.allies, ...battle.foes].map((c) => [c.uid, { flash: null, lunge: false, spark: null }])));
    setLogLines([]);
    setPopups([]);
    prngRef.current = mulberry32(battle.seed);
  }, [battle]);

  // реалтайм-цикл: requestAnimationFrame + FIXED_TIMESTEP_MS accumulator
  useEffect(() => {
    if (cur.status !== 'active') return;
    if (!prngRef.current) return; // prng ещё не инициализирован
    let rafId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const maxTicks = 4;
    const prng = prngRef.current;

    function frame(now: number) {
      accumulator += now - lastTime;
      lastTime = now;
      let ticks = 0;
      while (accumulator >= FIXED_TIMESTEP_MS && ticks < maxTicks) {
        const next = simulateBattleTick(cur, FIXED_TIMESTEP_MS, prng);
        const d = diffTurns(cur, next);
        playSfx(d.sfx);
        const tickRound = Math.floor(next.timeElapsed / FIXED_TIMESTEP_MS);
        for (const u of [...cur.allies, ...cur.foes]) {
          const n = next.allies.find((x) => x.uid === u.uid) ?? next.foes.find((x) => x.uid === u.uid);
          if (n && u.alive && !n.alive) deathTurnRef.current.set(u.uid, tickRound);
        }
        setViews((prev) => {
          const out: Record<string, UnitView> = {};
          for (const uid of Object.keys(prev)) out[uid] = clearAnimations(prev[uid]);
          for (const uid of d.lunges) {
            out[uid] = { ...(out[uid] ?? { flash: null, lunge: false, spark: null }), lunge: true };
          }
          for (const s of d.sparks) {
            out[s.uid] = { ...(out[s.uid] ?? { flash: null, lunge: false, spark: null }), spark: s.color };
          }
          return out;
        });
        if (d.popups.length) {
          const withIds = d.popups.map((p) => ({ ...p, id: ++popupId.current }));
          setPopups((ps) => [...ps, ...withIds]);
          setTimeout(() => setPopups((ps) => ps.filter((x) => !withIds.some((w) => w.id === x.id))), 900);
        }
        setLogLines((l) => [...l, ...next.log.map((e) => e.text)].slice(-7));
        setCur(next);
        accumulator -= FIXED_TIMESTEP_MS;
        ticks++;
        if (next.status !== 'active') break;
      }
      if (cur.status === 'active') {
        rafId = requestAnimationFrame(frame);
      }
    }
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [cur.status]);

  // сброс подсветки/выпадов
  useEffect(() => {
    const t = setTimeout(() => {
      setViews((prev) => {
        const out: Record<string, UnitView> = {};
        for (const uid of Object.keys(prev)) out[uid] = clearAnimations(prev[uid]);
        return out;
      });
    }, 660);
    return () => clearTimeout(t);
  });

  // §3.1.1: гул глубин один раз — при входе в зону предупреждения
  useEffect(() => {
    if (warning && !warnedRef.current) {
      warnedRef.current = true;
      playSfx('rumble');
    }
  }, [warning]);

  // камнепад в зоне предупреждения: частица каждые ~240 мс
  useEffect(() => {
    if (!warning) {
      setStones([]);
      return;
    }
    const spawn = () => {
      const st: Stone = { id: ++stoneId.current, left: 4 + Math.random() * 92, size: 5 + Math.round(Math.random() * 6) };
      setStones((s) => [...s.slice(-13), st]);
      setTimeout(() => setStones((s) => s.filter((x) => x.id !== st.id)), 1100);
    };
    spawn();
    const iv = setInterval(spawn, 240);
    return () => clearInterval(iv);
  }, [warning]);

  // конец боя → звук оверлея и фиксация результата в store
  // эпичный финал (§3.1.1): гул + 3 с на анимации обвала/Древнего до перехода
  useEffect(() => {
    if (cur.status === 'active') return;
    const epic = cur.endReason === 'timeout_ancient' || cur.endReason === 'timeout_collapse';
    if (epic) playSfx('rumble');
    playSfx(cur.status === 'won' ? 'victory' : 'defeat');
    const t = setTimeout(() => dispatch({ type: 'BATTLE_FINISH', state: cur }), epic ? 3000 : 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.status]);

  const skip = () => {
    let s = cur;
    const texts: string[] = [];
    let guard = 0;
    while (s.status === 'active' && guard < 3600) {
      const next = simulateBattleTick(s, FIXED_TIMESTEP_MS, mulberry32(state.battle!.seed));
      texts.push(...next.log.map((e) => e.text));
      s = next;
      guard += 1;
    }
    for (const u of [...cur.allies, ...cur.foes]) {
      const n = s.allies.find((x) => x.uid === u.uid) ?? s.foes.find((x) => x.uid === u.uid);
      if (n && u.alive && !n.alive) deathTurnRef.current.set(u.uid, Math.floor(s.timeElapsed / FIXED_TIMESTEP_MS));
    }
    setViews(Object.fromEntries([...s.allies, ...s.foes].map((c) => [c.uid, { flash: null, lunge: false, spark: null }])));
    setLogLines((l) => [...l, ...texts].slice(-7));
    setCur(s);
  };

  const bossName = cur.foes.find((f) => f.isBoss)?.name ?? 'Босс';
  const floor = state.run?.floor ?? 0;

  // финальные анимации — только для погибших в финальном раунде
  const vanishOf = (c: Combatant): VanishKind => {
    if (!finished || c.alive) return null;
    if (isCollapse || isAncient) return deathTurnRef.current.get(c.uid) === Math.floor(cur.timeElapsed / FIXED_TIMESTEP_MS) ? (isCollapse ? 'collapse' : 'ancient') : null;
    return null;
  };

  // сортировка: линия игрока (front→mid→back, §3.1), внутри — танк→воин→стрелок→маг→жрец
  const POS_RANK: Record<Position, number> = { front: 0, mid: 1, back: 2 };
  const allies = cur.allies
    .map((c, i) => ({ c, i }))
    .sort(
      (a, b) =>
        POS_RANK[a.c.position] - POS_RANK[b.c.position] || roleRank(a.c.role) - roleRank(b.c.role) || a.i - b.i,
    )
    .map((x) => x.c);

  const sceneRef = useRef<HTMLDivElement>(null);
  const [sceneW, setSceneW] = useState(896);
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setSceneW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // построение: линии сходятся у центра — front игрока встык к врагам;
  // глубинные ряды выше, мельче и на шаг дальше от точки контакта
  const compact = sceneW < 640;
  const G = compact
    ? { allySize: 48, allyStep: 54, allyCols: 3, foeCols: 3, foeSize: 46, bossSize: 66, gap: 10, shift: 8, bottoms: [24, 46, 68] as const, scales: [1, 0.88, 0.78] as const }
    : { allySize: 68, allyStep: 78, allyCols: 4, foeCols: 5, foeSize: 64, bossSize: 88, gap: 26, shift: 10, bottoms: [26, 52, 76] as const, scales: [1, 0.88, 0.78] as const };
  const rankStep = G.bottoms[1] - G.bottoms[0];
  const foeStepBase = G.foeSize + 10;
  const foeRowW = Math.min(cur.foes.length, G.foeCols) * foeStepBase - 10;
  const allyRowW = Math.min(allies.length, G.allyCols) * G.allyStep - (G.allyStep - G.allySize);
  const clusterW = allyRowW + G.gap + Math.max(foeRowW, isBoss ? G.bossSize : 0);
  const clusterLeft = Math.max(0, (sceneW - clusterW) / 2);
  const allyRight = clusterLeft + allyRowW;
  const foeLeft0 = allyRight + G.gap;

  // col 0 — фронт линии (у точки контакта), глубже — дальше от врага
  const allySlot = (i: number) => {
    const rank = Math.min(Math.floor(i / G.allyCols), 2);
    const col = i % G.allyCols;
    const size = Math.round(G.allySize * G.scales[rank]);
    return {
      left: allyRight - rank * G.shift - (col + 1) * G.allyStep + (G.allyStep - size) / 2,
      bottom: G.bottoms[0] + 2 + rank * rankStep,
      size,
      z: 30 - rank * 4,
      delay: i * 0.1,
    };
  };

  const foeSlot = (i: number, boss: boolean): Slot => {
    const row = Math.min(Math.floor(i / G.foeCols), 2);
    const col = i % G.foeCols;
    const size = Math.round((boss ? G.bossSize : G.foeSize) * G.scales[row]);
    return {
      left: foeLeft0 + row * G.shift + col * (size + 10) + 5,
      bottom: G.bottoms[row],
      size,
      z: 32 - row * 10,
      delay: Math.min(i * 0.5, 6),
    };
  };

  // живые враги занимают слоты по порядку (ближний — первый живой); павшие держат
  // последнюю позицию из ref — отряд «добегает» до следующего врага (§5.2)
  const foeSlotsNow = new Map<string, Slot>();
  let foeIdx = 0;
  for (const f of cur.foes) {
    if (!f.alive) continue;
    const s = foeSlot(foeIdx++, !!f.isBoss);
    foeSlotsNow.set(f.uid, s);
    foeSlotRef.current.set(f.uid, s);
  }
  const foeSlotOf = (f: Combatant): Slot =>
    foeSlotsNow.get(f.uid) ?? foeSlotRef.current.get(f.uid) ?? foeSlot(0, !!f.isBoss);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-3 pb-6 pt-4 sm:px-4">
      <header className="panel-wood mb-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="font-runic text-base font-black text-amber-300 sm:text-lg">
            {isBoss ? `👑 ${bossName}` : '⚔️ Бой'}
          </div>
          <div className="flex flex-col text-[10px] font-bold uppercase tracking-wide text-stone-400 sm:text-[11px]">
            <span>этаж {floor}</span>
            <span className={warning ? 'text-red-300' : undefined}>{Math.max(0, Math.round((turnLimit - cur.timeElapsed) / 1000))}с</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSpeedIdx(i)}
              className={`min-h-[36px] rounded px-2 py-1 text-xs font-black ring-1 transition ${
                i === speedIdx
                  ? 'bg-amber-600/30 text-amber-200 ring-amber-500/60'
                  : 'text-stone-500 ring-stone-700 hover:text-stone-300'
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={skip}
            disabled={finished}
            className="min-h-[36px] rounded bg-stone-800 px-2 py-1 text-xs font-bold text-stone-300 ring-1 ring-stone-600 transition enabled:hover:bg-stone-700 disabled:opacity-40"
          >
            ⏭
          </button>
        </div>
      </header>

      {/* сцена: 5 слоёв параллакса + земля */}
      <div
        ref={sceneRef}
        className={`panel-stone relative flex-1 overflow-hidden rounded-lg transition ${
          finished ? (cur.status === 'won' ? 'ring-2 ring-emerald-700/60' : 'ring-2 ring-red-800/60') : ''
        } ${rumbling ? 'animate-rumble' : ''}`}
        style={{ minHeight: 300, '--run': SPEEDS[speedIdx].run } as CSSProperties}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#141018] via-[#1c1512] to-[#241a10]" />
        <div className="layer-far absolute inset-x-[-80px] bottom-8 h-44" />
        <div className="layer-mid absolute inset-x-[-120px] bottom-8 h-36" />
        <div className="absolute inset-x-0 bottom-8 overflow-hidden">
          <div className="rune-track flex w-max font-runic text-2xl text-sky-300/70">
            {[...RUNE_CHARS, ...RUNE_CHARS].map((ch, i) => (
              <span key={i} className="rune-char px-5" style={{ animationDelay: `${(i % RUNE_CHARS.length) * 0.4}s` }}>
                {ch}
              </span>
            ))}
          </div>
        </div>
        <div className="layer-near absolute inset-x-[-60px] bottom-8 h-28" />
        <div className="layer-fog absolute inset-x-0 bottom-8 h-40" />

        {/* §3.1.1 приближение: HUD-строка и камнепад в зоне предупреждения */}
        {warning && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center">
            <div className="animate-pulse rounded bg-black/75 px-4 py-1.5 font-runic text-sm font-black text-red-300 ring-1 ring-red-800/80 sm:text-base">
              Глубины пробуждаются…
            </div>
          </div>
        )}
        {stones.map((st) => (
          <div
            key={st.id}
            className="animate-stone pointer-events-none absolute top-0 z-20"
            style={{
              left: `${st.left}%`,
              width: st.size,
              height: st.size,
              background: '#3d2f1e',
              boxShadow: 'inset -1px -2px 0 #241a10, 0 0 4px rgba(0,0,0,0.6)',
            }}
          />
        ))}

        {/* гномы: линии слева, front у врагов; забег с края при старте боя */}
        {allies.map((c, i) => {
          const s = allySlot(i);
          return (
            <AllyUnit
              key={c.uid}
              c={c}
              left={s.left}
              bottom={s.bottom}
              size={s.size}
              z={s.z}
              delay={s.delay}
              view={views[c.uid] ?? { flash: null, lunge: false, spark: null }}
              popups={popups.filter((p) => p.uid === c.uid)}
              vanish={vanishOf(c)}
            />
          );
        })}

        {/* враги: выбегают справа навстречу, живые сдвигаются вперёд по мере гибели передних */}
        {cur.foes.map((c, i) => {
          const s = foeSlotOf(c);
          return (
            <FoeUnit
              key={c.uid}
              c={c}
              left={s.left}
              bottom={s.bottom}
              size={s.size}
              z={s.z}
              delay={Math.min(i * 0.5, 6)}
              view={views[c.uid] ?? { flash: null, lunge: false, spark: null }}
              popups={popups.filter((p) => p.uid === c.uid)}
              vanish={vanishOf(c)}
            />
          );
        })}

        {/* §3.1.1 финал «Древний»: силуэт выходит справа и светится */}
        {isAncient && (
          <div className="animate-ancient-enter pointer-events-none absolute bottom-8 right-2 z-[35]">
            <FoeSprite name="Древний" size={compact ? 116 : 168} className="animate-ancient-glow" />
          </div>
        )}

        {/* земля */}
        <div className="ground-strip absolute inset-x-0 bottom-0 h-9" />

        {/* §3.1.1: эпичный финал — затемнение и текст по endReason */}
        {finished && (isCollapse || isAncient) && (
          <>
            <div
              className="animate-dark-veil absolute inset-0 z-40 bg-black/90"
              style={{ animationDelay: isAncient ? '0.9s' : '0.25s' }}
            />
            <div className="absolute inset-0 z-50 flex items-center justify-center">
              <div
                className="animate-pop panel-wood rounded-lg px-8 py-6 text-center"
                style={{ animationDelay: isAncient ? '1.5s' : '0.9s' }}
              >
                <div className="font-runic text-4xl font-black text-red-400">
                  {isCollapse ? 'ОБВАЛ' : 'ДРЕВНИЙ ПРОБУДИЛСЯ'}
                </div>
                <div className="mt-2 text-sm text-stone-300">
                  {isCollapse ? 'Пещера обрушилась. Гномы погребены.' : 'Древний пробудился. Гномы пали.'}
                </div>
              </div>
            </div>
          </>
        )}

        {finished && !isCollapse && !isAncient && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55">
            <div className="animate-pop panel-wood rounded-lg px-8 py-6 text-center">
              <div className={`font-runic text-4xl font-black ${cur.status === 'won' ? 'text-amber-300' : 'text-red-400'}`}>
                {cur.status === 'won' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ…'}
              </div>
              <div className="mt-2 text-sm text-stone-300">
                {cur.status === 'won' ? 'Глубины отступают… пока что.' : 'Отряд не выдержал натиска.'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel-stone mt-3 h-24 overflow-hidden rounded-lg p-2.5 font-mono text-[11px] leading-relaxed text-stone-400">
        {logLines.map((t, i) => (
          <div key={`${i}-${t}`} className={i === logLines.length - 1 ? 'text-amber-200' : ''}>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Юниты ────────────────────────────────────────────────────────────

function Popups({ popups }: { popups: Popup[] }) {
  return (
    <>
      {popups.map((p, i) => (
        <div
          key={p.id}
          className={`animate-floatup absolute left-1/2 top-0 z-30 -translate-x-1/2 text-base font-black drop-shadow-[0_1px_0_#000] ${
            p.kind === 'heal' ? 'text-emerald-400' : 'text-orange-300'
          }`}
          style={{ marginTop: i * -10 }}
        >
          {p.text}
        </div>
      ))}
    </>
  );
}

function Spark({ color }: { color: string }) {
  return (
    <div
      className="animate-spark absolute left-1/2 top-1/2 z-20 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background: `radial-gradient(circle, ${color} 0%, ${color}88 40%, transparent 70%)`,
      }}
    />
  );
}

function AllyUnit({
  c,
  left,
  bottom,
  size,
  z,
  delay,
  view,
  popups,
  vanish,
}: {
  c: Combatant;
  left: number;
  bottom: number;
  size: number;
  z: number;
  delay: number;
  view: UnitView;
  popups: Popup[];
  vanish: VanishKind;
}) {
  const dead = !c.alive;
  const drag = dead && !vanish;
  const vanishCls =
    vanish === 'ancient' ? 'animate-ancient-fall' : vanish === 'collapse' ? 'animate-collapse-vanish' : '';
  return (
    <div
      className="animate-ally-enter absolute"
      style={{ left, bottom, zIndex: z, animationDelay: `${delay}s` }}
    >
      {/* павший лежит на земле и уезжает влево с фоном; в финале — растворяется/ragdoll (§3.1.1) */}
      <div
        className={dead ? vanishCls || 'animate-dead-drag' : ''}
        style={{
          ...(drag ? deadDragStyle(left, size, ALLY_DEATH_S) : null),
          ...(vanish ? { animationDelay: vanish === 'ancient' ? '0.45s' : '0.2s' } : null),
        }}
      >
      <div className={`relative ${drag ? 'animate-ally-death' : ''}`}>
        <Popups popups={popups} />
        {view.spark && <Spark color={view.spark} />}
        <div
          className={`${dead ? '' : 'animate-march'} ${view.flash === 'hit' ? 'animate-hitflash' : ''}`}
          style={{ animationDelay: `${(left % 9) * 0.2}s` }}
        >
          {/* выпад к врагу при ближней атаке (§5.2) — отряд при этом продолжает бежать */}
          <div className={view.lunge ? 'animate-ally-lunge' : ''}>
            <DwarfSprite name={c.name} size={size} className={dead ? 'opacity-60 grayscale' : ''} />
          </div>
        </div>
        {c.tauntLeft > 0 && !dead && (
          <div className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        )}
      </div>
      <div className="mt-0.5" style={{ width: size }}>
        <HpBar hp={c.hp} hpMax={c.hpMax} />
      </div>
      <div
        className="mt-0.5 truncate text-center text-[9px] font-bold text-stone-300 drop-shadow-[0_1px_0_#000]"
        style={{ width: size }}
      >
        {c.name}
      </div>
      {c.statuses.length > 0 && <div className="text-center text-[9px]">{statusIcons(c)}</div>}
      </div>
    </div>
  );
}

function FoeUnit({
  c,
  left,
  bottom,
  size,
  z,
  delay,
  view,
  popups,
  vanish,
}: {
  c: Combatant;
  left: number;
  bottom: number;
  size: number;
  z: number;
  delay: number;
  view: UnitView;
  popups: Popup[];
  vanish: VanishKind;
}) {
  const dead = !c.alive;
  const drag = dead && !vanish;
  const vanishCls =
    vanish === 'ancient' ? 'animate-ancient-fall' : vanish === 'collapse' ? 'animate-collapse-vanish' : '';
  return (
    <div
      className="animate-foe-enter absolute"
      style={{
        left,
        bottom,
        zIndex: z,
        animationDelay: `${delay}s`,
        transition: 'left 0.55s ease, bottom 0.55s ease',
      }}
    >
      {/* павший лежит на земле и уезжает влево с фоном; в финале — растворяется/ragdoll (§3.1.1) */}
      <div
        className={dead ? vanishCls || 'animate-dead-drag' : ''}
        style={{
          ...(drag ? deadDragStyle(left, size, FOE_DEATH_S) : null),
          ...(vanish ? { animationDelay: vanish === 'ancient' ? '0.45s' : '0.2s' } : null),
        }}
      >
      <div className={`relative ${drag ? 'animate-foe-death' : ''}`}>
        <Popups popups={popups} />
        {view.spark && <Spark color={view.spark} />}
        <div
          className={`${dead ? '' : 'animate-march-foe'} ${view.flash === 'hit' ? 'animate-hitflash' : ''}`}
          style={{ animationDelay: `${(left % 9) * 0.3}s` }}
        >
          {/* отскок от удара — пружинка вправо (от гномов) */}
          <div className={view.lunge ? 'animate-knockback' : ''}>
            <FoeSprite name={c.name} size={size} />
          </div>
        </div>
      </div>
      <div className="mt-0.5" style={{ width: size }}>
        <HpBar hp={c.hp} hpMax={c.hpMax} />
      </div>
      <div
        className="mt-0.5 truncate text-center text-[9px] font-bold text-red-200/90 drop-shadow-[0_1px_0_#000]"
        style={{ width: size }}
      >
        {c.name}
      </div>
      {c.statuses.length > 0 && <div className="text-center text-[9px]">{statusIcons(c)}</div>}
      </div>
    </div>
  );
}
