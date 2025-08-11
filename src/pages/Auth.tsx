import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/AuthContext";
import { chimeSuccess, errorTone } from "@/modules/settings/sound";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Nieprawidłowy e‑mail"),
  password: z.string().min(6, "Min. 6 znaków"),
});

type Values = z.infer<typeof schema>;

const AuthPage: React.FC = () => {
  const nav = useNavigate();
  const { user, loading, signInEmail, signUpEmail, signInGoogle, enabled } = useAuth();
  const [tab, setTab] = useState("login");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  useEffect(() => {
    document.title = "Logowanie | Menedżer haseł";
  }, []);

  useEffect(() => {
    if (!loading && user) {
      chimeSuccess();
      nav("/");
    }
  }, [user, loading, nav]);

  const onSubmit = async (v: Values) => {
    if (tab === "login") await signInEmail(v.email, v.password);
    else await signUpEmail(v.email, v.password);
  };

  return (
    <main className="min-h-screen container py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Zaloguj się / Zarejestruj</h1>
        <p className="text-muted-foreground mt-2">E‑mail i hasło lub Google</p>
      </header>

      {!enabled && (
        <div className="max-w-xl mx-auto mb-6 p-4 rounded-md border border-destructive/30">
          <p className="text-destructive text-sm">
            Brak konfiguracji Supabase. Otwórz Ustawienia i wprowadź URL oraz publiczny anon key.
          </p>
        </div>
      )}

      <div className="max-w-xl mx-auto space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Logowanie</TabsTrigger>
            <TabsTrigger value="register">Rejestracja</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>E‑mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="password" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasło</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>Użyj silnego hasła. Minimum 6 znaków.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Zaloguj</Button>
                  <Button type="button" variant="secondary" onClick={() => nav("/")}>Anuluj</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="register">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>E‑mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="password" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasło</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>Po rejestracji może być wymagane potwierdzenie e‑mail.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Utwórz konto</Button>
                  <Button type="button" variant="secondary" onClick={() => nav("/")}>Anuluj</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-muted-foreground">lub</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <Button variant="outline" onClick={async () => { try { await signInGoogle(); } catch { errorTone(); toast.error("Błąd logowania Google"); } }}>
          Kontynuuj z Google
        </Button>
      </div>
    </main>
  );
};

export default AuthPage;
