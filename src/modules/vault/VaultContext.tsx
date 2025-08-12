import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { decryptVault, encryptVault, EncryptedVaultFile } from "./crypto";
import { VaultData, VaultEntry } from "./types";

interface VaultContextValue {
  locked: boolean;
  entries: VaultEntry[];
  createNew: (masterPassword: string) => void;
  importFromFile: (fileContent: EncryptedVaultFile, masterPassword: string) => Promise<void>;
  importFromCsv: (csvText: string) => void;
  exportToFile: (masterPassword: string) => Promise<{ blob: Blob; filename: string }>;
  lock: () => void;
  addEntry: (entry: Omit<VaultEntry, "id" | "createdAt" | "updatedAt">) => void;
  updateEntry: (id: string, patch: Partial<VaultEntry>) => void;
  deleteEntry: (id: string) => void;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export const useVault = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault musi być użyty wewnątrz VaultProvider");
  return ctx;
};

function nowISO() {
  return new Date().toISOString();
}

function parseCsv(text: string): VaultEntry[] {
  // very small CSV parser for comma-separated with optional quotes
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name);
  const iTitle = idx("title");
  const iUser = idx("username");
  const iUrl = idx("url");
  const iPass = idx("password");
  const iNotes = idx("notes");

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim().replace(/^"|"$/g, ""));
  };

  const entries: VaultEntry[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = parseLine(lines[li]);
    const title = cols[iTitle] || `Wpis ${li}`;
    const username = iUser >= 0 ? cols[iUser] : "";
    const url = iUrl >= 0 ? cols[iUrl] : "";
    const password = iPass >= 0 ? cols[iPass] : "";
    const notes = iNotes >= 0 ? cols[iNotes] : "";
    entries.push({ id: crypto.randomUUID(), title, username, url, password, notes, createdAt: nowISO(), updatedAt: nowISO() });
  }
  return entries;
}

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<VaultData | null>(null);

  const entries = data?.entries ?? [];
  const locked = !data;

  // Auto-backup toggle from localStorage (enabled by default)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('settings.autoBackup') !== 'false'; } catch { return true; }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'settings.autoBackup') {
        setAutoBackupEnabled(e.newValue !== 'false');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!autoBackupEnabled) return;
    if (!data) return;
    const save = () => {
      try {
        localStorage.setItem('vault.backup', JSON.stringify({ entries }));
        localStorage.setItem('vault.backupAt', new Date().toISOString());
      } catch {}
    };
    // Save immediately and then every 5 minutes
    save();
    const id = window.setInterval(save, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoBackupEnabled, data, entries]);

  const createNew = useCallback((masterPassword: string) => {
    if (!masterPassword) {
      toast.error("Podaj hasło główne");
      return;
    }
    setData({ entries: [] });
    toast.success("Nowy sejf utworzony w pamięci");
  }, []);

  const importFromFile = useCallback(async (fileContent: EncryptedVaultFile, masterPassword: string) => {
    const vault = await decryptVault(fileContent, masterPassword);
    setData(vault);
    toast.success("Sejf odszyfrowany");
  }, []);

  const importFromCsv = useCallback((csvText: string) => {
    const parsed = parseCsv(csvText);
    setData({ entries: parsed });
    toast.success(`Zaimportowano z CSV: ${parsed.length} wpisów`);
  }, []);

  const exportToFile = useCallback(async (masterPassword: string) => {
    if (!data) throw new Error("Brak danych sejfu");
    if (!masterPassword) throw new Error("Podaj hasło główne");
    const encrypted = await encryptVault(data, masterPassword);
    const blob = new Blob([JSON.stringify(encrypted)], { type: "application/json" });
    const filename = `vault-${new Date().toISOString().slice(0, 10)}.vault.json`;
    return { blob, filename };
  }, [data]);

  const lock = useCallback(() => {
    setData(null);
    toast("Sejf zablokowany");
  }, []);

  const addEntry = useCallback((entry: Omit<VaultEntry, "id" | "createdAt" | "updatedAt">) => {
    setData((prev) => {
      const cur = prev ?? { entries: [] };
      const newEntry: VaultEntry = {
        id: crypto.randomUUID(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        ...entry,
      };
      return { entries: [newEntry, ...cur.entries] };
    });
    toast.success("Wpis dodany");
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<VaultEntry>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        entries: prev.entries.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowISO() } : e)),
      };
    });
    toast.success("Zapisano zmiany");
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return { entries: prev.entries.filter((e) => e.id !== id) };
    });
    toast("Wpis usunięty");
  }, []);

  const value = useMemo(
    () => ({ locked, entries, createNew, importFromFile, importFromCsv, exportToFile, lock, addEntry, updateEntry, deleteEntry }),
    [locked, entries, createNew, importFromFile, importFromCsv, exportToFile, lock, addEntry, updateEntry, deleteEntry]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};
