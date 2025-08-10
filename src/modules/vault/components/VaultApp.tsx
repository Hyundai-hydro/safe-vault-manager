import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useVault } from "../VaultContext";
import { VaultEntry } from "../types";
import { toast } from "sonner";

function generatePassword(length: number, opts: { lower: boolean; upper: boolean; digits: boolean; symbols: boolean }): string {
  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_-+={[}]|:;<,>.?/";
  let pool = "";
  if (opts.lower) pool += lowers;
  if (opts.upper) pool += uppers;
  if (opts.digits) pool += digits;
  if (opts.symbols) pool += symbols;
  if (!pool) pool = lowers + uppers + digits;
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) out += pool[arr[i] % pool.length];
  return out;
}

const EntryRow: React.FC<{
  entry: VaultEntry;
  onEdit: (e: VaultEntry) => void;
  onDelete: (id: string) => void;
}> = ({ entry, onEdit, onDelete }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center py-3">
      <div className="md:col-span-2">
        <div className="font-medium">{entry.title}</div>
        <div className="text-sm text-muted-foreground">{entry.username}</div>
      </div>
      <div className="truncate text-sm md:col-span-2">
        <a href={entry.url} className="text-primary underline underline-offset-4" target="_blank" rel="noreferrer">
          {entry.url}
        </a>
      </div>
      <div className="font-mono text-sm select-all">
        {show ? entry.password : "•".repeat(Math.min(12, entry.password.length))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => {
          navigator.clipboard.writeText(entry.password);
          toast.success("Skopiowano hasło");
        }}>Kopiuj</Button>
        <Button variant="ghost" size="sm" onClick={() => setShow((s) => !s)}>{show ? "Ukryj" : "Pokaż"}</Button>
        <Button variant="secondary" size="sm" onClick={() => onEdit(entry)}>Edytuj</Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(entry.id)}>Usuń</Button>
      </div>
    </div>
  );
};

export const VaultApp: React.FC = () => {
  const { entries, addEntry, updateEntry, deleteEntry, lock, exportToFile } = useVault();
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<VaultEntry | null>(null);
  const [genLen, setGenLen] = useState(16);
  const [genOpts, setGenOpts] = useState({ lower: true, upper: true, digits: true, symbols: false });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportPass, setExportPass] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((e) => [e.title, e.username, e.url, e.notes].some((v) => (v ?? "").toLowerCase().includes(q)));
  }, [entries, query]);

  const submitNew = (f: HTMLFormElement) => {
    const fd = new FormData(f);
    const v = Object.fromEntries(fd.entries()) as any;
    addEntry({
      title: v.title ?? "",
      username: v.username ?? "",
      url: v.url ?? "",
      password: v.password ?? "",
      notes: v.notes ?? "",
    });
    setIsAddOpen(false);
    f.reset();
  };

  const submitEdit = (f: HTMLFormElement) => {
    if (!editEntry) return;
    const fd = new FormData(f);
    const v = Object.fromEntries(fd.entries()) as any;
    updateEntry(editEntry.id, {
      title: v.title ?? editEntry.title,
      username: v.username ?? editEntry.username,
      url: v.url ?? editEntry.url,
      password: v.password ?? editEntry.password,
      notes: v.notes ?? editEntry.notes,
    });
    setEditEntry(null);
  };

  const handleExportNow = async (master: string) => {
    try {
      const { blob, filename } = await exportToFile(master);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success("Zapisano plik sejfu");
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się zapisać pliku");
    }
  };

  const gen = () => setTimeout(() => {
    const pwd = generatePassword(genLen, genOpts);
    navigator.clipboard.writeText(pwd);
    toast.success("Wygenerowano i skopiowano hasło");
  }, 0);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Twój sejf</h2>
        <div className="flex gap-2">
          <Input placeholder="Szukaj..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">Eksportuj</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eksport sejfu</DialogTitle>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleExportNow(exportPass);
                  setIsExportOpen(false);
                  setExportPass("");
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="export-pass">Hasło główne</Label>
                  <Input id="export-pass" type="password" value={exportPass} onChange={(e) => setExportPass(e.target.value)} required />
                </div>
                <DialogFooter>
                  <Button type="submit">Zapisz plik</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={lock}>Zablokuj</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">Dodaj wpis</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nowy wpis</DialogTitle>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitNew(e.currentTarget);
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="title">Tytuł</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Użytkownik</Label>
                    <Input id="username" name="username" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">Adres</Label>
                    <Input id="url" name="url" type="url" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Hasło</Label>
                    <Input id="password" name="password" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notatki</Label>
                    <Input id="notes" name="notes" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Zapisz</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Wpisy ({filtered.length})</CardTitle>
          <CardDescription>Twoje elementy przechowywane lokalnie w pamięci.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Brak wpisów – dodaj pierwszy!</div>
          ) : (
            filtered.map((e) => (
              <EntryRow key={e.id} entry={e} onEdit={setEditEntry} onDelete={deleteEntry} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generator haseł</CardTitle>
          <CardDescription>Szybko twórz silne hasła i kopiuj do schowka.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <Label>Długość: {genLen}</Label>
            <input
              type="range"
              min={8}
              max={64}
              value={genLen}
              onChange={(e) => setGenLen(parseInt(e.target.value))}
            />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={genOpts.lower} onChange={(e) => setGenOpts({ ...genOpts, lower: e.target.checked })} /> małe litery</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={genOpts.upper} onChange={(e) => setGenOpts({ ...genOpts, upper: e.target.checked })} /> wielkie litery</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={genOpts.digits} onChange={(e) => setGenOpts({ ...genOpts, digits: e.target.checked })} /> cyfry</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={genOpts.symbols} onChange={(e) => setGenOpts({ ...genOpts, symbols: e.target.checked })} /> symbole</label>
            </div>
          </div>
          <div className="flex items-end">
            <Button variant="hero" size="xl" onClick={gen} className="w-full">Wygeneruj i skopiuj</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editEntry} onOpenChange={(o) => !o && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj wpis</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitEdit(e.currentTarget);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="title">Tytuł</Label>
              <Input id="title" name="title" defaultValue={editEntry?.title} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Użytkownik</Label>
                <Input id="username" name="username" defaultValue={editEntry?.username} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Adres</Label>
                <Input id="url" name="url" type="url" defaultValue={editEntry?.url} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" name="password" defaultValue={editEntry?.password} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notatki</Label>
                <Input id="notes" name="notes" defaultValue={editEntry?.notes} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Zapisz</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};
