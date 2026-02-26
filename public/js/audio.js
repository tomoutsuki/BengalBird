/**
 * BengalBird - Audio Manager (audio.js)
 * Handles SFX playback and listening exercise audio.
 * Supports play, replay, and configurable volume.
 */
const AudioManager = (() => {
    'use strict';

    const SETTINGS_KEY = 'bengalbird_audio_settings';

    let sfxVolume = 0.7;
    let audioVolume = 0.8;

    // Pre-loaded SFX
    const sfxCache = {};
    const sfxFiles = {
        correct: 'assets/audio/sfx/correct.wav',
        wrong: 'assets/audio/sfx/wrong.wav',
        verycorrect: 'assets/audio/sfx/verycorrect.wav',
        lessoncomplete: 'assets/audio/sfx/lessoncomplete.wav'
    };

    // Current listening audio element
    let currentAudio = null;

    /**
     * Load saved volume settings
     */
    function loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                sfxVolume = parsed.sfxVolume ?? 0.7;
                audioVolume = parsed.audioVolume ?? 0.8;
            }
        } catch (e) {
            console.warn('Failed to load audio settings:', e);
        }
    }

    /**
     * Save volume settings
     */
    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sfxVolume, audioVolume }));
        } catch (e) {
            console.warn('Failed to save audio settings:', e);
        }
    }

    /**
     * Set SFX volume (0.0 - 1.0)
     */
    function setSfxVolume(vol) {
        sfxVolume = Math.max(0, Math.min(1, vol));
        saveSettings();
    }

    /**
     * Set audio volume (0.0 - 1.0)
     */
    function setAudioVolume(vol) {
        audioVolume = Math.max(0, Math.min(1, vol));
        if (currentAudio) {
            currentAudio.volume = audioVolume;
        }
        saveSettings();
    }

    /**
     * Get current volumes
     */
    function getSfxVolume() { return sfxVolume; }
    function getAudioVolume() { return audioVolume; }

    /**
     * Preload SFX files for instant playback
     */
    function preloadSfx() {
        Object.keys(sfxFiles).forEach(name => {
            try {
                const audio = new Audio(sfxFiles[name]);
                audio.preload = 'auto';
                audio.volume = sfxVolume;
                sfxCache[name] = audio;
            } catch (e) {
                console.warn(`Failed to preload SFX: ${name}`, e);
            }
        });
    }

    /**
     * Play a sound effect by name
     */
    function playSfx(name) {
        try {
            const cached = sfxCache[name];
            if (cached) {
                // Clone to allow overlapping playback
                const clone = cached.cloneNode();
                clone.volume = sfxVolume;
                clone.play().catch(() => {});
            }
        } catch (e) {
            // Silent fail for SFX
        }
    }

    /**
     * Play a listening audio file.
     * Returns { audio, error } where audio is the HTMLAudioElement or null on error.
     */
    function playListening(src, onEnded) {
        stopListening();
        try {
            currentAudio = new Audio(src);
            currentAudio.volume = audioVolume;
            currentAudio.addEventListener('ended', () => {
                if (onEnded) onEnded();
            });
            currentAudio.addEventListener('error', () => {
                console.warn(`Audio error for: ${src}`);
            });
            const playPromise = currentAudio.play();
            if (playPromise) {
                playPromise.catch(err => {
                    console.warn('Audio play failed:', err);
                });
            }
            return { audio: currentAudio, error: null };
        } catch (e) {
            console.warn('Failed to create audio:', e);
            return { audio: null, error: e.message };
        }
    }

    /**
     * Replay the current listening audio from the start
     */
    function replayListening() {
        if (currentAudio) {
            currentAudio.currentTime = 0;
            currentAudio.volume = audioVolume;
            currentAudio.play().catch(() => {});
        }
    }

    /**
     * Stop current listening audio
     */
    function stopListening() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    }

    /**
     * Check if currently playing
     */
    function isPlaying() {
        return currentAudio && !currentAudio.paused;
    }

    /**
     * Initialize
     */
    function init() {
        loadSettings();
        preloadSfx();
    }

    return {
        init,
        setSfxVolume,
        setAudioVolume,
        getSfxVolume,
        getAudioVolume,
        playSfx,
        playListening,
        replayListening,
        stopListening,
        isPlaying
    };
})();
