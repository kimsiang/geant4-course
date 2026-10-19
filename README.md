# Geant4 2.0 · Course pages

**Twelve weekly web labs that take students from a 50-line Python Monte Carlo to a virtual experiment they can defend.**

Built from the textbook *The Geant4 Laboratory* (musrSim-integrated edition) by the Muon Physics Group, Tsung-Dao Lee Institute, Shanghai Jiao Tong University.

🌐 **Site:** https://kimsiang.github.io/geant4-course/

**中文简介** · 这是 Geant4 2.0 课程的网页教材，共 12 周，从一个 Python 蒙特卡罗小程序开始，一直到学生能够答辩的虚拟实验。每周一页，可在英文、中文或中英对照之间切换。每页包含学习目标、浓缩讲义、交互玩具模型、可运行的 Geant4 代码及预期输出、自测题、常见错误，以及一张可分享的动图。页面上的物理数字都来自真实的 Geant4 11.4 运行。

---

## Contents

- [What a week looks like](#what-a-week-looks-like)
- [Course map](#course-map)
- [Repository layout](#repository-layout)
- [For students: running the code](#for-students-running-the-code)
- [How the numbers on the pages were produced](#how-the-numbers-on-the-pages-were-produced)
- [Corrections to the textbook](#corrections-to-the-textbook)
- [For maintainers](#for-maintainers)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Access from mainland China](#access-from-mainland-china)
- [Design](#design)
- [Credits and licence](#credits-and-licence)

---

## What a week looks like

Every page has the same structure, so students always know where they are.

| Section | What it contains |
|---|---|
| **Goals and stage** | 3–5 learning goals, and the course stage: See → Measure → Understand → Build → Trust |
| **Lesson** | The textbook chapter condensed, with its definitions, theorems, examples and pitfalls kept and key terms in both languages |
| **Interactive toy** | A small in-browser model of the week's idea, labelled as a toy, with its approximations stated |
| **Hands-on mission** | Real Geant4 C++, macros and Python, with the expected output from our own runs |
| **Self-check** | 5–6 questions; every answer explains why |
| **Common errors** | `G4Exception`-style boxes listing the mistakes that cost students days |
| **Review notes** | A short checklist before moving on |
| **Share** | A GIF of the week's result, sized for social media |

The language toggle (EN · 中文 · EN+中) and students' progress ticks are kept in their own browser. Nothing is sent anywhere.

## Course map

| Week | Title | Textbook | Stage | Interactive toy | Hands-on |
|---|---|---|---|---|---|
| [01](week01.html) | A Monte Carlo primer | Ch. 1 | See | Fire a two-layer telescope; watch the error bar shrink as 1/√N | Run, validate and break a Python transmission estimate, then give it a cos²θ sky |
| [02](week02.html) | Run, Event, Track, Step | Ch. 2 | See | Fire events; watch tracks end at a wall or a decay | Build the first Geant4 app, change the gun four ways, count decays |
| [03](week03.html) | Geometry, materials and steps | Ch. 3–4 | See | Change the material and count how often the muon is interrupted | Place a block, check overlaps, print steps, scan six materials |
| [04](week04.html) | Energy loss and Bethe–Bloch | Ch. 5 | Measure | Move along the Bethe–Bloch curve; most probable value vs mean | Five energies × 10⁴ events, compared with the formula |
| [05](week05.html) | From energy deposit to a hit | Ch. 6 | Measure | Readout chain and two-layer trigger knobs | Sensitive detector, coincidence trigger, noise, digitizer |
| [06](week06.html) | Physics lists and production cuts | Ch. 7 | Understand | Slide the range cut and watch where the energy goes | Secondary census, cut scan, physics-list swap |
| [07](week07.html) | Momentum from a magnetic field | Ch. 8 | Understand | B field, plane resolution and momentum vs σp/p | Tracker–magnet–tracker spectrometer, fringe-field map, integrator check |
| [08](week08.html) | The full analysis chain | Ch. 9 | Build | Break the data chain one link at a time | Multithreaded merged ntuples, read without Geant4, DAQ-parity decoder |
| [09](week09.html) | musrSim and the t1 tree | Ch. 10–11 | Build | Type a musrSim macro and see the geometry it builds | Build musrSim, analyse the t1 tree with uproot/awkward, production jobs |
| [10](week10.html) | Transverse-field μSR capstone | Ch. 12 | Build | Field, polarization, counters, field spread → asymmetry fit | Measure 10 mT with muon spin; no-spin control; f vs B scan |
| [11](week11.html) | Debug and validate | Ch. 13–14 | Trust | Walk a debugging tree through six real broken runs; validation-ladder calculator | Fault lab (six one-line bugs) and dE/dx benchmark against PDG |
| [12](week12.html) | Proposal and defence | Ch. 15–16 | Trust | Feasibility planner (events, CPU, systematic floor); defence-grade weights | Proposal, pilot run, tagged repository, reproducibility check, rehearsal |

## Repository layout

```
.
├── index.html            course index (links to all twelve weeks)
├── landing.html          course landing / sign-up page
├── week01.html … week12.html
├── assets/
│   ├── course.css        shared style: colours, typography, light/dark themes
│   ├── course.js         language toggle, week manifest + navigation, ROOT-style plots,
│   │                     quiz engine, copy buttons, progress ticks
│   └── week01.js …       each week's toy model and self-check
├── media/                share GIFs and figures (one or two per week)
├── code/weekNN/          everything students compile and run that week
│   ├── CMakeLists.txt, weekNN.cc, include/, src/    Geant4 application (Weeks 2–8, 10)
│   ├── *.mac                                       macros
│   └── *.py, *.sh                                  analysis and driver scripts
└── tools/
    ├── fill_code.py      copies code/ files into the <pre data-src="…"> blocks of a page
    └── make_weekNN_gif.py  regenerates that week's share GIF
```

The code shown on a page is **inserted from the files in `code/`** by `tools/fill_code.py`, so what students copy is exactly what was compiled and run.

## For students: running the code

### Software

| Weeks | You need |
|---|---|
| 1 | Python 3.9+ and NumPy |
| 2–8, 10–11 | **Geant4 11.4** (C++17, CMake ≥ 3.16), built with its datasets; Python with `numpy`, `scipy`, `matplotlib`, `uproot`, `awkward` |
| 9 and the musrSim parts of 10 | **Geant4 10.7.x + ROOT** for musrSim (e.g. `source /cvmfs/sft.cern.ch/lcg/views/LCG_101/x86_64-centos7-gcc11-opt/setup.sh`). Keep this environment separate from 11.4. |
| 12 | `git`, and the environment of your own project |

```bash
pip install numpy scipy matplotlib uproot awkward
geant4-config --version      # expect 11.4.x for the core weeks
```

### Building a week's application

```bash
cd code/week05
mkdir build && cd build
cmake .. && make -j4
./week05 trigger.mac         # macros and scripts are copied into build/ by CMake
```

Run without a macro (`./week05`) to open the interactive viewer, which is for checking a few events by eye. Use macros for any run where you need statistics.

## How the numbers on the pages were produced

Every expected output, every fitted value and every GIF that shows physics comes from a **real run of Geant4 11.4.p01**, not from the textbook and not invented. Our build machine could not download the Geant4 data files, so runs used a small **test physics list** that needs none of them. It has standard EM processes (photoelectric, Compton, conversion, multiple scattering, ionisation, bremsstrahlung, annihilation, muon processes) plus decay, with the same 0.7 mm production cut as `FTFP_BERT`. Pages label these outputs accordingly. Students build with the real `FTFP_BERT` and should agree within the stated uncertainties; where they don't, that is worth a question in class.

Two exceptions are marked on their pages:

- **Week 9 (musrSim)** needs Geant4 10.7 and ROOT, which we could not build. Its commands and messages are taken from the musrsim-sms source, not from a run. The Python analysis was run on a **synthetic** t1 file with the same branches, units and −1000 sentinel values.
- **Week 12's `repro_check.sh`** was not run end to end, because there was no CMake-installed Geant4. Its inputs (three Week 10 runs) are real.

Selected results:

| Week | Result |
|---|---|
| 4 / 11 | Mean muon dE/dx in 10 cm plastic agrees with the PDG table within **0.4σ** from 100 MeV to 10 GeV, once the reference is integrated along the path and the histogram is wide enough |
| 7 | Two-line reconstruction: σp/p from 0.31% to 1.13% over 1–20 GeV; the textbook's quadratic fit overestimates p by 47–61% |
| 10 | Precession at 10 mT: f = 1.3573 ± 0.0020 MHz → B = 10.01 mT; scan slope **135.46 ± 0.06 MHz/T** (γμ/2π = 135.539) |
| 11 | Of six one-line faults, five run to completion without an error; one aborts at initialisation |

## Corrections to the textbook

The pages follow the textbook but say so wherever it is wrong, outdated or missing a detail, in a labelled box (`Course-Wxx-…`). The ones a maintainer should know about:

- **Week 2 / 11:** A gun placed outside the world is *not* stopped by Geant4 11.4. The muon is transported through air that does not exist, with no warning. Ch. 13's "fixed" Fault 1 (gun at −1 m in a 1 m world) is still outside.
- **Week 7:** The quadratic small-deflection fit biases momentum by ~50%; the page uses a two-line fit. The default stepper in 11.4 is Dormand–Prince 4/5, not ClassicalRK4.
- **Week 8:** Ntuple merging and `CloseFile()` failure modes, as they actually behave in 11.4.
- **Week 9:** musrSim's seed offset only works with `/musr/run/randomOption 1`. `data/` must exist before the run. The run number comes from `atoi()` of the macro file name.
- **Week 10 ⚠:** musrsim-sms (commit 767208f) registers only `G4DecayPhysics`, whose `G4MuonDecayChannel` *neglects muon polarization* in both Geant4 10.7.2 and 11.4. As written, the TF-μSR asymmetry would be flat. Fix: `physicsList->RegisterPhysics(new G4SpinDecayPhysics());`. This comes from reading the source; it has not yet been tested in musrSim.
- **Week 11:** Ch. 13 Fault 2's "fixed" code still thresholds individual steps, which Ch. 6 forbids. Fault 3 is a fatal error in 11.4, not silent.
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

### Regenerate a GIF

```bash
pip install pillow numpy uproot awkward scipy
python3 tools/make_week10_gif.py <run directory with data/tf_10mT.root>
```

Each script's docstring says which run output it reads. Weeks 1, 11 and 12 need no simulation output.

### Add, rename or hide a week

The week list lives in the manifest at the top of `assets/course.js` (`G.weeks`). Set `live: false` to show a week as "in preparation" on the index and in the prev/next navigation.

### Conventions

- Bilingual text uses paired elements: `<span lang="en">…</span><span lang="zh-Hans">…</span>`. Every visible sentence needs both.
- Anything approximated is labelled: toy models carry a **TOY MODEL** banner and an approximations box.
- Code tags: `GEANT4` (toolkit API and UI commands), `MUSRSIM` (application-specific), `ANALYSIS` (ROOT/Python).
- Keep pages self-contained static files: no build step and no tracking.

## Deploying to GitHub Pages

1. **Settings → Pages → Build and deployment:** *Deploy from a branch*, branch `main`, folder `/ (root)`.
2. Add an empty `.nojekyll` file at the root so GitHub serves the files as they are, without running Jekyll.
3. Check that `index.html` starts with a complete document head: `<!doctype html>`, `<html lang="en">`, `<meta charset="utf-8">` and the viewport meta. The artifact version was written without one, because that host adds it. GitHub Pages does not, and without `charset` Chinese text can display wrongly.
4. Push. The site appears at `https://kimsiang.github.io/geant4-course/` within a minute or two.

All links are relative, so the site also works from any sub-path or another static host.

> **Visibility:** On the free plan, a GitHub Pages site is public even when the repository is private. If the full course should stay with paying students, publish a preview here (landing page and Week 1) and serve the rest from a password-protected host or your LMS.

## Access from mainland China

- **Fonts:** The pages load IBM Plex and Noto Sans SC from Google Fonts, which is blocked in mainland China. Pages still work with system fonts, but the first load can stall. To fix this, download the font files into `assets/fonts/` and replace the Google `<link>` tags with local `@font-face` rules. Both families are under the SIL Open Font Licence, so this is allowed.
- **Hosting:** `github.io` can be slow or unreachable. Because the site is plain static files, a mirror on a university web server or a domestic object-storage bucket needs no changes.

## Design

The pages match the course landing page (`landing.html`). Each page reads like a Geant4 run: the left rail shows the macro command for each section.

- **Type:** IBM Plex Sans Condensed (headings), IBM Plex Sans (body), IBM Plex Mono (code), Noto Sans SC (Chinese).
- **Colour:** Geant4 visualisation convention (red = negative, green = neutral, blue = positive) on ROOT-canvas paper `#F6F7F5`. Event displays stay dark in both themes.
- **Motifs:** ROOT-style histograms with stat boxes, `G4Exception` banners, hairline tables.
- **Theme:** light/dark follows the reader's system setting.

## Credits and licence

- **Textbook:** *The Geant4 Laboratory* (musrSim-integrated edition), Muon Physics Group, TDLI/SJTU.
- **Course and pages:** Kim Siang Khaw (许金祥), Tsung-Dao Lee Institute, Shanghai Jiao Tong University.
- **Software:** [Geant4](https://geant4.web.cern.ch) (Agostinelli et al., NIM A 506 (2003) 250; Allison et al., NIM A 835 (2016) 186), [ROOT](https://root.cern), [musrsim-sms](https://github.com/kimsiang/musrsim-sms), [uproot](https://github.com/scikit-hep/uproot5) and [awkward](https://github.com/scikit-hep/awkward).
- **Reference data:** Particle Data Group, *Review of Particle Physics*, Phys. Rev. D 110, 030001 (2024), including the muon energy-loss tables.

**Licence:** not yet chosen. Until a `LICENSE` file is added, all rights are reserved. A common split for course material is **CC BY-NC-SA 4.0** for the text and figures and **MIT** for `code/` and `tools/`.

Questions, corrections and pull requests are welcome. Open an issue in this repository.
