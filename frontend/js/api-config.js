const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export const PRODUCTION_API_BASE = 'https://bridgestone-cup-api.netlify.app/api';

export function getApiBase() {
  const configuredApi = window.BRIDGESTONE_API_URL?.trim();

  if (configuredApi) return configuredApi.replace(/\/$/, '');
  if (LOCAL_HOSTS.has(location.hostname)) return 'http://localhost:3000/api';

  return PRODUCTION_API_BASE;
}

export const API_BASE = getApiBase();

if (!window.BRIDGESTONE_API_URL) {
  window.BRIDGESTONE_API_URL = API_BASE;
}
