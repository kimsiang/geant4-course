"""Lab 9 analysis of musrSim's t1 tree: event-level vs hit-level, then a lifetime fit.

    pip install uproot awkward numpy scipy
    python3 analyse_t1.py data/musrSim_201.root

Works on real musrSim output and on the synthetic file from make_synthetic_t1.py.
"""
import sys

import awkward as ak
import numpy as np
import uproot
from scipy.optimize import curve_fit

path = sys.argv[1] if len(sys.argv) > 1 else "data/musrSim_201.root"
with uproot.open(path) as f:
    t = f["t1"]
    d = t.arrays(["det_n", "det_ID", "det_edep", "det_time_start",
                  "muDecayTime", "muDecayDetID"], library="ak")
    print("events:", t.num_entries)

# --- event-level vs hit-level -----------------------------------------------
print("hits per event (mean det_n):", round(float(ak.mean(d.det_n)), 3))
all_edep = ak.flatten(d.det_edep)                      # every hit in every detector
mask = d.det_ID == 11                                  # jagged mask, same shape as det_edep
edep_F1 = ak.flatten(d.det_edep[mask])                 # mask FIRST, then flatten
print("hits in all detectors:", len(all_edep), "  hits in det 11:", len(edep_F1),
      "  mean Edep det 11 [MeV]:", round(float(np.mean(edep_F1)), 3))
try:
    wrong = ak.flatten(d.det_edep)[mask]               # flatten FIRST: the event structure is gone
    print("flatten-then-mask returned", len(wrong), "values (not what you wanted)")
except Exception as err:
    print("flatten-then-mask fails:", type(err).__name__)

# --- lifetime of muons that decayed in volume 201 ----------------------------
def decay(tt, N0, tau, bkg):
    return N0 * np.exp(-tt / tau) + bkg

tdec = np.asarray(d.muDecayTime)
sel = np.asarray(d.muDecayDetID) == 201
print("sentinel values (-1000) in muDecayTime:", int((tdec == -1000).sum()))

# A sentinel is not a measurement. A fixed histogram range happens to hide it; a mean does not.
print("mean decay time, sentinels kept   [us]:", round(float(tdec[sel | (tdec == -1000)].mean()), 2))
good = sel & (tdec > 0)
print("mean decay time, sentinels removed [us]:", round(float(tdec[good].mean()), 4))

tt = tdec[good]
counts, edges = np.histogram(tt, bins=120, range=(0, 12))
centres = 0.5 * (edges[:-1] + edges[1:])
popt, pcov = curve_fit(decay, centres, counts, p0=[counts.max(), 2.2, 0.0])
print(f"fit: tau = {popt[1]:.4f} +/- {np.sqrt(pcov[1, 1]):.4f} us   (PDG mu+: 2.1970 us)")
