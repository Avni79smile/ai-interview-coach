<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Course content (modules, lessons, scenes, quizzes, assessment) is AI-generated JSON stored in `courses.content`; per-user progress lives in `courses.progress` jsonb — keeps the schema simple.
- AI course generation runs in an auth-protected server function (`src/lib/course.functions.ts`) using the server-only gateway helper in `src/lib/ai.server.ts`.
- Lesson "videos" are code-animated scenes with browser speech narration (no generated video files) — instant and free per lesson.
- Coding assignments are real LeetCode problems from a fixed bank (`src/lib/leetcode.ts`, AI only picks slugs). JS/Python run locally in Web Workers (`src/lib/runner.ts`, Python via Pyodide CDN); other languages are evaluated by an AI judge server fn whose outputs are graded client-side against stored expected values — no server-side code execution available on the edge runtime.
- Home catalog is a static curated list (`src/lib/catalog.ts`); enrolling generates a per-user course from its outline so progress stays in `courses`.
- Signed-in pages live under `src/routes/_authenticated/` with a client-side session gate.
- AI Interview (`src/routes/_authenticated/interview.tsx`) is stateless: transcript lives in page state and is sent to server fns in `src/lib/interview.functions.ts` each turn; avatar voice uses browser speech synthesis/recognition — no extra storage or paid voice APIs.
