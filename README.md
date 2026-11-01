# Talent Scout

**Candidate outreach demo for Glot · Built by Sijia He · Not an official Glot product**

A weekly shortlist that learns what really predicts a great hire.

## Contents

1. [What this is](#1-what-this-is)
2. [The problem](#2-the-problem)
3. [The idea](#3-the-idea)
4. [How the scoring works](#4-how-the-scoring-works)
5. [User manual](#5-user-manual)
6. [A suggested weekly rhythm](#6-a-suggested-weekly-rhythm)
7. [Privacy and fairness](#7-privacy-and-fairness)
8. [Limits, and what a real version needs](#8-limits-and-what-a-real-version-needs)
9. [Built with](#9-built-with)
10. [Contact](#10-contact)

---

## 1. What this is

A working demo built by Sijia He in response to a question raised during her application for the Founder's EA role at Glot: *how do you produce a weekly shortlist of people to reach out to for open roles — and test which skills and backgrounds actually matter?*

All candidates and activity are fictional. The roles and criteria are based on Glot's public job ads:

- [Founding AI Engineer](https://jobs.ashbyhq.com/glot/f529d4cb-dec4-4db8-987b-acc64bec9782)
- [Full Stack Engineer](https://jobs.ashbyhq.com/glot/e1dfbeef-d771-4cc2-9d32-404a9c7311d6)
- [Head of Engineering](https://jobs.ashbyhq.com/glot/1efd6395-c9d0-44e3-8195-4390745161f2)
- [Business Operations](https://jobs.ashbyhq.com/glot/c1278e4e-078f-47c0-920d-2ce93234350c)
- [Talent Partner](https://jobs.ashbyhq.com/glot/ebd0691d-9abd-46b2-9ae5-5eaa3cc807f8)

Not an official Glot product.

## 2. The problem

- The CEO wants a fresh shortlist every week, but doesn't have time to build one.
- It isn't yet clear which skills and backgrounds predict a good hire.
- Coffee chats are the real test — but what they teach is rarely written down.
- When an assumption doesn't hold, the criteria need to be easy to change.

## 3. The idea

Every criterion is a **hypothesis**: "people with this background turn out to be strong hires". The app runs a simple weekly loop that tests each one:

1. **Define criteria** — write down what you think predicts a great hire, with weights.
2. **Rank candidates** — everyone is scored against those weights.
3. **CEO reviews shortlist** — a few minutes of swiping: approve, skip or star.
4. **Outreach** — drafts are prepared; a person sends them.
5. **Coffee chat** — the real test of each assumption.
6. **Log feedback** — outcome and what you saw, in about 30 seconds.
7. **Check which criteria hold up** — did high scorers actually do better in chats?
8. **Update weights** — accept or dismiss a suggested change.
9. **Next week's ranking** — the loop runs again with sharper criteria.

## 4. How the scoring works

- **Fit** is the weighted average of the ratings we have. A criterion with no evidence is left out — never counted as zero — because "not checked" isn't "can't".
- **Cautious fit** is what we rank by. It treats the unknown part of a profile as neutral (50), so a thin profile with two great ratings can't jump to the top. With full evidence, cautious fit equals fit:
  `cautious fit = coverage × fit + (1 − coverage) × 50`
- **Confidence** says how much to trust a score — how much of the profile is evidenced, and how strongly — not how good the person is.

The app's **How it works** page (`/how-it-works`) has the formulas and a live worked example.

## 5. User manual

### Roles & Criteria
1. Pick a role at the top.
2. Drag a weight slider — the others rebalance so the total stays 100.
3. Add, rename (pencil) or remove (bin) criteria.
4. See every change, with time, under History.
5. Open the job description from the link under the role summary.

### Candidates
1. The list is ranked live; rows that move are highlighted.
2. Switch between Cautious (default) and Raw fit.
3. Filter by fit, confidence and source.
4. Click a person for evidence, must-haves and what to ask about.
5. Use Contact to open an outreach draft (never sent automatically).

### Pipeline
1. **Generate shortlist** adds the top new candidates to Suggested.
2. **Review shortlist** opens the swipe review in the app.
3. Move people along the board with the buttons on each card.
4. **Draft outreach** prepares a message that cites their strongest evidence.
5. **Results by source** compares direct sourcing with agencies.
6. **Weekly rhythm** shows who does what, and when.

### CEO review
1. After Generate shortlist, choose **Copy link for CEO**.
2. The CEO opens it on any phone: swipe right to approve, left to skip (one-tap reason), star for priority. Undo is always there.
3. At the end, **Send decisions back** copies a results link.
4. Open that link in the app and confirm **Import decisions**. In the same browser, decisions apply straight away.

### Learning
1. Log feedback for each finished chat: outcome, what you saw, one line.
2. Read the hypothesis check: which criteria are holding up, unclear or not supported.
3. Accept or dismiss the suggested weight change.

### Sourcing
1. Coming next: LinkedIn search builder and profile matching.

### Reset demo
1. **Reset demo** (bottom of the sidebar) restores the original data.

## 6. A suggested weekly rhythm

1. **Monday** — EA sources and scores candidates (~1 hour).
2. **Tuesday** — CEO reviews the shortlist on their phone (~10 minutes).
3. **Wednesday–Thursday** — EA sends outreach and books coffee chats.
4. **Friday** — CEO logs chat feedback (~30 seconds each); EA reviews suggested weight changes.

## 7. Privacy and fairness

- All candidates in this demo are fictional.
- Everything stays in your browser. There is no server, no account and no tracking.
- Share links contain IDs only — never names or evidence.
- No protected characteristics (photos, age, gender, nationality) are stored or used.
- Scores support a human decision; they never make one. Nobody is contacted or rejected automatically.
- No automated LinkedIn access, scraping or login.

## 8. Limits, and what a real version needs

This is a demo: data lives in one browser and samples are tiny. A real version would need:

1. A shared database with login, so the CEO and EA see the same pipeline.
2. A connection to Ashby, so approved people flow into the formal process.
3. LinkedIn Recruiter or other approved sourcing tools.
4. Real chat history over months, so the learning has enough data.
5. A privacy review before any real candidate data is used.

## 9. Built with

React, TypeScript, Tailwind CSS and Vite, deployed on Vercel. Developed with Claude Code.

```bash
npm install
npm run dev     # local dev server
npm test        # Vitest
npm run build   # type-check + production build
```

`vercel.json` rewrites every route to `index.html`, so deep links work. No backend; state lives in the browser's localStorage. See `CLAUDE.md` for the full product brief.

## 10. Contact

Sijia He · [sijia.he116@outlook.com](mailto:sijia.he116@outlook.com?subject=Talent%20Scout%20demo)
