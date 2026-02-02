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
  main.js          - App logic: session state, screen management, event listeners, TTS
  words.js         - Word database (~550 Finnish words with EN/ES/SV translations)
  sentences.js     - Sentence database (~105 Finnish sentences with EN/ES/SV translations)
  hyphenation.js   - Finnish syllabification algorithm
  style.css        - All styling (gradient background, responsive, toggle switches)
index.html         - Single HTML entry point with three screens
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
- **Compact toolbar**: Fixed top bar with hamburger button and session counter (visible during word/done screens)
- **Text-to-speech**: Browser SpeechSynthesis API reads Finnish (fi-FI), English (en-US), Spanish (es-ES), and Swedish (sv-SE) at rate 0.8; main speaker for Finnish, small per-row speakers for translations
- **Random order**: Items shown randomly without repetition within a session
- **Session counter**: Tracks how many items have been shown (displayed in toolbar)
- **Responsive design**: Works on mobile (480px breakpoint), tablet (769px+), and desktop

## UI Structure (3 screens + toolbar/sidebar)
1. **Start screen** (`#start-screen`): Mode selection + difficulty selection
2. **Word/Sentence screen** (`#word-screen`): Display area, speak button, next/back
3. **Done screen** (`#done-screen`): Completion message with restart option
4. **Toolbar** (`#toolbar`): Fixed top bar with hamburger menu + counter (visible on word/done screens)
5. **Sidebar** (`#sidebar`): Slide-out settings panel with uppercase toggle, hyphenation toggle, category filters, and language toggles

## Key Design Decisions
- Words without hyphenation always fit on one line (auto font-size shrinking via JS)
- Sentences without hyphenation wrap at word boundaries only (never mid-word)
- Hyphenated text can break at hyphen positions (natural CSS break points)
- TTS always speaks the original text (not the hyphenated form)
- All UI text is in Finnish
- Uppercase is the default display mode; CSS `text-transform: uppercase` handles UI elements, JS `applyCase()` handles word/sentence content
- When uppercase is off, `capitalize-mode` class on body removes `text-transform` from all elements; JS applies sentence-case (first letter uppercase, rest lowercase)
- HTML button/label text is written in capitalized form (e.g., "Seuraava" not "SEURAAVA"); CSS uppercases it when needed
- Toolbar and sidebar are outside `#app` to allow fixed positioning independent of the centered app container
- Category filters section is hidden in sidebar when in sentences mode
- Translation data uses `translation` (EN), `translation_es` (ES), `translation_sv` (SV) fields on each item
- Translations are rendered dynamically via JS (`renderTranslations()`), shown as flag image + dimmer/smaller italic text + small speaker button, left-aligned
- `applyCaseTranslation()` preserves internal casing (e.g., "ice cream" stays "Ice cream" not "Ice Cream") unlike `applyCase()` which lowercases everything after first char
- Language toggles in sidebar control `activeLangs` Set; all three enabled by default
- Country flag images (JPG) stored in `public/images/`: flag_fi.jpg, flag_uk.jpg (English), flag_es.jpg (Spanish), flag_se.jpg (Swedish)
- `speakText(text, lang)` is a shared TTS utility used by both the main Finnish speaker and per-translation speakers

## Commands
- `npm run dev` - Start Vite dev server (localhost:5173)
- `npm run build` - Production build to dist/
- `npm run preview` - Preview production build

## Session Workflow
- **After implementing new features or design changes, always update this CLAUDE.md file** to reflect the current state of the project (features, design decisions, structure changes, etc.). This keeps the file accurate for future sessions.
