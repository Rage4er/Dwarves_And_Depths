// WebAudio-синтез, без сэмплов (ТЗ §2.1)

export type SfxName =
  | 'click' | 'coin' | 'hit' | 'crit' | 'death' | 'victory'
  | 'defeat' | 'heal' | 'forge' | 'magic' | 'open' | 'levelup' | 'rumble';

let ctx: AudioContext | null = null;
let enabled = true;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

type PlayName = SfxName | 'end' | BattleEventSfx;
type BattleEventSfx = 'hit' | 'crit' | 'double' | 'splash' | 'dot' | 'heal' | 'death' | 'status' | 'info';

export function playSfx(name: PlayName) {
  if (name === 'end') {
    sfx('victory');
    return;
  }
  sfx(name as SfxName);
}

export function sfxForEvent(kind: string): SfxName {
  switch (kind) {
    case 'crit': return 'crit';
    case 'hit':
    case 'double':
    case 'splash': return 'hit';
    case 'dot': return 'magic';
    case 'heal': return 'heal';
    case 'death': return 'death';
    case 'status': return 'magic';
    default: return 'click';
  }
}

export function sfx(name: SfxName) {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;

  const tone = (
    freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0
  ) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t + delay);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + delay + dur);
    gain.gain.setValueAtTime(vol, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t + delay);
    osc.stop(t + delay + dur + 0.02);
  };

  const noise = (dur: number, vol: number, delay = 0) => {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
    src.buffer = buf;
    src.connect(gain).connect(ac.destination);
    src.start(t + delay);
  };

  switch (name) {
    case 'click': tone(600, 0.05, 'square', 0.03); break;
    case 'coin': tone(900, 0.07, 'square', 0.05); tone(1350, 0.09, 'square', 0.04, undefined, 0.06); break;
    case 'hit': noise(0.12, 0.12); tone(140, 0.1, 'sawtooth', 0.08, 60); break;
    case 'crit': noise(0.16, 0.16); tone(200, 0.14, 'sawtooth', 0.1, 50); tone(800, 0.1, 'square', 0.05, 300, 0.02); break;
    case 'death': tone(300, 0.35, 'sawtooth', 0.1, 40); noise(0.25, 0.08, 0.05); break;
    case 'victory': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.06, undefined, i * 0.12)); break;
    case 'defeat': [400, 320, 240, 160].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.07, undefined, i * 0.16)); break;
    case 'heal': tone(520, 0.12, 'sine', 0.06, 780); tone(780, 0.15, 'sine', 0.05, 1040, 0.08); break;
    case 'magic': tone(880, 0.18, 'sine', 0.05, 220); break;
    case 'forge': noise(0.2, 0.14); tone(120, 0.18, 'square', 0.1, 80); break;
    case 'open': tone(440, 0.08, 'triangle', 0.05, 660); break;
    case 'levelup': [392, 523, 659].forEach((f, i) => tone(f, 0.15, 'triangle', 0.07, undefined, i * 0.1)); break;
    // v6.9 §3.1.1: гул глубин перед финалом таймаута — низкие частоты + шум
    case 'rumble':
      noise(1.0, 0.09);
      tone(48, 1.1, 'sawtooth', 0.11, 36);
      tone(32, 1.2, 'triangle', 0.09, 22, 0.08);
      break;
  }
}
