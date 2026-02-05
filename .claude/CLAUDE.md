# Tutor - Finnish Learning App

## Overview
Educational web app for children with a modular architecture supporting multiple learning subjects. Currently includes:
- **Reading module** (Lukeminen): Finnish reading practice with words and sentences
- **Math module** (Matematiikka): Addition and subtraction practice with number line visualization

Finnish name: "Opitaan yhdessä!" (Let's learn together!)

## Tech Stack
- **Framework**: Vanilla JavaScript (ES6 modules, no framework)
- **Build tool**: Vite 4.5
- **Styling**: Plain CSS
- **Runtime dependencies**: None

## Project Structure
```
src/
  main.js          - App logic: module management, session state, screen management, event listeners, TTS, localStorage persistence
  words.js         - Word database (~546 Finnish words with EN/ES/SV translations, child-friendly only)
  sentences.js     - Sentence database (~105 Finnish sentences with EN/ES/SV translations)
  hyphenation.js   - Finnish syllabification algorithm
  style.css        - All styling (gradient background, responsive, toggle switches, modal, module buttons)
index.html         - Single HTML entry point with module screens, toolbar, sidebar, and help modal
public/images/     - Country flag images (flag_fi.jpg, flag_uk.jpg, flag_es.jpg, flag_se.jpg)
vite.config.js     - Vite config
```

## Modular Architecture

### Global Elements
- **Toolbar** (`#toolbar`): Fixed top bar always visible with hamburger menu, session counter, and help button
- **Sidebar** (`#sidebar`): Slide-out settings panel with module-specific content
- **Help modal** (`#help-modal`): Instructions for all modules, settings, and adding app to phone home screen

### Module Selection
- Landing page shows module selection buttons (Reading, Math)
- Each module has its own:
  - Start screen(s)
  - Activity screens
  - Settings section in sidebar

### State Management
- `currentModule`: Tracks which module is active ('reading' | 'math' | null)
- Global state: `uppercaseOn` (shared across modules)
- Module-specific state: Each module has its own state variables
- LocalStorage structure: `{ currentModule, uppercaseOn, reading: {...}, math: {...} }`
- Automatic migration from old (pre-modular) localStorage format

## Reading Module (Lukeminen)

### Features
- **Two modes**: Words (SANAT) and Sentences (LAUSEET)
- **Three difficulty levels**: Easy (HELPPO), Medium (KESKITASO), Hard (VAIKEA)
- **Uppercase toggle** (Isot kirjaimet): Switches between uppercase (default) and capitalized display
- **Hyphenation toggle** (Tavutus): Shows syllable breaks using a Finnish syllabification algorithm
- **Category filters** (words mode only): Nouns (Substantiivit), Verbs (Verbit), Adjectives (Adjektiivit)
- **Multi-language translations**: Each word/sentence has English, Spanish, and Swedish translations displayed with country flag images and per-language TTS speaker buttons
- **Language toggles** (Käännökset): Toggle visibility of each translation language independently (EN/ES/SV)
- **Text-to-speech**: Browser SpeechSynthesis API reads Finnish (fi-FI), English (en-US), Spanish (es-ES), and Swedish (sv-SE) at rate 0.8
- **Random order with looping**: Items shown randomly; when all items shown, loops back
- **Navigation history**: Previous/Next buttons allow navigating back through shown items
- **Session counter**: Tracks unique items shown (not navigation count)
- **Child-friendly content**: Words filtered to exclude negative terms

### Reading Screens
1. **Reading start screen** (`#reading-start-screen`): Mode selection + difficulty selection + back to modules
2. **Reading word/sentence screen** (`#reading-word-screen`): Display area, speak button, prev/next navigation, back button
3. **Reading done screen** (`#reading-done-screen`): Kept but unused (looping navigation)

### Reading Settings (in sidebar)
- Uppercase toggle
- Hyphenation toggle
- Category filters (shown only in words mode)
- Translation language toggles

## Math Module (Matematiikka)

### Features
- **Operations**: Addition (+) and Subtraction (−) - selectable via buttons at top
- **Five difficulty levels**: Controls number ranges and allows/disallows negative answers
  - Level 1: num1 1-5, num2 1-5, no negatives, line 0-10 (every number shown)
  - Level 2: num1 1-10, num2 1-5, no negatives, line 0-15 (every number shown)
  - Level 3: num1 1-20, num2 1-9, no negatives, line 0-30 (every number shown)
  - Level 4: num1 1-20, num2 1-10, negatives allowed, line 0-30 (every 5th labeled)
  - Level 5: num1 1-25, num2 1-25, negatives allowed, line 0-50 (every 5th labeled)
  - For levels 1-3, subtraction ensures num2 ≤ num1 to avoid negative answers
- **Number line visualization**: SVG-rendered number line showing relevant range for current question
- **Help visualization**: Shows animated arc on number line demonstrating the operation (e.g., +3 shows jump from start to result)
- **Child-friendly numpad**: Large buttons for number input (0-9, negative sign, clear, submit)
- **Immediate feedback**: Shows "Oikein! 🎉" for correct, "Yritä uudelleen!" for incorrect
- **Score tracking**: Toolbar shows "Oikein: X/Y" (correct/total)
- **Auto-reveal on correct**: Help visualization automatically shows when answer is correct

### Math UI Components
- **Controls bar**: Operation buttons (+ −) and difficulty buttons (1-5) always visible at top
- **Question display**: Shows "X + Y = ?" format with large numbers
- **Number line**: SVG with tick marks, labels, and optional help visualization
- **Help button**: Toggles visualization showing the operation on number line
- **Numpad**: 3x4 grid with digits 0-9, negative toggle, and OK button
- **Input display**: Shows current typed answer with clear button
- **Feedback area**: Shows result message
- **Next button**: Appears after correct answer to generate new question

### Math Screens
1. **Math screen** (`#math-screen`): All-in-one screen with controls, question, number line, and input

### Math Settings (in sidebar)
- Show number line toggle (Näytä lukusuora)

### Number Line Algorithm
- Calculates range to fit: num1, num2, answer, and 0
- Adds 20% padding, rounds to multiples of 5
- Ensures minimum range of 10
- Tick interval adapts: every 1 for small ranges, every 2 or 5 for larger
- Help visualization draws:
  - Blue circle at starting number
  - Red arc showing the jump with label (+3 or −3)
  - Green circle at result

## UI Structure

### Screen Hierarchy
```
Module Selection Screen
├── Reading Module
│   ├── Reading Start Screen
│   ├── Reading Word/Sentence Screen
│   └── Reading Done Screen (unused)
└── Math Module
    └── Math Screen (all-in-one)
```

### Sidebar Structure
```
Sidebar
├── Header (Asetukset)
├── Reading Settings (#reading-settings) - shown when in reading module
│   ├── Uppercase toggle
│   ├── Hyphenation toggle
│   ├── Category filters
│   └── Translation toggles
└── Math Settings (#math-settings) - shown when in math module
    └── Show number line toggle
```

## Key Design Decisions
- Toolbar is global and always visible; sidebar content is module-specific
- Module selection returns to landing page and resets module session state
- Words without hyphenation always fit on one line (auto font-size shrinking via JS)
- Sentences without hyphenation wrap at word boundaries only
- TTS always speaks the original text (not the hyphenated form)
- All UI text is in Finnish
- Uppercase is the default display mode
- Navigation loops infinitely in both directions
- State saved to localStorage on every change; session resumes on app restart

## Commands
- `npm run dev` - Start Vite dev server (localhost:5173)
- `npm run build` - Production build to dist/ (auto-increments patch version)
- `npm run preview` - Preview production build

## Versioning
- Version displayed in toolbar center as "Tutor X.Y.Z"
- Stored in `src/version.js`
- Patch version (Z) auto-increments on every `npm run build`
- Major/minor versions updated manually for significant changes

## Adding New Modules

To add a new module:
1. Add module button to `#module-screen` in index.html
2. Create module-specific screens in `#app` div
3. Add module settings section in `#sidebar`
4. Add module state variables in main.js
5. Add module to localStorage state structure
6. Implement `selectModule()` case for new module
7. Add event listeners for module-specific buttons
8. Update `updateSidebarForModule()` to show module settings

## Session Workflow
- **After implementing new features or design changes, always update this CLAUDE.md file** to reflect the current state of the project (features, design decisions, structure changes, etc.). This keeps the file accurate for future sessions.
