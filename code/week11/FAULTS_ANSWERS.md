# Lab 11.1 fault lab: answers (spoiler)

Diagnose every branch with the debugging tree first. Read this only after you have named the layer and written down your evidence for each fault.

| Branch | Layer | What was changed | Symptom in our runs (Geant4 11.4.p01) |
|---|---|---|---|
| fault-1 | L1 particle generated | Source plane moved from z = −20 cm to −80 cm, outside the 50 cm half-length world | Runs without a warning; cos² efficiencies roughly halve. Geant4 11.4 transports a vertex outside the world (see Course-W11-a) |
| fault-2 | L6/L7 hit and digitization | Edep threshold comparison inverted in EventAction (`>=` became `<`) | Trigger efficiency unchanged (the coincidence is decided elsewhere), but single-counter rates jump (singles 0.89) |
| fault-3 | L5 SD attached | Logical-volume name typed `counter` instead of `Counter` in SetSensitiveDetector | Fatal at initialisation: G4Exception Run0053 |
| fault-4 | L4 physics enabled | A "lightweight" physics list with decay only: no ionisation | No energy deposit, efficiency 0 except noise coincidences |
| fault-5 | L2 geometry correct | Bottom counter placed at z = −9.5 cm instead of +10 cm; it overlaps the top counter | Runs; efficiencies change; `/geometry/test/run` reports the overlap |
| fault-6 | L0 statistics | No code change: 200 events instead of 20 000 | Efficiency looks wrong; it is within its (large) binomial interval |

`git diff main fault-N` shows each change.
