"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setIsCheckingSession(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Password updated. Opening workspace...");
    router.replace(withBasePath("/"));
  }

  return (
    <main className="lock-screen">
      <section className="lock-panel">
        <div className="brand-mark lock-mark">
          <LockKeyhole size={22} />
        </div>
        <h1 className="lock-title">Set Password</h1>
        <p className="lock-copy">Create a password for normal EchelonAccess portal sign-in.</p>

        {isCheckingSession ? <div className="form-notice">Checking secure session...</div> : null}

        {!isCheckingSession && !hasSession ? (
          <div className="form-error">This password setup link is expired or invalid. Return to login and request a new reset link.</div>
        ) : null}

        {hasSession ? (
          <form className="lock-form" onSubmit={handleSubmit}>
            <label>
              <span className="field-label">New password</span>
              <input
                autoComplete="new-password"
                autoFocus
                className="text-input"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter new password"
                type="password"
                value={password}
              />
            </label>
            <label>
              <span className="field-label">Confirm password</span>
              <input
                autoComplete="new-password"
                className="text-input"
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Re-enter new password"
                type="password"
                value={confirmPassword}
              />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            {notice ? <div className="form-notice">{notice}</div> : null}
            <button className="button primary lock-button" disabled={isSubmitting} type="submit">
              <KeyRound size={16} />
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
