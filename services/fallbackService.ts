export type FallbackReason = 'offline' | 'provider_error' | 'quota_exhausted' | 'empty_response' | 'last_success';

export interface FallbackMeta {
  reason: FallbackReason;
  provider?: string;
  fetchedAt: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'earlier';
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function createFallbackMeta(reason: FallbackReason, provider?: string): FallbackMeta {
  return {
    reason,
    provider,
    fetchedAt: new Date().toISOString(),
  };
}

export function fallbackLabel(meta: FallbackMeta): string {
  const providerText = meta.provider ? `${meta.provider} ` : '';
  if (meta.reason === 'last_success') {
    return `Showing last successful feed from ${formatTime(meta.fetchedAt)}`;
  }
  if (meta.reason === 'quota_exhausted') {
    return `Showing offline fallback because ${providerText}quota is unavailable`;
  }
  if (meta.reason === 'empty_response') {
    return `Showing offline fallback from ${formatTime(meta.fetchedAt)}`;
  }
  return `Showing offline fallback from ${formatTime(meta.fetchedAt)}`;
}
