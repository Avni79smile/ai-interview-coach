export type Scene = { heading: string; narration: string; bullets: string[]; emoji: string };
export type QuizQ = { question: string; options: string[]; answer: number; explanation: string };
export type Lesson = { title: string; summary: string; scenes: Scene[]; quiz: QuizQ[] };
export type Module = { title: string; lessons: Lesson[] };
export type TestCase = { input: unknown[]; expected: unknown };
export type Assessment = {
  title: string;
  difficulty: string;
  description: string;
  functionName: string;
  starterCode: string;
  examples: string[];
  tests: TestCase[];
  slug?: string;
  signature?: import("./leetcode").Signature;
  compare?: import("./leetcode").Compare;
  url?: string;
};
export type CourseContent = { title: string; description: string; modules: Module[]; assessment: Assessment; assignments?: Assessment[] };
export type Progress = {
  lessons?: Record<string, { done?: boolean | undefined; quiz?: number | undefined }>;
  assessment?: { passed?: boolean | undefined; code?: string | undefined };
  assignments?: Record<string, { passed?: boolean | undefined; code?: string | undefined; lang?: string | undefined }>;
};

export function getAssignments(c: CourseContent): Assessment[] {
  return c.assignments?.length ? c.assignments : c.assessment ? [c.assessment] : [];
}

export function assignmentState(c: CourseContent, p: Progress, i: number) {
  const s = p.assignments?.[i];
  if (s) return s;
  if (i === 0 && !c.assignments?.length) return p.assessment ?? {};
  return {};
}

export function lessonKeys(c: CourseContent) {
  return c.modules.flatMap((m, mi) => m.lessons.map((_, li) => `${mi}-${li}`));
}

export function courseStats(content: CourseContent, progress: Progress) {
  const keys = lessonKeys(content);
  const done = keys.filter((k) => progress.lessons?.[k]?.done).length;
  const scores = keys.map((k) => progress.lessons?.[k]?.quiz).filter((x): x is number => typeof x === "number");
  const avgQuiz = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const list = getAssignments(content);
  const solved = list.filter((_, i) => assignmentState(content, progress, i).passed).length;
  const passed = list.length > 0 && solved === list.length;
  const total = keys.length + list.length;
  const pct = total ? Math.round(((done + solved) / total) * 100) : 0;
  return { done, totalLessons: keys.length, avgQuiz, passed, solved, totalAssignments: list.length, pct, complete: done === keys.length && passed };
}
