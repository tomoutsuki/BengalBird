/**
 * BengalBird IME - IMEController
 * Orchestrates RomanBuffer, Tokenizer, Mapper and Renderer
 * to provide a simple phonetic IME interface.
 *
 * UI-agnostic — returns preview strings, never touches the DOM.
 */
import RomanBuffer from './RomanBuffer.js';
import Tokenizer from './Tokenizer.js';
import Mapper from './Mapper.js';
import Renderer from './Renderer.js';

class IMEController {
    constructor() {
        this._buffer = new RomanBuffer();
        this._mapper = new Mapper();
        this._tokenizer = new Tokenizer(this._mapper.getSortedKeys());
        this._renderer = new Renderer(this._mapper);
        this._committed = '';
    }

    /**
     * Handle a single character input.
     * Updates the buffer, re-parses, and returns the full preview.
     * @param {string} char - Single Roman character
     * @returns {string} Full Bengali string (committed + current preview)
     */
    handleInput(char) {
        this._buffer.addChar(char);
        return this._getFullText();
    }

    /**
     * Handle backspace.
     * Removes last char from buffer and re-renders.
     * @returns {string} Full Bengali string (committed + current preview)
     */
    handleBackspace() {
        this._buffer.removeChar();
        return this._getFullText();
    }

    /**
     * Commit the current buffer: rendered Bengali is appended to
     * the committed string, and the buffer is cleared.
     * @returns {string} Full Bengali string after commit
     */
    commit() {
        const preview = this._renderBuffer();
        this._committed += preview;
        this._buffer.clear();
        return this._committed;
    }

    /**
     * Get the current full text (committed + live preview).
     * @returns {string}
     */
    getPreview() {
        return this._getFullText();
    }

    /**
     * Get only the committed text.
     * @returns {string}
     */
    getCommitted() {
        return this._committed;
    }

    /**
     * Get the current Roman buffer value.
     * @returns {string}
     */
    getRomanBuffer() {
        return this._buffer.getValue();
    }

    /**
     * Reset everything — committed text and buffer.
     */
    reset() {
        this._committed = '';
        this._buffer.clear();
    }

    // ---- Private ----

    /**
     * Render the current buffer to Bengali.
     * @returns {string}
     */
    _renderBuffer() {
        const raw = this._buffer.getValue();
        if (!raw) return '';
        const tokens = this._tokenizer.tokenize(raw);
        return this._renderer.render(tokens);
    }

    /**
     * Full text = committed + live buffer preview.
     * @returns {string}
     */
    _getFullText() {
        return this._committed + this._renderBuffer();
    }
}

export default IMEController;
