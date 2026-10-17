import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { Progress as Bar } from "@/components/ui/progress";
import { coursesQuery } from "@/lib/data";
import { courseStats } from "@/lib/course-types";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress — Pathway-SI" }, { name: "description", content: "Track your learning progress." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQuery),
  component: ProgressPage,
});

function ProgressPage() {
  const { data } = useSuspenseQuery(coursesQuery);
  const rows = data.map((c) => ({ c, s: courseStats(c.content, c.progress) }));
  const overall = rows.length ? Math.round(rows.reduce((a, r) => a + r.s.pct, 0) / rows.length) : 0;
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Progress</h1>
      <div className="flex items-center gap-6 rounded-3xl border bg-card p-6">
        <div className="relative grid size-28 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${overall * 3.6}deg, var(--muted) 0)` }}>
          <div className="grid size-20 place-items-center rounded-full bg-card font-display text-2xl font-bold">{overall}%</div>
        </div>
        <div><p className="text-xl font-semibold">Overall completion</p><p className="text-muted-foreground">Across {rows.length} course{rows.length === 1 ? "" : "s"}</p></div>
      </div>
      <div className="overflow-hidden rounded-3xl border bg-card">
        {rows.map(({ c, s }) => (
          <Link key={c.id} to="/course/$id" params={{ id: c.id }} className="grid items-center gap-3 border-b p-5 last:border-0 hover:bg-muted md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div><p className="font-semibold">{c.title}</p><Bar value={s.pct} className="mt-2 h-2" /></div>
            <p className="text-sm"><span className="text-muted-foreground">Lessons</span> {s.done}/{s.totalLessons}</p>
            <p className="text-sm"><span className="text-muted-foreground">Quiz avg</span> {s.avgQuiz}%</p>
            <p className="flex items-center gap-1 text-sm">{s.passed ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-muted-foreground" />} Assignments {s.solved}/{s.totalAssignments}</p>
          </Link>
        ))}
        {!rows.length && <p className="p-10 text-center text-muted-foreground">No courses yet.</p>}
      </div>
    </div>
  );
}
