import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { QuizQ } from "@/lib/course-types";

export function Quiz({ questions, onDone, best }: { questions: QuizQ[]; onDone: (pct: number) => void; best?: number | undefined }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = questions.filter((q, i) => answers[i] === q.answer).length;
  const pct = Math.round((score / questions.length) * 100);

  return (
    <div className="rounded-3xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Lesson quiz</h3>
        {best !== undefined && <span className="text-sm text-muted-foreground">Best: {best}%</span>}
      </div>
      <div className="mt-5 space-y-6">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="font-semibold">{i + 1}. {q.question}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, k) => {
                const chosen = answers[i] === k;
                const state = submitted ? (k === q.answer ? "border-success bg-success/10" : chosen ? "border-destructive bg-destructive/10" : "border-border") : chosen ? "border-primary bg-primary/10" : "border-border hover:border-primary/50";
                return (
                  <button key={k} disabled={submitted} onClick={() => setAnswers({ ...answers, [i]: k })} className={`rounded-xl border-2 p-3 text-left text-sm transition ${state}`}>{o}</button>
                );
              })}
            </div>
            {submitted && <p className="mt-2 text-sm text-muted-foreground">💡 {q.explanation}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4">
        {submitted ? (
          <>
            <p className="font-display text-2xl font-bold">{pct}%</p>
            <Button variant="outline" className="rounded-full" onClick={() => { setAnswers({}); setSubmitted(false); }}>Retry</Button>
          </>
        ) : (
          <Button variant="hero" disabled={Object.keys(answers).length < questions.length} onClick={() => { setSubmitted(true); onDone(pct); }}>Submit answers</Button>
        )}
      </div>
    </div>
  );
}
