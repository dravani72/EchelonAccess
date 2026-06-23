export type SupabaseConfigStatus = {
  state: "ready" | "missing" | "invalid";
  isRequired: boolean;
  message: string;
};

export function hasSupabaseConfig() {
  return getSupabaseConfigStatus().state === "ready";
}

export function isSupabaseRequired() {
  if (process.env.NEXT_PUBLIC_REQUIRE_SUPABASE === "false") {
    return false;
  }

  return (
    process.env.NEXT_PUBLIC_REQUIRE_SUPABASE === "true" ||
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isRequired = isSupabaseRequired();

  if (!url || !anonKey) {
    return {
      state: "missing",
      isRequired,
      message: "Supabase is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    };
  }

  if (isServiceRoleKey()) {
    return {
      state: "invalid",
      isRequired,
      message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is a secret/service_role key. Replace it with a Publishable Key."
    };
  }

  return {
    state: "ready",
    isRequired,
    message: "Supabase configuration is ready."
  };
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (isServiceRoleKey()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY must use the anon public key, not the service_role key.");
  }

  return { url, anonKey };
}

function isServiceRoleKey() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return false;

  try {
    const [, payload] = anonKey.split(".");
    if (!payload) return false;
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const decoded = JSON.parse(globalThis.atob(paddedPayload)) as { role?: string };
    return decoded.role === "service_role";
  } catch {
    return false;
  }
}
