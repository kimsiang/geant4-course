#!/bin/bash
# repro_check.sh -- what an evaluator does before your defence: clone, rebuild from scratch,
# run your macro, and compare your headline number with the one in your slides.
# Usage: bash repro_check.sh <git-url> <tag> <app-dir> <macro> "<analysis command>" <expected> <tolerance>
# Example (Week 10 as a defence package):
#   bash repro_check.sh https://github.com/you/tf-musr.git v1.0 week10 tf.mac \
#        "python3 asymmetry.py data/tf_10mT.root" 1.3573 0.0040
set -euo pipefail
URL=$1; TAG=$2; APP=$3; MACRO=$4; ANALYSIS=$5; EXPECTED=$6; TOL=$7
WORK=$(mktemp -d)
echo "== environment"
geant4-config --version
root-config --version 2>/dev/null || echo "ROOT: not installed (uproot analysis only)"
python3 -c "import uproot, awkward, scipy; print('uproot', uproot.__version__, '| awkward', awkward.__version__, '| scipy', scipy.__version__)"

echo "== clean checkout of $TAG"
git clone -q --branch "$TAG" --depth 1 "$URL" "$WORK/src"
git -C "$WORK/src" log -1 --format='commit %H  %ad'
test -z "$(git -C "$WORK/src" status --porcelain)" || { echo "FAIL: tree not clean"; exit 1; }

echo "== build from scratch"
cmake -S "$WORK/src/$APP" -B "$WORK/build" -DCMAKE_BUILD_TYPE=Release > "$WORK/cmake.log"
cmake --build "$WORK/build" -j4 > "$WORK/build.log"

echo "== run"
cd "$WORK/build" && mkdir -p data
EXE=$(find . -maxdepth 1 -type f -perm -u+x ! -name '*.sh' | head -1)
"$EXE" "$MACRO" > run.log 2>&1
grep -E "seed|Run complete|Field at" run.log || true

echo "== analysis"
OUT=$($ANALYSIS)
echo "$OUT"
GOT=$(echo "$OUT" | grep -E "^f +=" | awk '{print $3}')
python3 - "$GOT" "$EXPECTED" "$TOL" <<'EOF'
import sys
got, exp, tol = map(float, sys.argv[1:])
ok = abs(got - exp) <= tol
print(f"headline: got {got}, slides say {exp}, tolerance {tol} -> {'REPRODUCED' if ok else 'NOT REPRODUCED'}")
sys.exit(0 if ok else 1)
EOF
