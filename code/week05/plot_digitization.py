"""Lab 5.3: compare the Geant4 truth (Edep) with the digitized observable (ADC).

    pip install uproot matplotlib numpy
    python3 plot_digitization.py cos2.root
"""
import sys

import matplotlib.pyplot as plt
import numpy as np
import uproot

path = sys.argv[1] if len(sys.argv) > 1 else "cos2.root"
with uproot.open(path) as f:
    t = f["Muons"]
    edep = t["Edep0"].array(library="np")
    evis = t["Evis0"].array(library="np")
    adc = t["ADC0"].array(library="np")

hit = edep > 0.1                       # events where the top counter fired (truth)
print(f"events {len(edep)}, top counter fired {hit.sum()}")
print(f"mean Edep {edep[hit].mean():.3f} MeV, mean Evis {evis[hit].mean():.3f} MeV, "
      f"Evis/Edep {evis[hit].mean() / edep[hit].mean():.3f}")
print(f"mean ADC above pedestal {(adc[hit] - 50).mean():.1f} counts")

fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
ax[0].hist(edep[hit], bins=80, range=(0, 8), density=True, histtype="step", label="Geant4 truth: Edep [MeV]")
ax[0].hist((adc[hit] - 50) / (4 * 25), bins=80, range=(0, 8), density=True, histtype="step",
           label="digitized: (ADC - ped)/(gain x LY) [MeV-equiv.]")
ax[0].set_xlabel("energy [MeV]")
ax[0].legend(fontsize=8)
ax[1].hist2d(edep[hit], adc[hit], bins=80, range=((0, 8), (40, 900)), cmap="Blues")
ax[1].set_xlabel("Edep [MeV]")
ax[1].set_ylabel("ADC [counts]")
fig.tight_layout()
fig.savefig("digitization.png", dpi=150)
print("wrote digitization.png")
