import { API_CONFIG } from '../constants/api';

type QueryParams = Record<string, string | number | boolean | undefined>;

export function hasBackendProxy(): boolean {
  return API_CONFIG.BACKEND_PROXY_URL.trim().length > 0;
}

export function buildProxyUrl(path: string, params?: QueryParams): string {
  const base = API_CONFIG.BACKEND_PROXY_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function fetchProxyJson<T>(path: string, params?: QueryParams): Promise<T> {
  const res = await fetch(buildProxyUrl(path, params));
  if (!res.ok) {
    throw new Error(`Proxy request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function postProxyJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildProxyUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Proxy request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
