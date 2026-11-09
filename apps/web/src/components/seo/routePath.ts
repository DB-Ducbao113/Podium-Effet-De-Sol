export const normalizeRoutePath = (pathname: string) =>
  pathname === '/' ? pathname : pathname.replace(/\/+$/, '');
