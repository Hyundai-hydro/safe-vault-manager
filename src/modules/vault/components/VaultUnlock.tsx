import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useVault } from "../VaultContext";
import { EncryptedVaultFile } from "../crypto";

const FilePicker: React.FC<{ onPick: (file: File) => void; accept?: string; text?: string }> = ({ onPick, accept = "application/json,.json,.vault,.vault.json", text = "Wybierz plik sejfu" }) => {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <Button variant="secondary" onClick={() => ref.current?.click()}>
        {text}
      </Button>
    </>
  );
};

export const VaultUnlock: React.FC = () => {
  const { createNew, importFromFile } = useVault();
  const [newPass, setNewPass] = useState("");
  const [filePass, setFilePass] = useState("");
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  const handleImport = async () => {
    if (!pickedFile) return;
    const text = await pickedFile.text();
    const json = JSON.parse(text) as EncryptedVaultFile;
    await importFromFile(json, filePass);
  };

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Utwórz nowy sejf</CardTitle>
          <CardDescription>Szyfrowany lokalnie, bez wysyłania danych.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Hasło główne"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            aria-label="Hasło główne"
          />
          <Button variant="hero" size="lg" onClick={() => createNew(newPass)}>
            Utwórz sejf
          </Button>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Wgraj istniejący sejf</CardTitle>
          <CardDescription>Odszyfruj plik sejfu i kontynuuj pracę.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <FilePicker onPick={setPickedFile} />
            {pickedFile && <span className="text-sm text-muted-foreground">{pickedFile.name}</span>}
          </div>
          <Input
            type="password"
            placeholder="Hasło główne"
            value={filePass}
            onChange={(e) => setFilePass(e.target.value)}
            aria-label="Hasło główne do odszyfrowania"
          />
          <Button variant="default" size="lg" onClick={handleImport} disabled={!pickedFile}>
            Otwórz sejf
          </Button>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Import z CSV</CardTitle>
          <CardDescription>Wgraj plik CSV (kolumny: title, username, url, password, notes).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CsvPicker />
        </CardContent>
      </Card>
    </section>
  );
};

const CsvPicker: React.FC = () => {
  const { importFromCsv } = useVault();
  const [name, setName] = useState<string>("");
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <FilePicker
        onPick={async (file) => {
          const text = await file.text();
          importFromCsv(text);
        }}
        accept="text/csv,.csv"
        text="Wybierz plik CSV"
      />
      {name && <span className="text-sm text-muted-foreground">{name}</span>}
    </div>
  );
};
