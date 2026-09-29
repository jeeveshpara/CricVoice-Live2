import { useState, useCallback } from "react";

export function useAudioSynth() {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const getOrCreateCtx = useCallback(() => {
    if (audioCtx) return audioCtx;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioCtx(ctx);
    return ctx;
  }, [audioCtx]);

  // Synthesize custom white noise helper
  const createNoiseBuffer = useCallback((ctx: AudioContext, duration: number) => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }, []);

  // 1. IPL Brass Trumpet Riff
  const playTrumpetRiff = useCallback(() => {
    const ctx = getOrCreateCtx();
    if (ctx.state === "suspended") ctx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
    const durations = [0.15, 0.15, 0.15, 0.4];

    let time = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = "sawtooth";
      osc2.type = "triangle";
      
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq + 4, time); // Detuned harmony

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1100, time);
      filter.Q.setValueAtTime(1.8, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.25, time + 0.02);
      gainNode.gain.setValueAtTime(0.25, time + durations[idx] - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + durations[idx]);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(time);
      osc2.start(time);
      
      osc1.stop(time + durations[idx]);
      osc2.stop(time + durations[idx]);

      time += durations[idx] - 0.02;
    });
  }, [getOrCreateCtx]);

  // 2. Crowd Roar (Boundary Celebration)
  const playCrowdRoar = useCallback((intensity: "low" | "medium" | "high") => {
    const ctx = getOrCreateCtx();
    if (ctx.state === "suspended") ctx.resume();

    const duration = intensity === "low" ? 1.5 : intensity === "medium" ? 3.0 : 4.5;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, duration);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    // Rising sweep representing rising excitement
    filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 1.2);
    filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(intensity === "low" ? 0.2 : intensity === "medium" ? 0.45 : 0.65, ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }, [getOrCreateCtx, createNoiseBuffer]);

  // 3. Programmatic Dhol Beat pattern
  const playDholBeat = useCallback(() => {
    const ctx = getOrCreateCtx();
    if (ctx.state === "suspended") ctx.resume();

    let startTime = ctx.currentTime;
    const beats = 6;
    const beatInterval = 0.28; // Pace

    for (let i = 0; i < beats; i++) {
      const time = startTime + i * beatInterval;
      
      // Drum Kick (Bayan bass strike)
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.frequency.setValueAtTime(120, time);
      kickOsc.frequency.exponentialRampToValueAtTime(55, time + 0.15);

      kickGain.gain.setValueAtTime(0.4, time);
      kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);
      kickOsc.start(time);
      kickOsc.stop(time + 0.2);

      // Treble snap (Daayan high pitch snap) on alternative beats
      if (i % 2 === 1) {
        const snapOsc = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snapOsc.type = "triangle";
        snapOsc.frequency.setValueAtTime(320, time);
        snapOsc.frequency.linearRampToValueAtTime(180, time + 0.08);

        snapGain.gain.setValueAtTime(0.18, time);
        snapGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        snapOsc.connect(snapGain);
        snapGain.connect(ctx.destination);
        snapOsc.start(time);
        snapOsc.stop(time + 0.12);
      }
    }
  }, [getOrCreateCtx]);

  // 4. Celebration whistle (dynamic pitch sweep + LFO)
  const playWhistle = useCallback(() => {
    const ctx = getOrCreateCtx();
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2600, ctx.currentTime);
    osc.frequency.setValueAtTime(2600, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(3300, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(2800, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }, [getOrCreateCtx]);

  // 5. Cricket Out Horn / Buzzer
  const playOutHorn = useCallback(() => {
    const ctx = getOrCreateCtx();
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc2.type = "sawtooth";
    osc.frequency.setValueAtTime(110, ctx.currentTime); // Low detuned
    osc2.frequency.setValueAtTime(112, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + 1.2);
    osc2.stop(ctx.currentTime + 1.2);
  }, [getOrCreateCtx]);

  // 6. Celebration Firecrackers (random popping noise snaps)
  const playFirecrackers = useCallback(() => {
    const ctx = getOrCreateCtx();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const crackCount = 10;

    for (let i = 0; i < crackCount; i++) {
      const snapTime = now + Math.random() * 1.5;
      const duration = 0.03 + Math.random() * 0.04;

      const source = ctx.createBufferSource();
      source.buffer = createNoiseBuffer(ctx, duration);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1500 + Math.random() * 2000, snapTime);
      filter.Q.setValueAtTime(5, snapTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25 + Math.random() * 0.25, snapTime);
      gain.gain.exponentialRampToValueAtTime(0.001, snapTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(snapTime);
    }
  }, [getOrCreateCtx, createNoiseBuffer]);

  return {
    playTrumpetRiff,
    playCrowdRoar,
    playDholBeat,
    playWhistle,
    playOutHorn,
    playFirecrackers
  };
}
