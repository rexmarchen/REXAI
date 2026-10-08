"use client";
import { useState } from "react";

const ROLES = [["frontend-developer", "Frontend Developer"], ["backend-developer", "Backend Developer"], ["data-analyst", "Data Analyst"],
  ["ml-intern", "ML / AI Intern"], ["digital-marketing", "Digital Marketing"], ["ui-ux-designer", "UI/UX Designer"]];

type Result = {
  role: string; sampleSize: number; insufficientData?: boolean; readiness?: number; reachableListings?: number;
  matched?: { skill: string; demand: number }[]; extra?: string[];
  gaps?: { skill: string; demand: number; priority: "core" | "bonus"; resources: { title: string; url: string; free: boolean }[] }[];
};

export default function SkillGap() {
  const [role, setRole] = useState(ROLES[0][0]);
  const [input, setInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const add = () => { const v = input.trim(); if (v && !skills.includes(v) && skills.length < 40) setSkills([...skills, v]); setInput(""); };
  async function analyse() {
    setLoading(true); setError(false);
    try {
      const r = await fetch("/api/skill-gap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, skills }) });
      if (!r.ok) throw new Error(); setRes(await r.json());
    } catch { setError(true); } finally { setLoading(false); }
  }
  const field = "rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 focus:border-zinc-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="space-y-1 text-sm text-zinc-300">Target role
          <select className={`${field} w-full`} value={role} onChange={(e) => { setRole(e.target.value); setRes(null); }}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
      </div>
      <div className="space-y-2">
        <label htmlFor="skill" className="text-sm text-zinc-300">Skills you already have</label>
        <div className="flex gap-2">
          <input id="skill" className={`${field} flex-1`} value={input} placeholder="Type a skill and press Enter, e.g. React, SQL, Figma" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
          <button onClick={add} className="rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200">Add</button>
        </div>
        <ul className="flex flex-wrap gap-2">{skills.map((s) => <li key={s}><button onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300">{s} ×</button></li>)}</ul>
      </div>
      <button disabled={loading} onClick={analyse} className="rounded-lg bg-zinc-200 px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40">{loading ? "Analysing…" : "Analyse my skill gap"}</button>
      {error && <p className="text-sm text-red-300">Couldn't run the analysis. Try again.</p>}

      {res?.insufficientData && <p className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-400">Only {res.sampleSize} live listings match {res.role} right now, which isn't enough for a reliable result. Check back after the next refresh.</p>}
      {res && !res.insufficientData && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 p-5">
            <p className="text-sm text-zinc-400">Readiness for {res.role}</p>
            <p className="mt-1 text-4xl font-semibold text-zinc-100">{res.readiness}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900"><div className="h-full rounded-full bg-zinc-200" style={{ width: `${res.readiness}%` }} /></div>
            <p className="mt-3 text-xs text-zinc-500">Based on {res.sampleSize} live internships. You already match the skills of {res.reachableListings} of them.</p>
          </div>
          <section><h3 className="mb-2 text-sm font-medium text-zinc-300">What to learn next</h3>
            <ul className="space-y-3">{res.gaps?.map((g) => (
              <li key={g.skill} className="rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center justify-between"><span className="font-medium text-zinc-100">{g.skill}</span>
                  <span className="text-xs text-zinc-400">Asked in {g.demand}% of listings{g.priority === "core" ? " (core)" : ""}</span></div>
                {g.resources.length > 0 ? <ul className="mt-2 space-y-1 text-sm">{g.resources.map((r) => <li key={r.url}><a className="text-sky-300 hover:underline" href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>{r.free && <span className="ml-2 text-xs text-zinc-500">Free</span>}</li>)}</ul>
                  : <p className="mt-2 text-xs text-zinc-500">No resource added for this skill yet.</p>}
              </li>))}</ul>
          </section>
          {res.matched && res.matched.length > 0 && <section><h3 className="mb-2 text-sm font-medium text-zinc-300">Skills that already count</h3>
            <ul className="flex flex-wrap gap-2">{res.matched.map((m) => <li key={m.skill} className="rounded-full border border-emerald-500/30 px-3 py-1 text-sm text-emerald-300">{m.skill} · {m.demand}%</li>)}</ul></section>}
        </div>
      )}
    </div>
  );
}
