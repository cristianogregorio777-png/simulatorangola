import { NextResponse } from "next/server";
import { completeWithFallback } from "@/lib/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AiProviderId } from "@/lib/ai/types";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase não está configurado." },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const body = (await request.json()) as {
    prompt?: string;
    context?: Record<string, unknown>;
  };

  const prompt =
    body.prompt ??
    "Gera uma recomendação operacional curta para o negócio desta localização.";

  const result = await completeWithFallback({
    prompt,
    context: body.context,
  });

  if (result.provider === "groq" || result.provider === "gemini") {
    const provider: AiProviderId = result.provider;
    await supabase.from("ai_events").insert({
      user_id: user.id,
      provider,
      prompt,
      response: result.text,
      context: body.context ?? {},
    });
  }

  return NextResponse.json(result);
}
