import React, { useState, useEffect, useRef } from 'react';
import type {
  ResumeData,
  TemplateDefinition,
  AnalysisResult,
  User,
  ResumeRecord
} from './types/resume';
import { TEMPLATES, DEFAULT_RESUME_DATA, ACCENT_COLORS, FONT_OPTIONS } from './data/templates';
import { ResumeDocument } from './components/resume/ResumeDocument';
import { ResumeForm } from './components/resume/ResumeForm';
import { TemplatePicker } from './components/resume/TemplatePicker';
import { ScorePanel } from './components/resume/ScorePanel';
import { AnalyzerUpload } from './components/analyzer/AnalyzerUpload';
import { AnalysisReport } from './components/analyzer/AnalysisReport';
import { AnalysisHistory } from './components/analyzer/AnalysisHistory';
import { AuthModal } from './components/auth/AuthModal';
import { api } from './services/api';
import {
  FileText,
  Scan,
  History,
  Download,
  Printer,
  Copy,
  Trash2,
  Plus,
  User as UserIcon,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'builder' | 'analyzer' | 'history'>('builder');

  // Builder state
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('active_resume_data');
    return saved ? JSON.parse(saved) : DEFAULT_RESUME_DATA;
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(TEMPLATES[0]);
  const [accentColor, setAccentColor] = useState<string>(ACCENT_COLORS[0].hex);
  const [fontFamily, setFontFamily] = useState<string>(FONT_OPTIONS[0].value);
  const [resumeTitle, setResumeTitle] = useState<string>('My Professional Resume');
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null);
  const [savedResumesList, setSavedResumesList] = useState<ResumeRecord[]>([]);

  // Preview zoom scale (default 0.85 for desktop screens)
  const [previewScale, setPreviewScale] = useState<number>(0.85);

  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState<string>('Saved locally');

  // Analyzer state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Check auth on mount
  useEffect(() => {
    api.getMe().then(user => {
      if (user) {
        setCurrentUser(user);
        loadUserResumes();
      }
    });
  }, []);

  const loadUserResumes = async () => {
    try {
      const list = await api.listResumes();
      setSavedResumesList(list);
    } catch (err) {
      console.error('Failed to load user resumes:', err);
    }
  };

  // Autosave debounced effect
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    localStorage.setItem('active_resume_data', JSON.stringify(resumeData));
    setAutosaveStatus('Saving changes...');

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      if (currentUser && currentResumeId) {
        try {
          await api.updateResume(currentResumeId, {
            title: resumeTitle,
            template_id: selectedTemplate.id,
            accent_color: accentColor,
            font_family: fontFamily,
            data: resumeData
          });
          setAutosaveStatus('Saved to cloud');
        } catch {
          setAutosaveStatus('Saved locally');
        }
      } else {
        setAutosaveStatus('Saved locally');
      }
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [resumeData, selectedTemplate, accentColor, fontFamily, resumeTitle, currentUser, currentResumeId]);

  // Handle PDF Export
  const handleExportPdf = () => {
    window.print();
  };

  // Handle DOCX Export
  const handleExportDocx = async () => {
    try {
      setAutosaveStatus('Exporting DOCX...');
      await api.exportDocx(resumeData, `${resumeTitle.replace(/\s+/g, '_')}.docx`);
      setAutosaveStatus('DOCX exported');
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
      setAutosaveStatus('Export failed');
    }
  };

  // Create new resume
  const handleCreateNewResume = async () => {
    if (currentUser) {
      try {
        const created = await api.createResume('New Resume', selectedTemplate.id, accentColor, fontFamily, DEFAULT_RESUME_DATA);
        setCurrentResumeId(created.id);
        setResumeTitle(created.title);
        setResumeData(created.data);
        await loadUserResumes();
      } catch (err) {
        console.error(err);
      }
    } else {
      setResumeData(DEFAULT_RESUME_DATA);
      setResumeTitle('New Resume');
      setCurrentResumeId(null);
    }
  };

  // Duplicate resume
  const handleDuplicateResume = async () => {
    if (currentUser && currentResumeId) {
      try {
        const copy = await api.duplicateResume(currentResumeId);
        setCurrentResumeId(copy.id);
        setResumeTitle(copy.title);
        setResumeData(copy.data);
        await loadUserResumes();
      } catch (err) {
        console.error(err);
      }
    } else {
      setResumeTitle(`${resumeTitle} (Copy)`);
    }
  };

  // Delete resume
  const handleDeleteResume = async () => {
    if (currentUser && currentResumeId) {
      if (!window.confirm('Are you sure you want to delete this resume?')) return;
      try {
        await api.deleteResume(currentResumeId);
        setCurrentResumeId(null);
        await loadUserResumes();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
              RF
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                <span>ResumeForge</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ATS PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Production Builder & Deterministic Scanner</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'builder'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume Builder</span>
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'analyzer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>ATS Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </nav>

          {/* Right User State Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentUser ? currentUser.email.split('@')[0] : 'Sign In / Account'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: RESUME BUILDER */}
        {activeTab === 'builder' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 no-print">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 w-56 sm:w-72"
                  placeholder="Resume Title"
                />
                {savedResumesList.length > 0 && (
                  <select
                    value={currentResumeId || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const target = savedResumesList.find(r => r.id === id);
                      if (target) {
                        setCurrentResumeId(target.id);
                        setResumeTitle(target.title);
                        setResumeData(target.data);
                        const templ = TEMPLATES.find(t => t.id === target.template_id);
                        if (templ) setSelectedTemplate(templ);
                        setAccentColor(target.accent_color);
                        setFontFamily(target.font_family);
                      }
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value="" disabled>Switch saved resume...</option>
                    {savedResumesList.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                )}
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {autosaveStatus}
                </span>
              </div>

              {/* Action Buttons: Export PDF, Export DOCX, Duplicate, Delete */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                  title="Print or Save as A4 PDF with exact colors preserved"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={handleExportDocx}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
                  title="Generate ATS-compliant Microsoft Word (.docx)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export DOCX</span>
                </button>
                <button
                  onClick={handleDuplicateResume}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs transition"
                  title="Duplicate resume"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {currentResumeId && (
                  <button
                    onClick={handleDeleteResume}
                    className="p-2 bg-slate-800 hover:bg-red-900/50 border border-slate-700 text-red-400 rounded-xl text-xs transition"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleCreateNewResume}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                  title="Create new resume"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New</span>
                </button>
              </div>
            </div>

            {/* Split Screen Grid: Left = Form & Controls, Right = Live A4 Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form & Stylers (5 cols) */}
              <div className="lg:col-span-5 space-y-6 no-print">
                {/* Live Scoring Panel (800ms debounced) */}
                <ScorePanel data={resumeData} />

                {/* Template Gallery Picker */}
                <TemplatePicker
                  selectedTemplateId={selectedTemplate.id}
                  selectedColor={accentColor}
                  selectedFont={fontFamily}
                  onSelectTemplate={(t) => setSelectedTemplate(t)}
                  onSelectColor={(c) => setAccentColor(c)}
                  onSelectFont={(f) => setFontFamily(f)}
                />

                {/* Section Form Editor */}
                <ResumeForm
                  data={resumeData}
                  onChange={(newData) => setResumeData(newData)}
                />
              </div>

              {/* Right Column: Sticky Live A4 Preview (7 cols) */}
              <div className="lg:col-span-7 sticky top-20 space-y-3">
                {/* Preview Toolbar */}
                <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs no-print">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Live A4 Preview ({selectedTemplate.name})</span>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.05))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-slate-400 w-12 text-center text-[11px] font-mono">
                      {Math.round(previewScale * 100)}%
                    </span>
                    <button
                      onClick={() => setPreviewScale(Math.min(1.2, previewScale + 0.05))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* The A4 Scaled Sheet Container */}
                <div className="overflow-x-auto flex justify-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 min-h-[600px]">
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                      width: '794px',
                      minHeight: '1123px'
                    }}
                    className="transition-transform duration-150"
                  >
                    <ResumeDocument
                      data={resumeData}
                      template={selectedTemplate}
                      accentColor={accentColor}
                      fontFamily={fontFamily}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RESUME ANALYZER */}
        {activeTab === 'analyzer' && (
          <div>
            {!analysisResult ? (
              <AnalyzerUpload
                onAnalysisComplete={(res) => setAnalysisResult(res)}
              />
            ) : (
              <AnalysisReport
                result={analysisResult}
                onReset={() => setAnalysisResult(null)}
              />
            )}
          </div>
        )}

        {/* TAB 3: ANALYSIS HISTORY */}
        {activeTab === 'history' && (
          <AnalysisHistory />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(u) => {
          setCurrentUser(u);
          if (u) loadUserResumes();
        }}
      />
    </div>
  );
};

export default App;
