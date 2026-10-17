import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { coursesQuery } from "@/lib/data";
import { CATALOG, type CatalogCourse } from "@/lib/catalog";
import { generateCourse } from "@/lib/course.functions";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Course library — Pathway-SI" }, { name: "description", content: "Explore AI, coding and data science courses, plus your own generated courses." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQuery),
  component: HomePage,
});

const CATS = ["All", "AI", "Coding", "Data Science"] as const;

function HomePage() {
  const { data } = useSuspenseQuery(coursesQuery);
  const fn = useServerFn(generateCourse);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [busy, setBusy] = useState<string | null>(null);
  const ql = q.toLowerCase();
  const mine = data.filter((c) => c.title.toLowerCase().includes(ql) || c.topic.toLowerCase().includes(ql));
  const catalog = CATALOG.filter((c) => (cat === "All" || c.category === cat) && (c.title.toLowerCase().includes(ql) || c.skills.join(" ").toLowerCase().includes(ql)));

  async function enroll(c: CatalogCourse) {
    const existing = data.find((r) => r.topic === c.title);
    if (existing) { navigate({ to: "/course/$id", params: { id: existing.id } }); return; }
    setBusy(c.slug);
    try {
      const r = await fn({ data: { topic: c.title, level: c.level, goal: c.description.slice(0, 300), outline: c.outline } });
      if ("error" in r && r.error) toast.error(r.error);
      else if ("id" in r) {
        await qc.invalidateQueries({ queryKey: ["courses"] });
        toast.success("Enrolled! Your course is ready.");
        navigate({ to: "/course/$id", params: { id: r.id } });
      }
    } catch { toast.error("Could not enroll. Please try again."); }
    setBusy(null);
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-4xl font-bold">Course library</h1><p className="text-muted-foreground">Expert-designed AI, coding and data science tracks — plus everything you've generated.</p></div>
        <Button variant="hero" asChild><Link to="/generate">+ New course</Link></Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search courses or skills…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition ${cat === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>{c}</button>
        ))}
      </div>

      {mine.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">My courses</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mine.map((c) => <CourseCard key={c.id} c={c} />)}</div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold">Explore the catalog</h2>
        <p className="text-sm text-muted-foreground">Each course includes animated video lessons, quizzes, real LeetCode assignments and a certificate.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => {
            const enrolled = data.some((r) => r.topic === c.title);
            return (
              <div key={c.slug} className="flex flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{c.emoji}</span>
                  <div className="flex gap-1.5">
                    <span className="rounded-full bg-accent/30 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">{c.category}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold capitalize text-secondary-foreground">{c.level}</span>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{c.outline.map((m, i) => <li key={i}><span className="font-mono text-primary">{i + 1}.</span> {m}</li>)}</ul>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> ~{c.hours}h</span>
                  <Button size="sm" variant={enrolled ? "outline" : "hero"} disabled={!!busy} onClick={() => enroll(c)}>
                    {busy === c.slug ? <><Loader2 className="animate-spin" /> Building…</> : enrolled ? "Continue" : "Enroll"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {!catalog.length && <p className="mt-10 text-center text-muted-foreground">No courses found.</p>}
      </section>
    </div>
  );
}
