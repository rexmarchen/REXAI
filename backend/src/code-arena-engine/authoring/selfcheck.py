"""Re-verifies the SAVED json files exactly the way the judge does: harness program, JSON on stdin, JSON on stdout."""
import json, glob, subprocess, sys, time
def norm(x, c): return sorted(sorted(i) for i in x) if c == "UNORDERED_DEEP" else sorted(x) if c == "UNORDERED" else x
bad = 0; total = 0; slow = []
for f in sorted(glob.glob(__file__.rsplit("/", 2)[0] + "/problems/*.json")):
    p = json.load(open(f)); code = p["referenceSolution"]["python"]
    prog = f"{code}\n\nimport sys, json\n_args = json.loads(sys.stdin.read())\nprint(json.dumps({p['functionName']}(*_args)))\n"
    assert any(t["isSample"] for t in p["tests"]) and len(p["tests"]) >= 5, p["slug"]
    for t in p["tests"]:
        total += 1; t0 = time.time()
        r = subprocess.run([sys.executable, "-c", prog], input=json.dumps(t["input"]), capture_output=True, text=True, timeout=20)
        dt = time.time() - t0
        if dt > 1.5: slow.append((p["slug"], round(dt, 2)))
        ok = r.returncode == 0 and norm(json.loads(r.stdout), p["checker"]) == norm(t["expected"], p["checker"])
        if not ok: bad += 1; print("FAIL", p["slug"], r.stderr[:200])
print(f"{total} tests re-run through the harness, {bad} failures"); print("slow (>1.5s):", slow or "none")
