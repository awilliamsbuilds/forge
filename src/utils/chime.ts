export function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const tone = (freq: number, vol: number, delay: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.8);
      osc.start(now + delay);
      osc.stop(now + delay + 1.8);
    };

    // Three-note ascending chime: C5 → E5 → G5, each with overtone
    tone(523.25, 0.55, 0);      // C5
    tone(1046.5, 0.20, 0);      // C6 overtone
    tone(659.25, 0.45, 0.18);   // E5
    tone(1318.5, 0.16, 0.18);   // E6 overtone
    tone(783.99, 0.38, 0.34);   // G5
    tone(1567.98, 0.13, 0.34);  // G6 overtone
  } catch {
    // AudioContext unavailable — silently skip
  }
}
