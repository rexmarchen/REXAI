import React, { useEffect, useState, useRef } from 'react';
import type { ResumeData, AnalysisResult } from '../../types/resume';
import { api } from '../../services/api';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ScorePanelProps {
  data: ResumeData;
  targetJobDescription?: string;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ data, targetJobDescription }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsLoading(true);
    // 800 ms debounce requirement
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.analyzeJson(data, targetJobDescription);
        setResult(res);
      } catch (err) {
        console.error('Live scoring error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, targetJobDescription]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500 bg-emerald-950/40';
    if (score >= 70) return 'text-blue-400 border-blue-500 bg-blue-950/40';
    if (score >= 50) return 'text-amber-400 border-amber-500 bg-amber-950/40';
    return 'text-red-400 border-red-500 bg-red-950/40';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100">Live ATS & Quality Score</h3>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Auditing...</span>
          </div>
        )}
      </div>

      {result ? (
        <div className="space-y-4">
          {/* Top Score & Grade Banner */}
          <div className="flex items-center gap-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-750">
            <div className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor(result.overall_score)}`}>
              <span className="text-xl leading-none">{Math.round(result.overall_score)}</span>
              <span className="text-[10px] font-semibold opacity-80 mt-0.5">{result.grade}</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {result.overall_score >= 85
                  ? 'Excellent Resume Health'
                  : result.overall_score >= 70
                  ? 'Competitive Profile'
                  : 'Needs Attention'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {result.issues.length === 0
                  ? 'Zero critical issues detected!'
                  : `${result.issues.length} actionable improvements identified.`}
              </p>
            </div>
          </div>

          {/* Category Bars */}
          <div className="space-y-2">
            {Object.entries(result.category_scores).map(([category, catScore]) => (
              <div key={category} className="text-xs">
                <div className="flex justify-between items-center text-slate-300 font-medium mb-1">
                  <span>{category}</span>
                  <span className="font-semibold text-slate-200">{catScore.score}%</span>
                </div>
                <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(catScore.score)}`}
                    style={{ width: `${catScore.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Top Actionable Fixes */}
          {result.issues.length > 0 && (
            <div className="pt-2 border-t border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Top Priority Fixes
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {result.issues.slice(0, 4).map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-750 text-xs space-y-1"
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      {issue.severity === 'high' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      ) : issue.severity === 'medium' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      )}
                      <span className="text-slate-200">{issue.message}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5">
                      <strong className="text-blue-400">Fix: </strong>
                      {issue.concrete_fix}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.issues.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Flawless resume layout and content metrics. Ready for submission!</span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-400">
          Waiting for resume input to calculate score...
        </div>
      )}
    </div>
  );
};
