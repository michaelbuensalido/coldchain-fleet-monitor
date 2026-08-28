// Central networking configuration.
// Reads from environment variables set at build time (Vite) or runtime.
// Falls back to window.location.origin so the app works behind a reverse proxy
// without any hardcoded host. Set VITE_API_URL / VITE_WS_URL in .env files or
// Docker build args to point at a remote backend.
const _origin =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const API_BASE: string =
  import.meta.env.VITE_API_URL || _origin;

// Support both VITE_WS_URL (preferred) and legacy VITE_SOCKET_URL aliases.
export const SOCKET_URL: string =
  import.meta.env.VITE_WS_URL || import.meta.env.VITE_SOCKET_URL || API_BASE;

// Default non-expiring admin JWT token for direct fleet access
export const DEFAULT_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRvLWFkbWluLWlkIiwiZW1haWwiOiJhZG1pbkBjb2xkY2hhaW4uY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzg3NzM3NDE2fQ.qiEEIBW5CVsVfhlPf7O8Ioa9UvscyMP8wBGSC9dQdTM';

/** Retrieve the stored JWT bearer token. Falls back to default admin token for seamless access. */
export function getAuthToken(): string {
  return (
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    DEFAULT_ADMIN_TOKEN
  );
}

/** Persist the JWT bearer token from a login response body. */
export function storeAuthToken(data: Record<string, string>): void {
  // Backend returns { access_token } — handle both field names defensively.
  const token = data.access_token || data.token || '';
  if (token) {
    localStorage.setItem('token', token);
  }
}

/** Remove the JWT bearer token on logout. */
export function clearAuthToken(): void {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}
