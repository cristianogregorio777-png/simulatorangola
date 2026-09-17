import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback OAuth do Supabase (Google e outros providers).
 * Troca o código de autorização por sessão e redireciona para a simulação.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/simulacao";

  if (!code) {
    return NextResponse.redirect(`${origin}/simulacao?error=auth_missing_code`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(`${origin}/simulacao?error=auth_not_configured`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/simulacao?error=auth_exchange_failed`);
  }

  const safeNext = next.startsWith("/") ? next : "/simulacao";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
