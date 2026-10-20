"""Compare the simulated scattering angle in steel with the Highland formula.

    python3 highland.py          reads slab_<t>cm_<E>GeV.root from slab_scan.mac

The upper two planes give the incoming slope, the lower two the outgoing slope.
The plane-projected deflection is theta_x = atan(sx_out) - atan(sx_in) (same for y).
PDG RPP 2024 Eq. 34.16 (Highland, as refined by Lynch and Dahl):
    theta0 = 13.6 MeV / (beta c p) * z * sqrt(x/X0) * [1 + 0.038 ln(x z^2 / (X0 beta^2))]
theta0 is the width of the CENTRAL 98% of the projected-angle distribution, so we
compare it with the r.m.s. of the central 98% of the simulated angles, not the
full r.m.s. (single large-angle scatters make the full r.m.s. larger).
"""
import numpy as np
import uproot

M_MU = 0.1056584       # GeV
X0_FE = 1.757          # cm, PDG
Z_PLANE = np.array([60.0, 40.0, -40.0, -60.0])   # cm, DetectorConstruction::kPlaneZ


def highland(t_cm, ekin):
    E = ekin + M_MU
    p = np.sqrt(E * E - M_MU * M_MU)
    beta = p / E
    x = t_cm / X0_FE
    return 13.6e-3 / (beta * p) * np.sqrt(x) * (1 + 0.038 * np.log(x / beta**2))   # rad


def central98_rms(a):
    lo, hi = np.percentile(a, [1, 99])
    a = a[(a >= lo) & (a <= hi)]
    return a.std()


def angles(t):
    sx_in = (t["x0"] - t["x1"]) / (Z_PLANE[0] - Z_PLANE[1])
    sy_in = (t["y0"] - t["y1"]) / (Z_PLANE[0] - Z_PLANE[1])
    sx_out = (t["x2"] - t["x3"]) / (Z_PLANE[2] - Z_PLANE[3])
    sy_out = (t["y2"] - t["y3"]) / (Z_PLANE[2] - Z_PLANE[3])
    return np.concatenate([np.arctan(sx_out) - np.arctan(sx_in), np.arctan(sy_out) - np.arctan(sy_in)])


print(f"{'steel':>6} {'E_kin':>6} {'muons':>6} {'sim theta0':>11} {'Highland':>9} {'sim/Highland':>13}")
for t_cm in (1, 2, 5, 10):
    for e in (1, 3, 10):
        tree = uproot.open(f"slab_{t_cm}cm_{e}GeV.root")["trk"].arrays(library="np")
        th = angles(tree)
        sim = central98_rms(th)
        hl = highland(t_cm, e)
        err = sim / np.sqrt(2 * len(th))   # approximate statistical error of a width
        print(f"{t_cm:>4} cm {e:>4} GeV {len(tree['x0']):>6} {1e3 * sim:>7.2f} mrad {1e3 * hl:>6.2f} mrad "
              f"{sim / hl:>8.3f} +/- {err / hl:.3f}")
