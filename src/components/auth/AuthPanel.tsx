"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import type { FormEvent } from "react";

type AuthMode = "sign-in" | "sign-up";

interface AuthPanelProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!TURNSTILE_SITE_KEY) {
    return true;
  }

  if (!token) {
    return false;
  }

  const response = await fetch("/api/turnstile/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { ok?: boolean };
  return data.ok === true;
}

/**
 * Formulário mínimo de autenticação.
 *
 * Criação de conta e login vivem no mesmo painel para manter a
 * experiência enxuta. O Supabase Auth trata a sessão persistente e o
 * proxy do Next renova os cookies quando necessário.
 */
export function AuthPanel({ initialMode = "sign-up", onSuccess }: AuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const runAuth = async (action: () => Promise<void>) => {
    if (!supabase) {
      setError("Configura as variáveis do Supabase para usar a autenticação.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const turnstileOk = await verifyTurnstile(turnstileToken);
      if (!turnstileOk) {
        throw new Error("Confirma a verificação de segurança antes de continuar.");
      }

      await action();
    } catch (authError) {
      const nextError =
        authError instanceof Error
          ? authError.message
          : "Não foi possível autenticar neste momento.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAuth(async () => {
      if (!supabase) return;

      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/simulacao`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          setMessage("Conta criada. A tua sessão já está ativa.");
          onSuccess?.();
          router.refresh();
          return;
        }

        setMessage("Conta criada. Verifica o teu e-mail para confirmar o acesso.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      setMessage("Sessão iniciada com sucesso.");
      onSuccess?.();
      router.refresh();
    });
  };

  const canSubmit =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 6 &&
    (!TURNSTILE_SITE_KEY || Boolean(turnstileToken));

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError("Supabase não está configurado.");
      return;
    }

    await runAuth(async () => {
      if (!supabase) return;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/simulacao`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    });
  };

  return (
    <div className="rounded-[8px] border border-white/10 bg-[#0b1116]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,.45)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">
            Conta
          </p>
          <h2 className="mt-1 font-display text-xl text-sand">
            {mode === "sign-up" ? "Criar conta" : "Entrar"}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}
          className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted transition-colors hover:text-sand"
        >
          {mode === "sign-up" ? "Já tenho conta" : "Criar conta"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-[8px] border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-[#101418] transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="font-display text-base">G</span>
        Continuar com Google
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-sand-muted">
        <span className="h-px flex-1 bg-white/10" />
        ou
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">
            E-mail
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[8px] border border-white/10 bg-white/[0.03] px-3 py-3 font-body text-sm text-sand outline-none transition-colors placeholder:text-sand-muted/60 focus:border-ochre/50"
            placeholder="teu@email.com"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block font-mono text-[10px] tracking-[0.14em] uppercase text-sand-muted">
            Palavra-passe
          </span>
          <input
            type="password"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[8px] border border-white/10 bg-white/[0.03] px-3 py-3 font-body text-sm text-sand outline-none transition-colors placeholder:text-sand-muted/60 focus:border-ochre/50"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </label>

        {TURNSTILE_SITE_KEY ? (
          <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} onTokenChange={handleTurnstileToken} />
        ) : null}

        {error ? (
          <p className="font-body text-sm text-[#f2a3a3]">{error}</p>
        ) : null}

        {message ? (
          <p className="font-body text-sm text-sand-muted">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full rounded-[8px] border border-ochre/45 bg-ochre/10 px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-sand transition-colors hover:bg-ochre/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-sand-muted"
        >
          {loading
            ? "A processar..."
            : mode === "sign-up"
              ? "Criar conta"
              : "Entrar"}
        </button>
      </form>
    </div>
  );
}
