import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Code2, Award, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress as Bar } from "@/components/ui/progress";
import { LessonVideo } from "@/components/LessonVideo";
import { Quiz } from "@/components/Quiz";
import { courseQuery, saveProgress } from "@/lib/data";
import { courseStats, type Progress } from "@/lib/course-types";

export const Route = createFileRoute("/_authenticated/course/$id")({
  head: () => ({ meta: [{ title: "Course — Pathway-SI" }, { name: "description", content: "Animated lessons and quizzes." }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(courseQuery(params.id)),
  component: CoursePage,
});

function CoursePage() {
  const { id } = Route.useParams();
  const { data: c } = useSuspenseQuery(courseQuery(id));
  const qc = useQueryClient();
  const keys = c.content.modules.flatMap((m, mi) => m.lessons.map((_, li) => `${mi}-${li}`));
  const firstOpen = keys.find((k) => !c.progress.lessons?.[k]?.done) ?? keys[0] ?? "0-0";
  const [active, setActive] = useState<string>(firstOpen);
  const go = (k?: string) => k && setActive(k);
  const [mi = 0, li = 0] = active.split("-").map(Number);
  const lesson = c.content.modules[mi]!.lessons[li]!;
  const stats = courseStats(c.content, c.progress);
  const lp = c.progress.lessons?.[active];

  async function update(patch: { done?: boolean; quiz?: number }) {
    const prev = c.progress.lessons?.[active] ?? {};
    const next: Progress = {
      ...c.progress,
      lessons: { ...c.progress.lessons, [active]: { done: prev.done || patch.done, quiz: Math.max(prev.quiz ?? 0, patch.quiz ?? 0) || prev.quiz || patch.quiz } },
    };
    const complete = courseStats(c.content, next).complete;
    try {
      await saveProgress(id, next, complete);
      qc.setQueryData(courseQuery(id).queryKey, { ...c, progress: next });
      qc.invalidateQueries({ queryKey: ["courses"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">Module {mi + 1} · {c.content.modules[mi]!.title}</p>
          <h1 className="text-3xl font-bold md:text-4xl">{lesson.title}</h1>
          <p className="mt-1 text-muted-foreground">{lesson.summary}</p>
        </div>
        <LessonVideo key={active} scenes={lesson.scenes} title={lesson.title} onEnd={() => toast("Video finished — take the quiz below!")} />
        <Quiz key={active + "q"} questions={lesson.quiz} best={lp?.quiz} onDone={(pct) => update({ quiz: pct, done: pct >= 60 })} />
        {lp?.done ? (
          <p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="size-5" /> Lesson complete</p>
        ) : (
          <p className="text-sm text-muted-foreground">Score 60% or more on the quiz to complete this lesson.</p>
        )}
        <div className="flex justify-between">
          <Button variant="outline" className="rounded-full" disabled={keys.indexOf(active) === 0} onClick={() => go(keys[keys.indexOf(active) - 1])}>← Previous</Button>
          {keys.indexOf(active) < keys.length - 1 ? (
            <Button variant="hero" onClick={() => go(keys[keys.indexOf(active) + 1])}>Next lesson →</Button>
          ) : (
            <Button variant="hero" asChild><Link to="/assessment/$id" params={{ id }}>Coding assignments →</Link></Button>
          )}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="line-clamp-2 text-lg font-bold">{c.content.title}</h2>
          <Bar value={stats.pct} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{stats.pct}% complete</p>
        </div>
        <div className="rounded-2xl border bg-card p-3">
          {c.content.modules.map((m, a) => (
            <div key={a} className="mb-2">
              <p className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Module {a + 1}: {m.title}</p>
              {m.lessons.map((l, b) => {
                const k = `${a}-${b}`;
                const done = c.progress.lessons?.[k]?.done;
                return (
                  <button key={k} onClick={() => setActive(k)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${k === active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}>
                    {done ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : k === active ? <PlayCircle className="size-4 shrink-0" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}
                    <span className="line-clamp-1">{l.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <Link to="/assessment/$id" params={{ id }} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold hover:bg-muted">
            {stats.passed ? <CheckCircle2 className="size-4 text-success" /> : <Code2 className="size-4 text-accent-foreground" />} Coding assignments ({stats.solved}/{stats.totalAssignments})
          </Link>
          {stats.complete && (
            <Link to="/certificate/$id" params={{ id }} className="mt-1 flex items-center gap-2 rounded-lg bg-accent px-2 py-2 text-sm font-semibold text-accent-foreground"><Award className="size-4" /> View certificate</Link>
          )}
        </div>
      </aside>
    </div>
  );
}
