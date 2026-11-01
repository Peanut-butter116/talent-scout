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
- No backend, no database, no API keys, no real email, no scraping, no analytics.
- Network: the app itself makes NO third-party network calls except downloading the
  on-device embedding model files for evidence extraction (see SOURCING). External links that
  open in a new tab when the user clicks are allowed: Glot job-description links,
  LinkedIn search/profile links, and the model sources on /how-it-works. Profile text
  is never sent anywhere.
- All state in one React context + reducer, persisted to localStorage under a single
  versioned key. Each visitor's edits stay private to their browser.
  resetDemo() restores the seed data. Whenever the saved-state shape changes, bump the
  version and storage key (currently v6) so old saved state resets cleanly.
- Keep code modular: /src/data (seed), /src/lib (scoring, analysis — pure functions
  with tests), /src/state, /src/pages, /src/components.

# DATA RULES (non-negotiable)
- All candidates are FICTIONAL. Invented names, invented employers (e.g.
  "Lumen Audio Labs", "Northwind Research"). Never use real people or real companies
  as candidates' employers.
- No photos, ages, gender, nationality or other protected characteristics anywhere.
- The "Interactive demo · fictional candidates" badge shows ONCE, in the app header
  (and in the /review header) — not repeated on every page.
- Credit line (replaces the old disclaimer), shown ONCE per page in the footer and on
  /review: "Candidate outreach demo for Glot · Built by Sijia He · Not an official Glot
  product · Contact" — "Contact" is a mailto to sijia.he116@outlook.com with subject
  "Talent Scout demo". The full email address appears in text only on the About page.
- Never imply simulated analysis is live AI. The on-device matching model is labelled
  "Suggested by an on-device matching model — please check."; the hypothesis analysis
  is simple transparent rules.
- Real LinkedIn profiles are never scraped, fetched or stored by the app (LinkedIn
  terms + UK GDPR). Profiles a user pastes in stay in their localStorage only, can be
  deleted per candidate, and are cleared by Reset. No automated LinkedIn fetching or
  login.

# ROLES (from Glot's public job ads)
Glot-wide qualities appear in every role, marked with a "Glot-wide quality" badge:
- Sharp & curious: energised by hard, ambiguous problems; gets to the point.
- Builder: has built or shipped something real (project, system, product), not only
  maintained one.
- Low ego: here to build, not to be seen building; changes mind when reasoning is sound.

Each role has a one-line summary (paraphrased, shown on the Roles page), a jdUrl
(Glot's public job ad, shown as "View job description ↗" on Roles & Criteria, the
Candidates header and Sourcing), weighted criteria summing to 100, and optional
must-have checks. Each criterion also has a
one-line description and 3–5 example phrases (used by evidence extraction).

JD links:
- Founding AI Engineer: https://jobs.ashbyhq.com/glot/f529d4cb-dec4-4db8-987b-acc64bec9782
- Full Stack Engineer: https://jobs.ashbyhq.com/glot/e1dfbeef-d771-4cc2-9d32-404a9c7311d6
- Head of Engineering: https://jobs.ashbyhq.com/glot/1efd6395-c9d0-44e3-8195-4390745161f2
- Business Operations: https://jobs.ashbyhq.com/glot/c1278e4e-078f-47c0-920d-2ce93234350c
- Talent Partner: https://jobs.ashbyhq.com/glot/ebd0691d-9abd-46b2-9ae5-5eaa3cc807f8

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
7–9 fictional candidates per role (40 total) so every role can fill a shortlist of 5
new candidates. Each has: name, headline, current
fictional employer, role applied to, sourcing channel (LinkedIn direct / Network
referral / Agency / Inbound), and per-criterion evidence that is EITHER
{rating 0–5, strength: strong|weak, one-line evidence note} OR MISSING.
Make evidence notes specific and realistic, e.g. "Built an open-source streaming ASR
demo with <300ms latency" (strong), "Lists 'speech' as a skill, no project shown"
(weak). Deliberately include: thin-evidence candidates, a polished-profile candidate
with weak builder evidence, and an unconventional candidate with little pedigree but
strong builder evidence.
Optional fields: profileUrl and contactNote. Seeded fictional candidates NEVER get a
profileUrl (no invented linkedin.com/in/... links — they could point to real people);
their "View profile" is disabled with tooltip "Demo candidate — no real profile".
Profiles added via Sourcing use the URL the user pastes, accepted only if it is a valid
https://www.linkedin.com/in/... URL. "Contact" opens the outreach draft (draft only,
not sent) with "Copy message" and "Open profile to message" (new tab). These actions
appear in the Candidates table (profile icon), side panel, board cards and the back of
Quick review cards.
Seed source results are believable, not extreme: direct channels do somewhat better
than agency (agency ~1 of 5–6 progressed). Every percentage shows its n, e.g.
"17% (1 of 6)", with the caption "Demo data. Small samples — indicative only."

# SCORING
- Fit score = weighted average over criteria WITH evidence only (re-normalise weights
  over present criteria), shown 0–100%.
- Evidence coverage = share of total weight that has evidence (e.g. "70% of weight
  evidenced, 4 of 6 criteria").
- Confidence is a transparent, unit-tested formula:
  coverage (share of weight evidenced) × quality (strong 1, weak 0.6, weight-averaged) ×
  verification (confirmed by a person 0.85, also seen in a coffee chat 1, weight-averaged)
  → 0–100; High ≥ 65, Medium ≥ 40, Low below. All saved evidence is person-confirmed
  (demo data or "you"); `checkedInChat` is set on evidence a logged chat also rated. A "How is this calculated?" popover explains it in plain
  English.
- Missing evidence must NEVER lower the fit score. It lowers confidence only.
- Ranking uses CAUTIOUS FIT: coverage × fit + (1 − coverage) × 50 — unknowns shrink
  towards a NEUTRAL 50, not the role average (coverage as a 0–1 share of weight).
  Equals fit at full coverage. Fix ranking problems via the formula, never by editing
  seed data. Raw fit and
  confidence still display. Default sort = cautious; toggle "Cautious (default) /
  Raw fit". Coverage below 40% → "Needs more evidence" tag and suggested action "Find
  out more before contacting". Shortlist generation and Quick review use cautious fit.

# PAGES
Sidebar: Roles & Criteria, Sourcing, Candidates, Pipeline, Learning. KPI strip on Pipeline.

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
     uncertain, must-have checks, and "Add to shortlist". Per criterion also show the
     matched sentence, match strength, and who confirmed it. Pasted-in candidates
     have a Delete button.

3. Pipeline
   - "Quick review" card stack at the top (see QUICK REVIEW below); the kanban board
     stays below for tracking after review.
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
   - Skip-reason counts per role (from Quick review) shown as a rubric signal.
   - Suggested rubric change for the selected role, e.g. "Lower High-bar background
     10 → 5, raise Builder 10 → 15", with a one-line reason. Accept / Dismiss.
     Accept updates weights, logs to Weight history, and Candidates re-rank.

5. How ranking works (/how-it-works) — full page, NOT in the sidebar. Linked from the
   Pipeline header, Candidates header and the "How is this calculated?" popover; back
   link to where the user came from. Plain English, short sections, small formulas,
   mobile-readable: (1) big idea + loop diagram, (2) evidence ratings, (3) fit,
   (4) cautious fit, (5) confidence, (6) LIVE worked example using the app's own
   scoring functions with a local weight slider showing rank changes, (7) learning
   labels + suggested weight changes, (8) evidence matching model (placeholder until
   Phase 5, then a real explanation: sentence embeddings, cosine similarity,
   thresholds, keyword fallback, on-device, nothing uploaded), (9) limits and human
   oversight, (10) sources — ONLY these links:
   https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 ,
   https://huggingface.co/Xenova/all-MiniLM-L6-v2 , https://www.sbert.net ,
   https://huggingface.co/docs/transformers.js

# STYLE (matched to glot.com — captured Nov 2026)
- Measured from www.glot.com (desktop 1440px + mobile 390px screenshots, computed styles):
  - Background #ffffff. Ink #111111 (rgb 17,17,17) for text and primary buttons.
    Warm greys: secondary #52524F, tertiary #6E6E6A, muted #8A8A86; surface #F2F2F0;
    hairline #ECECEC. Glot's UI is essentially monochrome; a muted red #CB4644 appears
    only as a small detail.
  - Font: "Plus Jakarta Sans" (variable). Self-hosted via @fontsource-variable/
    plus-jakarta-sans so no third-party font request is made. Headings weight 600 with
    tight negative tracking (Glot uses ≈ −0.04em on the hero, −0.03em on h2); body 16px,
    secondary text in warm grey.
  - Buttons: black pills (rounded-full, #111 bg, white 14–16px medium text); nav links
    grey pills; header is a floating rounded bar with a hairline border.
  - Lots of whitespace, very few boxes.
- Our tokens (tailwind.config.js, src/index.css): `ink` = the warm grey scale above
  (`navy`/`slate` map to it). Primary accent = ink black (buttons, links with underline,
  toggles, focus rings). Status colours only, never decoration: `teal` = muted green
  #3F7D5A (good: strong evidence, holding up, done), amber (unclear/weak), `rose` = Glot
  red #CB4644 (not supported, flags). Pill buttons, 16px cards, 24px sheets.
- Glot's logo: header lockup saved as /public/glot-logo.svg (mark only:
  /public/glot-mark.svg). Shown SMALL as "Built for [Glot logo]" next to the
  "Talent Scout" name in the app header, on /review and on About. Talent Scout stays the
  product name, with its small "Unofficial demo" label; never present the app as Glot's.
- Cards over heavy tables on mobile (Candidates, Hypothesis check); board columns stack
  vertically on phones. Every page must work at 390px with no sideways scroll.

# ABOUT / README
- /about is a README-style page (the one exception to the short-copy rule, but
  scannable: TOC with anchors, headings, short paragraphs, numbered steps). Linked from
  the header, the sidebar footer and the /review footer. Sections: what this is (built
  by Sijia He for the Founder's EA application; JD links), the problem, the idea (9-step
  loop), scoring in plain words (+ link to How it works), user manual per page (Roles &
  Criteria, Candidates, Pipeline, CEO review, Learning, Sourcing, Reset), weekly rhythm,
  privacy and fairness, limits / what a real version needs, built with, contact.
- README.md in the repo mirrors the same content. Keep both in sync (Phase 5 must
  replace the Sourcing placeholder in both with real steps).

# COPY RULES (write like glot.com)
- Page header: title of 2–4 words + at most ONE short line under it.
- Buttons and labels: 1–3 words.
- No explanatory paragraphs or repeated hints on pages. Put explanations behind a small
  "?" (InfoTip) or on /how-it-works.
- Small-sample caveat is one quiet grey line: "Small samples — a guide, not proof."
- Empty states: one line + (optionally) one button.

# SHARING (CEO review)
- /review is a standalone, full-screen, mobile-first route (no sidebar) showing only
  the swipe stack (shared ReviewStack component, same as in-app Quick review).
- After "Generate shortlist", a popup "Shortlist ready — N candidates" offers
  "Open review" (new tab) and "Copy link for CEO". If fewer than 5 new candidates were
  available, it adds one line: "Only N new candidates this week."
- Links carry state in the URL HASH and contain ONLY: version, role id (or "all"),
  week (YYYY-MM-DD), seeded candidate IDs; the results link adds decision codes
  (a/s/p + skip-reason letter). Never names, evidence or personal data. Decoding
  validates everything (version, known role, week format, seeded IDs only, max 10,
  no duplicates) and fails safely with a short message.
- /review in the SAME browser as the board (all linked candidates already on the board)
  applies decisions directly; the other tab picks them up via the storage event.
  In another browser, decisions are kept locally and "Send decisions back" copies a
  results link. Opening a results link in the app shows "Import CEO decisions?" with a
  summary; only candidates still in Suggested (or new) are changed.
- Candidates added via Sourcing are never put in links; show "Added profiles can't be
  shared by link in the demo."
- Pipeline keeps the in-app Quick review, with a prominent "Review shortlist" button.
- The "moved rows" ranking baseline lives in sessionStorage (survives reloads).

# UX
- Fully responsive; sidebar collapses on mobile; wide tables scroll inside their
  container.
- First-visit welcome modal: what this is, fictional data, edits stay in your browser.
  Buttons: "Take the 2-minute tour" / "Explore on my own".
- Guided tour (custom, lightweight): 1) change a weight on Founding AI Engineer →
  2) see Candidates re-rank → 3) try an example profile on Sourcing → 4) generate &
  approve shortlist → 5) log a coffee chat → 6) accept the suggested rubric change →
  done.
- Reset Demo button in the sidebar (with confirm). About this project section.
- Friendly empty states everywhere.

# SOURCING (LinkedIn, assisted — not automated)
The app helps the user search LinkedIn themselves and turns profiles they choose into
structured evidence, entirely in their browser.
- Page "Sourcing" (second in sidebar).
- Search builder: for the selected role, generate editable LinkedIn Boolean search
  strings from the criteria (titles, keywords, synonyms) in three variants: Broad,
  Precise, Unconventional builders. Buttons: Copy, and Open in LinkedIn (opens
  https://www.linkedin.com/search/results/people/?keywords=<encoded> in a new tab).
  Save searches; for each saved search track profiles added, shortlisted, chats,
  progressed.
- Add a profile: textarea to paste a LinkedIn profile or CV text, optional profile
  URL, source = LinkedIn direct. Runs evidence extraction, shows suggested evidence
  per criterion, user confirms/edits, then saves as a candidate.
- "Try an example": 3 fictional sample profile texts so reviewers can test without
  real data.
- Page notice: "Profiles you add stay in this browser. Nothing is uploaded."
- Seeded fictional candidates stay (labelled) so the demo works on first load.

# EVIDENCE EXTRACTION
- transformers.js (@huggingface/transformers 3.7.5) with the quantized
  Xenova/all-MiniLM-L6-v2 model, SELF-HOSTED: model files in /public/models/Xenova/
  all-MiniLM-L6-v2/ (onnx/model_quantized.onnx, SHA-256 afdb6f1a…48bdb1, verified against
  Hugging Face's published hash) and the ONNX runtime wasm in /public/ort/ (copied from
  node_modules by scripts/copy-ort.mjs before dev/build; git-ignored). transformers.js is
  configured with allowRemoteModels = false, localModelPath = /models/, wasmPaths = /ort/:
  no requests to Hugging Face or any CDN at runtime. `npm run fetch-model` re-downloads
  the model from Hugging Face (needs huggingface.co + *.hf.co) and checks hashes.
- Lazy: the Sourcing route is code-split, and transformers.js is dynamically imported
  only when someone first clicks "Match evidence" or "Try an example" (loading state
  shown). Other pages never load it. If it fails, keyword matching is used and labelled.
- Only the confirmed evidence lines are stored (in localStorage); raw pasted text is not.
- Split pasted text into sentences; for each criterion find the best-matching
  sentences by cosine similarity against its description + example phrases.
- Score per sentence = 0.7 × best cosine similarity (over the criterion's description
  and example phrases) + 0.3 × keyword overlap. Strong ≥ 0.5, weak ≥ 0.35, else missing
  (tuned on the 3 example profiles with scripts/tune.mts). Keyword fallback: strong ≥ 0.6,
  weak ≥ 0.45. Rating = 3 (strong) / 2 (weak), +1 doing verb, +1 number, max 5. Note = matched sentence, shortened.
  Suggested 0–5 rating from similarity plus simple signals (quantified results;
  built/shipped/led verbs). User must confirm or edit before saving.

# QUICK REVIEW (Pipeline card stack)
- "Review this week's shortlist" opens a card stack, one candidate per card.
- Card front: name, headline, fit score, confidence, top 3 evidence lines, biggest
  uncertainty. Tap to flip for full evidence.
- Swipe right = Approve, left = Skip, star button / swipe up = Priority ("CEO wants
  to meet personally"). Buttons under the card and keyboard arrows do the same.
  Pointer events; smooth drag with slight rotation and an approve/skip hint overlay;
  works on mobile and desktop.
- Undo last decision.
- Skip asks for one quick reason chip: Not enough evidence / Wrong seniority /
  Missing key skill / Other. Reasons are stored.
- Weekly cap of 10 cards, then a "Done for this week" summary screen.
- A short "It's a match" moment when an approved candidate moves to Replied or
  Chat booked.
- Professional tone: never use the words "dating" or "Tinder" in the UI.

# PHASES
Work one phase at a time. After each phase: run tests and `npm run build`, commit,
push, give me a 3-line summary of what to check in the preview, then STOP and wait
for me to say "continue".
- Phase 1 (done): Save CLAUDE.md. Scaffold app, layout, routing, vercel.json, seed data
  (roles + candidates + seeded chats), scoring + analysis functions with Vitest tests
  (weights re-rank correctly; missing evidence never lowers fit; must-have Unknown
  never excludes; reset restores seed; hypothesis labels behave on seeded data).
- Phase 2 (done): Roles & Criteria page and Candidates page.
- Phase 3 (done): Pipeline page, including Quick review. Follow-ups done: cautious-fit
  ranking, believable source data, /how-it-works page, profile/contact links, JD links.
- Phase 4 (done): Learning page (also skip-reason counts per role as a rubric signal).
  Follow-up done: calm restyle + copy cut, CEO /review share links, neutral-50 cautious fit,
  glot.com-matched style, Glot logo, credit line, README-style About, 41 candidates.
- Phase 5 (done): Sourcing page, self-hosted on-device evidence extraction with keyword
  fallback, transparent confidence formula, How it works §8, About/README Sourcing steps.
- Phase 6: Welcome modal, tour (incl. the Sourcing example-profile step), Reset,
  About, empty states, mobile pass, then a full end-to-end audit of every
  interaction. Fix bugs. Confirm no real names, keys or unexpected network calls.
  Final test + build.
