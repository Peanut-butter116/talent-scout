/**
 * One-line description + 3–5 example phrases per criterion. Used by evidence extraction to
 * match pasted profile text, and shown as hints. Keyed by criterion id.
 */
export const CRITERION_TEXT: Record<string, { description: string; examples: string[] }> = {
  // Founding AI Engineer
  ai_model: {
    description: 'Designs and trains models from scratch, beyond fine-tuning existing ones.',
    examples: ['trained a transformer model from scratch', 'designed the model architecture', 'built a custom neural network for speech', 'pre-trained an encoder on our own data'],
  },
  ai_rt: {
    description: 'Real-time speech, translation or low-latency inference experience.',
    examples: ['streaming speech recognition with low latency', 'real-time translation system', 'cut inference latency to under 200ms', 'on-device speech model', 'text-to-speech in production'],
  },
  ai_pedigree: {
    description: 'Worked at a top research lab or an early-stage AI team.',
    examples: ['research scientist at a leading AI lab', 'early engineer at an AI startup', 'first ML hire at a seed-stage company', 'published at NeurIPS or ICML'],
  },
  ai_judgement: {
    description: 'Makes sound calls on hard-to-reverse technical decisions.',
    examples: ['wrote the build vs buy decision', 'chose the architecture and explained the trade-offs', 'planned a migration with a rollback path', 'decided which model to bet on'],
  },
  ai_builder: {
    description: 'Has built or shipped something real, not only maintained it.',
    examples: ['built and shipped a product used by thousands', 'launched an open-source project', 'took a prototype to production', 'side project with real users'],
  },
  ai_sharp: {
    description: 'Energised by hard, ambiguous problems; gets to the point.',
    examples: ['loves hard ambiguous problems', 'writes short clear technical posts', 'curious about how things work', 'asks sharp questions'],
  },
  ai_ego: {
    description: 'Here to build, not to be seen building; changes mind on good reasoning.',
    examples: ['credits the team', 'changed my mind after a colleague’s benchmark', 'mentors others quietly', 'happy to do unglamorous work'],
  },
  // Full Stack Engineer
  fs_backend: {
    description: 'Deep backend experience: APIs, databases, scale and reliability.',
    examples: ['designed a REST API handling millions of requests', 'Postgres schema and query optimisation', 'built backend services in Go or Python', 'scaled a websocket server'],
  },
  fs_builder: {
    description: 'Side projects, hackathons and things built outside class or work.',
    examples: ['won a hackathon', 'built a side project with paying users', 'maintains an open-source tool', 'weekend project used by hundreds'],
  },
  fs_versatile: {
    description: 'Comfortable across frontend, backend and AI features.',
    examples: ['built the React frontend and the backend', 'shipped an AI feature end to end', 'integrated an LLM into a web app', 'full-stack TypeScript'],
  },
  fs_pedigree: {
    description: 'A top-of-field signal such as honours or an equivalent achievement.',
    examples: ['first-class honours degree', 'top of my cohort', 'programming contest finalist', 'university prize'],
  },
  fs_independent: {
    description: 'Figures things out alone and unblocks themselves.',
    examples: ['taught myself a new language to fix a bug', 'worked independently with little guidance', 'figured it out from the docs', 'owned the project solo'],
  },
  fs_sharp: {
    description: 'Energised by hard problems; clear and to the point.',
    examples: ['curious about hard problems', 'writes clear bug reports', 'asks good questions', 'short clear README'],
  },
  fs_ego: {
    description: 'Low ego: credits others and takes feedback well.',
    examples: ['takes feedback well', 'credits contributors', 'helps teammates', 'changed approach after review'],
  },
  // Head of Engineering
  he_builder: {
    description: 'Has shipped impactful products, not only managed them.',
    examples: ['shipped a product used by thousands of customers', 'built the platform from zero', 'led the launch of a new product', 'took a product from idea to revenue'],
  },
  he_scale: {
    description: 'Has scaled architecture and teams as a company grew.',
    examples: ['grew the engineering team from 5 to 50', 'scaled the architecture to millions of users', 'hired and managed engineering managers', 'split a monolith into services'],
  },
  he_hands: {
    description: 'Still hands-on across the stack and AI.',
    examples: ['still write code every week', 'hands-on across backend, frontend and ML', 'built the first version myself', 'review and ship code'],
  },
  he_rt: {
    description: 'Real-time audio or developer-facing API platform experience.',
    examples: ['built a real-time audio platform', 'WebRTC voice infrastructure', 'public developer API with SDKs', 'low-latency media streaming'],
  },
  he_first: {
    description: 'Thinks from first principles and makes the complex simple.',
    examples: ['simplified the architecture', 'removed unnecessary services', 'first-principles design review', 'cut complexity and cost'],
  },
  he_sharp: {
    description: 'Curious and direct.',
    examples: ['curious about hard problems', 'clear, direct writing', 'asks the question behind the question'],
  },
  he_ego: {
    description: 'Gives credit to the team; open to being wrong.',
    examples: ['gives credit to the team', 'open to being wrong', 'servant leader'],
  },
  // Business Operations
  bo_builder: {
    description: 'Turns repeated tasks into systems that keep working.',
    examples: ['automated a manual process', 'built a system to track suppliers', 'replaced spreadsheets with an automated workflow', 'set up onboarding that runs itself'],
  },
  bo_process: {
    description: 'Owns processes end to end; 4–6 years in consulting or startup operations.',
    examples: ['five years in operations', 'ran operations end to end', 'consulting delivery experience', 'owned the supplier process'],
  },
  bo_precision: {
    description: 'Precise and detail-oriented with registers, contracts and numbers.',
    examples: ['maintained audit-ready registers', 'zero errors in reconciliations', 'managed contracts and compliance', 'attention to detail'],
  },
  bo_decision: {
    description: 'Writes clear one-page briefs and recommendations for decisions.',
    examples: ['wrote one-page recommendations for leadership', 'decision memo', 'briefing notes for the founders', 'options paper with a recommendation'],
  },
  bo_sharp: {
    description: 'Curious, quick and to the point.',
    examples: ['curious and quick to learn', 'direct, clear answers', 'asks good questions'],
  },
  bo_ego: {
    description: 'Happy to do unglamorous work; credits others.',
    examples: ['happy to do unglamorous work', 'first to help', 'credits the team'],
  },
  // Talent Partner
  tp_reader: {
    description: 'Reads people well: spots real builders behind polished profiles.',
    examples: ['spotted strong engineers others had rejected', 'good judge of talent', 'looks past the CV to what people built', 'hired people who were later promoted'],
  },
  tp_builder: {
    description: 'Has set up or improved a hiring process.',
    examples: ['built the hiring process from scratch', 'introduced structured interviews and scorecards', 'set up the applicant tracking system', 'cut time to hire'],
  },
  tp_sourcing: {
    description: 'Sources directly through LinkedIn and personal networks.',
    examples: ['sourced most hires directly on LinkedIn', 'built a talent network through referrals', 'direct outreach to engineers', 'sourcing without agencies'],
  },
  tp_tenure: {
    description: '5–8 years of recruiting, including technical roles.',
    examples: ['six years recruiting engineers', 'technical recruiter for software roles', 'recruiting experience in tech startups'],
  },
  tp_sharp: {
    description: 'Writes plainly and directly.',
    examples: ['writes plainly', 'direct and clear communication', 'concise outreach messages'],
  },
  tp_ego: {
    description: 'Credits hiring managers; owns mistakes.',
    examples: ['credits hiring managers', 'owned a bad hiring decision', 'team player'],
  },
};

/** Words used to build LinkedIn searches for each role (titles, keywords, synonyms). */
export const ROLE_SEARCH: Record<string, { titles: string[]; keywords: string[]; synonyms: string[] }> = {
  'ai-eng': {
    titles: ['ML Engineer', 'Machine Learning Engineer', 'Research Engineer', 'AI Engineer', 'Speech Scientist'],
    keywords: ['speech', 'ASR', 'translation', 'real-time', 'inference'],
    synonyms: ['speech recognition', 'text-to-speech', 'low latency', 'streaming', 'on-device'],
  },
  fullstack: {
    titles: ['Full Stack Engineer', 'Software Engineer', 'Backend Engineer'],
    keywords: ['backend', 'API', 'TypeScript', 'Python', 'LLM'],
    synonyms: ['Node.js', 'Go', 'Postgres', 'React', 'AI'],
  },
  'head-eng': {
    titles: ['Head of Engineering', 'VP Engineering', 'Engineering Director', 'CTO'],
    keywords: ['real-time', 'audio', 'API platform', 'scaling'],
    synonyms: ['WebRTC', 'voice', 'developer platform', 'SDK'],
  },
  bizops: {
    titles: ['Business Operations', 'Operations Manager', "Founder's Associate", 'Chief of Staff'],
    keywords: ['operations', 'process', 'suppliers', 'onboarding'],
    synonyms: ['ops', 'automation', 'compliance', 'strategy'],
  },
  talent: {
    titles: ['Talent Partner', 'Technical Recruiter', 'Talent Acquisition', 'Head of Talent'],
    keywords: ['technical recruiting', 'sourcing', 'engineering hiring'],
    synonyms: ['recruiter', 'talent', 'Ashby', 'startup hiring'],
  },
};

/** Phrases that suggest someone builds things — used for the "Unconventional builders" search. */
export const BUILDER_SIGNALS = ['"side project"', 'hackathon', '"open source"', 'founder', 'shipped', 'built'];
