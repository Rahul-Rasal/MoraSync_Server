// import ai from '../config/ai.js';
// import { analyzeJapanese } from './jp.js';
// import ApiLog from '../models/ApiLog.js';



// const MAX_ATTEMPTS = 3;
// const MODEL = 'gemini-2.5-flash';

// /**
//  * Build the initial poetic translation prompt
//  */
// const buildInitialPrompt = (enText, targetMora) => `
// You are a poetic Japanese lyricist writing songs for Vocaloid / Synthesizer V.
// Your task: Translate the following English phrase into beautiful, lyrical Japanese.

// RULES (CRITICAL):
// 1. The Japanese output must be EXACTLY ${targetMora} mora (syllable units).
// 2. Use poetic, emotive language — NOT a literal translation. Prioritize the feeling.
// 3. Compound kana (e.g. きょ, しゃ, ちゅ) count as 1 mora.
// 4. Long vowels (ー) count as 1 mora.
// 5. Small っ counts as 1 mora.
// 6. ん counts as 1 mora.
// 7. Output ONLY the Japanese text — no explanations, no romaji, no translations.

// English phrase: "${enText}"
// Target mora count: ${targetMora}

// Japanese output:`.trim();

// /**
//  * Build correction prompt for retry attempts
//  */
// const buildCorrectionPrompt = (actualMora, targetMora, lastAttempt) => `
// WRONG MORA COUNT. Your last output was: "${lastAttempt}"
// That had ${actualMora} mora. I need EXACTLY ${targetMora} mora.

// ${actualMora > targetMora
//   ? `You used TOO MANY mora. Remove ${actualMora - targetMora} mora. Use shorter vocabulary, simpler words, or contract phrases.`
//   : `You used TOO FEW mora. Add ${targetMora - actualMora} more mora. Use longer words, add an adjective, or expand the imagery.`
// }

// Try again. Output ONLY the Japanese text:`.trim();

// /**
//  * Core Recursive Validation Loop
//  * Calls Gemini up to 3 times, verifying mora count each time
//  */
// export const generateLyrics = async ({ enText, targetNotes, userId, projectId, sectionId }) => {
//   let history = [];
//   let bestResult = null;
//   let bestDiff = Infinity;
//   let finalAttempts = 0;
//   let lastJpText = '';

//   for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
//     finalAttempts = attempt;

//     // Build prompt
//     let userMessage;
//     if (attempt === 1) {
//       userMessage = buildInitialPrompt(enText, targetNotes);
//     } else {
//       const { moraCount } = await analyzeJapanese(lastJpText);
//       userMessage = buildCorrectionPrompt(moraCount, targetNotes, lastJpText);
//     }

//     // Add to conversation history
//     history.push({ role: 'user', parts: [{ text: userMessage }] });

//     try {
//       // Call Gemini with conversation history
//       const chat = ai.chats.create({ model: MODEL, history: history.slice(0, -1) });
//       const response = await chat.sendMessage({ message: userMessage });
//       const jpText = response.text.trim();
//       lastJpText = jpText;

//       // Add AI response to history
//       history.push({ role: 'model', parts: [{ text: jpText }] });

//       // Analyze mora count
//       const analysis = await analyzeJapanese(jpText);
//       const diff = Math.abs(analysis.moraCount - targetNotes);

//       // Track best result
//       if (diff < bestDiff) {
//         bestDiff = diff;
//         bestResult = { ...analysis, jpLyrics: jpText, attempts: attempt };
//       }

//       // Perfect match — stop
//       if (diff === 0) {
//         break;
//       }
//     } catch (error) {
//       console.error(`Gemini attempt ${attempt} failed:`, error.message);
//       if (attempt === MAX_ATTEMPTS) {
//         throw new Error('AI generation failed after all attempts');
//       }
//     }
//   }

//   const matched = bestDiff === 0;
//   const flag = matched ? 'OK' : 'WARNING';

//   // Log to DB for admin analytics
//   try {
//     await ApiLog.create({
//       userId,
//       projectId,
//       sectionId,
//       model: MODEL,
//       attempts: finalAttempts,
//       targetMora: targetNotes,
//       actualMora: bestResult?.moraCount || 0,
//       matched,
//       flag,
//       enInput: enText,
//       jpOutput: bestResult?.jpLyrics || '',
//     });

//     // Increment user credit usage
//     if (userId) {
//       const User = (await import('../models/User.js')).default;
//       await User.findByIdAndUpdate(userId, { $inc: { creditsUsed: finalAttempts } });
//     }
//   } catch (logErr) {
//     console.error('ApiLog error (non-fatal):', logErr.message);
//   }

//   return {
//     jpLyrics: bestResult?.jpLyrics || '',
//     hiragana: bestResult?.hiragana || '',
//     hiraganaSpaced: bestResult?.hiraganaSpaced || '',
//     romaji: bestResult?.romaji || '',
//     moraCount: bestResult?.moraCount || 0,
//     targetNotes,
//     matched,
//     flag,
//     attempts: finalAttempts,
//   };
// };


import ai from '../config/ai.js';
import { analyzeJapanese } from './jp.js';
import ApiLog from '../models/ApiLog.js';

// Helper to wait between attempts
const wait = (ms) => new Promise(res => setTimeout(res, ms));

const MAX_ATTEMPTS = 3;
// const MODEL = 'gemini-2.5-flash';
const MODEL = 'gemini-pro';



/**
 * Build the initial poetic translation prompt
 */
const buildInitialPrompt = (enText, targetMora) => `
You are a poetic Japanese lyricist writing songs for Vocaloid / Synthesizer V.
Your task: Translate the following English phrase into beautiful, lyrical Japanese.

RULES (CRITICAL):
1. The Japanese output must be EXACTLY ${targetMora} mora (syllable units).
2. Use poetic, emotive language — NOT a literal translation. Prioritize the feeling.
3. Compound kana (e.g. きょ, しゃ, ちゅ) count as 1 mora.
4. Long vowels (ー) count as 1 mora.
5. Small っ counts as 1 mora.
6. ん counts as 1 mora.
7. Output ONLY the Japanese text — no explanations, no romaji, no translations.

English phrase: "${enText}"
Target mora count: ${targetMora}

Japanese output:`.trim();

/**
 * Build correction prompt for retry attempts
 */
const buildCorrectionPrompt = (actualMora, targetMora, lastAttempt) => `
WRONG MORA COUNT. Your last output was: "${lastAttempt}"
That had ${actualMora} mora. I need EXACTLY ${targetMora} mora.

${actualMora > targetMora
  ? `You used TOO MANY mora. Remove ${actualMora - targetMora} mora. Use shorter vocabulary, simpler words, or contract phrases.`
  : `You used TOO FEW mora. Add ${targetMora - actualMora} more mora. Use longer words, add an adjective, or expand the imagery.`
}

Try again. Output ONLY the Japanese text:`.trim();

/**
 * Core Recursive Validation Loop
 * Calls Gemini up to 3 times, verifying mora count each time
 */
export const generateLyrics = async ({ enText, targetNotes, userId, projectId, sectionId }) => {
  let history = [];
  let bestResult = null;
  let bestDiff = Infinity;
  let finalAttempts = 0;
  let lastJpText = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    finalAttempts = attempt;

    // Wait 2 seconds before try #2 and try #3 to bypass server spikes
    if (attempt > 1) await wait(2000);

    // Build prompt
    let userMessage;
    if (attempt === 1) {
      userMessage = buildInitialPrompt(enText, targetNotes);
    } else {
      const { moraCount } = await analyzeJapanese(lastJpText);
      userMessage = buildCorrectionPrompt(moraCount, targetNotes, lastJpText);
    }

    // Add to conversation history
    history.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
      // Call Gemini with conversation history
      const chat = ai.chats.create({ model: MODEL, history: history.slice(0, -1) });
      const response = await chat.sendMessage({ message: userMessage });
      const jpText = response.text.trim();
      lastJpText = jpText;

      // Add AI response to history
      history.push({ role: 'model', parts: [{ text: jpText }] });

      // Analyze mora count
      const analysis = await analyzeJapanese(jpText);
      const diff = Math.abs(analysis.moraCount - targetNotes);

      // Track best result
      if (diff < bestDiff) {
        bestDiff = diff;
        bestResult = { ...analysis, jpLyrics: jpText, attempts: attempt };
      }

      // Perfect match — stop
      if (diff === 0) {
        break;
      }
    } catch (error) {
      console.error(`Gemini attempt ${attempt} failed:`, error.message);
      if (attempt === MAX_ATTEMPTS) {
        throw new Error('AI generation failed after all attempts');
      }
    }
  }

  const matched = bestDiff === 0;
  const flag = matched ? 'OK' : 'WARNING';

  // Log to DB for admin analytics
  try {
    await ApiLog.create({
      userId,
      projectId,
      sectionId,
      model: MODEL,
      attempts: finalAttempts,
      targetMora: targetNotes,
      actualMora: bestResult?.moraCount || 0,
      matched,
      flag,
      enInput: enText,
      jpOutput: bestResult?.jpLyrics || '',
    });

    // Increment user credit usage
    if (userId) {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(userId, { $inc: { creditsUsed: finalAttempts } });
    }
  } catch (logErr) {
    console.error('ApiLog error (non-fatal):', logErr.message);
  }

  return {
    jpLyrics: bestResult?.jpLyrics || '',
    hiragana: bestResult?.hiragana || '',
    hiraganaSpaced: bestResult?.hiraganaSpaced || '',
    romaji: bestResult?.romaji || '',
    moraCount: bestResult?.moraCount || 0,
    targetNotes,
    matched,
    flag,
    attempts: finalAttempts,
  };
};
