#!/bin/bash
# make_faults.sh -- Lab 11.1 for instructors: turn the working week05 counter into a repository
# with one deliberately broken simulation per branch. Each fault is ONE line, compiles, and runs.
# Usage: bash make_faults.sh path/to/week05  faultlab
#        cd faultlab && git branch          # main, fault-1 ... fault-6
set -e
SRC=$1; OUT=${2:-faultlab}
rm -rf "$OUT"; cp -r "$SRC" "$OUT"; cd "$OUT"
git init -q -b main && git add -A && git commit -qm "working counter (week05)"

fault () {   # fault <n> <file> <sed expression> <commit message>
  git checkout -q -b "fault-$1" main
  sed -i "$3" "$2"
  git diff --quiet && { echo "fault-$1: pattern not found in $2"; exit 1; }
  git commit -qam "fault-$1"            # the message gives nothing away
  git checkout -q main
}

# 1  generator: source plane moved to z = -80 cm, outside the world (half-length 50 cm)
fault 1 src/PrimaryGeneratorAction.cc 's/G4ThreeVector(x, y, -20\. \* cm)/G4ThreeVector(x, y, -80. * cm)/'
# 2  digitization: threshold comparison inverted (event level)
fault 2 src/EventAction.cc 's/edep\[0\] >= fEdepThreshold, edep\[1\] >= fEdepThreshold/edep[0] < fEdepThreshold, edep[1] < fEdepThreshold/'
# 3  sensitive detector: logical-volume name typed in lower case
fault 3 src/DetectorConstruction.cc 's/SetSensitiveDetector("Counter", muonSD)/SetSensitiveDetector("counter", muonSD)/'
# 4  physics: a "lightweight" list with decay only -- no ionisation at all
git checkout -q -b fault-4 main
cat > include/LightPhysicsList.hh <<'EOF'
#pragma once
#include "G4DecayPhysics.hh"
#include "G4VModularPhysicsList.hh"
// "Faster than FTFP_BERT for a muon counter." (It is: nothing happens in matter.)
class LightPhysicsList : public G4VModularPhysicsList
{
  public:
    LightPhysicsList() { RegisterPhysics(new G4DecayPhysics()); }
};
EOF
sed -i 's/#include "FTFP_BERT.hh"/#include "LightPhysicsList.hh"/; s/new FTFP_BERT()/new LightPhysicsList()/' week05.cc
git add -A && git commit -qm "fault-4" && git checkout -q main
# 5  geometry: bottom counter placed at z = -9.5 cm instead of +10 cm; it overlaps the top one
fault 5 src/DetectorConstruction.cc 's/G4ThreeVector(0, 0, +10\. \* cm)/G4ThreeVector(0, 0, -9.5 * cm)/'
# 6  no code change: a 200-event run whose efficiency "looks wrong"
git checkout -q -b fault-6 main
sed -i 's/beamOn 20000/beamOn 200/' trigger.mac
git commit -qam "fault-6" && git checkout -q main

git branch
