"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Cliente Supabase para uso no browser.
 *
 * Mantemos apenas o anon key público aqui. A sessão é persistida pelo
 * browser e renovada pelo `proxy.ts` do Next 16.
 */
const supabaseEnv = getSupabaseEnv();

export const supabase = supabaseEnv
  ? createBrowserClient(supabaseEnv.url, supabaseEnv.anonKey)
  : null;
