import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { decryptVault, encryptVault, EncryptedVaultFile } from "./crypto";
import { VaultData, VaultEntry } from "./types";

interface VaultContextValue {
  locked: boolean;
  entries: VaultEntry[];
  createNew: (masterPassword: string) => void;
  importFromFile: (fileContent: EncryptedVaultFile, masterPassword: string) => Promise<void>;
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

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<VaultData | null>(null);

  const locked = !data;
  const entries = data?.entries ?? [];

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
    () => ({ locked, entries, createNew, importFromFile, exportToFile, lock, addEntry, updateEntry, deleteEntry }),
    [locked, entries, createNew, importFromFile, exportToFile, lock, addEntry, updateEntry, deleteEntry]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};
