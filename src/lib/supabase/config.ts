export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/** Remove sufixos inválidos como `/rest/v1/` da URL do Supabase. */
export function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) {
    return null;
  }

  return {
    url: normalizeSupabaseUrl(rawUrl),
    anonKey,
  };
}

export function getSupabaseSecretKey(): string | null {
  return process.env.SUPABASE_SECRET_KEY ?? null;
}
