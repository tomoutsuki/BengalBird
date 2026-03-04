/**
 * BengalBird IME - Tokenizer
 * Greedy longest-match parser.
 * Takes a Roman string and a sorted key list,
 * produces an array of matched tokens.
 */
class Tokenizer {
    /**
     * @param {string[]} sortedKeys - Mapping keys sorted by descending length
     */
    constructor(sortedKeys) {
        this._sortedKeys = sortedKeys;
    }

    /**
     * Update the key list (e.g. if mappings change).
     * @param {string[]} sortedKeys
     */
    setKeys(sortedKeys) {
        this._sortedKeys = sortedKeys;
    }

    /**
     * Tokenize the input string using greedy longest-match.
     * @param {string} input - Roman input string
     * @returns {string[]} Array of matched tokens
     */
    tokenize(input) {
        const tokens = [];
        let i = 0;

        while (i < input.length) {
            let matched = false;

            for (const key of this._sortedKeys) {
                if (i + key.length > input.length) continue;

                const slice = input.substring(i, i + key.length).toLowerCase();
                if (slice === key) {
                    tokens.push(key);
                    i += key.length;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // No mapping match — consume single char as literal
                tokens.push(input[i]);
                i++;
            }
        }

        return tokens;
    }
}

export default Tokenizer;
