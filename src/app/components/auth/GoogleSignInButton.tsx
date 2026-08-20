import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

// No `@react-oauth/google` (or any other) npm package is used here — we
// load Google's own Identity Services script directly. That avoids adding
// a new frontend dependency that would need `npm install` to pick up.
declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;

let scriptLoadingPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In script"));
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

export function GoogleSignInButton({ onSuccess }: { onSuccess?: () => void }) {
  const { loginWithGoogleCredential } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError(
        "Google sign-in isn't configured yet. Set VITE_GOOGLE_CLIENT_ID (frontend) and GOOGLE_CLIENT_ID (backend)."
      );
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential: string }) => {
            try {
              await loginWithGoogleCredential(response.credential);
              toast.success("Signed in with Google");
              onSuccess?.();
            } catch (err: any) {
              toast.error(err.message || "Google sign-in failed. Please try again.");
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
          text: "continue_with",
        });
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load Google Sign-In. Check your connection and try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogleCredential, onSuccess]);

  if (error) {
    return <p className="text-sm text-red-500 max-w-xs text-center">{error}</p>;
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}
