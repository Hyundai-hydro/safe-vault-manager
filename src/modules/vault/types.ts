export interface VaultEntry {
  id: string;
  title: string;
  username?: string;
  url?: string;
  password: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultData {
  entries: VaultEntry[];
}
