import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettings } from "./SettingsContext";
import { useVault } from "@/modules/vault/VaultContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { chimeSuccess, errorTone, warn } from "./sound";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/modules/auth/AuthContext";
export const SettingsDialog: React.FC = () => {
  const { theme, setTheme, setPrimaryHex, setAccentHex, resetColors, discordWebhook, setDiscordWebhook, supabaseUrl, setSupabaseUrl, supabaseAnonKey, setSupabaseAnonKey, font, setFont, smallCaps, setSmallCaps, autoBackup, setAutoBackup } = useSettings();
  const { entries } = useVault();
  const { user, enabled } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const csvData = useMemo(() => {
    const header = ["title","username","url","password","notes","createdAt"].join(",");
    const rows = entries.map(e => [e.title, e.username ?? "", e.url ?? "", e.password, (e.notes ?? "").replace(/\n/g, " "), e.createdAt].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
    return [header, ...rows].join("\n");
  }, [entries]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Ustawienia</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ustawienia aplikacji</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Motyw</h3>
            <div className="flex gap-3 flex-wrap">
              {(["light","dark","forest"] as const).map((t) => (
                <Button key={t} variant={theme === t ? "default" : "secondary"} onClick={() => setTheme(t)}>
                  {t === "light" ? "Jasny" : t === "dark" ? "Ciemny" : "Leśny"}
                </Button>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Własne kolory UI</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kolor główny (primary)</Label>
                <input type="color" onChange={(e) => setPrimaryHex(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Kolor akcentu (accent)</Label>
                <input type="color" onChange={(e) => setAccentHex(e.target.value)} />
              </div>
            </div>
            <div>
              <Button variant="ghost" onClick={resetColors}>Resetuj kolory</Button>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Typografia</h3>
            <div className="grid md:grid-cols-2 gap-4 items-end">
              <div className="grid gap-2">
                <Label>Krój interfejsu</Label>
                <Select value={font} onValueChange={(v) => setFont(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Wybierz font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter (Sans)</SelectItem>
                    <SelectItem value="playfair">Playfair Display (Serif)</SelectItem>
                    <SelectItem value="cormorant">Cormorant SC (Small Caps Serif)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="grid gap-1">
                  <Label>Małe kapitaliki (small caps) dla nagłówków</Label>
                  <p className="text-xs text-muted-foreground">Aktywuje font-variant-caps: small-caps</p>
                </div>
                <Switch checked={smallCaps} onCheckedChange={setSmallCaps} />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Kopia zapasowa</h3>
            <div className="flex items-center justify-between gap-4">
              <div className="grid gap-1">
                <Label>Auto‑kopia sejfu co 5 minut (lokalnie)</Label>
                <p className="text-xs text-muted-foreground">Zapis do localStorage. Ostatnia: {localStorage.getItem('vault.backupAt') || '—'}</p>
              </div>
              <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Supabase (publiczne)</h3>
            <p className="text-xs text-muted-foreground">Wprowadź URL projektu i publiczny anon key. Klucze są zapisywane lokalnie.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>SUPABASE URL</Label>
                <Input placeholder="https://xyz.supabase.co" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>SUPABASE ANON KEY</Label>
                <Input placeholder="ey..." value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} />
              </div>
            </div>
          </section>

          <Separator />
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Wyślij hasła na Discord</h3>
            <Alert>
              <AlertTitle>Ostrożnie</AlertTitle>
              <AlertDescription>Wysyłanie haseł poza urządzenie jest ryzykowne. Używaj tylko zaufanych kanałów.</AlertDescription>
            </Alert>
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2 grid gap-2">
                <Label>URL webhooka Discord</Label>
                <Input placeholder="https://discord.com/api/webhooks/..." value={discordWebhook} onChange={(e) => setDiscordWebhook(e.target.value)} />
              </div>
               <AlertDialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (o) warn(); }}>
                 <AlertDialogTrigger asChild>
                   <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={!discordWebhook || entries.length === 0}>Wyślij</Button>
                 </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">UWAGA! Wysyłasz WSZYSTKIE HASŁA</AlertDialogTitle>
                    <AlertDialogDescription>
                      Każdy z dostępem do serwera może je zobaczyć. Czy na pewno chcesz kontynuować?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => {
                      try {
                        // Discord webhook expects { content } ; we chunk to avoid 2000 char limit
                        const chunks: string[] = [];
                        const csv = csvData;
                        const max = 1800; // leave room for code fences
                        for (let i = 0; i < csv.length; i += max) {
                          chunks.push(csv.slice(i, i + max));
                        }
                        for (const [idx, part] of chunks.entries()) {
                          const content = '```csv\n' + part + '\n```' + (chunks.length > 1 ? `\nCzęść ${idx + 1}/${chunks.length}` : '');
                          await fetch(discordWebhook, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content }),
                          });
                          // tiny gap to avoid rate limits
                          await new Promise(r => setTimeout(r, 400));
                        }
                        chimeSuccess();
                        toast("Żądanie wysłane do Discord. Sprawdź historię kanału.");
                      } catch (e) {
                        errorTone();
                        toast.error("Nie udało się wysłać do Discorda");
                      } finally {
                        setConfirmOpen(false);
                        setOpen(false);
                      }
                    }}>Tak, wyślij</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
