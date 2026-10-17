import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InterviewRound = "hr" | "technical";
export type InterviewTurn = { question: string; answer: string };
export type InterviewReport = {
  score: number;
  verdict: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  perQuestion: { question: string; score: number; comment: string; idealAnswer: string }[];
};

const turnSchema = z.object({ question: z.string().max(1500), answer: z.string().max(5000) });
const baseSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  round: z.enum(["hr", "technical"]),
  level: z.enum(["fresher", "mid", "senior"]),
  total: z.number().int().min(3).max(12),
  history: z.array(turnSchema).max(12),
});

function persona(round: InterviewRound, topic: string, level: string) {
  return round === "hr"
    ? `You are Maya, a warm but sharp HR interviewer at a top tech company, interviewing a ${level} candidate for a ${topic} role. Ask the HR/behavioural questions that most commonly come up in real interviews (tell me about yourself, why this role/company, strengths and weaknesses, conflict, failure, teamwork, pressure, leadership, career goals, salary expectations, questions for us), adapted to the ${topic} role.`
    : `You are Arjun, a senior engineer conducting a real technical interview for a ${level} candidate on ${topic}. Ask the technical questions that most commonly come up in real ${topic} interviews at ${level} level — core concepts, how things work internally, practical scenarios, trade-offs, debugging, and short design or coding-reasoning questions (answerable verbally, no long code).`;
}

const parse = (raw: string) => JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));

export const nextInterviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => baseSchema.parse(d))
  .handler(async ({ data }) => {
    const { generateText, AiError } = await import("./ai.server");
    const n = data.history.length + 1;
    const instructions = `${persona(data.round, data.topic, data.level)}
Speak naturally like a real person on a video call: short, conversational, one question at a time. Never number questions. Never repeat a question already asked.
If there is a previous answer, start with a brief 1-sentence natural reaction to it (acknowledge, or ask a quick follow-up if the answer was vague/wrong — follow-ups count as the next question). For question 1, greet the candidate briefly and introduce yourself first.
Return ONLY JSON: {"reaction":string,"question":string}. "reaction" may be "" for the first question. Keep "question" under 60 words.`;
    const transcript = data.history.map((t, i) => `Q${i + 1}: ${t.question}\nCandidate: ${t.answer || "(no answer)"}`).join("\n\n");
    try {
      const raw = await generateText(instructions, `This is question ${n} of ${data.total}.${n === data.total ? " It is the final question." : ""}\n\nTranscript so far:\n${transcript || "(interview just started)"}`);
      const r = parse(raw);
      const question = String(r.question ?? "").trim();
      if (!question) return { error: "The interviewer lost their train of thought. Please try again." };
      return { reaction: String(r.reaction ?? "").trim(), question };
    } catch (e) {
      if (e instanceof AiError) return { error: e.message };
      return { error: "The interviewer could not respond. Please try again." };
    }
  });

export const evaluateInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => baseSchema.extend({ history: z.array(turnSchema).min(1).max(12) }).parse(d))
  .handler(async ({ data }) => {
    const { generateText, AiError } = await import("./ai.server");
    const instructions = `You are an expert ${data.round === "hr" ? "HR" : "technical"} interview coach evaluating a ${data.level} candidate's ${data.topic} interview. Be honest, specific and encouraging. Return ONLY JSON:
{"score":number,"verdict":"Strong hire"|"Hire"|"Borderline"|"Needs practice","summary":string,"strengths":[string],"improvements":[string],"perQuestion":[{"question":string,"score":number,"comment":string,"idealAnswer":string}]}
score is 0-100 overall; per-question score 0-10. summary 2-3 sentences. 2-4 strengths and 2-4 improvements. comment 1-2 sentences. idealAnswer is a concise model answer (2-4 sentences). Empty or "(no answer)" answers score 0.`;
    const transcript = data.history.map((t, i) => `Q${i + 1}: ${t.question}\nCandidate: ${t.answer || "(no answer)"}`).join("\n\n");
    try {
      const r = parse(await generateText(instructions, transcript));
      const report: InterviewReport = {
        score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
        verdict: String(r.verdict ?? "Needs practice"),
        summary: String(r.summary ?? ""),
        strengths: Array.isArray(r.strengths) ? r.strengths.slice(0, 4).map(String) : [],
        improvements: Array.isArray(r.improvements) ? r.improvements.slice(0, 4).map(String) : [],
        perQuestion: (Array.isArray(r.perQuestion) ? r.perQuestion : []).slice(0, 12).map((p: Record<string, unknown>, i: number) => ({
          question: String(p['question'] ?? data.history[i]?.question ?? ""),
          score: Math.max(0, Math.min(10, Math.round(Number(p['score']) || 0))),
          comment: String(p['comment'] ?? ""),
          idealAnswer: String(p['idealAnswer'] ?? ""),
        })),
      };
      return { report };
    } catch (e) {
      if (e instanceof AiError) return { error: e.message };
      return { error: "Could not score the interview. Please try again." };
    }
  });
