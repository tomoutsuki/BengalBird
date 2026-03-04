/**
 * BengalBird IME - Renderer
 * Receives a token array and a Mapper, produces a Bengali string.
 * Simple direct symbol joining — no conjunct logic, no inherent vowel suppression.
 */
class Renderer {
    /**
     * @param {import('./Mapper.js').default} mapper
     */
    constructor(mapper) {
        this._mapper = mapper;
    }

    /**
     * Render tokens to Bengali string.
     * Each token is mapped independently; unmapped tokens pass through as-is.
     * @param {string[]} tokens
     * @returns {string}
     */
    render(tokens) {
        let result = '';

        for (const token of tokens) {
            const bengali = this._mapper.lookup(token);
            if (bengali !== null) {
                result += bengali;
            } else {
                // Unmapped — pass through (spaces, punctuation, unknown chars)
                result += token;
            }
        }

        return result;
    }
}

export default Renderer;
