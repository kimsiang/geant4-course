#!/bin/bash
# Lab 9: split one macro into independent jobs, with seeds that actually differ.
# The seed offset (3rd argument) only takes effect with /musr/run/randomOption 1
# (seed = computer time + 100 x offset). The course's 201.mac already sets it; the
# check below adds it to any other macro you point the script at.
set -euo pipefail
MAC=${1:-201.mac}                 # the run number is atoi() of this file name
NJOBS=${2:-50}
cd "$(dirname "$0")"              # run where the macro lives
mkdir -p data                     # musrSim writes data/musrSim_<run>_<name>.root and will not create data/
PROD=${MAC%.mac}_prod.mac
sed 's|^/musr/run/randomOption .*|/musr/run/randomOption 1|' "$MAC" > "$PROD"
if ! grep -q '^/musr/run/randomOption 1' "$PROD"; then
  { echo '/musr/run/randomOption 1'; cat "$PROD"; } > "$PROD.tmp"
  mv "$PROD.tmp" "$PROD"
fi
RUN=$(basename "$MAC" | sed 's/[^0-9].*//'); RUN=${RUN:-0}   # atoi(), as musrSim does
for i in $(seq 1 "$NJOBS"); do
  ../musrSim "$PROD" job${i} ${i} > data/job${i}.log 2>&1
  grep -m1 "seed1:" data/job${i}.log || true   # keep the seeds: they are your provenance
done
hadd -f data/musrSim_${RUN}_merged.root data/musrSim_${RUN}_job*.root
