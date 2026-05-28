# Typing Practice Studio

Typing Practice Studio is a local-first, authenticated QWERTY typing trainer designed for focused daily practice, performance tracking, and report export.

## Highlights

- Profile-based local authentication using name + PIN.
- Custom favicon and app-brand metadata for browser tabs and install surfaces.
- Multiple training modes:
  - Lesson-based drills.
  - Dynamic direct practice with changing text each session.
  - Custom text practice.
- Time-scaled test generation for longer sessions.
- Real-time performance metrics:
  - WPM
  - Raw WPM
  - Accuracy
  - Error count
  - Progress
- Session analytics:
  - Best and average scores
  - Focus keys
  - Saved history per profile
- Report exports:
  - Markdown report (`.md`)
  - Word-compatible report (`.doc`)
  - Raw JSON records (`.json`)

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (no framework dependency)
- Browser `localStorage` and `sessionStorage` for local persistence

## Project Structure

```text
.
|-- app.js
|-- favicon.svg
|-- index.html
|-- site.webmanifest
|-- styles.css
`-- README.md
```

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/srohithadithya/typing-practice-studio.git
cd typing-practice-studio
```

2. Launch the app:
   - Open `index.html` directly in your browser.

No package install is required.

## Usage

1. Open the app and sign in with:
   - Profile name
   - 4+ digit PIN
2. Select a mode and test duration.
3. Start typing in the input area.
4. Review live metrics and saved analysis on the right panel.
5. Export reports in Markdown, Word, or JSON format.

## Authentication Model

- Authentication is local to the browser session.
- Profile PIN values are hashed before being stored.
- No backend server is required.

## Data Persistence

All data is saved in browser storage:

- Profiles and hashed PIN metadata in `localStorage`.
- Session history in `localStorage`.
- Active profile in `sessionStorage`.

## Performance Notes

- Prompt rendering uses a moving text window for smooth performance during long tests.
- Session generation is seeded for reliable dynamic variability.

## Roadmap

- Add import of previously exported JSON history.
- Add per-key heatmap visualization.
- Add optional cloud sync mode.
- Add multiplayer challenge sessions.

## License

This project is currently unlicensed. Add a license file before production or distribution.
