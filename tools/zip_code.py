"""Build the per-week code downloads linked from every lab:
downloads/weekNN-code.zip (one folder weekNN/ inside), downloads/muography-code.zip (starter + scattering) and downloads/geant4-course-code.zip (all weeks).

Leaves out what students do not need: build artefacts, __pycache__, the combined macros.txt
the pages display (each macro is also its own file), and data files used only to draw the
site's figures and event displays.

Usage: python3 tools/zip_code.py   (run after tools/shell.py)
"""
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"build", "__pycache__", ".git"}
SKIP_FILES = {"macros.txt", "pion_tracks.json", "pb_tracks_40ev.json", "edep_hists.json", "run_c_both_above.json"}
FIXED_TIME = (2026, 1, 1, 0, 0, 0)  # reproducible zips: the same files give the same bytes


def files_of(week_dir):
    for p in sorted(week_dir.rglob("*")):
        if p.is_dir() or p.name in SKIP_FILES or p.suffix == ".pyc":
            continue
        if any(part in SKIP_DIRS for part in p.relative_to(week_dir).parts):
            continue
        yield p


def add(z, p, arcname):
    info = zipfile.ZipInfo(arcname, FIXED_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = (0o755 if p.suffix in (".sh", ".py") else 0o644) << 16
    z.writestr(info, p.read_bytes())


def main():
    out = ROOT / "downloads"
    out.mkdir(exist_ok=True)
    weeks = sorted(d for d in (ROOT / "code").iterdir() if d.is_dir() and (d.name.startswith("week") or d.name == "muography"))
    with zipfile.ZipFile(out / "geant4-course-code.zip", "w") as allz:
        for d in weeks:
            n = 0
            with zipfile.ZipFile(out / f"{d.name}-code.zip", "w") as z:
                for p in files_of(d):
                    arc = f"{d.name}/{p.relative_to(d).as_posix()}"
                    add(z, p, arc)
                    add(allz, p, f"geant4-course-code/{arc}")
                    n += 1
            print(f"{d.name}-code.zip  {n:3d} files  {(out / f'{d.name}-code.zip').stat().st_size // 1024:5d} KB")
    print(f"geant4-course-code.zip  {(out / 'geant4-course-code.zip').stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
