import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Target, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { coursesQuery, profileQuery } from "@/lib/data";
import { courseStats } from "@/lib/course-types";
import { AVATARS, TUTOR } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Pathway-SI" }, { name: "description", content: "Your learning overview." }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(coursesQuery), context.queryClient.ensureQueryData(profileQuery)]),
  component: Dashboard,
});

function Dashboard() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const { data: p } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const stats = courses.map((c) => courseStats(c.content, c.progress));
  const lessons = stats.reduce((a, s) => a + s.done, 0);
  const quizzes = stats.filter((s) => s.avgQuiz).map((s) => s.avgQuiz);
  const avg = quizzes.length ? Math.round(quizzes.reduce((a, b) => a + b, 0) / quizzes.length) : 0;
  const certs = stats.filter((s) => s.complete).length;
  const cont = courses.find((c, i) => !stats[i]?.complete);

  async function pickAvatar(k: string) {
    const { error } = await supabase.from("profiles").update({ avatar: k }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink p-8 text-ink-foreground md:p-10">
        <img src={TUTOR} alt="" className="absolute -bottom-6 right-4 hidden w-48 animate-float md:block" />
        <p className="text-sm text-sidebar-foreground/70">Welcome back,</p>
        <h1 className="text-4xl font-bold">{p.display_name} 👋</h1>
        <p className="mt-2 max-w-md text-sidebar-foreground/80">{cont ? `Pick up where you left off in "${cont.title}".` : "Ready to start a new pathway?"}</p>
        <div className="mt-6 flex gap-3">
          {cont && <Button variant="accent" asChild><Link to="/course/$id" params={{ id: cont.id }}>Continue learning</Link></Button>}
          <Button variant="outline" className="rounded-full border-sidebar-border bg-transparent text-ink-foreground hover:bg-sidebar-accent hover:text-ink-foreground" asChild><Link to="/generate"><Sparkles /> New course</Link></Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { i: BookOpen, l: "Courses", v: courses.length },
          { i: CheckCircle2, l: "Lessons done", v: lessons },
          { i: Target, l: "Quiz average", v: `${avg}%` },
          { i: Award, l: "Certificates", v: certs },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border bg-card p-5">
            <s.i className="size-5 text-primary" />
            <p className="mt-3 font-display text-3xl font-bold">{s.v}</p>
            <p className="text-sm text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-bold">Recent courses</h2><Link to="/home" className="text-sm font-semibold text-primary">View all</Link></div>
          {courses.length ? (
            <div className="grid gap-4 sm:grid-cols-2">{courses.slice(0, 4).map((c) => <CourseCard key={c.id} c={c} />)}</div>
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No courses yet. <Link to="/generate" className="font-semibold text-primary">Generate one →</Link></div>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-xl font-bold">Your avatar</h2>
          <p className="text-sm text-muted-foreground">Choose how you appear.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Object.entries(AVATARS).map(([k, src]) => (
              <button key={k} onClick={() => pickAvatar(k)} className={`rounded-2xl border-2 bg-secondary p-1 transition ${p.avatar === k ? "border-primary" : "border-transparent hover:border-border"}`}>
                <img src={src} alt={`Avatar ${k}`} className="aspect-square w-full rounded-xl object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
