/**
 * BengalBird - Profile Page (profile.js)
 * Editable nickname and avatar selection.
 * All data stored in localStorage — no authentication.
 */
const ProfilePage = (() => {
    'use strict';

    const STORAGE_KEY = 'bengalbird_profile';

    // Predefined avatar options (SVG data URIs for offline use)
    const AVATARS = [
        { id: 'bird',    emoji: '🐦', label: 'Bird' },
        { id: 'tiger',   emoji: '🐯', label: 'Tiger' },
        { id: 'lotus',   emoji: '🪷', label: 'Lotus' },
        { id: 'star',    emoji: '⭐', label: 'Star' },
        { id: 'book',    emoji: '📖', label: 'Book' },
        { id: 'globe',   emoji: '🌏', label: 'Globe' },
        { id: 'heart',   emoji: '💚', label: 'Heart' },
        { id: 'fire',    emoji: '🔥', label: 'Fire' },
        { id: 'crown',   emoji: '👑', label: 'Crown' },
        { id: 'rocket',  emoji: '🚀', label: 'Rocket' },
        { id: 'sun',     emoji: '☀️', label: 'Sun' },
        { id: 'moon',    emoji: '🌙', label: 'Moon' },
    ];

    let container = null;
    let profile = { nickname: '', avatar: 'bird' };

    /**
     * Initialize profile page.
     * @param {HTMLElement} el - #section-profile
     */
    function init(el) {
        container = el;
        loadProfile();
        render();
    }

    /**
     * Load profile from localStorage.
     */
    function loadProfile() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                profile.nickname = parsed.nickname || '';
                profile.avatar = parsed.avatar || 'bird';
            }
        } catch (e) {
            console.warn('ProfilePage: failed to load profile', e);
        }
    }

    /**
     * Save profile to localStorage.
     */
    function saveProfile() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (e) {
            console.warn('ProfilePage: failed to save profile', e);
        }
    }

    /**
     * Build the profile page DOM.
     */
    function render() {
        container.innerHTML = '';

        // Profile header with current avatar
        const header = document.createElement('div');
        header.className = 'profile-header';

        const avatarDisplay = document.createElement('div');
        avatarDisplay.className = 'profile-avatar-display';
        avatarDisplay.id = 'profile-avatar-display';
        const currentAvatar = AVATARS.find(a => a.id === profile.avatar) || AVATARS[0];
        avatarDisplay.textContent = currentAvatar.emoji;
        header.appendChild(avatarDisplay);

        const nameDisplay = document.createElement('div');
        nameDisplay.className = 'profile-name-display';
        nameDisplay.id = 'profile-name-display';
        nameDisplay.textContent = profile.nickname || I18n.t('profile_default_name');
        header.appendChild(nameDisplay);

        container.appendChild(header);

        // Nickname section
        const nickSection = document.createElement('div');
        nickSection.className = 'profile-section';

        const nickLabel = document.createElement('label');
        nickLabel.className = 'profile-label';
        nickLabel.textContent = I18n.t('profile_nickname');
        nickSection.appendChild(nickLabel);

        const nickRow = document.createElement('div');
        nickRow.className = 'profile-nick-row';

        const nickInput = document.createElement('input');
        nickInput.type = 'text';
        nickInput.className = 'write-input profile-nick-input';
        nickInput.placeholder = I18n.t('profile_nick_placeholder');
        nickInput.value = profile.nickname;
        nickInput.maxLength = 30;
        nickRow.appendChild(nickInput);

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary btn-sm';
        saveBtn.textContent = I18n.t('profile_save');
        saveBtn.addEventListener('click', () => {
            profile.nickname = nickInput.value.trim();
            saveProfile();
            nameDisplay.textContent = profile.nickname || I18n.t('profile_default_name');
            showSavedFeedback(saveBtn);
        });
        nickRow.appendChild(saveBtn);

        nickSection.appendChild(nickRow);
        container.appendChild(nickSection);

        // Avatar selection section
        const avatarSection = document.createElement('div');
        avatarSection.className = 'profile-section';

        const avatarLabel = document.createElement('label');
        avatarLabel.className = 'profile-label';
        avatarLabel.textContent = I18n.t('profile_choose_avatar');
        avatarSection.appendChild(avatarLabel);

        const avatarGrid = document.createElement('div');
        avatarGrid.className = 'profile-avatar-grid';

        AVATARS.forEach(av => {
            const btn = document.createElement('button');
            btn.className = 'profile-avatar-btn' + (av.id === profile.avatar ? ' selected' : '');
            btn.title = av.label;
            btn.textContent = av.emoji;
            btn.addEventListener('click', () => {
                profile.avatar = av.id;
                saveProfile();
                // Update selection
                avatarGrid.querySelectorAll('.profile-avatar-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                avatarDisplay.textContent = av.emoji;
            });
            avatarGrid.appendChild(btn);
        });

        avatarSection.appendChild(avatarGrid);
        container.appendChild(avatarSection);

        // Stats section
        const statsSection = document.createElement('div');
        statsSection.className = 'profile-section';

        const statsLabel = document.createElement('label');
        statsLabel.className = 'profile-label';
        statsLabel.textContent = I18n.t('profile_stats');
        statsSection.appendChild(statsLabel);

        const completedCount = Progress.getCompleted().length;
        const statText = document.createElement('p');
        statText.className = 'profile-stat-text';
        statText.textContent = I18n.t('profile_lessons_completed', { count: completedCount });
        statsSection.appendChild(statText);

        container.appendChild(statsSection);
    }

    /**
     * Brief "Saved!" animation on the save button.
     */
    function showSavedFeedback(btn) {
        const orig = btn.textContent;
        btn.textContent = I18n.t('profile_saved');
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = orig;
            btn.disabled = false;
        }, 1200);
    }

    /**
     * Called when tab switches to profile.
     */
    function onActivate() {
        // Refresh stats
        const statText = container ? container.querySelector('.profile-stat-text') : null;
        if (statText) {
            statText.textContent = I18n.t('profile_lessons_completed', { count: Progress.getCompleted().length });
        }
    }

    return { init, onActivate };
})();
