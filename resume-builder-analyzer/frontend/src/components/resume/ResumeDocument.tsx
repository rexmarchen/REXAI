import React from 'react';
import type { ResumeData, TemplateDefinition } from '../../types/resume';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

interface ResumeDocumentProps {
  data: ResumeData;
  template: TemplateDefinition;
  accentColor: string;
  fontFamily: string;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({
  data,
  template,
  accentColor,
  fontFamily
}) => {
  const isAts = template.isAtsClassic;
  const activeAccent = isAts ? '#1e293b' : accentColor;
  
  // Initials for avatar
  const initials = data.contact.full_name
    ? data.contact.full_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CV';

  // Section heading generator
  const renderSectionHeading = (title: string) => {
    switch (template.headingStyle) {
      case 'underline':
        return (
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2.5 flex items-center gap-1.5"
            style={{
              color: activeAccent,
              borderBottom: `2px solid ${activeAccent}`
            }}
          >
            {title}
          </h2>
        );
      case 'filled-bar':
        return (
          <h2
            className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 mb-2.5 text-white rounded-sm"
            style={{ backgroundColor: activeAccent }}
          >
            {title}
          </h2>
        );
      case 'left-border':
        return (
          <h2
            className="text-xs font-bold uppercase tracking-wider pl-2 mb-2.5"
            style={{
              color: activeAccent,
              borderLeft: `3px solid ${activeAccent}`
            }}
          >
            {title}
          </h2>
        );
      case 'spaced-caps':
        return (
          <h2
            className="text-xs font-extrabold uppercase tracking-widest text-slate-800 pb-1 mb-2.5 border-b border-slate-200"
            style={{ color: activeAccent }}
          >
            {title}
          </h2>
        );
      case 'serif-sentence':
        return (
          <h2
            className="text-sm font-serif font-bold italic tracking-wide mb-2.5 pb-1 border-b border-slate-200"
            style={{ color: activeAccent }}
          >
            {title}
          </h2>
        );
      case 'dot-marker':
        return (
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2 text-slate-800">
            <span
              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: activeAccent }}
            />
            {title}
          </h2>
        );
      default:
        return (
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-800 border-b pb-1">
            {title}
          </h2>
        );
    }
  };

  // Reusable Contact Info Block
  const ContactDetails = ({ inSidebar = false }: { inSidebar?: boolean }) => (
    <div className={`text-[10px] text-slate-600 ${inSidebar ? 'space-y-1.5' : 'flex flex-wrap items-center gap-x-4 gap-y-1'}`}>
      {data.contact.email && (
        <div className="flex items-center gap-1.5 break-all">
          {!isAts && <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />}
          <span>{data.contact.email}</span>
        </div>
      )}
      {data.contact.phone && (
        <div className="flex items-center gap-1.5">
          {!isAts && <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />}
          <span>{data.contact.phone}</span>
        </div>
      )}
      {data.contact.location && (
        <div className="flex items-center gap-1.5">
          {!isAts && <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />}
          <span>{data.contact.location}</span>
        </div>
      )}
      {data.contact.linkedin && (
        <div className="flex items-center gap-1.5 break-all">
          {!isAts && (
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          )}
          <span>{data.contact.linkedin.replace(/^https?:\/\//, '')}</span>
        </div>
      )}
      {data.contact.github && (
        <div className="flex items-center gap-1.5 break-all">
          {!isAts && (
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          )}
          <span>{data.contact.github.replace(/^https?:\/\//, '')}</span>
        </div>
      )}
      {data.contact.website && (
        <div className="flex items-center gap-1.5 break-all">
          {!isAts && <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />}
          <span>{data.contact.website.replace(/^https?:\/\//, '')}</span>
        </div>
      )}
    </div>
  );

  // Summary Section
  const SummarySection = () => {
    if (!data.summary) return null;
    return (
      <div className="mb-4">
        {renderSectionHeading('Professional Summary')}
        <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
          {data.summary}
        </p>
      </div>
    );
  };

  // Experience Section
  const ExperienceSection = () => {
    if (!data.experience || data.experience.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeading('Work Experience')}
        <div className={template.hasTimeline && !isAts ? 'border-l-2 pl-3 ml-1.5 space-y-4' : 'space-y-3.5'} style={template.hasTimeline && !isAts ? { borderColor: `${activeAccent}33` } : {}}>
          {data.experience.map((exp) => (
            <div key={exp.id || exp.company} className="relative">
              {template.hasTimeline && !isAts && (
                <div
                  className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: activeAccent }}
                />
              )}
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-[11.5px] font-bold text-slate-800">{exp.title}</span>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  {exp.start_date} – {exp.current ? 'Present' : exp.end_date}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10.5px] text-slate-600 mb-1.5">
                <span className="font-semibold" style={{ color: isAts ? undefined : activeAccent }}>{exp.company}</span>
                {exp.location && <span className="text-slate-400 text-[10px]">{exp.location}</span>}
              </div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul className="list-disc ml-3.5 space-y-1 text-[10.5px] text-slate-700 leading-normal">
                  {exp.bullets.map((b, idx) => (
                    b.trim() ? <li key={idx}>{b}</li> : null
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Projects Section
  const ProjectsSection = () => {
    if (!data.projects || data.projects.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeading('Key Projects')}
        <div className="space-y-2.5">
          {data.projects.map((proj) => (
            <div key={proj.id || proj.title} className="text-[10.5px]">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="font-bold text-slate-800">{proj.title}</span>
                {proj.link && (
                  <span className="text-[9.5px] text-slate-400 break-all">{proj.link}</span>
                )}
              </div>
              <p className="text-slate-700 leading-normal mb-1">{proj.description}</p>
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 text-[9.5px] text-slate-500">
                  <span className="font-medium text-slate-600">Tech:</span>
                  <span>{proj.technologies.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Education Section
  const EducationSection = () => {
    if (!data.education || data.education.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeading('Education')}
        <div className="space-y-2">
          {data.education.map((edu) => (
            <div key={edu.id || edu.institution} className="text-[10.5px]">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-800">
                  {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                </span>
                <span className="text-[9.5px] text-slate-500">
                  {edu.start_date} – {edu.end_date}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{edu.institution}</span>
                {edu.gpa && <span className="text-[9.5px] font-medium text-slate-500">GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Skills Section
  const SkillsSection = () => {
    if (!data.skills || data.skills.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeading('Skills & Competencies')}
        {template.skillStyle === 'bars' && !isAts ? (
          <div className="space-y-1.5">
            {data.skills.map((skill) => (
              <div key={skill.id || skill.name} className="text-[10px]">
                <div className="flex justify-between text-slate-700 font-medium mb-0.5">
                  <span>{skill.name}</span>
                  <span className="text-slate-400">{skill.level}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${skill.level}%`, backgroundColor: activeAccent }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span
                key={skill.id || skill.name}
                className={
                  isAts
                    ? "text-[10.5px] text-slate-700 mr-1 after:content-[','] last:after:content-none"
                    : "text-[10px] px-2 py-0.5 rounded border font-medium text-slate-700 bg-slate-50"
                }
                style={isAts ? {} : { borderColor: `${activeAccent}33` }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Languages Section
  const LanguagesSection = () => {
    if (!data.languages || data.languages.length === 0) return null;
    return (
      <div className="mb-4">
        {renderSectionHeading('Languages')}
        <div className="space-y-1">
          {data.languages.map((lang) => (
            <div key={lang.id || lang.name} className="flex justify-between text-[10px]">
              <span className="font-semibold text-slate-700">{lang.name}</span>
              <span className="text-slate-500">{lang.proficiency}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Certifications Section
  const CertificationsSection = () => {
    if (!data.certifications || data.certifications.length === 0) return null;
    return (
      <div className="mb-3">
        {renderSectionHeading('Certifications')}
        <div className="space-y-1.5">
          {data.certifications.map((cert) => (
            <div key={cert.id || cert.name} className="text-[10px]">
              <div className="font-semibold text-slate-800">{cert.name}</div>
              <div className="flex justify-between text-slate-500 text-[9.5px]">
                <span>{cert.issuer}</span>
                <span>{cert.issue_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Header Component
  const HeaderComponent = () => (
    <div className="border-b border-slate-200 pb-3 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {data.contact.full_name || 'Your Full Name'}
          </h1>
          {data.contact.job_title && (
            <p className="text-sm font-semibold tracking-wide mt-0.5" style={{ color: activeAccent }}>
              {data.contact.job_title}
            </p>
          )}
        </div>
        {template.hasAvatar && !isAts && (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base shadow-sm flex-shrink-0"
            style={{ backgroundColor: activeAccent }}
          >
            {initials}
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <ContactDetails inSidebar={false} />
      </div>
    </div>
  );

  // Top Banner Component for banner layouts
  const BannerHeaderComponent = () => (
    <div
      className="p-6 text-white mb-4"
      style={{ backgroundColor: isAts ? '#1e293b' : activeAccent }}
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {data.contact.full_name || 'Your Full Name'}
          </h1>
          {data.contact.job_title && (
            <p className="text-sm font-medium opacity-90 mt-0.5">
              {data.contact.job_title}
            </p>
          )}
        </div>
        {template.hasAvatar && !isAts && (
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-base border-2 border-white/40">
            {initials}
          </div>
        )}
      </div>
      <div className="mt-3 pt-2.5 border-t border-white/20 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/90">
        {data.contact.email && <span>{data.contact.email}</span>}
        {data.contact.phone && <span>{data.contact.phone}</span>}
        {data.contact.location && <span>{data.contact.location}</span>}
        {data.contact.linkedin && <span>{data.contact.linkedin}</span>}
      </div>
    </div>
  );

  return (
    <div
      className="resume-a4-sheet bg-white text-slate-800 shadow-xl overflow-hidden print:shadow-none box-border text-[11px]"
      style={{
        width: '794px',
        minHeight: '1123px',
        fontFamily: fontFamily
      }}
    >
      {/* 1. SINGLE COLUMN LAYOUT (also ATS Plain) */}
      {template.layout === 'single-column' && (
        <div className="p-8">
          <HeaderComponent />
          <SummarySection />
          <ExperienceSection />
          <ProjectsSection />
          <EducationSection />
          <SkillsSection />
          <div className="grid grid-cols-2 gap-4">
            <LanguagesSection />
            <CertificationsSection />
          </div>
        </div>
      )}

      {/* 2. LEFT SIDEBAR LAYOUT */}
      {template.layout === 'left-sidebar' && (
        <div className="flex min-h-[1123px]">
          {/* Left Sidebar */}
          <div className="w-[240px] bg-slate-50 border-r border-slate-200 p-6 flex-shrink-0">
            {template.hasAvatar && !isAts && (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-sm mb-4 mx-auto"
                style={{ backgroundColor: activeAccent }}
              >
                {initials}
              </div>
            )}
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-800">Contact</h2>
              <ContactDetails inSidebar={true} />
            </div>
            <SkillsSection />
            <LanguagesSection />
            <CertificationsSection />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-7">
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {data.contact.full_name || 'Your Full Name'}
              </h1>
              {data.contact.job_title && (
                <p className="text-sm font-semibold mt-0.5" style={{ color: activeAccent }}>
                  {data.contact.job_title}
                </p>
              )}
            </div>
            <SummarySection />
            <ExperienceSection />
            <ProjectsSection />
            <EducationSection />
          </div>
        </div>
      )}

      {/* 3. RIGHT SIDEBAR LAYOUT */}
      {template.layout === 'right-sidebar' && (
        <div className="flex min-h-[1123px]">
          {/* Main Content */}
          <div className="flex-1 p-7">
            <div className="border-b border-slate-200 pb-3 mb-4">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {data.contact.full_name || 'Your Full Name'}
              </h1>
              {data.contact.job_title && (
                <p className="text-sm font-semibold mt-0.5" style={{ color: activeAccent }}>
                  {data.contact.job_title}
                </p>
              )}
            </div>
            <SummarySection />
            <ExperienceSection />
            <ProjectsSection />
            <EducationSection />
          </div>

          {/* Right Sidebar */}
          <div className="w-[240px] bg-slate-50 border-l border-slate-200 p-6 flex-shrink-0">
            {template.hasAvatar && !isAts && (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-sm mb-4 mx-auto"
                style={{ backgroundColor: activeAccent }}
              >
                {initials}
              </div>
            )}
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-800">Contact</h2>
              <ContactDetails inSidebar={true} />
            </div>
            <SkillsSection />
            <LanguagesSection />
            <CertificationsSection />
          </div>
        </div>
      )}

      {/* 4. BANNER + LEFT SIDEBAR */}
      {template.layout === 'banner-left-sidebar' && (
        <div className="min-h-[1123px]">
          <BannerHeaderComponent />
          <div className="flex">
            <div className="w-[230px] border-r border-slate-200 p-5 flex-shrink-0 bg-slate-50/50">
              <SkillsSection />
              <LanguagesSection />
              <CertificationsSection />
            </div>
            <div className="flex-1 p-6">
              <SummarySection />
              <ExperienceSection />
              <ProjectsSection />
              <EducationSection />
            </div>
          </div>
        </div>
      )}

      {/* 5. BANNER + RIGHT SIDEBAR */}
      {template.layout === 'banner-right-sidebar' && (
        <div className="min-h-[1123px]">
          <BannerHeaderComponent />
          <div className="flex">
            <div className="flex-1 p-6">
              <SummarySection />
              <ExperienceSection />
              <ProjectsSection />
              <EducationSection />
            </div>
            <div className="w-[230px] border-l border-slate-200 p-5 flex-shrink-0 bg-slate-50/50">
              <SkillsSection />
              <LanguagesSection />
              <CertificationsSection />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
