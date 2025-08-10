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

export const SettingsDialog: React.FC = () => {
  const { theme, setTheme, setPrimaryHex, setAccentHex, resetColors, discordWebhook, setDiscordWebhook } = useSettings();
  const { entries } = useVault();
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
                  <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={!discordWebhook}>Wyślij</Button>
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
                        // Discord webhook expects { content }
                        const content = '```csv\n' + csvData.slice(0, 1900) + '\n```';
                        await fetch(discordWebhook, {
                          method: 'POST',
                          mode: 'no-cors',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ content }),
                        });
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
