function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function credentialFields(email, password, toName) {
  const pass = password || '';
  return {
    username: email,
    user_name: email,
    name: toName || email,
    user_email: email,
    email,
    login_email: email,
    user_password: pass,
    password: pass,
    pass,
    account_password: pass,
    login_password: pass,
  };
}

export function buildEmailParams({
  name,
  email,
  password = '',
  resetLink = '',
  type = 'credentials',
  appUrl = 'https://invoice-gen-frontend-beryl.vercel.app',
}) {
  const loginUrl = `${appUrl.replace(/\/$/, '')}/login`;
  const year = String(new Date().getFullYear());
  const toName = name || 'there';

  if (type === 'reset') {
    return {
      to_email: email,
      to_name: toName,
      subject: 'Reset your Invoice AI password',
      preheader: 'Your 30-minute password reset link is ready.',
      headline: 'Reset your password',
      ...credentialFields(email, 'Hidden for security — set a new one below', toName),
      password: '',
      pass: '',
      account_password: '',
      login_password: '',
      reset_link: resetLink,
      link: resetLink,
      email,
      login_url: loginUrl,
      cta_label: 'Reset password',
      cta_url: resetLink,
      year,
      message: 'We received a request to reset your Invoice AI password. This link stays valid for <b>30 minutes</b> and can be used only once.',
    };
  }

  if (type === 'changed') {
    return {
      to_email: email,
      to_name: toName,
      subject: 'Your Invoice AI password was changed',
      preheader: 'Your password was updated successfully.',
      headline: 'Password updated',
      ...credentialFields(email, 'Updated just now', toName),
      password: '',
      pass: '',
      account_password: '',
      login_password: '',
      reset_link: loginUrl,
      link: loginUrl,
      email,
      login_url: loginUrl,
      cta_label: 'Sign in now',
      cta_url: loginUrl,
      year,
      message: 'Your Invoice AI password was changed successfully. Use your email and the new password the next time you sign in.',
    };
  }

  return {
    to_email: email,
    to_name: toName,
    subject: 'Your Invoice AI login credentials',
    preheader: 'Your username and password are inside.',
    headline: 'Your sign-in details',
    ...credentialFields(email, password, toName),
    reset_link: `${appUrl.replace(/\/$/, '')}/forgot-password`,
    link: loginUrl,
    login_url: loginUrl,
    cta_label: 'Open Invoice AI',
    cta_url: loginUrl,
    year,
    message: `Keep this email safe. These are your Invoice AI sign-in details.<br/><br/><b>Username:</b> ${escapeHtml(email)}<br/><b>Password:</b> ${escapeHtml(password || '(none — Google sign-in)')}<br/><br/>You can change the password anytime from Settings after you sign in.`,
  };
}
