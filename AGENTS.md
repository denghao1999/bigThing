# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is "大事件" (bigThing), a static HTML/CSS/JavaScript frontend for a Chinese-language blog/content management admin panel. There is **no build step** and **no backend** in this repo — all API calls go to a hardcoded remote server (`http://www.liulongbin.top:3007`) defined in `assets/js/baseAPI.js`.

### Running the dev server

Serve the repo root with any static file server. The simplest option:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/login.html` (login/register), `http://localhost:8000/index.html` (admin dashboard), or `http://localhost:8000/home/snake.html` (snake game).

Pages use absolute paths (`/assets/…`, `/home/…`), so a file server rooted at the repo is required — `file://` protocol will not work.

### Key caveats

- **Remote API**: Login, registration, article management, and user profile features depend on the external API at `http://www.liulongbin.top:3007`. This server may be unreachable from cloud VMs. The snake game and dashboard (with local/demo data) work fully offline.
- **No automated tests**: `package.json` has no real test script (`echo "Error: no test specified" && exit 1`).
- **No linter configured**: No ESLint, Prettier, or other linting tools are set up.
- **No build step**: Everything is plain HTML/JS/CSS served as static files.
- **Lifecycle demo page** (`home/lifecycle-model-demo.html`) has a pre-existing JS syntax error in `assets/js/home/lifecycle-model-demo.js` that prevents Vue from mounting.
- **Snake game** may end immediately on start due to a pre-existing bug where the snake spawns at the canvas edge.
