import React, { useRef } from "react";
import { VaultProvider } from "@/modules/vault/VaultContext";
import { VaultUnlock } from "@/modules/vault/components/VaultUnlock";
import { VaultApp } from "@/modules/vault/components/VaultApp";
import { useVault } from "@/modules/vault/VaultContext";

const HomeContent: React.FC = () => {
  const { locked } = useVault();
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <main
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--pointer-x", `${x}%`);
        el.style.setProperty("--pointer-y", `${y}%`);
      }}
      className="min-h-screen bg-background pointer-spotlight"
    >
      <header className="container py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mx-auto max-w-3xl">
          Zaawansowany menedżer haseł
        </h1>
        <p className="text-lg text-muted-foreground mt-4 mx-auto max-w-2xl">
          Szyfrowanie AES‑256 w Twojej przeglądarce. Import/eksport sejfu i generator silnych haseł.
        </p>
        <div className="mx-auto mt-10 max-w-5xl">
          {locked ? <VaultUnlock /> : <VaultApp />}
        </div>
      </header>
    </main>
  );
};

const Index = () => {
  return (
    <VaultProvider>
      <HomeContent />
    </VaultProvider>
  );
};

export default Index;
