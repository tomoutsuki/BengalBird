/**
 * BengalBird - Simple SPA Router (router.js)
 * Hash-based routing: #course, #dictionary, #keyboard, #profile
 * No frameworks, no page reloads.
 */
const Router = (() => {
    'use strict';

    const TABS = ['course', 'dictionary', 'keyboard', 'profile'];
    const DEFAULT_TAB = 'course';

    let currentTab = DEFAULT_TAB;
    let onTabChange = null; // callback(tabName)

    /**
     * Initialize the router.
     * @param {Function} callback - called with (tabName) on every tab change
     */
    function init(callback) {
        onTabChange = callback;

        window.addEventListener('hashchange', () => {
            const tab = getTabFromHash();
            navigateTo(tab, false);
        });

        // Set initial tab from URL hash (or default)
        const initial = getTabFromHash();
        navigateTo(initial, false);
    }

    /**
     * Extract tab name from location.hash
     */
    function getTabFromHash() {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        return TABS.includes(hash) ? hash : DEFAULT_TAB;
    }

    /**
     * Navigate to a specific tab
     * @param {string} tab - one of TABS
     * @param {boolean} [updateHash=true] - whether to update URL hash
     */
    function navigateTo(tab, updateHash) {
        if (!TABS.includes(tab)) tab = DEFAULT_TAB;
        if (updateHash !== false) {
            window.location.hash = '#' + tab;
        }
        if (currentTab !== tab || !document.querySelector('.tab-section.active')) {
            currentTab = tab;
            activateTab(tab);
        }
    }

    /**
     * Show the correct section and highlight footer tab
     */
    function activateTab(tab) {
        // Hide all tab sections
        document.querySelectorAll('.tab-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show target section
        const target = document.getElementById('section-' + tab);
        if (target) target.classList.add('active');

        // Update footer buttons
        document.querySelectorAll('.footer-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Notify callback
        if (onTabChange) onTabChange(tab);
    }

    /**
     * Get current active tab
     */
    function getCurrentTab() {
        return currentTab;
    }

    return { init, navigateTo, getCurrentTab };
})();
