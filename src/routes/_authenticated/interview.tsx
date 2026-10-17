import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, Send, Volume2, VolumeX, PhoneOff, RotateCcw, Briefcase, Code2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nextInterviewQuestion, evaluateInterview, type InterviewReport, type InterviewRound, type InterviewTurn } from "@/lib/interview.functions";
import hrImg from "@/assets/interviewer-hr.jpg";
import techImg from "@/assets/interviewer-tech.jpg";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [
    { title: "AI Interview — Pathway-SI" },
    { name: "description", content: "Practice HR and technical interviews with a talking AI interviewer on any tech topic." },
    { property: "og:title", content: "AI Interview — Pathway-SI" },
    { property: "og:description", content: "Practice HR and technical interviews with a talking AI interviewer." },
  ] }),
  component: InterviewPage,
});

const SUGGESTED = ["React", "JavaScript", "Python", "Java", "Data Structures & Algorithms", "System Design", "SQL & Databases", "Node.js", "Machine Learning", "DevOps & Docker", "Cloud (AWS)", "Cybersecurity"];
const LEVELS = [{ v: "fresher", l: "Fresher" }, { v: "mid", l: "2–5 yrs" }, { v: "senior", l: "Senior" }] as const;
type Level = (typeof LEVELS)[number]["v"];

const INTERVIEWERS: Record<InterviewRound, { name: string; title: string; img: string }> = {
  hr: { name: "Maya", title: "HR Manager", img: hrImg },
  technical: { name: "Arjun", title: "Senior Engineer", img: techImg },
};

type SR = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  const C = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
  return C ? new C() : null;
}

function InterviewPage() {
  const nextFn = useServerFn(nextInterviewQuestion);
  const evalFn = useServerFn(evaluateInterview);
  const [stage, setStage] = useState<"setup" | "live" | "report">("setup");
  const [topic, setTopic] = useState("");
  const [round, setRound] = useState<InterviewRound>("technical");
  const [level, setLevel] = useState<Level>("fresher");
  const [total, setTotal] = useState(5);
  const [history, setHistory] = useState<InterviewTurn[]>([]);
  const [current, setCurrent] = useState<{ reaction: string; question: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [srSupported, setSrSupported] = useState(false);
  const srRef = useRef<SR | null>(null);
  const baseAnswer = useRef("");

  const who = INTERVIEWERS[round];
  const cfg = { topic, round, level, total };

  useEffect(() => { setSrSupported(!!getSR()); return () => { window.speechSynthesis?.cancel(); srRef.current?.stop(); }; }, []);

  function speak(text: string) {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth || !voiceOn) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices().filter((v) => v.lang.startsWith("en"));
    const female = /female|samantha|zira|susan|victoria|karen|google uk english female/i;
    const pick = round === "hr" ? voices.find((v) => female.test(v.name)) : voices.find((v) => /male|daniel|alex|david|google uk english male/i.test(v.name) && !female.test(v.name));
    if (pick) u.voice = pick;
    u.rate = 1; u.pitch = round === "hr" ? 1.1 : 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
  }

  function stopListening() { srRef.current?.stop(); setListening(false); }
  function toggleMic() {
    if (listening) { stopListening(); return; }
    const sr = getSR();
    if (!sr) { toast.error("Voice answers aren't supported in this browser — type your answer instead."); return; }
    window.speechSynthesis?.cancel();
    baseAnswer.current = answer ? answer.trim() + " " : "";
    sr.lang = "en-US"; sr.continuous = true; sr.interimResults = true;
    sr.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i]![0]!.transcript;
      setAnswer(baseAnswer.current + txt);
    };
    sr.onend = () => setListening(false);
    sr.onerror = () => { setListening(false); toast.error("Couldn't hear you — check microphone permission."); };
    srRef.current = sr;
    sr.start();
    setListening(true);
  }

  async function ask(h: InterviewTurn[]) {
    setBusy(true);
    try {
      const r = await nextFn({ data: { ...cfg, history: h } });
      if ("error" in r && r.error) { toast.error(r.error); return false; }
      if ("question" in r && r.question) {
        setCurrent({ reaction: r.reaction ?? "", question: r.question });
        speak(`${r.reaction ? r.reaction + " " : ""}${r.question}`);
        return true;
      }
    } catch { toast.error("The interviewer could not respond. Please try again."); }
    finally { setBusy(false); }
    return false;
  }

  async function start() {
    if (topic.trim().length < 2) { toast.error("Enter a tech topic first"); return; }
    setHistory([]); setAnswer(""); setReport(null); setCurrent(null);
    setStage("live");
    const ok = await ask([]);
    if (!ok) setStage("setup");
  }

  async function finish(h: InterviewTurn[]) {
    window.speechSynthesis?.cancel();
    stopListening();
    if (!h.length) { setStage("setup"); return; }
    setBusy(true);
    setCurrent({ reaction: "", question: "Thanks for your time! Give me a moment to put together your feedback." });
    speak("Thanks for your time! Give me a moment to put together your feedback.");
    try {
      const r = await evalFn({ data: { ...cfg, history: h } });
      if ("error" in r && r.error) toast.error(r.error);
      else if ("report" in r && r.report) { setReport(r.report); setStage("report"); }
    } catch { toast.error("Could not score the interview. Please try again."); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!current || busy) return;
    stopListening();
    window.speechSynthesis?.cancel();
    const h = [...history, { question: current.question, answer: answer.trim() }];
    setHistory(h); setAnswer("");
    if (h.length >= total) await finish(h);
    else await ask(h);
  }

  if (stage === "setup") return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-4xl font-bold">AI Interview</h1><p className="text-muted-foreground">Pick a tech topic and round — your AI interviewer will talk you through the questions that really come up.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["technical", "hr"] as const).map((r) => {
          const p = INTERVIEWERS[r];
          return (
            <button key={r} type="button" onClick={() => setRound(r)} className={`flex items-center gap-4 rounded-3xl border-2 bg-card p-4 text-left shadow-soft transition ${round === r ? "border-primary" : "border-border hover:border-primary/40"}`}>
              <img src={p.img} alt={p.name} width={816} height={816} className="size-20 rounded-2xl object-cover" />
              <div>
                <p className="flex items-center gap-2 text-lg font-bold">{r === "hr" ? <Briefcase className="size-4" /> : <Code2 className="size-4" />}{r === "hr" ? "HR round" : "Technical round"}</p>
                <p className="text-sm text-muted-foreground">With {p.name}, {p.title}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="space-y-5 rounded-3xl border bg-card p-6 shadow-soft">
        <div className="space-y-2">
          <Label htmlFor="it">{round === "hr" ? "Role you're interviewing for" : "Tech topic"}</Label>
          <Input id="it" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. React, Java backend, System Design" className="h-11" maxLength={200} />
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTED.map((s) => <button key={s} type="button" onClick={() => setTopic(s)} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">{s}</button>)}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Experience level</Label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => <button key={l.v} type="button" onClick={() => setLevel(l.v)} className={`rounded-xl border-2 py-2 text-sm font-semibold ${level === l.v ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{l.l}</button>)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Questions: {total}</Label>
            <input type="range" min={3} max={10} value={total} onChange={(e) => setTotal(Number(e.target.value))} className="w-full accent-primary" />
          </div>
        </div>
        <Button variant="hero" size="lg" className="w-full" disabled={busy} onClick={start}><Mic /> Start interview</Button>
        <p className="text-center text-xs text-muted-foreground">Turn your sound on. You can answer by speaking (Chrome / Edge) or typing.</p>
      </div>
    </div>
  );

  if (stage === "report" && report) return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <img src={who.img} alt={who.name} width={816} height={816} className="size-20 rounded-2xl object-cover" />
        <div><h1 className="text-3xl font-bold">Your interview feedback</h1><p className="text-muted-foreground">{round === "hr" ? "HR" : "Technical"} round · {topic}</p></div>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-3xl bg-hero p-8 text-center shadow-soft">
        <p className="text-6xl font-bold text-primary-foreground">{report.score}<span className="text-2xl">/100</span></p>
        <p className="rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">{report.verdict}</p>
        <p className="max-w-xl text-primary-foreground/90">{report.summary}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5"><h3 className="mb-2 flex items-center gap-2 font-bold"><CheckCircle2 className="size-4 text-primary" />Strengths</h3><ul className="list-disc space-y-1 pl-5 text-sm">{report.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div className="rounded-3xl border bg-card p-5"><h3 className="mb-2 flex items-center gap-2 font-bold"><AlertTriangle className="size-4 text-destructive" />To improve</h3><ul className="list-disc space-y-1 pl-5 text-sm">{report.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>
      </div>
      <div className="space-y-3">
        {report.perQuestion.map((p, i) => (
          <details key={i} className="rounded-2xl border bg-card p-4">
            <summary className="flex cursor-pointer items-start justify-between gap-3 font-semibold"><span>{i + 1}. {p.question}</span><span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">{p.score}/10</span></summary>
            <p className="mt-3 text-sm"><span className="font-semibold">Your answer: </span>{history[i]?.answer || <em className="text-muted-foreground">No answer</em>}</p>
            <p className="mt-2 text-sm text-muted-foreground">{p.comment}</p>
            <p className="mt-2 rounded-xl bg-secondary p-3 text-sm"><span className="font-semibold">Model answer: </span>{p.idealAnswer}</p>
          </details>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="hero" className="rounded-full" onClick={start}><RotateCcw /> Retake interview</Button>
        <Button variant="outline" className="rounded-full" onClick={() => setStage("setup")}>New topic</Button>
      </div>
    </div>
  );

  const qNum = Math.min(history.length + 1, total);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="overflow-hidden rounded-3xl bg-ink shadow-soft">
        <div className="relative grid aspect-video place-items-center overflow-hidden bg-hero">
          <div className="absolute inset-0 bg-ink/70" />
          <div className="relative flex flex-col items-center">
            <div className={`rounded-full p-1.5 transition ${speaking ? "bg-accent shadow-[0_0_0_10px_color-mix(in_oklch,var(--accent)_25%,transparent)]" : "bg-sidebar-accent"}`}>
              <img src={who.img} alt={`${who.name}, your interviewer`} width={816} height={816} className={`size-40 rounded-full object-cover md:size-56 ${speaking ? "animate-float" : ""}`} />
            </div>
            <div className="mt-3 flex h-5 items-end gap-1">
              {speaking ? [0, 1, 2, 3, 4].map((k) => <span key={k} className="w-1.5 animate-talk rounded bg-accent" style={{ animationDelay: `${k * 0.1}s` }} />) : busy ? <span className="text-xs text-ink-foreground/70">{who.name} is thinking…</span> : null}
            </div>
            <p className="mt-1 font-semibold text-ink-foreground">{who.name} · {who.title}</p>
          </div>
          <div className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs text-ink-foreground">{round === "hr" ? "HR" : "Technical"} · {topic} · Q{qNum}/{total}</div>
          <button onClick={() => { setVoiceOn(!voiceOn); window.speechSynthesis?.cancel(); }} aria-label="Toggle voice" className="absolute right-4 top-4 rounded-full bg-ink/70 p-2 text-ink-foreground">{voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</button>
        </div>
        {current && (
          <div className="space-y-1 px-5 py-4 text-ink-foreground">
            {current.reaction && <p className="text-sm text-sidebar-foreground/70">{current.reaction}</p>}
            <p className="text-lg font-medium">{current.question}</p>
            <button onClick={() => speak(`${current.reaction} ${current.question}`)} className="text-xs text-accent underline">Repeat question</button>
          </div>
        )}
      </div>
      <div className="space-y-3 rounded-3xl border bg-card p-5 shadow-soft">
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={srSupported ? "Tap the mic and speak, or type your answer…" : "Type your answer…"} rows={5} maxLength={5000} disabled={busy} />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={listening ? "destructive" : "outline"} className="rounded-full" onClick={toggleMic} disabled={busy}>{listening ? <><MicOff /> Stop</> : <><Mic /> Speak answer</>}</Button>
          <Button type="button" variant="hero" className="rounded-full" onClick={submit} disabled={busy || !current}><Send /> {history.length + 1 >= total ? "Submit & finish" : "Submit answer"}</Button>
          <Button type="button" variant="ghost" className="ml-auto rounded-full" onClick={() => finish(history)} disabled={busy}><PhoneOff /> End interview</Button>
        </div>
        {listening && <p className="text-xs text-primary">● Listening…</p>}
      </div>
    </div>
  );
}
