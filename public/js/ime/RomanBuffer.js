/**
 * BengalBird IME - RomanBuffer
 * Manages the raw Roman character input buffer.
 * Pure data structure, no DOM.
 */
class RomanBuffer {
    constructor() {
        this._value = '';
    }

    /**
     * Append a character to the buffer.
     * @param {string} char - Single character to add
     */
    addChar(char) {
        if (typeof char === 'string' && char.length === 1) {
            this._value += char;
        }
    }

    /**
     * Remove the last character from the buffer.
     */
    removeChar() {
        this._value = this._value.slice(0, -1);
    }

    /**
     * Clear the entire buffer.
     */
    clear() {
        this._value = '';
    }

    /**
     * Get the current buffer value.
     * @returns {string}
     */
    getValue() {
        return this._value;
    }
}

export default RomanBuffer;
