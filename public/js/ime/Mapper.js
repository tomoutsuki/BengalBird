/**
 * BengalBird IME - Mapper
 * Holds the phonetic mapping table (Roman → Bengali).
 * Provides lookup and sorted key list for the Tokenizer.
 */
class Mapper {
    constructor() {
        /** @type {Object<string, string>} */
        this._map = {
            // Multi-char (longest first by convention, but Tokenizer sorts anyway)
            'kh': 'খ',
            'gh': 'ঘ',
            'ch': 'ছ',
            'jh': 'ঝ',
            'th': 'থ',
            'dh': 'ধ',
            'ph': 'ফ',
            'bh': 'ভ',
            'sh': 'শ',
            'ng': 'ঙ',
            'aa': 'আ',
            'ii': 'ঈ',
            'uu': 'ঊ',

            // Single-char vowels
            'a': 'অ',
            'i': 'ই',
            'u': 'উ',
            'e': 'এ',
            'o': 'ও',

            // Single-char consonants
            'k': 'ক',
            'g': 'গ',
            'c': 'চ',
            'j': 'জ',
            't': 'ত',
            'd': 'দ',
            'n': 'ন',
            'p': 'প',
            'b': 'ব',
            'm': 'ম',
            'r': 'র',
            'l': 'ল',
            's': 'স',
            'h': 'হ',
        };

        /** Keys sorted by descending length for greedy matching */
        this._sortedKeys = Object.keys(this._map)
            .sort((a, b) => b.length - a.length);
    }

    /**
     * Look up the Bengali symbol for a Roman token.
     * @param {string} token
     * @returns {string|null} Bengali character or null if not found
     */
    lookup(token) {
        const key = token.toLowerCase();
        return this._map[key] ?? null;
    }

    /**
     * Get sorted keys for the Tokenizer.
     * @returns {string[]}
     */
    getSortedKeys() {
        return this._sortedKeys;
    }
}

export default Mapper;
