"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    window.sessionStorage.removeItem("echelon-unlocked");

    if (getSupabaseConfigStatus().state === "ready") {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    window.location.assign(withBasePath("/"));
  }

  return (
    <button className="button" disabled={isSigningOut} onClick={handleSignOut} type="button">
      <LogOut size={16} />
      {isSigningOut ? "Signing out" : "Sign out"}
    </button>
  );
}
