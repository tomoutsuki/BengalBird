/**
 * BengalBird - Internationalization Module (i18n.js)
 * Handles UI language toggling between English and Japanese.
 * All translatable strings are stored here.
 */
const I18n = (() => {
    'use strict';

    const strings = {
        en: {
            menu_title: 'Lessons',
            settings_title: 'Settings',
            sfx_volume: 'Sound Effects Volume',
            audio_volume: 'Audio Volume',
            ui_language: 'Interface Language',
            reset_progress: 'Reset All Progress',
            reset_confirm: 'Are you sure you want to reset all progress?',
            home_subtitle: 'Learn Bengali step by step',
            back: '← Back',
            lesson_complete: 'Lesson Complete!',
            back_to_home: 'Back to Home',
            check: 'Check',
            next: 'Continue',
            correct: 'Correct!',
            great_job: 'Great job!',
            incorrect: 'Incorrect',
            correct_answer_was: 'Correct answer:',
            hint_label: '💡 Show Hint',
            play_audio: 'Play Audio',
            replay: 'Replay',
            volume: 'Volume',
            audio_error: 'Audio file could not be loaded.',
            arrange_words: 'Arrange the words:',
            your_answer: 'Your answer:',
            word_bank_label: 'Word bank:',
            answer_zone_label: 'Your answer:',
            type_answer: 'Type your answer...',
            show_translation: 'Show translation',
            hide_translation: 'Hide translation',
            scenario: 'Scenario:',
            stats_score: 'You scored {correct} out of {total}!',
            badge_grammar: 'Grammar',
            badge_reading: 'Reading',
            badge_conversation: 'Conversation',
            badge_listening: 'Listening',
            badge_alphabet: 'Alphabet',
            badge_keyboard: 'Writing',
            badge_conv_listen: 'Conversation',
            lang_toggle: 'EN',
            begin_lesson: 'BEGIN',
            est_time: 'Estimated time: {mins} min',
            credits: 'Credits',
            license: 'License',
            loading: 'Loading...',
            backspace: '⌫',
            identify_letter: 'Which letter was pronounced?',
            type_with_keyboard: 'Tap the letters to spell the word:',
            choose_response: 'Choose the correct response:',
            listen_and_follow: 'Listen and follow the conversation.',
        },
        ja: {
            menu_title: 'レッスン一覧',
            settings_title: '設定',
            sfx_volume: '効果音の音量',
            audio_volume: 'オーディオ音量',
            ui_language: 'インターフェース言語',
            reset_progress: '進捗をリセット',
            reset_confirm: 'すべての進捗をリセットしてもよろしいですか？',
            home_subtitle: 'ベンガル語を一歩ずつ学ぼう',
            back: '← 戻る',
            lesson_complete: 'レッスン完了！',
            back_to_home: 'ホームに戻る',
            check: '確認',
            next: '続ける',
            correct: '正解！',
            great_job: 'すばらしい！',
            incorrect: '不正解',
            correct_answer_was: '正解は：',
            hint_label: '💡 ヒントを表示',
            play_audio: '音声を再生',
            replay: 'もう一度',
            volume: '音量',
            audio_error: '音声ファイルを読み込めませんでした。',
            arrange_words: '単語を並べ替えてください：',
            your_answer: 'あなたの答え：',
            word_bank_label: '単語バンク：',
            answer_zone_label: 'あなたの答え：',
            type_answer: '答えを入力してください…',
            show_translation: '翻訳を表示',
            hide_translation: '翻訳を非表示',
            scenario: 'シチュエーション：',
            stats_score: '{total}問中{correct}問正解！',
            badge_grammar: '文法',
            badge_reading: '読解',
            badge_conversation: '会話',
            badge_listening: 'リスニング',
            badge_alphabet: 'アルファベット',
            badge_keyboard: 'ライティング',
            badge_conv_listen: '会話',
            lang_toggle: 'JA',
            begin_lesson: 'はじめる',
            est_time: '所要時間の目安：{mins}分',
            credits: 'クレジット',
            license: 'ライセンス',
            loading: '読み込み中...',
            backspace: '⌫',
            identify_letter: 'どの文字の発音ですか？',
            type_with_keyboard: '文字をタップして単語を入力：',
            choose_response: '正しい返答を選んでください：',
            listen_and_follow: '会話を聞いて進めてください。',
        }
    };

    let currentLang = 'en';

    /**
     * Get current language code
     */
    function getLang() {
        return currentLang;
    }

    /**
     * Set language and update all [data-i18n] elements
     */
    function setLang(lang) {
        if (!strings[lang]) return;
        currentLang = lang;
        localStorage.setItem('bengalbird_lang', lang);
        updateDOM();
    }

    /**
     * Get a translated string by key, with optional replacements
     */
    function t(key, replacements) {
        let str = strings[currentLang]?.[key] || strings.en[key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(k => {
                str = str.replace(`{${k}}`, replacements[k]);
            });
        }
        return str;
    }

    /**
     * Get localized text from an object like { en: "...", ja: "..." }
     */
    function localize(obj) {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj[currentLang] || obj.en || '';
    }

    /**
     * Update all DOM elements with data-i18n attribute
     */
    function updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT' && el.type !== 'button' && el.type !== 'submit') {
                el.placeholder = t(key);
            } else {
                el.textContent = t(key);
            }
        });
        // Update lang toggle button text
        const langBtn = document.getElementById('lang-toggle-btn');
        if (langBtn) {
            langBtn.textContent = currentLang === 'en' ? 'EN' : 'JA';
        }
    }

    /**
     * Initialize: load saved language preference
     */
    function init() {
        const saved = localStorage.getItem('bengalbird_lang');
        if (saved && strings[saved]) {
            currentLang = saved;
        }
        updateDOM();
    }

    return { getLang, setLang, t, localize, init, updateDOM };
})();
