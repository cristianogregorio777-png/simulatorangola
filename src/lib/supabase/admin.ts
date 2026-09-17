import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseSecretKey } from "@/lib/supabase/config";

/**
 * Cliente Supabase com chave secreta — apenas para operações de servidor
 * que exigem privilégios elevados. Nunca importar em componentes client.
 */
export function createSupabaseAdminClient() {
  const supabaseEnv = getSupabaseEnv();
  const secretKey = getSupabaseSecretKey();

  if (!supabaseEnv || !secretKey) {
    return null;
  }

  return createClient(supabaseEnv.url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
