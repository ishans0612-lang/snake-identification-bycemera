const THEME_KEY = 'snake-id-theme';
const FAVORITES_KEY = 'snake-id-favorites';
const RECENT_KEY = 'snake-id-recent';
const LANGUAGE_KEY = 'snake-id-language';

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be disabled or full; app functionality should still be usable for this visit.
  }
}

export const storage = {
  getTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; }
  },
  setTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Optional preference. */ }
  },
  getLanguage() {
    try { return localStorage.getItem(LANGUAGE_KEY) || 'en'; } catch { return 'en'; }
  },
  setLanguage(language) {
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Optional preference. */ }
  },
  getFavorites() {
    const items = readJSON(FAVORITES_KEY, []);
    return Array.isArray(items) ? items : [];
  },
  addFavorite(id) {
    const list = new Set(this.getFavorites());
    list.add(id);
    writeJSON(FAVORITES_KEY, [...list]);
  },
  removeFavorite(id) {
    writeJSON(FAVORITES_KEY, this.getFavorites().filter((item) => item !== id));
  },
  getRecent() {
    const items = readJSON(RECENT_KEY, []);
    return Array.isArray(items) ? items : [];
  },
  addRecent(id) {
    const list = [id, ...this.getRecent().filter((item) => item !== id)];
    writeJSON(RECENT_KEY, list.slice(0, 8));
  },
  clearLocalData() {
    [THEME_KEY, FAVORITES_KEY, RECENT_KEY, LANGUAGE_KEY, 'snake-id-experience'].forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* Optional storage. */ }
    });
  }
};
