/**
 * BengalBird - Exercise Engine (exercises.js)
 * Renders and manages all exercise types:
 *   grammar-sort, grammar-select, grammar-write,
 *   reading, conversation, listening
 */
const Exercises = (() => {
    'use strict';

    let container = null;
    let currentExercise = null;
    let answered = false;
    let onAnswered = null; // callback(isCorrect)

    /**
     * Initialize with DOM container and answer callback
     */
    function init(containerEl, answerCallback) {
        container = containerEl;
        onAnswered = answerCallback;
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
            default:
                card.innerHTML += `<p>Unknown exercise type: ${exercise.type}</p>`;
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

    // ---------- Badge helpers ----------

    function getBadgeClass(type) {
        if (type.startsWith('grammar')) return 'badge-grammar';
        if (type === 'reading') return 'badge-reading';
        if (type === 'conversation') return 'badge-conversation';
        if (type === 'listening') return 'badge-listening';
        return '';
    }

    function getBadgeLabel(type) {
        if (type.startsWith('grammar')) return I18n.t('badge_grammar');
        if (type === 'reading') return I18n.t('badge_reading');
        if (type === 'conversation') return I18n.t('badge_conversation');
        if (type === 'listening') return I18n.t('badge_listening');
        return type;
    }

    // ---------- Grammar Sort ----------

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
        answerZone.id = 'sort-answer-zone';
        sortArea.appendChild(answerZone);

        // Word bank
        const bankLabel = document.createElement('div');
        bankLabel.className = 'sort-label';
        bankLabel.style.marginTop = '12px';
        bankLabel.textContent = I18n.t('word_bank_label');
        sortArea.appendChild(bankLabel);

        const wordBank = document.createElement('div');
        wordBank.className = 'word-bank';
        wordBank.id = 'sort-word-bank';

        // Shuffle words
        const shuffled = [...exercise.words].sort(() => Math.random() - 0.5);
        const answerWords = [];

        shuffled.forEach((word, i) => {
            const chip = document.createElement('button');
            chip.className = 'word-chip';
            chip.textContent = word;
            chip.dataset.word = word;
            chip.dataset.index = i;

            chip.addEventListener('click', () => {
                if (answered) return;
                // Move to answer zone
                chip.classList.add('in-answer');
                const answerChip = document.createElement('button');
                answerChip.className = 'word-chip';
                answerChip.textContent = word;
                answerChip.dataset.sourceIndex = i;
                answerChip.addEventListener('click', () => {
                    if (answered) return;
                    // Move back to bank
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

            if (isCorrect) {
                answerZone.classList.add('correct-zone');
            } else {
                answerZone.classList.add('wrong-zone');
            }

            showFeedback(isCorrect, exercise.correctOrder.join(' '));
        });
        checkContainer.appendChild(checkBtn);
        card.appendChild(checkContainer);
    }

    // ---------- Grammar Select ----------

    function renderSelect(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        if (exercise.bengali) {
            const bengali = document.createElement('p');
            bengali.className = 'exercise-bengali';
            bengali.textContent = exercise.bengali;
            card.appendChild(bengali);
        }

        if (exercise.romanized) {
            const rom = document.createElement('p');
            rom.className = 'exercise-romanized';
            rom.textContent = exercise.romanized;
            card.appendChild(rom);
        }

        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = I18n.localize(opt.text);
            btn.addEventListener('click', () => {
                if (answered) return;
                answered = true;

                // Disable all
                optionsList.querySelectorAll('.option-btn').forEach((b, j) => {
                    b.disabled = true;
                    if (exercise.options[j].correct) {
                        b.classList.add('correct');
                    }
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

    // ---------- Grammar Write ----------

    function renderWrite(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        if (exercise.romanized) {
            const rom = document.createElement('p');
            rom.className = 'exercise-romanized';
            rom.textContent = `(${exercise.romanized})`;
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

        // Check button
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

    // ---------- Reading ----------

    function renderReading(card, exercise) {
        // Passage box
        const passageBox = document.createElement('div');
        passageBox.className = 'passage-box';

        const pBengali = document.createElement('div');
        pBengali.className = 'passage-bengali';
        pBengali.textContent = exercise.passage.bengali;
        passageBox.appendChild(pBengali);

        if (exercise.passage.romanized) {
            const pRom = document.createElement('div');
            pRom.className = 'passage-romanized';
            pRom.textContent = exercise.passage.romanized;
            passageBox.appendChild(pRom);
        }

        // Translation toggle
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

        // Question
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        // Options
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

    // ---------- Conversation ----------

    function renderConversation(card, exercise) {
        // Scenario
        if (exercise.scenario) {
            const scenario = document.createElement('p');
            scenario.className = 'exercise-question';
            scenario.textContent = I18n.localize(exercise.scenario);
            card.appendChild(scenario);
        }

        // Dialogue
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
                bengaliLine.textContent = line.text.bengali || '';

                const transLine = document.createElement('div');
                transLine.className = 'translation-line';
                transLine.textContent = I18n.localize(line.text);

                textDiv.appendChild(bengaliLine);
                textDiv.appendChild(transLine);
                bubble.appendChild(avatar);
                bubble.appendChild(textDiv);
                dialogueBox.appendChild(bubble);
            });

            card.appendChild(dialogueBox);
        }

        // Question
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        // Options
        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            if (opt.text.bengali) {
                const bengaliSpan = document.createElement('span');
                bengaliSpan.className = 'option-bengali';
                bengaliSpan.textContent = opt.text.bengali;
                btn.appendChild(bengaliSpan);
            }

            const translationSpan = document.createElement('span');
            translationSpan.textContent = I18n.localize(opt.text);
            btn.appendChild(translationSpan);

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

    // ---------- Listening ----------

    function renderListening(card, exercise) {
        const question = document.createElement('p');
        question.className = 'exercise-question';
        question.textContent = I18n.localize(exercise.question);
        card.appendChild(question);

        // Audio controls
        const audioControls = document.createElement('div');
        audioControls.className = 'audio-controls';

        const playBtn = document.createElement('button');
        playBtn.className = 'audio-play-btn';
        playBtn.innerHTML = '&#9654;'; // play triangle
        playBtn.setAttribute('aria-label', I18n.t('play_audio'));

        const audioInfo = document.createElement('div');
        audioInfo.className = 'audio-info';

        const audioLabel = document.createElement('p');
        audioLabel.textContent = I18n.t('play_audio');
        audioInfo.appendChild(audioLabel);

        const volumeControl = document.createElement('div');
        volumeControl.className = 'audio-volume-control';

        const volLabel = document.createElement('span');
        volLabel.textContent = '🔊';
        volLabel.style.fontSize = '1rem';

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

        let audioLoaded = false;

        playBtn.addEventListener('click', () => {
            if (AudioManager.isPlaying()) {
                AudioManager.stopListening();
                playBtn.classList.remove('playing');
                playBtn.innerHTML = '&#9654;';
                return;
            }

            const result = AudioManager.playListening(exercise.audio, () => {
                playBtn.classList.remove('playing');
                playBtn.innerHTML = '&#9654;';
            });

            if (result.audio) {
                audioLoaded = true;
                playBtn.classList.add('playing');
                playBtn.innerHTML = '&#9646;&#9646;'; // pause

                result.audio.addEventListener('error', () => {
                    playBtn.classList.remove('playing');
                    playBtn.innerHTML = '&#9654;';
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'audio-error';
                    errorMsg.textContent = I18n.t('audio_error');
                    audioControls.appendChild(errorMsg);
                });
            } else {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'audio-error';
                errorMsg.textContent = I18n.t('audio_error');
                audioControls.appendChild(errorMsg);
            }
        });

        card.appendChild(audioControls);

        // Options
        const optionsList = document.createElement('div');
        optionsList.className = 'options-list';

        exercise.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            if (opt.text.bengali) {
                const bengaliSpan = document.createElement('span');
                bengaliSpan.className = 'option-bengali';
                bengaliSpan.textContent = opt.text.bengali;
                btn.appendChild(bengaliSpan);
            }

            const translationSpan = document.createElement('span');
            translationSpan.textContent = I18n.localize(opt.text);
            btn.appendChild(translationSpan);

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

                AudioManager.stopListening();
                const correctOpt = exercise.options.find(o => o.correct);
                showFeedback(opt.correct, I18n.localize(correctOpt.text));
            });
            optionsList.appendChild(btn);
        });

        card.appendChild(optionsList);
    }

    // ---------- Feedback ----------

    function showFeedback(isCorrect, correctAnswerText) {
        // Play SFX
        if (isCorrect) {
            AudioManager.playSfx('correct');
        } else {
            AudioManager.playSfx('wrong');
        }

        // Animate card
        const exerciseCard = container.querySelector('.exercise-card');
        if (exerciseCard) {
            exerciseCard.classList.add(isCorrect ? 'animate-pop' : 'animate-shake');
        }

        // Show feedback bar
        const feedback = document.getElementById('exercise-feedback');
        if (feedback) {
            feedback.className = 'exercise-feedback visible ' +
                (isCorrect ? 'correct-feedback' : 'wrong-feedback');

            const textDiv = document.createElement('div');
            textDiv.className = 'feedback-text';
            if (isCorrect) {
                textDiv.textContent = I18n.t('correct') + ' ' + I18n.t('great_job');
            } else {
                textDiv.textContent = I18n.t('incorrect') + ' — ' +
                    I18n.t('correct_answer_was') + ' ' + correctAnswerText;
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

    // ---------- Utility ----------

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        return a.every((val, i) => val === b[i]);
    }

    return { init, render };
})();
