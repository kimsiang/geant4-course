# Proposal: <one-line title>

Author · date · repository URL · tag

## 1. Question (one sentence)
<What physical quantity do you want to learn, and to what precision?>

## 2. Observable
<The one number the simulation will produce. Units. How it is computed from the ROOT file.>

## 3. Prediction
<Direction and rough size, BEFORE running, with the reasoning (chapter / formula).>

## 4. Virtual detector and physics
- Geometry and materials: <...>
- Primary particles (spectrum, angles, position): <...>
- Physics list and any added constructor: <...>  (check with /process/list)
- Detector response: <truth Edep / digitised / optical>  and why that fidelity is enough

## 5. Skills used (at least three weeks)
<e.g. W5 trigger, W8 analysis chain, W10 spin physics>

## 6. Validation criterion
<Reference (analytic, table, published measurement), the rung you aim for (Week 11 validation ladder),
and the discrepancy in sigma that would count as agreement.>

## 7. Feasibility
- Target precision: <...>   systematic floor: <...>
- Events per configuration: <...>   configurations: <...>
- CPU time per event from a pilot run: <... ms>   wall time on <N> cores: <...>

## 8. Boundary statement
<At least one physically important effect deliberately ignored, and its consequence.
If musrSim: one application-specific behaviour checked against the installed source.>

## 9. Reproducibility record
- Geant4 version (geant4-config --version), ROOT / Python package versions
- Commit and tag; macro(s); seed strategy and thread count
- Analysis command that prints the headline number, and its statistical tolerance
