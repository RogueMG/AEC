// Cloudflare Turnstile settings shared by the widget and the forms that use it.
// The site key is public; it comes from VITE_TURNSTILE_SITE_KEY at build time.
export const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || undefined;

// Without a site key no widget renders, so forms shouldn't wait for a token.
export const turnstileEnabled = Boolean(turnstileSiteKey);
