import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Navbar } from './Navbar';
import { useNavigationStore } from '../../store/useNavigationStore';

const initialLang = useNavigationStore.getState().lang;

afterEach(() => useNavigationStore.setState({ lang: initialLang }));

describe('Navbar after Live Center removal', () => {
  it.each(['vi', 'en'] as const)(
    'keeps the main navigation without live/archive links (%s)',
    (lang) => {
      useNavigationStore.setState({ lang });
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>,
      );
      expect(html).toContain('href="/season/2026"');
      expect(html).toContain('href="/showroom"');
      for (const path of ['/live', '/timing', '/archive']) {
        expect(html).not.toContain(`href="${path}"`);
      }
    },
  );
});
