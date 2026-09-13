import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { buildEmailParams } from './emailTemplates.js';

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

function loadFileKeys() {
  try {
    const file = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/src/config/emailjs.keys.json');
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

export function getEmailJsKeys() {
  const fileKeys = loadFileKeys();
  const welcomeTemplateId = process.env.EMAILJS_TEMPLATE_CREDENTIALS || fileKeys.welcomeTemplateId || process.env.EMAILJS_TEMPLATE_ID || fileKeys.templateId || '';
  const resetTemplateId = process.env.EMAILJS_TEMPLATE_RESET || fileKeys.resetTemplateId || process.env.EMAILJS_TEMPLATE_ID || fileKeys.templateId || '';
  return {
    serviceId: process.env.EMAILJS_SERVICE_ID || fileKeys.serviceId || '',
    templateId: welcomeTemplateId || resetTemplateId,
    welcomeTemplateId,
    resetTemplateId,
    publicKey: process.env.EMAILJS_PUBLIC_KEY || fileKeys.publicKey || '',
    privateKey: process.env.EMAILJS_PRIVATE_KEY || fileKeys.privateKey || '',
  };
}

export function emailJsConfigured() {
  const { serviceId, templateId, publicKey } = getEmailJsKeys();
  return Boolean(serviceId && templateId && publicKey);
}

export async function sendEmailJs(templateParams, templateId) {
  const keys = getEmailJsKeys();
  if (!keys.serviceId || !keys.templateId || !keys.publicKey) {
    const err = new Error('EmailJS is not configured on the server');
    err.code = 'EMAILJS_NOT_CONFIGURED';
    throw err;
  }

  const payload = {
    service_id: keys.serviceId,
    template_id: templateId || keys.templateId,
    user_id: keys.publicKey,
    template_params: templateParams,
  };

  if (keys.privateKey) {
    payload.accessToken = keys.privateKey;
  }

  const res = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `EmailJS failed with ${res.status}`);
  }
}

export async function sendCredentialsEmail({ name, email, password }) {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  await sendEmailJs(
    buildEmailParams({ name, email, password, type: 'credentials', appUrl }),
    getEmailJsKeys().welcomeTemplateId
  );
}

export async function sendResetEmail({ name, email, resetLink }) {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  await sendEmailJs(
    buildEmailParams({ name, email, resetLink, type: 'reset', appUrl }),
    getEmailJsKeys().resetTemplateId
  );
}

export async function sendPasswordChangedEmail({ name, email }) {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  await sendEmailJs(
    buildEmailParams({ name, email, type: 'changed', appUrl }),
    getEmailJsKeys().resetTemplateId
  );
}
