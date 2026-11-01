import type { Criterion, Evidence, EvidenceStrength, Role } from '../types';

/**
 * Evidence extraction from pasted profile text. Pure and model-agnostic: the caller passes an
 * `embed` function (the on-device sentence-embedding model). If the model can't load, the
 * keyword fallback is used instead. Nothing here sends text anywhere.
 */

/**
 * Model score = 70% cosine similarity (best example phrase) + 30% keyword overlap.
 * Thresholds tuned on the 3 example profiles.
 */
export const MODEL_MIX = { cosine: 0.7, keywords: 0.3 };
export const MODEL_THRESHOLDS = { strong: 0.5, weak: 0.35 };
/** Same idea for the keyword fallback, on its own 0–1 scale. */
export const KEYWORD_THRESHOLDS = { strong: 0.6, weak: 0.45 };

export type Method = 'model' | 'keywords';

export interface Suggestion {
  criterionId: string;
  /** Best-matching sentence (shortened for display), if any matched at all. */
  sentence?: string;
  similarity: number;
  strength: EvidenceStrength | null;
  rating: number | null;
  method: Method;
}

const BULLET = /^[\s•·\-–—*>▪◦●]+/;

/** Splits pasted text into sentence-sized pieces (lines, bullets, and sentence ends). */
export function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\r/g, '')
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/))
    .map((s) => s.replace(BULLET, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 12 && s.length <= 400);
  return [...new Set(parts)];
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const ACTION = /\b(built|build|shipped|ship|led|lead|launched|designed|created|founded|trained|scaled|automated|grew|cut|reduced|wrote|set up|introduced|hired|sourced|owned|ran|delivered)\b/i;
const QUANTIFIED = /(\d[\d,.]*\s*(%|ms|k\b|m\b|x\b|users|people|hires|engineers|customers|requests|stars|minutes|hours|days|weeks|months|years))|(\b\d{2,}\b)/i;

export function signals(sentence: string) {
  return { action: ACTION.test(sentence), quantified: QUANTIFIED.test(sentence) };
}

export function strengthFor(similarity: number, method: Method): EvidenceStrength | null {
  const t = method === 'model' ? MODEL_THRESHOLDS : KEYWORD_THRESHOLDS;
  if (similarity >= t.strong) return 'strong';
  if (similarity >= t.weak) return 'weak';
  return null;
}

/** 0–5 suggestion: base from match strength, +1 for doing verbs, +1 for numbers. */
export function suggestRating(strength: EvidenceStrength | null, sentence = ''): number | null {
  if (!strength) return null;
  const { action, quantified } = signals(sentence);
  const base = strength === 'strong' ? 3 : 2;
  return Math.min(5, base + (action ? 1 : 0) + (quantified ? 1 : 0));
}

export function shorten(sentence: string, max = 120): string {
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ') > 60 ? cut.lastIndexOf(' ') : max).replace(/[,;:\s]+$/, '') + '…';
}

/** What we compare sentences against for one criterion. */
export function criterionQueries(c: Pick<Criterion, 'name' | 'description' | 'examples'>): string[] {
  const q = [c.description, ...(c.examples ?? [])].filter((x): x is string => Boolean(x));
  return q.length ? q : [c.name];
}

function toSuggestion(c: Criterion, best: { sentence?: string; similarity: number }, method: Method): Suggestion {
  const strength = best.sentence ? strengthFor(best.similarity, method) : null;
  return {
    criterionId: c.id,
    sentence: best.sentence ? shorten(best.sentence) : undefined,
    similarity: best.similarity,
    strength,
    rating: suggestRating(strength, best.sentence),
    method,
  };
}

export type Embed = (texts: string[]) => Promise<number[][]>;

/** Embedding-based matching: best sentence per criterion by cosine similarity. */
export async function extractWithModel(text: string, role: Role, embed: Embed): Promise<Suggestion[]> {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return role.criteria.map((c) => toSuggestion(c, { similarity: 0 }, 'model'));
  const queries = role.criteria.map((c) => criterionQueries(c));
  const flat = queries.flat();
  const vecs = await embed([...sentences, ...flat]);
  const sVecs = vecs.slice(0, sentences.length);
  let k = sentences.length;
  return role.criteria.map((c, i) => {
    const qVecs = vecs.slice(k, k + queries[i].length);
    k += queries[i].length;
    const vocab = criterionVocab(c);
    let best = { sentence: undefined as string | undefined, similarity: 0 };
    sVecs.forEach((sv, si) => {
      const cos = Math.max(0, ...qVecs.map((qv) => cosine(sv, qv)));
      const sim = MODEL_MIX.cosine * cos + MODEL_MIX.keywords * keywordSimilarity(sentences[si], vocab);
      if (sim > best.similarity) best = { sentence: sentences[si], similarity: sim };
    });
    return toSuggestion(c, best, 'model');
  });
}

const STOP = new Set(
  'a an and are as at be by for from has have in into is it its of on or our the their to was were with who what this that not only than more most very also we you your they them my i me'.split(' '),
);

function stem(w: string): string {
  return w.length > 4 ? w.replace(/(ing|ed|s)$/, '') : w;
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9+\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map(stem),
  );
}

export function criterionVocab(c: Pick<Criterion, 'name' | 'description' | 'examples'>): Set<string> {
  return tokens([c.name, ...criterionQueries(c)].join(' '));
}

/** Shared keywords between a sentence and a criterion: 1 hit ≈ 0.33, 2 ≈ 0.5, 3 ≈ 0.6, 4 ≈ 0.67. */
export function keywordSimilarity(sentence: string, vocab: Set<string>): number {
  let hits = 0;
  for (const t of tokens(sentence)) if (vocab.has(t)) hits += 1;
  return hits / (hits + 2);
}

/** Fallback when the model can't load: shared keywords between a sentence and the criterion. */
export function extractWithKeywords(text: string, role: Role): Suggestion[] {
  const sentences = splitSentences(text);
  return role.criteria.map((c) => {
    const vocab = criterionVocab(c);
    let best = { sentence: undefined as string | undefined, similarity: 0 };
    for (const s of sentences) {
      const sim = keywordSimilarity(s, vocab);
      if (sim > best.similarity) best = { sentence: s, similarity: sim };
    }
    return toSuggestion(c, best, 'keywords');
  });
}

/** Turns confirmed suggestions into evidence on the candidate (confirmed by "you"). */
export function toEvidence(
  s: Pick<Suggestion, 'sentence' | 'similarity' | 'method'> & { strength: EvidenceStrength; rating: number },
  note?: string,
): Evidence {
  return {
    rating: Math.max(0, Math.min(5, Math.round(s.rating))),
    strength: s.strength,
    note: (note ?? s.sentence ?? '').trim() || 'Confirmed by you',
    confirmedBy: 'you',
    match: s.sentence ? { sentence: s.sentence, similarity: Math.round(s.similarity * 100) / 100, method: s.method } : undefined,
  };
}

/** Best guess at the person's name: the first short line that looks like a name. */
export function guessName(text: string): string {
  const first = text.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  return /^[A-Z][\p{L}'’-]+(\s[A-Z][\p{L}'’-]+){1,3}$/u.test(first) ? first : '';
}

/** Second line is usually the LinkedIn headline. */
export function guessHeadline(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const h = lines[1] ?? '';
  return h.length > 3 && h.length <= 120 ? h : '';
}
