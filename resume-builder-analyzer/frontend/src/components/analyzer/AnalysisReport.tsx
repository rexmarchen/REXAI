import React, { useState } from 'react';
import type { AnalysisResult, Issue, AIRewrite } from '../../types/resume';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Sparkles,
  Check,
  RotateCcw,
  Tag
} from 'lucide-react';

interface AnalysisReportProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, onReset }) => {
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string>('all');
  const [acceptedRewrites, setAcceptedRewrites] = useState<Record<number, boolean>>({});

  const handleAcceptRewrite = (idx: number, rewrite: AIRewrite) => {
    navigator.clipboard?.writeText(rewrite.rewrite);
    setAcceptedRewrites(prev => ({ ...prev, [idx]: true }));
  };

  const handleRejectRewrite = (idx: number) => {
    setAcceptedRewrites(prev => ({ ...prev, [idx]: false }));
  };

  const highIssues = result.issues.filter(i => i.severity === 'high');
  const medIssues = result.issues.filter(i => i.severity === 'medium');
  const lowIssues = result.issues.filter(i => i.severity === 'low');

  const filteredIssues = activeSeverityFilter === 'high'
    ? highIssues
    : activeSeverityFilter === 'medium'
    ? medIssues
    : activeSeverityFilter === 'low'
    ? lowIssues
    : result.issues;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500 bg-emerald-950/40';
    if (score >= 70) return 'text-blue-400 border-blue-500 bg-blue-950/40';
    if (score >= 50) return 'text-amber-400 border-amber-500 bg-amber-950/40';
    return 'text-red-400 border-red-500 bg-red-950/40';
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Banner with Re-Analyze Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Audit Results & Quality Report</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Document parsed: {result.word_count} words • {result.pages} page(s) • {result.sections_found.length} sections identified
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Upload Another Resume</span>
        </button>
      </div>

      {/* 1. Score Dial & Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Score Dial */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
          <div className={`w-28 h-28 rounded-2xl border-4 flex flex-col items-center justify-center font-black mb-3 ${getScoreColor(result.overall_score)}`}>
            <span className="text-4xl leading-none">{Math.round(result.overall_score)}</span>
            <span className="text-xs font-bold opacity-80 mt-1">GRADE {result.grade}</span>
          </div>
          <span className="text-sm font-bold text-slate-200">
            {result.overall_score >= 85 ? 'Exceptional Candidate Quality' : result.overall_score >= 70 ? 'Competitive ATS Match' : 'Action Required'}
          </span>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic rule score out of 100
          </p>
        </div>

        {/* Category Scores Breakdown */}
        <div className="md:col-span-2 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Weighted Category Diagnostics
          </h3>
          <div className="space-y-3">
            {Object.entries(result.category_scores).map(([category, cs]) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{category}</span>
                    <span className="text-[10px] text-slate-400">({Math.round(cs.weight * 100)}% weight)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      cs.status === 'Excellent' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      cs.status === 'Good' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                      cs.status === 'Needs Improvement' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-red-950 text-red-400 border border-red-800'
                    }`}>
                      {cs.status}
                    </span>
                    <span className="font-bold text-slate-200 w-10 text-right">{cs.score}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getProgressColor(cs.score)}`}
                    style={{ width: `${cs.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Skills Match & Job Description Coverage */}
      {(result.job_match.matched_skills.length > 0 || result.job_match.missing_skills.length > 0) && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-slate-100">Taxonomy Keywords & Job Match</h3>
            </div>
            <div className="text-xs text-slate-300">
              Coverage: <strong className="text-emerald-400">{result.job_match.coverage}%</strong> • Similarity: <strong className="text-blue-400">{result.job_match.similarity}%</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched skills */}
            <div className="bg-slate-900/60 border border-slate-750 p-4 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Found in Resume ({result.job_match.matched_skills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.job_match.matched_skills.map((s, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing skills */}
            <div className="bg-slate-900/60 border border-slate-750 p-4 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Missing / Recommended Skills ({result.job_match.missing_skills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.job_match.missing_skills.length > 0 ? (
                  result.job_match.missing_skills.map((s, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300 font-medium">
                      + {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">All target skills recognized!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Actionable Issue List Grouped by Severity */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Every Deducted Point Explained ({result.issues.length} Issues)</h3>
            <p className="text-xs text-slate-400">Specific findings with concrete fix recommendations and resume evidence.</p>
          </div>

          {/* Severity filter tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveSeverityFilter('all')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${activeSeverityFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({result.issues.length})
            </button>
            <button
              onClick={() => setActiveSeverityFilter('high')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${activeSeverityFilter === 'high' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              High ({highIssues.length})
            </button>
            <button
              onClick={() => setActiveSeverityFilter('medium')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${activeSeverityFilter === 'medium' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Medium ({medIssues.length})
            </button>
            <button
              onClick={() => setActiveSeverityFilter('low')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${activeSeverityFilter === 'low' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Low ({lowIssues.length})
            </button>
          </div>
        </div>

        {/* Issue Cards */}
        <div className="space-y-3.5">
          {filteredIssues.map((issue: Issue, idx: number) => {
            const isHigh = issue.severity === 'high';
            const isMed = issue.severity === 'medium';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isHigh
                    ? 'bg-red-950/20 border-red-800/50'
                    : isMed
                    ? 'bg-amber-950/20 border-amber-800/50'
                    : 'bg-slate-900/60 border-slate-750'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {isHigh ? (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    ) : isMed ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                    <span className="font-bold text-slate-100 text-sm">{issue.message}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{issue.category}</span>
                    <span className="text-xs font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60">
                      -{issue.penalty} pts
                    </span>
                  </div>
                </div>

                {/* Concrete Fix */}
                <div className="mt-2 pl-6 space-y-1.5 text-xs">
                  <div className="text-slate-300">
                    <strong className="text-blue-400">Concrete Fix: </strong>
                    {issue.concrete_fix}
                  </div>
                  {issue.evidence && (
                    <div className="text-slate-400 font-mono text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800 break-words">
                      <strong className="text-slate-400 font-sans">Evidence: </strong>
                      {issue.evidence}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredIssues.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No issues detected in this filter category!
            </div>
          )}
        </div>
      </div>

      {/* 4. Optional AI Rewrites & Suggestions */}
      {result.ai_analysis && (
        <div className="bg-slate-800/90 border border-purple-800/50 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-purple-900/40">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-purple-200">Claude AI Critique & High-Impact Rewrites</h3>
              <p className="text-xs text-purple-300/70">
                Safe AI assistance (PII scrubbed, placeholders used for missing metrics, rule-based score untouched).
              </p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-emerald-900/40 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Key Strengths</h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {result.ai_analysis.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-900/70 border border-amber-900/40 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Strategic Weaknesses</h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {result.ai_analysis.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Up to 5 Bullet Rewrites */}
          {result.ai_analysis.rewrites.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                AI Bullet Point Rewrites (Accept / Reject)
              </h4>
              <div className="space-y-3">
                {result.ai_analysis.rewrites.map((rw, idx) => {
                  const accepted = acceptedRewrites[idx];
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900/80 border border-purple-900/30 p-4 rounded-xl space-y-2 text-xs"
                    >
                      <div className="text-slate-400">
                        <strong className="text-slate-500 uppercase text-[10px]">Original: </strong>
                        <span className="line-through">{rw.original}</span>
                      </div>
                      <div className="text-emerald-300 font-medium bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40">
                        <strong className="text-emerald-400 uppercase text-[10px] block mb-0.5">High-Impact Rewrite:</strong>
                        {rw.rewrite}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400 italic">Why: {rw.reason}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptRewrite(idx, rw)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              accepted === true
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            {accepted === true ? 'Copied & Accepted' : 'Accept (Copy)'}
                          </button>
                          <button
                            onClick={() => handleRejectRewrite(idx)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              accepted === false
                                ? 'bg-slate-700 text-slate-400'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
