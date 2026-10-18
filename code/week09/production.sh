#!/bin/bash
# Week 9: split one macro into independent jobs (textbook 11.6, corrected).
# The seed offset (3rd argument) only takes effect with /musr/run/randomOption 1
# in the macro; 201.mac as shipped uses randomOption 2, which gives identical jobs.
set -e
cd "$(dirname "$0")"          # run where 201.mac lives: the run number is atoi("201.mac")
mkdir -p data                 # musrSim writes data/musrSim_<run>_<name>.root and will not create data/
sed 's|^/musr/run/randomOption .*|/musr/run/randomOption 1|' 201.mac > 201_prod.mac
grep -q '^/musr/run/randomOption 1' 201_prod.mac || echo '/musr/run/randomOption 1' | cat - 201_prod.mac > tmp && mv tmp 201_prod.mac
for i in $(seq 1 50); do
  ../musrSim 201_prod.mac job${i} ${i} > data/job${i}.log 2>&1
  grep -m1 "seed1:" data/job${i}.log     # keep the seeds: they are your provenance
done
hadd -f data/musrSim_201_merged.root data/musrSim_201_job*.root
