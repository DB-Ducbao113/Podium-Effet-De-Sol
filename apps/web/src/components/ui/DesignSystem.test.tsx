import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { buttonClassName } from './buttonStyles';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';
import { StatePanel } from './StatePanel';
import { Tabs } from './Tabs';

describe('F0 design-system primitives', () => {
  it('renders consistent button semantics for buttons and links', () => {
    const markup = renderToStaticMarkup(<Button variant="secondary">Telemetry</Button>);

    expect(markup).toContain('type="button"');
    expect(markup).toContain('bg-peds-surface-raised');
    expect(buttonClassName({ variant: 'ghost' })).toContain('focus-visible:ring-peds-focus');
  });

  it('keeps one accent, one neutral surface and a reserved error role', () => {
    expect(buttonClassName({ variant: 'primary' })).toContain('bg-peds-ignition');
    expect(buttonClassName({ variant: 'primary' })).not.toContain('bg-peds-error');
    expect(buttonClassName({ variant: 'secondary' })).toContain('bg-peds-surface-raised');
    expect(buttonClassName({ variant: 'secondary' })).not.toContain('bg-peds-ignition');
    expect(buttonClassName({ variant: 'danger' })).toContain('bg-peds-error');
  });

  it('connects dropdown labels to native selects', () => {
    const markup = renderToStaticMarkup(
      <Dropdown label="Season" id="season-select" defaultValue="2026">
        <option value="2026">2026</option>
      </Dropdown>,
    );

    expect(markup).toContain('for="season-select"');
    expect(markup).toContain('id="season-select"');
  });

  it('exposes tab and panel relationships', () => {
    const markup = renderToStaticMarkup(
      <Tabs
        items={[
          { value: 'standings', label: 'Standings' },
          { value: 'calendar', label: 'Calendar' },
        ]}
        value="standings"
        onValueChange={vi.fn()}
        ariaLabel="Championship content"
        idBase="championship"
      />,
    );

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup).toContain('aria-controls="championship-panel-standings"');
  });

  it('announces loading, empty, and error states appropriately', () => {
    expect(renderToStaticMarkup(<StatePanel state="loading" title="Loading" />)).toContain(
      'role="status"',
    );
    expect(renderToStaticMarkup(<StatePanel state="empty" title="Empty" />)).toContain(
      'aria-live="polite"',
    );
    expect(renderToStaticMarkup(<StatePanel state="error" title="Error" />)).toContain(
      'role="alert"',
    );
  });

  it('renders an accessible modal shell only while open', () => {
    const closed = renderToStaticMarkup(
      <Modal open={false} onClose={vi.fn()} labelledBy="modal-title">
        Closed
      </Modal>,
    );
    const open = renderToStaticMarkup(
      <Modal open onClose={vi.fn()} labelledBy="modal-title">
        <h2 id="modal-title">Open</h2>
      </Modal>,
    );

    expect(closed).toBe('');
    expect(open).toContain('role="dialog"');
    expect(open).toContain('aria-modal="true"');
    expect(open).toContain('aria-labelledby="modal-title"');
  });
});
