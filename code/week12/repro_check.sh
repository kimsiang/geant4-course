#!/bin/bash
# repro_check.sh -- what an evaluator does before your defence: clone, rebuild from scratch,
# run your macro, and compare your headline number with the one in your slides.
# Usage: bash repro_check.sh <git-url> <tag> <app-dir> <macro> "<analysis command>" <expected> <tolerance> [headline-regex]
#   headline-regex  an extended regex for the ONE output line that carries your headline number,
#                   written as  <name> = <value> +/- <error>.  Default: the first such line.
#   EXE=<name>      environment variable: the executable to run, if the build makes more than one.
# Example (Week 10 as a defence package, headline "f   = 1.3573 +/- 0.0020 MHz"):
#   bash repro_check.sh https://github.com/you/tf-musr.git v1.0 week10 tf.mac \
#        "python3 asymmetry.py data/tf_10mT.root" 1.3573 0.0040 '^f +='
# Example (a muography project printing "ratio = 0.873 +/- 0.012"):
#   bash repro_check.sh https://github.com/you/void.git v1.0 app run.mac \
#        "python3 analyse.py data/run.root" 0.873 0.024 '^ratio +='
set -euo pipefail
URL=$1; TAG=$2; APP=$3; MACRO=$4; ANALYSIS=$5; EXPECTED=$6; TOL=$7
HEADLINE=${8:-'^[A-Za-z_][A-Za-z0-9_()/ ]*= *[-+0-9.eE]+ *\+/- '}
WORK=$(mktemp -d)
echo "== environment"
geant4-config --version
root-config --version 2>/dev/null || echo "ROOT: not installed (uproot analysis only)"
python3 -c "import uproot, awkward, scipy; print('uproot', uproot.__version__, '| awkward', awkward.__version__, '| scipy', scipy.__version__)"

echo "== clean checkout of $TAG"
git clone -q --branch "$TAG" --depth 1 "$URL" "$WORK/src"
git -C "$WORK/src" log -1 --format='commit %H  %ad'

echo "== build from scratch (outside the source tree)"
cmake -S "$WORK/src/$APP" -B "$WORK/build" -DCMAKE_BUILD_TYPE=Release > "$WORK/cmake.log"
cmake --build "$WORK/build" -j4 > "$WORK/build.log"

echo "== run"
cd "$WORK/build" && mkdir -p data
if [ -n "${EXE:-}" ]; then RUN="./$EXE"; else
  RUN=$(find . -maxdepth 1 -type f -perm -u+x ! -name '*.sh' ! -name '*.py' ! -name '*.so' | head -1); fi
[ -n "$RUN" ] || { echo "FAIL: no executable found in the build (set EXE=<name>)"; exit 1; }
echo "running $RUN $MACRO"
"$RUN" "$MACRO" > run.log 2>&1
grep -E "seed|Run complete|Field at" run.log || true

# The build and the run must not write into the repository: everything they produce belongs in
# build/. A dirty tree here means your code writes next to its sources, so a second run differs.
test -z "$(git -C "$WORK/src" status --porcelain)" || {
  echo "FAIL: building or running changed the checked-out tree:"; git -C "$WORK/src" status --short; exit 1; }

echo "== analysis"
OUT=$(bash -c "$ANALYSIS")
echo "$OUT"
LINE=$(echo "$OUT" | grep -E -m1 -- "$HEADLINE" || true)
[ -n "$LINE" ] || { echo "FAIL: no output line matches the headline pattern: $HEADLINE"; exit 1; }
python3 - "$LINE" "$EXPECTED" "$TOL" <<'EOF'
import re, sys
line, exp, tol = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
got = float(re.search(r"=\s*([-+0-9.eE]+)", line).group(1))
ok = abs(got - exp) <= tol
print(f"headline: {line.strip()}")
print(f"got {got}, slides say {exp}, tolerance {tol} -> {'REPRODUCED' if ok else 'NOT REPRODUCED'}")
sys.exit(0 if ok else 1)
EOF
