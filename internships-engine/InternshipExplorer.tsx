"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import InternshipCard, { Internship } from "./InternshipCard";

const DOMAINS = [["WEB_DEV", "Web dev"], ["DATA", "Data"], ["MARKETING", "Marketing"], ["DESIGN", "Design"]];
const MODES = [["REMOTE", "Remote"], ["ONSITE", "On-site"], ["HYBRID", "Hybrid"]];
const LEVELS = [["FRESHER", "Freshers"], ["FIRST_SECOND_YEAR", "1st–2nd year"]];

function Chips({ name, options, params, set }: { name: string; options: string[][]; params: URLSearchParams; set: (k: string, v: string) => void }) {
  const active = (params.get(name) ?? "").split(",").filter(Boolean);
  const toggle = (v: string) => set(name, (active.includes(v) ? active.filter((a) => a !== v) : [...active, v]).join(","));
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, l]) => (
        <button key={v} aria-pressed={active.includes(v)} onClick={() => toggle(v)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${active.includes(v) ? "border-zinc-200 bg-zinc-200 text-black" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>{l}</button>
      ))}
    </div>
  );
}

export default function InternshipExplorer() {
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState<{ items: Internship[]; total: number; pages: number } | null>(null);
  const [error, setError] = useState(false);

  // URL is the single source of truth: filters are shareable and survive refresh.
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params.toString());
    v ? p.set(k, v) : p.delete(k);
    if (k !== "page") p.delete("page");
    router.replace(`?${p.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const ctl = new AbortController();
    setData(null); setError(false);
    fetch(`/api/internships?${params.toString()}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData).catch((e) => e?.name !== "AbortError" && setError(true));
    return () => ctl.abort();
  }, [params]);

  const page = Number(params.get("page") ?? 1);
  const field = "rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 focus:border-zinc-500 focus:outline-none";
  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium text-zinc-300">Domain</legend><Chips name="domain" options={DOMAINS} params={params} set={set} /></fieldset>
        <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium text-zinc-300">Work mode</legend><Chips name="mode" options={MODES} params={params} set={set} /></fieldset>
        <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium text-zinc-300">Who it's for</legend><Chips name="level" options={LEVELS} params={params} set={set} /></fieldset>
        <label className="block space-y-1 text-sm text-zinc-300">Location
          <input className={`${field} w-full`} defaultValue={params.get("location") ?? ""} placeholder="e.g. Bengaluru" onBlur={(e) => set("location", e.target.value.trim())} />
        </label>
        <label className="block space-y-1 text-sm text-zinc-300">Minimum stipend per month
          <select className={`${field} w-full`} value={params.get("minStipend") ?? ""} onChange={(e) => set("minStipend", e.target.value)}>
            <option value="">Any</option>{[5000, 10000, 15000, 25000].map((n) => <option key={n} value={n}>₹{n.toLocaleString("en-IN")}+</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-sm text-zinc-300">Duration
          <select className={`${field} w-full`} value={`${params.get("minWeeks") ?? ""}-${params.get("maxWeeks") ?? ""}`}
            onChange={(e) => { const [a, b] = e.target.value.split("-"); set("minWeeks", a); set("maxWeeks", b); }}>
            <option value="-">Any</option><option value="-8">Up to 2 months</option><option value="9-16">3–4 months</option><option value="17-">5 months or more</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" className="accent-white" checked={params.get("paidOnly") === "true"} onChange={(e) => set("paidOnly", e.target.checked ? "true" : "")} />Paid only</label>
        <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" className="accent-white" checked={params.get("hideRisky") === "true"} onChange={(e) => set("hideRisky", e.target.checked ? "true" : "")} />Hide high-risk listings</label>
      </aside>

      <section aria-live="polite">
        <div className="mb-4 flex items-center justify-between text-sm text-zinc-400">
          <span>{data ? `${data.total.toLocaleString("en-IN")} live internships` : "Loading…"}</span>
          <select aria-label="Sort" className={field} value={params.get("sort") ?? "fresh"} onChange={(e) => set("sort", e.target.value)}>
            <option value="fresh">Recently verified</option><option value="trust">Most trusted</option><option value="stipend">Highest stipend</option>
          </select>
        </div>
        {error && <p className="rounded-xl border border-red-900 p-4 text-sm text-red-300">Couldn't load internships. Check your connection and refresh.</p>}
        {data?.items.length === 0 && <p className="rounded-xl border border-zinc-800 p-6 text-sm text-zinc-400">No internships match these filters. Try removing the stipend or location filter.</p>}
        <div className="space-y-4">{data?.items.map((it) => <InternshipCard key={it.id} it={it} />)}</div>
        {data && data.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-zinc-400">
            <button disabled={page <= 1} onClick={() => set("page", String(page - 1))} className="disabled:opacity-30">Previous</button>
            <span>Page {page} of {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => set("page", String(page + 1))} className="disabled:opacity-30">Next</button>
          </div>
        )}
      </section>
    </div>
  );
}
