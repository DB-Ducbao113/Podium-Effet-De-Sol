import { describe, it, expect, vi } from 'vitest';
import {
  drawCoolingLouvres,
  generateFloorTexture,
  generateSuspensionMirrorsTexture,
  generateDiffuserRainLightTexture,
  generateCockpitTexture,
  generateHaloTexture,
} from './F1CarTextures';
import { getTeam3DLivery, TEAM_3D_LIVERIES } from '../../data/showroom/teamLiveries';
import { TeamId } from '../../types';

describe('F1CarTextures - drawCoolingLouvres', () => {
  const teams: TeamId[] = [
    'mercedes',
    'ferrari',
    'redbull',
    'mclaren',
    'astonmartin',
    'alpine',
    'williams',
    'racingbulls',
    'audi',
    'haas',
    'cadillac',
  ];

  function createMockContext() {
    const fillRectCalls: Array<{ x: number; y: number; w: number; h: number; fillStyle: unknown }> =
      [];
    const mockGradient = {
      addColorStop: vi.fn(),
    };

    const ctx = {
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
        fillRectCalls.push({ x, y, w, h, fillStyle: ctx.fillStyle });
      }),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createLinearGradient: vi.fn(() => mockGradient),
    } as unknown as CanvasRenderingContext2D;

    return { ctx, fillRectCalls, mockGradient };
  }

  teams.forEach((teamId) => {
    it(`renders sidepod cooling louvres and upper decks for ${teamId}`, () => {
      const { ctx, fillRectCalls } = createMockContext();
      const livery = getTeam3DLivery(teamId);

      expect(() => {
        drawCoolingLouvres(ctx, teamId, livery);
      }).not.toThrow();

      // Must draw both upper deck panels and multiple louvre extraction vent banks
      expect(fillRectCalls.length).toBeGreaterThan(50);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();

      // Check left deck panel (X: 80, Y: 280, W: 220, H: 720)
      const leftDeck = fillRectCalls.find(
        (call) => call.x === 80 && call.y === 280 && call.w === 220 && call.h === 720,
      );
      expect(leftDeck).toBeDefined();

      // Check right deck panel (X: 1620, Y: 1220, W: 180, H: 700)
      const rightDeck = fillRectCalls.find(
        (call) => call.x === 1620 && call.y === 1220 && call.w === 180 && call.h === 700,
      );
      expect(rightDeck).toBeDefined();
    });
  });

  it('handles unknown team fallback gracefully without throwing', () => {
    const { ctx, fillRectCalls } = createMockContext();
    const fallbackLivery = getTeam3DLivery('ferrari');

    expect(() => {
      drawCoolingLouvres(ctx, 'unknown_team' as TeamId, fallbackLivery);
    }).not.toThrow();

    expect(fillRectCalls.length).toBeGreaterThan(50);
  });
});

describe('F1CarTextures - Enhanced Component Textures & Livery Color Tokens', () => {
  const teams: TeamId[] = [
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

  it('ensures all 11 teams define complete authentic component color tokens', () => {
    teams.forEach((teamId) => {
      const livery = TEAM_3D_LIVERIES[teamId];
      expect(livery).toBeDefined();
      expect(livery.mirrorColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(livery.mirrorAccentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(livery.floorEdgeAccentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(livery.seatbeltColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(livery.diffuserAccentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(livery.rainLightColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('generates authentic textures for floor, suspension/mirrors, diffuser, cockpit, and halo without errors', () => {
    teams.forEach((teamId) => {
      const livery = getTeam3DLivery(teamId);

      const floorTex = generateFloorTexture(teamId, livery);
      expect(floorTex).toBeDefined();
      expect(floorTex.isTexture).toBe(true);

      const mirrorsTex = generateSuspensionMirrorsTexture(teamId, livery);
      expect(mirrorsTex).toBeDefined();
      expect(mirrorsTex.isTexture).toBe(true);

      const diffuserTex = generateDiffuserRainLightTexture(teamId, livery);
      expect(diffuserTex).toBeDefined();
      expect(diffuserTex.isTexture).toBe(true);

      const cockpitTex = generateCockpitTexture(teamId, livery);
      expect(cockpitTex).toBeDefined();
      expect(cockpitTex.isTexture).toBe(true);

      const haloTex = generateHaloTexture(teamId, livery);
      expect(haloTex).toBeDefined();
      expect(haloTex.isTexture).toBe(true);
    });
  });
});
