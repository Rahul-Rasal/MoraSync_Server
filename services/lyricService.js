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


// import ai from '../config/ai.js';
// import { analyzeJapanese } from './jp.js';
// import ApiLog from '../models/ApiLog.js';

// // Helper to wait between attempts
// const wait = (ms) => new Promise(res => setTimeout(res, ms));

// const MAX_ATTEMPTS = 3;
// const MODEL = 'gemini-2.5-flash';
// // const MODEL = 'gemini-pro';



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

//     // Wait 2 seconds before try #2 and try #3 to bypass server spikes
//     if (attempt > 1) await wait(2000);

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

// import genAI from '../config/ai.js';
// import { analyzeJapanese } from './jp.js';
// import ApiLog from '../models/ApiLog.js';

// // Helper to wait 2 seconds between attempts
// const wait = (ms) => new Promise(res => setTimeout(res, ms));

// const MAX_ATTEMPTS = 3;
// const MODEL = 'gemini-2.5-flash-lite';



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

//   // 1. Get the official model instance
//   const model = genAI.getGenerativeModel({ model: MODEL });

//   for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
//     finalAttempts = attempt;

//     // 2. Wait 2 seconds before try #2 and try #3
//     if (attempt > 1) await wait(2000);

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
//       // 3. Official Google Chat Syntax
//       const chat = model.startChat({ 
//         history: history.slice(0, -1) 
//       });
//       const result = await chat.sendMessage(userMessage);
//       const jpText = result.response.text().trim();
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

import genAI from '../config/ai.js';
import { analyzeJapanese } from './jp.js';
import ApiLog from '../models/ApiLog.js';

// Helper to wait 2 seconds between attempts
const wait = (ms) => new Promise(res => setTimeout(res, ms));

const MAX_ATTEMPTS = 5;
const MODEL = 'gemini-2.5-flash-lite';

/**
 * Build the initial poetic translation prompt
 * This is a deeply detailed "songwriter persona" prompt designed to
 * extract the highest quality creative output from the model.
 */
const buildInitialPrompt = (enText, targetMora) => `
You are KOTOBA (言葉) — an elite Japanese lyricist who has written award-winning songs for Vocaloid producers like DECO*27, Kenshi Yonezu, and YOASOBI's Ayase.

YOUR MISSION: Transform the English meaning below into a breathtaking Japanese lyric line that fits EXACTLY ${targetMora} notes in a Synthesizer V vocal track.

═══════════════════════════════════════
ARTISTIC DIRECTION
═══════════════════════════════════════
• Write like a poet, NOT a translator. Capture the SOUL of the meaning.
• Use vivid sensory imagery: colors, weather, light, seasons, touch, sound.
• Favor evocative literary vocabulary (文語的表現) over everyday speech.
• Create internal rhyme through vowel harmony — lines should SING beautifully.
  Example: ending consecutive phrases with similar vowel sounds (あ段, い段, etc.)
• Use metaphor liberally: "sadness" → "雨に溶ける影" (a shadow dissolving in rain).
• Vary between kanji compound words and soft hiragana for rhythmic texture.
• Think about how each syllable will SOUND when sung by a vocal synthesizer.
• Avoid stiff, textbook Japanese. This must feel like a real hit song lyric.

═══════════════════════════════════════
MORA COUNTING RULES (ABSOLUTE LAW)
═══════════════════════════════════════
The output MUST contain EXACTLY ${targetMora} mora. Not ${targetMora - 1}. Not ${targetMora + 1}. EXACTLY ${targetMora}.

Before you output, mentally count every mora using these rules:
• Each basic kana = 1 mora (あ, か, さ, た, な, は, ま, や, ら, わ, etc.)
• Compound kana (拗音) like きょ, しゃ, ちゅ, にょ = 1 mora (the small ゃゅょ does NOT add a mora)
• Long vowel mark ー = 1 mora
• Small っ (geminate/double consonant) = 1 mora
• ん (nasal) = 1 mora
• Small ぁぃぅぇぉ after a kana = 0 mora (they modify the previous sound)

COUNTING EXAMPLE: "きょうはいい天気" → きょ(1) う(2) は(3) い(4) い(5) て(6) ん(7) き(8) = 8 mora

SELF-CHECK PROCEDURE:
1. Convert your output mentally to full hiragana
2. Count each mora unit one by one
3. Verify the total equals EXACTLY ${targetMora}
4. If it doesn't match, revise BEFORE outputting

═══════════════════════════════════════
INPUT
═══════════════════════════════════════
English meaning to transform: "${enText}"
Required mora count: ${targetMora}

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
Output ONLY the Japanese lyric line. Nothing else. No explanations, no romaji, no parentheses, no quotation marks, no mora count verification text. Just the raw Japanese text.

Japanese lyric:`.trim();

/**
 * Build correction prompt for retry attempts
 * This prompt is much more specific about HOW to fix the mora count
 * while maintaining poetic quality.
 */
const buildCorrectionPrompt = (actualMora, targetMora, lastAttempt) => `
═══ MORA MISMATCH — REVISION REQUIRED ═══

Your previous output: "${lastAttempt}"
Actual mora count: ${actualMora}
Required mora count: ${targetMora}
Difference: ${actualMora > targetMora ? `${actualMora - targetMora} TOO MANY` : `${targetMora - actualMora} TOO FEW`}

${actualMora > targetMora
  ? `STRATEGY TO REDUCE BY ${actualMora - targetMora} MORA:
• Replace a multi-mora word with a shorter synonym (e.g. かなしみ→涙, うつくしい→美しき→きれい)
• Use kanji compounds that pack meaning into fewer mora (e.g. ひかり→光, こころ→心)
• Remove an adjective or adverb while keeping the core emotion
• Contract verb forms (e.g. している→してる, ～ている→～てる)
• Use compound kana where possible (e.g. きよ→きょ if it makes a real word)`
  : `STRATEGY TO ADD ${targetMora - actualMora} MORA:
• Expand a kanji compound into its hiragana reading (e.g. 光→ひかり, adds 1 mora)  
• Add a poetic adjective or intensifier (e.g. 深い, 遠い, ただ, まだ, もう)
• Use a longer synonym (e.g. 夜→よるの闇, 空→あおぞら)
• Add a particle for emotional emphasis (e.g. よ, ね, さ, も, は)
• Extend with a poetic suffix (e.g. ～のように, ～みたいに)`
}

IMPORTANT: Do NOT sacrifice poetic quality for the sake of the mora count. Find a beautiful solution that achieves BOTH goals.

Re-do the SELF-CHECK: Convert to hiragana mentally, count each mora, verify it equals EXACTLY ${targetMora}.

Output ONLY the revised Japanese lyric line. Nothing else:`.trim();

/**
 * Core Recursive Validation Loop
 * Calls Gemini up to 5 times, verifying mora count each time
 */
export const generateLyrics = async ({ enText, targetNotes, userId, projectId, sectionId }) => {
  let history = [];
  let bestResult = null;
  let bestDiff = Infinity;
  let finalAttempts = 0;
  let lastJpText = '';

  // 1. Get the official model instance
  const model = genAI.getGenerativeModel({ model: MODEL });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    finalAttempts = attempt;

    // 2. Wait 2 seconds before retries to bypass server spikes
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
      // 3. Official Google Chat Syntax
      const chat = model.startChat({ 
        history: history.slice(0, -1) 
      });
      const result = await chat.sendMessage(userMessage);
      const jpText = result.response.text().trim();
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
