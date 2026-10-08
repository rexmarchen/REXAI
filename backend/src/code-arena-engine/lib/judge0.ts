// Runs student code inside Judge0 (sandboxed). NEVER exec() user code on your own server.
// Self-host: https://github.com/judge0/judge0 (docker compose). Check GET /languages for the ids on your version.
const URL_ = process.env.JUDGE0_URL!;                         // e.g. http://judge0:2358
const LANG: Record<string, number> = { python: Number(process.env.JUDGE0_PYTHON_ID ?? 71), javascript: Number(process.env.JUDGE0_JS_ID ?? 63) };
export const LANGUAGES = Object.keys(LANG);

// The harness turns "def twoSum(nums, target)" into a program: JSON args on stdin, JSON result on stdout.
const HARNESS: Record<string, (code: string, fn: string) => string> = {
  python: (code, fn) => `${code}\n\nimport sys, json\n_args = json.loads(sys.stdin.read())\nprint(json.dumps(${fn}(*_args)))\n`,
  javascript: (code, fn) => `${code}\n\nconst _args = JSON.parse(require("fs").readFileSync(0, "utf8"));\nconsole.log(JSON.stringify(${fn}(..._args)));\n`,
};

const b64 = (s: string) => Buffer.from(s).toString("base64");
const unb64 = (s?: string | null) => (s ? Buffer.from(s, "base64").toString() : "");

export type RunResult = { status: "ok" | "tle" | "runtime" | "compile"; stdout: string; stderr: string; timeMs: number };

export async function runOne(language: string, code: string, fn: string, args: unknown, limits: { sec: number; kb: number }): Promise<RunResult> {
  const res = await fetch(`${URL_}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.JUDGE0_TOKEN && { "X-Auth-Token": process.env.JUDGE0_TOKEN }) },
    body: JSON.stringify({
      language_id: LANG[language], source_code: b64(HARNESS[language](code, fn)), stdin: b64(JSON.stringify(args)),
      cpu_time_limit: limits.sec, memory_limit: limits.kb, enable_network: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Judge0 ${res.status}`);
  const r = await res.json();
  const id = r.status?.id as number;                          // 3 ok, 5 TLE, 6 compile error, 7-12 runtime errors
  return {
    status: id === 3 || id === 4 ? "ok" : id === 5 ? "tle" : id === 6 ? "compile" : "runtime",
    stdout: unb64(r.stdout).trim(), stderr: unb64(r.stderr) || unb64(r.compile_output), timeMs: Math.round(Number(r.time ?? 0) * 1000),
  };
}

const numSort = (a: any, b: any) => (typeof a === "number" && typeof b === "number" ? a - b : String(a) < String(b) ? -1 : 1);
const canon = (x: unknown, mode: string): unknown => {
  if (!Array.isArray(x)) return x;
  if (mode === "UNORDERED") return [...x].sort(numSort);
  if (mode === "UNORDERED_DEEP")
    return x.map((i) => (Array.isArray(i) ? [...i].sort(numSort) : i)).sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
  return x;
};
export type CheckerMode = "EXACT" | "UNORDERED" | "UNORDERED_DEEP";
export function matches(actualJson: string, expected: unknown, checker: CheckerMode): boolean {
  let actual: unknown; try { actual = JSON.parse(actualJson); } catch { return false; }
  return JSON.stringify(canon(actual, checker)) === JSON.stringify(canon(expected, checker));
}

// Small concurrency pool so one submission can't flood the judge
export async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}
