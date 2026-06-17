// Synthetic audio via Web Audio API — no audio files needed.
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playHeartbeat() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    const lubDub = (t) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = 55;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    };

    lubDub(now);
    lubDub(now + 0.22);
  } catch {}
}

export function playGong() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Primary resonant tone
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 5);
    osc.start(now);
    osc.stop(now + 5);

    // Overtone for richness
    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.connect(gain2);
    gain2.connect(ac.destination);
    osc2.type = 'sine';
    osc2.frequency.value = 440;
    gain2.gain.setValueAtTime(0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 3);
    osc2.start(now);
    osc2.stop(now + 3);
  } catch {}
}

export function playTick() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.value = 0.15;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start(now);
  } catch {}
}
