import { describe, it, expect } from 'vitest';
import { TEAM_3D_LIVERIES } from '../../data/showroom/teamLiveries';
import { TeamId } from '../../types';
import {
  generateWheelTexture,
  drawBBSMultiSpokeWheel,
  drawTeamAeroWheelCover,
} from './F1CarTextures';
import * as THREE from 'three';

describe('Synchronized Constructor Wheels Livery', () => {
  const ALL_TEAMS: TeamId[] = [
    'ferrari',
    'mercedes',
    'mclaren',
    'redbull',
    'astonmartin',
    'alpine',
    'racingbulls',
    'haas',
    'williams',
    'audi',
    'cadillac',
  ];

  it('verifies all 11 teams have dedicated wheel styling tokens configured', () => {
    ALL_TEAMS.forEach((teamId) => {
      const livery = TEAM_3D_LIVERIES[teamId];
      expect(livery, `Missing livery for team ${teamId}`).toBeDefined();
      expect(livery.wheelCoverColor, `Missing wheelCoverColor for ${teamId}`).toBeDefined();
      expect(livery.wheelAccentColor, `Missing wheelAccentColor for ${teamId}`).toBeDefined();
      expect(livery.wheelRimColor, `Missing wheelRimColor for ${teamId}`).toBeDefined();
      expect(
        livery.wheelPirelliCompound,
        `Missing wheelPirelliCompound for ${teamId}`,
      ).toBeDefined();
      expect(['soft', 'medium', 'hard']).toContain(livery.wheelPirelliCompound);
    });
  });

  it('validates authentic brand color fidelity across key constructor wheels', () => {
    // Mercedes: Petronas Cyan accent
    expect(TEAM_3D_LIVERIES.mercedes.wheelAccentColor).toBe('#00a19c');
    expect(TEAM_3D_LIVERIES.mercedes.wheelPirelliCompound).toBe('medium');

    // Ferrari: Scuderia Red with Modena Yellow secondary
    expect(TEAM_3D_LIVERIES.ferrari.wheelAccentColor).toBe('#e8002d');
    expect(TEAM_3D_LIVERIES.ferrari.wheelSecondaryColor).toBe('#ffdf00');

    // McLaren: Iconic Papaya Orange
    expect(TEAM_3D_LIVERIES.mclaren.wheelAccentColor).toBe('#ff8000');
    expect(TEAM_3D_LIVERIES.mclaren.wheelRimColor).toBe('#ff8000');

    // Red Bull: Racing Yellow and Red Bull Red
    expect(TEAM_3D_LIVERIES.redbull.wheelAccentColor).toBe('#ffce00');
    expect(TEAM_3D_LIVERIES.redbull.wheelSecondaryColor).toBe('#ed1a3b');

    // Aston Martin: Lime Essence track ring
    expect(TEAM_3D_LIVERIES.astonmartin.wheelAccentColor).toBe('#cedc00');
  });

  it('generates a valid THREE.CanvasTexture with SRGBColorSpace and mipmaps', () => {
    const livery = TEAM_3D_LIVERIES.mercedes;
    const texture = generateWheelTexture('mercedes', livery);

    expect(texture).toBeInstanceOf(THREE.CanvasTexture);
    expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(texture.flipY).toBe(false);
    expect(texture.generateMipmaps).toBe(true);

    texture.dispose();
  });

  it('generates valid textures for all 11 constructors without errors', () => {
    ALL_TEAMS.forEach((teamId) => {
      const livery = TEAM_3D_LIVERIES[teamId];
      const texture = generateWheelTexture(teamId, livery);

      expect(texture).toBeInstanceOf(THREE.CanvasTexture);
      expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(texture.flipY).toBe(false);
      expect(texture.generateMipmaps).toBe(true);

      texture.dispose();
    });
  });

  it('executes drawBBSMultiSpokeWheel and drawTeamAeroWheelCover without errors', () => {
    // Lightweight mock 2D canvas context
    const mockGradient = {
      addColorStop: () => {},
    };
    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      arc: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      createRadialGradient: () => mockGradient,
      createLinearGradient: () => mockGradient,
      setLineDash: () => {},
    };

    // Mercedes BBS Wheel
    expect(() =>
      drawBBSMultiSpokeWheel(mockCtx, 454, 190, '#d8dce2', '#ffffff', '#4a505b', '#00a19c', true),
    ).not.toThrow();

    // Cadillac BBS Wheel
    expect(() =>
      drawBBSMultiSpokeWheel(mockCtx, 454, 190, '#d4af37', '#fae596', '#685210', '#d4af37', false),
    ).not.toThrow();

    // All teams aero covers
    ALL_TEAMS.forEach((teamId) => {
      expect(() =>
        drawTeamAeroWheelCover(mockCtx, 454, 190, teamId, TEAM_3D_LIVERIES[teamId]),
      ).not.toThrow();
    });
  });
});
