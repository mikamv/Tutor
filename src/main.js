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
let itemCount = 0;
let currentItem = null;
let difficulty = null;
let hyphenationOn = false;
let uppercaseOn = true;
let mode = 'words'; // 'words' or 'sentences'
let activeCategories = new Set(['noun', 'verb', 'adjective']);
let availableItems = [];
let activeLangs = new Set(['en', 'es', 'sv']);

// --- DOM elements ---
const startScreen = document.getElementById('start-screen');
const wordScreen = document.getElementById('word-screen');
const doneScreen = document.getElementById('done-screen');
const toolbarCounter = document.getElementById('toolbar-counter');
const toolbar = document.getElementById('toolbar');
const currentWordEl = document.getElementById('current-word');
const translationsEl = document.getElementById('translations');
const nextBtn = document.getElementById('next-btn');
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
const langToggles = {
  en: document.getElementById('lang-en'),
  es: document.getElementById('lang-es'),
  sv: document.getElementById('lang-sv'),
};

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

// --- Screen management ---
function showScreen(screen) {
  startScreen.classList.add('hidden');
  wordScreen.classList.add('hidden');
  doneScreen.classList.add('hidden');
  screen.classList.remove('hidden');

  // Show toolbar only on word/done screens
  if (screen === wordScreen || screen === doneScreen) {
    toolbar.classList.remove('hidden');
    document.body.classList.add('has-toolbar');
  } else {
    toolbar.classList.add('hidden');
    document.body.classList.remove('has-toolbar');
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
  if (remaining.length === 0) return null;
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
    toolbarCounter.textContent = `Sanoja näytetty: ${itemCount}`;
  } else {
    const rawText = hyphenationOn
      ? hyphenateSentence(currentItem.sentence)
      : currentItem.sentence;
    currentWordEl.textContent = applyCase(rawText);
    currentWordEl.classList.add('sentence-text');
    currentWordEl.classList.remove('word-nowrap');
    toolbarCounter.textContent = `Lauseita näytetty: ${itemCount}`;
  }

  renderTranslations();
  fitWordToLine();
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
  const item = pickRandomItem();
  if (!item) {
    doneSubtitle.textContent =
      mode === 'words' ? 'Kaikki sanat käyty!' : 'Kaikki lauseet käyty!';
    showScreen(doneScreen);
    return;
  }
  currentItem = item;
  const key = mode === 'words' ? 'word' : 'sentence';
  shownItems.add(item[key]);
  itemCount++;
  displayItem();
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
}

// --- Start a session ---
function startSession(diff) {
  difficulty = diff;
  shownItems = new Set();
  itemCount = 0;
  currentItem = null;

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

// Back button
backBtn.addEventListener('click', resetToStart);

// Restart button
restartBtn.addEventListener('click', resetToStart);

// Hyphenation toggle
hyphenationToggle.addEventListener('change', () => {
  hyphenationOn = hyphenationToggle.checked;
  displayItem();
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
  });
});

// Sidebar
hamburgerBtn.addEventListener('click', openSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// --- Initialize ---
showScreen(startScreen);
