import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Shuffle } from "lucide-react";
import { RANDOM_TOPICS } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateCourse } from "@/lib/course.functions";
import { TUTOR } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({ meta: [{ title: "AI Course Generator — Pathway-SI" }, { name: "description", content: "Generate a full course on any topic." }] }),
  component: Generate,
});

const levels = ["beginner", "intermediate", "advanced"] as const;
const ideas = ["Python for data analysis", "React hooks", "Personal finance basics", "SQL joins", "Intro to machine learning"];
const steps = ["Designing the curriculum…", "Writing animated lesson scripts…", "Crafting quizzes…", "Building your coding challenge…", "Almost there…"];

function Generate() {
  const fn = useServerFn(generateCourse);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("beginner");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 9000);
    try {
      const r = await fn({ data: { topic, level, goal } });
      if ("error" in r && r.error) toast.error(r.error);
      else if ("id" in r) {
        await qc.invalidateQueries({ queryKey: ["courses"] });
        toast.success("Your course is ready!");
        navigate({ to: "/course/$id", params: { id: r.id } });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      clearInterval(t);
      setBusy(false);
    }
  }

  if (busy)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <img src={TUTOR} alt="" className="w-44 animate-float" />
        <h1 className="mt-6 text-3xl font-bold">Building "{topic}"</h1>
        <p key={step} className="animate-scene mt-2 text-muted-foreground">{steps[step]}</p>
        <div className="mt-6 flex gap-2">{[0, 1, 2].map((i) => <span key={i} className="h-6 w-1.5 origin-bottom animate-talk rounded bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
        <p className="mt-6 text-xs text-muted-foreground">This usually takes under a minute.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <img src={TUTOR} alt="" className="size-20 rounded-2xl bg-secondary object-cover" />
        <div><h1 className="text-4xl font-bold">AI Course Generator</h1><p className="text-muted-foreground">Tell Sia what you want to learn.</p></div>
      </div>
      <form onSubmit={go} className="mt-8 space-y-6 rounded-3xl border bg-card p-6 shadow-soft">
        <div className="space-y-2">
          <Label htmlFor="t">Topic</Label>
          <Input id="t" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. JavaScript arrays" required minLength={2} maxLength={200} className="h-12 text-base" />
          <div className="flex flex-wrap gap-2">{ideas.map((i) => <button type="button" key={i} onClick={() => setTopic(i)} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">{i}</button>)}</div>
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <div className="grid grid-cols-3 gap-2">
            {levels.map((l) => (
              <button type="button" key={l} onClick={() => setLevel(l)} className={`rounded-xl border-2 py-2.5 text-sm font-semibold capitalize transition ${level === l ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2"><Label htmlFor="g">Your goal (optional)</Label><Textarea id="g" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} placeholder="e.g. prepare for a job interview" /></div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button variant="hero" size="lg"><Sparkles /> Generate course</Button>
          <Button type="button" variant="outline" size="lg" className="rounded-full" onClick={() => setTopic(RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)]!)}><Shuffle /> Random topic</Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">Includes 6 animated lessons, 18 quiz questions and 3 LeetCode-style coding assignments.</p>
      </form>
    </div>
  );
}
