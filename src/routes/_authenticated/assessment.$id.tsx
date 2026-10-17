import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, Send, CheckCircle2, XCircle, Bot, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseQuery, saveProgress } from "@/lib/data";
import { assignmentState, courseStats, getAssignments, type Progress } from "@/lib/course-types";
import { grade, runLocal, type TestResult } from "@/lib/runner";
import { judgeCode, reviewCode } from "@/lib/course.functions";
import { LANGUAGES, starterCode, type LangId } from "@/lib/leetcode";
import { ExternalLink } from "lucide-react";
import { TUTOR } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/assessment/$id")({
  head: () => ({ meta: [{ title: "Coding assignments — Pathway-SI" }, { name: "description", content: "Solve LeetCode-style assignments for your course." }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(courseQuery(params.id)),
  component: Assessment,
});

type Review = { verdict: string; score: number; feedback: string; hints: string[]; complexity: string };

function Assessment() {
  const { id } = Route.useParams();
  const { data: c } = useSuspenseQuery(courseQuery(id));
  const qc = useQueryClient();
  const review = useServerFn(reviewCode);
  const judge = useServerFn(judgeCode);
  const list = getAssignments(c.content);
  const [idx, setIdx] = useState(0);
  const a = list[idx]!;
  const saved = assignmentState(c.content, c.progress, idx);
  const [lang, setLang] = useState<LangId>(((saved as { lang?: LangId }).lang) || "javascript");
  const starter = (l: LangId, i = idx) => starterCode(l, list[i]!.functionName, list[i]!.signature, list[i]!.starterCode);
  const [code, setCode] = useState(saved.code || starter(lang));
  const langInfo = LANGUAGES.find((l) => l.id === lang)!;
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [mode, setMode] = useState<"run" | "submit">("run");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<Review | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    const s = assignmentState(c.content, c.progress, idx);
    const l = ((s as { lang?: LangId }).lang) || lang;
    setLang(l);
    setCode(s.code || starter(l));
    setResults(null);
    setAi(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  async function persist(patch: { passed?: boolean; code: string }) {
    const prev = assignmentState(c.content, c.progress, idx);
    const next: Progress = { ...c.progress, assignments: { ...c.progress.assignments, [idx]: { code: patch.code, lang, passed: !!(prev.passed || patch.passed) } } };
    const complete = courseStats(c.content, next).complete;
    await saveProgress(id, next, complete);
    qc.setQueryData(courseQuery(id).queryKey, { ...c, progress: next });
    qc.invalidateQueries({ queryKey: ["courses"] });
    return complete;
  }

  async function execute(tests: typeof a.tests): Promise<TestResult[] | null> {
    if (lang === "javascript" || lang === "python") return runLocal(lang, code, a.functionName, tests, a.compare);
    try {
      const out = await judge({ data: { language: langInfo.label, fn: a.functionName, code, inputs: JSON.stringify(tests.map((t) => t.input)).slice(0, 8000) } });
      if ("error" in out && out.error) { toast.error(out.error); return null; }
      return grade(tests, JSON.parse((out as { results: string }).results), a.compare);
    } catch { toast.error("The judge is unavailable. Please try again."); return null; }
  }

  function switchLang(l: LangId) {
    const isStarter = code.trim() === starter(lang).trim() || !code.trim();
    if (!isStarter && !confirm("Switch language? Your current code will be replaced with the new starter code.")) return;
    setLang(l);
    setCode(starter(l));
    setResults(null);
  }

  async function exec(kind: "run" | "submit") {
    setBusy(true);
    setMode(kind);
    const r = await execute(kind === "run" ? a.tests.slice(0, 2) : a.tests);
    if (!r) { setBusy(false); return; }
    setResults(r);
    if (kind === "submit") {
      const passed = r.every((x) => x.pass);
      try {
        const complete = await persist({ passed, code });
        if (passed) toast.success(complete ? "Accepted! Your certificate is unlocked 🎉" : "Accepted! On to the next one.");
        else toast.error(`${r.filter((x) => x.pass).length}/${r.length} tests passed`);
      } catch (e) { toast.error((e as Error).message); }
    }
    setBusy(false);
  }

  async function askAi() {
    setAiBusy(true);
    setAi(null);
    const r = results ?? (await execute(a.tests));
    if (!r) { setAiBusy(false); return; }
    if (!results) setResults(r);
    try {
      const out = await review({
        data: {
          problem: `${a.title}\n${a.description}\nExamples:\n${a.examples.join("\n")}`,
          code: `// Language: ${langInfo.label}\n${code}`,
          results: JSON.stringify(r.map((x) => ({ pass: x.pass, input: x.input, expected: x.expected, got: x.got, error: x.error }))).slice(0, 6000),
        },
      });
      if ("error" in out && out.error) toast.error(out.error);
      else setAi(out as Review);
    } catch { toast.error("AI review failed. Please try again."); }
    setAiBusy(false);
  }

  const tone = (d: string) => (d === "Easy" ? "bg-success/15 text-success" : d === "Hard" ? "bg-destructive/15 text-destructive" : "bg-accent/30 text-accent-foreground");
  const stats = courseStats(c.content, c.progress);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/course/$id" params={{ id }} className="text-sm text-primary">← Back to course</Link>
          <h1 className="text-3xl font-bold">Coding assignments</h1>
          <p className="text-sm text-muted-foreground">{stats.solved}/{stats.totalAssignments} solved · based on "{c.content.title}"</p>
        </div>
        {stats.complete && <Button variant="accent" asChild><Link to="/certificate/$id" params={{ id }}>View certificate</Link></Button>}
      </div>

      <div className="flex flex-wrap gap-2">
        {list.map((p, i) => {
          const done = assignmentState(c.content, c.progress, i).passed;
          return (
            <button key={i} onClick={() => setIdx(i)} className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${i === idx ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
              {done ? <CheckCircle2 className="size-4 text-success" /> : <span className="font-mono text-xs">{i + 1}</span>}
              <span className="max-w-[180px] truncate">{p.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${tone(p.difficulty)}`}>{p.difficulty}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-3xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{a.title}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone(a.difficulty)}`}>{a.difficulty}</span>
            </div>
            {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">View on LeetCode <ExternalLink className="size-3" /></a>}
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{a.description}</p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">Examples</h3>
            <div className="mt-2 space-y-2">{a.examples.map((e, i) => <pre key={i} className="whitespace-pre-wrap rounded-xl bg-muted p-3 font-mono text-xs">{e}</pre>)}</div>
            <p className="mt-4 text-xs text-muted-foreground">Implement <code className="font-mono font-semibold">{a.functionName}</code> in any language. Run checks 2 sample tests, Submit checks all {a.tests.length} hidden tests. JavaScript and Python run in your browser sandbox; other languages are evaluated by the AI judge.</p>
            {saved.passed && <p className="mt-4 flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="size-5" /> Solved</p>}
          </div>

          <div className="rounded-3xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <img src={TUTOR} alt="" className="size-12 rounded-xl bg-secondary object-cover" />
              <div className="flex-1"><p className="font-semibold">AI code review</p><p className="text-xs text-muted-foreground">Sia checks your output and logic against the expected result.</p></div>
              <Button variant="hero" disabled={aiBusy} onClick={askAi}><Bot /> {aiBusy ? "Reviewing…" : "Verify with AI"}</Button>
            </div>
            {ai && (
              <div className="animate-scene mt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${ai.verdict === "Correct" ? "bg-success/15 text-success" : ai.verdict === "Incorrect" ? "bg-destructive/15 text-destructive" : "bg-accent/30 text-accent-foreground"}`}>{ai.verdict}</span>
                  <span className="font-display text-2xl font-bold">{ai.score}/100</span>
                  {ai.complexity && <span className="text-xs text-muted-foreground">{ai.complexity}</span>}
                </div>
                <p className="text-sm">{ai.feedback}</p>
                {ai.hints.map((h, i) => <p key={i} className="flex gap-2 text-sm text-muted-foreground"><Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" />{h}</p>)}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl bg-ink lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-2 text-xs text-sidebar-foreground/70">
            <div className="flex items-center gap-2">
              <select value={lang} onChange={(e) => switchLang(e.target.value as LangId)} aria-label="Language" className="rounded-md border border-sidebar-border bg-sidebar-accent px-2 py-1 text-xs text-ink-foreground outline-none">
                {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <span>{langInfo.file} · {langInfo.local ? (lang === "python" ? "browser sandbox (first run loads Python)" : "browser sandbox") : "AI judge"}</span>
            </div>
            <button onClick={() => setCode(starter(lang))} className="hover:text-sidebar-primary">Reset</button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const t = e.currentTarget; const s = t.selectionStart;
                setCode(code.slice(0, s) + "  " + code.slice(t.selectionEnd));
                requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; });
              }
            }}
            spellCheck={false}
            className="min-h-[360px] flex-1 resize-none bg-transparent p-4 font-mono text-sm text-ink-foreground outline-none"
          />
          <div className="flex gap-2 border-t border-sidebar-border p-3">
            <Button variant="outline" className="rounded-full border-sidebar-border bg-transparent text-ink-foreground hover:bg-sidebar-accent hover:text-ink-foreground" disabled={busy} onClick={() => exec("run")}><Play /> Run</Button>
            <Button variant="accent" disabled={busy} onClick={() => exec("submit")}><Send /> Submit</Button>
          </div>
          {results && (
            <div className="max-h-72 space-y-2 overflow-auto border-t border-sidebar-border p-3">
              <p className={`font-display text-lg font-bold ${results.every((r) => r.pass) ? "text-success" : "text-destructive"}`}>
                {results.every((r) => r.pass) ? (mode === "submit" ? "Accepted" : "Sample tests passed") : results.some((r) => r.error?.startsWith("Time Limit")) ? "Time Limit Exceeded" : results.some((r) => r.error) ? "Runtime Error" : "Wrong Answer"} · {results.filter((r) => r.pass).length}/{results.length}
              </p>
              {results.map((r, i) => (
                <div key={i} className="rounded-xl bg-sidebar-accent p-3 font-mono text-xs text-sidebar-foreground">
                  <p className="flex items-center gap-2 font-sans font-semibold">{r.pass ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />} Test {i + 1}</p>
                  <p className="mt-1">input: {JSON.stringify(r.input)}</p>
                  <p>expected: {JSON.stringify(r.expected)}</p>
                  <p>{r.error ? `error: ${r.error}` : `output: ${JSON.stringify(r.got)}`}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
