const CHOICE_KEY = 'snake-id-experience';
const APP_SELECTOR = '.app-shell';
const styles = `
  .experience-gate { min-height: 100vh; display: grid; place-items: center; padding: 28px 18px; background: var(--bg, #f5f0e6); color: var(--text, #1a241d); }
  .experience-gate[hidden] { display: none !important; }
  .experience-inner { width: min(100%, 1040px); }
  .experience-brand { text-align: center; margin: 0 auto 34px; }
  .experience-mark { width: 58px; height: 58px; margin: 0 auto 14px; display:grid; place-items:center; border-radius: 18px; background: #1c3e2d; color: #fff; font-size: 30px; }
  .experience-brand p { color: #526457; margin: 0 0 8px; text-transform: uppercase; letter-spacing: .12em; font-size: .75rem; font-weight: 700; }
  .experience-brand h1 { margin: 0; color: #1c3e2d; font-size: clamp(2rem, 5vw, 3.25rem); }
  .experience-brand .experience-intro { margin: 12px auto 0; max-width: 620px; color: #526457; line-height: 1.65; text-transform: none; letter-spacing: normal; font-size: 1rem; font-weight: 400; }
  .experience-options { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
  .experience-card { display:flex; flex-direction:column; align-items:flex-start; min-height: 300px; padding: clamp(22px, 4vw, 34px); text-align:left; border: 1px solid rgba(28,62,45,.15); border-radius: 24px; background:#fff; box-shadow:0 16px 38px rgba(22,35,28,.09); }
  .experience-card h2 { margin: 18px 0 8px; color:#1c3e2d; font-size:1.55rem; }
  .experience-card p { color:#526457; line-height:1.65; margin:0 0 20px; }
  .experience-icon { width:50px; height:50px; display:grid; place-items:center; border-radius:15px; background:#edf5ee; color:#1c3e2d; font-size:24px; }
  .experience-action { margin-top:auto; width:100%; min-height:48px; display:grid; place-items:center; border:0; border-radius:999px; background:#1c3e2d; color:#fff; font:inherit; font-weight:700; text-decoration:none; }
  .experience-action:hover { background:#123026; }
  .experience-action:focus-visible, .experience-return:focus-visible { outline:3px solid #d9a441; outline-offset:3px; }
  .experience-coming { background:#f4f1e9; color:#47584c; border:1px solid rgba(28,62,45,.12); cursor:default; }
  .experience-coming:hover { background:#f4f1e9; }
  .experience-footnote { margin:22px 0 0; color:#526457; font-size:.88rem; text-align:center; }
  .experience-return { margin:18px 0 0; padding:10px 14px; border:1px solid var(--border); border-radius:999px; background:var(--surface-soft); color:var(--text); font:inherit; font-weight:600; }
  @media (max-width:680px) { .experience-options { grid-template-columns:1fr; } .experience-card { min-height:260px; } .experience-brand { margin-bottom:24px; } }
  @media (prefers-reduced-motion: reduce) { .experience-gate *, .experience-gate *::before, .experience-gate *::after { scroll-behavior:auto !important; transition:none !important; } }
`;

function safelyGetChoice() {
  try {
    const choice = localStorage.getItem(CHOICE_KEY);
    return choice === 'web' ? choice : null;
  } catch {
    return null;
  }
}

function safelySaveChoice(choice) {
  try {
    localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // The chooser still works for this visit if storage is disabled.
  }
}

function showApplication() {
  gate.hidden = true;
  application.hidden = false;
  document.querySelectorAll('.section').forEach((section) => section.classList.remove('active-section'));
  document.querySelector('#home')?.classList.add('active-section');
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.target === 'home'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function showChooser() {
  application.hidden = true;
  gate.hidden = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

const application = document.querySelector(APP_SELECTOR);
if (!application) throw new Error('Snake app shell is missing; experience selection cannot start.');

const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.append(styleElement);

const gate = document.createElement('main');
gate.className = 'experience-gate';
gate.setAttribute('aria-labelledby', 'experience-title');
gate.innerHTML = `
  <div class="experience-inner">
    <header class="experience-brand">
      <div class="experience-mark" aria-hidden="true">🐍</div>
      <p>Wildlife education</p>
      <h1 id="experience-title">Choose Your Experience</h1>
      <p class="experience-intro">Choose how you would like to explore verified snake information and wildlife safety resources.</p>
    </header>
    <div class="experience-options">
      <article class="experience-card">
        <div class="experience-icon" aria-hidden="true">↗</div>
        <h2>Use on Web</h2>
        <p>Open the complete web application directly in your browser. No installation required.</p>
        <button class="experience-action" type="button" data-experience-web>Open Web App</button>
      </article>
      <article class="experience-card">
        <div class="experience-icon" aria-hidden="true">↓</div>
        <h2>Download App</h2>
        <p>For Android users. The official APK will be linked here after it is genuinely built and published.</p>
        <button class="experience-action experience-coming" type="button" disabled aria-disabled="true">Android app coming soon</button>
      </article>
    </div>
    <p class="experience-footnote">The Android APK is not currently published. No download link is available.</p>
  </div>`;
document.body.prepend(gate);

const returnButton = document.createElement('button');
returnButton.type = 'button';
returnButton.className = 'experience-return';
returnButton.textContent = 'Change experience';
returnButton.addEventListener('click', showChooser);
document.querySelector('.settings-panel')?.append(returnButton);

gate.querySelector('[data-experience-web]')?.addEventListener('click', () => {
  safelySaveChoice('web');
  showApplication();
});

if (safelyGetChoice() === 'web') {
  gate.hidden = true;
} else {
  application.hidden = true;
}
