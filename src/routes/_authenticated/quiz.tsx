import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Shuffle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Quiz } from "@/components/Quiz";
import { generateQuiz } from "@/lib/course.functions";
import { coursesQuery } from "@/lib/data";
import { RANDOM_TOPICS } from "@/lib/topics";
import type { QuizQ } from "@/lib/course-types";
import { TUTOR } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({ meta: [{ title: "Quiz me — Pathway-SI" }, { name: "description", content: "Generate an AI quiz on any topic or course." }] }),
  component: QuizPage,
});

function QuizPage() {
  const fn = useServerFn(generateQuiz);
  const { data: courses = [] } = useQuery(coursesQuery);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [busy, setBusy] = useState(false);
  const [quiz, setQuiz] = useState<{ title: string; questions: QuizQ[] } | null>(null);
  const [round, setRound] = useState(0);

  async function make(t = topic) {
    if (t.trim().length < 2) { toast.error("Enter a topic first"); return; }
    setBusy(true);
    try {
      const r = await fn({ data: { topic: t, count, difficulty } });
      if ("error" in r && r.error) toast.error(r.error);
      else if (r.questions && r.title) { setQuiz({ title: r.title, questions: r.questions }); setRound((x) => x + 1); }
    } catch { toast.error("Could not create the quiz. Please try again."); }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <img src={TUTOR} alt="" className="size-20 rounded-2xl bg-secondary object-cover" />
        <div><h1 className="text-4xl font-bold">Quiz me</h1><p className="text-muted-foreground">Ask for a quiz on any topic, or one of your courses.</p></div>
      </div>
      <div className="space-y-5 rounded-3xl border bg-card p-6 shadow-soft">
        <div className="space-y-2">
          <Label htmlFor="qt">Topic</Label>
          <div className="flex gap-2">
            <Input id="qt" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. World War II, Big-O notation" className="h-11" maxLength={300} />
            <Button type="button" variant="outline" className="h-11 rounded-full" disabled={busy} onClick={() => { const t = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)]!; setTopic(t); make(t); }}><Shuffle /> Random</Button>
          </div>
          {courses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {courses.slice(0, 6).map((c) => <button key={c.id} type="button" onClick={() => setTopic(c.content.title)} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">{c.content.title}</button>)}
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Questions: {count}</Label>
            <input type="range" min={3} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-primary" />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDifficulty(d)} className={`rounded-xl border-2 py-2 text-sm font-semibold capitalize ${difficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>
        <Button variant="hero" size="lg" className="w-full" disabled={busy} onClick={() => make()}><ListChecks /> {busy ? "Writing your quiz…" : "Generate quiz"}</Button>
      </div>
      {quiz && (
        <div className="animate-scene space-y-3">
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          <Quiz key={round} questions={quiz.questions} onDone={(pct) => toast(`You scored ${pct}%`)} />
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={() => make()}>New questions on this topic</Button>
        </div>
      )}
    </div>
  );
}
