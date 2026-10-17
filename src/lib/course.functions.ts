import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CourseContent, QuizQ } from "./course-types";
import { pickProblems, problemCatalogText } from "./leetcode";

function cleanQuiz(qs: unknown, max = 50): QuizQ[] {
  if (!Array.isArray(qs)) return [];
  const seen = new Set<string>();
  const out: QuizQ[] = [];
  for (const q of qs as Record<string, unknown>[]) {
    const question = String(q?.['question'] ?? "").trim();
    const options = Array.isArray(q?.['options']) ? (q['options'] as unknown[]).map((o) => String(o).trim()) : [];
    const answer = Number(q?.['answer']);
    if (!question || options.length !== 4 || new Set(options).size !== 4 || !Number.isInteger(answer) || answer < 0 || answer > 3) continue;
    if (seen.has(question.toLowerCase())) continue;
    seen.add(question.toLowerCase());
    const correct = options[answer]!;
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    out.push({ question, options: shuffled, answer: shuffled.indexOf(correct), explanation: String(q?.['explanation'] ?? "") });
    if (out.length >= max) break;
  }
  return out;
}

const INSTRUCTIONS = `You are Pathway-SI, an expert course designer. Return ONLY a JSON object (no markdown fences) with this exact shape:
{"title":string,"description":string,
 "modules":[{"title":string,"lessons":[{"title":string,"summary":string,
   "scenes":[{"heading":string,"narration":string,"bullets":[string],"emoji":string}],
   "quiz":[{"question":string,"options":[string,string,string,string],"answer":number,"explanation":string}]}]}],
 "leetcode":[string,string,string]}
Rules: exactly 3 modules, 2 lessons each. Each lesson: 4 scenes (narration 2-3 spoken sentences, 2-3 short bullets, one emoji) and 3 quiz questions; "answer" is the 0-based index of the correct option.
Quiz questions must be factually accurate, test understanding of that lesson (not trivia), have exactly one correct option and plausible distractors; never use "all/none of the above".
"leetcode" lists 3 slugs from the LeetCode problem bank below — one Easy, one Medium, one Hard — whose skills best fit this course:
${problemCatalogText()}`;

export const generateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ topic: z.string().trim().min(2).max(200), level: z.enum(["beginner", "intermediate", "advanced"]), goal: z.string().max(300).optional(), outline: z.array(z.string().max(120)).max(3).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { generateText, AiError } = await import("./ai.server");
    let raw: string;
    try {
      raw = await generateText(INSTRUCTIONS, `Topic: ${data.topic}\nLevel: ${data.level}\nLearner goal: ${data.goal || "general mastery"}${data.outline?.length ? `\nUse these module titles in order: ${data.outline.join(" | ")}` : ""}`);
    } catch (e) {
      if (e instanceof AiError) return { error: e.message };
      throw e;
    }
    let content: CourseContent;
    try {
      const s = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      content = JSON.parse(raw.slice(s, end + 1));
      if (!content.modules?.length) throw new Error("bad");
      for (const m of content.modules) for (const l of m.lessons) l.quiz = cleanQuiz(l.quiz, 5);
      content.assignments = pickProblems((content as unknown as { leetcode?: unknown }).leetcode);
      delete (content as unknown as { leetcode?: unknown }).leetcode;
      content.assessment = content.assignments[0]!;
    } catch {
      return { error: "The AI returned an incomplete course. Please try again." };
    }
    const { data: row, error } = await context.supabase
      .from("courses")
      .insert({ user_id: context.userId, topic: data.topic, level: data.level, title: content.title, content: content as never })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { id: row.id as string };
  });

const QUIZ_INSTRUCTIONS = `You are an expert examiner. Create a high-quality multiple-choice quiz on the given topic, whatever the subject. Return ONLY JSON (no fences): {"title":string,"questions":[{"question":string,"options":[string,string,string,string],"answer":number,"explanation":string}]}.
Rules: produce exactly the requested number of questions; every question is specifically about the topic and factually accurate (only well-established facts — if unsure, ask about something else); cover different sub-areas of the topic; match the requested difficulty (easy = core definitions, medium = application/understanding, hard = analysis, edge cases, multi-step reasoning); exactly ONE option is correct and the other three are plausible but clearly wrong; options are similar in length and style; never use "all of the above" / "none of the above"; no duplicated questions; "answer" is the 0-based index of the correct option; explanation is 1-2 sentences saying why the answer is right. The title is a short, specific quiz name.`;

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ topic: z.string().trim().min(2).max(300), count: z.number().int().min(3).max(20), difficulty: z.enum(["easy", "medium", "hard"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateText, AiError } = await import("./ai.server");
    try {
      const raw = await generateText(QUIZ_INSTRUCTIONS, `Topic: ${data.topic}\nNumber of questions: ${data.count}\nDifficulty: ${data.difficulty}`);
      const q = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      const questions = cleanQuiz(q.questions, data.count);
      if (questions.length < Math.min(3, data.count)) return { error: "The AI returned an incomplete quiz. Please try again." };
      return { title: String(q.title ?? data.topic), questions };
    } catch (e) {
      if (e instanceof AiError) return { error: e.message };
      return { error: "The AI returned an invalid quiz. Please try again." };
    }
  });

const REVIEW_INSTRUCTIONS = `You are a strict code reviewer for a LeetCode-style judge. You receive a problem, the learner's solution (in any programming language), and sandbox test results. Decide if the solution is correct for ALL valid inputs (not just the given tests) and whether the outputs match what is expected. Return ONLY JSON: {"verdict":"Correct"|"Partially correct"|"Incorrect","score":number,"feedback":string,"hints":[string],"complexity":string}. score is 0-100. feedback is 2-4 sentences. hints: up to 3, never reveal the full solution.`;

export const reviewCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ problem: z.string().max(4000), code: z.string().max(12000), results: z.string().max(6000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateText, AiError } = await import("./ai.server");
    try {
      const raw = await generateText(REVIEW_INSTRUCTIONS, `PROBLEM:\n${data.problem}\n\nSOLUTION:\n${data.code}\n\nSANDBOX RESULTS:\n${data.results}`);
      const r = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      return {
        verdict: String(r.verdict ?? "Incorrect"),
        score: Math.max(0, Math.min(100, Number(r.score) || 0)),
        feedback: String(r.feedback ?? ""),
        hints: Array.isArray(r.hints) ? r.hints.slice(0, 3).map(String) : [],
        complexity: String(r.complexity ?? ""),
      };
    } catch (e) {
      if (e instanceof AiError) return { error: e.message };
      return { error: "The AI review failed. Please try again." };
    }
  });

const JUDGE_INSTRUCTIONS = `You are a precise code-execution judge, like LeetCode's. You receive a programming language, the learner's code (LeetCode-style class/function), the function name, and a list of test inputs (each an array of arguments in JSON). Mentally compile and execute the code EXACTLY as written for each input — do not fix bugs, do not assume intent. If the code would not compile, every result is a compile error. Return ONLY JSON: {"results":[{"output":<JSON value or null>,"error":string|null}]} with one entry per input, in order. Output must be the JSON form of the returned value (arrays as JSON arrays, booleans as true/false). error is a short message like "Compile Error: ..." or "Runtime Error: ..." or null.`;

export const judgeCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ language: z.string().max(30), fn: z.string().max(80), code: z.string().max(12000), inputs: z.string().max(8000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateText, AiError } = await import("./ai.server");
    try {
      const raw = await generateText(JUDGE_INSTRUCTIONS, `LANGUAGE: ${data.language}\nFUNCTION: ${data.fn}\nCODE:\n${data.code}\n\nINPUTS:\n${data.inputs}`);
      const r = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      const results = Array.isArray(r.results) ? r.results : [];
      return { results: JSON.stringify(results.map((x: { output?: unknown; error?: unknown }) => (x?.error ? { error: String(x.error) } : { got: x?.output ?? null }))) };
    } catch (e) {
      if (e instanceof AiError) return { error: e.message };
      return { error: "The judge could not evaluate this code. Please try again." };
    }
  });
