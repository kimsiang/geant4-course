"""asymmetry.py -- recover the field from the precession of the muon spin (textbook 12.5, annotated).

Reads a t1 tree with musrSim branch names: the course app writes data/tf_10mT.root;
musrSim writes data/musrSim_0_tf.root for tf_musr.mac (run number 0, output name "tf").
Usage: python3 asymmetry.py [file.root] [--measured]
  --measured  use the counter's det_time_start instead of the truth muDecayTime
"""
import sys

import awkward as ak
import numpy as np
import uproot
from scipy.optimize import curve_fit

GAMMA_MU = 135.5388          # MHz/T, gamma_mu / 2pi (PDG / CODATA)

args = [a for a in sys.argv[1:] if not a.startswith("--")]
fname = args[0] if args else "data/musrSim_0_tf.root"
measured = "--measured" in sys.argv

D = uproot.open(fname)["t1"].arrays(
    ["det_ID", "det_time_start", "muDecayTime", "muDecayDetID"], library="ak")
sel = (D.muDecayDetID == 5) & (D.muDecayTime > 0)       # stopped AND decayed in the target; no sentinels
D = D[sel]
print(f"muons decayed in target: {len(D)}")

hitU = np.asarray(ak.any(D.det_ID == 11, axis=1))       # positron reached the UP counter (y = +45 mm)
hitD = np.asarray(ak.any(D.det_ID == 1, axis=1))        # ... the DOWN counter (y = -45 mm)
if measured:
    # what the electronics would see: the first time each counter fired
    tU = np.asarray(ak.fill_none(ak.firsts(D.det_time_start[D.det_ID == 11]), -1.0))[hitU]
    tD = np.asarray(ak.fill_none(ak.firsts(D.det_time_start[D.det_ID == 1]), -1.0))[hitD]
else:
    t = np.asarray(D.muDecayTime)                       # Monte Carlo truth (textbook choice)
    tU, tD = t[hitU], t[hitD]
print(f"positrons in U (ID 11): {len(tU)}   in D (ID 1): {len(tD)}")

bins = np.linspace(0, 10, 201)                          # 200 bins of 50 ns; T = 0.74 us at 10 mT
NU, _ = np.histogram(tU, bins=bins)
ND, _ = np.histogram(tD, bins=bins)
centre = 0.5 * (bins[:-1] + bins[1:])
tot = NU + ND
ok = tot > 20
A = (ND[ok] - NU[ok]) / tot[ok]                         # D first: mu+ spin turns from -z towards -y
Aerr = np.sqrt((1.0 - A**2) / tot[ok])                  # binomial split of tot counts
tg = centre[ok]


def osc(t, A0, f, phi, lam):
    return A0 * np.exp(-lam * t) * np.sin(2 * np.pi * f * t + phi)


popt, pcov = curve_fit(osc, tg, A, p0=[0.25, 1.35, 0.0, 0.05], sigma=Aerr, absolute_sigma=True)
perr = np.sqrt(np.diag(pcov))
chi2 = np.sum(((A - osc(tg, *popt)) / Aerr) ** 2)
ndf = len(A) - 4
f, df = popt[1], perr[1]
print(f"A0  = {popt[0]:.4f} +/- {perr[0]:.4f}")
print(f"f   = {f:.4f} +/- {df:.4f} MHz")
print(f"phi = {popt[2]:+.3f} +/- {perr[2]:.3f} rad    lambda = {popt[3]:.4f} +/- {perr[3]:.4f} /us")
print(f"chi2/ndf = {chi2:.1f}/{ndf}")
if abs(popt[0]) < 3 * perr[0]:
    # A fit always returns numbers. With no oscillation, f just stays near its starting value.
    print("WARNING: A0 is consistent with zero: there is no oscillation, so f and B are meaningless")
print(f"B   = {f / GAMMA_MU * 1000:.3f} +/- {df / GAMMA_MU * 1000:.3f} mT")
