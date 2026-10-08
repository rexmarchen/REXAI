import React, { useState } from 'react';
import { TEMPLATES, ACCENT_COLORS, FONT_OPTIONS } from '../../data/templates';
import type { TemplateDefinition } from '../../types/resume';
import { Palette, Type, LayoutGrid, Check, ShieldCheck } from 'lucide-react';

interface TemplatePickerProps {
  selectedTemplateId: string;
  selectedColor: string;
  selectedFont: string;
  onSelectTemplate: (t: TemplateDefinition) => void;
  onSelectColor: (c: string) => void;
  onSelectFont: (f: string) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  selectedTemplateId,
  selectedColor,
  selectedFont,
  onSelectTemplate,
  onSelectColor,
  onSelectFont
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const categories = ['All', 'ATS Minimal', 'Modern', 'Executive', 'Technical', 'Creative'];

  const filteredTemplates = categoryFilter === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === categoryFilter);

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-6">
      {/* 1. Global Stylers: Color & Font Switchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-5 border-b border-slate-700/80">
        {/* Accent Color Switcher */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span>Accent Color</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => onSelectColor(c.hex)}
                title={c.name}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                style={{ backgroundColor: c.hex }}
              >
                {selectedColor.toLowerCase() === c.hex.toLowerCase() && (
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Switcher */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            <span>Typography Font</span>
          </label>
          <select
            value={selectedFont}
            onChange={(e) => onSelectFont(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Gallery Header & Category Filters */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            <span>24 Professional Resume Templates</span>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredTemplates.map((t) => {
            const isSelected = selectedTemplateId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTemplate(t)}
                className={`group flex flex-col text-left p-2.5 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-slate-900/60 border-slate-750 hover:border-slate-600 hover:bg-slate-800/60'
                }`}
              >
                {/* Thumbnail Simulation */}
                <div className="w-full h-24 bg-white rounded-lg p-1.5 mb-2 overflow-hidden border border-slate-200/80 relative flex flex-col pointer-events-none select-none">
                  {/* Miniature representation */}
                  {t.isAtsClassic ? (
                    <div className="flex flex-col h-full justify-between py-1">
                      <div className="w-12 h-1 bg-slate-800 mx-auto rounded" />
                      <div className="space-y-1">
                        <div className="w-full h-0.5 bg-slate-300" />
                        <div className="w-4/5 h-0.5 bg-slate-250" />
                        <div className="w-3/4 h-0.5 bg-slate-200" />
                      </div>
                      <div className="flex gap-1 justify-center">
                        <div className="w-3 h-1 bg-slate-400 rounded-xs" />
                        <div className="w-3 h-1 bg-slate-400 rounded-xs" />
                      </div>
                    </div>
                  ) : t.layout === 'left-sidebar' ? (
                    <div className="flex h-full gap-1">
                      <div className="w-1/3 bg-slate-100 rounded p-0.5 space-y-1">
                        <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: selectedColor }} />
                        <div className="w-full h-0.5 bg-slate-300" />
                        <div className="w-2/3 h-0.5 bg-slate-300" />
                      </div>
                      <div className="w-2/3 p-0.5 space-y-1">
                        <div className="w-4/5 h-1 bg-slate-700 rounded" />
                        <div className="w-full h-0.5 bg-slate-200" />
                        <div className="w-3/4 h-0.5 bg-slate-200" />
                        <div className="w-full h-0.5 bg-slate-200" />
                      </div>
                    </div>
                  ) : t.layout === 'right-sidebar' ? (
                    <div className="flex h-full gap-1">
                      <div className="w-2/3 p-0.5 space-y-1">
                        <div className="w-4/5 h-1 bg-slate-700 rounded" />
                        <div className="w-full h-0.5 bg-slate-200" />
                        <div className="w-3/4 h-0.5 bg-slate-200" />
                      </div>
                      <div className="w-1/3 bg-slate-100 rounded p-0.5 space-y-1">
                        <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: selectedColor }} />
                        <div className="w-full h-0.5 bg-slate-300" />
                      </div>
                    </div>
                  ) : t.layout.startsWith('banner') ? (
                    <div className="flex flex-col h-full gap-1">
                      <div className="w-full h-4 rounded px-1 flex items-center justify-between" style={{ backgroundColor: selectedColor }}>
                        <div className="w-6 h-1 bg-white/80 rounded" />
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                      </div>
                      <div className="flex gap-1 flex-1">
                        <div className="w-1/3 bg-slate-100 rounded p-0.5 space-y-1" />
                        <div className="w-2/3 p-0.5 space-y-1">
                          <div className="w-full h-0.5 bg-slate-200" />
                          <div className="w-3/4 h-0.5 bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full justify-between p-0.5">
                      <div className="w-3/5 h-1.5 mx-auto rounded" style={{ backgroundColor: selectedColor }} />
                      <div className="space-y-1">
                        <div className="w-full h-0.5 bg-slate-200" />
                        <div className="w-5/6 h-0.5 bg-slate-200" />
                        <div className="w-4/6 h-0.5 bg-slate-200" />
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded" />
                    </div>
                  )}

                  {t.isAtsClassic && (
                    <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded p-0.5 text-[8px]" title="ATS Verified">
                      <ShieldCheck className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Title & Badge */}
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span className="text-xs font-semibold text-slate-100 truncate">{t.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">{t.category}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
