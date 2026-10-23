import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchematicComparisonModal } from './SchematicComparisonModal';
import { TeamId } from '../../types';

describe('SchematicComparisonModal Component', () => {
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

  it('renders nothing when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <SchematicComparisonModal isOpen={false} onClose={vi.fn()} teamId="ferrari" lang="vi" />,
    );
    expect(html).toBe('');
  });

  it('renders modal with CAD schematic image when isOpen is true', () => {
    const html = renderToStaticMarkup(
      <SchematicComparisonModal isOpen={true} onClose={vi.fn()} teamId="mercedes" lang="vi" />,
    );
    expect(html).toContain('BẢN VẼ KỸ THUẬT CAD 2D');
    expect(html).toContain('/images/showroom/schematics/mercedes.webp');
    expect(html).toContain('MERC-W15-AERO-8K');
  });

  it('supports English localization properly', () => {
    const html = renderToStaticMarkup(
      <SchematicComparisonModal isOpen={true} onClose={vi.fn()} teamId="mclaren" lang="en" />,
    );
    expect(html).toContain('2D CAD SCHEMATIC');
    expect(html).toContain('/images/showroom/schematics/mclaren.webp');
    expect(html).toContain('MCL-38-CFD-8K');
  });

  teams.forEach((teamId) => {
    it(`renders schematic modal for ${teamId} without throwing`, () => {
      expect(() => {
        renderToStaticMarkup(
          <SchematicComparisonModal isOpen={true} onClose={vi.fn()} teamId={teamId} lang="vi" />,
        );
      }).not.toThrow();
    });
  });
});
