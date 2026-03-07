/**
 * BengalBird - Exercise Engine (exercises.js)
 * Renders and manages all exercise types:
 *   grammar-sort, grammar-select, grammar-write,
 *   reading, conversation, listening,
 *   alphabet_listening, writing_keyboard, conversation_listening,
 *   figure_choice, figure_choice_multi
 *
 * Every Bengali word displayed automatically shows romanization below it
 * when a romanized field is available in the data.
 *
 * Clickable Bengali words show a mini-dictionary popup.
 * Items with is_new:true get a NEW indicator badge.
 */
const Exercises = (() => {
    'use strict';

    let container = null;
    let currentExercise = null;
    let answered = false;
    let onAnswered = null; // callback(isCorrect)
    let activePopup = null; // currently open word popup

    /**
     * Initialize with DOM container and answer callback
     */
    function init(containerEl, answerCallback) {
        container = containerEl;
        onAnswered = answerCallback;

        // Close word popup on outside click/touch
        document.addEventListener('click', closeWordPopup, true);
        document.addEventListener('touchstart', closeWordPopup, true);
    }

    /**
     * Render a single exercise into the container
     */
    function render(exercise) {
        currentExercise = exercise;
        answered = false;
        container.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'exercise-card';

        // Type badge
        const badge = document.createElement('span');
        badge.className = 'exercise-type-badge ' + getBadgeClass(exercise.type);
        badge.textContent = getBadgeLabel(exercise.type);
        card.appendChild(badge);

        // Render by type
        switch (exercise.type) {
            case 'grammar-sort':
                renderSort(card, exercise);
                break;
            case 'grammar-select':
                renderSelect(card, exercise);
                break;
            case 'grammar-write':
                renderWrite(card, exercise);
                break;
            case 'reading':
                renderReading(card, exercise);
                break;
            case 'conversation':
                renderConversation(card, exercise);
                break;
            case 'listening':
                renderListening(card, exercise);
                break;
            case 'alphabet_listening':
                renderAlphabetListening(card, exercise);
                break;
            case 'writing_keyboard':
                renderWritingKeyboard(card, exercise);
                break;
            case 'conversation_listening':
                renderConversationListening(card, exercise);
                break;
            case 'figure_choice':
                renderFigureChoice(card, exercise);
                break;
            case 'figure_choice_multi':
                renderFigureChoiceMulti(card, exercise);
                break;
            default:
                card.innerHTML += '<p>Unknown exercise type: ' + exercise.type + '</p>';
        }

        // Hint
        if (exercise.hint) {
            const hintBtn = document.createElement('button');
            hintBtn.className = 'hint-btn';
            hintBtn.textContent = I18n.t('hint_label');
            const hintText = document.createElement('div');
            hintText.className = 'hint-text';
            hintText.textContent = I18n.localize(exercise.hint);
            hintBtn.addEventListener('click', () => {
                hintText.classList.toggle('visible');
            });
            card.appendChild(hintBtn);
            card.appendChild(hintText);
        }

        // Feedback area
        const feedback = document.createElement('div');
        feedback.className = 'exercise-feedback';
        feedback.id = 'exercise-feedback';
        card.appendChild(feedback);

        container.appendChild(card);

        // Re-animate
        container.style.animation = 'none';
        container.offsetHeight; // trigger reflow
        container.style.animation = '';
    }

    // ========== Helper: Bengali + Romanization pair ==========

    /**
     * Create a bengali-rom-pair element showing Bengali script + romanized text below.
     * If is_new is true, adds a NEW indicator badge.
     * Bengali text is clickable to show a mini-dictionary popup.
     * @param {string} bengali - Bengali script text
     * @param {string} romanized - Romanized text (optional, shows fallback if missing)
     * @param {boolean} [isNew=false] - Whether this is a newly introduced word
     * @returns {HTMLElement}
     */
    function createBengaliRomPair(bengali, romanized, isNew) {
        const pair = document.createElement('div');
        pair.className = 'bengali-rom-pair';
        if (isNew) pair.classList.add('is-new');

        const bSpan = document.createElement('span');
        bSpan.className = 'bengali-text bengali-clickable';
        bSpan.textContent = bengali || '';
        if (bengali) {
            bSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                showWordPopup(bengali, romanized, bSpan);
            });
        }
        pair.appendChild(bSpan);

        if (isNew) {
            const newBadge = document.createElement('span');
            newBadge.className = 'new-indicator';
            newBadge.textContent = 'NEW';
            pair.appendChild(newBadge);
        }

        if (romanized) {
            const rSpan = document.createElement('span');
            rSpan.className = 'romanized-text';
            rSpan.textContent = romanized;
            pair.appendChild(rSpan);
        }
        return pair;
    }

    // ========== Word Popup (Mini Dictionary) ==========

    /**
     * Close the currently open word popup, if any.
     */
    function closeWordPopup(e) {
        if (activePopup) {
            // If click is inside the popup, ignore
            if (e && activePopup.contains(e.target)) return;
            activePopup.remove();
            activePopup = null;
        }
    }

    /**
     * Show a mini-dictionary popup near an element.
     * Looks up the Bengali word in the Dictionary module.
     * @param {string} bengali
     * @param {string} romanized - fallback romanization
     * @param {HTMLElement} anchorEl - element to position near
     */
    function showWordPopup(bengali, romanized, anchorEl) {
        closeWordPopup();

        const popup = document.createElement('div');
        popup.className = 'word-popup';

        const bnDiv = document.createElement('div');
        bnDiv.className = 'word-popup-bn';
        bnDiv.textContent = bengali;
        popup.appendChild(bnDiv);

        // Try dictionary lookup
        let entry = null;
        if (typeof Dictionary !== 'undefined' && Dictionary.isLoaded()) {
            entry = Dictionary.lookup(bengali);
        }

        const romDiv = document.createElement('div');
        romDiv.className = 'word-popup-rom';
        romDiv.textContent = (entry && entry.romanised) ? entry.romanised : (romanized || '');
        popup.appendChild(romDiv);

        const enDiv = document.createElement('div');
        enDiv.className = 'word-popup-en';
        enDiv.textContent = (entry && entry.en) ? entry.en : '';
        popup.appendChild(enDiv);

        if (entry && entry.pos) {
            const posDiv = document.createElement('span');
            posDiv.className = 'word-popup-pos';
            posDiv.textContent = entry.pos;
            popup.appendChild(posDiv);
        }

        // Position near anchor
        document.body.appendChild(popup);
        activePopup = popup;

        const rect = anchorEl.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();

        let top = rect.bottom + 6;
        let left = rect.left + (rect.width / 2) - (popupRect.width / 2);

        // Keep within viewport
        if (left < 8) left = 8;
        if (left + popupRect.width > window.innerWidth - 8) {
            left = window.innerWidth - popupRect.width - 8;
        }
        if (top + popupRect.height > window.innerHeight - 8) {
            top = rect.top - popupRect.height - 6;
        }

        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
    }

    /**
     * Make a text element's Bengali words clickable for dictionary popup.
     * Splits text on spaces, wrapping each Bengali word in a clickable span.
     * @param {HTMLElement} el - element containing Bengali text
     * @param {string} bengaliText - the Bengali text
     * @param {string} [romanized] - optional romanization
     */
    function makeBengaliClickable(el, bengaliText, romanized) {
        if (!bengaliText) return;
        const BENGALI_RE = /[\u0980-\u09FF]/;
        // Split by white space, make Bengali tokens clickable
        const tokens = bengaliText.split(/(\s+)/);
        el.innerHTML = '';
        tokens.forEach(token => {
            if (BENGALI_RE.test(token)) {
                const span = document.createElement('span');
                span.className = 'bengali-clickable';
                span.textContent = token;
                span.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showWordPopup(token, romanized, span);
                });
                el.appendChild(span);
            } else {
                el.appendChild(document.createTextNode(token));
            }
        });
    }

    /**
     * Build an audio play button (compact) for inline use
     */
    function createInlineAudioBtn(src) {
        const btn = document.createElement('button');
        btn.className = 'conv-line-audio-btn';
        btn.innerHTML = '&#9654;';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            AudioManager.playListening(src, () => {
                btn.innerHTML = '&#9654;';
            });
            btn.innerHTML = '&#9646;&#9646;';
        });
        return btn;
    }

    // ========== Badge helpers ==========

    function getBadgeClass(type) {
        if (type.startsWith('grammar') || type === 'writing_keyboard') {
            return type === 'writing_keyboard' ? 'badge-keyboard' : 'badge-grammar';
        }
        if (type === 'reading') return 'badge-reading';
        if (type === 'conversation' || type === 'conversation_listening') return 'badge-conversation';
        if (type === 'listening') return 'badge-listening';
        if (type === 'alphabet_listening') return 'badge-alphabet';
        if (type === 'figure_choice' || type === 'figure_choice_multi') return 'badge-figure';
        return '';
    }

    function getBadgeLabel(type) {
        if (type === 'writing_keyboard') return I18n.t('badge_keyboard');
        if (type.startsWith('grammar')) return I18n.t('badge_grammar');
        if (type === 'reading') return I18n.t('badge_reading');
        if (type === 'conversation' || type === 'conversation_listening') return I18n.t('badge_conversation');
        if (type === 'listening') return I18n.t('badge_listening');
        if (type === 'alphabet_listening') return I18n.t('badge_alphabet');
        if (type === 'figure_choice' || type === 'figure_choice_multi') return I18n.t('badge_figure');
        return type;
    }

    // ========== Figure Choice (NEW) ==========

    function renderFigureChoice(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question) || I18n.t('select_image');
        card.appendChild(question);

        // Show the Bengali word + romanization
        if (exercise.bengali) {
            card.appendChild(createBengaliRomPair(exercise.bengali, exercise.romanized || '', exercise.is_new));
        }

        // Audio button if available
        if (exercise.audio) {
            card.appendChild(createAudioControls(exercise.audio));
        }

        // Image grid
        const grid = document.createElement('div');
        grid.className = 'figure-choice-grid';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'figure-option-btn';

            const img = document.createElement('img');
            img.className = 'figure-option-img';
            img.src = opt.image;
            img.alt = opt.label ? I18n.localize(opt.label) : '';
            img.loading = 'lazy';
            img.addEventListener('error', () => {
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'figure-option-fallback';
                fallback.textContent = opt.label ? I18n.localize(opt.label) : '?';
                btn.insertBefore(fallback, btn.firstChild);
            });
            btn.appendChild(img);

            if (opt.label) {
                const labelSpan = document.createElement('span');
                labelSpan.className = 'figure-option-label';
                labelSpan.textContent = I18n.localize(opt.label);
                btn.appendChild(labelSpan);
            }

            btn.addEventListener('click', () => {
                if (answered) return;
                answered = true;
                grid.querySelectorAll('.figure-option-btn').forEach((b, j) => {
                    b.disabled = true;
                    if (j === exercise.correctIndex) b.classList.add('correct');
                });
                if (i === exercise.correctIndex) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('wrong');
                }
                const correctLabel = exercise.options[exercise.correctIndex].label
                    ? I18n.localize(exercise.options[exercise.correctIndex].label)
                    : '';
                showFeedback(i === exercise.correctIndex, correctLabel);
            });

            grid.appendChild(btn);
        });

        card.appendChild(grid);
    }

    // ========== Figure Choice Multi (Dual Word) ==========

    function renderFigureChoiceMulti(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question) || I18n.t('select_images_multi');
        card.appendChild(question);

        // Show the Bengali words with romanization
        const wordsRow = document.createElement('div');
        wordsRow.className = 'figure-multi-words';

        (exercise.words || []).forEach(w => {
            wordsRow.appendChild(createBengaliRomPair(w.bengali, w.romanized || '', w.is_new));
        });
        card.appendChild(wordsRow);

        // Image grid
        const grid = document.createElement('div');
        grid.className = 'figure-choice-grid';

        const correctIds = exercise.correctIds || [];
        const selected = [];

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'figure-option-btn';

            const img = document.createElement('img');
            img.className = 'figure-option-img';
            img.src = opt.image;
            img.alt = opt.label ? I18n.localize(opt.label) : '';
            img.loading = 'lazy';
            img.addEventListener('error', () => {
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'figure-option-fallback';
                fallback.textContent = opt.label ? I18n.localize(opt.label) : '?';
                btn.insertBefore(fallback, btn.firstChild);
            });
            btn.appendChild(img);

            if (opt.label) {
                const labelSpan = document.createElement('span');
                labelSpan.className = 'figure-option-label';
                labelSpan.textContent = I18n.localize(opt.label);
                btn.appendChild(labelSpan);
            }

            btn.addEventListener('click', () => {
                if (answered) return;

                // Toggle selection
                const idx = selected.indexOf(opt.id);
                if (idx !== -1) {
                    selected.splice(idx, 1);
                    btn.classList.remove('selected');
                } else {
                    if (selected.length >= correctIds.length) return; // max selections reached
                    selected.push(opt.id);
                    btn.classList.add('selected');
                }

                // Auto-check when correct number selected
                if (selected.length === correctIds.length) {
                    answered = true;
                    const sortedSelected = [...selected].sort();
                    const sortedCorrect = [...correctIds].sort();
                    const isCorrect = sortedSelected.length === sortedCorrect.length &&
                        sortedSelected.every((v, j) => v === sortedCorrect[j]);

                    grid.querySelectorAll('.figure-option-btn').forEach(b => {
                        b.disabled = true;
                        const bOpt = exercise.options[Array.from(grid.children).indexOf(b)];
                        if (bOpt && correctIds.includes(bOpt.id)) {
                            b.classList.add('correct');
                        }
                    });

                    if (!isCorrect) {
                        grid.querySelectorAll('.figure-option-btn.selected').forEach(b => {
                            const bOpt = exercise.options[Array.from(grid.children).indexOf(b)];
                            if (bOpt && !correctIds.includes(bOpt.id)) {
                                b.classList.add('wrong');
                            }
                        });
                    }

                    const correctLabels = exercise.options
                        .filter(o => correctIds.includes(o.id))
                        .map(o => o.label ? I18n.localize(o.label) : '')
                        .join(', ');
                    showFeedback(isCorrect, correctLabels);
                }
            });

            grid.appendChild(btn);
        });

        card.appendChild(grid);
    }

    // ========== Grammar Sort ==========

    function renderSort(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        const sortArea = document.createElement('div');
        sortArea.className = 'sort-area';

        // Answer zone
        const answerLabel = document.createElement('div');
        answerLabel.className = 'sort-label';
        answerLabel.textContent = I18n.t('answer_zone_label');
        sortArea.appendChild(answerLabel);

        const answerZone = document.createElement('div');
        answerZone.className = 'answer-zone';
        // Stabilize height: pre-calculate based on word count to prevent layout shift
        const chipHeight = 68; // approximate chip height + gap
        const rowCapacity = 4; // approximate chips per row
        const rows = Math.ceil(exercise.words.length / rowCapacity);
        answerZone.style.minHeight = (rows * chipHeight + 8) + 'px';
        sortArea.appendChild(answerZone);

        // Word bank
        const bankLabel = document.createElement('div');
        bankLabel.className = 'sort-label';
        bankLabel.style.marginTop = '8px';
        bankLabel.textContent = I18n.t('word_bank_label');
        sortArea.appendChild(bankLabel);

        const wordBank = document.createElement('div');
        wordBank.className = 'word-bank';

        // Shuffle words
        const shuffled = [...exercise.words].sort(() => Math.random() - 0.5);
        const answerWords = [];

        // Build romanized lookup from wordsRomanized array if available
        const romLookup = {};
        if (exercise.wordsRomanized && Array.isArray(exercise.wordsRomanized)) {
            exercise.words.forEach((w, i) => {
                romLookup[w] = exercise.wordsRomanized[i] || '';
            });
        }

        function makeChip(word) {
            const chip = document.createElement('button');
            chip.className = 'word-chip';
            chip.textContent = word;
            if (romLookup[word]) {
                const romSpan = document.createElement('span');
                romSpan.className = 'chip-romanized';
                romSpan.textContent = romLookup[word];
                chip.appendChild(romSpan);
            }
            return chip;
        }

        shuffled.forEach((word, i) => {
            const chip = makeChip(word);
            chip.dataset.index = i;

            chip.addEventListener('click', () => {
                if (answered) return;
                chip.classList.add('in-answer');
                const answerChip = makeChip(word);
                answerChip.addEventListener('click', () => {
                    if (answered) return;
                    answerZone.removeChild(answerChip);
                    chip.classList.remove('in-answer');
                    const idx = answerWords.indexOf(word);
                    if (idx !== -1) answerWords.splice(idx, 1);
                });
                answerZone.appendChild(answerChip);
                answerWords.push(word);
            });

            wordBank.appendChild(chip);
        });

        sortArea.appendChild(wordBank);
        card.appendChild(sortArea);

        // Check button
        const checkContainer = document.createElement('div');
        checkContainer.className = 'check-btn-container';
        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn btn-primary';
        checkBtn.textContent = I18n.t('check');
        checkBtn.addEventListener('click', () => {
            if (answered) return;
            const isCorrect = arraysEqual(answerWords, exercise.correctOrder);
            answered = true;
            answerZone.classList.add(isCorrect ? 'correct-zone' : 'wrong-zone');
            showFeedback(isCorrect, exercise.correctOrder.join(' '));
        });
        checkContainer.appendChild(checkBtn);
        card.appendChild(checkContainer);
    }

    // ========== Grammar Select ==========

    function renderSelect(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        if (exercise.bengali) {
            card.appendChild(createBengaliRomPair(exercise.bengali, exercise.romanized || '', exercise.is_new));
        }

        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            // If option has bengali + romanized, show both
            if (opt.bengali) {
                const bSpan = document.createElement('span');
                bSpan.className = 'option-bengali';
                bSpan.textContent = opt.bengali;
                btn.appendChild(bSpan);
                if (opt.romanized) {
                    const rSpan = document.createElement('span');
                    rSpan.className = 'option-romanized';
                    rSpan.textContent = opt.romanized;
                    btn.appendChild(rSpan);
                }
            }
            const tSpan = document.createElement('span');
            tSpan.textContent = I18n.localize(opt.text);
            btn.appendChild(tSpan);

            btn.addEventListener('click', () => {
                if (answered) return;
                answered = true;
                optionsList.querySelectorAll('.option-btn').forEach((b, j) => {
                    b.disabled = true;
                    if (exercise.options[j].correct) b.classList.add('correct');
                });
                if (opt.correct) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('wrong');
                }
                const correctOpt = exercise.options.find(o => o.correct);
                showFeedback(opt.correct, I18n.localize(correctOpt.text));
            });
            optionsList.appendChild(btn);
        });

        card.appendChild(optionsList);
    }

    // ========== Grammar Write ==========

    function renderWrite(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        if (exercise.romanized) {
            const rom = document.createElement('p');
            rom.className = 'exercise-romanized';
            rom.textContent = '(' + exercise.romanized + ')';
            card.appendChild(rom);
        }

        const writeArea = document.createElement('div');
        writeArea.className = 'write-area';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'write-input';
        input.placeholder = I18n.t('type_answer');
        input.autocomplete = 'off';
        writeArea.appendChild(input);
        card.appendChild(writeArea);

        const checkContainer = document.createElement('div');
        checkContainer.className = 'check-btn-container';
        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn btn-primary';
        checkBtn.textContent = I18n.t('check');

        const doCheck = () => {
            if (answered) return;
            const userAnswer = input.value.trim();
            if (!userAnswer) return;
            answered = true;
            input.disabled = true;
            const acceptable = exercise.acceptableAnswers || [exercise.correctAnswer];
            const isCorrect = acceptable.some(a =>
                a.trim().toLowerCase() === userAnswer.toLowerCase()
            );
            input.classList.add(isCorrect ? 'correct' : 'wrong');
            showFeedback(isCorrect, exercise.correctAnswer);
        };

        checkBtn.addEventListener('click', doCheck);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doCheck();
        });
        checkContainer.appendChild(checkBtn);
        card.appendChild(checkContainer);
    }

    // ========== Reading ==========

    function renderReading(card, exercise) {
        const passageBox = document.createElement('div');
        passageBox.className = 'passage-box';

        const pBengali = document.createElement('div');
        pBengali.className = 'passage-bengali';
        makeBengaliClickable(pBengali, exercise.passage.bengali, exercise.passage.romanized);
        passageBox.appendChild(pBengali);

        if (exercise.passage.romanized) {
            const pRom = document.createElement('div');
            pRom.className = 'passage-romanized';
            pRom.textContent = exercise.passage.romanized;
            passageBox.appendChild(pRom);
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'passage-toggle';
        toggleBtn.textContent = I18n.t('show_translation');

        const translation = document.createElement('div');
        translation.className = 'passage-translation';
        translation.textContent = I18n.localize(exercise.passage);
        translation.style.display = 'none';

        toggleBtn.addEventListener('click', () => {
            const visible = translation.style.display !== 'none';
            translation.style.display = visible ? 'none' : 'block';
            toggleBtn.textContent = visible
                ? I18n.t('show_translation')
                : I18n.t('hide_translation');
        });

        passageBox.appendChild(toggleBtn);
        passageBox.appendChild(translation);
        card.appendChild(passageBox);

        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        renderOptionButtons(card, exercise);
    }

    // ========== Conversation ==========

    function renderConversation(card, exercise) {
        if (exercise.scenario) {
            const scenario = document.createElement('p');
            scenario.className = 'exercise-question';
            scenario.textContent = I18n.localize(exercise.scenario);
            card.appendChild(scenario);
        }

        if (exercise.dialogue && exercise.dialogue.length > 0) {
            const dialogueBox = document.createElement('div');
            dialogueBox.className = 'dialogue-box';

            exercise.dialogue.forEach(line => {
                const bubble = document.createElement('div');
                bubble.className = 'dialogue-bubble';

                const avatar = document.createElement('div');
                avatar.className = 'dialogue-avatar';
                avatar.textContent = (line.speaker || '?').charAt(0).toUpperCase();

                const textDiv = document.createElement('div');
                textDiv.className = 'dialogue-text';

                const bengaliLine = document.createElement('div');
                bengaliLine.className = 'bengali-line';

                if (line.text.bengali) {
                    makeBengaliClickable(bengaliLine, line.text.bengali, line.text.romanized);
                }

                if (line.is_new) {
                    const newBadge = document.createElement('span');
                    newBadge.className = 'new-indicator new-indicator-sm new-indicator-inline';
                    newBadge.textContent = 'NEW';
                    bengaliLine.appendChild(newBadge);
                }

                if (line.text.romanized) {
                    const romLine = document.createElement('div');
                    romLine.className = 'romanized-line';
                    romLine.textContent = line.text.romanized;
                    textDiv.appendChild(bengaliLine);
                    textDiv.appendChild(romLine);
                } else {
                    textDiv.appendChild(bengaliLine);
                }

                const transLine = document.createElement('div');
                transLine.className = 'translation-line';
                transLine.textContent = I18n.localize(line.text);
                textDiv.appendChild(transLine);

                bubble.appendChild(avatar);
                bubble.appendChild(textDiv);
                dialogueBox.appendChild(bubble);
            });

            card.appendChild(dialogueBox);
        }

        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        renderOptionButtonsWithBengali(card, exercise);
    }

    // ========== Listening ==========

    function renderListening(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        card.appendChild(createAudioControls(exercise.audio));

        renderOptionButtonsWithBengali(card, exercise);
    }

    // ========== Alphabet Listening (NEW) ==========

    function renderAlphabetListening(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question) || I18n.t('identify_letter');
        card.appendChild(question);

        card.appendChild(createAudioControls(exercise.audio));

        // Grid of letter options
        const grid = document.createElement('div');
        grid.className = 'alphabet-options';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'alphabet-option-btn';
            if (opt.is_new) btn.classList.add('is-new');

            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter bengali-clickable';
            letterSpan.textContent = opt.letter;
            letterSpan.addEventListener('click', (e) => {
                // Only show popup if not selecting an answer
                if (e.detail > 1) return; // ignore double-click
            });
            btn.appendChild(letterSpan);

            if (opt.is_new) {
                const newBadge = document.createElement('span');
                newBadge.className = 'new-indicator new-indicator-sm';
                newBadge.textContent = 'NEW';
                btn.appendChild(newBadge);
            }

            if (opt.romanized) {
                const romSpan = document.createElement('span');
                romSpan.className = 'letter-rom';
                romSpan.textContent = opt.romanized;
                btn.appendChild(romSpan);
            }

            btn.addEventListener('click', () => {
                if (answered) return;
                answered = true;
                grid.querySelectorAll('.alphabet-option-btn').forEach((b, j) => {
                    b.disabled = true;
                    if (exercise.options[j].correct) b.classList.add('correct');
                });
                if (opt.correct) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('wrong');
                }
                AudioManager.stopListening();
                const correctOpt = exercise.options.find(o => o.correct);
                showFeedback(opt.correct, correctOpt.letter + (correctOpt.romanized ? ' (' + correctOpt.romanized + ')' : ''));
            });

            grid.appendChild(btn);
        });

        card.appendChild(grid);
    }

    // ========== Writing Keyboard (NEW) ==========

    function renderWritingKeyboard(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question) || I18n.t('type_with_keyboard');
        card.appendChild(question);

        if (exercise.romanized) {
            const rom = document.createElement('p');
            rom.className = 'exercise-romanized';
            rom.textContent = '(' + exercise.romanized + ')';
            card.appendChild(rom);
        }

        // Display area (read-only, shows what user has typed)
        const display = document.createElement('div');
        display.className = 'keyboard-display';
        const displayText = document.createElement('span');
        displayText.id = 'kb-display-text';
        displayText.textContent = '';
        const cursor = document.createElement('span');
        cursor.className = 'cursor-blink';
        display.appendChild(displayText);
        display.appendChild(cursor);
        card.appendChild(display);

        let typed = '';
        let mode = 'keyboard'; // 'keyboard' | 'roman'

        // Mode toggle (Bengali Keyboard <-> Roman Input)
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'input-mode-toggle';

        const kbModeBtn = document.createElement('button');
        kbModeBtn.className = 'mode-btn active';
        kbModeBtn.textContent = I18n.t('mode_bengali_keyboard');

        const romanModeBtn = document.createElement('button');
        romanModeBtn.className = 'mode-btn';
        romanModeBtn.textContent = I18n.t('mode_roman_input');

        toggleContainer.appendChild(kbModeBtn);
        toggleContainer.appendChild(romanModeBtn);
        card.appendChild(toggleContainer);

        // On-screen keyboard grid
        const kbGrid = document.createElement('div');
        kbGrid.className = 'keyboard-grid';

        // Letters from JSON
        const keys = exercise.keys || [];
        keys.forEach(keyObj => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = keyObj.letter || keyObj;
            btn.addEventListener('click', () => {
                if (answered) return;
                typed += keyObj.letter || keyObj;
                displayText.textContent = typed;
            });
            kbGrid.appendChild(btn);
        });

        // Backspace
        const bksp = document.createElement('button');
        bksp.className = 'key-btn backspace-key';
        bksp.textContent = I18n.t('backspace');
        bksp.addEventListener('click', () => {
            if (answered) return;
            // Remove last Bengali character (could be multi-byte)
            const chars = [...typed];
            chars.pop();
            typed = chars.join('');
            displayText.textContent = typed;
        });
        kbGrid.appendChild(bksp);

        card.appendChild(kbGrid);

        // Roman input area (hidden by default)
        const romanArea = document.createElement('div');
        romanArea.className = 'roman-input-area';
        romanArea.style.display = 'none';

        const romanInput = document.createElement('input');
        romanInput.type = 'text';
        romanInput.className = 'write-input';
        romanInput.placeholder = I18n.t('type_roman');
        romanInput.autocomplete = 'off';

        // Word-level IME: convert full word on SPACE or ENTER
        romanInput.addEventListener('keydown', (e) => {
            if (answered) return;
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                const val = romanInput.value.trim();
                if (val) {
                    typed += WordIME.convert(val);
                }
                romanInput.value = '';
                displayText.textContent = typed;
            } else if (e.key === 'Backspace' && romanInput.value === '' && typed.length > 0) {
                // Allow backspace into committed Bengali text
                const chars = [...typed];
                chars.pop();
                typed = chars.join('');
                displayText.textContent = typed;
            }
        });
        romanArea.appendChild(romanInput);
        card.appendChild(romanArea);

        // Mode switching
        kbModeBtn.addEventListener('click', () => {
            if (mode === 'keyboard' || answered) return;
            mode = 'keyboard';
            kbModeBtn.classList.add('active');
            romanModeBtn.classList.remove('active');
            kbGrid.style.display = '';
            romanArea.style.display = 'none';
        });
        romanModeBtn.addEventListener('click', () => {
            if (mode === 'roman' || answered) return;
            mode = 'roman';
            romanModeBtn.classList.add('active');
            kbModeBtn.classList.remove('active');
            kbGrid.style.display = 'none';
            romanArea.style.display = '';
            romanInput.focus();
        });

        // Block physical keyboard on the card when in keyboard mode
        card.addEventListener('keydown', (e) => {
            if (!answered && mode === 'keyboard') e.preventDefault();
        });

        // Check button
        const checkContainer = document.createElement('div');
        checkContainer.className = 'check-btn-container';
        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn btn-primary';
        checkBtn.textContent = I18n.t('check');
        checkBtn.addEventListener('click', () => {
            if (answered || !typed) return;
            answered = true;
            cursor.style.display = 'none';
            const acceptable = exercise.acceptableAnswers || [exercise.correctAnswer];
            const isCorrect = acceptable.some(a =>
                a.trim() === typed.trim()
            );
            display.classList.add(isCorrect ? 'correct' : 'wrong');

            // Disable keyboard & roman input
            kbGrid.querySelectorAll('.key-btn').forEach(b => b.disabled = true);
            romanInput.disabled = true;
            showFeedback(isCorrect, exercise.correctAnswer);
        });
        checkContainer.appendChild(checkBtn);
        card.appendChild(checkContainer);
    }

    // ========== Conversation Listening (NEW) ==========

    function renderConversationListening(card, exercise) {
        const intro = document.createElement('p');
        intro.className = 'exercise-question';
        intro.textContent = I18n.localize(exercise.scenario) || I18n.t('listen_and_follow');
        card.appendChild(intro);

        const convContainer = document.createElement('div');
        convContainer.className = 'conv-listen-container';

        // All dialogue lines + choice points
        const lines = exercise.lines || [];
        let currentStep = 0;

        // Map step index -> DOM element for reliable lookup
        const stepElements = {};

        function advanceToStep(step) {
            if (step >= lines.length) {
                // All lines done — this exercise is complete (auto-correct)
                if (!answered) {
                    answered = true;
                    showFeedback(true, '');
                }
                return;
            }

            const lineData = lines[step];

            // Progressive visibility: show current and previous, hide future
            for (let s = 0; s < lines.length; s++) {
                const el = stepElements[s];
                if (!el) continue;
                if (s < step) {
                    el.classList.add('played', 'visible');
                    el.classList.remove('active');
                } else if (s === step) {
                    el.classList.add('active', 'visible');
                }
                // future steps stay hidden (no .visible class)
            }

            // If it's a choice point, show it and WAIT for user selection
            if (lineData.type === 'choice') {
                const choiceCard = stepElements[step];
                if (choiceCard) {
                    choiceCard.style.display = 'block';
                    choiceCard.classList.add('visible');
                }
                // Do NOT auto-advance — wait for user click in the choice handler
            } else {
                // Auto-play audio if available
                if (lineData.audio) {
                    AudioManager.playListening(lineData.audio, () => {
                        // After playback, advance
                        currentStep = step + 1;
                        advanceToStep(currentStep);
                    });
                } else {
                    // No audio, auto-advance after short delay
                    setTimeout(() => {
                        currentStep = step + 1;
                        advanceToStep(currentStep);
                    }, 1200);
                }
            }
        }

        lines.forEach((lineData, idx) => {
            if (lineData.type === 'choice') {
                // Choice point element
                const choiceArea = document.createElement('div');
                choiceArea.className = 'conv-choice-area';
                choiceArea.dataset.step = idx;
                choiceArea.style.display = 'none';

                stepElements[idx] = choiceArea;

                const q = document.createElement('p');
                q.className = 'exercise-question';
                q.textContent = I18n.localize(lineData.question) || I18n.t('choose_response');
                choiceArea.appendChild(q);

                const optList = document.createElement('div');
                optList.className = 'options-list';

                lineData.options.forEach((opt, oi) => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';
                    if (opt.text && opt.text.bengali) {
                        const bSpan = document.createElement('span');
                        bSpan.className = 'option-bengali';
                        bSpan.textContent = opt.text.bengali;
                        btn.appendChild(bSpan);
                        if (opt.text.romanized) {
                            const rSpan = document.createElement('span');
                            rSpan.className = 'option-romanized';
                            rSpan.textContent = opt.text.romanized;
                            btn.appendChild(rSpan);
                        }
                    }
                    const tSpan = document.createElement('span');
                    tSpan.textContent = I18n.localize(opt.text);
                    btn.appendChild(tSpan);

                    btn.addEventListener('click', () => {
                        if (btn.disabled) return;
                        optList.querySelectorAll('.option-btn').forEach((b, j) => {
                            b.disabled = true;
                            if (lineData.options[j].correct) b.classList.add('correct');
                        });
                        if (opt.correct) {
                            btn.classList.add('correct');
                            AudioManager.playSfx('correct');
                        } else {
                            btn.classList.add('wrong');
                            AudioManager.playSfx('wrong');
                        }
                        // Continue conversation after choice
                        setTimeout(() => {
                            currentStep = idx + 1;
                            advanceToStep(currentStep);
                        }, 800);
                    });
                    optList.appendChild(btn);
                });

                choiceArea.appendChild(optList);
                convContainer.appendChild(choiceArea);
            } else {
                // Dialogue line
                const lineEl = document.createElement('div');
                lineEl.className = 'conv-line';
                lineEl.dataset.step = idx;

                stepElements[idx] = lineEl;

                if (lineData.audio) {
                    lineEl.appendChild(createInlineAudioBtn(lineData.audio));
                }

                const content = document.createElement('div');
                content.className = 'conv-line-content';

                if (lineData.speaker) {
                    const sp = document.createElement('div');
                    sp.className = 'conv-line-speaker';
                    sp.textContent = lineData.speaker;
                    content.appendChild(sp);
                }

                if (lineData.bengali) {
                    const bn = document.createElement('div');
                    bn.className = 'conv-line-bengali';
                    makeBengaliClickable(bn, lineData.bengali, lineData.romanized);
                    content.appendChild(bn);
                }

                if (lineData.romanized) {
                    const rm = document.createElement('div');
                    rm.className = 'conv-line-romanized';
                    rm.textContent = lineData.romanized;
                    content.appendChild(rm);
                }

                const tr = document.createElement('div');
                tr.className = 'conv-line-translation';
                tr.textContent = I18n.localize(lineData.translation || {});
                content.appendChild(tr);

                lineEl.appendChild(content);
                convContainer.appendChild(lineEl);
            }
        });

        card.appendChild(convContainer);

        // Start the conversation
        setTimeout(() => advanceToStep(0), 400);
    }

    // ========== Shared option render helpers ==========

    /** Simple text-only options (for reading) */
    function renderOptionButtons(card, exercise) {
        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = I18n.localize(opt.text);
            btn.addEventListener('click', () => {
                if (answered) return;
                answered = true;
                optionsList.querySelectorAll('.option-btn').forEach((b, j) => {
                    b.disabled = true;
                    if (exercise.options[j].correct) b.classList.add('correct');
                });
                if (opt.correct) btn.classList.add('correct');
                else btn.classList.add('wrong');
                const correctOpt = exercise.options.find(o => o.correct);
                showFeedback(opt.correct, I18n.localize(correctOpt.text));
            });
            optionsList.appendChild(btn);
        });
        card.appendChild(optionsList);
    }

    /** Options with Bengali + romanized + translation (for conversation, listening) */
    function renderOptionButtonsWithBengali(card, exercise) {
        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            if (opt.text && opt.text.bengali) {
                const bSpan = document.createElement('span');
                bSpan.className = 'option-bengali';
                bSpan.textContent = opt.text.bengali;
                btn.appendChild(bSpan);
                if (opt.text.romanized) {
                    const rSpan = document.createElement('span');
                    rSpan.className = 'option-romanized';
                    rSpan.textContent = opt.text.romanized;
                    btn.appendChild(rSpan);
                }
            }
            const tSpan = document.createElement('span');
            tSpan.textContent = I18n.localize(opt.text);
            btn.appendChild(tSpan);

            btn.addEventListener('click', () => {
                if (answered) return;
                answered = true;
                optionsList.querySelectorAll('.option-btn').forEach((b, j) => {
                    b.disabled = true;
                    if (exercise.options[j].correct) b.classList.add('correct');
                });
                if (opt.correct) btn.classList.add('correct');
                else btn.classList.add('wrong');
                AudioManager.stopListening();
                const correctOpt = exercise.options.find(o => o.correct);
                showFeedback(opt.correct, I18n.localize(correctOpt.text));
            });
            optionsList.appendChild(btn);
        });
        card.appendChild(optionsList);
    }

    // ========== Audio Controls (shared) ==========

    function createAudioControls(audioSrc) {
        const audioControls = document.createElement('div');
        audioControls.className = 'audio-controls';

        const playBtn = document.createElement('button');
        playBtn.className = 'audio-play-btn';
        playBtn.innerHTML = '&#9654;';

        const audioInfo = document.createElement('div');
        audioInfo.className = 'audio-info';

        const audioLabel = document.createElement('p');
        audioLabel.textContent = I18n.t('play_audio');
        audioInfo.appendChild(audioLabel);

        const volumeControl = document.createElement('div');
        volumeControl.className = 'audio-volume-control';
        const volLabel = document.createElement('span');
        volLabel.textContent = '🔊';
        volLabel.style.fontSize = '0.9rem';
        const volSlider = document.createElement('input');
        volSlider.type = 'range';
        volSlider.min = '0';
        volSlider.max = '100';
        volSlider.value = Math.round(AudioManager.getAudioVolume() * 100);
        volSlider.addEventListener('input', () => {
            AudioManager.setAudioVolume(parseInt(volSlider.value) / 100);
        });
        const replayBtn = document.createElement('button');
        replayBtn.className = 'audio-replay-btn';
        replayBtn.textContent = '🔄 ' + I18n.t('replay');
        replayBtn.addEventListener('click', () => {
            AudioManager.replayListening();
            playBtn.classList.add('playing');
        });
        volumeControl.appendChild(volLabel);
        volumeControl.appendChild(volSlider);
        volumeControl.appendChild(replayBtn);
        audioInfo.appendChild(volumeControl);

        audioControls.appendChild(playBtn);
        audioControls.appendChild(audioInfo);

        playBtn.addEventListener('click', () => {
            if (AudioManager.isPlaying()) {
                AudioManager.stopListening();
                playBtn.classList.remove('playing');
                playBtn.innerHTML = '&#9654;';
                return;
            }
            const result = AudioManager.playListening(audioSrc, () => {
                playBtn.classList.remove('playing');
                playBtn.innerHTML = '&#9654;';
            });
            if (result.audio) {
                playBtn.classList.add('playing');
                playBtn.innerHTML = '&#9646;&#9646;';
                result.audio.addEventListener('error', () => {
                    playBtn.classList.remove('playing');
                    playBtn.innerHTML = '&#9654;';
                    if (!audioControls.querySelector('.audio-error')) {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'audio-error';
                        errorMsg.textContent = I18n.t('audio_error');
                        audioControls.appendChild(errorMsg);
                    }
                });
            } else {
                if (!audioControls.querySelector('.audio-error')) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'audio-error';
                    errorMsg.textContent = I18n.t('audio_error');
                    audioControls.appendChild(errorMsg);
                }
            }
        });

        return audioControls;
    }

    // ========== Feedback ==========

    function showFeedback(isCorrect, correctAnswerText) {
        if (isCorrect) {
            AudioManager.playSfx('correct');
        } else {
            AudioManager.playSfx('wrong');
        }

        const exerciseCard = container.querySelector('.exercise-card');
        if (exerciseCard) {
            exerciseCard.classList.add(isCorrect ? 'animate-pop' : 'animate-shake');
        }

        const feedback = document.getElementById('exercise-feedback');
        if (feedback) {
            feedback.className = 'exercise-feedback visible ' +
                (isCorrect ? 'correct-feedback' : 'wrong-feedback');

            const textDiv = document.createElement('div');
            textDiv.className = 'feedback-text';
            if (isCorrect) {
                textDiv.textContent = I18n.t('correct') + ' ' + I18n.t('great_job');
            } else {
                textDiv.textContent = I18n.t('incorrect') +
                    (correctAnswerText ? ' — ' + I18n.t('correct_answer_was') + ' ' + correctAnswerText : '');
            }

            const nextBtn = document.createElement('button');
            nextBtn.className = 'next-btn';
            nextBtn.textContent = I18n.t('next');
            nextBtn.addEventListener('click', () => {
                if (onAnswered) onAnswered(isCorrect);
            });

            feedback.innerHTML = '';
            feedback.appendChild(textDiv);
            feedback.appendChild(nextBtn);
        }
    }

    // ========== Utility ==========

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        return a.every((val, i) => val === b[i]);
    }

    return { init, render };
})();
