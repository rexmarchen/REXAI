// Canonical skill dictionary + extractor. Boundaries survive "C++", "Node.js".
export const SKILLS: Record<string, string[]> = {
  "JavaScript": ["javascript", "js", "es6"], "TypeScript": ["typescript"],
  "React": ["react", "reactjs", "react.js"], "Next.js": ["next.js", "nextjs"],
  "Node.js": ["node.js", "nodejs", "node"], "HTML/CSS": ["html", "css", "html5", "css3"],
  "Tailwind CSS": ["tailwind"], "Python": ["python"], "Java": ["java"], "C++": ["c++"],
  "SQL": ["sql", "mysql", "postgresql", "postgres"], "MongoDB": ["mongodb"],
  "Git": ["git", "github"], "REST APIs": ["rest api", "restful", "rest apis"],
  "Django": ["django"], "Flask": ["flask"], "Docker": ["docker"],
  "Excel": ["excel", "advanced excel"], "Power BI": ["power bi", "powerbi"], "Tableau": ["tableau"],
  "Pandas": ["pandas"], "NumPy": ["numpy"], "Machine Learning": ["machine learning", "scikit-learn"],
  "Statistics": ["statistics", "statistical"], "Data Visualization": ["data visualization", "matplotlib"],
  "SEO": ["seo"], "Content Writing": ["content writing", "copywriting"],
  "Social Media Marketing": ["social media"], "Google Analytics": ["google analytics", "ga4"],
  "Email Marketing": ["email marketing"], "Canva": ["canva"],
  "Figma": ["figma"], "UI/UX": ["ui/ux", "ux", "ui design", "user research", "wireframing"],
  "Adobe Photoshop": ["photoshop"], "Adobe Illustrator": ["illustrator"],
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
const MATCHERS = Object.entries(SKILLS).map(([name, aliases]) => ({
  name,
  re: new RegExp(`(?<![\\w+#.])(?:${aliases.map(esc).join("|")})(?![\\w+#])`, "i"),
}));

export const extractSkills = (text: string): string[] =>
  MATCHERS.filter((m) => m.re.test(text)).map((m) => m.name);

export const canonicalSkill = (input: string): string | null =>
  extractSkills(input.trim())[0] ?? null;
