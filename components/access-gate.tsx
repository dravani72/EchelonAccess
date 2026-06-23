"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { getAppOrigin, withBasePath } from "@/lib/base-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "echelon";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSupabaseMode, setIsSupabaseMode] = useState(false);
  const [configError, setConfigError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const configStatus = getSupabaseConfigStatus();
    const useSupabase = configStatus.state === "ready";
    const isBlockedByConfig = configStatus.isRequired && configStatus.state !== "ready";

    setIsSupabaseMode(useSupabase);
    setConfigError(isBlockedByConfig ? configStatus.message : "");

    if (isBlockedByConfig) {
      setIsUnlocked(false);
      return;
    }

    if (!useSupabase) {
      setIsUnlocked(window.sessionStorage.getItem("echelon-unlocked") === "true");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsUnlocked(Boolean(session));
      if (session) {
        routerRef.current.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    if (configError) {
      setError(configError);
      setIsSubmitting(false);
      return;
    }

    if (isSupabaseMode) {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setIsSubmitting(false);
        return;
      }

      setNotice("Signed in. Opening workspace...");
      setIsUnlocked(true);
      router.refresh();
      setIsSubmitting(false);
      return;
    }

    if (password.trim() !== DEMO_PASSWORD) {
      setError("Password not recognized.");
      setIsSubmitting(false);
      return;
    }

    window.sessionStorage.setItem("echelon-unlocked", "true");
    setIsUnlocked(true);
    setIsSubmitting(false);
  }

  async function handlePasswordReset() {
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const nextPath = withBasePath("/auth/update-password");
    const appOrigin = getAppOrigin();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appOrigin}${withBasePath("/auth/callback")}?next=${encodeURIComponent(nextPath)}`
    });

    setIsSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setNotice("Check your email for a password setup link.");
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <main className="lock-screen">
      <section className="lock-panel">
        <div className="brand-mark lock-mark">
          <LockKeyhole size={22} />
        </div>
        <h1 className="lock-title">EchelonAccess</h1>
        <p className="lock-copy">
          Private relationship intelligence workspace.{" "}
          {configError
            ? "Supabase configuration needs attention before the portal can open."
            : isSupabaseMode
              ? "Sign in to your workspace portal."
              : "Enter the workspace password to unlock the offline demo."}
        </p>

        {configError ? (
          <div className="form-error">{configError}</div>
        ) : (
          <form className="lock-form" onSubmit={handleSubmit}>
            {isSupabaseMode ? (
              <label>
                <span className="field-label">Email</span>
                <input
                  autoComplete="email"
                  autoFocus
                  className="text-input"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>
            ) : null}
            {isSupabaseMode ? (
              <label>
                <span className="field-label">Password</span>
                <input
                  autoComplete="current-password"
                  className="text-input"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter password"
                  type="password"
                  value={password}
                />
              </label>
            ) : (
              <label>
                <span className="field-label">Workspace password</span>
                <input
                  autoComplete="current-password"
                  autoFocus
                  className="text-input"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter password"
                  type="password"
                  value={password}
                />
              </label>
            )}
            {error ? <div className="form-error">{error}</div> : null}
            {notice ? <div className="form-notice">{notice}</div> : null}
            <button className="button primary lock-button" disabled={isSubmitting} type="submit">
              {isSupabaseMode ? <KeyRound size={16} /> : <ShieldCheck size={16} />}
              {isSubmitting ? "Working..." : isSupabaseMode ? "Sign in" : "Unlock"}
            </button>
            {isSupabaseMode ? (
              <button className="button secondary lock-button" disabled={isSubmitting} onClick={handlePasswordReset} type="button">
                Set or reset password
              </button>
            ) : null}
          </form>
        )}

        <div className="lock-hint">
          {configError
            ? "Fix the Netlify environment variables, then clear cache and redeploy."
            : isSupabaseMode
              ? "Use the password setup link once, then sign in with email and password."
              : `Demo password: ${DEMO_PASSWORD}`}
        </div>
      </section>
    </main>
  );
}
