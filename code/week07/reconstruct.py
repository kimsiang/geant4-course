"""Lab 7.1 analysis: reconstruct momentum from the six tracker planes.

Truth -> measurement -> reconstruction, kept apart:
  truth          x_i, z_i where the primary entered plane i (Geant4)        [CSV]
  measurement    x_i smeared by the plane resolution sigma_x (here, in Python)
  reconstruction a straight line through each tracker; the change of slope across
                 the dipole gives p:   sin(theta_out) - sin(theta_in) = 0.2998 B L / p

Also runs a global quadratic fit through all six hits on the same events, to show its bias
for a tracker-magnet-tracker layout (that model assumes all hits sit inside the field).

    python3 reconstruct.py            # needs numpy only
"""
import glob
import math

import numpy as np

B_T, L_M = 1.5, 1.0          # field [T] and magnet length [m], as in DetectorConstruction
SIGMA_X_MM = 0.050           # plane resolution: 50 um
K = 0.299792458              # GeV / (T m)
rng = np.random.default_rng(7)


def load(path):
    data = np.loadtxt(path, delimiter=",", comments="#")
    return data[:, 0], data[:, 2:8] / 1000.0, data[:, 8:14] / 1000.0   # p [GeV], x [m], z [m]


def line_slope(z, x):
    """Least-squares slope dx/dz for each event (rows) through 3 points."""
    zm, xm = z.mean(axis=1, keepdims=True), x.mean(axis=1, keepdims=True)
    return ((z - zm) * (x - xm)).sum(axis=1) / ((z - zm) ** 2).sum(axis=1)


def p_two_lines(z, x):
    t_in, t_out = line_slope(z[:, :3], x[:, :3]), line_slope(z[:, 3:], x[:, 3:])
    s_in, s_out = t_in / np.sqrt(1 + t_in ** 2), t_out / np.sqrt(1 + t_out ** 2)
    return K * B_T * L_M / np.abs(s_out - s_in)


def p_quadratic(z, x):
    """Global quadratic x(z) = a z^2 + b z + c through all six points (biased here)."""
    out = np.empty(len(z))
    for i in range(len(z)):
        a = np.polyfit(z[i], x[i], 2)[0]
        out[i] = K * B_T / abs(2 * a)
    return out


def core_width(r):
    """Half-width of the central 68% of r: the Gaussian core, insensitive to a few
    scattering tail events that dominate np.std on 1000 events."""
    lo, hi = np.percentile(r, [15.865, 84.135])
    return 0.5 * (hi - lo)


print(f"{'file':<28}{'p_true':>8}{'bias(2 lines)':>15}{'sigma_p/p':>11}{'core68':>8}{'bias(quad)':>12}")
for path in sorted(glob.glob("tracks_*GeV_nt_tracks.csv")):
    p_true, x, z = load(path)
    x_meas = x + rng.normal(0.0, SIGMA_X_MM / 1000.0, x.shape)       # measurement
    r2 = (p_two_lines(z, x_meas) - p_true) / p_true
    rq = (p_quadratic(z, x_meas) - p_true) / p_true
    print(f"{path:<28}{p_true.mean():8.3f}{np.median(r2):+15.4f}{np.std(r2):11.4f}{core_width(r2):8.4f}{np.median(rq):+12.3f}")
