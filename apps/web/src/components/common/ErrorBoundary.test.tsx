import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import { useNavigationStore } from '../../store/useNavigationStore';

const renderBoundary = () => {
  const boundary = new ErrorBoundary({ children: <div>Content</div> });
  boundary.state = { hasError: true, error: new Error('test render failure'), errorInfo: null };
  return renderToStaticMarkup(boundary.render() as React.ReactElement);
};

describe('ErrorBoundary recovery', () => {
  beforeEach(() => useNavigationStore.setState({ lang: 'en' }));

  it('offers recovery without a global browser-storage deletion action', () => {
    const markup = renderBoundary();
    expect(markup).toContain('Reload page');
    expect(markup).toContain('Home');
    expect(markup).not.toContain('Xóa dữ liệu');
  });

  it('serves the Vietnamese fallback copy when the interface language is Vietnamese', () => {
    useNavigationStore.setState({ lang: 'vi' });
    const markup = renderBoundary();
    expect(markup).toContain('Tải lại trang');
    expect(markup).toContain('Trang chủ');
    expect(markup).toContain('không bị xóa');
  });

  it('keeps the crash copy inside the active interface language', () => {
    expect(renderBoundary()).not.toContain('Đã xảy ra sự cố hiển thị');
    useNavigationStore.setState({ lang: 'vi' });
    expect(renderBoundary()).not.toContain('A rendering error occurred');
  });
});
