"""Mission 4 analysis: compare the Geant4 energy-loss scan with the Bethe formula.

Reads edep_<E>MeV.root written by ./week04 run_bethe_bloch.mac, takes the mean of
the two histograms in each file, and plots them against beta*gamma together with
the PDG Bethe formula (with density effect) for polyvinyltoluene.

    pip install uproot matplotlib numpy
    python3 plot_bethe.py
"""
import math

import numpy as np
import uproot

M_MU = 105.6583755          # MeV, muon mass (PDG)
M_E = 0.51099895            # MeV
K = 0.307075                # MeV cm2/mol
# Polyvinyltoluene (G4_PLASTIC_SC_VINYLTOLUENE): PDG atomic & nuclear properties
ZA, RHO, I_EV = 0.54141, 1.032, 64.7
CBAR, X0, X1, A_D, K_D = 3.1997, 0.1464, 2.4855, 0.1610, 3.2393   # Sternheimer, delta0 = 0
THICK_CM = 10.0
ENERGIES = [100, 200, 500, 1000, 10000]   # kinetic energy, MeV


def beta_gamma(T):
    g = 1.0 + T / M_MU
    return math.sqrt(g * g - 1.0)


def delta(bg):
    x = math.log10(bg)
    if x >= X1:
        return 2 * math.log(10) * x - CBAR
    if x >= X0:
        return 2 * math.log(10) * x - CBAR + A_D * (X1 - x) ** K_D
    return 0.0


def bethe(bg):
    """Mean -dE/dx in MeV/cm for a muon (PDG Eq. 34.5, no spin or shell terms)."""
    g = math.sqrt(1 + bg * bg)
    b2 = bg * bg / (g * g)
    r = M_E / M_MU
    wmax = 2 * M_E * bg * bg / (1 + 2 * g * r + r * r)
    arg = 2 * M_E * bg * bg * wmax / (I_EV * 1e-6) ** 2
    return K * ZA / b2 * (0.5 * math.log(arg) - b2 - delta(bg) / 2) * RHO


def hmean(h):
    """Mean of a ROOT TH1 from its stored statistics (falls back to bin centres)."""
    try:
        sw, swx = h.member("fTsumw"), h.member("fTsumwx")
        if sw > 0:
            return swx / sw
    except Exception:
        pass
    vals, edges = h.to_numpy()
    c = 0.5 * (edges[:-1] + edges[1:])
    return float((vals * c).sum() / vals.sum())


rows = []
for T in ENERGIES:
    with uproot.open(f"edep_{T:04d}MeV.root") as f:
        edep = hmean(f["Edep"])
        dedx = hmean(f["PrimarydEdx"])
    bg = beta_gamma(T)
    rows.append((T, bg, edep / THICK_CM, dedx, bethe(bg)))

print(f"{'T [MeV]':>8} {'bg':>7} {'Edep/l':>8} {'primary':>8} {'Bethe':>8} {'prim/Bethe':>10}")
for T, bg, el, d, b in rows:
    print(f"{T:8d} {bg:7.2f} {el:8.3f} {d:8.3f} {b:8.3f} {d / b:10.3f}")

try:
    import matplotlib.pyplot as plt
    bgs = np.logspace(-0.2, 3, 200)
    plt.loglog(bgs, [bethe(b) for b in bgs], "-", label="Bethe (PDG), polyvinyltoluene")
    plt.loglog([r[1] for r in rows], [r[3] for r in rows], "o", label="Geant4: primary -dE/dx")
    plt.loglog([r[1] for r in rows], [r[2] for r in rows], "s", mfc="none", label="Geant4: Edep / 10 cm")
    plt.xlabel(r"$\beta\gamma$")
    plt.ylabel("MeV / cm")
    plt.legend()
    plt.savefig("bethe_scan.png", dpi=150)
    print("wrote bethe_scan.png")
except ImportError:
    pass
