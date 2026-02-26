/**
 * BengalBird - Progress Manager (progress.js)
 * Saves and loads user progress using localStorage.
 * 
 * Storage format:
 * {
 *   completedLessons: ["lesson1", "lesson2", ...],
 *   lessonScores: { "lesson1": { correct: 5, total: 8 }, ... }
 * }
 */
const Progress = (() => {
    'use strict';

    const STORAGE_KEY = 'bengalbird_progress';

    let data = {
        completedLessons: [],
        lessonScores: {}
    };

    /**
     * Load progress from localStorage
     */
    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                data = {
                    completedLessons: parsed.completedLessons || [],
                    lessonScores: parsed.lessonScores || {}
                };
            }
        } catch (e) {
            console.warn('Failed to load progress:', e);
            data = { completedLessons: [], lessonScores: {} };
        }
    }

    /**
     * Save progress to localStorage
     */
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    }

    /**
     * Mark a lesson as completed
     */
    function completeLesson(lessonId, correct, total) {
        if (!data.completedLessons.includes(lessonId)) {
            data.completedLessons.push(lessonId);
        }
        data.lessonScores[lessonId] = { correct, total };
        save();
    }

    /**
     * Check if a lesson is completed
     */
    function isLessonCompleted(lessonId) {
        return data.completedLessons.includes(lessonId);
    }

    /**
     * Get lesson score
     */
    function getLessonScore(lessonId) {
        return data.lessonScores[lessonId] || null;
    }

    /**
     * Get all completed lesson IDs
     */
    function getCompleted() {
        return [...data.completedLessons];
    }

    /**
     * Reset all progress
     */
    function reset() {
        data = { completedLessons: [], lessonScores: {} };
        save();
    }

    /**
     * Initialize
     */
    function init() {
        load();
    }

    return { init, completeLesson, isLessonCompleted, getLessonScore, getCompleted, reset };
})();
