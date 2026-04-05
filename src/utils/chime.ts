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

    // Soft two-note chime: C5 then E5, each with a harmonic overtone
    tone(523.25, 0.28, 0);      // C5
    tone(1046.5, 0.10, 0);      // C6 overtone
    tone(659.25, 0.22, 0.18);   // E5 (slightly delayed)
    tone(1318.5, 0.08, 0.18);   // E6 overtone
  } catch {
    // AudioContext unavailable — silently skip
  }
}
