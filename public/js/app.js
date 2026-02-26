/**
 * BengalBird - Main Application Controller (app.js)
 * Orchestrates screens, lesson loading, navigation, and settings.
 * No external dependencies — uses I18n, Progress, AudioManager, Exercises modules.
 */
const App = (() => {
    'use strict';

    // ---- State ----
    let chaptersData = null;
    let currentLesson = null;
    let currentExerciseIndex = 0;
    let correctCount = 0;
    let totalExercises = 0;
    let allLessonIds = []; // flat ordered list of lesson IDs across all chapters

    // ---- DOM references ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ---- Screens ----
    function showScreen(id) {
        $$('.screen').forEach(s => s.classList.remove('active'));
        const target = $(`#screen-${id}`);
        if (target) target.classList.add('active');
    }

    // ---- Data Loading ----
    async function fetchJSON(url) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
            return await resp.json();
        } catch (e) {
            console.error('Failed to load JSON:', url, e);
            return null;
        }
    }

    async function loadChapters() {
        chaptersData = await fetchJSON('data/chapters.json');
        if (!chaptersData || !chaptersData.chapters) {
            console.error('Invalid chapters data');
            return;
        }
        // Build flat lesson list
        allLessonIds = [];
        chaptersData.chapters.forEach(ch => {
            (ch.sections || []).forEach(sec => {
                (sec.lessons || []).forEach(lid => {
                    if (!allLessonIds.includes(lid)) {
                        allLessonIds.push(lid);
                    }
                });
            });
        });
        renderHome();
        buildMenu();
    }

    async function loadLesson(lessonId) {
        const data = await fetchJSON(`data/${lessonId}.json`);
        if (!data || !data.exercises) {
            console.error('Invalid lesson data for:', lessonId);
            return;
        }
        startLesson(data);
    }

    // ---- Home Screen ----
    function renderHome() {
        const list = $('#chapter-list');
        list.innerHTML = '';

        chaptersData.chapters.forEach(chapter => {
            const card = document.createElement('div');
            card.className = 'chapter-card';

            const title = document.createElement('h3');
            title.textContent = I18n.localize(chapter.title);
            card.appendChild(title);

            const desc = document.createElement('p');
            desc.textContent = I18n.localize(chapter.description);
            card.appendChild(desc);

            (chapter.sections || []).forEach(section => {
                const secTitle = document.createElement('div');
                secTitle.className = 'section-title';
                secTitle.textContent = I18n.localize(section.title);
                card.appendChild(secTitle);

                const btnContainer = document.createElement('div');
                btnContainer.className = 'lesson-buttons';

                (section.lessons || []).forEach((lessonId, i) => {
                    const globalIdx = allLessonIds.indexOf(lessonId);
                    const btn = document.createElement('button');
                    btn.className = 'lesson-btn';
                    btn.textContent = globalIdx + 1;

                    if (Progress.isLessonCompleted(lessonId)) {
                        btn.classList.add('completed');
                    } else {
                        // Mark first incomplete as current
                        const prevDone = allLessonIds.slice(0, globalIdx).every(
                            id => Progress.isLessonCompleted(id)
                        );
                        if (prevDone && !Progress.isLessonCompleted(lessonId)) {
                            btn.classList.add('current');
                        }
                    }

                    btn.addEventListener('click', () => loadLesson(lessonId));
                    btnContainer.appendChild(btn);
                });

                card.appendChild(btnContainer);
            });

            list.appendChild(card);
        });
    }

    // ---- Side Menu ----
    function buildMenu() {
        const menuList = $('#menu-lesson-list');
        menuList.innerHTML = '';

        chaptersData.chapters.forEach(chapter => {
            const chTitle = document.createElement('div');
            chTitle.className = 'menu-chapter-title';
            chTitle.textContent = I18n.localize(chapter.title);
            menuList.appendChild(chTitle);

            (chapter.sections || []).forEach(section => {
                (section.lessons || []).forEach(lessonId => {
                    const globalIdx = allLessonIds.indexOf(lessonId);
                    const item = document.createElement('div');
                    item.className = 'menu-lesson-item';
                    if (Progress.isLessonCompleted(lessonId)) {
                        item.classList.add('completed');
                    }

                    const num = document.createElement('div');
                    num.className = 'lesson-number';
                    num.textContent = globalIdx + 1;

                    const label = document.createElement('div');
                    label.className = 'lesson-label';
                    // We'll set the label from lesson title once loaded, for now use ID
                    label.textContent = `Lesson ${globalIdx + 1}`;

                    item.appendChild(num);
                    item.appendChild(label);

                    item.addEventListener('click', () => {
                        closeMenu();
                        loadLesson(lessonId);
                    });

                    menuList.appendChild(item);
                });
            });
        });
    }

    function openMenu() {
        $('#side-menu').classList.remove('hidden');
        $('#menu-overlay').classList.remove('hidden');
    }

    function closeMenu() {
        $('#side-menu').classList.add('hidden');
        $('#menu-overlay').classList.add('hidden');
    }

    // ---- Settings ----
    function openSettings() {
        $('#settings-modal').classList.remove('hidden');
        $('#settings-overlay').classList.remove('hidden');
        // Sync sliders
        $('#sfx-volume').value = Math.round(AudioManager.getSfxVolume() * 100);
        $('#sfx-volume-label').textContent = Math.round(AudioManager.getSfxVolume() * 100) + '%';
        $('#audio-volume').value = Math.round(AudioManager.getAudioVolume() * 100);
        $('#audio-volume-label').textContent = Math.round(AudioManager.getAudioVolume() * 100) + '%';
        $('#ui-language-select').value = I18n.getLang();
    }

    function closeSettings() {
        $('#settings-modal').classList.add('hidden');
        $('#settings-overlay').classList.add('hidden');
    }

    // ---- Lesson Flow ----
    function startLesson(lessonData) {
        currentLesson = lessonData;
        currentExerciseIndex = 0;
        correctCount = 0;
        totalExercises = lessonData.exercises.length;

        // Set header
        $('#lesson-title').textContent = I18n.localize(lessonData.title);
        $('#lesson-description').textContent = I18n.localize(lessonData.description);

        updateProgressBar();
        showScreen('lesson');
        renderCurrentExercise();
    }

    function renderCurrentExercise() {
        if (currentExerciseIndex >= totalExercises) {
            finishLesson();
            return;
        }
        const exercise = currentLesson.exercises[currentExerciseIndex];
        Exercises.render(exercise);
        updateProgressBar();
    }

    function handleAnswer(isCorrect) {
        if (isCorrect) correctCount++;
        currentExerciseIndex++;
        renderCurrentExercise();
    }

    function updateProgressBar() {
        const pct = totalExercises > 0
            ? Math.round((currentExerciseIndex / totalExercises) * 100)
            : 0;
        $('#progress-bar').style.width = pct + '%';
        $('#progress-text').textContent = `${currentExerciseIndex} / ${totalExercises}`;
    }

    function finishLesson() {
        AudioManager.stopListening();
        AudioManager.playSfx('lessoncomplete');
        Progress.completeLesson(currentLesson.id, correctCount, totalExercises);

        // Stats
        const statsText = I18n.t('stats_score', {
            correct: correctCount,
            total: totalExercises
        });
        $('#complete-stats').textContent = statsText;

        showScreen('complete');
    }

    function goHome() {
        AudioManager.stopListening();
        renderHome();
        buildMenu();
        showScreen('home');
    }

    // ---- Event Binding ----
    function bindEvents() {
        // Menu
        $('#menu-btn').addEventListener('click', openMenu);
        $('#menu-close-btn').addEventListener('click', closeMenu);
        $('#menu-overlay').addEventListener('click', closeMenu);

        // Settings
        $('#settings-btn').addEventListener('click', openSettings);
        $('#settings-close-btn').addEventListener('click', closeSettings);
        $('#settings-overlay').addEventListener('click', closeSettings);

        // Volume sliders
        $('#sfx-volume').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            AudioManager.setSfxVolume(val / 100);
            $('#sfx-volume-label').textContent = val + '%';
        });

        $('#audio-volume').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            AudioManager.setAudioVolume(val / 100);
            $('#audio-volume-label').textContent = val + '%';
        });

        // Language
        $('#ui-language-select').addEventListener('change', (e) => {
            I18n.setLang(e.target.value);
            // Re-render current screen
            if (chaptersData) {
                renderHome();
                buildMenu();
            }
        });

        // Lang toggle button (quick switch)
        $('#lang-toggle-btn').addEventListener('click', () => {
            const next = I18n.getLang() === 'en' ? 'ja' : 'en';
            I18n.setLang(next);
            if (chaptersData) {
                renderHome();
                buildMenu();
            }
        });

        // Reset progress
        $('#reset-progress-btn').addEventListener('click', () => {
            if (confirm(I18n.t('reset_confirm'))) {
                Progress.reset();
                closeSettings();
                renderHome();
                buildMenu();
            }
        });

        // Navigation
        $('#back-btn').addEventListener('click', goHome);
        $('#complete-home-btn').addEventListener('click', goHome);
    }

    // ---- Init ----
    async function init() {
        // Initialize modules
        I18n.init();
        Progress.init();
        AudioManager.init();
        Exercises.init($('#exercise-container'), handleAnswer);

        // Bind UI events
        bindEvents();

        // Load data
        await loadChapters();
    }

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { goHome };
})();
