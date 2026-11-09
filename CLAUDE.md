# PRODUCT
Talent Scout is a general-purpose PORTFOLIO PROJECT by Sijia He: an interactive demo of
a weekly candidate outreach pipeline for a busy founder who wants a shortlist every
week but doesn't yet know which skills predict a great hire.

The demo is set in a fictional company: **Northwind Labs, a 10-person AI startup**.
It is not built for, affiliated with, or about any real company. Never mention or imply
a real employer, or any specific person other than the author.

Core idea: every hiring criterion is a HYPOTHESIS ("this background predicts a strong
hire"). The loop: Criteria → Sourcing → Ranking → Review → Coffee chats → Learning.
Candidates are scored against weighted criteria, the founder approves a weekly
shortlist, coffee chats happen, feedback is logged, and the app shows which criteria are
holding up and suggests weight changes. Results are tracked by sourcing channel
(direct sourcing vs agencies).

Audience: a busy founder who will spend ~2 minutes on it, plus anyone reviewing the
portfolio. Design for clarity and speed, not feature count.

# TECH
- Vite + React + TypeScript, Tailwind CSS, lucide-react icons, Vitest for tests.
- Static single-page app deployed on Vercel. vercel.json rewrites every route except
  /models, /ort and /assets to index.html (deep links and refresh must not 404), sets
  immutable caching for /models, /ort and /assets, and Content-Type for .wasm
  (application/wasm), .onnx (application/octet-stream) and .mjs.
- Sharing tags: title "Talent Scout — a hiring pipeline that learns which criteria
  really work", one-sentence meta description, Open Graph/Twitter tags with
  /og-image.png (1200×630, plain, Talent Scout only). Absolute URLs come from SITE_URL
  or Vercel's VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL at build time. Favicon: white
  magnifier on the indigo accent.
- Licences: THIRD_PARTY_NOTICES.md and /public/licenses (model Apache-2.0,
  Transformers.js Apache-2.0, ONNX Runtime MIT, Inter OFL); LICENSE.txt and NOTICE.txt
  next to the model files. Credited in About ("Credits") and README.
- No backend, no database, no API keys, no real email, no scraping.
- Analytics: Vercel Web Analytics (`<Analytics />` from @vercel/analytics in main.tsx,
  added via the Vercel integration). Anonymous, cookieless page views; served from the
  site's own /_vercel/insights path on Vercel. No other analytics.
- Network: the app makes NO third-party network calls. It loads only its own files
  (including the on-device model on Sourcing) plus Vercel Web Analytics. External links
  open in a new tab only when the user clicks: LinkedIn search/profile links, the model
  sources on /how-it-works, and credits on About. Profile text is never sent anywhere.
- All state in one React context + reducer, persisted to localStorage under a single
  versioned key. Each visitor's edits stay private to their browser. resetDemo()
  restores the seed data. Whenever the saved-state shape changes, bump the version and
  storage key (currently v7) so old saved state resets cleanly.
- Keep code modular: /src/data (seed), /src/lib (scoring, analysis — pure functions
  with tests), /src/state, /src/pages, /src/components.

# DATA RULES (non-negotiable)
- All candidates are FICTIONAL. Invented names, invented employers. Never use real
  people or real companies as candidates' employers. Northwind Labs is fictional.
- No photos, ages, gender, nationality or other protected characteristics anywhere.
- Header shows "Talent Scout · Interactive demo" (once). Fictional data is stated in the
  tour's first step, the meta description and About.
- Footer, once per page (and on /review): "A portfolio project by Sijia He · Contact" —
  "Contact" is a mailto to sijia.he116@outlook.com with subject "Talent Scout". The full
  email address appears in text only on the About page.
- Never imply simulated analysis is live AI. The on-device matching model is labelled
  "Suggested by an on-device matching model — please check."; the hypothesis analysis
  is simple transparent rules.
- Real LinkedIn profiles are never scraped, fetched or stored by the app (LinkedIn
  terms + UK GDPR). Profiles a user pastes in stay in their localStorage only, can be
  deleted per candidate, and are cleared by Reset. No automated LinkedIn fetching or
  login.
- The formal next step after a chat is "your applicant tracking system (ATS)" — never a
  named ATS product.

# ROLES (Northwind Labs, generic wording)
Company-wide qualities appear in every role, marked with a "Company-wide quality" badge
(field `companyWide`; pooled across roles in Learning via `theme`):
- Builder: has built or shipped something real, not only maintained it.
- Curious problem-solver: enjoys hard, open-ended problems; clear and concise.
- Team-first: shares credit, takes feedback, changes their mind on good reasoning.

Each role has a one-line summary, weighted criteria summing to 100, and optional
must-have checks. Each criterion has a one-line description and 3–5 example phrases
(used by evidence extraction). No job-description links.

1. Founding AI Engineer — sets the technical direction for AI and builds the first models.
   Model building from scratch 25 · Real-time / low-latency ML 25 · Pedigree (top lab or
   early AI team) 10 · Judgement on hard-to-undo calls 10 · Builder 10 · Curious
   problem-solver 10 · Team-first 10
2. Full Stack Engineer — ships across the stack, leaning backend and AI.
   Backend depth 25 · Builder (side projects, hackathons, open source) 25 · Works across
   frontend, backend and AI 15 · Academic distinction 10 · Self-directed 10 · Curious
   problem-solver 10 · Team-first 5
3. Head of Engineering — builds the first products hands-on, then grows the team.
   Builder (shipped products people use) 25 · Has scaled systems and teams 20 · Still
   hands-on 15 · Real-time or developer API platforms 15 · Simplifies complex systems 15
   · Curious problem-solver 5 · Team-first 5
4. Business Operations — runs the company's operating systems.
   Builder (automates repeated work) 25 · Owns operations end to end (4–6 yrs) 20 ·
   Precise and detail-oriented 15 · Clear written recommendations 15 · Curious
   problem-solver 15 · Team-first 10 · Must-have: right to work in the UK
5. Talent Partner — owns hiring end to end.
   Spots real builders behind polished CVs 25 · Builder (has set up a hiring process) 20
   · Direct sourcing 15 · 5–8 yrs recruiting incl. technical 15 · Curious problem-solver
   (writes plainly) 15 · Team-first 10 · Must-have: right to work in the UK
- Criterion ids, weights and themes are unchanged from earlier phases so the learning
  story and tests hold.
- "New role" on Roles & Criteria: name the role; it starts with the three company-wide
  qualities (Builder 40, Curious problem-solver 30, Team-first 30) and you add criteria.
  Saved in the browser (state.roles, `custom: true`), deletable, cleared by Reset.

Must-have checks are Yes / No / Unknown. "Unknown" never excludes a candidate; it
shows "Check at first call". Only an explicit "No" flags them.

# CANDIDATES
7–9 fictional candidates per role (40 total) so every role can fill a shortlist of 5
new candidates. Each has: name, headline, fictional employer, role, sourcing channel
(LinkedIn direct / Network referral / Agency / Inbound), and per-criterion evidence that
is EITHER {rating 0–5, strength: strong|weak, one-line note} OR MISSING. Includes
thin-evidence candidates, polished profiles with weak builder evidence, and
unconventional builders with little pedigree.
Optional fields: profileUrl and contactNote. Seeded candidates NEVER get a profileUrl;
their "View profile" is disabled with tooltip "Demo candidate — no real profile".
Profiles added via Sourcing accept only valid https://www.linkedin.com/in/... URLs.
"Contact" opens the outreach draft (draft only, not sent) with "Copy message" and "Open
profile" (new tab).
Seed source results are believable, not extreme (agency ~1 of 5 progressed). Every
percentage shows its n, e.g. "20% (1 of 5)", with "Demo data. Small samples —
indicative only."

# SCORING
- Fit = weighted average over criteria WITH evidence only (weights re-normalised),
  0–100%. Missing evidence must NEVER lower fit; it lowers confidence only.
- Coverage = share of total weight that has evidence.
- Confidence = coverage × quality (strong 1, weak 0.6) × verification (confirmed by a
  person 0.85, also seen in a coffee chat 1) → 0–100; High ≥ 65, Medium ≥ 40, Low below.
  "How is this calculated?" popover explains it.
- Ranking uses CAUTIOUS FIT: coverage × fit + (1 − coverage) × 50 (neutral 50). Equals
  fit at full coverage. Fix ranking problems via the formula, never by editing seed
  data. Toggle "Cautious (default) / Raw fit". Coverage below 40% → "Needs more
  evidence". Shortlist generation and Quick review use cautious fit.

# PAGES
Sidebar: Roles & Criteria, Sourcing, Candidates, Pipeline, Learning. About and How it
works are linked from the header/sidebar footer.
1. Roles & Criteria — role selector, "New role", summary, weighted criteria (sliders keep
   total at 100; rename/add/remove), must-have toggles, hypothesis chip per criterion,
   history of weight changes.
2. Sourcing — LinkedIn Boolean search builder (Broad / Precise / Unconventional builders;
   Copy, Open in LinkedIn, Save), saved searches with results, Add a profile (paste →
   on-device matching → confirm → save), Try an example (3 fictional profiles), added
   profiles with Delete. Notice: "Profiles you add stay in this browser. Nothing is
   uploaded."
3. Candidates — ranked list (cards on mobile), sort toggle, filters, side panel with
   evidence (match sentence, strength, who confirmed), must-haves, Contact, Add to
   shortlist, Delete for added profiles.
4. Pipeline — Review shortlist (Quick review), Generate shortlist (+ share popup), board
   (Suggested → Approved → Contacted → Chat booked → Chat done, + Skipped), outreach
   drafts, "Next step: hand to your applicant tracking system (ATS) — not connected in
   demo", KPIs, Results by source, Weekly rhythm.
5. Learning — feedback form, suggested rubric change (Accept/Dismiss), hypothesis check,
   Profiles vs chats, skip reasons, chat log. Grey line "Small samples — a guide, not
   proof."
6. How it works (/how-it-works) — plain-English sections with formulas, a LIVE worked
   example, the matching model, limits, and sources (ONLY:
   https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 ,
   https://huggingface.co/Xenova/all-MiniLM-L6-v2 , https://www.sbert.net ,
   https://huggingface.co/docs/transformers.js).
7. About (/about) — portfolio case study (see ABOUT / README).

# STYLE (Talent Scout's own look)
- Calm, white, airy; very few boxes; generous whitespace.
- Tokens (tailwind.config.js, src/index.css):
  - `ink`: neutral greys (zinc-like). Background #ffffff, text #18181b, secondary
    #52525b, muted #71717a (≥ 4.5:1 on white), surface #f4f4f5, hairline #e4e4e7.
    `navy`/`slate` map to `ink`. `ink-300` is decoration/disabled only.
  - ONE accent: deep indigo (`accent`, 700 = #4338ca) for primary buttons, links
    (underlined), toggles, focus rings and the favicon. Selected tabs/segments use ink.
  - Status colours only, never decoration: `teal` = muted green #3f7d5a (good), amber
    (unclear/weak), `rose` = red #cb4644 (not supported, flags).
  - Font: Inter (variable, OFL), self-hosted via @fontsource-variable/inter — no
    third-party font request. Headings 600 with tight negative tracking.
  - Shapes: pill buttons, 16px cards, 24px sheets/modals.
- Cards over heavy tables on mobile; board columns stack on phones. Every page must work
  at 390px with no sideways scroll. Text meets WCAG AA contrast.

# ABOUT / README (portfolio case study)
Same content in /about and README.md; contents list, short sections, readable at 390px:
1. What it is — a weekly candidate outreach pipeline for a busy founder (fictional
   Northwind Labs).
2. The idea — criteria as hypotheses; the loop Criteria → Sourcing → Ranking → Review →
   Coffee chats → Learning.
3. How scoring works (link to How it works).
4. User manual — Roles & Criteria (incl. New role), Sourcing, Candidates, Pipeline, CEO /
   founder review, Learning, Reset demo.
5. Privacy and fairness — fictional data; browser-only storage; ID-only share links; no
   protected characteristics; humans decide; no automated LinkedIn access; Vercel Web
   Analytics for anonymous page views only.
6. How it was built — designed and directed by Sijia He using AI-assisted development
   with Claude Code, delivered in reviewed phases, ~100 automated tests, Vercel.
7. Limits and what a production version would need.
8. Credits (model and libraries, with licences) and contact.

# COPY RULES
- Page header: title of 2–4 words + at most ONE short line under it.
- Buttons and labels: 1–3 words.
- No explanatory paragraphs or repeated hints on pages; explanations go behind a small
  "?" (InfoTip) or on /how-it-works. About is the one long-form page.
- Empty states: one line + (optionally) one button.

# SHARING (founder review)
- /review is a standalone, full-screen, mobile-first route showing only the swipe stack
  (shared ReviewStack component).
- After "Generate shortlist", a popup "Shortlist ready — N candidates" offers "Open
  review" (new tab) and "Copy link for CEO". If fewer than 5 new candidates, one line:
  "Only N new candidates this week."
- Links carry state in the URL HASH and contain ONLY: version, role id (or "all"), week,
  seeded candidate IDs; results links add decision codes. Never names or evidence.
  Decoding validates everything and fails safely.
- Same browser: decisions apply directly (storage event syncs tabs). Other browser:
  "Send decisions back" copies a results link → "Import CEO decisions?" in the app.
- Added (Sourcing) profiles and custom roles are never put in links; show "Added
  profiles can't be shared by link in the demo."
- The "moved rows" ranking baseline lives in sessionStorage.

# UX
- First visit in a browser: the tour auto-starts (welcome lines folded into step 1).
  localStorage `talent-scout:tour-seen` is set as soon as any tour starts; never
  auto-starts on /about, results/import links or /review. Reset doesn't clear it. The
  header "Tour" link restarts it.
- Tour (components/Tour.tsx; 7 steps, skippable, one sentence each): weight change →
  Candidates re-rank → How it works live example → Sourcing example profile → Generate
  shortlist + CEO review → log a coffee chat → accept the suggested change → "That's the
  loop".
- Accessibility: visible focus outline, skip link, keyboard-operable rows, review stack
  and dialogs (Escape closes).
- Reset demo in the sidebar (with confirm).

# EVIDENCE EXTRACTION
- transformers.js 3.7.5 + quantized Xenova/all-MiniLM-L6-v2, SELF-HOSTED in
  /public/models (SHA-256 afdb6f1a…48bdb1, verified against Hugging Face's published
  hash) and ONNX runtime in /public/ort/<version>/ (copied by scripts/copy-ort.mjs;
  git-ignored; scripts/prune-dist.mjs removes Vite's unused copy). allowRemoteModels =
  false. `npm run fetch-model` re-downloads and checks hashes.
- Lazy: Sourcing is code-split; transformers.js loads only on first "Match evidence" /
  "Try an example". Keyword fallback if it fails (labelled).
- Score per sentence = 0.7 × best cosine similarity + 0.3 × keyword overlap. Strong ≥ 0.5,
  weak ≥ 0.35. Keyword fallback: strong ≥ 0.6, weak ≥ 0.45. Rating = 3 (strong) / 2
  (weak), +1 doing verb, +1 number, max 5. The user confirms every line. Only confirmed
  lines are stored; raw pasted text is not.

# QUICK REVIEW
- Card stack: name, headline, cautious fit, confidence, top 3 evidence lines, biggest
  unknown; tap to flip. Swipe right approve, left skip (one-tap reason), star/up
  priority; buttons and arrow keys too; Undo; weekly cap of 10; "Done for this week".
- "It's a match" moment when an approved candidate replies or books a chat.
- Professional tone: never use the words "dating" or "Tinder" in the UI.

# HISTORY
Built in reviewed phases: scaffold + scoring → Roles & Candidates → Pipeline + Quick
review → Learning → Sourcing + on-device matching → tour, deployment, audit →
conversion to a general-purpose portfolio project (this version).
