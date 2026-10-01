const DURATION = 0.016; // seconds, short enough to stay distinct during a fling
const MASTER_GAIN = 0.055;

const MODES = [
  { frequency: 980, decay: 0.0038, gain: 0.5, phase: 0 },
  { frequency: 1820, decay: 0.0024, gain: 0.3, phase: 0.65 },
  { frequency: 3160, decay: 0.00115, gain: 0.12, phase: 1.3 },
] as const;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext
  );
}

// One shared context/buffer/gain for the whole page, ref-counted across every
// `createTickPlayer()` caller — several players sit side by side (a date's
// month/day/year drums), and one AudioContext each risks a browser's cap.
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let clickBuffer: AudioBuffer | null = null;
let consumers = 0;

function buildClickBuffer(context: AudioContext): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = Math.ceil(DURATION * sampleRate);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let peak = 0;
  let previousNoise = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.00012);
    const fadeOut = Math.min(1, (DURATION - t) / 0.001);
    let resonance = 0;
    for (const mode of MODES) {
      resonance +=
        Math.sin(2 * Math.PI * mode.frequency * t + mode.phase) *
        Math.exp(-t / mode.decay) *
        mode.gain;
    }

    // Differencing consecutive noise samples removes the low, papery part of
    // white noise and leaves only a tiny impact at the front of the sound.
    const noise = Math.random() * 2 - 1;
    const transient =
      (noise - previousNoise) * Math.exp(-t / 0.00038) * 0.035;
    previousNoise = noise;

    data[i] = (resonance + transient) * attack * fadeOut;
    peak = Math.max(peak, Math.abs(data[i]));
  }
  if (peak > 0) {
    const norm = 0.9 / peak;
    for (let i = 0; i < length; i++) data[i] *= norm;
  }

  return buffer;
}

function ensureContext() {
  if (ctx) return;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = MASTER_GAIN;
  masterGain.connect(ctx.destination);
  clickBuffer = buildClickBuffer(ctx);
}

function prepareContext() {
  ensureContext();
  if (ctx?.state === "suspended") {
    // Browsers may reject this outside a trusted gesture; the repeat attempt
    // here keeps a direct `play()` call safe as well.
    void ctx.resume().catch(() => undefined);
  }
}

interface TickPlayer {
  prepare: () => void;
  play: () => void;
  dispose: () => void;
}

/**
 * Lazily-initialized tick player: no `AudioContext` is created until the first
 * `prepare()` / `play()` anywhere on the page. Silent no-ops without Web Audio.
 */
export function createTickPlayer(): TickPlayer {
  consumers++;
  let disposed = false;
  let activeSource: AudioBufferSourceNode | null = null;

  return {
    prepare() {
      if (disposed) return;
      prepareContext();
    },
    play() {
      if (disposed) return;
      prepareContext();
      if (!ctx || !masterGain || !clickBuffer) return;
      // A fast fling crosses rows faster than a tick's tail; cutting it keeps
      // the feedback dry instead of stacking into a metallic ring.
      activeSource?.stop();
      const source = ctx.createBufferSource();
      source.buffer = clickBuffer;
      source.connect(masterGain);
      source.onended = () => {
        source.disconnect();
        if (activeSource === source) activeSource = null;
      };
      activeSource = source;
      source.start();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      activeSource?.stop();
      activeSource = null;
      consumers = Math.max(0, consumers - 1);
      if (consumers === 0 && ctx) {
        ctx.close();
        ctx = null;
        masterGain = null;
        clickBuffer = null;
      }
    },
  };
}
