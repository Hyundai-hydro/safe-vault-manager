import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "forest";

type CustomColors = {
  primary?: string; // H S% L%
  accent?: string; // H S% L%
};

type SettingsContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  colors: CustomColors;
  setPrimaryHex: (hex: string) => void;
  setAccentHex: (hex: string) => void;
  resetColors: () => void;
  discordWebhook: string;
  setDiscordWebhook: (url: string) => void;
  // Supabase public config (safe to store)
  supabaseUrl: string;
  setSupabaseUrl: (url: string) => void;
  supabaseAnonKey: string;
  setSupabaseAnonKey: (key: string) => void;
  // Typography
  font: 'inter' | 'playfair' | 'cormorant';
  setFont: (f: 'inter' | 'playfair' | 'cormorant') => void;
  smallCaps: boolean;
  setSmallCaps: (on: boolean) => void;
  // Local auto backup every 5 min
  autoBackup: boolean;
  setAutoBackup: (on: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function hexToHslString(hex: string): string | undefined {
  const m = hex.trim().replace(/^#/, "");
  const bigint = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  if (Number.isNaN(bigint)) return undefined;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
      case g1: h = (b1 - r1) / d + 2; break;
      case b1: h = (r1 - g1) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "theme-forest");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "forest") root.classList.add("theme-forest");
}

function applyColors(colors: CustomColors) {
  const root = document.documentElement.style;
  if (colors.primary) root.setProperty("--primary", colors.primary);
  if (colors.accent) root.setProperty("--accent", colors.accent);
  if (colors.primary) root.setProperty("--ring", colors.primary);
  if (colors.primary) {
    // simple glow shift: +10 lightness clamped
    const parts = colors.primary.split(" ");
    if (parts.length === 3) {
      const h = parts[0];
      const s = parts[1];
      const lNum = Number(parts[2].replace("%", ""));
      const l2 = Math.min(95, lNum + 10);
      root.setProperty("--primary-glow", `${h} ${s} ${l2}%`);
    }
  }
}

const LS_THEME = "settings.theme";
const LS_COLORS = "settings.colors";
const LS_WEBHOOK = "settings.discordWebhook";
const LS_SUPA_URL = "supabase.url"; // public
const LS_SUPA_ANON = "supabase.anon"; // public
const LS_FONT = "settings.font";
const LS_SMALLCAPS = "settings.smallCaps";
const LS_AUTOBACKUP = "settings.autoBackup";

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(LS_THEME) as Theme) || "light");
  const [colors, setColors] = useState<CustomColors>(() => {
    try { return JSON.parse(localStorage.getItem(LS_COLORS) || "{}") as CustomColors; } catch { return {}; }
  });
  const [discordWebhook, setDiscordWebhookState] = useState<string>(() => localStorage.getItem(LS_WEBHOOK) || "");
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => localStorage.getItem(LS_SUPA_URL) || (window as any).SUPABASE_URL || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => localStorage.getItem(LS_SUPA_ANON) || (window as any).SUPABASE_ANON_KEY || "");
  const [font, setFontState] = useState<'inter'|'playfair'|'cormorant'>(() => (localStorage.getItem(LS_FONT) as any) || 'inter');
  const [smallCaps, setSmallCapsState] = useState<boolean>(() => localStorage.getItem(LS_SMALLCAPS) === 'true');
  const [autoBackup, setAutoBackupState] = useState<boolean>(() => localStorage.getItem(LS_AUTOBACKUP) !== 'false');

  useEffect(() => { applyTheme(theme); localStorage.setItem(LS_THEME, theme); }, [theme]);
  useEffect(() => { applyColors(colors); localStorage.setItem(LS_COLORS, JSON.stringify(colors)); }, [colors]);
  useEffect(() => { localStorage.setItem(LS_WEBHOOK, discordWebhook); }, [discordWebhook]);
  useEffect(() => { localStorage.setItem(LS_SUPA_URL, supabaseUrl); }, [supabaseUrl]);
  useEffect(() => { localStorage.setItem(LS_SUPA_ANON, supabaseAnonKey); }, [supabaseAnonKey]);

  // Typography effects
  useEffect(() => {
    localStorage.setItem(LS_FONT, font);
    const root = document.documentElement.style;
    const map: Record<'inter'|'playfair'|'cormorant', string> = {
      inter: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      playfair: "'Playfair Display', serif",
      cormorant: "'Cormorant SC', serif",
    };
    root.setProperty('--font-ui', map[font]);
  }, [font]);
  useEffect(() => {
    localStorage.setItem(LS_SMALLCAPS, String(smallCaps));
    document.documentElement.style.setProperty('--font-variant', smallCaps ? 'small-caps' : 'normal');
  }, [smallCaps]);
  useEffect(() => {
    localStorage.setItem(LS_AUTOBACKUP, String(autoBackup));
    try { localStorage.setItem('settings.autoBackup', String(autoBackup)); } catch {}
  }, [autoBackup]);

const value = useMemo<SettingsContextValue>(() => ({
  theme,
  setTheme: setThemeState,
  colors,
  setPrimaryHex: (hex) => {
    const hsl = hexToHslString(hex); if (!hsl) return; setColors((c) => ({ ...c, primary: hsl }));
  },
  setAccentHex: (hex) => {
    const hsl = hexToHslString(hex); if (!hsl) return; setColors((c) => ({ ...c, accent: hsl }));
  },
  resetColors: () => setColors({}),
  discordWebhook,
  setDiscordWebhook: setDiscordWebhookState,
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  font,
  setFont: setFontState,
  smallCaps,
  setSmallCaps: setSmallCapsState,
  autoBackup,
  setAutoBackup: setAutoBackupState,
}), [theme, colors, discordWebhook, supabaseUrl, supabaseAnonKey, font, smallCaps, autoBackup]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings musi być użyty wewnątrz SettingsProvider");
  return ctx;
}
