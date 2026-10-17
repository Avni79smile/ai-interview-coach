import type { TestCase } from "./course-types";
import type { Compare } from "./leetcode";

export type TestResult = { pass: boolean; input: unknown[]; expected: unknown; got?: unknown; error?: string };

export function matches(got: unknown, expected: unknown, mode: Compare = "exact"): boolean {
  if (mode === "float" && typeof got === "number" && typeof expected === "number") return Math.abs(got - expected) < 1e-5;
  if (mode === "sorted" && Array.isArray(got) && Array.isArray(expected)) {
    const s = (a: unknown[]) => JSON.stringify([...a].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y))));
    return s(got) === s(expected);
  }
  return JSON.stringify(got) === JSON.stringify(expected);
}

export function grade(tests: TestCase[], outs: { got?: unknown; error?: string }[], mode?: Compare): TestResult[] {
  return tests.map((t, i) => {
    const o = outs[i] ?? { error: "No output" };
    if (o.error) return { pass: false, input: t.input, expected: t.expected, error: o.error };
    return { pass: matches(o.got, t.expected, mode), input: t.input, expected: t.expected, got: o.got };
  });
}

const JS_WORKER = `
self.onmessage = (e) => {
  const { code, fn, inputs } = e.data;
  let f;
  try { f = new Function(code + "\\n;return typeof " + fn + " === 'function' ? " + fn + " : undefined;")(); }
  catch (err) { self.postMessage(inputs.map(() => ({ error: String(err) }))); return; }
  if (!f) { self.postMessage(inputs.map(() => ({ error: "Function " + fn + " not found" }))); return; }
  self.postMessage(inputs.map((inp) => {
    try { const got = f(...inp); return { got: got === undefined ? null : JSON.parse(JSON.stringify(got)) }; }
    catch (err) { return { error: String(err) }; }
  }));
};`;

const PY_WORKER = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
const ready = loadPyodide();
self.onmessage = async (e) => {
  const { code, fn, inputs } = e.data;
  const py = await ready;
  py.globals.set("__inputs_json", JSON.stringify(inputs));
  py.globals.set("__user_code", code);
  py.globals.set("__fn_name", fn);
  try {
    const out = await py.runPythonAsync(\`
import json
from typing import *
__ns = {}
exec("from typing import *\\\\nimport math, collections, heapq, bisect, itertools\\\\nfrom collections import *\\\\n" + __user_code, __ns)
if "Solution" in __ns:
    __f = getattr(__ns["Solution"](), __fn_name)
elif __fn_name in __ns:
    __f = __ns[__fn_name]
else:
    raise NameError("Define class Solution with method " + __fn_name)
__res = []
for __a in json.loads(__inputs_json):
    try:
        __res.append({"got": __f(*__a)})
    except Exception as __ex:
        __res.append({"error": type(__ex).__name__ + ": " + str(__ex)})
json.dumps(__res)
\`);
    self.postMessage(JSON.parse(out));
  } catch (err) {
    const msg = String(err && err.message || err).trim().split("\\n").slice(-1)[0];
    self.postMessage(inputs.map(() => ({ error: msg })));
  }
};`;

let pyWorker: Worker | null = null;
let pyLoaded = false;

function runInWorker(src: string, payload: unknown, ms: number, keep?: { get: () => Worker | null; set: (w: Worker | null) => void }) {
  return new Promise<{ got?: unknown; error?: string }[] | "timeout">((resolve) => {
    let w = keep?.get() ?? null;
    if (!w) {
      w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
      keep?.set(w);
    }
    const worker = w;
    const timer = setTimeout(() => { worker.terminate(); keep?.set(null); resolve("timeout"); }, ms);
    worker.onmessage = (e) => { clearTimeout(timer); if (!keep) worker.terminate(); resolve(e.data); };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); keep?.set(null); resolve((payload as { inputs: unknown[] }).inputs.map(() => ({ error: e.message || "Worker error" }))); };
    worker.postMessage(payload);
  });
}

/** Runs JavaScript or Python locally in a sandboxed Web Worker. */
export async function runLocal(lang: "javascript" | "python", code: string, fn: string, tests: TestCase[], mode?: Compare): Promise<TestResult[]> {
  const inputs = JSON.parse(JSON.stringify(tests.map((t) => t.input)));
  const isPy = lang === "python";
  const limit = isPy && !pyLoaded ? 45000 : isPy ? 6000 : 3000;
  const out = await runInWorker(isPy ? PY_WORKER : JS_WORKER, { code, fn, inputs }, limit,
    isPy ? { get: () => pyWorker, set: (w) => { pyWorker = w; if (!w) pyLoaded = false; } } : undefined);
  if (out === "timeout") return tests.map((t) => ({ pass: false, input: t.input, expected: t.expected, error: `Time Limit Exceeded (${limit / 1000}s)` }));
  if (isPy) pyLoaded = true;
  return grade(tests, out, mode);
}

/** Back-compat helper for JS-only callers. */
export function runTests(code: string, fn: string, tests: TestCase[]) {
  return runLocal("javascript", code, fn, tests);
}
