/**
 * Finnish syllabification algorithm.
 *
 * Rules:
 * 1. Single consonant between vowels -> split before consonant: KA-LA
 * 2. Multiple consonants between vowels -> split so last consonant starts new syllable: KART-TA
 * 3. Diphthongs and long vowels are NOT split
 * 4. Two vowels that don't form a diphthong or long vowel -> split between them: LU-E
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'ä', 'ö']);

const DIPHTHONGS = new Set([
  'ai', 'ei', 'oi', 'ui', 'yi', 'äi', 'öi',
  'au', 'eu', 'iu', 'ou', 'äy', 'öy',
  'ie', 'uo', 'yö',
]);

const LONG_VOWELS = new Set([
  'aa', 'ee', 'ii', 'oo', 'uu', 'yy', 'ää', 'öö',
]);

function isVowel(ch) {
  return VOWELS.has(ch.toLowerCase());
}

function isConsonant(ch) {
  return !isVowel(ch) && /\p{L}/u.test(ch);
}

/**
 * Hyphenate a Finnish word into syllables.
 * @param {string} word - The word to hyphenate (any case).
 * @returns {string[]} Array of syllables.
 */
export function hyphenate(word) {
  const lower = word.toLowerCase();
  const chars = [...lower];
  const len = chars.length;

  if (len <= 1) return [word];

  // Find split points (indices where a new syllable starts)
  const splits = [];

  let i = 0;
  while (i < len) {
    // Find the start of a vowel cluster
    if (isVowel(chars[i])) {
      // Determine the extent of the vowel cluster
      let vowelStart = i;
      let vowelEnd = i;

      // Walk through the vowel cluster, respecting diphthongs and long vowels
      while (vowelEnd < len - 1 && isVowel(chars[vowelEnd + 1])) {
        const pair = chars[vowelEnd] + chars[vowelEnd + 1];
        if (DIPHTHONGS.has(pair) || LONG_VOWELS.has(pair)) {
          vowelEnd++;
        } else {
          // Two vowels that don't form a diphthong/long vowel: split between them
          splits.push(vowelEnd + 1);
          vowelEnd++;
        }
      }

      // Now look ahead for consonants after this vowel cluster
      let consStart = vowelEnd + 1;
      let consEnd = consStart;
      while (consEnd < len && isConsonant(chars[consEnd])) {
        consEnd++;
      }

      let numConsonants = consEnd - consStart;
      if (numConsonants > 0 && consEnd < len) {
        // There are consonants followed by more vowels
        if (numConsonants === 1) {
          // Single consonant: split before it
          splits.push(consStart);
        } else {
          // Multiple consonants: split so last consonant starts new syllable
          splits.push(consEnd - 1);
        }
      }
      // If consonants are at end of word, they stay with current syllable

      i = consEnd > vowelEnd + 1 ? consEnd : vowelEnd + 1;
    } else {
      i++;
    }
  }

  // Remove duplicates and sort
  const uniqueSplits = [...new Set(splits)].sort((a, b) => a - b);

  // Build syllables from original word (preserving case)
  const originalChars = [...word];
  const syllables = [];
  let prev = 0;
  for (const splitIdx of uniqueSplits) {
    if (splitIdx > prev && splitIdx < originalChars.length) {
      syllables.push(originalChars.slice(prev, splitIdx).join(''));
      prev = splitIdx;
    }
  }
  syllables.push(originalChars.slice(prev).join(''));

  return syllables;
}

/**
 * Get hyphenated display string for a word.
 * @param {string} word - The word to hyphenate.
 * @returns {string} Hyphenated word, e.g. "KIS-SA".
 */
export function hyphenateWord(word) {
  return hyphenate(word).join('-');
}
