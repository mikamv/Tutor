import { getFilteredWords } from './words.js';
import { getSentencesByDifficulty } from './sentences.js';
import { hyphenateWord } from './hyphenation.js';
import { VERSION } from './version.js';
import './style.css';

// --- Language configuration ---
const LANGUAGES = [
  { id: 'en', key: 'translation', flag: '/images/flag_uk.jpg', ttsLang: 'en-US' },
  { id: 'es', key: 'translation_es', flag: '/images/flag_es.jpg', ttsLang: 'es-ES' },
  { id: 'sv', key: 'translation_sv', flag: '/images/flag_se.jpg', ttsLang: 'sv-SE' },
];

// --- Global state ---
let currentModule = null; // 'reading' | 'math'
let uppercaseOn = true;

// --- Math module state ---
let mathOperation = 'addition'; // 'addition' | 'subtraction'
let mathDifficulty = 1; // 1-5
let mathNum1 = 0;
let mathNum2 = 0;
let mathCorrectAnswer = 0;
let mathUserInput = '';
let mathHelpVisible = false;
let mathShowNumberLine = true;
let mathQuestionsAnswered = 0;
let mathCorrectCount = 0;

// Difficulty settings
const MATH_DIFFICULTY_SETTINGS = {
  1: { num1Min: 1, num1Max: 5,  num2Min: 1, num2Max: 5,  allowNegativeAnswer: false, lineMin: 0, lineMax: 10, showEveryLabel: true },
  2: { num1Min: 1, num1Max: 10, num2Min: 1, num2Max: 5,  allowNegativeAnswer: false, lineMin: 0, lineMax: 15, showEveryLabel: true },
  3: { num1Min: 1, num1Max: 20, num2Min: 1, num2Max: 9,  allowNegativeAnswer: false, lineMin: 0, lineMax: 30, showEveryLabel: true },
  4: { num1Min: 1, num1Max: 20, num2Min: 1, num2Max: 10, allowNegativeAnswer: true,  lineMin: 0, lineMax: 30, showEveryLabel: false },
  5: { num1Min: 1, num1Max: 25, num2Min: 1, num2Max: 25, allowNegativeAnswer: true,  lineMin: 0, lineMax: 50, showEveryLabel: false },
};

// --- Reading module state ---
let shownItems = new Set();
let uniqueCount = 0;
let currentItem = null;
let difficulty = null;
let hyphenationOn = false;
let mode = 'words'; // 'words' or 'sentences'
let activeCategories = new Set(['noun', 'verb', 'adjective']);
let availableItems = [];
let activeLangs = new Set(['en', 'es', 'sv']);
let history = []; // Array of items for navigation
let historyIndex = -1; // Current position in history

// --- DOM elements ---
// Global screens
const moduleScreen = document.getElementById('module-screen');

// Reading module screens
const readingStartScreen = document.getElementById('reading-start-screen');
const readingWordScreen = document.getElementById('reading-word-screen');
const readingDoneScreen = document.getElementById('reading-done-screen');

// Math module screens
const mathScreen = document.getElementById('math-screen');

// All screens for easy hiding
const allScreens = [moduleScreen, readingStartScreen, readingWordScreen, readingDoneScreen, mathScreen];

// Module-specific sidebar content
const readingSettings = document.getElementById('reading-settings');
const mathSettings = document.getElementById('math-settings');

// Toolbar elements
const toolbarCounter = document.getElementById('toolbar-counter');
const toolbar = document.getElementById('toolbar');

// Reading module elements
const currentWordEl = document.getElementById('current-word');
const translationsEl = document.getElementById('translations');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const readingBackBtn = document.getElementById('reading-back-btn');
const readingBackToModules = document.getElementById('reading-back-to-modules');
const restartBtn = document.getElementById('restart-btn');
const hyphenationToggle = document.getElementById('hyphenation-toggle');
const uppercaseToggle = document.getElementById('uppercase-toggle');
const categoryFilters = document.getElementById('category-filters');
const filterNoun = document.getElementById('filter-noun');
const filterVerb = document.getElementById('filter-verb');
const filterAdjective = document.getElementById('filter-adjective');
const doneSubtitle = document.getElementById('done-subtitle');
const speakBtn = document.getElementById('speak-btn');

// Math module elements
const mathBackToModules = document.getElementById('math-back-to-modules');
const mathNum1El = document.getElementById('math-num1');
const mathOperatorEl = document.getElementById('math-operator');
const mathNum2El = document.getElementById('math-num2');
const mathAnswerDisplayEl = document.getElementById('math-answer-display');
const mathInputDisplayEl = document.getElementById('math-input-display');
const mathClearBtn = document.getElementById('math-clear-btn');
const mathSubmitBtn = document.getElementById('math-submit-btn');
const mathHelpBtn = document.getElementById('math-help-btn');
const mathNextBtn = document.getElementById('math-next-btn');
const mathFeedbackEl = document.getElementById('math-feedback');
const numberLineSvg = document.getElementById('number-line');
const mathShowNumberLineToggle = document.getElementById('math-show-numberline');

// Sidebar elements
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

// Help modal elements
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const helpModalClose = document.getElementById('help-modal-close');
const helpModalBackdrop = helpModal.querySelector('.modal-backdrop');

// Language toggles
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
    // Global state
    currentModule,
    uppercaseOn,
    // Reading module state
    reading: {
      mode,
      difficulty,
      hyphenationOn,
      activeCategories: Array.from(activeCategories),
      activeLangs: Array.from(activeLangs),
      shownItems: Array.from(shownItems),
      uniqueCount,
      history: history.map(item => mode === 'words' ? item.word : item.sentence),
      historyIndex,
    },
    // Math module state
    math: {
      operation: mathOperation,
      difficulty: mathDifficulty,
      showNumberLine: mathShowNumberLine,
      questionsAnswered: mathQuestionsAnswered,
      correctCount: mathCorrectCount,
    },
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
    if (!saved) return { hasSession: false, module: null };

    const state = JSON.parse(saved);

    // Handle migration from old format
    if (!state.reading && state.mode) {
      // Old format - migrate to new structure
      return migrateOldState(state);
    }

    // Restore global settings
    currentModule = state.currentModule || null;
    uppercaseOn = state.uppercaseOn !== false; // default true

    // Apply global UI settings
    uppercaseToggle.checked = uppercaseOn;
    if (uppercaseOn) {
      document.body.classList.remove('capitalize-mode');
    } else {
      document.body.classList.add('capitalize-mode');
    }

    // Restore reading module state
    const reading = state.reading || {};
    mode = reading.mode || 'words';
    difficulty = reading.difficulty || null;
    hyphenationOn = reading.hyphenationOn || false;
    activeCategories = new Set(reading.activeCategories || ['noun', 'verb', 'adjective']);
    activeLangs = new Set(reading.activeLangs || ['en', 'es', 'sv']);

    // Apply reading UI settings
    hyphenationToggle.checked = hyphenationOn;
    filterNoun.checked = activeCategories.has('noun');
    filterVerb.checked = activeCategories.has('verb');
    filterAdjective.checked = activeCategories.has('adjective');
    langToggles.en.checked = activeLangs.has('en');
    langToggles.es.checked = activeLangs.has('es');
    langToggles.sv.checked = activeLangs.has('sv');

    // Update mode buttons
    document.querySelectorAll('.btn-mode').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Restore math module state
    const math = state.math || {};
    mathOperation = math.operation || 'addition';
    mathDifficulty = math.difficulty || 1;
    mathShowNumberLine = math.showNumberLine !== false;
    mathQuestionsAnswered = math.questionsAnswered || 0;
    mathCorrectCount = math.correctCount || 0;

    // Apply math UI settings
    if (mathShowNumberLineToggle) {
      mathShowNumberLineToggle.checked = mathShowNumberLine;
    }
    document.querySelectorAll('.btn-operation').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.operation === mathOperation);
    });
    document.querySelectorAll('.btn-difficulty').forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.level) === mathDifficulty);
    });

    // If we have a reading session in progress, restore it
    if (currentModule === 'reading' && difficulty && reading.historyIndex >= 0) {
      // Get available items
      if (mode === 'words') {
        availableItems = getFilteredWords(difficulty, activeCategories);
      } else {
        availableItems = getSentencesByDifficulty(difficulty);
      }

      // Restore shown items and history
      shownItems = new Set(reading.shownItems || []);
      uniqueCount = reading.uniqueCount || 0;
      historyIndex = reading.historyIndex;

      // Rebuild history from saved keys
      const key = mode === 'words' ? 'word' : 'sentence';
      history = [];
      for (const itemKey of (reading.history || [])) {
        const item = availableItems.find(i => i[key] === itemKey);
        if (item) {
          history.push(item);
        }
      }

      // Set current item
      if (history.length > 0 && historyIndex >= 0 && historyIndex < history.length) {
        currentItem = history[historyIndex];
        return { hasSession: true, module: 'reading' };
      }
    }

    return { hasSession: false, module: currentModule };
  } catch (e) {
    return { hasSession: false, module: null };
  }
}

// --- Migrate old state format to new modular format ---
function migrateOldState(state) {
  // Restore from old format
  mode = state.mode || 'words';
  difficulty = state.difficulty || null;
  hyphenationOn = state.hyphenationOn || false;
  uppercaseOn = state.uppercaseOn !== false;
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
    currentModule = 'reading';

    if (mode === 'words') {
      availableItems = getFilteredWords(difficulty, activeCategories);
    } else {
      availableItems = getSentencesByDifficulty(difficulty);
    }

    shownItems = new Set(state.shownItems || []);
    uniqueCount = state.uniqueCount || 0;
    historyIndex = state.historyIndex;

    const key = mode === 'words' ? 'word' : 'sentence';
    history = [];
    for (const itemKey of (state.history || [])) {
      const item = availableItems.find(i => i[key] === itemKey);
      if (item) {
        history.push(item);
      }
    }

    if (history.length > 0 && historyIndex >= 0 && historyIndex < history.length) {
      currentItem = history[historyIndex];
      saveState(); // Save in new format
      return { hasSession: true, module: 'reading' };
    }
  }

  saveState(); // Save in new format
  return { hasSession: false, module: null };
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
  // Hide all screens
  allScreens.forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');

  // Toolbar is always visible, but counter content changes
  document.body.classList.add('has-toolbar');

  // Update counter based on screen
  if (screen === moduleScreen || screen === readingStartScreen) {
    toolbarCounter.textContent = '';
  } else if (screen === mathScreen) {
    updateMathCounter();
  }

  // Show/hide category filters based on mode
  if (screen === readingWordScreen || screen === readingDoneScreen) {
    if (mode === 'words') {
      categoryFilters.classList.remove('hidden');
    } else {
      categoryFilters.classList.add('hidden');
    }
  }

  // Update sidebar content based on current module
  updateSidebarForModule();

  closeSidebar();
}

// --- Update sidebar content for current module ---
function updateSidebarForModule() {
  // Hide all module settings
  readingSettings.classList.add('hidden');
  mathSettings.classList.add('hidden');

  // Show settings for current module
  if (currentModule === 'reading') {
    readingSettings.classList.remove('hidden');
  } else if (currentModule === 'math') {
    mathSettings.classList.remove('hidden');
  }
}

// --- Select a module ---
function selectModule(module) {
  currentModule = module;
  saveState();

  if (module === 'reading') {
    showScreen(readingStartScreen);
  } else if (module === 'math') {
    showScreen(mathScreen);
    generateMathQuestion();
  }
}

// --- Go back to module selection ---
function goToModuleSelection() {
  currentModule = null;
  // Reset reading session when going back to modules
  difficulty = null;
  shownItems = new Set();
  uniqueCount = 0;
  currentItem = null;
  history = [];
  historyIndex = -1;
  // Reset math session counters
  mathQuestionsAnswered = 0;
  mathCorrectCount = 0;
  saveState();
  showScreen(moduleScreen);
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

// --- Start a reading session ---
function startReadingSession(diff) {
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

  showScreen(readingWordScreen);
  nextItem();
}

// --- Reset to reading start screen ---
function resetToReadingStart() {
  // Clear session but keep settings
  difficulty = null;
  shownItems = new Set();
  uniqueCount = 0;
  currentItem = null;
  history = [];
  historyIndex = -1;
  saveState();
  showScreen(readingStartScreen);
}

// --- Text-to-speech for Finnish main word ---
function speakCurrentItem() {
  if (!currentItem) return;
  const text = mode === 'words' ? currentItem.word : currentItem.sentence;
  speakText(text, 'fi-FI');
}

// ============================================
// MATH MODULE FUNCTIONS
// ============================================

// --- Generate random number in range ---
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Generate a math question ---
function generateMathQuestion() {
  const settings = MATH_DIFFICULTY_SETTINGS[mathDifficulty];

  mathNum1 = randomInRange(settings.num1Min, settings.num1Max);
  mathNum2 = randomInRange(settings.num2Min, settings.num2Max);

  // For subtraction, ensure num2 <= num1 if negative answers not allowed
  if (mathOperation === 'subtraction' && !settings.allowNegativeAnswer) {
    if (mathNum2 > mathNum1) {
      // Swap or regenerate to ensure positive result
      mathNum2 = randomInRange(settings.num2Min, Math.min(settings.num2Max, mathNum1));
    }
  }

  if (mathOperation === 'addition') {
    mathCorrectAnswer = mathNum1 + mathNum2;
  } else {
    mathCorrectAnswer = mathNum1 - mathNum2;
  }

  // Count this question
  mathQuestionsAnswered++;

  // Reset UI state
  mathUserInput = '';
  mathHelpVisible = false;
  mathHelpBtn.classList.remove('active');
  mathFeedbackEl.classList.add('hidden');
  mathFeedbackEl.classList.remove('correct', 'incorrect');
  mathNextBtn.classList.add('hidden');
  mathAnswerDisplayEl.textContent = '?';
  mathAnswerDisplayEl.classList.remove('correct', 'incorrect', 'typing');
  mathInputDisplayEl.textContent = '';

  // Display the question
  displayMathQuestion();
  renderNumberLine();
  updateMathCounter();
  saveState();
}

// --- Display the current math question ---
function displayMathQuestion() {
  mathNum1El.textContent = mathNum1;
  mathOperatorEl.textContent = mathOperation === 'addition' ? '+' : '−';
  mathNum2El.textContent = mathNum2;
}

// --- Calculate number line range ---
function calculateNumberLineRange() {
  const settings = MATH_DIFFICULTY_SETTINGS[mathDifficulty];

  // Use fixed range from difficulty settings
  let min = settings.lineMin;
  let max = settings.lineMax;

  // For difficulties that allow negative answers, extend range if needed
  if (settings.allowNegativeAnswer && mathCorrectAnswer < min) {
    min = Math.floor(mathCorrectAnswer / 5) * 5 - 5;
  }

  return { min, max };
}

// --- Render the number line ---
function renderNumberLine() {
  if (!mathShowNumberLine) {
    numberLineSvg.innerHTML = '';
    numberLineSvg.parentElement.style.display = 'none';
    mathHelpBtn.style.display = 'none';
    return;
  }

  numberLineSvg.parentElement.style.display = 'block';
  mathHelpBtn.style.display = 'flex';

  const { min, max } = calculateNumberLineRange();
  const range = max - min;

  // SVG dimensions
  const width = 600;
  const height = 80;
  const padding = 30;
  const lineY = 50;
  const tickHeight = 12;
  const smallTickHeight = 6;

  // Calculate scale
  const scale = (width - 2 * padding) / range;

  // Helper to convert number to x position
  const numToX = (num) => padding + (num - min) * scale;

  // Build SVG content
  let svg = '';

  // Main line
  svg += `<line x1="${padding}" y1="${lineY}" x2="${width - padding}" y2="${lineY}" class="number-line-main"/>`;

  // Determine tick and label intervals based on difficulty settings
  const settings = MATH_DIFFICULTY_SETTINGS[mathDifficulty];
  const labelInterval = settings.showEveryLabel ? 1 : 5;

  // Draw ticks and labels
  for (let i = min; i <= max; i++) {
    const x = numToX(i);

    const isZero = i === 0;
    const showLabel = i % labelInterval === 0;

    if (showLabel) {
      // Major tick with label - only below line, except for 0 which has both
      if (isZero) {
        svg += `<line x1="${x}" y1="${lineY - tickHeight}" x2="${x}" y2="${lineY + tickHeight}" class="number-line-tick"/>`;
      } else {
        svg += `<line x1="${x}" y1="${lineY}" x2="${x}" y2="${lineY + tickHeight}" class="number-line-tick"/>`;
      }

      // All labels black
      svg += `<text x="${x}" y="${lineY + tickHeight + 14}" class="number-line-label" fill="#333" font-weight="600">${i}</text>`;
    } else {
      // Small tick - only below line, but 0 still gets upper part
      if (isZero) {
        svg += `<line x1="${x}" y1="${lineY - tickHeight}" x2="${x}" y2="${lineY + tickHeight}" class="number-line-tick"/>`;
        svg += `<text x="${x}" y="${lineY + tickHeight + 14}" class="number-line-label" fill="#333" font-weight="600">${i}</text>`;
      } else {
        svg += `<line x1="${x}" y1="${lineY}" x2="${x}" y2="${lineY + smallTickHeight}" class="number-line-tick-small"/>`;
      }
    }
  }

  // Add help visualization if active
  if (mathHelpVisible) {
    svg += renderHelpVisualization(numToX, lineY);
  }

  numberLineSvg.innerHTML = svg;
}

// --- Render help visualization on number line ---
function renderHelpVisualization(numToX, lineY) {
  let svg = '';

  const startX = numToX(mathNum1);
  const endX = numToX(mathCorrectAnswer);
  const steps = Math.abs(mathNum2);

  // Starting point circle
  svg += `<circle cx="${startX}" cy="${lineY}" r="10" class="number-line-highlight-start"/>`;
  svg += `<text x="${startX}" y="${lineY + 4}" fill="white" text-anchor="middle" font-size="12" font-weight="bold">${mathNum1}</text>`;

  if (steps > 0) {
    // Draw arc showing the jump
    const arcHeight = 25;
    const direction = endX > startX ? 1 : -1;
    const midX = (startX + endX) / 2;

    // Draw the arc path
    svg += `<path d="M ${startX} ${lineY - 10} Q ${midX} ${lineY - arcHeight - 10} ${endX} ${lineY - 10}" class="number-line-highlight-arc"/>`;

    // Arrow head at the end
    const arrowSize = 6;
    svg += `<polygon points="${endX},${lineY - 10} ${endX - direction * arrowSize},${lineY - 10 - arrowSize} ${endX - direction * arrowSize},${lineY - 10 + arrowSize}" class="number-line-highlight-arrow"/>`;

    // Label showing the jump amount
    const jumpLabel = mathOperation === 'addition' ? `+${mathNum2}` : `−${Math.abs(mathNum2)}`;
    svg += `<text x="${midX}" y="${lineY - arcHeight - 15}" fill="#ef5350" text-anchor="middle" font-size="14" font-weight="bold">${jumpLabel}</text>`;
  }

  // Ending point circle
  svg += `<circle cx="${endX}" cy="${lineY}" r="10" class="number-line-highlight-end"/>`;
  svg += `<text x="${endX}" y="${lineY + 4}" fill="white" text-anchor="middle" font-size="12" font-weight="bold">${mathCorrectAnswer}</text>`;

  return svg;
}

// --- Toggle help visualization ---
function toggleMathHelp() {
  mathHelpVisible = !mathHelpVisible;
  mathHelpBtn.classList.toggle('active', mathHelpVisible);
  renderNumberLine();
}

// --- Handle numpad input ---
function handleMathNumpadInput(value) {
  if (mathFeedbackEl.classList.contains('correct')) return; // Already answered correctly

  if (value === '-') {
    // Toggle negative sign
    if (mathUserInput.startsWith('-')) {
      mathUserInput = mathUserInput.slice(1);
    } else if (mathUserInput === '' || mathUserInput === '0') {
      mathUserInput = '-';
    } else {
      mathUserInput = '-' + mathUserInput;
    }
  } else {
    // Limit input length
    if (mathUserInput.replace('-', '').length >= 3) return;

    // Prevent leading zeros
    if (mathUserInput === '0' || mathUserInput === '-0') {
      mathUserInput = mathUserInput.replace('0', '') + value;
    } else {
      mathUserInput += value;
    }
  }

  mathInputDisplayEl.textContent = mathUserInput;

  // Update answer display in question line
  if (mathUserInput === '' || mathUserInput === '-') {
    mathAnswerDisplayEl.textContent = '?';
    mathAnswerDisplayEl.classList.remove('typing');
  } else {
    mathAnswerDisplayEl.textContent = mathUserInput;
    mathAnswerDisplayEl.classList.add('typing');
    mathAnswerDisplayEl.classList.remove('correct', 'incorrect');
  }
}

// --- Clear math input ---
function clearMathInput() {
  mathUserInput = '';
  mathInputDisplayEl.textContent = '';
  mathFeedbackEl.classList.add('hidden');
  mathFeedbackEl.classList.remove('correct', 'incorrect');
  mathAnswerDisplayEl.textContent = '?';
  mathAnswerDisplayEl.classList.remove('correct', 'incorrect', 'typing');
}

// --- Submit math answer ---
function submitMathAnswer() {
  if (mathUserInput === '' || mathUserInput === '-') return;
  if (mathFeedbackEl.classList.contains('correct')) return; // Already answered correctly

  const userAnswer = parseInt(mathUserInput, 10);

  if (userAnswer === mathCorrectAnswer) {
    // Correct!
    mathCorrectCount++;
    mathAnswerDisplayEl.textContent = mathCorrectAnswer;
    mathAnswerDisplayEl.classList.remove('typing', 'incorrect');
    mathAnswerDisplayEl.classList.add('correct');
    mathFeedbackEl.textContent = 'Oikein! 🎉';
    mathFeedbackEl.classList.remove('hidden', 'incorrect');
    mathFeedbackEl.classList.add('correct');
    mathNextBtn.classList.remove('hidden');

    // Show help visualization to reinforce learning
    if (!mathHelpVisible) {
      mathHelpVisible = true;
      mathHelpBtn.classList.add('active');
      renderNumberLine();
    }

    updateMathCounter();
  } else {
    // Incorrect
    mathAnswerDisplayEl.textContent = mathUserInput;
    mathAnswerDisplayEl.classList.remove('typing', 'correct');
    mathAnswerDisplayEl.classList.add('incorrect');
    mathFeedbackEl.textContent = 'Yritä uudelleen!';
    mathFeedbackEl.classList.remove('hidden', 'correct');
    mathFeedbackEl.classList.add('incorrect');
  }

  saveState();
}

// --- Change math operation ---
function setMathOperation(operation) {
  mathOperation = operation;
  document.querySelectorAll('.btn-operation').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.operation === operation);
  });
  generateMathQuestion();
}

// --- Change math difficulty ---
function setMathDifficulty(level) {
  mathDifficulty = level;
  document.querySelectorAll('.btn-difficulty').forEach((btn) => {
    btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
  });
  generateMathQuestion();
}

// --- Toggle number line visibility ---
function toggleMathNumberLine() {
  mathShowNumberLine = mathShowNumberLineToggle.checked;
  renderNumberLine();
  saveState();
}

// --- Update math counter in toolbar ---
function updateMathCounter() {
  if (mathQuestionsAnswered > 0) {
    toolbarCounter.textContent = `Oikein: ${mathCorrectCount}/${mathQuestionsAnswered}`;
  } else {
    toolbarCounter.textContent = '';
  }
}

// --- Event listeners ---

// Module selection buttons
document.querySelectorAll('.btn-module').forEach((btn) => {
  btn.addEventListener('click', () => {
    selectModule(btn.dataset.module);
  });
});

// Mode buttons (reading module)
document.querySelectorAll('.btn-mode').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-mode').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    saveState();
  });
});

// Difficulty buttons (reading module)
document.querySelectorAll('#reading-start-screen .difficulty-buttons .btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    startReadingSession(btn.dataset.difficulty);
  });
});

// Next button (reading module)
nextBtn.addEventListener('click', nextItem);

// Previous button (reading module)
prevBtn.addEventListener('click', prevItem);

// Back button from reading word screen
readingBackBtn.addEventListener('click', resetToReadingStart);

// Back to modules from reading start
readingBackToModules.addEventListener('click', goToModuleSelection);

// Back to modules from math
mathBackToModules.addEventListener('click', goToModuleSelection);

// Restart button (reading module)
restartBtn.addEventListener('click', resetToReadingStart);

// Math operation buttons
document.querySelectorAll('.btn-operation').forEach((btn) => {
  btn.addEventListener('click', () => {
    setMathOperation(btn.dataset.operation);
  });
});

// Math difficulty buttons
document.querySelectorAll('.btn-difficulty').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    setMathDifficulty(parseInt(btn.dataset.level));
  });
});

// Math numpad buttons
document.querySelectorAll('.btn-numpad').forEach((btn) => {
  if (btn.dataset.value !== undefined) {
    btn.addEventListener('click', () => {
      handleMathNumpadInput(btn.dataset.value);
    });
  }
});

// Math clear button
mathClearBtn.addEventListener('click', clearMathInput);

// Math submit button
mathSubmitBtn.addEventListener('click', submitMathAnswer);

// Math help button
mathHelpBtn.addEventListener('click', toggleMathHelp);

// Math next button
mathNextBtn.addEventListener('click', generateMathQuestion);

// Math number line toggle
mathShowNumberLineToggle.addEventListener('change', toggleMathNumberLine);

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
// Display version number
document.getElementById('version-number').textContent = VERSION;
document.getElementById('help-version-number').textContent = VERSION;

const loadResult = loadState();
if (loadResult.hasSession && loadResult.module === 'reading') {
  // Restore reading session in progress
  showScreen(readingWordScreen);
  displayItem();
} else if (loadResult.module === 'reading') {
  // User was in reading module but no active session
  showScreen(readingStartScreen);
} else if (loadResult.module === 'math') {
  // User was in math module - generate a new question
  showScreen(mathScreen);
  generateMathQuestion();
} else {
  // No module selected, show module selection
  showScreen(moduleScreen);
}
