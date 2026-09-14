import { NextResponse } from "next/server";
import { getAiProvider, type AiProviderId } from "@/lib/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    provider?: AiProviderId;
    prompt?: string;
    context?: Record<string, unknown>;
  };

  const providerId = body.provider ?? "groq";
  const prompt =
    body.prompt ??
    "Gera uma recomendação operacional curta para o negócio desta localização.";
  const provider = getAiProvider(providerId);
  const result = await provider.complete({
    prompt,
    context: body.context,
  });

  await supabase.from("ai_events").insert({
    user_id: user.id,
    provider: result.provider,
    prompt,
    response: result.text,
    context: body.context ?? {},
  });

  return NextResponse.json(result);
}
