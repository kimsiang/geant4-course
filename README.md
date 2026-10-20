# Geant4 2.0 · Course pages

**A standalone, bilingual online course: twelve weekly labs that take students from a 50-line Python Monte Carlo to a virtual experiment they can defend.**

By the Muon Physics Group, Tsung-Dao Lee Institute, Shanghai Jiao Tong University.

🌐 **Site:** https://kimsiang.github.io/geant4-course/

**中文简介** · 这是一门独立完整的 Geant4 2.0 双语在线课程，共 12 周，从一个 Python 蒙特卡罗小程序开始，一直到学生能够答辩的虚拟实验。每周一页，可在英文、中文或中英对照之间切换。每页包含学习目标、讲义、三维事例动画、交互模型、可运行的 Geant4 代码及预期输出、自测题、常见错误，以及一张可分享的动图；左侧目录标出每一项的类型和预计时间，学习进度保存在浏览器中。页面上的物理数字都来自真实的 Geant4 11.4 运行。

---

## Contents

- [What a week looks like](#what-a-week-looks-like)
- [Event displays and figures](#event-displays-and-figures)
- [Course map](#course-map)
- [Repository layout](#repository-layout)
- [For students: running the code](#for-students-running-the-code)
- [How the numbers on the pages were produced](#how-the-numbers-on-the-pages-were-produced)
- [Validation notes](#validation-notes)
- [For maintainers](#for-maintainers)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Access from mainland China](#access-from-mainland-china)
- [Design](#design)
- [Credits and licence](#credits-and-licence)

---

## New to particle physics?

Students from civil engineering, geology and other fields should start with the **[background primer](primer.html)** (about 45 minutes). It explains what a muon is, where cosmic muons come from, the units (GeV, g/cm², m.w.e.), how muons lose energy in rock, how absorption and scattering muography work, and how a muography project maps onto the weeks of the course, with a bilingual glossary. Every week page also opens with a plain-language **background** section and a note on how that week is used in muography projects.

Before Week 2, every student installs Geant4 with **[Week 0 · Set up your computer](setup.html)** (about two hours).

Suggested path for muography students: core Weeks 1–8, 11 and 12; skim Week 9; Week 10 (muon spin, μSR) is optional.

## What a week looks like

Every week page is laid out like a lesson player on a MOOC platform, so students always know where they are and how long is left:

- a sticky **top bar** with the week, a progress bar and the language switch;
- a left **item navigator** listing every item with its type (reading, 3D display, interactive, lab, quiz, checklist), a time estimate and a completion tick; on phones and tablets it opens as a drawer;
- **Mark as complete** and **Next** at the end of each item (labs and quizzes complete themselves when every step is ticked or every question answered);
- a **progress card** at the end of the week (items done, quiz score, lab steps, time left) and a button to the next week.

The items are:

| Section | What it contains |
|---|---|
| **Background** | Plain-language explainers for non-physicists, and a "for muography projects" note |
| **Event display** | A 3D animated event display (Weeks 1, 2, 3, 5, 7, 10), labelled **GEANT4 11.4 DATA** or **TOY** |
| **Figures** | One or two bilingual diagrams per page (detector layouts, flowcharts, a real Bethe–Bloch curve) |
| **Goals and stage** | 3–5 learning goals, and the course stage: See → Measure → Understand → Build → Trust |
| **Lesson** | Numbered by week (Definition 4.1, Eq. (4.1), …): definitions, theorems, worked examples and pitfalls, with key terms in both languages |
| **Interactive toy** | A small in-browser model of the week's idea, labelled as a toy, with its approximations stated |
| **Hands-on lab** (Lab N or Lab N.k) | Real Geant4 C++, macros and Python, with the expected output from our own runs |
| **Self-check** | 5–6 questions; every answer explains why |
| **Common errors** | `G4Exception`-style boxes listing the mistakes that cost students days |
| **Review notes** | A short checklist before moving on |
| **Share** | A GIF of the week's result, sized for social media |

The language toggle (EN · 中文 · EN+中) and students' progress are kept in their own browser. Nothing is sent anywhere.

The **course home** (`index.html`) has the course summary, what students will learn, the skills they gain, the two study paths (physics and muography), a syllabus accordion that lists every item of every week with its time, overall progress with a **Resume** button, the instructor and an FAQ.

## Event displays and figures

Eight animated 3D event displays, in the style of a live detector monitor: glowing tracks drawn along a timeline, detector elements that flash when hit, a live readout in the corner, slow auto-rotation, and **Play / Next event / Rotate** buttons. Each display has a corner badge saying where its tracks come from.

| Page | Display | Source |
|---|---|---|
| index, primer | Muography of a hill with a hidden cavity: muons through rock, more of them through the void | TOY (PDG standard-rock range, E⁻²·⁷ spectrum, cos²θ) |
| primer | Cosmic-ray air shower from ~15 km down to sea level | TOY (schematic) |
| Week 1 | Two-layer scintillator telescope; hit times from path length | TOY |
| Week 2 | 100 MeV π⁻: π → μ ν decays and through-going pions | **Geant4 11.4 data** from `pion.mac` |
| Week 3 | Muon steps through lead, with δ-rays and the process name of each step | **Geant4 11.4 data** (2D x–z steps) |
| Week 5 | Coincidence trigger: two counters, noise pulses, a 20 ns window | TOY |
| Week 7 | Tracker–magnet–tracker spectrometer at 1–20 GeV/c, with the two-line momentum fit | **Geant4 11.4 data** (plane crossings) |
| Week 10 | Muon spin precessing in a transverse field, positrons emitted preferentially along the spin | TOY (uses γμ/2π = 135.5388 MHz/T and the a = 1/3 averaged asymmetry) |

The displays start only when scrolled into view and pause when off-screen or when the tab is hidden. With *reduced motion* set in the operating system, a still frame is shown and nothing plays until the student presses Play. Without WebGL, or if three.js fails to load, the matching GIF in `media/evd-*.gif` is shown instead. On touch screens rotation is off by default so the page scrolls normally.

The fifteen static figures are inline SVG, drawn from `tools/svgfigs.py`, and follow the page colours, the light/dark theme and the language toggle. On phones a figure scrolls sideways inside its frame, not the page.

## Course map

| Week | Title | Stage | Interactive toy | Hands-on |
|---|---|---|---|---|
| [01](week01.html) | A Monte Carlo primer | See | Fire a two-layer telescope; watch the error bar shrink as 1/√N | Run, validate and break a Python transmission estimate, then give it a cos²θ sky |
| [02](week02.html) | Run, Event, Track, Step | See | Fire events; watch tracks end at a wall or a decay | Build the first Geant4 app, change the gun four ways, count decays |
| [03](week03.html) | Geometry, materials and steps | See | Change the material and count how often the muon is interrupted | Place a block, check overlaps, print steps, scan six materials |
| [04](week04.html) | Energy loss and Bethe–Bloch | Measure | Move along the Bethe–Bloch curve; most probable value vs mean | Five energies × 10⁴ events, compared with the formula |
| [05](week05.html) | From energy deposit to a hit | Measure | Readout chain and two-layer trigger knobs | Sensitive detector, coincidence trigger, noise, digitizer |
| [06](week06.html) | Physics lists and production cuts | Understand | Slide the range cut and watch where the energy goes | Secondary census, cut scan, physics-list swap |
| [07](week07.html) | Momentum from a magnetic field | Understand | B field, plane resolution and momentum vs σp/p | Tracker–magnet–tracker spectrometer, fringe-field map, integrator check |
| [08](week08.html) | The full analysis chain | Build | Break the data chain one link at a time | Multithreaded merged ntuples, read without Geant4, DAQ-parity decoder |
| [09](week09.html) | musrSim and the t1 tree | Build | Type a musrSim macro and see the geometry it builds | Build musrSim, analyse the t1 tree with uproot/awkward, production jobs |
| [10](week10.html) | Transverse-field μSR capstone | Build | Field, polarization, counters, field spread → asymmetry fit | Measure 10 mT with muon spin; no-spin control; f vs B scan |
| [11](week11.html) | Debug and validate | Trust | Walk a debugging tree through six real broken runs; validation-ladder calculator | Fault lab (six one-line bugs) and dE/dx benchmark against PDG |
| [12](week12.html) | Proposal and defence | Trust | Feasibility planner (events, CPU, systematic floor); defence-grade weights | Proposal, pilot run, tagged repository, reproducibility check, rehearsal |

## Repository layout

```
.
├── index.html            course home: summary, outcomes, syllabus, progress, FAQ
├── primer.html           background primer for engineers and geoscientists
├── setup.html            Week 0: install Geant4 11.4 + datasets (conda-forge, container, WSL2)
├── Dockerfile            course container: Geant4 11.4 from source, datasets, Python stack
├── .devcontainer/        VS Code "Reopen in Container" using the same Dockerfile
├── requirements.txt      pinned Python packages for the analysis parts
├── downloads/            generated by tools/zip_code.py: weekNN-code.zip and geant4-course-code.zip
├── landing.html          course landing / sign-up page
├── week01.html … week12.html
├── assets/
│   ├── course.css        shared style: colours, typography, light/dark themes
│   ├── course.js         language toggle, week manifest, ROOT-style plots, quiz engine,
│   │                     copy buttons, item navigator + progress, course-home syllabus
│   ├── syllabus.js       generated by tools/shell.py: every page's items, types and times
│   ├── week01.js …       each week's toy model and self-check
│   ├── evdisplay.js      3D event-display engine (three.js + bloom, timeline, HUD, controls)
│   ├── evd-scenes.js     the eight scenes (index, primer, Weeks 1, 2, 3, 5, 7, 10)
│   ├── evd-data.js       real Geant4 tracks for Weeks 2, 3 and 7 (≈ 38 KB)
│   ├── fonts/            self-hosted IBM Plex (woff2, latin + latin-ext + greek), fonts.css, OFL licence
│   └── vendor/three/     self-hosted three.js r128 and its seven example add-ons (MIT licence)
├── media/                share GIFs (stills/ = first frames for reduced motion); evd-*.gif are the event-display fallbacks
├── feedback/             student questionnaire (reusable with real cohorts)
├── code/weekNN/          everything students compile and run that week
│   ├── CMakeLists.txt, weekNN.cc, include/, src/    Geant4 application (Weeks 2–8, 10)
│   ├── *.mac                                       macros
│   └── *.py, *.sh                                  analysis and driver scripts
└── tools/
    ├── fill_code.py      copies code/ files into the <pre data-src="…"> blocks of a page
    ├── background.py     writes the "background" section of every week page (edit the text here)
    ├── svgfigs.py        the fifteen static SVG figures and their bilingual captions
    ├── figures.py        inserts figures and event displays into the pages (re-runnable)
    ├── shell.py          wraps every page in the player shell (top bar, navigator, items,
    │                     progress card, lab download link, self-hosted fonts) and writes
    │                     assets/syllabus.js (re-runnable)
    ├── zip_code.py       builds downloads/ from code/ (re-runnable, reproducible zips)
    └── make_weekNN_gif.py  regenerates that week's share GIF
```

The code shown on a page is **inserted from the files in `code/`** by `tools/fill_code.py`, so what students copy is exactly what was compiled and run.

## For students: running the code

### Software

Students install everything by following **[Week 0 · Set up your computer](setup.html)**: conda-forge (no administrator rights; Linux, macOS, WSL2), the course container (`Dockerfile`, or VS Code *Reopen in Container*), or Windows through WSL2, with mainland-China mirrors. The recipes follow the standard conda-forge packaging and the Geant4 install guide; **they have not yet been tested end to end by the course team on every OS — run each route once before a cohort starts.**

| Weeks | You need |
|---|---|
| 1 | Python 3.9+ and NumPy |
| 2–8, 10–12 | **Geant4 11.4** (C++17, CMake ≥ 3.16), with its datasets; Python with `numpy`, `scipy`, `matplotlib`, `uproot`, `awkward` (pinned in `requirements.txt`). ROOT is not needed. |
| 9 and the musrSim parts of 10 | **Geant4 10.7.x + ROOT** for musrSim: a second conda environment (see the setup page) or a CVMFS view such as `source /cvmfs/sft.cern.ch/lcg/views/LCG_101/x86_64-centos7-gcc11-opt/setup.sh`. Keep this environment separate from 11.4. |
| 12 | `git`, and the environment of your own project |

```bash
pip install -r requirements.txt
geant4-config --version          # expect 11.4.x for the core weeks
geant4-config --check-datasets   # every dataset installed
```

Every lab page links its code as a zip (`downloads/weekNN-code.zip`; all weeks in `downloads/geant4-course-code.zip`), so students do not have to paste files one by one.

### Building a week's application

```bash
cd code/week05
mkdir build && cd build
cmake .. && make -j4
./week05 trigger.mac         # macros and scripts are copied into build/ by CMake
```

Run without a macro (`./week05`) to open the interactive viewer, which is for checking a few events by eye. Use macros for any run where you need statistics.

## How the numbers on the pages were produced

Every expected output, every fitted value and every GIF that shows physics comes from a **real run of Geant4 11.4.p01**, not invented. Our build machine could not download the Geant4 data files, so runs used a small **test physics list** that needs none of them. It has standard EM processes (photoelectric, Compton, conversion, multiple scattering, ionisation, bremsstrahlung, annihilation, muon processes) plus decay, with the same 0.7 mm production cut as `FTFP_BERT`. Pages label these outputs accordingly. Students build with the real `FTFP_BERT` and should agree within the stated uncertainties; where they don't, that is worth a question in class.

Two exceptions are marked on their pages:

- **Week 9 (musrSim)** needs Geant4 10.7 and ROOT, which we could not build. Its commands and messages are taken from the musrsim-sms source, not from a run. The Python analysis was run on a **synthetic** t1 file with the same branches, units and −1000 sentinel values.
- **Week 12's `repro_check.sh`** was not run end to end, because there was no CMake-installed Geant4. Its inputs (three Week 10 runs) are real.

Selected results:

| Week | Result |
|---|---|
| 4 / 11 | Mean muon dE/dx in 10 cm plastic agrees with the path-averaged PDG table to **≤ 0.4%** from 100 MeV to 10 GeV once the histogram is wide enough. With statistical errors only the pulls are up to about 2σ; the agreement in σ depends on an *assumed* 1% reference uncertainty, and Week 11 now shows both |
| 7 | Two-line reconstruction: σp/p from 0.31% to 1.13% over 1–20 GeV; a single quadratic fit overestimates p by 47–61% |
| 10 | Precession at 10 mT: f = 1.3573 ± 0.0020 MHz → B = 10.01 mT; scan slope **135.46 ± 0.06 MHz/T** (γμ/2π = 135.539) |
| 11 | Of six one-line faults, five run to completion without an error; one aborts at initialisation |

## Validation notes

Where Geant4 11.4 or musrSim behaves differently from what older tutorials and course notes say, the page states the behaviour we measured, in a labelled box (`Course-Wxx-…`). The ones a maintainer should know about:

- **Week 2 / 11:** A gun placed outside the world is *not* stopped by Geant4 11.4. The muon is transported through air that does not exist, with no warning. A gun at −1 m in a 1 m world is outside it, which is why the pages use −0.4 m.
- **Week 7:** A single quadratic small-deflection fit biases momentum by ~50%; the page uses a two-line fit. The default stepper in 11.4 is Dormand–Prince 4/5, not ClassicalRK4.
- **Week 8:** Ntuple merging and `CloseFile()` failure modes, as they actually behave in 11.4.
- **Week 9:** musrSim's seed offset only works with `/musr/run/randomOption 1`. `data/` must exist before the run. The run number comes from `atoi()` of the macro file name.
- **Week 10 ⚠:** musrsim-sms (commit 767208f) registers only `G4DecayPhysics`, whose `G4MuonDecayChannel` *neglects muon polarization* in both Geant4 10.7.2 and 11.4. As written, the TF-μSR asymmetry would be flat. Fix: `physicsList->RegisterPhysics(new G4SpinDecayPhysics());`. This comes from reading the source; it has not yet been tested in musrSim.
- **Week 11:** The tempting fix for Fault 2 still thresholds individual steps, which Week 5 forbids. Fault 3 is a fatal error in 11.4, not silent.
- **Week 12:** In multithreaded runs `G4DecayWithSpin` writes the muon spin into a decay table that all threads share. Results are then not bit-for-bit reproducible, although the physics is unaffected at our precision. Compare headline numbers within a statistical tolerance.

## For maintainers

### Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

### Change the code on a page

1. Edit the file under `code/weekNN/`, then compile and run it.
2. Copy the new code into the page:
   ```bash
   python3 tools/fill_code.py weekNN.html
   ```
3. If the expected output changed, paste the new output into the page's `<div class="code out">` block.

### Regenerate the pages after an edit

The tools are idempotent and must run in this order, because each one rewrites sections that the next one decorates:

```bash
python3 tools/background.py     # only if you edited the background text
python3 tools/figures.py        # only if you edited a figure, caption or display placement
python3 tools/shell.py          # navigator, item tags, times, download links, fonts, assets/syllabus.js
python3 tools/zip_code.py       # rebuild downloads/ whenever code/ changes
```

`shell.py` reads each section's macro-command label to decide the item type (for example `hands-on · Lab 4` is a lab, `self-check` is the quiz, `4.1 · the Bethe formula` is a reading) and estimates its time: readings at about 110 English words a minute plus 1.5 minutes per box, figure, table or equation; 10 minutes for an interactive model; 1.5 minutes per quiz question; the lab gets the rest of the week's stated study time (`≈ 2.5 h` in the hero). Change those rules at the top of `tools/shell.py`.

### Edit the background sections

The per-week background text lives in `tools/background.py`. Edit it there, then run the chain above.

### Regenerate a GIF

```bash
pip install pillow numpy uproot awkward scipy
python3 tools/make_week10_gif.py <run directory with data/tf_10mT.root>
```

Each script's docstring says which run output it reads. Weeks 1, 11 and 12 need no simulation output.

### Edit a figure or an event display

- **SVG figures:** edit `tools/svgfigs.py`, then run `python3 tools/figures.py`. It replaces everything between the `<!-- fig:NAME -->` markers on each page and can be run any number of times. Where each figure goes is set by `PLAN` in `figures.py`.
- **Event displays:** each scene is one `EVD.scene('name', {...})` block in `assets/evd-scenes.js`. A scene has a `build()` that draws the detector and an `event(i)` that returns tracks (point lists with start and end times) and hits (position and time). The engine in `assets/evdisplay.js` handles the timeline, bloom, HUD, controls and fallbacks. Captions, with each scene's stated approximations, live in the `EVD` dictionary in `tools/figures.py`.
- **Fallback GIFs** (`media/evd-*.gif`) were recorded from the live displays in headless Chromium, 60 frames per scene. Record them again after changing a scene.

### Before a cohort starts

- Fill in the help channels at the top of `assets/course.js`: `G.support = { forum: '…', officeHours: '…', email: '…' }`. The course home's FAQ "How do I get help?" shows them; while they are empty it tells students the instructor will give them at enrolment.
- Run each install route on the setup page once on a clean machine (conda-forge on Linux/macOS, the container, WSL2) and fix anything that has drifted.

### Add, rename or hide a week

The week list lives in the manifest at the top of `assets/course.js` (`G.weeks`). Set `live: false` to show a week as "in preparation" on the index and in the prev/next navigation.

### Conventions

- Bilingual text uses paired elements: `<span lang="en">…</span><span lang="zh-Hans">…</span>`. Every visible sentence needs both.
- Anything approximated is labelled: toy models carry a **TOY MODEL** banner and an approximations box; event displays carry a **TOY** or **GEANT4 11.4 DATA** badge.
- Code tags: `GEANT4` (toolkit API and UI commands), `MUSRSIM` (application-specific), `ANALYSIS` (ROOT/Python).
- Keep pages self-contained static files: no build step and no tracking.

## Deploying to GitHub Pages

1. **Settings → Pages → Build and deployment:** *Deploy from a branch*, branch `main`, folder `/ (root)`.
2. Add an empty `.nojekyll` file at the root so GitHub serves the files as they are, without running Jekyll.
3. `index.html` and `landing.html` carry `<meta charset="utf-8">` and the viewport meta but no `<!doctype html>`/`<head>` wrapper, because the artifact host adds those. Browsers accept this as it is; add the wrapper if your host needs it.
4. Push. The site appears at `https://kimsiang.github.io/geant4-course/` within a minute or two.

All links are relative, so the site also works from any sub-path or another static host.

> **Visibility:** On the free plan, a GitHub Pages site is public even when the repository is private. If the full course should stay with paying students, publish a preview here (landing page and Week 1) and serve the rest from a password-protected host or your LMS.

## Access from mainland China

- **Fonts and three.js are self-hosted.** IBM Plex (SIL Open Font Licence) is served from `assets/fonts/`, and three.js r128 with its add-ons from `assets/vendor/three/`, so no page loads anything from Google, cdnjs or jsDelivr. Chinese text uses the reader's system CJK font (PingFang SC, Microsoft YaHei, Noto Sans CJK).
- **Software:** the setup page gives TUNA/USTC mirrors for conda-forge and PyPI. Geant4 datasets and the container build still download from cern.ch / gitlab.cern.ch; allow time, or pre-download them once for a class.
- **Hosting:** `github.io` can be slow or unreachable. Because the site is plain static files, a mirror on a university web server or a domestic object-storage bucket needs no changes.

## Design

The pages match the course landing page (`landing.html`). Each page still reads like a Geant4 run: every item shows the macro command it stands for (`/run/initialize` for the goals, `/run/beamOn` for the interactive model, `G4Exception` for common errors).

- **Type:** IBM Plex Sans Condensed (headings), IBM Plex Sans (body), IBM Plex Mono (code), Noto Sans SC (Chinese).
- **Colour:** Geant4 visualisation convention (red = negative, green = neutral, blue = positive) on ROOT-canvas paper `#F6F7F5`. Event displays stay dark in both themes.
- **Motifs:** ROOT-style histograms with stat boxes, `G4Exception` banners, hairline tables, and dark glowing event displays.
- **Components:** design tokens (spacing, radius, elevation, colour) at the top of the v2 layer in `assets/course.css`; one inline SVG icon set (in `tools/shell.py`); buttons, chips, cards, progress bars and rings.
- **Theme:** light/dark follows the reader's system setting.
- **Accessibility:** skip link, visible focus, keyboard-operable navigator, drawer and accordions, scrollable code reachable by keyboard; the vis colours have darker "ink" shades for small text so all text meets WCAG AA. All pages pass axe-core's WCAG 2 A/AA rules in both themes.

## Credits and licence

- **Course and pages:** Kim Siang Khaw (许金祥), Tsung-Dao Lee Institute, Shanghai Jiao Tong University.
- **Software:** [Geant4](https://geant4.web.cern.ch) (Agostinelli et al., NIM A 506 (2003) 250; Allison et al., NIM A 835 (2016) 186), [ROOT](https://root.cern), [musrsim-sms](https://github.com/kimsiang/musrsim-sms), [uproot](https://github.com/scikit-hep/uproot5) and [awkward](https://github.com/scikit-hep/awkward).
- **Reference data:** Particle Data Group, *Review of Particle Physics*, Phys. Rev. D 110, 030001 (2024), including the muon energy-loss tables.

- **Origin (for maintainers):** the course grew out of the textbook *The Geant4 Laboratory* (musrSim-integrated edition) by the Muon Physics Group, TDLI/SJTU. The pages are self-contained and do not refer to it.

**Licence:** not yet chosen. Until a `LICENSE` file is added, all rights are reserved. A common split for course material is **CC BY-NC-SA 4.0** for the text and figures and **MIT** for `code/` and `tools/`.

Questions, corrections and pull requests are welcome. Open an issue in this repository.
