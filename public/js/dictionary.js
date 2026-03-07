/**
 * BengalBird - Dictionary Engine (dictionary.js)
 * Loads JSONL dictionary data, provides search with debounce,
 * ranked results, Bengali/Latin detection, and word-popup lookup.
 * No external dependencies.
 */
const Dictionary = (() => {
    'use strict';

    const JSONL_PATH = 'dictionary/wiktionary/en_bn_dictionary_from_wiktionary.jsonl';
    const MAX_RESULTS = 20;
    const DEBOUNCE_MS = 250;
    const BENGALI_REGEX = /[\u0980-\u09FF]/;

    let entries = [];       // parsed dictionary entries
    let bnIndex = {};       // Bengali text -> entry (for fast popup lookup)
    let loaded = false;
    let loading = false;
    let searchTimer = null;
    let container = null;   // root DOM element for dictionary section

    /**
     * Initialize: set container, start loading data.
     * @param {HTMLElement} el - #section-dictionary
     */
    function init(el) {
        container = el;
        render();
        loadData();
    }

    /**
     * Build the dictionary page DOM.
     */
    function render() {
        container.innerHTML = '';

        // Random word card (shown on load)
        const randomCard = document.createElement('div');
        randomCard.className = 'dict-random-card';
        randomCard.id = 'dict-random-card';
        randomCard.innerHTML = '<p class="dict-loading">' + I18n.t('loading') + '</p>';
        container.appendChild(randomCard);

        // Search input
        const searchWrap = document.createElement('div');
        searchWrap.className = 'dict-search-wrap';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'dict-search-input';
        searchInput.placeholder = I18n.t('dict_search_placeholder');
        searchInput.autocomplete = 'off';
        searchInput.id = 'dict-search-input';

        searchWrap.appendChild(searchInput);
        container.appendChild(searchWrap);

        // Results container
        const results = document.createElement('div');
        results.className = 'dict-results';
        results.id = 'dict-results';
        container.appendChild(results);

        // Bind search events
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                performSearch(searchInput.value.trim());
            }, DEBOUNCE_MS);
        });
    }

    /**
     * Load the JSONL file, parse line-by-line.
     */
    async function loadData() {
        if (loaded || loading) return;
        loading = true;

        try {
            const resp = await fetch(JSONL_PATH);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const text = await resp.text();

            // Process in chunks to avoid blocking UI
            const lines = text.split('\n');
            const CHUNK = 2000;
            let idx = 0;

            function processChunk() {
                const end = Math.min(idx + CHUNK, lines.length);
                for (; idx < end; idx++) {
                    const line = lines[idx].trim();
                    if (!line) continue;
                    try {
                        const obj = JSON.parse(line);
                        if (obj && (obj.bn || obj.en)) {
                            entries.push(obj);
                            if (obj.bn) {
                                bnIndex[obj.bn] = obj;
                            }
                        }
                    } catch (_) {
                        // Skip malformed lines
                    }
                }
                if (idx < lines.length) {
                    requestAnimationFrame(processChunk);
                } else {
                    loaded = true;
                    loading = false;
                    showRandomWord();
                }
            }
            processChunk();
        } catch (e) {
            console.error('Dictionary: failed to load JSONL', e);
            loading = false;
            const card = document.getElementById('dict-random-card');
            if (card) card.innerHTML = '<p class="dict-error">' + I18n.t('dict_load_error') + '</p>';
        }
    }

    let currentPracticeEntry = null;

    /**
     * Show a random word card.
     */
    function showRandomWord() {
        const card = document.getElementById('dict-random-card');
        if (!card || entries.length === 0) return;

        const entry = entries[Math.floor(Math.random() * entries.length)];
        currentPracticeEntry = entry;
        card.innerHTML = '';

        const label = document.createElement('div');
        label.className = 'dict-random-label';
        label.textContent = I18n.t('dict_random_word');
        card.appendChild(label);

        card.appendChild(buildEntryCard(entry, true));

        // Button row
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:10px;';

        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-secondary btn-sm dict-refresh-btn';
        refreshBtn.textContent = I18n.t('dict_new_random');
        refreshBtn.addEventListener('click', showRandomWord);
        btnRow.appendChild(refreshBtn);

        // Practice button
        if (entry.bn) {
            const practiceBtn = document.createElement('button');
            practiceBtn.className = 'btn btn-primary btn-sm dict-practice-btn';
            practiceBtn.textContent = I18n.t('practice_word');
            practiceBtn.addEventListener('click', () => showPracticeSelect(entry));
            btnRow.appendChild(practiceBtn);
        }

        card.appendChild(btnRow);
    }

    /**
     * Build a single entry card element.
     * @param {Object} entry
     * @param {boolean} [large=false] - larger style for random word
     * @returns {HTMLElement}
     */
    function buildEntryCard(entry, large) {
        const el = document.createElement('div');
        el.className = 'dict-entry' + (large ? ' dict-entry-large' : '');

        const bn = document.createElement('div');
        bn.className = 'dict-bn';
        bn.textContent = entry.bn || '';
        el.appendChild(bn);

        if (entry.romanised) {
            const rom = document.createElement('div');
            rom.className = 'dict-rom';
            rom.textContent = entry.romanised;
            el.appendChild(rom);
        }

        const en = document.createElement('div');
        en.className = 'dict-en';
        en.textContent = entry.en || '';
        el.appendChild(en);

        if (entry.pos) {
            const pos = document.createElement('span');
            pos.className = 'dict-pos';
            pos.textContent = entry.pos;
            el.appendChild(pos);
        }

        if (entry.def && !large) {
            const def = document.createElement('div');
            def.className = 'dict-def';
            def.textContent = entry.def.length > 120 ? entry.def.slice(0, 120) + '…' : entry.def;
            el.appendChild(def);
        } else if (entry.def && large) {
            const def = document.createElement('div');
            def.className = 'dict-def';
            def.textContent = entry.def.length > 200 ? entry.def.slice(0, 200) + '…' : entry.def;
            el.appendChild(def);
        }

        return el;
    }

    /**
     * Detect if a query string contains Bengali script.
     * @param {string} str
     * @returns {boolean}
     */
    function isBengaliQuery(str) {
        return BENGALI_REGEX.test(str);
    }

    /**
     * Score an entry against the query for ranking.
     * Higher score = better match.
     * @param {Object} e - dictionary entry
     * @param {string} q - lowercased query
     * @param {boolean} bengaliMode
     * @returns {number} score (0 = no match)
     */
    function scoreEntry(e, q, bengaliMode) {
        let score = 0;

        if (bengaliMode) {
            // Bengali mode: only search bn field
            if (!e.bn) return 0;
            if (e.bn === q) return 100;
            if (e.bn.startsWith(q)) return 70;
            if (e.bn.includes(q)) return 40;
            return 0;
        }

        // Latin mode: search romanised and en fields
        const rom = e.romanised ? e.romanised.toLowerCase() : '';
        const en = e.en ? e.en.toLowerCase() : '';

        // Exact match (romanised)
        if (rom === q) score = Math.max(score, 100);
        // Exact match (English)
        else if (en === q) score = Math.max(score, 95);
        // Prefix match (romanised)
        else if (rom && rom.startsWith(q)) score = Math.max(score, 70);
        // Prefix match (English)
        else if (en && en.startsWith(q)) score = Math.max(score, 65);
        // Substring match (romanised)
        else if (rom && rom.includes(q)) score = Math.max(score, 40);
        // Substring match (English)
        else if (en && en.includes(q)) score = Math.max(score, 35);
        // Fuzzy: check if all query chars appear in order
        else {
            if (rom && fuzzyMatch(q, rom)) score = Math.max(score, 15);
            if (en && fuzzyMatch(q, en)) score = Math.max(score, 10);
        }

        return score;
    }

    /**
     * Simple fuzzy match: all characters in needle appear in haystack in order.
     */
    function fuzzyMatch(needle, haystack) {
        let ni = 0;
        for (let hi = 0; hi < haystack.length && ni < needle.length; hi++) {
            if (needle[ni] === haystack[hi]) ni++;
        }
        return ni === needle.length;
    }

    /**
     * Perform a scored, ranked search and render results.
     * @param {string} query
     */
    function performSearch(query) {
        const resultsEl = document.getElementById('dict-results');
        if (!resultsEl) return;

        if (!query) {
            resultsEl.innerHTML = '';
            return;
        }

        if (!loaded) {
            resultsEl.innerHTML = '<p class="dict-loading">' + I18n.t('loading') + '</p>';
            return;
        }

        const bengaliMode = isBengaliQuery(query);
        const q = bengaliMode ? query : query.toLowerCase();
        const scored = [];

        for (let i = 0; i < entries.length; i++) {
            const s = scoreEntry(entries[i], q, bengaliMode);
            if (s > 0) {
                scored.push({ entry: entries[i], score: s });
                if (scored.length >= MAX_RESULTS * 3) break; // collect extras for sorting
            }
        }

        // Sort by descending score
        scored.sort((a, b) => b.score - a.score);
        const matches = scored.slice(0, MAX_RESULTS);

        resultsEl.innerHTML = '';

        if (matches.length === 0) {
            const noResult = document.createElement('p');
            noResult.className = 'dict-no-results';
            noResult.textContent = I18n.t('dict_no_results');
            resultsEl.appendChild(noResult);
            return;
        }

        matches.forEach(m => {
            resultsEl.appendChild(buildEntryCard(m.entry, false));
        });
    }

    /**
     * Called when tab is switched to dictionary (refresh random word).
     */
    function onActivate() {
        if (loaded) showRandomWord();
    }

    /**
     * Look up a Bengali word for the word popup feature.
     * @param {string} bengaliWord - Bengali script word
     * @returns {Object|null} dictionary entry or null
     */
    function lookup(bengaliWord) {
        if (!bengaliWord || !loaded) return null;
        // Fast path: exact index lookup
        if (bnIndex[bengaliWord]) return bnIndex[bengaliWord];
        // Fallback: search entries
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].bn === bengaliWord) return entries[i];
        }
        return null;
    }

    /**
     * Check if dictionary data has been loaded.
     * @returns {boolean}
     */
    function isLoaded() {
        return loaded;
    }

    /**
     * Start loading dictionary data eagerly (without rendering UI).
     * Called at app startup so word popups work in exercises.
     */
    function eagerLoad() {
        loadData();
    }

    // ---- Practice Mode ----

    function showPracticeSelect(entry) {
        const modal = document.getElementById('practice-modal');
        const overlay = document.getElementById('practice-overlay');
        const title = document.getElementById('practice-modal-title');
        const body = document.getElementById('practice-modal-body');

        title.textContent = I18n.t('practice_word');
        body.innerHTML = '';

        // Show the word
        const target = document.createElement('div');
        target.className = 'practice-target';
        const bn = document.createElement('span');
        bn.className = 'pt-bengali';
        bn.textContent = entry.bn;
        target.appendChild(bn);
        const en = document.createElement('span');
        en.className = 'pt-english';
        en.textContent = entry.en || '';
        target.appendChild(en);
        body.appendChild(target);

        // Difficulty buttons
        const select = document.createElement('div');
        select.className = 'practice-select';

        const modes = [
            { key: 'easy', cssClass: 'ps-easy', fn: () => startPracticeEasy(entry) },
            { key: 'normal', cssClass: 'ps-normal', fn: () => startPracticeNormal(entry) },
            { key: 'hard', cssClass: 'ps-hard', fn: () => startPracticeHard(entry) }
        ];

        modes.forEach(m => {
            const btn = document.createElement('button');
            btn.className = 'practice-select-btn ' + m.cssClass;
            const labelSpan = document.createElement('span');
            labelSpan.className = 'ps-label';
            labelSpan.textContent = I18n.t('practice_' + m.key);
            btn.appendChild(labelSpan);
            const descSpan = document.createElement('span');
            descSpan.className = 'ps-desc';
            descSpan.textContent = I18n.t('practice_' + m.key + '_desc');
            btn.appendChild(descSpan);
            btn.addEventListener('click', m.fn);
            select.appendChild(btn);
        });

        body.appendChild(select);
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    }

    function closePracticeModal() {
        document.getElementById('practice-modal').classList.add('hidden');
        document.getElementById('practice-overlay').classList.add('hidden');
    }

    /**
     * EASY mode: on-screen keyboard with only the word's characters.
     */
    function startPracticeEasy(entry) {
        const body = document.getElementById('practice-modal-body');
        const title = document.getElementById('practice-modal-title');
        title.textContent = I18n.t('practice_easy');
        body.innerHTML = '';

        const word = entry.bn;
        // Extract characters (code points) in order
        const chars = [];
        for (const ch of word) {
            chars.push(ch);
        }
        // Get unique characters (shuffled)
        const unique = [...new Set(chars)];
        const shuffled = unique.slice().sort(() => Math.random() - 0.5);

        let userInput = '';

        // Target display
        const targetDiv = document.createElement('div');
        targetDiv.className = 'practice-target';
        const enSpan = document.createElement('span');
        enSpan.className = 'pt-english';
        enSpan.textContent = entry.en || '';
        targetDiv.appendChild(enSpan);
        body.appendChild(targetDiv);

        // Instruction
        const instr = document.createElement('p');
        instr.className = 'practice-instruction';
        instr.textContent = I18n.t('practice_instructions_easy');
        body.appendChild(instr);

        // Display area
        const display = document.createElement('div');
        display.className = 'practice-display';
        body.appendChild(display);

        // Keyboard
        const keyboard = document.createElement('div');
        keyboard.className = 'practice-keyboard';
        shuffled.forEach(ch => {
            const key = document.createElement('button');
            key.className = 'practice-key';
            key.textContent = ch;
            key.addEventListener('click', () => {
                userInput += ch;
                display.textContent = userInput;
            });
            keyboard.appendChild(key);
        });
        // Backspace
        const bksp = document.createElement('button');
        bksp.className = 'practice-key backspace-key';
        bksp.textContent = I18n.t('backspace');
        bksp.addEventListener('click', () => {
            const codePoints = [...userInput];
            codePoints.pop();
            userInput = codePoints.join('');
            display.textContent = userInput;
        });
        keyboard.appendChild(bksp);
        body.appendChild(keyboard);

        // Feedback
        const feedback = document.createElement('div');
        feedback.className = 'practice-feedback';
        body.appendChild(feedback);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'practice-actions';

        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn btn-primary btn-sm';
        checkBtn.textContent = I18n.t('practice_check');
        checkBtn.addEventListener('click', () => {
            if (userInput === word) {
                display.classList.add('correct');
                feedback.className = 'practice-feedback visible correct-fb';
                feedback.textContent = I18n.t('practice_correct') + ' ' + I18n.t('practice_great');
                AudioManager.playSfx('correct');
            } else {
                display.classList.add('wrong');
                feedback.className = 'practice-feedback visible wrong-fb';
                feedback.textContent = I18n.t('practice_try_again') + ' → ' + word;
                AudioManager.playSfx('wrong');
            }
        });
        actions.appendChild(checkBtn);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-secondary btn-sm';
        resetBtn.textContent = I18n.t('practice_reset');
        resetBtn.addEventListener('click', () => {
            userInput = '';
            display.textContent = '';
            display.classList.remove('correct', 'wrong');
            feedback.className = 'practice-feedback';
        });
        actions.appendChild(resetBtn);

        const backBtn = document.createElement('button');
        backBtn.className = 'btn btn-secondary btn-sm';
        backBtn.textContent = I18n.t('practice_back');
        backBtn.addEventListener('click', closePracticeModal);
        actions.appendChild(backBtn);

        body.appendChild(actions);
    }

    /**
     * NORMAL mode: type romanization, system converts to Bengali.
     */
    function startPracticeNormal(entry) {
        const body = document.getElementById('practice-modal-body');
        const title = document.getElementById('practice-modal-title');
        title.textContent = I18n.t('practice_normal');
        body.innerHTML = '';

        const word = entry.bn;
        const targetRoman = entry.romanised || '';

        // Target display
        const targetDiv = document.createElement('div');
        targetDiv.className = 'practice-target';
        const bnSpan = document.createElement('span');
        bnSpan.className = 'pt-bengali';
        bnSpan.textContent = word;
        targetDiv.appendChild(bnSpan);
        const enSpan = document.createElement('span');
        enSpan.className = 'pt-english';
        enSpan.textContent = entry.en || '';
        targetDiv.appendChild(enSpan);
        body.appendChild(targetDiv);

        // Instruction
        const instr = document.createElement('p');
        instr.className = 'practice-instruction';
        instr.textContent = I18n.t('practice_instructions_normal');
        body.appendChild(instr);

        // Input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'practice-input';
        input.placeholder = 'e.g. ' + (targetRoman || 'romanised');
        input.autocomplete = 'off';
        body.appendChild(input);

        // Feedback
        const feedback = document.createElement('div');
        feedback.className = 'practice-feedback';
        body.appendChild(feedback);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'practice-actions';

        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn btn-primary btn-sm';
        checkBtn.textContent = I18n.t('practice_check');
        checkBtn.addEventListener('click', () => {
            const typed = input.value.trim().toLowerCase();
            // Try converting romanization to Bengali
            let converted = '';
            try { converted = BengaliIME.convert(typed); } catch (_) { converted = ''; }
            const isCorrectRoman = targetRoman && typed === targetRoman.toLowerCase();
            const isCorrectConverted = converted === word;

            if (isCorrectRoman || isCorrectConverted) {
                input.classList.add('correct');
                input.classList.remove('wrong');
                feedback.className = 'practice-feedback visible correct-fb';
                feedback.textContent = I18n.t('practice_correct') + ' ' + I18n.t('practice_great');
                AudioManager.playSfx('correct');
            } else {
                input.classList.add('wrong');
                input.classList.remove('correct');
                feedback.className = 'practice-feedback visible wrong-fb';
                feedback.textContent = I18n.t('practice_try_again') + ' → ' + (targetRoman || word);
                AudioManager.playSfx('wrong');
            }
        });
        actions.appendChild(checkBtn);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-secondary btn-sm';
        resetBtn.textContent = I18n.t('practice_reset');
        resetBtn.addEventListener('click', () => {
            input.value = '';
            input.classList.remove('correct', 'wrong');
            feedback.className = 'practice-feedback';
        });
        actions.appendChild(resetBtn);

        const backBtn = document.createElement('button');
        backBtn.className = 'btn btn-secondary btn-sm';
        backBtn.textContent = I18n.t('practice_back');
        backBtn.addEventListener('click', closePracticeModal);
        actions.appendChild(backBtn);

        body.appendChild(actions);
        input.focus();
    }

    /**
     * HARD mode: type Bengali using full on-screen keyboard.
     */
    function startPracticeHard(entry) {
        const body = document.getElementById('practice-modal-body');
        const title = document.getElementById('practice-modal-title');
        title.textContent = I18n.t('practice_hard');
        body.innerHTML = '';

        const word = entry.bn;
        let userInput = '';

        // Target display (English only)
        const targetDiv = document.createElement('div');
        targetDiv.className = 'practice-target';
        const enSpan = document.createElement('span');
        enSpan.className = 'pt-english';
        enSpan.textContent = entry.en || '';
        targetDiv.appendChild(enSpan);
        body.appendChild(targetDiv);

        // Instruction
        const instr = document.createElement('p');
        instr.className = 'practice-instruction';
        instr.textContent = I18n.t('practice_instructions_hard');
        body.appendChild(instr);

        // Display area
        const display = document.createElement('div');
        display.className = 'practice-display';
        body.appendChild(display);

        // Full Bengali keyboard (5 rows)
        const rows = [
            ['অ','আ','ই','ঈ','উ','ঊ','এ','ঐ','ও','ঔ'],
            ['ক','খ','গ','ঘ','ঙ','চ','ছ','জ','ঝ','ঞ'],
            ['ট','ঠ','ড','ঢ','ণ','ত','থ','দ','ধ','ন'],
            ['প','ফ','ব','ভ','ম','য','র','ল','শ','ষ'],
            ['স','হ','ড়','ঢ়','য়','ৎ','ং','ঃ','ঁ','্']
        ];
        const vowelSigns = ['া','ি','ী','ু','ূ','ে','ৈ','ো','ৌ','ৃ'];

        const keyboard = document.createElement('div');
        keyboard.className = 'practice-keyboard';

        rows.forEach(row => {
            row.forEach(ch => {
                const key = document.createElement('button');
                key.className = 'practice-key';
                key.textContent = ch;
                key.addEventListener('click', () => {
                    userInput += ch;
                    display.textContent = userInput;
                });
                keyboard.appendChild(key);
            });
        });

        // Vowel signs row
        vowelSigns.forEach(ch => {
            const key = document.createElement('button');
            key.className = 'practice-key';
            key.textContent = '\u25CC' + ch; // dotted circle + sign
            key.addEventListener('click', () => {
                userInput += ch;
                display.textContent = userInput;
            });
            keyboard.appendChild(key);
        });

        // Backspace
        const bksp = document.createElement('button');
        bksp.className = 'practice-key backspace-key';
        bksp.textContent = I18n.t('backspace');
        bksp.addEventListener('click', () => {
            const codePoints = [...userInput];
            codePoints.pop();
            userInput = codePoints.join('');
            display.textContent = userInput;
        });
        keyboard.appendChild(bksp);

        body.appendChild(keyboard);

        // Feedback
        const feedback = document.createElement('div');
        feedback.className = 'practice-feedback';
        body.appendChild(feedback);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'practice-actions';

        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn btn-primary btn-sm';
        checkBtn.textContent = I18n.t('practice_check');
        checkBtn.addEventListener('click', () => {
            if (userInput === word) {
                display.classList.add('correct');
                feedback.className = 'practice-feedback visible correct-fb';
                feedback.textContent = I18n.t('practice_correct') + ' ' + I18n.t('practice_great');
                AudioManager.playSfx('correct');
            } else {
                display.classList.add('wrong');
                feedback.className = 'practice-feedback visible wrong-fb';
                feedback.textContent = I18n.t('practice_try_again') + ' → ' + word;
                AudioManager.playSfx('wrong');
            }
        });
        actions.appendChild(checkBtn);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-secondary btn-sm';
        resetBtn.textContent = I18n.t('practice_reset');
        resetBtn.addEventListener('click', () => {
            userInput = '';
            display.textContent = '';
            display.classList.remove('correct', 'wrong');
            feedback.className = 'practice-feedback';
        });
        actions.appendChild(resetBtn);

        const backBtn = document.createElement('button');
        backBtn.className = 'btn btn-secondary btn-sm';
        backBtn.textContent = I18n.t('practice_back');
        backBtn.addEventListener('click', closePracticeModal);
        actions.appendChild(backBtn);

        body.appendChild(actions);
    }

    // Bind practice modal close
    document.addEventListener('DOMContentLoaded', () => {
        const closeBtn = document.getElementById('practice-close-btn');
        const overlay = document.getElementById('practice-overlay');
        if (closeBtn) closeBtn.addEventListener('click', closePracticeModal);
        if (overlay) overlay.addEventListener('click', closePracticeModal);
    });

    return { init, onActivate, lookup, isLoaded, eagerLoad };
})();
