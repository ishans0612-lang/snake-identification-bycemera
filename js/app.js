import { SAMPLE_SPECIES } from './data/species.js';
import { storage } from './services/storage.js';
import { SnakeIdentificationService } from './services/identification.js';
import { findLicensedSpeciesPhoto } from './services/commons.js';

const identificationService = new SnakeIdentificationService();
const state = { selectedFilter: 'all', searchQuery: '', searchCategory: 'all', selectedCountry: 'India' };
const el = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function showSection(id) {
  const destination = document.getElementById(id);
  if (!destination) return;
  document.querySelectorAll('.section').forEach((section) => section.classList.toggle('active-section', section === destination));
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.target === id));
  el('#mobile-nav')?.classList.remove('open');
  destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function applyTheme(theme) {
  const selected = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = selected;
  storage.setTheme(selected);
  const themeToggle = el('#theme-toggle');
  if (themeToggle) themeToggle.textContent = selected === 'dark' ? '🌙' : '☀️';
  const themeSelect = el('#theme-select');
  if (themeSelect) themeSelect.value = selected;
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  const status = el('#network-status');
  if (status) {
    status.textContent = online ? 'Online' : 'Offline';
    status.style.color = online ? 'var(--success)' : 'var(--danger)';
  }
  const label = el('#offline-status-label');
  if (label) label.textContent = online ? 'App shell available; external photos require internet' : 'Offline; external photos unavailable';
}

function matchesSearchCategory(species) {
  if (state.searchCategory === 'venomous') return species.venom === 'Venomous';
  if (state.searchCategory === 'non-venomous') return species.venom === 'Non-venomous';
  if (state.searchCategory === 'india') return species.region?.toLowerCase().includes('india');
  return true;
}

function searchSpecies(query = state.searchQuery, category = state.searchCategory) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return SAMPLE_SPECIES.filter((species) => {
    if (!matchesSearchCategory(species)) return false;
    const haystack = normalizeSearch([
      species.commonName, species.scientificName, species.family, species.genus,
      species.region, species.habitat, species.description
    ].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}

function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function imagePlaceholder(text = 'No verified photo available') {
  return `<div class="species-visual photo-placeholder" role="img" aria-label="${escapeHTML(text)}"><span aria-hidden="true">♧</span><small>${escapeHTML(text)}</small></div>`;
}

async function populateLicensedPhoto(container, species, { hero = false } = {}) {
  if (!container) return;
  const photo = await findLicensedSpeciesPhoto(species);
  if (!photo) {
    container.innerHTML = imagePlaceholder('No matching licensed photo found');
    return;
  }
  const figure = document.createElement('figure');
  figure.className = hero ? 'hero-photo' : 'species-visual photo-figure';
  const image = document.createElement('img');
  image.src = photo.url;
  image.alt = `${species.commonName} (${species.scientificName}) — Wikimedia Commons image`;
  image.loading = 'lazy';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => {
    figure.replaceWith(Object.assign(document.createElement('div'), {
      className: hero ? 'hero-photo photo-placeholder' : 'species-visual photo-placeholder',
      textContent: 'Photo unavailable'
    }));
  }, { once: true });
  const caption = document.createElement('figcaption');
  const link = document.createElement('a');
  link.href = photo.sourceUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = `Wikimedia Commons · ${photo.license}`;
  caption.append(link);
  if (photo.attribution) caption.append(document.createTextNode(` · ${stripTags(photo.artist)}`));
  figure.append(image, caption);
  container.replaceChildren(figure);
}

function stripTags(value) {
  const temp = document.createElement('div');
  temp.innerHTML = String(value || '');
  return temp.textContent || '';
}

function openSpeciesProfile(id) {
  const species = SAMPLE_SPECIES.find((item) => item.id === id);
  if (!species) return;
  storage.addRecent(id);
  renderRecent();
  const dialog = el('#species-dialog');
  const body = el('#species-dialog-body');
  if (!dialog || !body) return;
  body.innerHTML = `<h2>${escapeHTML(species.commonName)}</h2><p><em>${escapeHTML(species.scientificName)}</em> · ${escapeHTML(species.family)}</p><p><strong>Venom information:</strong> ${escapeHTML(species.venom || 'Unknown')}</p><p><strong>Region:</strong> ${escapeHTML(species.region || 'Insufficient data')}</p><p><strong>Habitat:</strong> ${escapeHTML(species.habitat || 'Insufficient data')}</p><p>${escapeHTML(species.description || 'No description available.')}</p><p><strong>Conservation:</strong> ${escapeHTML(species.conservation || 'Not available')}</p><p class="muted">Data source names in this initial catalog have not yet been individually validated; do not use this profile for medical identification.</p><div class="profile-photo" id="profile-photo">${imagePlaceholder()}</div>`;
  const photoTarget = el('#profile-photo');
  populateLicensedPhoto(photoTarget, species);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function renderSpecies() {
  const query = state.searchQuery;
  const category = state.searchCategory;
  let records = searchSpecies(query, category);
  if (state.selectedFilter === 'venomous' || state.selectedFilter === 'non-venomous') {
    records = records.filter((species) => species.venom.toLowerCase() === state.selectedFilter);
  } else if (state.selectedFilter === 'india') {
    records = records.filter((species) => species.region?.toLowerCase().includes('india'));
  }
  const grid = el('#species-grid');
  if (!grid) return;
  grid.innerHTML = records.length ? records.map((species) => `
    <article class="species-card" data-card-id="${escapeHTML(species.id)}">
      <div class="species-photo-slot">${imagePlaceholder()}</div>
      <div class="species-body"><h3>${escapeHTML(species.commonName)}</h3>
        <div class="species-meta"><span><em>${escapeHTML(species.scientificName)}</em></span><span>${escapeHTML(species.family)}</span></div>
        <div class="species-tags"><span class="tag">${escapeHTML(species.venom || 'Unknown')}</span><span class="tag">${escapeHTML(species.region || 'Distribution unknown')}</span></div>
        <p class="muted">${escapeHTML(species.habitat || 'Habitat data unavailable')}</p>
        <div class="row-actions"><button class="secondary-button" type="button" data-profile="${escapeHTML(species.id)}">View profile</button><button class="ghost-button" type="button" data-favorite="${escapeHTML(species.id)}">${storage.getFavorites().includes(species.id) ? 'Remove favorite' : 'Add favorite'}</button></div>
      </div>
    </article>`).join('') : '<p class="muted">No matching records in the currently available catalog.</p>';
  grid.querySelectorAll('[data-card-id]').forEach((card) => {
    const species = SAMPLE_SPECIES.find((item) => item.id === card.dataset.cardId);
    if (species) populateLicensedPhoto(card.querySelector('.species-photo-slot'), species);
  });
}

function renderSearchResults() {
  const results = searchSpecies();
  const target = el('#search-results');
  if (!target) return;
  target.innerHTML = results.length ? results.map((species) => `
    <article class="search-result-card"><strong>${escapeHTML(species.commonName)}</strong><span class="muted"><em>${escapeHTML(species.scientificName)}</em></span><span>${escapeHTML(species.family)} · ${escapeHTML(species.venom || 'Unknown venom status')} · ${escapeHTML(species.region || 'Distribution unknown')}</span><button class="secondary-button" type="button" data-profile="${escapeHTML(species.id)}">Open profile</button></article>`).join('') : '<p class="muted">No matching records in the currently available catalog.</p>';
}

function renderCompareOptions() {
  const options = SAMPLE_SPECIES.map((species) => `<option value="${escapeHTML(species.id)}">${escapeHTML(species.commonName)}</option>`).join('');
  ['#compare-select-1', '#compare-select-2'].forEach((selector) => { const select = el(selector); if (select) select.innerHTML = options; });
  const first = el('#compare-select-1'); const second = el('#compare-select-2');
  if (first && SAMPLE_SPECIES[0]) first.value = SAMPLE_SPECIES[0].id;
  if (second && SAMPLE_SPECIES[1]) second.value = SAMPLE_SPECIES[1].id;
  renderComparison();
}

function renderComparison() {
  const first = SAMPLE_SPECIES.find((item) => item.id === el('#compare-select-1')?.value);
  const second = SAMPLE_SPECIES.find((item) => item.id === el('#compare-select-2')?.value);
  const target = el('#compare-results');
  if (!target) return;
  if (!first || !second) { target.textContent = 'Select two available species to compare.'; return; }
  target.innerHTML = [['Common name','commonName'],['Scientific name','scientificName'],['Family','family'],['Habitat','habitat'],['Region','region'],['Venom information','venom'],['Conservation','conservation']].map(([label,key]) => `<div class="compare-card"><strong>${label}</strong><div><span class="muted">${escapeHTML(first.commonName)}:</span> ${escapeHTML(first[key] || 'Not available')}</div><div><span class="muted">${escapeHTML(second.commonName)}:</span> ${escapeHTML(second[key] || 'Not available')}</div></div>`).join('');
}

function renderFavorites() {
  const target = el('#favorites-list');
  if (!target) return;
  const items = SAMPLE_SPECIES.filter((species) => storage.getFavorites().includes(species.id));
  target.innerHTML = items.length ? items.map((species) => `<div class="list-entry"><strong>${escapeHTML(species.commonName)}</strong><span class="muted"><em>${escapeHTML(species.scientificName)}</em></span><div class="row-actions"><button class="secondary-button" type="button" data-profile="${escapeHTML(species.id)}">Open profile</button><button class="ghost-button" type="button" data-remove-favorite="${escapeHTML(species.id)}">Remove</button></div></div>`).join('') : '<p class="muted">No favorites yet. Add one from a species card.</p>';
}

function renderRecent() {
  const target = el('#recent-list');
  if (!target) return;
  const items = storage.getRecent().map((id) => SAMPLE_SPECIES.find((item) => item.id === id)).filter(Boolean);
  target.innerHTML = items.length ? items.map((species) => `<div class="list-entry"><strong>${escapeHTML(species.commonName)}</strong><span class="muted"><em>${escapeHTML(species.scientificName)}</em></span><button class="secondary-button" type="button" data-profile="${escapeHTML(species.id)}">Open profile</button></div>`).join('') : '<p class="muted">No recently viewed species.</p>';
}

function renderEmergencyNumbers() {
  const records = {
    India: [{ name: 'National Emergency Response Support System', number: '112', detail: 'India’s pan-India emergency response number.' }],
    'United States': [{ name: 'General emergency number', number: '911', detail: 'General emergency number. Local ambulance arrangements may vary.' }],
    'United Kingdom': [{ name: 'General emergency number', number: '999', detail: 'General emergency number; 112 also works.' }]
  };
  const country = state.selectedCountry;
  const target = el('#emergency-list');
  if (!target) return;
  const entries = records[country];
  target.innerHTML = entries ? entries.map((item) => `<div class="emergency-item"><strong>${escapeHTML(item.name)}</strong><a href="tel:${item.number}">${item.number}</a><span>${escapeHTML(item.detail)}</span><small>Verify local availability with official authorities; this limited sample is not a worldwide directory.</small></div>`).join('') : '<p>Emergency number not verified. Contact your local emergency service or nearest hospital.</p>';
}

function setLanguage(value) {
  const select = el('#language-select');
  if (value !== 'en') {
    if (select) select.value = 'en';
    return;
  }
  storage.setLanguage('en');
  document.documentElement.lang = 'en';
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const targetButton = event.target.closest('[data-target]');
    if (targetButton) { showSection(targetButton.dataset.target); return; }
    const profileButton = event.target.closest('[data-profile]');
    if (profileButton) { openSpeciesProfile(profileButton.dataset.profile); return; }
    const favoriteButton = event.target.closest('[data-favorite]');
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      if (storage.getFavorites().includes(id)) storage.removeFavorite(id); else storage.addFavorite(id);
      renderSpecies(); renderFavorites(); return;
    }
    const removeButton = event.target.closest('[data-remove-favorite]');
    if (removeButton) { storage.removeFavorite(removeButton.dataset.removeFavorite); renderFavorites(); renderSpecies(); }
  });
  el('#theme-toggle')?.addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
  el('#theme-select')?.addEventListener('change', (event) => applyTheme(event.target.value));
  el('#language-select')?.addEventListener('change', (event) => setLanguage(event.target.value));
  el('#menu-toggle')?.addEventListener('click', () => {
    const nav = el('#mobile-nav');
    const opened = nav?.classList.toggle('open');
    el('#menu-toggle')?.setAttribute('aria-expanded', String(Boolean(opened)));
  });
  document.querySelectorAll('.filter-chip').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.remove('active'));
    button.classList.add('active'); state.selectedFilter = button.dataset.filter || 'all'; renderSpecies();
  }));
  el('#search-input')?.addEventListener('input', (event) => { state.searchQuery = event.target.value; renderSearchResults(); renderSpecies(); });
  el('#search-filter')?.addEventListener('change', (event) => { state.searchCategory = event.target.value; renderSearchResults(); renderSpecies(); });
  el('#country-select')?.addEventListener('change', (event) => { state.selectedCountry = event.target.value; renderEmergencyNumbers(); });
  el('#compare-select-1')?.addEventListener('change', renderComparison);
  el('#compare-select-2')?.addEventListener('change', renderComparison);
  el('#species-dialog-close')?.addEventListener('click', () => el('#species-dialog')?.close());
  el('#species-dialog')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  el('#choose-image')?.addEventListener('click', () => el('#image-input')?.click());
  el('#camera-trigger')?.addEventListener('click', () => {
    const input = el('#image-input');
    if (input) { input.setAttribute('capture', 'environment'); input.click(); }
  });
  el('#image-input')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { el('#identification-status').textContent = 'Please select an image file.'; return; }
    const reader = new FileReader(); reader.onload = () => { const image = document.createElement('img'); image.src = reader.result; image.alt = 'Selected image preview'; el('#image-preview-box').replaceChildren(image); }; reader.readAsDataURL(file);
  });
  el('#retake-image')?.addEventListener('click', () => { const input = el('#image-input'); if (input) { input.value = ''; input.removeAttribute('capture'); } el('#image-preview-box').innerHTML = '<span>No image selected</span>'; el('#match-list').innerHTML = '<p class="muted">No AI results available yet.</p>'; });
  el('#analyze-image')?.addEventListener('click', async () => {
    const file = el('#image-input')?.files?.[0];
    const status = el('#identification-status');
    if (!file) { status.textContent = 'Please choose an image before attempting analysis.'; return; }
    const result = await identificationService.analyzeImage(file);
    status.textContent = result.message;
    el('#match-list').textContent = 'Automated identification is not available yet. No species result was generated.';
  });
  el('#clear-data')?.addEventListener('click', () => { storage.clearLocalData(); window.location.reload(); });
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
}

function addHeroPhoto() {
  const species = SAMPLE_SPECIES.find((item) => item.scientificName === 'Naja naja');
  const heroCopy = document.querySelector('.hero-copy');
  if (!species || !heroCopy) return;
  const slot = document.createElement('div');
  slot.className = 'hero-photo-slot';
  slot.innerHTML = imagePlaceholder('Loading verified Commons photo');
  heroCopy.prepend(slot);
  populateLicensedPhoto(slot, species, { hero: true });
}

function initialize() {
  applyTheme(storage.getTheme());
  const language = el('#language-select');
  if (language) language.value = storage.getLanguage() === 'en' ? 'en' : 'en';
  setLanguage('en');
  updateNetworkStatus();
  bindEvents();
  renderCompareOptions(); renderSpecies(); renderSearchResults(); renderFavorites(); renderRecent(); renderEmergencyNumbers(); addHeroPhoto();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Service worker registration failed:', error));
}

initialize();
