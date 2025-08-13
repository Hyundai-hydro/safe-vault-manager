import React, { useMemo, useState, useRef } from "react";
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
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export const SettingsDialog: React.FC = () => {
  const { theme, setTheme, setPrimaryHex, setAccentHex, resetColors, discordWebhook, setDiscordWebhook, supabaseUrl, setSupabaseUrl, supabaseAnonKey, setSupabaseAnonKey, font, setFont, smallCaps, setSmallCaps, autoBackup, setAutoBackup, language, setLanguage, idleLockMinutes, setIdleLockMinutes, panicKeyEnabled, setPanicKeyEnabled, clipboardClearMs, setClipboardClearMs, privacyBlur, setPrivacyBlur } = useSettings();
  const { entries } = useVault();
  const { user, enabled, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const alarmTimer = useRef<number | null>(null);
  const { t } = useTranslation();

  const csvData = useMemo(() => {
    const header = ["title","username","url","password","notes","createdAt"].join(",");
    const rows = entries.map(e => [e.title, e.username ?? "", e.url ?? "", e.password, (e.notes ?? "").replace(/\n/g, " "), e.createdAt].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
    return [header, ...rows].join("\n");
  }, [entries]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t('settings.open', 'Ustawienia')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('settings.title', 'Ustawienia aplikacji')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-2">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="appearance">Wygląd</TabsTrigger>
            <TabsTrigger value="typography">Typografia</TabsTrigger>
            <TabsTrigger value="language">Język</TabsTrigger>
            <TabsTrigger value="backup">Kopia</TabsTrigger>
            <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
            <TabsTrigger value="integrations">Integracje</TabsTrigger>
            <TabsTrigger value="account">Konto</TabsTrigger>
            <TabsTrigger value="export">Eksport</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 animate-fade-in">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Motyw</h3>
              <div className="flex gap-3 flex-wrap">
                {(["light","dark","forest"] as const).map((mode) => (
                  <Button key={mode} variant={theme === mode ? "default" : "secondary"} onClick={() => setTheme(mode)}>
                    {mode === "light" ? t('theme.light','Jasny') : mode === "dark" ? t('theme.dark','Ciemny') : t('theme.forest','Leśny')}
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
          </TabsContent>

          <TabsContent value="typography" className="space-y-6 animate-fade-in">
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
          </TabsContent>

          <TabsContent value="language" className="space-y-6 animate-fade-in">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t('settings.language', 'Język')}</h3>
              <div className="grid md:grid-cols-2 gap-4 items-end">
                <div className="grid gap-2">
                  <Label>{t('settings.uiLanguage', 'Język interfejsu')}</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('settings.chooseLanguage', 'Wybierz język')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pl">{t('languages.pl','Polski')}</SelectItem>
                      <SelectItem value="en">{t('languages.en','English')}</SelectItem>
                      <SelectItem value="de">{t('languages.de','Deutsch')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6 animate-fade-in">
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
          </TabsContent>

          <TabsContent value="security" className="space-y-6 animate-fade-in">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="grid gap-1">
                  <Label>Auto‑blokada po bezczynności</Label>
                  <p className="text-xs text-muted-foreground">Zablokuj sejf po upływie czasu bez interakcji. Ustaw 0 aby wyłączyć.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-28"
                    min={0}
                    value={idleLockMinutes}
                    onChange={(e) => setIdleLockMinutes(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="grid gap-1">
                  <Label>Klawisz paniki</Label>
                  <p className="text-xs text-muted-foreground">Podwójny Escape lub Ctrl+Shift+L natychmiast blokuje sejf.</p>
                </div>
                <Switch checked={panicKeyEnabled} onCheckedChange={setPanicKeyEnabled} />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="grid gap-1">
                  <Label>Automatyczne czyszczenie schowka</Label>
                  <p className="text-xs text-muted-foreground">Po skopiowaniu hasła, schowek zostanie nadpisany po czasie. 0 = wyłączone.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-28"
                    min={0}
                    value={Math.round(clipboardClearMs / 1000)}
                    onChange={(e) => setClipboardClearMs(Math.max(0, parseInt(e.target.value || '0', 10)) * 1000)}
                  />
                  <span className="text-sm text-muted-foreground">sek</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="grid gap-1">
                  <Label>Prywatność: rozmycie przy utracie fokusu</Label>
                  <p className="text-xs text-muted-foreground">Gdy okno utraci fokus lub zostanie zminimalizowane, interfejs zostanie subtelnie rozmyty.</p>
                </div>
                <Switch checked={privacyBlur} onCheckedChange={setPrivacyBlur} />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 animate-fade-in">
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
          </TabsContent>

          <TabsContent value="account" className="space-y-6 animate-fade-in">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Konto</h3>
              {enabled && user ? (
                <div className="rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">Strefa wysokiego ryzyka: usunięcie konta zwalnia e‑mail do ponownego użycia.</p>
                  <div className="mt-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          onMouseEnter={() => { if (!alarmTimer.current) { warn(); alarmTimer.current = window.setInterval(() => warn(), 700) as any; } }}
                          onMouseLeave={() => { if (alarmTimer.current) { clearInterval(alarmTimer.current); alarmTimer.current = null; } }}
                        >
                          Usuń konto
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive">Trwałe usunięcie konta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Operacja wymaga zaplecza (Supabase native integration). W tej wersji aplikacji z poziomu przeglądarki nie można bezpiecznie usunąć konta.
                            Połącz projekt z Supabase, a ja skonfiguruję funkcję usuwania.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                errorTone();
                                toast.error("Aby trwale usunąć konto, podłącz natywną integrację Supabase i pozwól mi dodać funkcję backend.");
                              } finally {
                                await signOut();
                                setOpen(false);
                              }
                            }}
                          >
                            Rozumiem – wyloguj
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Zaloguj się, aby zarządzać kontem.</p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="export" className="space-y-6 animate-fade-in">
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
                  <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={async () => { try { await navigator.clipboard.writeText(csvData); chimeSuccess(); toast("Skopiowano CSV do schowka"); } catch { errorTone(); toast.error("Nie udało się skopiować"); } }}>Skopiuj CSV</Button>
                    <Button variant="outline" type="button" onClick={() => { try { const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vault-export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); chimeSuccess(); toast("Pobrano CSV"); } catch { errorTone(); toast.error("Nie udało się pobrać"); } }}>Pobierz CSV</Button>
                  </div>
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
                              body: (() => { const fd = new FormData(); fd.append('content', content); return fd; })(),
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>{t('common.close','Zamknij')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
