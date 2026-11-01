# PRODUCT
Talent Scout is an UNOFFICIAL concept demo built proactively by a job candidate for
Glot, a London startup building real-time translation for real-world conversations.
It shows how Glot could produce a weekly shortlist of people to reach out to, have
coffee chats with them, and use what it learns to sharpen what it looks for.

Core idea: every hiring criterion is a HYPOTHESIS ("this background predicts a strong
hire"). Candidates are scored against weighted criteria, the CEO approves a weekly
shortlist, coffee chats happen, feedback is logged, and the app shows which criteria
are holding up and suggests weight changes. Glot's own Talent Partner job ad asks for
exactly this: compare what profiles looked like at screen with how candidates did
later, and sharpen what we look for. It also says direct sourcing beats agencies and
should be proven, so the app tracks results by sourcing channel.

Audience: a busy CEO who will spend ~2 minutes on it, plus the Chief of Staff/HR.
Design for clarity and speed, not feature count.

# TECH
- Vite + React + TypeScript, Tailwind CSS, lucide-react icons, Vitest for tests.
- Static single-page app deployed on Vercel. Add a vercel.json rewrite so every
  route serves index.html (deep links and refresh must not 404).
- No backend, no database, no API keys, no network calls, no real email, no scraping,
  no analytics.
- All state in one React context + reducer, persisted to localStorage under a single
  versioned key. Each visitor's edits stay private to their browser.
  resetDemo() restores the seed data.
- Keep code modular: /src/data (seed), /src/lib (scoring, analysis — pure functions
  with tests), /src/state, /src/pages, /src/components.

# DATA RULES (non-negotiable)
- All candidates are FICTIONAL. Invented names, invented employers (e.g.
  "Lumen Audio Labs", "Northwind Research"). Never use real people or real companies
  as candidates' employers.
- No photos, ages, gender, nationality or other protected characteristics anywhere.
- Every page shows a small badge: "Interactive demo · fictional candidates".
- Footer/About: "Unofficial concept demo — not a Glot product. Roles are based on
  Glot's public job ads; all candidates and activity are fictional."
- Never imply simulated analysis is live AI.

# ROLES (from Glot's public job ads)
Glot-wide qualities appear in every role, marked with a "Glot-wide quality" badge:
- Sharp & curious: energised by hard, ambiguous problems; gets to the point.
- Builder: has built or shipped something real (project, system, product), not only
  maintained one.
- Low ego: here to build, not to be seen building; changes mind when reasoning is sound.

Each role has a one-line summary (paraphrased, shown on the Roles page), weighted
criteria summing to 100, and optional must-have checks.

1. Founding AI Engineer — owns AI direction and model architecture; sits on the
   senior leadership committee.
   - Deep hands-on model building (beyond fine-tuning) 25
   - Real-time / speech / translation / low-latency inference 25
   - High-bar background (top research lab or early-stage AI team) 10
   - Judgement on hard-to-reverse decisions 10
   - Builder 10 · Sharp & curious 10 · Low ego 10

2. Full Stack Engineer — versatile across AI, backend and frontend, backend-leaning.
   - Backend depth 25
   - Builder (side projects, hackathons, things built outside class/work) 25
   - Full-stack versatility incl. AI 15
   - Top-of-field signal (honours or equivalent) 10
   - Figures things out independently 10
   - Sharp & curious 10 · Low ego 5

3. Head of Engineering — ships impactful products; hands-on early, scales architecture
   to a team; first-principles, "make the complex simple".
   - Builder (shipped impactful products) 25
   - Scaling architecture and teams 20
   - Hands-on across full stack + AI 15
   - Real-time audio or developer-facing API platforms (strong plus) 15
   - First-principles, simplifies complexity 15
   - Sharp & curious 5 · Low ego 5

4. Business Operations — generalist with the Chief of Staff; systems, suppliers,
   onboarding, registers, decision support.
   - Builder (turns repeated tasks into systems) 25
   - End-to-end process ownership (4–6 yrs consulting/startup ops) 20
   - Precision and attention to detail 15
   - Clear decision support (one-page briefs, recommendations) 15
   - Sharp & curious 15 · Low ego 10
   - Must-have: Right to work in UK

5. Talent Partner — owns hiring end to end: sourcing, screening, pipeline in Ashby.
   - Reader of people (polished profile vs real builder) 25
   - Builder (set up/improved a hiring process) 20
   - Direct sourcing via LinkedIn and networks 15
   - 5–8 yrs recruiting incl. technical roles 15
   - Sharp & curious (writes plainly, direct) 15 · Low ego 10
   - Must-have: Right to work in UK

Must-have checks are Yes / No / Unknown. "Unknown" never excludes a candidate; it
shows "Check at first call". Only an explicit "No" flags them.

# CANDIDATES
4–5 fictional candidates per role (~22 total). Each has: name, headline, current
fictional employer, role applied to, sourcing channel (LinkedIn direct / Network
referral / Agency / Inbound), and per-criterion evidence that is EITHER
{rating 0–5, strength: strong|weak, one-line evidence note} OR MISSING.
Make evidence notes specific and realistic, e.g. "Built an open-source streaming ASR
demo with <300ms latency" (strong), "Lists 'speech' as a skill, no project shown"
(weak). Deliberately include: thin-evidence candidates, a polished-profile candidate
with weak builder evidence, and an unconventional candidate with little pedigree but
strong builder evidence.

# SCORING
- Fit score = weighted average over criteria WITH evidence only (re-normalise weights
  over present criteria), shown 0–100%.
- Evidence coverage = share of total weight that has evidence (e.g. "70% of weight
  evidenced, 4 of 6 criteria").
- Confidence: High (coverage ≥ 80% and mostly strong evidence), Medium, Low.
- Missing evidence must NEVER lower the fit score. It lowers confidence only.

# PAGES
Sidebar: Roles & Criteria, Candidates, Pipeline, Learning. KPI strip on Pipeline.

1. Roles & Criteria
   - Role selector; role summary; criteria list with weight sliders that always keep
     the total at 100 (adjust others proportionally); rename/add/remove criteria;
     must-have toggles. Each criterion shows a small "hypothesis" status chip pulled
     from Learning (Holding up / Unclear / Not supported / Not tested yet).
   - "Weight history" list showing changes made this session (and rubric changes
     accepted from Learning), with timestamps.

2. Candidates
   - Ranked table for the selected role; re-ranks live when weights change, with a
     brief highlight on rows that moved. Columns: rank, name, headline, fit score,
     coverage, confidence, source, status.
   - Filters: minimum fit, confidence, source.
   - Click a row → side panel: per-criterion evidence (strong/weak/missing), what's
     uncertain, must-have checks, and "Add to shortlist".

3. Pipeline
   - Columns: Suggested → Approved → Contacted → Chat booked → Chat done, plus Skipped.
   - "Generate this week's shortlist" puts the top 5 not-yet-contacted candidates for
     the selected role (or all roles) into Suggested.
   - Approve / Skip buttons; status change on each card (buttons on mobile, not only
     drag-and-drop).
   - "Draft outreach" opens an editable message template that references the
     candidate's strongest evidence. Clearly labelled "Draft only — not sent".
   - Card in "Chat done" shows "Next step: hand to formal pipeline (Ashby — not
     connected in demo)".
   - KPI strip: shortlisted this week, contacted, reply rate, chats booked, chats done.
     Plus a small "Results by source" table (contacted, replied, chats, progressed per
     channel) — direct sourcing vs agency.
   - "Weekly rhythm" panel: Mon – EA sources & scores · Tue – CEO approves shortlist
     (~10 min) · Wed–Thu – EA handles outreach & booking · Fri – CEO logs chat
     feedback (~30 sec each) and the rubric updates.

4. Learning (headline feature)
   - Feedback form for "Chat done" candidates: outcome (Progress / Maybe / Not a fit),
     observed 0–5 rating per criterion (skippable), short note. Takes <30 seconds.
   - Seed ~10 completed chats across roles so the analysis has data on load. Design the
     seed so a clear story emerges: "High-bar background" / pedigree-style criteria are
     NOT supported (high scorers did no better), while Builder IS holding up.
   - Hypothesis check table per criterion: n chats, avg outcome for high-predicted
     (rating ≥ 3.5) vs low-predicted candidates (Progress = 1, Maybe = 0.5,
     Not a fit = 0), gap between profile rating and observed chat rating, and a label:
     Not tested yet (n < 2), Unclear (small or mixed difference), Holding up,
     Not supported. Show plainly: "Small samples — indicative only; a human decides."
   - "Profiles vs chats" callout: criteria where profiles consistently overstated
     what showed up in chats.
   - Suggested rubric change for the selected role, e.g. "Lower High-bar background
     10 → 5, raise Builder 10 → 15", with a one-line reason. Accept / Dismiss.
     Accept updates weights, logs to Weight history, and Candidates re-rank.

# UX
- Minimal premium SaaS style: navy, white, subtle teal; generous whitespace;
  readable tables. Fully responsive; sidebar collapses on mobile; tables scroll
  horizontally inside their container.
- First-visit welcome modal: what this is, fictional data, edits stay in your browser.
  Buttons: "Take the 2-minute tour" / "Explore on my own".
- Guided tour (custom, lightweight): 1) change a weight on Founding AI Engineer →
  2) see Candidates re-rank → 3) generate & approve shortlist → 4) log a coffee chat
  → 5) accept the suggested rubric change → done.
- Reset Demo button in the sidebar (with confirm). About this project section.
- Friendly empty states everywhere.

# PHASES
Work one phase at a time. After each phase: run tests and `npm run build`, commit,
push, give me a 3-line summary of what to check in the preview, then STOP and wait
for me to say "continue".
- Phase 1: Save CLAUDE.md. Scaffold app, layout, routing, vercel.json, seed data
  (roles + candidates + seeded chats), scoring + analysis functions with Vitest tests
  (weights re-rank correctly; missing evidence never lowers fit; must-have Unknown
  never excludes; reset restores seed; hypothesis labels behave on seeded data).
- Phase 2: Roles & Criteria page and Candidates page.
- Phase 3: Pipeline page.
- Phase 4: Learning page.
- Phase 5: Welcome modal, tour, Reset, About, empty states, mobile pass, then a full
  end-to-end audit of every interaction. Fix bugs. Confirm no real names, keys or
  network calls. Final test + build.
