import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseQuery, profileQuery } from "@/lib/data";
import { courseStats } from "@/lib/course-types";

export const Route = createFileRoute("/_authenticated/certificate/$id")({
  head: () => ({ meta: [{ title: "Certificate — Pathway-SI" }, { name: "description", content: "Certificate of completion." }] }),
  loader: ({ context, params }) => Promise.all([context.queryClient.ensureQueryData(courseQuery(params.id)), context.queryClient.ensureQueryData(profileQuery)]),
  component: Cert,
});

function Cert() {
  const { id } = Route.useParams();
  const { data: c } = useSuspenseQuery(courseQuery(id));
  const { data: p } = useSuspenseQuery(profileQuery);
  const s = courseStats(c.content, c.progress);
  if (!s.complete)
    return <div className="text-center"><h1 className="text-3xl font-bold">Not unlocked yet</h1><p className="mt-2 text-muted-foreground">You're {s.pct}% through this course.</p><Button variant="hero" className="mt-6" asChild><Link to="/course/$id" params={{ id }}>Continue course</Link></Button></div>;
  const date = new Date(c.completed_at ?? Date.now()).toLocaleDateString(undefined, { dateStyle: "long" });
  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden"><Button variant="hero" onClick={() => window.print()}><Printer /> Print / Save PDF</Button></div>
      <div className="relative mx-auto aspect-[1.414] max-w-4xl overflow-hidden rounded-xl border-8 border-double border-primary bg-card p-10 text-center shadow-soft">
        <div className="absolute inset-0 bg-hero opacity-60" />
        <div className="relative flex h-full flex-col items-center justify-center">
          <p className="font-display text-xl font-semibold">Pathway<span className="text-accent">-SI</span></p>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">Certificate of Completion</p>
          <p className="mt-6 text-muted-foreground">This certifies that</p>
          <h1 className="mt-2 text-4xl font-bold text-primary md:text-6xl">{p.display_name}</h1>
          <p className="mt-4 text-muted-foreground">has successfully completed</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{c.content.title}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{s.totalLessons} lessons · Quiz average {s.avgQuiz}% · {s.totalAssignments} coding assignments solved</p>
          <div className="mt-8 flex w-full max-w-lg justify-between text-xs text-muted-foreground">
            <div><p className="font-semibold text-foreground">{date}</p><p>Date</p></div>
            <div className="grid size-16 place-items-center rounded-full bg-accent font-display text-xl font-bold text-accent-foreground">✓</div>
            <div><p className="font-mono font-semibold text-foreground">{c.id.slice(0, 8).toUpperCase()}</p><p>Credential ID</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
