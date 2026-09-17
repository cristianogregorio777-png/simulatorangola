import { NextResponse } from "next/server";
import { isTurnstileEnabled } from "@/lib/turnstile/config";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";

export async function POST(request: Request) {
  if (!isTurnstileEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const body = (await request.json()) as { token?: string };
  const token = body.token;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Token em falta." }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const remoteIp = forwarded?.split(",")[0]?.trim();

  const ok = await verifyTurnstileToken(token, remoteIp);
  return NextResponse.json({ ok });
}
