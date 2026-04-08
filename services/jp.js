import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Kuroshiro uses CJS internally; we bridge it via createRequire
const KuroshiroModule = require('kuroshiro');
const KuromojiModule = require('kuroshiro-analyzer-kuromoji');

// Handle both default and named exports
const Kuroshiro = KuroshiroModule.default || KuroshiroModule;
const KuromojiAnalyzer = KuromojiModule.default || KuromojiModule;

/**
 * Japanese Mora Engine
 * Handles: Kanji→Hiragana, mora counting, SynthV formatting, romaji
 */

let kuroshiro = null;
let initPromise = null;

// Lazy singleton initialization
const getKuroshiro = async () => {
  if (kuroshiro) return kuroshiro;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const k = new Kuroshiro();
    await k.init(new KuromojiAnalyzer());
    kuroshiro = k;
    console.log('✅ Kuroshiro NLP engine initialized');
    return k;
  })();

  return initPromise;
};

/**
 * Convert any Japanese text (Kanji/mixed) to plain hiragana
 */
export const toHiragana = async (text) => {
  const k = await getKuroshiro();
  const result = await k.convert(text, { to: 'hiragana', mode: 'normal' });
  // Strip any HTML tags that kuroshiro might add
  return result.replace(/<[^>]+>/g, '');
};

/**
 * Convert Japanese text to romaji
 */
export const toRomaji = async (text) => {
  const k = await getKuroshiro();
  const result = await k.convert(text, { to: 'romaji', mode: 'spaced' });
  return result.replace(/<[^>]+>/g, '');
};

/**
 * Count mora from hiragana string
 * Rules:
 *   - Compound kana (e.g. きょ) = 1 mora
 *   - Long vowel ー = 1 mora
 *   - Geminate consonant っ = 1 mora
 *   - Nasal ん = 1 mora (captured by base pattern)
 */
export const countMora = (hiragana) => {
  // Normalize: remove spaces and non-Japanese chars for counting
  const clean = hiragana.replace(/\s/g, '');
  const matches = clean.match(/[ぁ-ん][ゃゅょ]?|ー|っ/g);
  return matches ? matches.length : 0;
};

/**
 * Format hiragana for Synthesizer V "Batch Lyric Input"
 * Each mora separated by a space
 * e.g. "きょうは" → "きょ う は"
 */
export const formatForSynthV = (hiragana) => {
  const clean = hiragana.replace(/\s/g, '');
  const matches = clean.match(/[ぁ-ん][ゃゅょ]?|ー|っ/g);
  if (!matches) return '';
  return matches.join(' ');
};

/**
 * Full pipeline: text → hiragana → count + format
 */
export const analyzeJapanese = async (text) => {
  const hiragana = await toHiragana(text);
  const moraCount = countMora(hiragana);
  const hiraganaSpaced = formatForSynthV(hiragana);
  const romaji = await toRomaji(text);

  return { hiragana, moraCount, hiraganaSpaced, romaji };
};

// Pre-warm the engine on module load
getKuroshiro().catch((err) => console.error('Kuroshiro init error:', err));
