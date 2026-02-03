import { getFilteredWords } from './words.js';
import { getSentencesByDifficulty } from './sentences.js';
import { hyphenateWord } from './hyphenation.js';
import './style.css';

// --- Language configuration ---
const LANGUAGES = [
  { id: 'en', key: 'translation', flag: '/images/flag_uk.jpg', ttsLang: 'en-US' },
  { id: 'es', key: 'translation_es', flag: '/images/flag_es.jpg', ttsLang: 'es-ES' },
  { id: 'sv', key: 'translation_sv', flag: '/images/flag_se.jpg', ttsLang: 'sv-SE' },
];

// --- Session state ---
let shownItems = new Set();
let uniqueCount = 0;
let currentItem = null;
let difficulty = null;
let hyphenationOn = false;
let uppercaseOn = true;
let mode = 'words'; // 'words' or 'sentences'
let activeCategories = new Set(['noun', 'verb', 'adjective']);
let availableItems = [];
let activeLangs = new Set(['en', 'es', 'sv']);
let history = []; // Array of items for navigation
let historyIndex = -1; // Current position in history

// --- DOM elements ---
const startScreen = document.getElementById('start-screen');
const wordScreen = document.getElementById('word-screen');
const doneScreen = document.getElementById('done-screen');
const toolbarCounter = document.getElementById('toolbar-counter');
const toolbar = document.getElementById('toolbar');
const currentWordEl = document.getElementById('current-word');
const translationsEl = document.getElementById('translations');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const backBtn = document.getElementById('back-btn');
const restartBtn = document.getElementById('restart-btn');
const hyphenationToggle = document.getElementById('hyphenation-toggle');
const uppercaseToggle = document.getElementById('uppercase-toggle');
const categoryFilters = document.getElementById('category-filters');
const filterNoun = document.getElementById('filter-noun');
const filterVerb = document.getElementById('filter-verb');
const filterAdjective = document.getElementById('filter-adjective');
const doneSubtitle = document.getElementById('done-subtitle');
const speakBtn = document.getElementById('speak-btn');
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const helpModalClose = document.getElementById('help-modal-close');
const helpModalBackdrop = helpModal.querySelector('.modal-backdrop');
const langToggles = {
  en: document.getElementById('lang-en'),
  es: document.getElementById('lang-es'),
  sv: document.getElementById('lang-sv'),
};

// --- LocalStorage keys ---
const STORAGE_KEY = 'tutor-app-state';

// --- Save state to localStorage ---
function saveState() {
  const state = {
    mode,
    difficulty,
    hyphenationOn,
    uppercaseOn,
    activeCategories: Array.from(activeCategories),
    activeLangs: Array.from(activeLangs),
    shownItems: Array.from(shownItems),
    uniqueCount,
    history: history.map(item => mode === 'words' ? item.word : item.sentence),
    historyIndex,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage might be unavailable
  }
}

// --- Load state from localStorage ---
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const state = JSON.parse(saved);

    // Restore settings
    mode = state.mode || 'words';
    difficulty = state.difficulty || null;
    hyphenationOn = state.hyphenationOn || false;
    uppercaseOn = state.uppercaseOn !== false; // default true
    activeCategories = new Set(state.activeCategories || ['noun', 'verb', 'adjective']);
    activeLangs = new Set(state.activeLangs || ['en', 'es', 'sv']);

    // Apply UI settings
    hyphenationToggle.checked = hyphenationOn;
    uppercaseToggle.checked = uppercaseOn;
    filterNoun.checked = activeCategories.has('noun');
    filterVerb.checked = activeCategories.has('verb');
    filterAdjective.checked = activeCategories.has('adjective');
    langToggles.en.checked = activeLangs.has('en');
    langToggles.es.checked = activeLangs.has('es');
    langToggles.sv.checked = activeLangs.has('sv');

    if (uppercaseOn) {
      document.body.classList.remove('capitalize-mode');
    } else {
      document.body.classList.add('capitalize-mode');
    }

    // Update mode buttons
    document.querySelectorAll('.btn-mode').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // If we have a session in progress, restore it
    if (difficulty && state.historyIndex >= 0) {
      // Get available items
      if (mode === 'words') {
        availableItems = getFilteredWords(difficulty, activeCategories);
      } else {
        availableItems = getSentencesByDifficulty(difficulty);
      }

      // Restore shown items and history
      shownItems = new Set(state.shownItems || []);
      uniqueCount = state.uniqueCount || 0;
      historyIndex = state.historyIndex;

      // Rebuild history from saved keys
      const key = mode === 'words' ? 'word' : 'sentence';
      history = [];
      for (const itemKey of (state.history || [])) {
        const item = availableItems.find(i => i[key] === itemKey);
        if (item) {
          history.push(item);
        }
      }

      // Set current item
      if (history.length > 0 && historyIndex >= 0 && historyIndex < history.length) {
        currentItem = history[historyIndex];
        return true; // Session restored
      }
    }

    return false; // No active session to restore
  } catch (e) {
    return false;
  }
}

// --- Case utility ---
function applyCase(text) {
  if (uppercaseOn) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function applyCaseTranslation(text) {
  if (uppercaseOn) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// --- Sidebar ---
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.remove('hidden');
  // Allow transition to start from opacity 0
  requestAnimationFrame(() => {
    sidebarOverlay.classList.add('open');
  });
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  sidebarOverlay.addEventListener(
    'transitionend',
    () => {
      if (!sidebarOverlay.classList.contains('open')) {
        sidebarOverlay.classList.add('hidden');
      }
    },
    { once: true }
  );
}

// --- Help Modal ---
function openHelpModal() {
  helpModal.classList.remove('hidden');
}

function closeHelpModal() {
  helpModal.classList.add('hidden');
}

// --- Screen management ---
function showScreen(screen) {
  startScreen.classList.add('hidden');
  wordScreen.classList.add('hidden');
  doneScreen.classList.add('hidden');
  screen.classList.remove('hidden');

  // Toolbar is always visible, but counter content changes
  document.body.classList.add('has-toolbar');

  // Update counter based on screen
  if (screen === startScreen) {
    toolbarCounter.textContent = '';
  }

  // Show/hide category filters based on mode
  if (screen === wordScreen || screen === doneScreen) {
    if (mode === 'words') {
      categoryFilters.classList.remove('hidden');
    } else {
      categoryFilters.classList.add('hidden');
    }
  }

  closeSidebar();
}

// --- Pick a random unseen item ---
function pickRandomItem() {
  const key = mode === 'words' ? 'word' : 'sentence';
  const remaining = availableItems.filter((item) => !shownItems.has(item[key]));

  // If all items have been shown, reset and pick again (loop)
  if (remaining.length === 0) {
    shownItems.clear();
    const allItems = [...availableItems];
    if (allItems.length === 0) return null;
    const idx = Math.floor(Math.random() * allItems.length);
    return allItems[idx];
  }

  const idx = Math.floor(Math.random() * remaining.length);
  return remaining[idx];
}

// --- Hyphenate a sentence (split on whitespace, hyphenate each word, handle punctuation) ---
function hyphenateSentence(sentence) {
  return sentence
    .split(/\s+/)
    .map((token) => {
      // Separate trailing punctuation
      const match = token.match(/^(.+?)([.!?,;:]*)$/);
      if (!match) return token;
      const word = match[1];
      const punctuation = match[2];
      return hyphenateWord(word) + punctuation;
    })
    .join(' ');
}

// --- Speak text in a specific language ---
function speakText(text, ttsLang) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = ttsLang;
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}

// --- Render translation rows ---
function renderTranslations() {
  translationsEl.innerHTML = '';
  if (!currentItem) return;

  for (const lang of LANGUAGES) {
    if (!activeLangs.has(lang.id)) continue;
    const text = currentItem[lang.key];
    if (!text) continue;

    const row = document.createElement('div');
    row.className = 'translation-row';

    const flag = document.createElement('img');
    flag.className = 'translation-flag';
    flag.src = lang.flag;
    flag.alt = lang.id.toUpperCase();

    const span = document.createElement('span');
    span.className = 'translation-text';
    span.textContent = applyCaseTranslation(text);

    const speakButton = document.createElement('button');
    speakButton.className = 'translation-speak-btn';
    speakButton.setAttribute('aria-label', 'Kuuntele');
    speakButton.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    speakButton.addEventListener('click', () => speakText(text, lang.ttsLang));

    row.appendChild(flag);
    row.appendChild(span);
    row.appendChild(speakButton);
    translationsEl.appendChild(row);
  }
}

// --- Update counter display ---
function updateCounter() {
  const label = mode === 'words' ? 'Sanoja näytetty' : 'Lauseita näytetty';
  toolbarCounter.textContent = `${label}: ${uniqueCount}`;
}

// --- Display the current item ---
function displayItem() {
  if (!currentItem) return;

  // Reset any previous font size override
  currentWordEl.style.fontSize = '';

  if (mode === 'words') {
    const rawText = hyphenationOn
      ? hyphenateWord(currentItem.word)
      : currentItem.word;
    currentWordEl.textContent = applyCase(rawText);
    currentWordEl.classList.remove('sentence-text');
    currentWordEl.classList.toggle('word-nowrap', !hyphenationOn);
  } else {
    const rawText = hyphenationOn
      ? hyphenateSentence(currentItem.sentence)
      : currentItem.sentence;
    currentWordEl.textContent = applyCase(rawText);
    currentWordEl.classList.add('sentence-text');
    currentWordEl.classList.remove('word-nowrap');
  }

  updateCounter();
  renderTranslations();
  fitWordToLine();
  saveState();
}

// --- Shrink font so single words (no hyphenation) fit on one line ---
function fitWordToLine() {
  if (mode !== 'words' || hyphenationOn) return;
  const maxWidth = currentWordEl.parentElement.clientWidth;
  if (currentWordEl.scrollWidth > maxWidth) {
    const ratio = maxWidth / currentWordEl.scrollWidth;
    const currentSize = parseFloat(getComputedStyle(currentWordEl).fontSize);
    currentWordEl.style.fontSize = `${Math.floor(currentSize * ratio)}px`;
  }
}

// --- Advance to next item ---
function nextItem() {
  // If we're not at the end of history, just move forward
  if (historyIndex < history.length - 1) {
    historyIndex++;
    currentItem = history[historyIndex];
    displayItem();
    return;
  }

  // Pick a new random item
  const item = pickRandomItem();
  if (!item) {
    // Should not happen with looping, but just in case
    return;
  }

  currentItem = item;
  const key = mode === 'words' ? 'word' : 'sentence';

  // Track as unique only if not previously shown
  if (!shownItems.has(item[key])) {
    uniqueCount++;
  }
  shownItems.add(item[key]);

  // Add to history
  history.push(item);
  historyIndex = history.length - 1;

  displayItem();
}

// --- Go to previous item ---
function prevItem() {
  if (historyIndex > 0) {
    historyIndex--;
    currentItem = history[historyIndex];
    displayItem();
  } else if (history.length > 0) {
    // Loop to the end - pick a new random item and prepend to history
    const item = pickRandomItem();
    if (!item) return;

    currentItem = item;
    const key = mode === 'words' ? 'word' : 'sentence';

    if (!shownItems.has(item[key])) {
      uniqueCount++;
    }
    shownItems.add(item[key]);

    // Prepend to history
    history.unshift(item);
    // historyIndex stays at 0

    displayItem();
  }
}

// --- Update category filter and re-filter pool ---
function updateCategoryFilter() {
  const noun = filterNoun.checked;
  const verb = filterVerb.checked;
  const adj = filterAdjective.checked;

  // Prevent all-off state: if user unchecks the last one, re-enable all
  if (!noun && !verb && !adj) {
    filterNoun.checked = true;
    filterVerb.checked = true;
    filterAdjective.checked = true;
    activeCategories = new Set(['noun', 'verb', 'adjective']);
  } else {
    activeCategories = new Set();
    if (noun) activeCategories.add('noun');
    if (verb) activeCategories.add('verb');
    if (adj) activeCategories.add('adjective');
  }

  // Re-filter the pool, keeping already-shown tracking
  availableItems = getFilteredWords(difficulty, activeCategories);
  // If current item no longer matches filters, advance
  if (currentItem && !activeCategories.has(currentItem.category)) {
    nextItem();
  }
  saveState();
}

// --- Start a session ---
function startSession(diff) {
  difficulty = diff;
  shownItems = new Set();
  uniqueCount = 0;
  currentItem = null;
  history = [];
  historyIndex = -1;

  if (mode === 'words') {
    availableItems = getFilteredWords(difficulty, activeCategories);
  } else {
    availableItems = getSentencesByDifficulty(difficulty);
  }

  showScreen(wordScreen);
  nextItem();
}

// --- Reset to start ---
function resetToStart() {
  // Clear session but keep settings
  difficulty = null;
  shownItems = new Set();
  uniqueCount = 0;
  currentItem = null;
  history = [];
  historyIndex = -1;
  saveState();
  showScreen(startScreen);
}

// --- Text-to-speech for Finnish main word ---
function speakCurrentItem() {
  if (!currentItem) return;
  const text = mode === 'words' ? currentItem.word : currentItem.sentence;
  speakText(text, 'fi-FI');
}

// --- Event listeners ---

// Mode buttons
document.querySelectorAll('.btn-mode').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-mode').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    saveState();
  });
});

// Difficulty buttons
document.querySelectorAll('.difficulty-buttons .btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    startSession(btn.dataset.difficulty);
  });
});

// Next button
nextBtn.addEventListener('click', nextItem);

// Previous button
prevBtn.addEventListener('click', prevItem);

// Back button
backBtn.addEventListener('click', resetToStart);

// Restart button
restartBtn.addEventListener('click', resetToStart);

// Hyphenation toggle
hyphenationToggle.addEventListener('change', () => {
  hyphenationOn = hyphenationToggle.checked;
  displayItem();
  saveState();
});

// Uppercase toggle
uppercaseToggle.addEventListener('change', () => {
  uppercaseOn = uppercaseToggle.checked;
  if (uppercaseOn) {
    document.body.classList.remove('capitalize-mode');
  } else {
    document.body.classList.add('capitalize-mode');
  }
  displayItem();
  saveState();
});

// Speak button
speakBtn.addEventListener('click', speakCurrentItem);

// Category filter toggles
filterNoun.addEventListener('change', updateCategoryFilter);
filterVerb.addEventListener('change', updateCategoryFilter);
filterAdjective.addEventListener('change', updateCategoryFilter);

// Language toggles
Object.entries(langToggles).forEach(([langId, toggle]) => {
  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      activeLangs.add(langId);
    } else {
      activeLangs.delete(langId);
    }
    renderTranslations();
    saveState();
  });
});

// Sidebar
hamburgerBtn.addEventListener('click', openSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Help modal
helpBtn.addEventListener('click', openHelpModal);
helpModalClose.addEventListener('click', closeHelpModal);
helpModalBackdrop.addEventListener('click', closeHelpModal);

// --- Initialize ---
const sessionRestored = loadState();
if (sessionRestored) {
  showScreen(wordScreen);
  displayItem();
} else {
  showScreen(startScreen);
}
