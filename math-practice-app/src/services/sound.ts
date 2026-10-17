let sharedContext: AudioContext | null = null;

export function playResultSound(correct: boolean): void {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }
  try {
    if (!sharedContext) {
      sharedContext = new AudioContextCtor();
    }
    const context = sharedContext;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = correct ? 660 : 320;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);
    const start = context.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.04, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    oscillator.start(start);
    oscillator.stop(start + 0.24);
  } catch {
    sharedContext = null;
  }
}
