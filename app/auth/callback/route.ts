import { NextResponse, type NextRequest } from "next/server";
import { withBasePath } from "@/lib/base-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const fallbackPath = withBasePath("/");
  const redirectPath = next?.startsWith(fallbackPath) ? next : fallbackPath;

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
