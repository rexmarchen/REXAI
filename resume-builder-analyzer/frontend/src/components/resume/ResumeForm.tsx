import React, { useState } from 'react';
import type {
  ResumeData,
  ExperienceItem,
  ProjectItem,
  EducationItem,
  SkillItem,
  LanguageItem,
  CertificationItem
} from '../../types/resume';
import {
  User,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Sparkles,
  Languages,
  Award,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ResumeFormProps {
  data: ResumeData;
  onChange: (newData: ResumeData) => void;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({ data, onChange }) => {
  const [activeSection, setActiveSection] = useState<string>('contact');

  // Contact change
  const handleContactChange = (field: keyof typeof data.contact, value: string) => {
    onChange({
      ...data,
      contact: { ...data.contact, [field]: value }
    });
  };

  // Reorder helper
  const moveItem = <T,>(list: T[], index: number, direction: 'up' | 'down'): T[] => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return list;
    const updated = [...list];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    return updated;
  };

  // --- Experience Actions ---
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: 'New Company Inc.',
      title: 'Senior Software Engineer',
      location: 'Remote',
      start_date: '2023',
      end_date: 'Present',
      current: true,
      bullets: ['Led cross-functional team delivering core architecture improvements, increasing performance by 25%.']
    };
    onChange({ ...data, experience: [newItem, ...data.experience] });
  };

  const updateExperience = (index: number, updatedItem: Partial<ExperienceItem>) => {
    const list = [...data.experience];
    list[index] = { ...list[index], ...updatedItem };
    onChange({ ...data, experience: list });
  };

  const removeExperience = (index: number) => {
    onChange({ ...data, experience: data.experience.filter((_, i) => i !== index) });
  };

  // --- Projects Actions ---
  const addProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: 'Real-Time Analytics Pipeline',
      description: 'Distributed event processing pipeline utilizing Go and Kafka handling 20,000 requests/sec.',
      technologies: ['Go', 'Kafka', 'Docker'],
      link: 'github.com/user/project'
    };
    onChange({ ...data, projects: [newItem, ...data.projects] });
  };

  const updateProject = (index: number, updatedItem: Partial<ProjectItem>) => {
    const list = [...data.projects];
    list[index] = { ...list[index], ...updatedItem };
    onChange({ ...data, projects: list });
  };

  const removeProject = (index: number) => {
    onChange({ ...data, projects: data.projects.filter((_, i) => i !== index) });
  };

  // --- Education Actions ---
  const addEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: 'University of Engineering & Tech',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      location: 'Boston, MA',
      start_date: '2016',
      end_date: '2020',
      gpa: '3.8'
    };
    onChange({ ...data, education: [...data.education, newItem] });
  };

  const updateEducation = (index: number, updatedItem: Partial<EducationItem>) => {
    const list = [...data.education];
    list[index] = { ...list[index], ...updatedItem };
    onChange({ ...data, education: list });
  };

  const removeEducation = (index: number) => {
    onChange({ ...data, education: data.education.filter((_, i) => i !== index) });
  };

  // --- Skills Actions ---
  const addSkill = () => {
    const newItem: SkillItem = {
      id: `sk-${Date.now()}`,
      name: 'Python',
      level: 85,
      category: 'Technical'
    };
    onChange({ ...data, skills: [...data.skills, newItem] });
  };

  const updateSkill = (index: number, updatedItem: Partial<SkillItem>) => {
    const list = [...data.skills];
    list[index] = { ...list[index], ...updatedItem };
    onChange({ ...data, skills: list });
  };

  const removeSkill = (index: number) => {
    onChange({ ...data, skills: data.skills.filter((_, i) => i !== index) });
  };

  // --- Languages Actions ---
  const addLanguage = () => {
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: 'Spanish',
      proficiency: 'Professional Working'
    };
    onChange({ ...data, languages: [...data.languages, newItem] });
  };

  const updateLanguage = (index: number, updatedItem: Partial<LanguageItem>) => {
    const list = [...data.languages];
    list[index] = { ...list[index], ...updatedItem };
    onChange({ ...data, languages: list });
  };

  const removeLanguage = (index: number) => {
    onChange({ ...data, languages: data.languages.filter((_, i) => i !== index) });
  };

  // --- Certifications Actions ---
  const addCertification = () => {
    const newItem: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: 'AWS Solutions Architect Associate',
      issuer: 'Amazon Web Services',
      issue_date: '2023',
      url: 'https://aws.amazon.com'
    };
    onChange({ ...data, certifications: [...data.certifications, newItem] });
  };

  const updateCertification = (index: number, updatedItem: Partial<CertificationItem>) => {
    const list = [...data.certifications];
    list[index] = { ...list[index], ...updatedItem };
    onChange({ ...data, certifications: list });
  };

  const removeCertification = (index: number) => {
    onChange({ ...data, certifications: data.certifications.filter((_, i) => i !== index) });
  };

  const toggleAccordion = (sec: string) => {
    setActiveSection(activeSection === sec ? '' : sec);
  };

  return (
    <div className="space-y-4">
      {/* 1. CONTACT INFO */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleAccordion('contact')}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left font-semibold text-slate-100 hover:bg-slate-700/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-blue-400" />
            <span>Contact Details & Header</span>
          </div>
          {activeSection === 'contact' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {activeSection === 'contact' && (
          <div className="p-5 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={data.contact.full_name}
                onChange={(e) => handleContactChange('full_name', e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Job Title</label>
              <input
                type="text"
                value={data.contact.job_title}
                onChange={(e) => handleContactChange('job_title', e.target.value)}
                placeholder="e.g. Lead Software Architect"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={data.contact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={data.contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location / City</label>
              <input
                type="text"
                value={data.contact.location}
                onChange={(e) => handleContactChange('location', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn Profile</label>
              <input
                type="text"
                value={data.contact.linkedin}
                onChange={(e) => handleContactChange('linkedin', e.target.value)}
                placeholder="linkedin.com/in/alex-dev"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GitHub Profile</label>
              <input
                type="text"
                value={data.contact.github}
                onChange={(e) => handleContactChange('github', e.target.value)}
                placeholder="github.com/alexrivera"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Personal Portfolio / Website</label>
              <input
                type="text"
                value={data.contact.website}
                onChange={(e) => handleContactChange('website', e.target.value)}
                placeholder="https://alexrivera.dev"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. SUMMARY */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleAccordion('summary')}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left font-semibold text-slate-100 hover:bg-slate-700/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Executive Summary</span>
          </div>
          {activeSection === 'summary' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {activeSection === 'summary' && (
          <div className="p-5 border-t border-slate-700">
            <textarea
              rows={4}
              value={data.summary}
              onChange={(e) => onChange({ ...data, summary: e.target.value })}
              placeholder="Brief 2-4 sentence executive overview describing your years of experience, core technical achievements, and measurable leadership impact..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 3. WORK EXPERIENCE */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={() => toggleAccordion('experience')}
            className="flex items-center gap-2.5 font-semibold text-slate-100"
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Work Experience ({data.experience.length})</span>
            {activeSection === 'experience' ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
          </button>
          <button
            onClick={addExperience}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Role
          </button>
        </div>

        {activeSection === 'experience' && (
          <div className="p-5 border-t border-slate-700 space-y-6">
            {data.experience.map((exp, idx) => (
              <div key={exp.id || idx} className="bg-slate-900/70 border border-slate-750 p-4 rounded-xl relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200 text-sm">{exp.title || 'Untitled Role'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onChange({ ...data, experience: moveItem(data.experience, idx, 'up') })}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onChange({ ...data, experience: moveItem(data.experience, idx, 'down') })}
                      disabled={idx === data.experience.length - 1}
                      title="Move down"
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeExperience(idx)}
                      title="Delete role"
                      className="p-1 text-red-400 hover:text-red-300 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(idx, { company: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(idx, { title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                    <input
                      type="text"
                      value={exp.start_date}
                      placeholder="e.g. Jan 2022"
                      onChange={(e) => updateExperience(idx, { start_date: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">End Date (or check Current)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={exp.current}
                        value={exp.current ? 'Present' : exp.end_date}
                        placeholder="e.g. Dec 2023"
                        onChange={(e) => updateExperience(idx, { end_date: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 disabled:opacity-50"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(idx, { current: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        Current
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Bullet Points (One bullet per line — start with strong action verbs & metrics!)
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={exp.bullets.join('\n')}
                    onChange={(e) => updateExperience(idx, { bullets: e.target.value.split('\n') })}
                    placeholder="• Architected microservice in Go, processing 50k req/s and cutting latency by 35%&#10;• Spearheaded cloud migration to Kubernetes, saving $80,000 annually"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 leading-relaxed font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. KEY PROJECTS */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={() => toggleAccordion('projects')}
            className="flex items-center gap-2.5 font-semibold text-slate-100"
          >
            <FolderGit2 className="w-4 h-4 text-purple-400" />
            <span>Key Projects ({data.projects.length})</span>
            {activeSection === 'projects' ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
          </button>
          <button
            onClick={addProject}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>

        {activeSection === 'projects' && (
          <div className="p-5 border-t border-slate-700 space-y-4">
            {data.projects.map((proj, idx) => (
              <div key={proj.id || idx} className="bg-slate-900/70 border border-slate-750 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2.5">
                  <span className="font-semibold text-slate-200 text-sm">{proj.title || 'Untitled Project'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onChange({ ...data, projects: moveItem(data.projects, idx, 'up') })}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onChange({ ...data, projects: moveItem(data.projects, idx, 'down') })}
                      disabled={idx === data.projects.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeProject(idx)}
                      className="p-1 text-red-400 hover:text-red-300 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => updateProject(idx, { title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Link / Repository</label>
                    <input
                      type="text"
                      value={proj.link}
                      placeholder="github.com/org/repo"
                      onChange={(e) => updateProject(idx, { link: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="mb-2.5">
                  <label className="block text-xs text-slate-400 mb-1">Description & Impact</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => updateProject(idx, { description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Technologies Used (comma separated)</label>
                  <input
                    type="text"
                    value={proj.technologies.join(', ')}
                    placeholder="e.g. Go, Kafka, Docker, Kubernetes"
                    onChange={(e) => updateProject(idx, { technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. EDUCATION */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={() => toggleAccordion('education')}
            className="flex items-center gap-2.5 font-semibold text-slate-100"
          >
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span>Education ({data.education.length})</span>
            {activeSection === 'education' ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
          </button>
          <button
            onClick={addEducation}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Degree
          </button>
        </div>

        {activeSection === 'education' && (
          <div className="p-5 border-t border-slate-700 space-y-4">
            {data.education.map((edu, idx) => (
              <div key={edu.id || idx} className="bg-slate-900/70 border border-slate-750 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2.5">
                  <span className="font-semibold text-slate-200 text-sm">{edu.institution || 'Institution'}</span>
                  <button onClick={() => removeEducation(idx)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(idx, { institution: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Degree & Major</label>
                    <input
                      type="text"
                      value={edu.degree}
                      placeholder="e.g. Bachelor of Science"
                      onChange={(e) => updateEducation(idx, { degree: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Field of Study</label>
                    <input
                      type="text"
                      value={edu.field_of_study}
                      placeholder="e.g. Computer Science"
                      onChange={(e) => updateEducation(idx, { field_of_study: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Dates & GPA</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={edu.start_date}
                        placeholder="2016"
                        onChange={(e) => updateEducation(idx, { start_date: e.target.value })}
                        className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="text"
                        value={edu.end_date}
                        placeholder="2020"
                        onChange={(e) => updateEducation(idx, { end_date: e.target.value })}
                        className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="text"
                        value={edu.gpa}
                        placeholder="GPA 3.8"
                        onChange={(e) => updateEducation(idx, { gpa: e.target.value })}
                        className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. SKILLS */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={() => toggleAccordion('skills')}
            className="flex items-center gap-2.5 font-semibold text-slate-100"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Skills & Competencies ({data.skills.length})</span>
            {activeSection === 'skills' ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
          </button>
          <button
            onClick={addSkill}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Skill
          </button>
        </div>

        {activeSection === 'skills' && (
          <div className="p-5 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.skills.map((skill, idx) => (
              <div key={skill.id || idx} className="bg-slate-900 border border-slate-750 p-3 rounded-lg flex items-center gap-3">
                <input
                  type="text"
                  value={skill.name}
                  placeholder="e.g. Python"
                  onChange={(e) => updateSkill(idx, { name: e.target.value })}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100"
                />
                <div className="flex items-center gap-2 w-28">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skill.level}
                    onChange={(e) => updateSkill(idx, { level: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 w-6 text-right">{skill.level}%</span>
                </div>
                <button onClick={() => removeSkill(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. LANGUAGES & CERTIFICATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Languages */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <Languages className="w-4 h-4 text-blue-400" />
              <span>Languages ({data.languages.length})</span>
            </div>
            <button
              onClick={addLanguage}
              className="p-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {data.languages.map((lang, idx) => (
              <div key={lang.id || idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={lang.name}
                  placeholder="Language"
                  onChange={(e) => updateLanguage(idx, { name: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100"
                />
                <input
                  type="text"
                  value={lang.proficiency}
                  placeholder="Proficiency"
                  onChange={(e) => updateLanguage(idx, { proficiency: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100"
                />
                <button onClick={() => removeLanguage(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Certifications ({data.certifications.length})</span>
            </div>
            <button
              onClick={addCertification}
              className="p-1 bg-amber-600/20 text-amber-400 rounded hover:bg-amber-600/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {data.certifications.map((cert, idx) => (
              <div key={cert.id || idx} className="space-y-1 bg-slate-900/60 p-2 rounded border border-slate-750">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={cert.name}
                    placeholder="Certificate Name"
                    onChange={(e) => updateCertification(idx, { name: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-100 mr-2"
                  />
                  <button onClick={() => removeCertification(idx)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cert.issuer}
                    placeholder="Issuer"
                    onChange={(e) => updateCertification(idx, { issuer: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-100"
                  />
                  <input
                    type="text"
                    value={cert.issue_date}
                    placeholder="Year"
                    onChange={(e) => updateCertification(idx, { issue_date: e.target.value })}
                    className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
