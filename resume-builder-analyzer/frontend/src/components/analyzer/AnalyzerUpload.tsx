import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '../../types/resume';
import { api } from '../../services/api';

interface AnalyzerUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const AnalyzerUpload: React.FC<AnalyzerUploadProps> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [useAi, setUseAi] = useState<boolean>(false);
  const [consentChecked, setConsentChecked] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg('');
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.docx') && !ext.endsWith('.txt')) {
      setErrorMsg('Unsupported file format. Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5 MB limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a resume file to upload.');
      return;
    }
    if (!consentChecked) {
      setErrorMsg('Please review and check the privacy consent box before proceeding.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await api.analyzeFile(file, jobDescription, useAi);
      onAnalysisComplete(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white tracking-tight">
          Deterministic ATS & Quality Resume Scanner
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Upload your resume in PDF, DOCX, or TXT. Our engine runs deterministic ATS checks, date range gap detection, and action-verb scoring.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Drag & Drop Upload Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            file
              ? 'border-emerald-500/70 bg-emerald-950/20'
              : 'border-slate-650 hover:border-blue-500 bg-slate-900/60 hover:bg-slate-900/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-100 text-sm">{file.name}</span>
              <span className="text-xs text-slate-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-xs text-red-400 hover:text-red-300 mt-2 underline"
              >
                Change file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <span className="font-semibold text-slate-200 text-sm">
                Drop your resume here, or <span className="text-blue-400 underline">browse files</span>
              </span>
              <span className="text-xs text-slate-400">
                Supports PDF, DOCX, and TXT files up to 5 MB
              </span>
            </div>
          )}
        </div>

        {/* Optional Target Job Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Target Job Description (Optional)
          </label>
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job listing or key requirements here to evaluate 500+ skills coverage, keyword matching, and text similarity..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        {/* AI Layer Toggle */}
        <div className="flex items-start gap-3 p-4 bg-slate-900/60 border border-slate-750 rounded-xl">
          <input
            type="checkbox"
            id="useAi"
            checked={useAi}
            onChange={(e) => setUseAi(e.target.checked)}
            className="mt-1 rounded text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="useAi" className="text-xs cursor-pointer">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Enable Optional AI Critique & Bullet Rewrites
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Powered by Anthropic Claude (when configured). Automatically strips all PII (email, phone, links) and enforces prompt-injection protection. The AI layer never changes your rule-based deterministic score.
            </p>
          </label>
        </div>

        {/* Privacy Notice & Consent */}
        <div className="flex items-start gap-3 p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl">
          <input
            type="checkbox"
            id="privacyConsent"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="privacyConsent" className="text-[11px] text-slate-300 cursor-pointer">
            <span className="font-semibold text-slate-200 flex items-center gap-1 mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Privacy Notice & Data Protection Consent
            </span>
            I consent to processing my resume text for scoring purposes. No uploaded files are ever stored on disk or shared with third parties. Scoring is purely advisory; no ATS pass guarantee is claimed.
          </label>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !file}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Running ATS Audit Pipeline...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Scan & Score Resume</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
