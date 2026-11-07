import { describe, expect, it } from 'vitest';
import { p2SteeringMate, p2SteeringRigidGroup, P2_TIE_LENGTH_MM } from './P2SteeringMate';
import { p2FilmFrame, p2FilmPartSeparation, P2_CINEMA_SHOTS } from './P2CinemaTimeline';

describe('P2.6 original CAD steering closure', () => {
  it('conserves tie-rod length at all authored sampled steering poses', () => {
    for(let angle = -8; angle <= 8; angle += 1) {
      const mate = p2SteeringMate(angle);
      const actualLength = Math.hypot(
        mate.outerMm[0] - mate.rackMm[0],
        mate.outerMm[1] - mate.rackMm[1],
        mate.outerMm[2] - mate.rackMm[2],
      );
      expect(Math.abs(actualLength - P2_TIE_LENGTH_MM)).toBeLessThan(1e-8);
      expect(Math.abs(mate.tieLengthErrorMm)).toBeLessThan(1e-8);
    }
  });
  it('returns precisely to rest and chooses a continuous rack branch', () => {
    expect(Math.abs(p2SteeringMate(0).rackTravelZMm)).toBeLessThan(1e-8);
    expect(p2SteeringMate(-8).rackTravelZMm).toBeCloseTo(23.254968441,6);
    expect(p2SteeringMate(8).rackTravelZMm).toBeCloseTo(-35.754426366,6);
  });
  it('rejects unvalidated source steering ranges', () => {
    for(const angle of [-8.01,8.01,Number.NaN,Infinity]) {
      expect(()=>p2SteeringMate(angle)).toThrow();
    }
  });
  it('keeps independent suspension rods still and tie rod on its own solve', () => {
    expect(p2SteeringRigidGroup('P2_UPPER_WISHBONE_LINK')).toBe('FIXED_LINK');
    expect(p2SteeringRigidGroup('P2_LOWER_WISHBONE_LINK')).toBe('FIXED_LINK');
    expect(p2SteeringRigidGroup('P2_TIE_ROD')).toBe('TIE_ROD');
    expect(p2SteeringRigidGroup('P2_UPRIGHT_BEARING_CARRIER')).toBe('UPRIGHT_CORNER');
  });
});

describe('P3 CAD cinematic deterministic direction', () => {
  it('has strictly increasing beats in normalized progress', () => {
    expect(P2_CINEMA_SHOTS[0].at).toBe(0);
    expect(P2_CINEMA_SHOTS.at(-1)?.at).toBe(1);
    for(let i=1;i<P2_CINEMA_SHOTS.length;i++) {
      expect(P2_CINEMA_SHOTS[i].at).toBeGreaterThan(P2_CINEMA_SHOTS[i-1].at);
    }
  });
  it('restores the exact hero composition at the ending pose', () => {
    const a=p2FilmFrame(0),b=p2FilmFrame(1);
    expect(b.position).toEqual(a.position);
    expect(b.target).toEqual(a.target);
    expect(b.fov).toEqual(a.fov);
    expect(b.blueprint).toEqual(0);
  });
  it('never accumulates source displacement and is reversible', () => {
    const p='P2_BRAKE_ROTOR_DRILLED_CARBON';
    expect(p2FilmPartSeparation(p,0)).toBe(0);
    expect(p2FilmPartSeparation(p,1)).toBe(0);
    expect(p2FilmPartSeparation(p,.67)).toBeGreaterThan(0);
    expect(p2FilmPartSeparation(p,.67)).toBe(p2FilmPartSeparation(p,.67));
  });
});
