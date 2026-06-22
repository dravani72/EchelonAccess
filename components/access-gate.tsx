"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "echelon";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSupabaseMode, setIsSupabaseMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const useSupabase = hasSupabaseConfig();
    setIsSupabaseMode(useSupabase);

    if (!useSupabase) {
      setIsUnlocked(window.sessionStorage.getItem("echelon-unlocked") === "true");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsUnlocked(Boolean(data.session));
      if (data.session) {
        router.refresh();
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsUnlocked(Boolean(session));
      if (session) {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isSupabaseMode) {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${withBasePath("/auth/callback")}`
        }
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setNotice("Check your email for a secure login link.");
      return;
    }

    if (password.trim() !== DEMO_PASSWORD) {
      setError("Password not recognized.");
      return;
    }

    window.sessionStorage.setItem("echelon-unlocked", "true");
    setIsUnlocked(true);
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
          Private relationship intelligence workspace. {isSupabaseMode ? "Sign in to your workspace portal." : "Enter the workspace password to unlock the offline demo."}
        </p>

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
          <button className="button primary lock-button" type="submit">
            {isSupabaseMode ? <Mail size={16} /> : <ShieldCheck size={16} />}
            {isSupabaseMode ? "Send login link" : "Unlock"}
          </button>
        </form>

        <div className="lock-hint">
          {isSupabaseMode ? "Supabase Auth protects each workspace." : `Demo password: ${DEMO_PASSWORD}`}
        </div>
      </section>
    </main>
  );
}
