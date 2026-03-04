/**
 * BengalBird - Keyboard Page (keyboard-page.js)
 * Standalone Bengali keyboard playground with two modes:
 *   1. Bengali on-screen keyboard (tap letters)
 *   2. Roman input IME - converts full words on SPACE / ENTER
 *
 * Depends on: WordIME (word-ime.js), I18n
 */
const KeyboardPage = (() => {
    'use strict';

    let container = null;
    let displayText = '';    // current committed Bengali text
    let romanBuffer = '';    // currently typed roman chars (uncommitted)

    // Bengali keyboard layout (commonly used letters)
    const KB_ROWS = [
        ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'এ', 'ঐ', 'ও', 'ঔ'],
        ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'],
        ['ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন'],
        ['প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ'],
        ['স', 'হ', 'ড়', 'ঢ়', 'য়', 'ৎ', 'ং', 'ঃ', 'ঁ']
    ];

    // Common vowel signs (kar) for composition
    const KAR_ROW = ['া', 'ি', 'ী', 'ু', 'ূ', 'ে', 'ৈ', 'ো', 'ৌ', '্'];

    /**
     * Initialize keyboard page.
     * @param {HTMLElement} el - #section-keyboard
     */
    function init(el) {
        container = el;
        render();
    }

    /**
     * Build the keyboard page DOM.
     */
    function render() {
        container.innerHTML = '';

        // Title
        const title = document.createElement('h2');
        title.className = 'kb-page-title';
        title.textContent = I18n.t('kb_page_title');
        container.appendChild(title);

        // Display area
        const display = document.createElement('div');
        display.className = 'kb-page-display';
        display.id = 'kb-page-display';

        const displaySpan = document.createElement('span');
        displaySpan.id = 'kb-page-display-text';
        displaySpan.textContent = '';
        display.appendChild(displaySpan);

        const bufferSpan = document.createElement('span');
        bufferSpan.id = 'kb-page-buffer';
        bufferSpan.className = 'kb-buffer-text';
        bufferSpan.textContent = '';
        display.appendChild(bufferSpan);

        const cursor = document.createElement('span');
        cursor.className = 'cursor-blink';
        display.appendChild(cursor);

        container.appendChild(display);

        // Clear button
        const clearRow = document.createElement('div');
        clearRow.className = 'kb-page-actions';

        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-secondary btn-sm';
        clearBtn.textContent = I18n.t('kb_clear');
        clearBtn.addEventListener('click', () => {
            displayText = '';
            romanBuffer = '';
            updateDisplay();
        });
        clearRow.appendChild(clearBtn);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-secondary btn-sm';
        copyBtn.textContent = I18n.t('kb_copy');
        copyBtn.addEventListener('click', () => {
            const text = displayText + (romanBuffer ? WordIME.convert(romanBuffer) : '');
            if (text && navigator.clipboard) {
                navigator.clipboard.writeText(text).catch(() => {});
            }
        });
        clearRow.appendChild(copyBtn);

        container.appendChild(clearRow);

        // Mode toggle
        const toggle = document.createElement('div');
        toggle.className = 'input-mode-toggle';

        const kbBtn = document.createElement('button');
        kbBtn.className = 'mode-btn active';
        kbBtn.textContent = I18n.t('mode_bengali_keyboard');
        kbBtn.dataset.mode = 'keyboard';

        const romBtn = document.createElement('button');
        romBtn.className = 'mode-btn';
        romBtn.textContent = I18n.t('mode_roman_input');
        romBtn.dataset.mode = 'roman';

        toggle.appendChild(kbBtn);
        toggle.appendChild(romBtn);
        container.appendChild(toggle);

        // Bengali keyboard grid
        const kbArea = document.createElement('div');
        kbArea.className = 'kb-page-keyboard';
        kbArea.id = 'kb-page-keyboard';

        // Main letter rows
        KB_ROWS.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-grid';
            row.forEach(letter => {
                const btn = document.createElement('button');
                btn.className = 'key-btn';
                btn.textContent = letter;
                btn.addEventListener('click', () => {
                    displayText += letter;
                    updateDisplay();
                });
                rowEl.appendChild(btn);
            });
            kbArea.appendChild(rowEl);
        });

        // Vowel signs row
        const karLabel = document.createElement('div');
        karLabel.className = 'kb-kar-label';
        karLabel.textContent = I18n.t('kb_vowel_signs');
        kbArea.appendChild(karLabel);

        const karRow = document.createElement('div');
        karRow.className = 'keyboard-grid';
        KAR_ROW.forEach(sign => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = sign;
            btn.addEventListener('click', () => {
                displayText += sign;
                updateDisplay();
            });
            karRow.appendChild(btn);
        });
        kbArea.appendChild(karRow);

        // Utility row (space, backspace)
        const utilRow = document.createElement('div');
        utilRow.className = 'keyboard-grid kb-util-row';

        const spaceBtn = document.createElement('button');
        spaceBtn.className = 'key-btn kb-space-key';
        spaceBtn.textContent = I18n.t('kb_space');
        spaceBtn.addEventListener('click', () => {
            displayText += ' ';
            updateDisplay();
        });
        utilRow.appendChild(spaceBtn);

        const bkspBtn = document.createElement('button');
        bkspBtn.className = 'key-btn backspace-key';
        bkspBtn.textContent = I18n.t('backspace');
        bkspBtn.addEventListener('click', () => {
            const chars = [...displayText];
            chars.pop();
            displayText = chars.join('');
            updateDisplay();
        });
        utilRow.appendChild(bkspBtn);
        kbArea.appendChild(utilRow);

        container.appendChild(kbArea);

        // Roman input area
        const romanArea = document.createElement('div');
        romanArea.className = 'kb-page-roman';
        romanArea.id = 'kb-page-roman';
        romanArea.style.display = 'none';

        const romanHint = document.createElement('p');
        romanHint.className = 'kb-roman-hint';
        romanHint.textContent = I18n.t('kb_roman_hint');
        romanArea.appendChild(romanHint);

        const romanInput = document.createElement('input');
        romanInput.type = 'text';
        romanInput.className = 'write-input kb-roman-input';
        romanInput.placeholder = I18n.t('type_roman');
        romanInput.autocomplete = 'off';
        romanInput.id = 'kb-page-roman-input';

        // Word-level IME: convert on space or enter
        romanInput.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                const val = romanInput.value.trim();
                if (val) {
                    const converted = WordIME.convert(val);
                    displayText += converted;
                    if (e.key === ' ') displayText += ' ';
                    if (e.key === 'Enter') displayText += '\n';
                }
                romanInput.value = '';
                romanBuffer = '';
                updateDisplay();
            } else if (e.key === 'Backspace' && romanInput.value === '' && displayText.length > 0) {
                // Allow backspace into committed text when input is empty
                const chars = [...displayText];
                chars.pop();
                displayText = chars.join('');
                updateDisplay();
            }
        });

        // Update buffer preview while typing
        romanInput.addEventListener('input', () => {
            romanBuffer = romanInput.value;
            updateDisplay();
        });

        romanArea.appendChild(romanInput);
        container.appendChild(romanArea);

        // Mode switching
        kbBtn.addEventListener('click', () => {
            if (kbBtn.classList.contains('active')) return;
            kbBtn.classList.add('active');
            romBtn.classList.remove('active');
            document.getElementById('kb-page-keyboard').style.display = '';
            document.getElementById('kb-page-roman').style.display = 'none';
            // Commit any pending roman buffer
            commitRomanBuffer();
        });

        romBtn.addEventListener('click', () => {
            if (romBtn.classList.contains('active')) return;
            romBtn.classList.add('active');
            kbBtn.classList.remove('active');
            document.getElementById('kb-page-keyboard').style.display = 'none';
            document.getElementById('kb-page-roman').style.display = '';
            document.getElementById('kb-page-roman-input').focus();
        });
    }

    /**
     * Commit any pending roman input in the buffer.
     */
    function commitRomanBuffer() {
        const input = document.getElementById('kb-page-roman-input');
        if (input && input.value.trim()) {
            displayText += WordIME.convert(input.value.trim());
            input.value = '';
            romanBuffer = '';
            updateDisplay();
        }
    }

    /**
     * Update the display area.
     */
    function updateDisplay() {
        const textEl = document.getElementById('kb-page-display-text');
        const bufferEl = document.getElementById('kb-page-buffer');
        if (textEl) textEl.textContent = displayText;
        if (bufferEl) bufferEl.textContent = romanBuffer;
    }

    /**
     * Called when tab switches to keyboard.
     */
    function onActivate() {
        // Focus roman input if in roman mode
        const romArea = document.getElementById('kb-page-roman');
        if (romArea && romArea.style.display !== 'none') {
            const input = document.getElementById('kb-page-roman-input');
            if (input) input.focus();
        }
    }

    return { init, onActivate };
})();
