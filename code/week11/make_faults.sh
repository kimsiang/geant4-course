#!/bin/bash
# make_faults.sh -- Lab 11.1: turn a working week05 counter into a git repository with one
# deliberately broken simulation per branch (fault-1 ... fault-6). Each fault is one line or one
# setting, compiles, and runs. The edits are stored base64-encoded so that running the script does
# not tell you what they are. Self-paced? Run it, do NOT decode it, diagnose every branch first;
# the answers are in FAULTS_ANSWERS.md.
# Usage: bash make_faults.sh path/to/week05 faultlab
#        cd faultlab && git branch          # main, fault-1 ... fault-6
set -euo pipefail
SRC=$1; OUT=${2:-faultlab}
rm -rf "$OUT"; mkdir -p "$OUT"
# copy the sources, never a build directory: its CMakeCache.txt points at the old source tree
(cd "$SRC" && tar --exclude=./build --exclude='./*.log' --exclude='./*.root' -cf - .) | (cd "$OUT" && tar -xf -)
cd "$OUT"
printf 'build/\n*.log\n*.root\n' > .gitignore
git init -q -b main && git add -A && git commit -qm "working counter (week05)"

d () { echo "$1" | base64 -d; }
fault () {   # fault <n> <file, encoded> <sed expression, encoded>
  local f; f=$(d "$2")
  git checkout -q -b "fault-$1" main
  sed -i "$(d "$3")" "$f"
  git diff --quiet && { echo "fault-$1: pattern not found (is $SRC the course's week05?)"; exit 1; }
  git commit -qam "fault-$1"            # the message gives nothing away
  git checkout -q main
}

fault 1 c3JjL1ByaW1hcnlHZW5lcmF0b3JBY3Rpb24uY2M= cy9HNFRocmVlVmVjdG9yKHgsIHksIC0yMFwuIFwqIGNtKS9HNFRocmVlVmVjdG9yKHgsIHksIC04MC4gKiBjbSkv
fault 2 c3JjL0V2ZW50QWN0aW9uLmNj cy9lZGVwXFswXF0gPj0gZkVkZXBUaHJlc2hvbGQsIGVkZXBcWzFcXSA+PSBmRWRlcFRocmVzaG9sZC9lZGVwWzBdIDwgZkVkZXBUaHJlc2hvbGQsIGVkZXBbMV0gPCBmRWRlcFRocmVzaG9sZC8=
fault 3 c3JjL0RldGVjdG9yQ29uc3RydWN0aW9uLmNj cy9TZXRTZW5zaXRpdmVEZXRlY3RvcigiQ291bnRlciIsIG11b25TRCkvU2V0U2Vuc2l0aXZlRGV0ZWN0b3IoImNvdW50ZXIiLCBtdW9uU0QpLw==
git checkout -q -b fault-4 main
d I3ByYWdtYSBvbmNlCiNpbmNsdWRlICJHNERlY2F5UGh5c2ljcy5oaCIKI2luY2x1ZGUgIkc0Vk1vZHVsYXJQaHlzaWNzTGlzdC5oaCIKY2xhc3MgTGlnaHRQaHlzaWNzTGlzdCA6IHB1YmxpYyBHNFZNb2R1bGFyUGh5c2ljc0xpc3QKewogIHB1YmxpYzoKICAgIExpZ2h0UGh5c2ljc0xpc3QoKSB7IFJlZ2lzdGVyUGh5c2ljcyhuZXcgRzREZWNheVBoeXNpY3MoKSk7IH0KfTsK > include/LightPhysicsList.hh
sed -i "$(d cy8jaW5jbHVkZSAiRlRGUF9CRVJULmhoIi8jaW5jbHVkZSAiTGlnaHRQaHlzaWNzTGlzdC5oaCIvOyBzL25ldyBGVEZQX0JFUlQoKS9uZXcgTGlnaHRQaHlzaWNzTGlzdCgpLw==)" week05.cc
git add -A && git commit -qm "fault-4" && git checkout -q main
fault 5 c3JjL0RldGVjdG9yQ29uc3RydWN0aW9uLmNj cy9HNFRocmVlVmVjdG9yKDAsIDAsICsxMFwuIFwqIGNtKS9HNFRocmVlVmVjdG9yKDAsIDAsIC05LjUgKiBjbSkv
fault 6 dHJpZ2dlci5tYWM= cy9iZWFtT24gMjAwMDAvYmVhbU9uIDIwMC8=

cmake -S . -B build > /dev/null || echo "could not configure build/ here: run  cmake -S . -B build  once Geant4 is set up"
# one build directory serves every branch: cmake --build re-configures when files change
git branch
