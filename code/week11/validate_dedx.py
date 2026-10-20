"""validate_dedx.py -- Lab 11.2: compare Geant4's mean muon energy loss in plastic scintillator
with the PDG muon table, and say which rung of the validation ladder that comparison reaches.

Input: edep_<T>MeV*.root files from the week04 app (10 cm of G4_PLASTIC_SC_VINYLTOLUENE), whose
"PrimarydEdx" histogram holds, per event, the primary muon's kinetic-energy loss / path [MeV/cm].
Usage: python3 validate_dedx.py edep_0100MeV.root edep_1000MeV.root ...

Two rules this script enforces, both learned the hard way in our own runs:
  1. Compare like with like. The muon slows down inside 10 cm, so the reference is the PDG table
     INTEGRATED along the path, not the table value at the entrance energy.
  2. A histogram mean ignores entries outside its range. If anything overflowed, the mean is a
     truncated mean and is not comparable with the PDG mean: the script refuses to give a sigma.
"""
import re
import sys

import numpy as np
import uproot

RHO = 1.032    # g/cm3, PDG polyvinyltoluene (I = 64.7 eV)
L = 10.0       # cm of scintillator in the week04 app
# PDG 2024, muE_polyvinyltoluene.txt: kinetic energy [MeV], total dE/dx [MeV cm2/g]
T_TAB = np.array([50, 55, 60, 70, 80, 90, 100, 120, 140, 170, 200, 250, 300, 324.6, 350, 400, 450, 500,
                  550, 600, 700, 800, 900, 1000, 1200, 1400, 1700, 2000, 2500, 3000, 3500, 4000, 4500,
                  5000, 5500, 6000, 7000, 8000, 9000, 10000, 12000], dtype=float)
S_TAB = np.array([2.861, 2.744, 2.647, 2.498, 2.388, 2.303, 2.237, 2.143, 2.082, 2.025, 1.992, 1.966,
                  1.957, 1.957, 1.957, 1.962, 1.969, 1.978, 1.987, 1.997, 2.016, 2.034, 2.051, 2.067,
                  2.096, 2.121, 2.153, 2.181, 2.219, 2.249, 2.275, 2.297, 2.317, 2.334, 2.350, 2.364,
                  2.389, 2.410, 2.429, 2.445, 2.474])
REF_SYS = 0.01   # ASSUMPTION: 1% on the tabulated value (mean excitation energy I); not quoted by PDG


def pdg_dedx(T):
    """Total stopping power at kinetic energy T [MeV], in MeV/cm (log-log interpolation)."""
    return RHO * np.exp(np.interp(np.log(T), np.log(T_TAB), np.log(S_TAB)))


def pdg_path_average(T0, n=2000):
    """Mean energy loss per cm over L, integrating dT/dx = -dE/dx(T) through the slab."""
    T, dx = T0, L / n
    for _ in range(n):
        T -= pdg_dedx(T) * dx
    return (T0 - T) / L, T


def discrepancy_sigma(sim, sim_unc, ref, ref_stat, ref_sys=0.0):
    """Discrepancy in combined-sigma units. Evidence for a comparison, not a verdict."""
    return abs(sim - ref) / np.sqrt(sim_unc**2 + ref_stat**2 + ref_sys**2)


def chi2_sf(x, k):
    """P(chi2 >= x) for k degrees of freedom."""
    from scipy.stats import chi2
    return float(chi2.sf(x, k))


pulls_stat, pulls_ref = [], []
for fn in sys.argv[1:]:
    T = float(re.search(r"edep_(\d+)MeV", fn).group(1))
    h = uproot.open(fn)["PrimarydEdx"]
    vals = h.values(flow=True)
    outside = vals[0] + vals[-1]
    sw = h.member("fTsumw")
    mean = h.member("fTsumwx") / sw
    rms = np.sqrt(h.member("fTsumwx2") / sw - mean**2)
    err = rms / np.sqrt(sw)
    entry = pdg_dedx(T)
    ref, Tout = pdg_path_average(T)
    print(f"T = {T:6.0f} MeV  Geant4 {mean:.4f} +/- {err:.4f} MeV/cm | PDG at entry {entry:.4f}, "
          f"path-averaged {ref:.4f} (exits at {Tout:.1f} MeV)")
    if outside > 0:
        print(f"           REFUSED: {outside:.0f} of {h.member('fEntries'):.0f} entries outside the histogram range; "
              f"this mean is truncated. Widen the range (/analysis/h1/set) and rerun.")
        continue
    ns = discrepancy_sigma(mean, err, ref, 0.0, REF_SYS * ref)
    pull = (mean - ref) / err
    pulls_stat.append(pull)
    pulls_ref.append((mean - ref) / np.sqrt(err**2 + (REF_SYS * ref) ** 2))
    print(f"           ratio {mean / ref:.4f}   discrepancy {ns:.1f} sigma (stat + 1% reference)   "
          f"stat-only pull {pull:+.1f}")
if len(pulls_stat) >= 2:
    # Look at both. Statistics alone tests whether Geant4 and the table agree to the precision of
    # the run; the 1% is an ASSUMED reference error. If it makes chi2/ndf much smaller than 1, the
    # assumed error is larger than the scatter of the points and hides any common offset.
    n = len(pulls_stat)
    c2s, c2r = float(np.sum(np.square(pulls_stat))), float(np.sum(np.square(pulls_ref)))
    print(f"stat only: chi2 = {c2s:.1f}/{n} (p = {chi2_sf(c2s, n):.2f})   "
          f"with the assumed 1% reference: chi2 = {c2r:.2f}/{n} (p = {chi2_sf(c2r, n):.3f})")
print("Ladder: physics benchmarked against a calculated table over 10 cm of plastic. Not yet detector "
      "benchmarked: no measured spectrum, threshold or trigger has been compared.")
