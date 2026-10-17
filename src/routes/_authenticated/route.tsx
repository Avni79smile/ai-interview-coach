import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Home, Sparkles, LineChart, Award, LogOut, ListChecks, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { profileQuery } from "@/lib/data";
import { avatarSrc } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Shell,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/home", label: "Home", icon: Home },
  { to: "/generate", label: "AI Generator", icon: Sparkles },
  { to: "/quiz", label: "Quiz me", icon: ListChecks },
  { to: "/interview", label: "AI Interview", icon: Mic },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/certificates", label: "Certificates", icon: Award },
] as const;

function Shell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: p } = useQuery(profileQuery);
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 md:flex">
        <Logo light />
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-primary" }}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent p-3">
          <img src={avatarSrc(p?.avatar)} alt="" className="size-10 rounded-full bg-secondary object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{p?.display_name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{p?.email}</p>
          </div>
          <button onClick={signOut} aria-label="Sign out" className="text-sidebar-foreground/70 hover:text-sidebar-primary"><LogOut className="size-4" /></button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Logo />
          <button onClick={signOut} className="text-sm text-muted-foreground">Sign out</button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground" activeProps={{ className: "bg-primary !text-primary-foreground" }}>{n.label}</Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 p-5 md:p-10"><Outlet /></main>
      </div>
    </div>
  );
}
