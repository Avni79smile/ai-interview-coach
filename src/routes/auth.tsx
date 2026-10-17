import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { TUTOR } from "@/lib/avatars";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "Log in or sign up — Pathway-SI" },
      { name: "description", content: "Access your Pathway-SI dashboard and AI-generated courses." },
      { property: "og:title", content: "Log in or sign up — Pathway-SI" },
      { property: "og:description", content: "Access your Pathway-SI dashboard and AI-generated courses." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const signup = mode === "signup";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/dashboard" }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && navigate({ to: "/dashboard" }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { display_name: name } },
      });
      if (error) toast.error(error.message);
      else if (!data.session) setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-10 md:flex">
        <Logo light />
        <div>
          <img src={TUTOR} alt="Tutor avatar" className="w-56 animate-float" />
          <h2 className="mt-6 text-4xl font-bold text-ink-foreground">"Tell me what you want to learn — I'll build the path."</h2>
          <p className="mt-3 text-sidebar-foreground/70">— Sia, your Pathway-SI tutor</p>
        </div>
        <span />
      </div>
      <div className="flex items-center justify-center bg-hero p-6">
        <div className="w-full max-w-sm rounded-3xl border bg-card p-8 shadow-soft">
          <div className="md:hidden mb-6"><Logo /></div>
          {sent ? (
            <div className="text-center">
              <h1 className="text-3xl font-bold">Check your email</h1>
              <p className="mt-3 text-muted-foreground">We sent a confirmation link to <b>{email}</b>. Click it to open your dashboard.</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{signup ? "Create your account" : "Welcome back"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{signup ? "Start your first AI course in a minute." : "Continue your learning pathway."}</p>
              <Button type="button" variant="outline" className="mt-6 w-full rounded-full" onClick={google}>Continue with Google</Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-4">
                {signup && (
                  <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                )}
                <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="p">Password</Label><Input id="p" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button variant="hero" className="w-full" disabled={busy}>{busy ? "Please wait…" : signup ? "Sign up" : "Log in"}</Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {signup ? "Already have an account? " : "New to Pathway-SI? "}
                <Link to="/auth" search={{ mode: signup ? "login" : "signup" }} className="font-semibold text-primary">{signup ? "Log in" : "Sign up"}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
