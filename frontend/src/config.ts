export const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || API_BASE;
