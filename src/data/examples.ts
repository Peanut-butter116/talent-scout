/**
 * Three FICTIONAL sample profiles so reviewers can try "Add a profile" without real data.
 * Invented people and employers. Written like a pasted LinkedIn profile.
 */
export interface ExampleProfile {
  id: string;
  label: string;
  roleId: string;
  text: string;
}

export const EXAMPLE_PROFILES: ExampleProfile[] = [
  {
    id: 'ex-ines',
    label: 'Ines Carver',
    roleId: 'ai-eng',
    text: `Ines Carver
Speech ML Engineer at Halyard Audio

About
I build speech systems that work in noisy, real places. Curious about hard, messy problems and happiest when a model finally runs on a cheap phone.

Experience
Speech ML Engineer — Halyard Audio (4 people)
• Trained a streaming speech recognition model from scratch on 3,000 hours of accented English.
• Cut end-to-end translation latency from 900ms to 240ms by moving inference on-device.
• Built and shipped a live captioning app now used by 12,000 people at community events.
• Wrote the build-vs-buy memo that moved us off a cloud ASR vendor, with a rollback plan.

Machine Learning Intern — Corran Analytics
• Fine-tuned text classifiers for support tickets.

Education
BSc Computer Science.

Other
Open-source maintainer of a small voice-activity-detection library. I credit contributors in every release.`,
  },
  {
    id: 'ex-dami',
    label: 'Dami Rourke',
    roleId: 'fullstack',
    text: `Dami Rourke
Software Engineer at Pellucid Health

About
Backend-leaning engineer who likes shipping small things fast.

Experience
Software Engineer — Pellucid Health
• Designed a REST API in Go that handles 2 million requests a day with Postgres.
• Built the React frontend and the FastAPI backend for an internal AI search tool.
• Worked independently on a billing migration with little guidance.

Projects
• Won a regional hackathon with a bus-delay alert bot; it now has 900 weekly users.

Education
BEng Software Engineering.`,
  },
  {
    id: 'ex-kit',
    label: 'Kit Lowell',
    roleId: 'talent',
    text: `Kit Lowell
Talent Lead at Fenwick Robotics

About
I hire engineers for early-stage teams. I write plainly and say no quickly.

Experience
Talent Lead — Fenwick Robotics
• Built the hiring process from scratch: structured interviews, scorecards and a weekly pipeline review.
• Sourced 14 of our 18 engineering hires directly on LinkedIn and through referrals.
• Hired two engineers other companies had rejected; both now lead teams.

Recruiter — Bramble Search (agency)
• Six years recruiting software engineers for tech startups.`,
  },
];
