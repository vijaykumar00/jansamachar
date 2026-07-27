import { Alert, Linking } from 'react-native';

const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'whatsapp:']);
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const BLOCKED_HOST_SUFFIXES = ['.local', '.internal'];

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return BLOCKED_HOSTS.has(host) || BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function isAllowedExternalUrl(rawUrl: string): boolean {
  if (!rawUrl.trim()) return false;

  try {
    const url = new URL(rawUrl);
    if (!ALLOWED_SCHEMES.has(url.protocol)) return false;
    if (url.protocol === 'whatsapp:') return true;
    if (!url.hostname || isBlockedHost(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function openExternalUrl(rawUrl: string, fallbackMessage = 'This link cannot be opened safely.') {
  if (!isAllowedExternalUrl(rawUrl)) {
    Alert.alert('Blocked link', fallbackMessage);
    return false;
  }

  try {
    await Linking.openURL(rawUrl);
    return true;
  } catch {
    Alert.alert('Could not open link', 'Please try again later.');
    return false;
  }
}
