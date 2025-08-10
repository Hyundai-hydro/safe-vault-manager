export function beep(freq = 660, duration = 140, type: OscillatorType = "sine", volume = 0.2) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, duration);
  } catch {
    // ignore audio errors
  }
}

export function chimeSuccess() {
  beep(800, 120, "sine", 0.15);
  setTimeout(() => beep(1200, 100, "sine", 0.15), 120);
}

export function warn() {
  beep(300, 180, "square", 0.2);
}

export function errorTone() {
  beep(180, 220, "sawtooth", 0.22);
}
