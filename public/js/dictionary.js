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

    /**
     * Show a random word card.
     */
    function showRandomWord() {
        const card = document.getElementById('dict-random-card');
        if (!card || entries.length === 0) return;

        const entry = entries[Math.floor(Math.random() * entries.length)];
        card.innerHTML = '';

        const label = document.createElement('div');
        label.className = 'dict-random-label';
        label.textContent = I18n.t('dict_random_word');
        card.appendChild(label);

        card.appendChild(buildEntryCard(entry, true));

        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-secondary btn-sm dict-refresh-btn';
        refreshBtn.textContent = I18n.t('dict_new_random');
        refreshBtn.addEventListener('click', showRandomWord);
        card.appendChild(refreshBtn);
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

    return { init, onActivate, lookup, isLoaded, eagerLoad };
})();
