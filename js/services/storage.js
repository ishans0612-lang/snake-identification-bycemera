const THEME_KEY = 'snake-id-theme';
const FAVORITES_KEY = 'snake-id-favorites';
const RECENT_KEY = 'snake-id-recent';

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore localStorage write failures in restricted browser environments.
  }
}

export const storage = {
  getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  },

  getFavorites() {
    return readJSON(FAVORITES_KEY, []);
  },

  addFavorite(id) {
    const list = new Set(this.getFavorites());
    list.add(id);
    writeJSON(FAVORITES_KEY, [...list]);
  },

  removeFavorite(id) {
    const list = this.getFavorites().filter((item) => item !== id);
    writeJSON(FAVORITES_KEY, list);
  },

  getRecent() {
    return readJSON(RECENT_KEY, []);
  },

  addRecent(id) {
    const list = [id, ...this.getRecent().filter((item) => item !== id)];
    writeJSON(RECENT_KEY, list.slice(0, 8));
  },

  clearLocalData() {
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(RECENT_KEY);
  }
};
