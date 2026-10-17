import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary font-display text-lg font-bold text-primary-foreground">P</span>
      <span className={`font-display text-xl font-semibold ${light ? "text-sidebar-foreground" : "text-foreground"}`}>
        Pathway<span className="text-accent">-SI</span>
      </span>
    </Link>
  );
}
