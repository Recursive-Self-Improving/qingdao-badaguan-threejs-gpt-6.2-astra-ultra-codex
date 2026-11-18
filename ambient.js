// The wind, surf and birds are synthesized locally. Audio starts on the first
// explicit sound toggle, so loading or walking through a view stays silent.
export function createAmbience() {
  let ctx, master, windLevel, surfLevel;
  let place = 0, enabled = false, disposed = false;
  let birdTimer, suspendTimer, generation = 0;
  const sources = new Set();
  const between = (a,b) => a + Math.random() * (b - a);

  function fade(param, target, seconds) {
    const now = ctx.currentTime;
    if (param.cancelAndHoldAtTime) {
      param.cancelAndHoldAtTime(now);
    } else {
      const current = param.value;
      param.cancelScheduledValues(now);
      param.setValueAtTime(current, now);
    }
    param.setTargetAtTime(target, now, seconds / 3);
  }

  function noiseBed(duration, surf) {
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(2, frames, ctx.sampleRate);
    const longSwells = surf ? 3 : 2;
    const phases = Array.from({length: 5}, () => between(0, 2 * Math.PI));
    // Integer wave counts ensure the slowly changing envelope repeats smoothly.
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let filtered = 0;
      for (let i = 0; i < frames; i++) {
        const phase = i / frames * Math.PI * 2;
        const grain = Math.random() * 2 - 1;
        filtered += (grain - filtered) * (surf ? .17 : .082);
        const drift = Math.sin(phase * longSwells + phases[0] + .32 * Math.sin(phase + phases[1]));
        const secondary = Math.sin(phase * (longSwells + 1) + phases[2]);
        const envelope = surf ? .08 + .88 * Math.pow(.5 + .5 * drift, 1.85) : .48 + .18 * drift + .09 * secondary;
        const spray = surf ? .19 * grain * Math.pow(.5 + .5 * Math.sin(phase * longSwells + phases[0] + .56), 3) : 0;
        data[i] = (filtered * 2.3 + spray) * envelope;
      }
      // A short crossfade prevents clicks at the noise buffer's loop boundary.
      const overlap = Math.min(2048, Math.floor(frames / 4));
      for (let i = 0; i < overlap; i++) {
        const t = i / overlap;
        data[frames - overlap + i] = data[frames - overlap + i] * (1-t) + data[i] * t;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = Math.min(2048, Math.floor(frames/4)) / ctx.sampleRate;
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = surf ? 75 : 125;
    highpass.Q.value = .45;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = surf ? 2800 : 1440;
    lowpass.Q.value = .48;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(highpass).connect(lowpass).connect(gain).connect(master);
    source.start();
    sources.add(source);
    return gain.gain;
  }

  function build() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('此瀏覽器無法播放環境聲');
    ctx = new Audio();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    windLevel = noiseBed(9.1, false);
    surfLevel = noiseBed(15.2, true);
    mix();
  }

  function mix() {
    if (!ctx) return;
    fade(windLevel, [.24, .31, .18][place], 1.2);
    fade(surfLevel, [.031, .013, .54][place], 1.6);
  }

  function sing() {
    if (!enabled || disposed || document.hidden || !ctx || ctx.state !== 'running' || place === 2) return;
    const now = ctx.currentTime;
    const register = between(2110, 3180);
    const notes = Math.random() < .45 ? 2 : 3;
    const startPan = between(-.73, .73);
    let t = now + .04;
    for (let i = 0; i < notes; i++) {
      const duration = between(.10,.21);
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      const base = register * (1 + .12 * Math.sin(i * 1.6));
      oscillator.frequency.setValueAtTime(base * .88, t);
      oscillator.frequency.exponentialRampToValueAtTime(base * between(1.13,1.24), t + duration * .48);
      oscillator.frequency.exponentialRampToValueAtTime(base * between(.92,1.04), t + duration);
      const level = ctx.createGain();
      level.gain.value = 0;
      level.gain.setValueAtTime(0, t);
      level.gain.linearRampToValueAtTime(between(.013,.025), t + .026);
      level.gain.exponentialRampToValueAtTime(.00004,t + duration);
      oscillator.connect(level);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) {
        pan.pan.value = startPan;
        level.connect(pan).connect(master);
      } else level.connect(master);
      oscillator.onended = () => {
        oscillator.disconnect();
        level.disconnect();
        pan?.disconnect();
        sources.delete(oscillator);
      };
      sources.add(oscillator);
      oscillator.start(t);
      oscillator.stop(t + duration + .025);
      t += duration + between(.045,.15);
    }
  }

  function scheduleBird(first) {
    clearTimeout(birdTimer);
    if (!enabled || disposed || document.hidden || place === 2) return;
    const wait = first ? between(3.5,6.1) : between(place === 1 ? 7 : 11, place === 1 ? 16 : 25);
    birdTimer = setTimeout(() => {
      sing();
      scheduleBird(false);
    },wait * 1000);
  }

  async function sync() {
    const stamp = ++generation;
    clearTimeout(suspendTimer);
    clearTimeout(birdTimer);
    if (!ctx || disposed) return;
    if (!enabled || document.hidden) {
      fade(master.gain,0,.36);
      suspendTimer = setTimeout(() => {
        if (stamp === generation && !disposed && (!enabled || document.hidden)) ctx.suspend().catch(() => {});
      },420);
      return;
    }
    if (ctx.state !== 'running') await ctx.resume();
    if (stamp !== generation || disposed) return;
    fade(master.gain,.50,.8);
    scheduleBird(true);
  }
  function onVisibility() {
    void sync().catch(() => {});
  }
  document.addEventListener('visibilitychange', onVisibility);
  return {
    async setEnabled(value) {
      if (disposed) return;
      enabled = Boolean(value);
      if (enabled && !ctx) build();
      await sync();
    },
    setScene(index) {
      if (!Number.isInteger(index) || index < 0 || index > 2 || index === place) return;
      place = index;
      mix();
      scheduleBird(true);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ++generation;
      clearTimeout(suspendTimer);
      clearTimeout(birdTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const source of sources) {
        try { source.stop(); } catch { /* The last note may have just finished. */ }
        source.disconnect();
      }
      sources.clear();
      if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
    }
  };
}
