"""Problem factory. Each problem = statement + reference solution + test generator.
Expected outputs are COMPUTED by running the reference, never typed by hand.
If a brute-force solution is provided, it must agree with the reference on every non-big test or the build fails.
Used by build.py   ->  writes ../problems/<slug>.json
"""
import json, os, random, copy, re, sys
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "problems")
REG = []
XP = {"EASY": 30, "MEDIUM": 60, "HARD": 100}

def P(slug, title, diff, topics, st, cons, sig, ref, gen, samples, edges=(), brute=None, checker="EXACT", hasbig=False, n=12, hint=None):
    REG.append(dict(slug=slug, title=title, diff=diff, topics=topics, st=st, cons=cons, sig=sig, ref=ref, gen=gen,
                    samples=samples, edges=list(edges), brute=brute, checker=checker, hasbig=hasbig, n=n, hint=hint))

def fn(src, name):
    ns = {}; exec(src, ns); return ns[name]

def norm(x, checker):
    if checker == "UNORDERED_DEEP": return sorted(sorted(i) for i in x)
    if checker == "UNORDERED": return sorted(x)
    return x

def jv(v): return json.dumps(v, separators=(",", ":"))

def build():
    os.makedirs(OUT, exist_ok=True)
    seen_slugs = set(); stats = []
    for p in REG:
        assert p["slug"] not in seen_slugs, p["slug"]; seen_slugs.add(p["slug"])
        name, params = re.match(r"(\w+)\((.*)\)", p["sig"]).groups(); params = [x.strip() for x in params.split(",")]
        ref = fn(p["ref"], name); brute = fn(p["brute"], name) if p["brute"] else None
        rng = random.Random(p["slug"])
        cases = [(a, True) for a in p["samples"]] + [(a, False) for a in p["edges"]]
        keys = {jv(a) for a, _ in cases}; tries = 0
        while len(cases) < len(p["samples"]) + len(p["edges"]) + p["n"] and tries < 400:
            tries += 1; a = p["gen"](rng, False); k = jv(a)
            if k not in keys: keys.add(k); cases.append((a, False))
        if p["hasbig"]: cases.append((p["gen"](rng, True), False))
        tests = []
        for idx, (a, s) in enumerate(cases):
            big = p["hasbig"] and idx == len(cases) - 1
            exp = ref(*copy.deepcopy(a)); exp = json.loads(jv(exp))
            if brute and not big:
                b = json.loads(jv(brute(*copy.deepcopy(a))))
                assert norm(b, p["checker"]) == norm(exp, p["checker"]), f'{p["slug"]}: ref != brute on {jv(a)}: {exp} vs {b}'
            tests.append({"input": json.loads(jv(a)), "expected": exp, "isSample": s})
        ex = []
        for i, t in enumerate([t for t in tests if t["isSample"]][:2], 1):
            ex.append(f"Example {i}:\nInput: " + ", ".join(f"{k} = {jv(v)}" for k, v in zip(params, t["input"])) + f"\nOutput: {jv(t['expected'])}")
        py = f"def {name}({', '.join(params)}):\n    # Write your solution here\n    pass\n"
        js = f"function {name}({', '.join(params)}) {{\n  // Write your solution here\n}}\n"
        doc = {"slug": p["slug"], "title": p["title"], "difficulty": p["diff"], "topics": p["topics"], "companies": [],
               "functionName": name, "checker": p["checker"], "xp": XP[p["diff"]], "hint": p["hint"],
               "statement": p["st"] + "\n\n" + "\n\n".join(ex), "constraints": p["cons"],
               "starterCode": {"python": py, "javascript": js}, "referenceSolution": {"python": p["ref"]}, "tests": tests}
        if not doc["hint"]: del doc["hint"]
        with open(os.path.join(OUT, p["slug"] + ".json"), "w") as f: json.dump(doc, f, indent=1)
        stats.append((p["slug"], p["diff"], len(tests), "brute-checked" if brute else "ref-only"))
    for s in stats: print(f"{s[0]:42} {s[1]:7} {s[2]:3} tests  {s[3]}")
    print(f"\n{len(stats)} problems built, {sum(s[2] for s in stats)} tests, "
          f"{sum(1 for s in stats if s[3]=='brute-checked')} cross-verified against brute force")

rl = lambda r, n, a, b: [r.randint(a, b) for _ in range(n)]
S = lambda r, n, al: "".join(r.choice(al) for _ in range(n))
