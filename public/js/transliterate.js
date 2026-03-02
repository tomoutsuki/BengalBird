/**
 * BengalBird - Transliteration Engine (transliterate.js)
 * Converts Roman alphabet input into Bengali script in real time.
 *
 * Uses data/romanisation.json as the ONLY source of truth.
 * Implements longest-match-first parsing strategy.
 * No hardcoded mappings — entirely data-driven.
 */
const Transliterator = (() => {
    'use strict';

    let mappings = {};
    let vowelSigns = {};
    let consonants = [];
    let vowels = [];
    let hasanta = '';
    let specialChars = {};
    let sortedKeys = []; // sorted by length descending for longest-match-first
    let loaded = false;

    /**
     * Load romanisation.json. Must be called before transliterate().
     * Returns a Promise that resolves when ready.
     */
    async function load() {
        if (loaded) return;
        try {
            const resp = await fetch('data/romanisation.json');
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            mappings = data.mappings || {};
            vowelSigns = data.vowelSigns || {};
            consonants = data.consonants || [];
            vowels = data.vowels || [];
            hasanta = data.hasanta || '্';
            specialChars = data.specialChars || {};

            // Sort keys by length descending for longest-match-first
            sortedKeys = Object.keys(mappings).sort((a, b) => b.length - a.length);

            loaded = true;
        } catch (e) {
            console.warn('Transliterator: failed to load romanisation.json', e);
        }
    }

    /**
     * Check if a Bengali character is a consonant.
     */
    function isConsonant(ch) {
        return consonants.includes(ch);
    }

    /**
     * Check if a Bengali character is a vowel.
     */
    function isVowel(ch) {
        return vowels.includes(ch);
    }

    /**
     * Transliterate a Roman string to Bengali.
     * Uses longest-match-first greedy parsing.
     * @param {string} roman - The input Roman string
     * @returns {string} Bengali output
     */
    function transliterate(roman) {
        if (!loaded || !roman) return roman || '';

        let result = '';
        let i = 0;
        let lastWasConsonant = false;

        while (i < roman.length) {
            const ch = roman[i];

            // Check special characters first (punctuation, digits)
            if (specialChars[ch] !== undefined) {
                result += specialChars[ch];
                lastWasConsonant = false;
                i++;
                continue;
            }

            // Pass through spaces and unrecognized punctuation
            if (ch === ' ' || ch === ',' || ch === '!' || ch === '?' || ch === ';' || ch === ':' || ch === '\n' || ch === '\t') {
                result += ch;
                lastWasConsonant = false;
                i++;
                continue;
            }

            // Try longest match first
            let matched = false;
            for (const key of sortedKeys) {
                const slice = roman.substring(i, i + key.length);
                // Case-sensitive comparison for keys that use uppercase
                if (slice === key || (key === key.toLowerCase() && slice.toLowerCase() === key)) {
                    const bengali = mappings[key];

                    if (isVowel(bengali)) {
                        // If preceding character was a consonant, use vowel sign (matra)
                        if (lastWasConsonant && vowelSigns[bengali] !== undefined) {
                            // The inherent 'অ' after a consonant is replaced by the vowel sign
                            result += vowelSigns[bengali];
                        } else {
                            result += bengali;
                        }
                        lastWasConsonant = false;
                    } else if (isConsonant(bengali)) {
                        result += bengali;
                        lastWasConsonant = true;
                    } else {
                        result += bengali;
                        lastWasConsonant = false;
                    }

                    i += key.length;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Unrecognized character — pass through
                result += ch;
                lastWasConsonant = false;
                i++;
            }
        }

        return result;
    }

    /**
     * Check if the engine is ready.
     */
    function isLoaded() {
        return loaded;
    }

    return { load, transliterate, isLoaded };
})();
