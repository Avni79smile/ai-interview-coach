import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Award, Lock } from "lucide-react";
import { coursesQuery } from "@/lib/data";
import { courseStats } from "@/lib/course-types";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({ meta: [{ title: "Certificates — Pathway-SI" }, { name: "description", content: "Your earned certificates." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQuery),
  component: Certs,
});

function Certs() {
  const { data } = useSuspenseQuery(coursesQuery);
  return (
    <div>
      <h1 className="text-4xl font-bold">Certificates</h1>
      <p className="text-muted-foreground">Complete every lesson and pass the assessment to earn one.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => {
          const s = courseStats(c.content, c.progress);
          return s.complete ? (
            <Link key={c.id} to="/certificate/$id" params={{ id: c.id }} className="rounded-2xl border-2 border-accent bg-card p-6 transition hover:shadow-soft">
              <Award className="size-8 text-accent" /><p className="mt-3 font-semibold">{c.title}</p><p className="text-xs text-muted-foreground">View & print</p>
            </Link>
          ) : (
            <Link key={c.id} to="/course/$id" params={{ id: c.id }} className="rounded-2xl border border-dashed bg-card p-6 opacity-75">
              <Lock className="size-8 text-muted-foreground" /><p className="mt-3 font-semibold">{c.title}</p><p className="text-xs text-muted-foreground">{s.pct}% complete</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
