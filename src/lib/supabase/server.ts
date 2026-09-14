import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/config";

/**
 * Cliente Supabase para uso em componentes de servidor.
 *
 * Usa o anon key público e os cookies do request. A renovação dos cookies
 * é coordenada pelo `proxy.ts` da aplicação.
 */
export async function createSupabaseServerClient() {
  const supabaseEnv = getSupabaseEnv();

  if (!supabaseEnv) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Em server components os cookies podem ser read-only. O proxy
          // cobre a renovação em runtime.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}
