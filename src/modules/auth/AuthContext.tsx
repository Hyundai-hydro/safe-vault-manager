import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, hasSupabaseConfig } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { chimeSuccess, errorTone } from "@/modules/settings/sound";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  enabled: boolean; // whether supabase config is present
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const enabled = hasSupabaseConfig();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let sub: ReturnType<typeof supabase.auth.onAuthStateChange> | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      sub = supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
      });
    })();
    return () => {
      sub?.data.subscription.unsubscribe();
    };
  }, [enabled]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    enabled,
    signInEmail: async (email, password) => {
      const supabase = getSupabase();
      if (!supabase) {
        errorTone();
        toast.error("Skonfiguruj Supabase w Ustawieniach (URL i anon key)");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { errorTone(); toast.error(error.message); } else { chimeSuccess(); toast("Zalogowano"); }
    },
    signUpEmail: async (email, password) => {
      const supabase = getSupabase();
      if (!supabase) { errorTone(); toast.error("Brak konfiguracji Supabase"); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { errorTone(); toast.error(error.message); return; }
      chimeSuccess();
      if (data.user?.email_confirmed_at) {
        toast("Konto utworzone i potwierdzone. Możesz się zalogować.");
      } else {
        toast("Konto utworzone. Sprawdź e‑mail aby potwierdzić.");
      }
    },
    signInGoogle: async () => {
      const supabase = getSupabase();
      if (!supabase) { errorTone(); toast.error("Brak konfiguracji Supabase"); return; }
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
      if (error) { errorTone(); toast.error(error.message); }
    },
    signOut: async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.auth.signOut();
      chimeSuccess();
      toast("Wylogowano");
    },
  }), [user, session, loading, enabled]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musi być użyty w AuthProvider");
  return ctx;
}
