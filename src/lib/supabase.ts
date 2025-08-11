import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: { url: string; anon: string; client: SupabaseClient } | null = null;

function readKeys() {
  // Priority: localStorage (from Settings) -> window globals if provided
  const url = localStorage.getItem("supabase.url") || (window as any).SUPABASE_URL || "";
  const anon = localStorage.getItem("supabase.anon") || (window as any).SUPABASE_ANON_KEY || "";
  return { url: String(url || ""), anon: String(anon || "") };
}

export function getSupabase(): SupabaseClient | null {
  const { url, anon } = readKeys();
  if (!url || !anon) return null;
  if (cached && cached.url === url && cached.anon === anon) return cached.client;
  const client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  cached = { url, anon, client };
  return client;
}

export function hasSupabaseConfig(): boolean {
  const { url, anon } = readKeys();
  return Boolean(url && anon);
}
