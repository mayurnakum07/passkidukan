/**
 * Auth events: emitted when token is invalid/expired (e.g. API returns 401).
 * Backend determines token expiry; frontend does not set or check expiry time.
 */

type TokenExpiredListener = () => void;
const listeners: TokenExpiredListener[] = [];

export function onTokenExpired(callback: TokenExpiredListener): () => void {
  listeners.push(callback);
  return () => {
    const i = listeners.indexOf(callback);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitTokenExpired(): void {
  listeners.forEach(fn => {
    try { fn(); } catch (e) { console.warn('authEvents listener error:', e); }
  });
}
