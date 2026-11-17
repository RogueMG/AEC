import { useEffect, useRef } from "react";
import { turnstileSiteKey } from "@/lib/turnstile";

// Cloudflare Turnstile: a free, usually invisible check that the visitor isn't a bot.
// The site key is public; it comes from VITE_TURNSTILE_SITE_KEY at build time. Without one
// (e.g. a local build with no .env file) nothing renders and the server decides.

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

export default function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const siteKey = turnstileSiteKey;
    const element = container.current;
    if (!siteKey || !element) return;
    let widgetId: string | null = null;
    let cancelled = false;
    const start = () =>
      loadTurnstile()
        .then((api) => {
          if (cancelled || !container.current) return;
          widgetId = api.render(container.current, {
            sitekey: siteKey,
            appearance: "interaction-only",
            theme: "dark",
            callback: (token: string) => callback.current(token),
            "expired-callback": () => callback.current(null),
            "error-callback": () => callback.current(null),
          });
        })
        .catch(() => callback.current(null));

    // Only fetch Cloudflare's script once the form is about a screen away, so visitors who never
    // scroll down to it don't download it.
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined") void start();
    else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          observer?.disconnect();
          void start();
        },
        { rootMargin: "100% 0px" },
      );
      observer.observe(element);
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  return <div ref={container} className="min-h-0" />;
}
