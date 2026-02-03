# Tutor - Finnish Reading Practice App

## Overview
Educational web app for learning to read Finnish. Presents words and sentences one at a time with English translations at three difficulty levels. Designed with a child-friendly, colorful UI.

Finnish name: "Opetellaan lukemaan!" (Let's learn to read!)

## Tech Stack
- **Framework**: Vanilla JavaScript (ES6 modules, no framework)
- **Build tool**: Vite 4.5
- **Styling**: Plain CSS
- **Runtime dependencies**: None

## Project Structure
```
src/
  main.js          - App logic: session state, screen management, event listeners, TTS, localStorage persistence
  words.js         - Word database (~546 Finnish words with EN/ES/SV translations, child-friendly only)
  sentences.js     - Sentence database (~105 Finnish sentences with EN/ES/SV translations)
  hyphenation.js   - Finnish syllabification algorithm
  style.css        - All styling (gradient background, responsive, toggle switches, modal)
index.html         - Single HTML entry point with screens, toolbar, sidebar, and help modal
public/images/     - Country flag images (flag_fi.jpg, flag_uk.jpg, flag_es.jpg, flag_se.jpg)
vite.config.js     - Vite config
```

## Features
- **Two modes**: Words (SANAT) and Sentences (LAUSEET)
- **Three difficulty levels**: Easy (HELPPO), Medium (KESKITASO), Hard (VAIKEA)
- **Uppercase toggle** (Isot kirjaimet): Switches between uppercase (default) and capitalized display for all text app-wide
- **Hyphenation toggle** (Tavutus): Shows syllable breaks using a Finnish syllabification algorithm
- **Category filters** (words mode only): Nouns (Substantiivit), Verbs (Verbit), Adjectives (Adjektiivit)
- **Multi-language translations**: Each word/sentence has English, Spanish, and Swedish translations displayed with country flag images and per-language TTS speaker buttons
- **Language toggles** (Käännökset): Toggle visibility of each translation language independently (EN/ES/SV)
- **Sidebar settings panel**: Slide-out sidebar (hamburger menu) containing all toggles, filters, and language options
- **Compact toolbar**: Fixed top bar always visible on all screens with hamburger menu, session counter, and help button
- **Help button**: Shows modal with instructions for settings and how to add app to phone home screen (iPhone/Android)
- **Text-to-speech**: Browser SpeechSynthesis API reads Finnish (fi-FI), English (en-US), Spanish (es-ES), and Swedish (sv-SE) at rate 0.8; main speaker for Finnish, small per-row speakers for translations
- **Random order with looping**: Items shown randomly; when all items shown, loops back (no "done" screen)
- **Navigation history**: Previous/Next buttons allow navigating back through shown items; loops in both directions
- **Session counter**: Tracks unique items shown (not navigation count), displayed in toolbar
- **State persistence**: All settings, position, and history saved to localStorage; session resumes on app restart
- **Child-friendly content**: Words filtered to exclude negative terms (tyhmä, paha, ruma, laiska removed)
- **Responsive design**: Works on mobile (480px breakpoint), tablet (769px+), and desktop

## UI Structure (screens + toolbar/sidebar/modal)
1. **Start screen** (`#start-screen`): Mode selection + difficulty selection
2. **Word/Sentence screen** (`#word-screen`): Display area, speak button, prev/next navigation, back button
3. **Done screen** (`#done-screen`): Kept in HTML but no longer shown (looping navigation)
4. **Toolbar** (`#toolbar`): Fixed top bar always visible with hamburger menu, counter, and help button
5. **Sidebar** (`#sidebar`): Slide-out settings panel with uppercase toggle, hyphenation toggle, category filters, and language toggles
6. **Help modal** (`#help-modal`): Instructions for settings and adding app to phone home screen

## Key Design Decisions
- Words without hyphenation always fit on one line (auto font-size shrinking via JS)
- Sentences without hyphenation wrap at word boundaries only (never mid-word)
- Hyphenated text can break at hyphen positions (natural CSS break points)
- TTS always speaks the original text (not the hyphenated form)
- All UI text is in Finnish
- Uppercase is the default display mode; CSS `text-transform: uppercase` handles UI elements, JS `applyCase()` handles word/sentence content
- When uppercase is off, `capitalize-mode` class on body removes `text-transform` from all elements; JS applies sentence-case (first letter uppercase, rest lowercase)
- HTML button/label text is written in capitalized form (e.g., "Seuraava" not "SEURAAVA"); CSS uppercases it when needed
- Toolbar is always visible (fixed position) on all screens, not just word/done screens
- Toolbar counter is empty on start screen, shows unique count on word screen
- Toolbar and sidebar are outside `#app` to allow fixed positioning independent of the centered app container
- Category filters section is hidden in sidebar when in sentences mode
- Translation data uses `translation` (EN), `translation_es` (ES), `translation_sv` (SV) fields on each item
- Translations are rendered dynamically via JS (`renderTranslations()`), shown as flag image + dimmer/smaller italic text + small speaker button, left-aligned
- `applyCaseTranslation()` preserves internal casing (e.g., "ice cream" stays "Ice cream" not "Ice Cream") unlike `applyCase()` which lowercases everything after first char
- Language toggles in sidebar control `activeLangs` Set; all three enabled by default
- Country flag images (JPG) stored in `public/images/`: flag_fi.jpg, flag_uk.jpg (English), flag_es.jpg (Spanish), flag_se.jpg (Swedish)
- `speakText(text, lang)` is a shared TTS utility used by both the main Finnish speaker and per-translation speakers
- Navigation loops infinitely: Previous at beginning picks new random item (prepends to history), Next after all shown resets shownItems set
- History array tracks navigation for prev/next; historyIndex tracks current position
- uniqueCount tracks how many unique items have been shown (increments only on first view)
- State saved to localStorage on every change; restored on app load to resume session

## Commands
- `npm run dev` - Start Vite dev server (localhost:5173)
- `npm run build` - Production build to dist/
- `npm run preview` - Preview production build

## Session Workflow
- **After implementing new features or design changes, always update this CLAUDE.md file** to reflect the current state of the project (features, design decisions, structure changes, etc.). This keeps the file accurate for future sessions.
