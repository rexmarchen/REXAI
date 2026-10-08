import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { History, TrendingUp, Trash2, Calendar, FileText } from 'lucide-react';

interface HistoryItem {
  id: number;
  file_name: string;
  job_title: string;
  overall_score: number;
  grade: string;
  category_scores: Record<string, any>;
  issues: any[];
  job_match: any;
  created_at: string;
}

export const AnalysisHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.deleteHistory(id);
      setHistory(history.filter(h => h.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    if (score >= 70) return 'bg-blue-950 text-blue-400 border-blue-800';
    if (score >= 50) return 'bg-amber-950 text-amber-400 border-amber-800';
    return 'bg-red-950 text-red-400 border-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Analysis History & Score Trends</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track resume score improvements across revisions and target job applications.
          </p>
        </div>
      </div>

      {/* Score Trend Chart / Progression Bar */}
      {history.length > 1 && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Score Progression Trend</span>
          </div>

          <div className="flex items-end gap-3 h-36 pt-4 px-2 border-b border-slate-700">
            {history.slice(0, 10).reverse().map((item, idx) => {
              const heightPercent = Math.max(15, Math.min(100, item.overall_score));
              return (
                <div key={item.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition">
                    {Math.round(item.overall_score)}
                  </span>
                  <div
                    className="w-full bg-blue-600 group-hover:bg-blue-500 rounded-t-md transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] text-slate-400 truncate max-w-[40px]">
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Items List */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading history records...</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No past analysis records found. Upload a resume or sign in to track progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-750 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-slate-600 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-bold text-sm ${getScoreBadge(item.overall_score)}`}>
                    <span>{Math.round(item.overall_score)}</span>
                    <span className="text-[9px] opacity-80">{item.grade}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{item.file_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.job_title ? `Target: ${item.job_title}` : 'General Comprehensive Audit'}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span>{item.issues?.length || 0} issues flagged</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
