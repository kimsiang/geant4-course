# Geant4 2.0 — course pages

Web training pages built from *The Geant4 Laboratory* (musrSim-integrated edition).
Visual style matches the landing page (`landing.html`).

- `index.html` — course index (artifact main page; no doctype, the host wraps it)
- `weekNN.html` — one page per week
- `assets/course.css`, `assets/course.js` — shared style, language toggle (EN / 中文 / both), ROOT-style plots, quiz engine, navigation manifest
- `assets/weekNN.js` — that week's toy model and self-check
- `media/` — GIFs (regenerate with `tools/`)
- `code/weekNN/` — the scripts students run; expected outputs on the pages were produced from these

Preview locally: `python3 -m http.server` and open http://localhost:8000/week01.html
