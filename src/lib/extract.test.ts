import { describe, expect, it } from 'vitest';
import { EXAMPLE_PROFILES } from '../data/examples';
import { SEED_ROLES } from '../data/roles';
import {
  cosine,
  extractWithKeywords,
  extractWithModel,
  guessHeadline,
  guessName,
  MODEL_THRESHOLDS,
  shorten,
  splitSentences,
  strengthFor,
  suggestRating,
  toEvidence,
} from './extract';

const role = (id: string) => SEED_ROLES.find((r) => r.id === id)!;
const byId = <T extends { criterionId: string }>(xs: T[], id: string) => xs.find((x) => x.criterionId === id)!;

describe('splitSentences', () => {
  it('splits lines, bullets and sentences; drops tiny fragments', () => {
    const s = splitSentences('Jane Doe\n• Built a thing used by 2,000 people. Then shipped v2!\n- ok\nAbout me');
    expect(s).toContain('Built a thing used by 2,000 people.');
    expect(s).toContain('Then shipped v2!');
    expect(s).not.toContain('ok');
  });
});

describe('mapping similarity to evidence', () => {
  it('uses thresholds: strong / weak / missing', () => {
    expect(strengthFor(MODEL_THRESHOLDS.strong, 'model')).toBe('strong');
    expect(strengthFor(MODEL_THRESHOLDS.weak, 'model')).toBe('weak');
    expect(strengthFor(MODEL_THRESHOLDS.weak - 0.01, 'model')).toBeNull();
  });

  it('suggests higher ratings for doing verbs and numbers', () => {
    expect(suggestRating(null, 'anything')).toBeNull();
    expect(suggestRating('weak', 'Interested in speech')).toBe(2);
    expect(suggestRating('strong', 'Knows speech models')).toBe(3);
    expect(suggestRating('strong', 'Built a speech model')).toBe(4);
    expect(suggestRating('strong', 'Shipped an app to 12,000 users')).toBe(5);
  });

  it('shortens long sentences on a word boundary', () => {
    const long = 'word '.repeat(60);
    expect(shorten(long).length).toBeLessThanOrEqual(121);
    expect(shorten(long).endsWith('…')).toBe(true);
  });
});

describe('keyword fallback on the example profiles', () => {
  it('Ines (Founding AI Engineer): finds model building, real-time and builder; no pedigree', () => {
    const ex = EXAMPLE_PROFILES.find((e) => e.id === 'ex-ines')!;
    const s = extractWithKeywords(ex.text, role('ai-eng'));
    expect(byId(s, 'ai_model').strength).toBe('strong');
    expect(byId(s, 'ai_rt').strength).toBe('strong');
    expect(byId(s, 'ai_builder').strength).toBe('strong');
    expect(byId(s, 'ai_pedigree').strength).toBeNull();
    expect(byId(s, 'ai_rt').sentence).toMatch(/latency|streaming/);
  });

  it('Dami (Full Stack): backend + builder found; pedigree and low ego missing', () => {
    const ex = EXAMPLE_PROFILES.find((e) => e.id === 'ex-dami')!;
    const s = extractWithKeywords(ex.text, role('fullstack'));
    expect(byId(s, 'fs_backend').strength).toBe('strong');
    expect(byId(s, 'fs_builder').strength).not.toBeNull();
    expect(byId(s, 'fs_pedigree').strength).toBeNull();
    expect(byId(s, 'fs_ego').strength).toBeNull();
  });

  it('Kit (Talent Partner): process builder, direct sourcing and plain writing found', () => {
    const ex = EXAMPLE_PROFILES.find((e) => e.id === 'ex-kit')!;
    const s = extractWithKeywords(ex.text, role('talent'));
    expect(byId(s, 'tp_builder').strength).toBe('strong');
    expect(byId(s, 'tp_sourcing').strength).toBe('strong');
    expect(byId(s, 'tp_sharp').strength).not.toBeNull();
  });

  it('empty text gives no evidence', () => {
    for (const x of extractWithKeywords('', role('ai-eng'))) expect(x.strength).toBeNull();
  });
});

describe('model matching (with a fake embedder)', () => {
  // Fake embedding: bag of a few words, so similarity is predictable.
  const VOCAB = ['latency', 'real-time', 'streaming', 'speech', 'trained', 'scratch', 'model', 'built', 'shipped'];
  const fake = async (texts: string[]) => texts.map((t) => VOCAB.map((w) => (t.toLowerCase().includes(w) ? 1 : 0)));

  it('picks the best-matching sentence per criterion by cosine similarity', async () => {
    const text = 'Cut streaming speech latency to 200ms in real-time.\nLikes cooking.';
    const s = await extractWithModel(text, role('ai-eng'), fake);
    expect(byId(s, 'ai_rt').sentence).toMatch(/latency|streaming/);
    expect(byId(s, 'ai_rt').method).toBe('model');
    expect(byId(s, 'ai_rt').similarity).toBeGreaterThan(0);
  });

  it('cosine is 1 for identical and 0 for orthogonal vectors', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });
});

describe('helpers', () => {
  it('guesses name and headline from a pasted profile', () => {
    const t = EXAMPLE_PROFILES[0].text;
    expect(guessName(t)).toBe('Ines Carver');
    expect(guessHeadline(t)).toBe('Speech ML Engineer at Halyard Audio');
    expect(guessName('about me\nstuff')).toBe('');
  });

  it('confirmed suggestions become evidence confirmed by "you", with the matched sentence', () => {
    const e = toEvidence({ sentence: 'Built X', similarity: 0.6234, method: 'model', strength: 'strong', rating: 4.4 });
    expect(e).toMatchObject({ rating: 4, strength: 'strong', confirmedBy: 'you', match: { sentence: 'Built X', similarity: 0.62 } });
  });
});
