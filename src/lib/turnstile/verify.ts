import "server-only";

import { getTurnstileSecretKey } from "@/lib/turnstile/config";

interface TurnstileVerifyResult {
  success: boolean;
}

/**
 * Valida um token Turnstile no servidor Cloudflare.
 * Nunca expor a secret key no cliente ou em logs.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = getTurnstileSecretKey();

  if (!secret || !token) {
    return false;
  }

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) {
    body.append("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as TurnstileVerifyResult;
  return data.success === true;
}
