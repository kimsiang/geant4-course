"""Write data/musrSim_201.root: a SYNTHETIC tree with the branch names, jagged hit
structure, units (MeV, microseconds) and -1000 sentinels of musrSim's t1 tree.
It is NOT musrSim output. It exists so the Week 9 analysis can be run and checked
before you have a musrSim build. Physics in it: mu+ lifetime 2.1969811 us (PDG).
"""
import os

import awkward as ak
import numpy as np
import uproot

rng = np.random.default_rng(2026)
N = 20000
TAU = 2.1969811
os.makedirs("data", exist_ok=True)

# Where the muon decayed: 80% in the sample (volume ID 201), 15% in the counter 11, 5% elsewhere/escaped
where = rng.choice([201, 11, -1000], size=N, p=[0.80, 0.15, 0.05])
t_dec = rng.exponential(TAU, N)
mu_decay_time = np.where(where == -1000, -1000.0, t_dec)          # sentinel when not defined
mu_decay_det = where.astype(np.int32)

det_ID, det_edep, det_t = [], [], []
for i in range(N):
    ids, ed, tt = [], [], []
    if where[i] != -1000 and rng.random() < 0.95:                  # the stopping muon deposits in its volume
        ids.append(int(where[i])); ed.append(float(rng.normal(4.1, 0.3))); tt.append(float(rng.normal(0.010, 0.002)))
    for counter in (1, 11):                                         # decay positron may hit a counter
        if where[i] != -1000 and rng.random() < 0.30:
            z = rng.normal()
            ids.append(counter); ed.append(float(max(0.05, 1.6 + 0.12 * -np.log(z * z + 1e-12)))); tt.append(float(t_dec[i] + rng.normal(0, 0.001)))
    det_ID.append(ids); det_edep.append(ed); det_t.append(tt)

det_ID = ak.Array(det_ID)
branches = {
    "muDecayDetID": mu_decay_det,
    "muDecayTime": mu_decay_time,
    "det": ak.zip({"ID": ak.values_astype(det_ID, np.int32), "edep": ak.Array(det_edep), "time_start": ak.Array(det_t)}),
}
with uproot.recreate("data/musrSim_201.root") as f:
    # musrSim names: det_n (hit counter), det_ID, det_edep, det_time_start
    f.mktree("t1", {k: v.type if hasattr(v, "type") else v.dtype for k, v in branches.items()},
             counter_name=lambda counted: counted + "_n",
             field_name=lambda outer, inner: outer + "_" + inner)
    f["t1"].extend(branches)
print("wrote data/musrSim_201.root with", N, "events (SYNTHETIC)")
