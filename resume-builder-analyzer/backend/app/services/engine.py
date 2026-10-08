import re
from typing import List, Dict, Tuple, Optional
from collections import Counter
from app.schemas import Issue, CategoryScore, AnalysisResult, JobMatchDetails
from app.services.parser import ParsedResume, ParsedDateRange
from app.services.taxonomy import SkillsTaxonomy

# Curated Action Verbs
STRONG_ACTION_VERBS = {
    "accelerated", "achieved", "acquired", "administered", "advanced", "advised", "allocated",
    "analyzed", "architected", "assembled", "authored", "automated", "boosted", "budgeted",
    "built", "calculated", "championed", "collaborated", "compiled", "composed", "conceived",
    "conducted", "consolidated", "constructed", "consulted", "controlled", "converted", "coordinated",
    "created", "cultivated", "customized", "decreased", "delivered", "deployed", "designed",
    "developed", "devised", "diagnosed", "directed", "discovered", "dispatched", "drafted",
    "drove", "eliminated", "enabled", "enacted", "engineered", "enhanced", "established",
    "evaluated", "executed", "expanded", "expedited", "fabricated", "facilitated", "forecasted",
    "formulated", "fostered", "founded", "generated", "governed", "guided", "halted",
    "headed", "hired", "identified", "implemented", "improved", "increased", "indexed",
    "initiated", "innovated", "inspected", "installed", "instituted", "instructed", "integrated",
    "introduced", "invented", "investigated", "launched", "lead", "led", "leveraged",
    "managed", "maximized", "measured", "mediated", "mentored", "migrated", "minimized",
    "modernized", "negotiated", "optimized", "orchestrated", "organized", "overhauled", "oversaw",
    "performed", "pioneered", "planned", "prepared", "produced", "programmed", "promoted",
    "published", "rebuilt", "redesigned", "reduced", "refined", "refactored", "regulated",
    "remodeled", "reorganized", "replaced", "resolved", "restructured", "revamped", "reviewed",
    "revitalized", "saved", "scaled", "scheduled", "secured", "simplified", "spearheaded",
    "standardized", "steered", "streamlined", "strengthened", "structured", "supervised", "surpassed",
    "systematized", "tested", "tracked", "trained", "transformed", "unified", "upgraded", "validated"
}

WEAK_PHRASES = [
    ("responsible for", "Replace with a direct action verb (e.g., 'Led', 'Managed', 'Engineered') and state the measurable outcome."),
    ("duties included", "Use active phrasing stating what you delivered rather than duties assigned."),
    ("worked on", "Specify your exact contribution and impact (e.g., 'Developed feature X resulting in Y')."),
    ("assisted with", "Clarify your individual ownership and measurable portion of the initiative."),
    ("helped to", "Use a stronger action verb showing leadership or execution (e.g., 'Coordinated', 'Co-authored')."),
    ("tasked with", "State what you proactively accomplished rather than passive assignment."),
    ("familiar with", "Demonstrate practical application and depth of experience with the skill."),
    ("participated in", "Detail your specific role and tangible achievements within the group.")
]

BUZZWORDS = [
    ("synergy", "Replace corporate jargon with concrete business results or process improvements."),
    ("think outside the box", "Highlight innovative solutions or creative problem-solving examples instead of clichés."),
    ("go-getter", "Showcase proactive accomplishments, initiative, and quantifiable career growth."),
    ("team player", "Provide specific examples of cross-functional collaboration and mentorship."),
    ("hard worker", "Demonstrate your dedication through output, consistency, and completed milestones."),
    ("results-driven", "Lead with actual metrics, revenue impact, or performance figures."),
    ("detail-oriented", "Demonstrate precision through high-quality projects, zero-defect deliverables, or audits."),
    ("rockstar", "Maintain professional, industry-standard language."),
    ("ninja", "Use standard professional titles that ATS keyword filters recognize.")
]

FIRST_PERSON_PRONOUNS = ["i", "me", "my", "myself", "we", "our", "ours", "us"]

def get_grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"

def get_status(score: float) -> str:
    if score >= 85: return "Excellent"
    if score >= 70: return "Good"
    if score >= 50: return "Needs Improvement"
    return "Critical"

class AnalyzerEngine:
    """Deterministic scoring engine enforcing explainability for every deducted point."""
    
    def __init__(self):
        self.taxonomy = SkillsTaxonomy.get_instance()

    def analyze(self, resume: ParsedResume, job_description: Optional[str] = None) -> AnalysisResult:
        has_jd = bool(job_description and job_description.strip())
        
        # 1. ATS Compatibility (Base weight 20%)
        ats_score, ats_issues = self._check_ats(resume)
        
        # 2. Content Quality (Base weight 25%)
        content_score, content_issues = self._check_content_quality(resume)
        
        # 3. Job Match (Base weight 25% if JD given, else 0%)
        if has_jd:
            job_match_details = self.taxonomy.match_job_description(resume.raw_text, job_description)
            job_score, job_issues = self._check_job_match(job_match_details)
        else:
            job_match_details = JobMatchDetails(matched_skills=[], missing_skills=[], coverage=100.0, similarity=100.0)
            job_score = 100.0
            job_issues = []
            
        # 4. Structure (Base weight 10%)
        structure_score, structure_issues = self._check_structure(resume)
        
        # 5. Language (Base weight 10%)
        language_score, language_issues = self._check_language(resume)
        
        # 6. Format (Base weight 10%)
        format_score, format_issues = self._check_format(resume)
        
        # Weights renormalization
        if has_jd:
            weights = {
                "ATS Compatibility": 0.20,
                "Content Quality": 0.25,
                "Job Match": 0.25,
                "Structure": 0.10,
                "Language": 0.10,
                "Format": 0.10
            }
        else:
            # Renormalize among the remaining 5 categories (sum = 0.75)
            weights = {
                "ATS Compatibility": round(0.20 / 0.75, 4), # ~0.2667
                "Content Quality": round(0.25 / 0.75, 4),   # ~0.3333
                "Structure": round(0.10 / 0.75, 4),         # ~0.1333
                "Language": round(0.10 / 0.75, 4),          # ~0.1333
                "Format": round(0.10 / 0.75, 4)             # ~0.1333
            }

        category_scores: Dict[str, CategoryScore] = {
            "ATS Compatibility": CategoryScore(
                score=round(ats_score, 1),
                weight=weights["ATS Compatibility"],
                status=get_status(ats_score),
                issues_count=len(ats_issues)
            ),
            "Content Quality": CategoryScore(
                score=round(content_score, 1),
                weight=weights["Content Quality"],
                status=get_status(content_score),
                issues_count=len(content_issues)
            ),
            "Structure": CategoryScore(
                score=round(structure_score, 1),
                weight=weights["Structure"],
                status=get_status(structure_score),
                issues_count=len(structure_issues)
            ),
            "Language": CategoryScore(
                score=round(language_score, 1),
                weight=weights["Language"],
                status=get_status(language_score),
                issues_count=len(language_issues)
            ),
            "Format": CategoryScore(
                score=round(format_score, 1),
                weight=weights["Format"],
                status=get_status(format_score),
                issues_count=len(format_issues)
            )
        }
        
        if has_jd:
            category_scores["Job Match"] = CategoryScore(
                score=round(job_score, 1),
                weight=weights["Job Match"],
                status=get_status(job_score),
                issues_count=len(job_issues)
            )
            
        # Calculate overall score deterministically
        overall = sum(category_scores[cat].score * weights[cat] for cat in weights)
        overall_score = max(0.0, min(100.0, round(overall, 1)))
        
        all_issues = ats_issues + content_issues + (job_issues if has_jd else []) + structure_issues + language_issues + format_issues
        
        # Sort issues: high severity first, then medium, then low
        severity_order = {"high": 0, "medium": 1, "low": 2}
        sorted_issues = sorted(all_issues, key=lambda x: severity_order.get(x.severity, 3))
        
        return AnalysisResult(
            overall_score=overall_score,
            grade=get_grade(overall_score),
            category_scores=category_scores,
            issues=sorted_issues,
            job_match=job_match_details,
            pages=resume.pages,
            word_count=resume.word_count,
            sections_found=list(resume.sections.keys()),
            ai_analysis=None
        )

    def _check_ats(self, resume: ParsedResume) -> Tuple[float, List[Issue]]:
        score = 100.0
        issues: List[Issue] = []
        
        # 1. Scanned check
        if resume.is_scanned:
            score -= 50.0
            issues.append(Issue(
                category="ATS Compatibility",
                severity="high",
                message="Resume appears to be a scanned image or has unreadable text layers.",
                concrete_fix="Save or export your resume directly as a clean PDF or DOCX file with selectable text rather than a scan or raster image.",
                evidence=f"Extracted word count: {resume.word_count} words across {resume.pages} page(s).",
                penalty=50.0
            ))
            
        # 2. Multi-column layout
        if resume.is_multi_column:
            score -= 20.0
            issues.append(Issue(
                category="ATS Compatibility",
                severity="high",
                message="Multi-column layout detected.",
                concrete_fix="Switch to a clean single-column format or ensure chronological sections are not placed side-by-side. ATS parsers frequently merge columns left-to-right, garbling sentences.",
                evidence="Multiple parallel text columns detected across document coordinates.",
                penalty=20.0
            ))
            
        # 3. Tables
        if resume.has_tables:
            score -= 15.0
            issues.append(Issue(
                category="ATS Compatibility",
                severity="medium",
                message="Embedded tables detected.",
                concrete_fix="Convert tabular data into standard bullet points and left-aligned text blocks. Many older ATS software engines ignore table contents.",
                evidence="Document contains table grid elements.",
                penalty=15.0
            ))
            
        # 4. Images
        if resume.has_images:
            score -= 10.0
            issues.append(Issue(
                category="ATS Compatibility",
                severity="low",
                message="Embedded graphic images or icons detected.",
                concrete_fix="Remove non-essential graphics, photos, or icon symbols. ATS parsers cannot read images and they may cause parsing errors.",
                evidence="Document contains graphic image objects.",
                penalty=10.0
            ))
            
        # 5. Standard Headings
        sec_names = set(resume.sections.keys())
        expected_headings = [("experience", "Work Experience"), ("education", "Education"), ("skills", "Skills")]
        for key, label in expected_headings:
            if key not in sec_names:
                score -= 10.0
                issues.append(Issue(
                    category="ATS Compatibility",
                    severity="high",
                    message=f"Missing standard '{label}' heading.",
                    concrete_fix=f"Include a clearly designated '{label}' section heading with standard wording so ATS scanners can categorize your career history.",
                    evidence=f"Sections identified: {', '.join(sec_names) if sec_names else 'None'}",
                    penalty=10.0
                ))

        # 6. Keyword volume check
        if resume.word_count < 120:
            score -= 25.0
            issues.append(Issue(
                category="ATS Compatibility",
                severity="high",
                message="Insufficient text volume for ATS keyword matching (< 120 words).",
                concrete_fix="Expand your resume with detailed project and work bullet points so ATS keyword extractors can discover your skills.",
                evidence=f"Only {resume.word_count} words found.",
                penalty=25.0
            ))
                
        return max(0.0, score), issues

    def _check_content_quality(self, resume: ParsedResume) -> Tuple[float, List[Issue]]:
        score = 100.0
        issues: List[Issue] = []
        bullets = resume.bullet_points
        
        if not bullets:
            score -= 40.0
            issues.append(Issue(
                category="Content Quality",
                severity="high",
                message="No bullet points detected in work experience or projects.",
                concrete_fix="Structure your professional achievements into clear, distinct bullet points rather than dense paragraphs.",
                evidence="Zero bullet points identified.",
                penalty=40.0
            ))
            return max(0.0, score), issues

        total_bullets = len(bullets)
        
        # 1. Action verbs at start of bullets
        action_verb_count = 0
        weak_bullet_samples = []
        
        for b in bullets:
            first_word = re.findall(r'^[A-Za-z]+', b.strip())
            if first_word:
                word = first_word[0].lower()
                if word in STRONG_ACTION_VERBS:
                    action_verb_count += 1
                else:
                    if len(weak_bullet_samples) < 2:
                        weak_bullet_samples.append(b[:70] + "...")
                        
        action_verb_ratio = action_verb_count / total_bullets
        if action_verb_ratio < 0.60:
            penalty = round((0.80 - action_verb_ratio) * 35.0, 1)
            score -= penalty
            issues.append(Issue(
                category="Content Quality",
                severity="high" if action_verb_ratio < 0.40 else "medium",
                message=f"Only {int(action_verb_ratio * 100)}% of bullets begin with strong action verbs (target: 80%+).",
                concrete_fix="Begin every bullet point with an assertive past-tense verb such as 'Architected', 'Spearheaded', 'Optimized', or 'Delivered'.",
                evidence=f"Example bullet lacking action verb: '{weak_bullet_samples[0]}'" if weak_bullet_samples else "Bullets do not start with recognized action verbs.",
                penalty=penalty
            ))

        # 2. Measurable results (metrics, numbers, %, $)
        metric_pattern = r'(\b\d+(\.\d+)?%|\$\d+[\d,]*(\.\d+)?|\b\d+x\b|\b\d{1,3}(,\d{3})+\b|\b\d+\+\b|\b\d+\s*(users|clients|customers|engineers|team members|requests|ms|seconds|minutes|hours|days|weeks|months|years|fold))'
        measurable_count = sum(1 for b in bullets if re.search(metric_pattern, b, re.IGNORECASE))
        measurable_ratio = measurable_count / total_bullets
        
        if measurable_ratio < 0.40:
            penalty = round((0.50 - measurable_ratio) * 30.0, 1)
            score -= penalty
            issues.append(Issue(
                category="Content Quality",
                severity="high" if measurable_ratio < 0.20 else "medium",
                message=f"Only {int(measurable_ratio * 100)}% of bullets include quantifiable metrics or measurable results.",
                concrete_fix="Add hard numbers, percentages, dollar amounts, time saved, or scale metrics to demonstrate the tangible business impact of your work.",
                evidence=f"{measurable_count} out of {total_bullets} bullets contain numerical impact.",
                penalty=penalty
            ))

        # 3. Weak phrases
        raw_text_lower = resume.raw_text.lower()
        for phrase, fix in WEAK_PHRASES:
            if phrase in raw_text_lower:
                score -= 4.0
                # Find matching context
                idx = raw_text_lower.find(phrase)
                snippet = resume.raw_text[max(0, idx - 15):min(len(resume.raw_text), idx + len(phrase) + 30)].strip()
                issues.append(Issue(
                    category="Content Quality",
                    severity="medium",
                    message=f"Weak, passive phrasing found: '{phrase}'.",
                    concrete_fix=fix,
                    evidence=f"...{snippet}...",
                    penalty=4.0
                ))

        # 4. Overly long bullets
        long_bullets = [b for b in bullets if len(b.split()) > 38]
        if long_bullets:
            penalty = min(12.0, len(long_bullets) * 3.0)
            score -= penalty
            issues.append(Issue(
                category="Content Quality",
                severity="low",
                message=f"{len(long_bullets)} bullet point(s) are excessively lengthy and hard to scan.",
                concrete_fix="Condense bullets to 15-25 words. Keep each bullet focused on a single key achievement following the 'Accomplished [X], measured by [Y], by doing [Z]' formula.",
                evidence=f"Example: '{long_bullets[0][:80]}...'",
                penalty=penalty
            ))

        return max(0.0, score), issues

    def _check_job_match(self, job_match: JobMatchDetails) -> Tuple[float, List[Issue]]:
        # Composite of skill coverage (70%) and keyword similarity (30%)
        composite = (job_match.coverage * 0.70) + (job_match.similarity * 0.30)
        score = round(composite, 1)
        issues: List[Issue] = []
        
        if job_match.missing_skills:
            top_missing = job_match.missing_skills[:6]
            penalty = round(100.0 - score, 1)
            severity = "high" if job_match.coverage < 50 else ("medium" if job_match.coverage < 75 else "low")
            issues.append(Issue(
                category="Job Match",
                severity=severity,
                message=f"Missing key skills demanded by the target job description: {', '.join(top_missing)}.",
                concrete_fix=f"If you possess experience with {', '.join(top_missing)}, naturally incorporate them into your Skills, Experience, and Project sections.",
                evidence=f"Skill coverage is currently {job_match.coverage}% ({len(job_match.matched_skills)} matched, {len(job_match.missing_skills)} missing).",
                penalty=penalty
            ))
            
        return max(0.0, min(100.0, score)), issues

    def _check_structure(self, resume: ParsedResume) -> Tuple[float, List[Issue]]:
        score = 100.0
        issues: List[Issue] = []
        
        # 1. Contact info
        if not resume.emails:
            score -= 15.0
            issues.append(Issue(
                category="Structure",
                severity="high",
                message="No professional email address detected.",
                concrete_fix="Add a clean, clickable email address at the top of your resume header.",
                evidence="Email address missing.",
                penalty=15.0
            ))
            
        if not resume.phones:
            score -= 10.0
            issues.append(Issue(
                category="Structure",
                severity="medium",
                message="No phone number detected.",
                concrete_fix="Add a direct phone number formatted with standard country/area code in the header.",
                evidence="Phone number missing.",
                penalty=10.0
            ))
            
        has_linkedin = any("linkedin" in link.lower() for link in resume.links)
        if not has_linkedin:
            score -= 5.0
            issues.append(Issue(
                category="Structure",
                severity="low",
                message="No LinkedIn profile link provided.",
                concrete_fix="Add a customized LinkedIn URL (e.g. linkedin.com/in/yourname) so recruiters can verify your professional network.",
                evidence="LinkedIn URL missing from contact info.",
                penalty=5.0
            ))

        # 2. Summary
        if "summary" not in resume.sections:
            score -= 10.0
            issues.append(Issue(
                category="Structure",
                severity="low",
                message="Professional summary section missing.",
                concrete_fix="Add a brief 2-3 sentence executive summary highlighting your years of experience, core expertise, and standout career impact.",
                evidence="Summary/Profile section not detected.",
                penalty=10.0
            ))

        # 3. Chronological ordering and gaps
        dates = resume.date_ranges
        if len(dates) >= 2:
            # Check chronological order (should be descending / reverse chronological)
            prev_year = 9999
            is_reverse_chronological = True
            for d in dates:
                d_yr = d.end_year or d.start_year or 0
                if d_yr > prev_year + 1: # generous margin
                    is_reverse_chronological = False
                    break
                prev_year = d_yr

            if not is_reverse_chronological:
                score -= 10.0
                issues.append(Issue(
                    category="Structure",
                    severity="medium",
                    message="Work history does not follow a strict reverse-chronological order.",
                    concrete_fix="Position your most recent employment role at the very top of Experience, with older roles following in descending order.",
                    evidence=f"Date sequences detected: {[d.raw_text for d in dates[:4]]}",
                    penalty=10.0
                ))

            # Check employment gaps > 6 months
            # Sort dated experiences descending
            sorted_dates = sorted(dates, key=lambda x: (x.start_year or 0, x.start_month or 0), reverse=True)
            for i in range(len(sorted_dates) - 1):
                cur_item = sorted_dates[i]
                next_item = sorted_dates[i + 1] # older
                if cur_item.start_year and next_item.end_year:
                    # gap in months = (cur_item.start_year * 12 + cur_item.start_month) - (next_item.end_year * 12 + next_item.end_month)
                    cur_mo = (cur_item.start_year * 12) + (cur_item.start_month or 1)
                    next_mo = (next_item.end_year * 12) + (next_item.end_month or 12)
                    gap_months = cur_mo - next_mo
                    if gap_months > 6:
                        score -= 8.0
                        issues.append(Issue(
                            category="Structure",
                            severity="medium",
                            message=f"Employment gap of approximately {gap_months} months detected between positions.",
                            concrete_fix="If you took time for education, certifications, freelance consulting, or personal projects, include an entry to account for the gap.",
                            evidence=f"Gap between '{next_item.raw_text}' and '{cur_item.raw_text}'",
                            penalty=8.0
                        ))
                        break # Flag max 1 gap issue to avoid stacking excessive penalties

        return max(0.0, score), issues

    def _check_language(self, resume: ParsedResume) -> Tuple[float, List[Issue]]:
        score = 100.0
        issues: List[Issue] = []
        raw_text_lower = resume.raw_text.lower()
        
        # 1. First-person pronouns
        found_pronouns = []
        for p in FIRST_PERSON_PRONOUNS:
            pattern = r'\b' + re.escape(p) + r'\b'
            matches = re.findall(pattern, raw_text_lower)
            if matches:
                found_pronouns.append(p)
                
        if found_pronouns:
            penalty = min(20.0, len(found_pronouns) * 5.0)
            score -= penalty
            issues.append(Issue(
                category="Language",
                severity="medium",
                message=f"First-person pronouns used in resume text ({', '.join(found_pronouns)}).",
                concrete_fix="Resumes should be written in an implied third-person, telegraphic style. Remove words like 'I', 'me', and 'my' in favor of direct verb statements.",
                evidence=f"Detected pronouns: {', '.join(found_pronouns)}",
                penalty=penalty
            ))

        # 2. Buzzwords
        found_buzzwords = []
        for word, fix in BUZZWORDS:
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, raw_text_lower):
                found_buzzwords.append((word, fix))
                
        if found_buzzwords:
            penalty = min(15.0, len(found_buzzwords) * 4.0)
            score -= penalty
            bw_names = [b[0] for b in found_buzzwords]
            issues.append(Issue(
                category="Language",
                severity="low",
                message=f"Overused clichés or buzzwords found: {', '.join(bw_names)}.",
                concrete_fix=found_buzzwords[0][1],
                evidence=f"Detected buzzwords: {', '.join(bw_names)}",
                penalty=penalty
            ))

        # 3. Repeated bullet openers
        bullets = resume.bullet_points
        if len(bullets) >= 4:
            first_words = []
            for b in bullets:
                m = re.match(r'^[A-Za-z]+', b.strip())
                if m:
                    first_words.append(m.group(0).lower())
            
            counts = Counter(first_words)
            overused = [word for word, count in counts.items() if count >= 3]
            if overused:
                penalty = min(12.0, len(overused) * 4.0)
                score -= penalty
                issues.append(Issue(
                    category="Language",
                    severity="low",
                    message=f"Repetitive bullet sentence starters: '{overused[0]}' used {counts[overused[0]]} times.",
                    concrete_fix="Vary your vocabulary. Use synonyms like 'Engineered', 'Orchestrated', 'Implemented', or 'Established' to keep the content engaging.",
                    evidence=f"'{overused[0]}' is repeated across multiple bullets.",
                    penalty=penalty
                ))

        return max(0.0, score), issues

    def _check_format(self, resume: ParsedResume) -> Tuple[float, List[Issue]]:
        score = 100.0
        issues: List[Issue] = []
        
        # 1. Word count (ideal: 250 - 1000 words)
        words = resume.word_count
        if words < 120:
            score -= 40.0
            issues.append(Issue(
                category="Format",
                severity="high",
                message=f"Resume is too brief and severely truncated ({words} words).",
                concrete_fix="A standard professional resume should contain between 350 and 800 words with thorough detail on past accomplishments, tech stacks, and metrics.",
                evidence=f"Current word count: {words} words.",
                penalty=40.0
            ))
        elif words < 250:
            score -= 25.0
            issues.append(Issue(
                category="Format",
                severity="high",
                message=f"Resume is too brief ({words} words).",
                concrete_fix="A standard professional resume should contain between 350 and 800 words with thorough detail on past accomplishments, tech stacks, and metrics.",
                evidence=f"Current word count: {words} words.",
                penalty=25.0
            ))
        elif words > 1100:
            score -= 15.0
            issues.append(Issue(
                category="Format",
                severity="medium",
                message=f"Resume is overly verbose ({words} words).",
                concrete_fix="Trim older experience entries and distill bullet points down to maintain a concise, high-impact document under 1,000 words.",
                evidence=f"Current word count: {words} words.",
                penalty=15.0
            ))

        # 2. Pages count
        if resume.pages > 2:
            penalty = min(30.0, (resume.pages - 2) * 15.0)
            score -= penalty
            issues.append(Issue(
                category="Format",
                severity="medium",
                message=f"Resume spans {resume.pages} pages. Ideal length is 1 to 2 pages.",
                concrete_fix="Recruiters typically spend less than 10 seconds reviewing a resume. Condense your text into a tightly-edited 1-page or 2-page format.",
                evidence=f"Detected {resume.pages} pages.",
                penalty=penalty
            ))

        return max(0.0, score), issues
