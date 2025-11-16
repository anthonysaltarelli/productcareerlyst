// Mock data for resume tool

export type ResumeVersion = {
  id: string;
  name: string;
  isMaster: boolean;
  lastModified: string;
};

export type Bullet = {
  id: string;
  content: string;
  isSelected: boolean;
  score: number;
  tags: string[];
  suggestions: string[];
  customizedFrom?: string; // ID of parent bullet if customized
};

export type Experience = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: Bullet[];
};

export type ContactInfo = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
};

export type Achievement = {
  id: string;
  achievement: string;
  displayOrder: number;
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  achievements: Achievement[];
};

export type Skills = {
  technical: string[];
  product: string[];
  soft: string[];
};

export type ResumeData = {
  contactInfo: ContactInfo;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: Skills;
};

export type Section = {
  id: string;
  type: string;
  title: string;
  icon: string;
  order: number;
  itemCount?: number;
};

export const resumeVersions: ResumeVersion[] = [
  {
    id: "master",
    name: "Master Resume",
    isMaster: true,
    lastModified: "2024-11-15",
  },
  {
    id: "google-pm",
    name: "Product Manager @ Google",
    isMaster: false,
    lastModified: "2024-11-14",
  },
  {
    id: "amazon-spm",
    name: "Senior PM @ Amazon",
    isMaster: false,
    lastModified: "2024-11-10",
  },
  {
    id: "microsoft-lead",
    name: "PM Lead @ Microsoft",
    isMaster: false,
    lastModified: "2024-11-05",
  },
];

export const sections: Section[] = [
  { id: "contact", type: "contact", title: "Contact Information", icon: "", order: 1 },
  { id: "summary", type: "summary", title: "Professional Summary", icon: "", order: 2 },
  { id: "experience", type: "experience", title: "Work Experience", icon: "", order: 3, itemCount: 3 },
  { id: "education", type: "education", title: "Education", icon: "", order: 4, itemCount: 2 },
  { id: "skills", type: "skills", title: "Skills", icon: "", order: 5 },
  { id: "certifications", type: "certifications", title: "Certifications", icon: "", order: 6 },
];

export const mockExperiences: Experience[] = [
  {
    id: "exp-1",
    title: "Senior Product Manager",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    startDate: "Jan 2020",
    endDate: "Present",
    bullets: [
      {
        id: "bullet-1-1",
        content: "Led cross-functional team of 12 engineers and designers to launch new mobile app feature, resulting in 45% increase in user engagement",
        isSelected: true,
        score: 92,
        tags: ["Leadership", "Product Launch", "Mobile"],
        suggestions: [
          "Consider adding the time frame for achieving the 45% increase",
          "Specify the type of mobile app feature for more context",
        ],
      },
      {
        id: "bullet-1-2",
        content: "Increased user engagement by 45% through data-driven product iterations and A/B testing of key features",
        isSelected: true,
        score: 88,
        tags: ["Metrics", "Growth", "A/B Testing"],
        suggestions: [
          "Add specific timeframe for the increase",
          "Mention number of A/B tests conducted",
        ],
      },
      {
        id: "bullet-1-3",
        content: "Managed $2M product budget and prioritized roadmap across 3 product lines",
        isSelected: false,
        score: 75,
        tags: ["Budget", "Finance", "Roadmap"],
        suggestions: [
          "Add impact or outcome of budget management",
          "Quantify the roadmap impact (e.g., delivered X features)",
          "Use stronger action verb like 'Directed' or 'Orchestrated'",
        ],
      },
      {
        id: "bullet-1-4",
        content: "Drove product strategy for B2B SaaS platform serving 500+ enterprise clients",
        isSelected: true,
        score: 82,
        tags: ["Strategy", "B2B", "Enterprise"],
        suggestions: [
          "Add specific outcome or growth metric",
          "Mention revenue impact if applicable",
        ],
      },
      {
        id: "bullet-1-5",
        content: "Collaborated with stakeholders to define product vision",
        isSelected: false,
        score: 58,
        tags: ["Stakeholders", "Vision"],
        suggestions: [
          "Replace 'Collaborated' with stronger action verb like 'Spearheaded' or 'Drove'",
          "Add quantifiable outcome",
          "Specify who the stakeholders were",
          "Add business impact",
        ],
      },
      {
        id: "bullet-1-6",
        content: "Implemented agile methodologies reducing development cycle time by 30% and increasing team velocity by 25%",
        isSelected: true,
        score: 90,
        tags: ["Agile", "Process Improvement", "Metrics"],
        suggestions: [
          "Consider adding team size for context",
        ],
      },
    ],
  },
  {
    id: "exp-2",
    title: "Product Manager",
    company: "StartupXYZ",
    location: "New York, NY",
    startDate: "Jun 2017",
    endDate: "Dec 2019",
    bullets: [
      {
        id: "bullet-2-1",
        content: "Launched MVP of consumer marketplace app that acquired 50K users in first 6 months with $0 marketing spend",
        isSelected: true,
        score: 95,
        tags: ["Launch", "Growth", "Consumer"],
        suggestions: [
          "Perfect! This bullet is excellent.",
        ],
      },
      {
        id: "bullet-2-2",
        content: "Conducted 100+ user interviews and synthesized insights to inform product roadmap decisions",
        isSelected: true,
        score: 85,
        tags: ["Research", "User Interviews", "Roadmap"],
        suggestions: [
          "Add outcome of the insights (what decisions were made)",
        ],
      },
      {
        id: "bullet-2-3",
        content: "Worked on improving the user onboarding flow",
        isSelected: false,
        score: 45,
        tags: ["Onboarding", "UX"],
        suggestions: [
          "Replace 'Worked on' with strong action verb like 'Redesigned' or 'Optimized'",
          "Add quantifiable impact (e.g., increased completion rate by X%)",
          "Be more specific about what improvements were made",
        ],
      },
      {
        id: "bullet-2-4",
        content: "Optimized user onboarding flow, increasing completion rate from 45% to 78% and reducing drop-off by 60%",
        isSelected: false,
        score: 93,
        tags: ["Onboarding", "Conversion", "Metrics"],
        suggestions: [
          "Excellent bullet! Consider adding timeframe.",
        ],
      },
    ],
  },
  {
    id: "exp-3",
    title: "Associate Product Manager",
    company: "BigTech Solutions",
    location: "Seattle, WA",
    startDate: "Jul 2015",
    endDate: "May 2017",
    bullets: [
      {
        id: "bullet-3-1",
        content: "Supported senior PM in launching 3 major product features for cloud infrastructure platform",
        isSelected: true,
        score: 70,
        tags: ["Cloud", "Infrastructure", "Support"],
        suggestions: [
          "Replace 'Supported' with more ownership-driven verb",
          "Add specific impact metrics",
          "Consider highlighting your specific contributions",
        ],
      },
      {
        id: "bullet-3-2",
        content: "Analyzed product metrics using SQL and created dashboards in Tableau to track KPIs across 5 product teams",
        isSelected: true,
        score: 86,
        tags: ["Analytics", "SQL", "Data Visualization"],
        suggestions: [
          "Add outcome or how insights influenced decisions",
        ],
      },
    ],
  },
];

export const mockContactInfo = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  phone: "(555) 123-4567",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/alexjohnson",
  portfolio: "alexjohnson.com",
};

export const mockSummary = "Results-driven Senior Product Manager with 8+ years of experience leading cross-functional teams to deliver innovative products that drive business growth. Proven track record of launching successful features that increased user engagement by 45% and revenue by $2M+. Expert in data-driven decision making, agile methodologies, and stakeholder management.";

export const mockJobDescription = `Senior Product Manager - Google

We're looking for an experienced Product Manager to lead our mobile app initiatives. 

Key Responsibilities:
- Define product strategy and roadmap for mobile platform
- Lead cross-functional teams including engineering, design, and data science
- Drive A/B testing and experimentation to optimize user experience
- Analyze product metrics and user behavior to inform decisions
- Collaborate with stakeholders across the organization

Requirements:
- 5+ years of product management experience
- Strong analytical skills with SQL proficiency
- Experience with agile methodologies and scrum
- Track record of launching successful mobile products
- Excellent communication and stakeholder management skills
- Data-driven decision making approach
- Experience with OKRs and KPI frameworks

Nice to Have:
- Experience with consumer products at scale
- Technical background or CS degree
- Experience with growth and monetization strategies`;

export const mockKeywords = [
  { keyword: "Product Management", count: 3, found: true },
  { keyword: "Cross-functional teams", count: 2, found: true },
  { keyword: "A/B testing", count: 2, found: true },
  { keyword: "Agile methodologies", count: 2, found: true },
  { keyword: "SQL", count: 1, found: true },
  { keyword: "Stakeholder management", count: 1, found: true },
  { keyword: "Data-driven", count: 1, found: true },
  { keyword: "Mobile products", count: 1, found: true },
  { keyword: "OKRs", count: 0, found: false },
  { keyword: "KPI frameworks", count: 0, found: false },
  { keyword: "Growth strategies", count: 0, found: false },
  { keyword: "Monetization", count: 0, found: false },
];

export const mockEducation = [
  {
    id: "edu-1",
    school: "Stanford University",
    degree: "Master of Business Administration (MBA)",
    field: "Business Administration",
    location: "Stanford, CA",
    startDate: "Sep 2013",
    endDate: "Jun 2015",
    gpa: "3.8",
    achievements: [
      { id: "ach-1", achievement: "Dean's List all quarters", displayOrder: 0 },
      { id: "ach-2", achievement: "Product Management Club President", displayOrder: 1 },
    ],
  },
  {
    id: "edu-2",
    school: "University of California, Berkeley",
    degree: "Bachelor of Science (BS)",
    field: "Computer Science",
    location: "Berkeley, CA",
    startDate: "Aug 2009",
    endDate: "May 2013",
    gpa: "3.7",
    achievements: [
      { id: "ach-3", achievement: "Graduated with Honors", displayOrder: 0 },
      { id: "ach-4", achievement: "Tau Beta Pi Engineering Honor Society", displayOrder: 1 },
    ],
  },
];

export const mockSkills = {
  technical: [
    "SQL",
    "Python",
    "Tableau",
    "Google Analytics",
    "Mixpanel",
    "A/B Testing",
    "API Design",
    "Agile/Scrum",
  ],
  product: [
    "Product Strategy",
    "Roadmap Planning",
    "User Research",
    "Data Analysis",
    "Wireframing",
    "PRD Writing",
    "Stakeholder Management",
    "OKRs & KPIs",
  ],
  soft: [
    "Leadership",
    "Cross-functional Collaboration",
    "Communication",
    "Problem Solving",
    "Strategic Thinking",
    "Negotiation",
  ],
};

export const mockResumeScore = {
  overall: 85,
  actionVerbs: 90,
  accomplishments: 85,
  quantification: 80,
  impact: 85,
  conciseness: 80,
  atsCompatibility: "Good",
  pageCount: 1,
  recommendedPageCount: 1,
};

// Resume styling configuration
export type ResumeStyles = {
  fontFamily: 
    // Web-safe fonts
    | 'Arial' 
    | 'Georgia' 
    | 'Times New Roman' 
    | 'Trebuchet MS' 
    | 'Verdana' 
    | 'Helvetica'
    // Google Fonts
    | 'Inter'
    | 'Lato'
    | 'Roboto'
    | 'Open Sans'
    | 'Source Sans 3'
    | 'PT Serif'
    | 'Crimson Text';
  fontSize: number; // base font size in px
  lineHeight: number; // line height multiplier
  marginTop: number; // in inches
  marginBottom: number; // in inches
  marginLeft: number; // in inches
  marginRight: number; // in inches
  accentColor: string; // hex color for headings/accents
  headingColor: string; // hex color for section headings
  textColor: string; // hex color for body text
};

export const defaultResumeStyles: ResumeStyles = {
  fontFamily: 'Arial',
  fontSize: 11,
  lineHeight: 1.15,
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.75,
  marginRight: 0.75,
  accentColor: '#000000', // black
  headingColor: '#000000', // black
  textColor: '#000000', // black
};

// Resume fonts - alphabetical order
export const resumeFonts = [
  { name: 'Arial' as const },
  { name: 'Crimson Text' as const },
  { name: 'Georgia' as const },
  { name: 'Helvetica' as const },
  { name: 'Inter' as const },
  { name: 'Lato' as const },
  { name: 'Open Sans' as const },
  { name: 'PT Serif' as const },
  { name: 'Roboto' as const },
  { name: 'Source Sans 3' as const },
  { name: 'Times New Roman' as const },
  { name: 'Trebuchet MS' as const },
  { name: 'Verdana' as const },
];

