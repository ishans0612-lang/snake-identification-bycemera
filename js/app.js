import { SAMPLE_SPECIES } from '../data/species.js';
import { storage } from '../services/storage.js';
import { SnakeIdentificationService } from '../services/identification.js';

const speciesService = new SnakeIdentificationService();
const state = {
  selectedFilter: 'all',
  searchQuery: '',
  selectedCountry: 'India'
};

const els = {
  networkStatus: document.querySelector('#network-status'),
  themeToggle: document.querySelector('#theme-toggle'),
  menuToggle: document.querySelector('#menu-toggle'),
  mobileNav: document.querySelector('#mobile-nav'),
  speciesGrid: document.querySelector('#species-grid'),
  searchInput: document.querySelector('#search-input'),
  searchFilter: document.querySelector('#search-filter'),
  searchResults: document.querySelector('#search-results'),
  compareSelect1: document.querySelector('#compare-select-1'),
  compareSelect2: document.querySelector('#compare-select-2'),
  compareResults: document.querySelector('#compare-results'),
  favoritesList: document.querySelector('#favorites-list'),
  recentList: document.querySelector('#recent-list'),
  emergencyList: document.querySelector('#emergency-list'),
  countrySelect: document.querySelector('#country-select'),
  offlineStatusLabel: document.querySelector('#offline-status-label'),
  themeSelect: document.querySelector('#theme-select'),
  clearDataButton: document.querySelector('#clear-data'),
  imageInput: document.querySelector('#image-input'),
  chooseImage: document.querySelector('#choose-image'),
  cameraTrigger: document.querySelector('#camera-trigger'),
  analyzeImage: document.querySelector('#analyze-image'),
  retakeImage: document.querySelector('#retake-image'),
  imagePreviewBox: document.querySelector('#image-preview-box'),
  identificationStatus: document.querySelector('#identification-status'),
  matchList: document.querySelector('#match-list')
};

function applyTheme(theme) {
  const resolved = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = resolved;
  storage.setTheme(resolved);
  els.themeToggle.textContent = resolved === 'dark' ? '🌙' : '☀️';
  els.themeSelect.value = resolved;
}

function setNetworkStatus() {
  const isOnline = navigator.onLine;
  els.networkStatus.textContent = isOnline ? 'Online' : 'Offline';
  els.networkStatus.style.color = isOnline ? 'var(--success)' : 'var(--danger)';
  els.offlineStatusLabel.textContent = isOnline ? 'Available online' : 'Offline mode';
}

function getFilteredSpecies() {
  const query = state.searchQuery.trim().toLowerCase();
  return SAMPLE_SPECIES.filter((species) => {
    const matchesFilter =
      state.selectedFilter === 'all'
        ? true
        : state.selectedFilter === 'venomous'
          ? species.venom === 'Venomous'
          : state.selectedFilter === 'non-venomous'
            ? species.venom === 'Non-venomous'
            : state.selectedFilter === 'india'
              ? species.region.toLowerCase().includes('india')
              : true;

    const matchesQuery =
      !query ||
      [
        species.commonName,
        species.scientificName,
        species.family,
        species.region,
        species.habitat
      ].join(' ').toLowerCase().includes(query);

    return matchesFilter && matchesQuery;
  });
}

function renderSpeciesCards() {
  const species = [...getFilteredSpecies()].sort((a, b) => a.commonName.localeCompare(b.commonName));

  els.speciesGrid.innerHTML = species
    .map(
      (item) => `
        <article class="species-card">
          <div class="species-visual" aria-hidden="true">🐍</div>
          <div class="species-body">
            <h3>${item.commonName}</h3>
            <div class="species-meta">
              <span>${item.scientificName}</span>
              <span>${item.family}</span>
            </div>
            <div class="species-tags">
              <span class="tag">${item.venom}</span>
              <span class="tag">${item.region}</span>
            </div>
            <p class="muted">${item.habitat}</p>
            <div class="row-actions">
              <button class="secondary-button" type="button" data-species-view="${item.id}">View profile</button>
              <button class="ghost-button" type="button" data-species-favorite="${item.id}">Favorite</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  const favoriteButtons = document.querySelectorAll('[data-species-favorite]');
  favoriteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.speciesFavorite;
      const existing = storage.getFavorites();
      if (existing.includes(id)) {
        storage.removeFavorite(id);
        button.textContent = 'Favorite';
      } else {
        storage.addFavorite(id);
        button.textContent = 'Saved';
      }
      renderFavorites();
    });
  });

  const viewButtons = document.querySelectorAll('[data-species-view]');
  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.speciesView;
      const target = SAMPLE_SPECIES.find((species) => species.id === id);
      if (!target) return;
      storage.addRecent(id);
      renderRecentHistory();
      els.searchInput.value = target.commonName;
      state.searchQuery = target.commonName;
      renderSearchResults();
      document.querySelector('#search')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderSearchResults() {
  const query = state.searchQuery.trim();
  const species = query
    ? SAMPLE_SPECIES.filter((item) =>
        [item.commonName, item.scientificName, item.family, item.region].join(' ').toLowerCase().includes(query.toLowerCase())
      )
    : SAMPLE_SPECIES.slice(0, 4);

  els.searchResults.innerHTML = species
    .map(
      (item) => `
        <div class="search-result-card">
          <strong>${item.commonName}</strong>
          <span class="muted">${item.scientificName}</span>
          <span>${item.venom} • ${item.region}</span>
          <button class="secondary-button" type="button" data-search-view="${item.id}">Open profile</button>
        </div>
      `
    )
    .join('');

  document.querySelectorAll('[data-search-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.searchView;
      const species = SAMPLE_SPECIES.find((item) => item.id === id);
      if (!species) return;
      storage.addRecent(id);
      renderRecentHistory();
      document.querySelector('#snake-database')?.scrollIntoView({ behavior: 'smooth' });
      state.searchQuery = species.commonName;
      renderSpeciesCards();
    });
  });
}

function populateCompareSelects() {
  const options = SAMPLE_SPECIES.map(
    (species) => `<option value="${species.id}">${species.commonName}</option>`
  ).join('');

  els.compareSelect1.innerHTML = options;
  els.compareSelect2.innerHTML = options;
  els.compareSelect1.value = SAMPLE_SPECIES[0].id;
  els.compareSelect2.value = SAMPLE_SPECIES[1].id;
  renderComparison();
}

function renderComparison() {
  const firstId = els.compareSelect1.value;
  const secondId = els.compareSelect2.value;
  const firstSpecies = SAMPLE_SPECIES.find((species) => species.id === firstId) || SAMPLE_SPECIES[0];
  const secondSpecies = SAMPLE_SPECIES.find((species) => species.id === secondId) || SAMPLE_SPECIES[1];

  const rows = [
    ['Common name', firstSpecies.commonName, secondSpecies.commonName],
    ['Scientific name', firstSpecies.scientificName, secondSpecies.scientificName],
    ['Family', firstSpecies.family, secondSpecies.family],
    ['Habitat', firstSpecies.habitat, secondSpecies.habitat],
    ['Region', firstSpecies.region, secondSpecies.region],
    ['Venom', firstSpecies.venom, secondSpecies.venom],
    ['Conservation', firstSpecies.conservation, secondSpecies.conservation]
  ];

  els.compareResults.innerHTML = rows
    .map(
      ([label, left, right]) => `
        <div class="compare-card">
          <strong>${label}</strong>
          <div><span class="muted">A:</span> ${left}</div>
          <div><span class="muted">B:</span> ${right}</div>
        </div>
      `
    )
    .join('');
}

function renderFavorites() {
  const favoriteIds = storage.getFavorites();
  const favorites = SAMPLE_SPECIES.filter((species) => favoriteIds.includes(species.id));

  els.favoritesList.innerHTML = favorites.length
    ? favorites
        .map(
          (species) => `
            <div class="list-entry">
              <strong>${species.commonName}</strong>
              <span class="muted">${species.scientificName}</span>
            </div>
          `
        )
        .join('')
    : '<p class="muted">No favorites yet.</p>';
}

function renderRecentHistory() {
  const recentIds = storage.getRecent();
  const recent = SAMPLE_SPECIES.filter((species) => recentIds.includes(species.id));

  els.recentList.innerHTML = recent.length
    ? recent
        .map(
          (species) => `
            <div class="list-entry">
              <strong>${species.commonName}</strong>
              <span class="muted">${species.scientificName}</span>
            </div>
          `
        )
        .join('')
    : '<p class="muted">No recent activity yet.</p>';
}

function renderEmergencyNumbers() {
  const data = {
    India: [
      { name: 'National emergency response', number: '112', description: 'Emergency number for ambulance, police, fire and emergency support in India.' },
      { name: 'Medical emergency support', number: '108', description: 'Ambulance service used in India.' }
    ],
    'United States': [
      { name: 'Emergency', number: '911', description: 'Official emergency number for the United States.' }
    ],
    'United Kingdom': [
      { name: 'Emergency', number: '999', description: 'Emergency contact number in the United Kingdom.' }
    ]
  };

  const country = state.selectedCountry;
  const entries = data[country] || data.India;

  els.emergencyList.innerHTML = entries
    .map(
      (entry) => `
        <div class="emergency-item">
          <strong>${entry.name}</strong>
          <a href="tel:${entry.number}">${entry.number}</a>
          <span class="muted">${entry.description}</span>
        </div>
      `
    )
    .join('');
}

function showImagePreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const result = event.target?.result;
    els.imagePreviewBox.innerHTML = `<img src="${result}" alt="Selected snake preview" />`;
  };
  reader.readAsDataURL(file);
}

async function runIdentification() {
  const file = els.imageInput.files?.[0];
  if (!file) {
    els.identificationStatus.textContent = 'Please choose an image before attempting analysis.';
    els.identificationStatus.className = 'alert-box warning';
    return;
  }

  const result = await speciesService.analyzeImage(file);
  els.identificationStatus.textContent = result.message || 'Identification unavailable.';
  els.identificationStatus.className = `alert-box ${result.status === 'error' ? 'warning' : 'warning'}`;

  if (result.matches && result.matches.length > 0) {
    els.matchList.innerHTML = result.matches
      .slice(0, 5)
      .map(
        (match) => `
          <div class="search-result-card">
            <strong>${match.commonName}</strong>
            <span class="muted">${match.scientificName}</span>
            ${match.confidence ? `<span>Confidence: ${match.confidence}</span>` : ''}
            <span>${match.description}</span>
          </div>
        `
      )
      .join('');
  } else {
    els.matchList.innerHTML = '<p class="muted">No AI results available yet.</p>';
  }
}

function bindNavigation() {
  document.querySelectorAll('[data-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) return;

      document.querySelectorAll('.section').forEach((section) => section.classList.remove('active-section'));
      document.querySelectorAll('.nav-link').forEach((nav) => nav.classList.remove('active'));
      target.classList.add('active-section');

      if (button.classList.contains('nav-link')) {
        button.classList.add('active');
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function bindControls() {
  els.themeToggle.addEventListener('click', () => {
    const nextMode = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextMode);
  });

  els.themeSelect.addEventListener('change', (event) => {
    applyTheme(event.target.value);
  });

  els.menuToggle.addEventListener('click', () => {
    els.mobileNav.classList.toggle('open');
  });

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      state.selectedFilter = chip.dataset.filter;
      renderSpeciesCards();
    });
  });

  els.searchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    renderSearchResults();
    renderSpeciesCards();
  });

  els.countrySelect.addEventListener('change', (event) => {
    state.selectedCountry = event.target.value;
    renderEmergencyNumbers();
  });

  els.chooseImage.addEventListener('click', () => els.imageInput.click());
  els.cameraTrigger.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      els.identificationStatus.textContent = 'Camera access is unavailable in this browser environment.';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      els.identificationStatus.textContent = 'Camera access granted. Please select an image after capturing a photo.';
    } catch (error) {
      els.identificationStatus.textContent = 'Camera access was denied. Please use the upload option instead.';
    }
  });

  els.imageInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    showImagePreview(file);
  });

  els.analyzeImage.addEventListener('click', runIdentification);
  els.retakeImage.addEventListener('click', () => {
    els.imageInput.value = '';
    els.imagePreviewBox.innerHTML = '<span>No image selected</span>';
    els.matchList.innerHTML = '<p class="muted">No AI results available yet.</p>';
  });

  els.clearDataButton.addEventListener('click', () => {
    storage.clearLocalData();
    renderFavorites();
    renderRecentHistory();
    els.identificationStatus.textContent = 'Local app data has been cleared.';
  });

  els.searchFilter.addEventListener('change', (event) => {
    const value = event.target.value;
    if (value === 'all') {
      state.searchQuery = els.searchInput.value;
      renderSearchResults();
      return;
    }

    state.searchQuery = value === 'venomous' ? 'venomous' : 'snake';
    renderSearchResults();
  });

  els.compareSelect1.addEventListener('change', renderComparison);
  els.compareSelect2.addEventListener('change', renderComparison);

  window.addEventListener('online', setNetworkStatus);
  window.addEventListener('offline', setNetworkStatus);
}

function initialize() {
  const savedTheme = storage.getTheme();
  applyTheme(savedTheme || 'light');
  setNetworkStatus();
  bindNavigation();
  bindControls();
  populateCompareSelects();
  renderSpeciesCards();
  renderSearchResults();
  renderFavorites();
  renderRecentHistory();
  renderEmergencyNumbers();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // Ignore registration failures in unsupported browsers.
    });
  }
}

initialize();
