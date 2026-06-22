"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

const DEMO_PASSWORD = "echelon";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsUnlocked(window.sessionStorage.getItem("echelon-unlocked") === "true");
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.trim() !== DEMO_PASSWORD) {
      setError("Password not recognized.");
      return;
    }
    window.sessionStorage.setItem("echelon-unlocked", "true");
    setIsUnlocked(true);
  }

  if (isUnlocked) return <>{children}</>;

  return (
    <main className="lock-screen">
      <section className="lock-panel">
        <div className="brand-mark lock-mark"><LockKeyhole size={22} /></div>
        <h1 className="lock-title">EchelonAccess</h1>
        <p className="lock-copy">Private relationship intelligence workspace. Enter the workspace password to unlock the application.</p>
        <form className="lock-form" onSubmit={handleSubmit}>
          <label>
            <span className="field-label">Workspace password</span>
            <input autoComplete="current-password" autoFocus className="text-input" onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Enter password" type="password" value={password} />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="button primary lock-button" type="submit"><ShieldCheck size={16} />Unlock</button>
        </form>
        <div className="lock-hint">Demo password: echelon</div>
      </section>
    </main>
  );
}
