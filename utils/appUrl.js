const LIVE_FRONTEND_URL = 'https://invoice-gen-frontend-beryl.vercel.app';

function normalize(url) {
  return String(url || '').trim().replace(/\/$/, '');
}

function isLocalhost(url) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function getFrontendUrl() {
  const envUrl = normalize(process.env.FRONTEND_URL);
  if (envUrl && !isLocalhost(envUrl)) return envUrl;
  return LIVE_FRONTEND_URL;
}
