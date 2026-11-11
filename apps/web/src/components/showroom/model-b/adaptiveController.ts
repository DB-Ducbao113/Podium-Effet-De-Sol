export type QualityProfile = 'HIGH' | 'BALANCED' | 'PERFORMANCE';
export type GraphicsMode = 'AUTO' | QualityProfile;

export interface PerformanceSample {
  nowMs: number;
  averageFps: number;
  frameTimeP95Ms: number;
  refreshRateHz: number;
  validFrameCount: number;
  continuous: boolean;
}

export interface ControllerConfig {
  warmupMs: number;
  degradeMs: number;
  upgradeMs: number;
  cooldownMs: number;
  minValidFrames: number;
  maxTargetFps: number;
  degradeFpsRatio: number;
  degradeP95Ratio: number;
  upgradeFpsRatio: number;
  upgradeP95Ratio: number;
}

export interface ProfileTransition {
  from: QualityProfile;
  to: QualityProfile;
  atMs: number;
  reason: 'degrade' | 'upgrade' | 'manual' | 'auto-reset';
}

const PROFILE_ORDER: QualityProfile[] = ['PERFORMANCE', 'BALANCED', 'HIGH'];

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  warmupMs: 4_000,
  degradeMs: 5_000,
  upgradeMs: 20_000,
  cooldownMs: 12_000,
  minValidFrames: 90,
  maxTargetFps: 60,
  degradeFpsRatio: 0.9,
  degradeP95Ratio: 1.5,
  upgradeFpsRatio: 0.98,
  upgradeP95Ratio: 1.08,
};

export class AdaptiveQualityController {
  private mode: GraphicsMode = 'AUTO';
  private profile: QualityProfile;
  private warmupUntilMs: number;
  private cooldownUntilMs = 0;
  private badSinceMs: number | null = null;
  private goodSinceMs: number | null = null;
  private paused = false;
  private transitions: ProfileTransition[] = [];

  constructor(
    nowMs = 0,
    initialProfile: QualityProfile = 'HIGH',
    private readonly config: ControllerConfig = DEFAULT_CONTROLLER_CONFIG,
  ) {
    this.profile = initialProfile;
    this.warmupUntilMs = nowMs + config.warmupMs;
  }

  getState() {
    return {
      mode: this.mode,
      profile: this.profile,
      paused: this.paused,
      transitionCount: this.transitions.length,
      transitions: [...this.transitions],
      cooldownUntilMs: this.cooldownUntilMs,
      warmupUntilMs: this.warmupUntilMs,
    };
  }

  setPaused(paused: boolean, nowMs: number) {
    if (paused === this.paused) return;
    this.paused = paused;
    this.resetEvidence();
    if (!paused) this.warmupUntilMs = nowMs + this.config.warmupMs;
  }

  setMode(mode: GraphicsMode, nowMs: number) {
    this.mode = mode;
    this.resetEvidence();
    if (mode === 'AUTO') {
      this.warmupUntilMs = nowMs + this.config.warmupMs;
      return;
    }
    this.changeProfile(mode, nowMs, 'manual');
  }

  resetAuto(nowMs: number, initialProfile: QualityProfile = 'HIGH') {
    this.mode = 'AUTO';
    this.resetEvidence();
    this.warmupUntilMs = nowMs + this.config.warmupMs;
    this.changeProfile(initialProfile, nowMs, 'auto-reset');
  }

  ingest(sample: PerformanceSample) {
    if (
      this.mode !== 'AUTO' ||
      this.paused ||
      !sample.continuous ||
      sample.validFrameCount < this.config.minValidFrames ||
      sample.nowMs < this.warmupUntilMs ||
      sample.nowMs < this.cooldownUntilMs
    ) {
      this.resetEvidence();
      return null;
    }

    const targetFps = Math.min(this.config.maxTargetFps, Math.max(30, sample.refreshRateHz));
    const frameBudgetMs = 1000 / targetFps;
    const bad =
      sample.averageFps < targetFps * this.config.degradeFpsRatio ||
      sample.frameTimeP95Ms > frameBudgetMs * this.config.degradeP95Ratio;
    const good =
      sample.averageFps >= targetFps * this.config.upgradeFpsRatio &&
      sample.frameTimeP95Ms <= frameBudgetMs * this.config.upgradeP95Ratio;

    if (bad && this.profile !== 'PERFORMANCE') {
      this.goodSinceMs = null;
      this.badSinceMs ??= sample.nowMs;
      if (sample.nowMs - this.badSinceMs >= this.config.degradeMs) {
        return this.changeProfile(
          PROFILE_ORDER[PROFILE_ORDER.indexOf(this.profile) - 1],
          sample.nowMs,
          'degrade',
        );
      }
      return null;
    }

    if (good && this.profile !== 'HIGH') {
      this.badSinceMs = null;
      this.goodSinceMs ??= sample.nowMs;
      if (sample.nowMs - this.goodSinceMs >= this.config.upgradeMs) {
        return this.changeProfile(
          PROFILE_ORDER[PROFILE_ORDER.indexOf(this.profile) + 1],
          sample.nowMs,
          'upgrade',
        );
      }
      return null;
    }

    this.resetEvidence();
    return null;
  }

  private resetEvidence() {
    this.badSinceMs = null;
    this.goodSinceMs = null;
  }

  private changeProfile(to: QualityProfile, atMs: number, reason: ProfileTransition['reason']) {
    if (to === this.profile) return null;
    const event: ProfileTransition = { from: this.profile, to, atMs, reason };
    this.profile = to;
    this.transitions.push(event);
    this.cooldownUntilMs =
      reason === 'manual' || reason === 'auto-reset' ? atMs : atMs + this.config.cooldownMs;
    this.resetEvidence();
    return event;
  }
}
