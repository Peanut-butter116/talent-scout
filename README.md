# Talent Scout

**A hiring pipeline that learns which criteria really work.**
A portfolio project by Sijia He · [Contact](mailto:sijia.he116@outlook.com?subject=Talent%20Scout)

## Contents

1. [What it is](#1-what-it-is)
2. [The idea](#2-the-idea)
3. [How scoring works](#3-how-scoring-works)
4. [User manual](#4-user-manual)
5. [Privacy and fairness](#5-privacy-and-fairness)
6. [How it was built](#6-how-it-was-built)
7. [Limits, and what production would need](#7-limits-and-what-production-would-need)
8. [Credits and contact](#8-credits-and-contact)

---

## 1. What it is

A weekly candidate outreach pipeline for a busy founder who wants a fresh shortlist every week — but doesn't yet know which skills and backgrounds actually predict a great hire.

The demo is set at **Northwind Labs, a 10-person AI startup**, hiring for five roles: Founding AI Engineer, Full Stack Engineer, Head of Engineering, Business Operations and Talent Partner. The company, the candidates and all activity are fictional.

## 2. The idea

Every criterion is a **hypothesis**: "people with this background turn out to be strong hires". A simple weekly loop tests each one:

1. **Criteria** — write down what you think predicts a great hire, with weights.
2. **Sourcing** — search LinkedIn yourself; paste profiles you like and confirm the evidence.
3. **Ranking** — everyone is scored against the weights, cautiously when evidence is thin.
4. **Review** — the founder swipes through the weekly shortlist in a couple of minutes.
5. **Coffee chats** — the real test of each assumption.
6. **Learning** — check which criteria held up, and adjust the weights for next week.

## 3. How scoring works

- **Fit** is the weighted average of the ratings we have. Missing evidence is left out — never counted as zero — because "not checked" isn't "can't".
- **Cautious fit** is what we rank by: the unknown part of a profile counts as neutral (50), so a thin profile with two great ratings can't jump to the top.
  `cautious fit = coverage × fit + (1 − coverage) × 50`
- **Confidence** says how much to trust a score: `coverage × quality × verification` (strong evidence 1, weak 0.6; confirmed by a person 0.85, also seen in a coffee chat 1). High ≥ 65, Medium ≥ 40.
- **Evidence matching** (Sourcing): each sentence of a pasted profile is compared with each criterion's description and example phrases using sentence embeddings and cosine similarity, mixed 70/30 with keyword overlap. Strong ≥ 0.5, weak ≥ 0.35, otherwise missing. A person confirms every line.

The app's **How it works** page (`/how-it-works`) has the formulas and a live worked example.

## 4. User manual

### Roles & Criteria
1. Pick a role at the top, or create one with **New role** — it starts with the three company-wide qualities (Builder, Curious problem-solver, Team-first).
2. Drag a weight slider — the others rebalance so the total stays 100.
3. Add, rename (pencil) or remove (bin) criteria. **Delete role** removes a role you created.
4. See every change, with time, under History.

### Sourcing
1. Pick a search type — Broad, Precise or Unconventional builders — and edit it if you like.
2. **Open in LinkedIn** runs the search in a new tab; you browse LinkedIn yourself. **Save** keeps the search.
3. Paste a profile you like (or **Try an example**) and choose **Match evidence**.
4. Check each suggested line — strong, weak or missing — then **Confirm & save**.
5. Saved searches show how many people each one found, shortlisted, met and progressed.

### Candidates
1. The list is ranked live; rows that move are highlighted.
2. Switch between Cautious (default) and Raw fit; filter by fit, confidence and source.
3. Click a person for evidence, must-haves and what to ask about.
4. **Contact** opens an outreach draft — never sent automatically.

### Pipeline
1. **Generate shortlist** adds the top new candidates to Suggested.
2. **Review shortlist** opens the swipe review in the app.
3. Move people along the board with the buttons on each card; **Draft outreach** cites their strongest evidence.
4. **Results by source** compares direct sourcing with agencies; **Weekly rhythm** shows who does what.

### Founder review
1. After Generate shortlist, choose **Copy link for CEO**.
2. They swipe on any phone: right to approve, left to skip (one-tap reason), star for priority. Undo is always there.
3. **Send decisions back** copies a results link; open it in the app and confirm the import.

### Learning
1. Log feedback for each finished chat: outcome, what you saw, one line.
2. Read the hypothesis check: which criteria are holding up, unclear or not supported.
3. Accept or dismiss the suggested weight change.

### Reset demo
1. **Reset demo** (bottom of the sidebar) restores the original data and removes roles and profiles you added.

## 5. Privacy and fairness

- All candidates and activity are fictional.
- Everything you do stays in your browser. There is no server and no account.
- Share links contain IDs only — never names or evidence.
- No protected characteristics (photos, age, gender, nationality) are stored or used.
- Scores support a human decision; they never make one. Nobody is contacted or rejected automatically.
- No automated LinkedIn access, scraping or login. Pasted profiles are matched on your device; only lines you confirm are kept.
- The live site uses Vercel Web Analytics for anonymous page-view counts (no cookies). No candidate data is sent.

## 6. How it was built

Designed and directed by Sijia He using AI-assisted development with Claude Code. Delivered in reviewed phases — scoring, ranking, pipeline, learning, sourcing, then polish and an accessibility audit — with about 100 automated tests. React, TypeScript, Tailwind CSS and Vite, deployed on Vercel.

```bash
npm install
npm run dev     # local dev server
npm test        # Vitest
npm run build   # type-check + production build
```

`vercel.json` rewrites every route (except `/models`, `/ort`, `/assets`) to `index.html`, so deep links work, and sets long immutable caching plus the right content types for the model (`.onnx`) and runtime (`.wasm`). No backend; state lives in the browser's localStorage. See `CLAUDE.md` for the full product brief.

The quantized model files live in `public/models/` (served from this site; no requests to Hugging Face at runtime). `npm run fetch-model` re-downloads them and checks the SHA-256 Hugging Face publishes. The ONNX runtime files are copied into `public/ort/` before every build.

**Check the on-device model on a deployment:** open `/sourcing`, click an example under *Try an example*. The review should say *"Suggested by an on-device matching model — please check."* (the keyword fallback says *"Suggested by keyword matching (model unavailable)"*). In DevTools → Network you should see `/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx` and `/ort/<version>/ort-wasm-simd-threaded.jsep.wasm` load with status 200 from your own domain.

## 7. Limits, and what production would need

This is a demo: data lives in one browser and samples are tiny. A production version would need:

1. A shared database with login, so the founder and team see the same pipeline.
2. A connection to your applicant tracking system (ATS) for the formal process.
3. LinkedIn Recruiter or other approved sourcing tools.
4. Months of real chat history, so the learning has enough data.
5. A privacy review before any real candidate data is used.

## 8. Credits and contact

Evidence matching runs [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) (Apache 2.0; [browser version](https://huggingface.co/Xenova/all-MiniLM-L6-v2)) in the browser with [Transformers.js](https://huggingface.co/docs/transformers.js) (Apache 2.0) and [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) (MIT). Font: [Inter](https://github.com/rsms/inter) (OFL 1.1). Licence texts: `public/licenses/`; see `THIRD_PARTY_NOTICES.md`.

Sijia He · [sijia.he116@outlook.com](mailto:sijia.he116@outlook.com?subject=Talent%20Scout)
