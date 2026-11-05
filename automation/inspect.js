// Runs inside the browser. Return counts and known action names, never values,
// HTML, field labels, cookies, page text, screenshots or credentials.
export function inspectPage() {
  const visible = node => Boolean(node.getClientRects().length);
  const controls = [...document.querySelectorAll('input,textarea,select')].filter(visible);
  const buttons = [...document.querySelectorAll('button,[role="button"],input[type="submit"]')].filter(visible);
  const knownActions = ['candidatar-se', 'candidatar', 'continuar', 'avançar', 'próximo', 'enviar candidatura', 'finalizar candidatura', 'entrar'];
  const actions = knownActions.filter(action => buttons.some(button => {
    const label = String(button.innerText || button.getAttribute('aria-label') || '').trim().toLowerCase();
    return label === action;
  }));
  return {
    controls: controls.length,
    required: controls.filter(node => node.required || node.getAttribute('aria-required') === 'true').length,
    fileInputs: controls.filter(node => node.type === 'file').length,
    passwordInputs: controls.filter(node => node.type === 'password').length,
    challengePresent: Boolean(document.querySelector('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],iframe[src*="challenges.cloudflare.com"],.g-recaptcha,.h-captcha')),
    actions
  };
}

export function isGupyPage(url) {
  try {const parsed=new URL(url);return parsed.protocol === 'https:' && (parsed.hostname === 'gupy.io' || parsed.hostname.endsWith('.gupy.io')) && !parsed.username && !parsed.password;} catch {return false;}
}
