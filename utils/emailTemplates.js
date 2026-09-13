export function buildEmailParams({
  name,
  email,
  password = '',
  resetLink = '',
  type = 'credentials',
  appUrl = 'http://localhost:5173',
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
      username: email,
      user_email: email,
      user_password: 'Hidden for security — set a new one below',
      password: '',
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
      username: email,
      user_email: email,
      user_password: 'Updated just now',
      password: '',
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
    username: email,
    user_email: email,
    user_password: password,
    password,
    reset_link: `${appUrl.replace(/\/$/, '')}/forgot-password`,
    link: loginUrl,
    email,
    login_url: loginUrl,
    cta_label: 'Open Invoice AI',
    cta_url: loginUrl,
    year,
    message: 'Keep this email safe. Here is the username and password for your Invoice AI account. You can change the password anytime from Settings after you sign in.',
  };
}
