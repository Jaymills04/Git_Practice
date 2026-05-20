# Simple Browser Tetris

A minimal Tetris game that runs in any browser tab. No build step, no dependencies — just HTML, CSS, and JavaScript.

## Play locally

**Option 1 — open the file**

Double-click `index.html` or open it from your browser (File → Open). Some browsers work best with a local server (Option 2).

**Option 2 — local server (recommended)**

```bash
cd tetris
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Controls

| Action        | Keyboard              | On-screen   |
|---------------|-----------------------|-------------|
| Move left     | ← or A                | ◀           |
| Move right    | → or D                | ▶           |
| Soft drop     | ↓ or S                | ▼           |
| Rotate        | ↑, W, or X            | ↻           |
| Hard drop     | Space                 | ⬇⬇          |
| Pause / resume| P                     | Pause       |
| Restart       | R (when game over)    | Restart     |

To start, press any key or tap a control button.

## Features

- 7 standard tetrominoes, each with its own color
- Score, level, and lines cleared
- Next-piece preview
- Levels speed up every 10 lines cleared
- Pause and restart
- Keyboard and touch-friendly on-screen buttons

## Deploy for public use (GitHub Pages)

1. Push this `tetris` folder to a GitHub repository.
2. In the repo: **Settings → Pages**.
3. Set source to your branch and folder (e.g. `/tetris` on `main`, or move files to repo root and use `/`).
4. Save; GitHub gives you a public URL like `https://yourusername.github.io/repo-name/`.
5. Share that link — anyone can play in a browser tab.

No backend, API keys, or cookies required.

## Files

- `index.html` — page layout and controls
- `style.css` — layout and responsive styling
- `game.js` — game logic and rendering
