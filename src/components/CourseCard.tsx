import { Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { courseStats } from "@/lib/course-types";
import type { CourseRow } from "@/lib/data";

export function CourseCard({ c }: { c: CourseRow }) {
  const s = courseStats(c.content, c.progress);
  return (
    <Link to="/course/$id" params={{ id: c.id }} className="group block rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold capitalize text-secondary-foreground">{c.level}</span>
        {s.complete && <span className="rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-success-foreground">Completed</span>}
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-semibold group-hover:text-primary">{c.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{s.done}/{s.totalLessons} lessons · Quiz avg {s.avgQuiz}%</p>
      <Progress value={s.pct} className="mt-4 h-2" />
    </Link>
  );
}
