/**
 * BengalBird - Word-level Dictionary IME (word-ime.js)
 *
 * Converts a typed romanised word to Bengali by looking it up in
 * dictionary data loaded from the backend API.
 *
 * Conversion only triggers on SPACE or ENTER — the full word typed
 * before the trigger is matched against the "romanised" field of
 * every dictionary entry.  The first exact match returns the
 * corresponding "bn" value unchanged.
 *
 * If no dictionary entry matches, the original typed text is kept
 * as-is so the user can see what they wrote.
 *
 * Usage:
 *   await WordIME.init();                // load dictionary once
 *   WordIME.convert('obhidhan');         // → 'অভিধান'
 *   WordIME.convert('biral');            // → 'বিড়াল'
 *   WordIME.convert('xyz_unknown');      // → 'xyz_unknown' (pass-through)
 *   WordIME.isReady();                   // → true after init
 */
const WordIME = (() => {
    'use strict';

    const API_ALL_PATH = '/api/dictionary/all';

    // romanised (lowercase) → first matching bn
    let romanisedMap = {};
    let ready = false;
    let loading = false;

    /**
    * Load dictionary entries and build the romanised→bn lookup map.
     * Safe to call multiple times; only loads once.
     */
    async function init() {
        if (ready || loading) return;
        loading = true;
        try {
            const resp = await fetch(API_ALL_PATH);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const entries = await resp.json();

            for (const entry of entries) {
                if (entry && entry.romanised && entry.bn) {
                    const key = entry.romanised.trim().toLowerCase();
                    // Keep only the first seen mapping per romanised form
                    if (key && !(key in romanisedMap)) {
                        romanisedMap[key] = entry.bn;
                    }
                }
            }

            ready = true;
        } catch (e) {
            console.error('WordIME: failed to load dictionary API data', e);
            ready = true; // Mark ready so callers are not blocked
        } finally {
            loading = false;
        }
    }

    /**
     * @returns {boolean} true once the dictionary has been loaded
     */
    function isReady() {
        return ready;
    }

    /**
     * Convert a single romanised word to Bengali by exact dictionary lookup.
     * Lookup is case-insensitive.  If no match is found the input is
     * returned unchanged so the user's text is never silently dropped.
     *
     * @param {string} roman - the romanised word (no spaces)
     * @returns {string} Bengali script word, or the original string if not found
     */
    function convert(roman) {
        if (!roman) return '';
        if (!ready) return roman;
        const key = roman.trim().toLowerCase();
        return romanisedMap[key] !== undefined ? romanisedMap[key] : roman;
    }

    /**
     * Convert a full string by splitting on whitespace.
     * Each token is looked up individually; spaces in the original
     * text are preserved.
     *
     * @param {string} text
     * @returns {string}
     */
    function convertText(text) {
        if (!text) return '';
        return text.split(/(\s+)/).map(part => {
            if (/^\s+$/.test(part)) return part;
            return convert(part);
        }).join('');
    }

    return { init, isReady, convert, convertText };
})();
