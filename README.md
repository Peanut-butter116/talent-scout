# Talent Scout

Unofficial concept demo — not a Glot product. Roles are based on Glot's public job ads; all candidates and activity are fictional.

A static React app showing a weekly hiring loop: score candidates against weighted criteria, approve a shortlist, log coffee-chat feedback, and see which criteria hold up. See `CLAUDE.md` for the full brief.

```bash
npm install
npm run dev     # local dev server
npm test        # Vitest
npm run build   # type-check + production build
```

Deployed as a static site on Vercel (`vercel.json` rewrites every route to `index.html`). No backend, no network calls; state lives in your browser's localStorage.
