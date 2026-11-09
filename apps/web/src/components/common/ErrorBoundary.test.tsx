import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary recovery', () => {
  it('offers recovery without a global browser-storage deletion action', () => {
    const boundary = new ErrorBoundary({ children: <div>Content</div> });
    boundary.state = { hasError: true, error: new Error('test render failure'), errorInfo: null };
    const markup = renderToStaticMarkup(boundary.render() as React.ReactElement);
    expect(markup).toContain('Tải lại trang');
    expect(markup).toContain('Trang chủ');
    expect(markup).toContain('không bị xóa');
    expect(markup).not.toContain('Xóa dữ liệu');
  });
});
