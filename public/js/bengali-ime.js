/**
 * BengalBird IME - Browser Bundle (bengali-ime.js)
 * Bundles RomanBuffer, Tokenizer, Mapper, Renderer, IMEController
 * into a single global `BengaliIME` object for non-module script loading.
 *
 * Usage:
 *   const ime = BengaliIME.createController();
 *   let preview = ime.handleInput('n');  // "ন"
 *   preview = ime.handleInput('o');      // "নও"
 *   ...
 *   ime.commit();   // commit current buffer
 *   ime.reset();    // clear everything
 */
const BengaliIME = (() => {
    'use strict';

    // ======== RomanBuffer ========
    class RomanBuffer {
        constructor() {
            this._value = '';
        }
        addChar(char) {
            if (typeof char === 'string' && char.length === 1) {
                this._value += char;
            }
        }
        removeChar() {
            this._value = this._value.slice(0, -1);
        }
        clear() {
            this._value = '';
        }
        getValue() {
            return this._value;
        }
    }

    // ======== Mapper ========
    class Mapper {
        constructor() {
            this._map = {
                // Multi-char
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
            this._sortedKeys = Object.keys(this._map)
                .sort((a, b) => b.length - a.length);
        }
        lookup(token) {
            const key = token.toLowerCase();
            return this._map[key] ?? null;
        }
        getSortedKeys() {
            return this._sortedKeys;
        }
    }

    // ======== Tokenizer ========
    class Tokenizer {
        constructor(sortedKeys) {
            this._sortedKeys = sortedKeys;
        }
        setKeys(sortedKeys) {
            this._sortedKeys = sortedKeys;
        }
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
                    tokens.push(input[i]);
                    i++;
                }
            }
            return tokens;
        }
    }

    // ======== Renderer ========
    class Renderer {
        constructor(mapper) {
            this._mapper = mapper;
        }
        render(tokens) {
            let result = '';
            for (const token of tokens) {
                const bengali = this._mapper.lookup(token);
                result += bengali !== null ? bengali : token;
            }
            return result;
        }
    }

    // ======== IMEController ========
    class IMEController {
        constructor() {
            this._buffer = new RomanBuffer();
            this._mapper = new Mapper();
            this._tokenizer = new Tokenizer(this._mapper.getSortedKeys());
            this._renderer = new Renderer(this._mapper);
            this._committed = '';
        }
        handleInput(char) {
            this._buffer.addChar(char);
            return this._getFullText();
        }
        handleBackspace() {
            this._buffer.removeChar();
            return this._getFullText();
        }
        commit() {
            const preview = this._renderBuffer();
            this._committed += preview;
            this._buffer.clear();
            return this._committed;
        }
        getPreview() {
            return this._getFullText();
        }
        getCommitted() {
            return this._committed;
        }
        getRomanBuffer() {
            return this._buffer.getValue();
        }
        reset() {
            this._committed = '';
            this._buffer.clear();
        }
        _renderBuffer() {
            const raw = this._buffer.getValue();
            if (!raw) return '';
            const tokens = this._tokenizer.tokenize(raw);
            return this._renderer.render(tokens);
        }
        _getFullText() {
            return this._committed + this._renderBuffer();
        }
    }

    // ======== Public API ========
    return {
        createController() {
            return new IMEController();
        },
        /**
         * One-shot convenience: convert a Roman string to Bengali.
         * @param {string} roman
         * @returns {string}
         */
        convert(roman) {
            const mapper = new Mapper();
            const tokenizer = new Tokenizer(mapper.getSortedKeys());
            const renderer = new Renderer(mapper);
            const tokens = tokenizer.tokenize(roman);
            return renderer.render(tokens);
        }
    };
})();
