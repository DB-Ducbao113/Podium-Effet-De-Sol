// Web Audio API Synthesizer for Formula 1 1.6L V6 Turbo Hybrid Power Unit
// Zero external assets required, 0ms latency, synthesized real-time with authentic acoustic harmonics

class F1AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;

  // Oscillators and nodes for engine sound synthesis
  private oscBase: OscillatorNode | null = null;
  private oscHarmonic1: OscillatorNode | null = null;
  private oscHarmonic2: OscillatorNode | null = null;
  private oscTurbo: OscillatorNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private waveshaper: WaveShaperNode | null = null;

  private revTimeout: number | null = null;

  private makeDistortionCurve(amount = 25): Float32Array {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Distortion node for exhaust grit
    this.waveshaper = this.ctx.createWaveShaper();
    this.waveshaper.curve = this.makeDistortionCurve(18) as unknown as Float32Array<ArrayBuffer>;
    this.waveshaper.oversample = '2x';
    this.waveshaper.connect(this.masterGain);
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stop();
    } else {
      this.startIdle();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public startIdle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain || !this.waveshaper) return;

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    if (this.isRunning) return;
    this.isRunning = true;

    const now = this.ctx.currentTime;

    // 1. Primary V6 firing frequency (~4,200 RPM idle -> ~210 Hz fundamental)
    this.oscBase = this.ctx.createOscillator();
    this.oscBase.type = 'sawtooth';
    this.oscBase.frequency.setValueAtTime(140, now);

    // 2. Secondary Harmonic (~280 Hz)
    this.oscHarmonic1 = this.ctx.createOscillator();
    this.oscHarmonic1.type = 'triangle';
    this.oscHarmonic1.frequency.setValueAtTime(280, now);

    // 3. Higher Metallic Exhaust Harmonic (~420 Hz)
    this.oscHarmonic2 = this.ctx.createOscillator();
    this.oscHarmonic2.type = 'sawtooth';
    this.oscHarmonic2.frequency.setValueAtTime(420, now);

    // Gain stages for mix
    const baseGain = this.ctx.createGain();
    baseGain.gain.setValueAtTime(0.25, now);
    this.oscBase.connect(baseGain);
    baseGain.connect(this.waveshaper);

    const harm1Gain = this.ctx.createGain();
    harm1Gain.gain.setValueAtTime(0.18, now);
    this.oscHarmonic1.connect(harm1Gain);
    harm1Gain.connect(this.waveshaper);

    const harm2Gain = this.ctx.createGain();
    harm2Gain.gain.setValueAtTime(0.12, now);
    this.oscHarmonic2.connect(harm2Gain);
    harm2Gain.connect(this.waveshaper);

    // 4. Turbo Whistle / Spool (High Q bandpass filter around 2,800 Hz)
    this.oscTurbo = this.ctx.createOscillator();
    this.oscTurbo.type = 'sine';
    this.oscTurbo.frequency.setValueAtTime(2600, now);

    this.turboFilter = this.ctx.createBiquadFilter();
    this.turboFilter.type = 'bandpass';
    this.turboFilter.frequency.setValueAtTime(2600, now);
    this.turboFilter.Q.setValueAtTime(6.0, now);

    const turboGain = this.ctx.createGain();
    turboGain.gain.setValueAtTime(0.04, now);

    this.oscTurbo.connect(this.turboFilter);
    this.turboFilter.connect(turboGain);
    turboGain.connect(this.masterGain);

    // 5. Exhaust Gas Noise Rush
    try {
      const noiseBuffer = this.createNoiseBuffer();
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.setValueAtTime(450, now);
      this.noiseFilter.Q.setValueAtTime(1.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.06, now);

      this.noiseNode.connect(this.noiseFilter);
      this.noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      this.noiseNode.start(now);
    } catch {
      // Ignored if noise buffer fails
    }

    // Start oscillators
    this.oscBase.start(now);
    this.oscHarmonic1.start(now);
    this.oscHarmonic2.start(now);
    this.oscTurbo.start(now);

    // Smoothly fade in master volume
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(0.2, now + 0.35);
  }

  // Trigger aggressive throttle blip & rev scream (e.g. inspecting Power Unit)
  public revUp(durationSeconds = 3.0) {
    if (this.isMuted) {
      // If muted, briefly unmute for the rev experience
      this.setMuted(false);
    }

    if (!this.isRunning) {
      this.startIdle();
    }

    if (
      !this.ctx ||
      !this.oscBase ||
      !this.oscHarmonic1 ||
      !this.oscHarmonic2 ||
      !this.oscTurbo ||
      !this.masterGain
    ) {
      return;
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // Cancel existing rev timeout if active
    if (this.revTimeout) {
      window.clearTimeout(this.revTimeout);
      this.revTimeout = null;
    }

    // ── ACCELERATION PHASE (0.0s -> 1.2s): Idle ~4,000 RPM -> 11,800 RPM Redline ──
    const peakTime = now + 1.2;
    const endTime = now + durationSeconds;

    // Pitch ramp for V6 cylinders
    this.oscBase.frequency.cancelScheduledValues(now);
    this.oscBase.frequency.setValueAtTime(this.oscBase.frequency.value, now);
    this.oscBase.frequency.exponentialRampToValueAtTime(580, peakTime);
    this.oscBase.frequency.exponentialRampToValueAtTime(140, endTime);

    this.oscHarmonic1.frequency.cancelScheduledValues(now);
    this.oscHarmonic1.frequency.setValueAtTime(this.oscHarmonic1.frequency.value, now);
    this.oscHarmonic1.frequency.exponentialRampToValueAtTime(1160, peakTime);
    this.oscHarmonic1.frequency.exponentialRampToValueAtTime(280, endTime);

    this.oscHarmonic2.frequency.cancelScheduledValues(now);
    this.oscHarmonic2.frequency.setValueAtTime(this.oscHarmonic2.frequency.value, now);
    this.oscHarmonic2.frequency.exponentialRampToValueAtTime(1740, peakTime);
    this.oscHarmonic2.frequency.exponentialRampToValueAtTime(420, endTime);

    // Turbo spool whistle scream (spools from 2.6 kHz up to 5.8 kHz)
    this.oscTurbo.frequency.cancelScheduledValues(now);
    this.oscTurbo.frequency.setValueAtTime(this.oscTurbo.frequency.value, now);
    this.oscTurbo.frequency.exponentialRampToValueAtTime(5600, peakTime - 0.1);
    this.oscTurbo.frequency.exponentialRampToValueAtTime(2600, endTime);

    if (this.turboFilter) {
      this.turboFilter.frequency.cancelScheduledValues(now);
      this.turboFilter.frequency.setValueAtTime(this.turboFilter.frequency.value, now);
      this.turboFilter.frequency.exponentialRampToValueAtTime(5600, peakTime - 0.1);
      this.turboFilter.frequency.exponentialRampToValueAtTime(2600, endTime);
    }

    if (this.noiseFilter) {
      this.noiseFilter.frequency.cancelScheduledValues(now);
      this.noiseFilter.frequency.setValueAtTime(this.noiseFilter.frequency.value, now);
      this.noiseFilter.frequency.linearRampToValueAtTime(1400, peakTime);
      this.noiseFilter.frequency.linearRampToValueAtTime(450, endTime);
    }

    // Volume swells aggressively under full throttle
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.42, peakTime);
    this.masterGain.gain.linearRampToValueAtTime(0.2, endTime);
  }

  public stop() {
    if (!this.ctx || !this.isRunning) return;

    if (this.revTimeout) {
      window.clearTimeout(this.revTimeout);
      this.revTimeout = null;
    }

    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.25);
    }

    window.setTimeout(() => {
      try {
        this.oscBase?.stop();
        this.oscHarmonic1?.stop();
        this.oscHarmonic2?.stop();
        this.oscTurbo?.stop();
        this.noiseNode?.stop();
      } catch {
        // already stopped
      }

      this.oscBase = null;
      this.oscHarmonic1 = null;
      this.oscHarmonic2 = null;
      this.oscTurbo = null;
      this.noiseNode = null;
      this.isRunning = false;
    }, 300);
  }
}

export const f1AudioEngine = new F1AudioEngine();
