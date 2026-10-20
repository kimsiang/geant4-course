"""Muography starter analysis: rates, the void signal, and the exposure you need.

    python3 analyse.py void_off void_on [--fabs 0.10] [--frel 0.02]

Reads <name>.root (ntuple "tel") and <name>_run.json for both runs.
Every simulated muon stands for the same exposure (seconds_per_event in the JSON),
so counts / (n_generated x seconds_per_event) is a rate a real telescope would see.

Three numbers matter:
  1. the rate in the void direction without and with the void (per day);
  2. the significance after T days of data taking, Z(T);
  3. the exposure T needed for 3 sigma and 5 sigma.
Two ways to predict the "no void" rate, with different systematics:
  - absolute: take the flux model at face value. Its normalisation is uncertain by
    10-20% (fabs), and that error does not shrink with more data;
  - relative: measure a control region at the same zenith angle (flat ground: same
    rock path) and scale it with the simulated window/control ratio. The flux
    normalisation cancels; what is left (frel, default 2%) is the model's angular
    shape plus detector non-uniformity.
"""
import argparse
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import uproot


def load(name):
    with open(name + "_run.json") as f:
        meta = json.load(f)
    t = uproot.open(name + ".root")["tel"].arrays(["sx_rec", "sy_rec"], library="np")
    live_days = meta["n_generated"] * meta["seconds_per_event"] / 86400.0
    return meta, t["sx_rec"], t["sy_rec"], live_days


def directions(sx, sy):
    u = np.stack([sx, sy, np.ones_like(sx)], axis=1)
    return u / np.linalg.norm(u, axis=1)[:, None]


def exposure(delta, var_rate, sys_rate, z):
    """Days T with delta*T = z*sqrt(var_rate*T + (sys_rate*T)^2); inf if systematics win."""
    den = delta**2 - (z * sys_rate) ** 2
    return z**2 * var_rate / den if den > 0 else np.inf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("off")
    ap.add_argument("on")
    ap.add_argument("--fabs", type=float, default=0.10, help="flux-model normalisation systematic")
    ap.add_argument("--frel", type=float, default=0.02, help="residual systematic of the relative method")
    args = ap.parse_args()

    m_off, sx0, sy0, d_off = load(args.off)
    m_on, sx1, sy1, d_on = load(args.on)
    print(f"MC exposure: {d_off * 24:.2f} h (void off), {d_on * 24:.2f} h (void on)")
    print(f"telescope rate: {len(sx0) / d_off:,.0f} /day (void off), {len(sx1) / d_on:,.0f} /day (void on)")

    # the void as seen from the centre of the top plane
    v = np.array(m_on["void_xyz_m"]) - np.array([0.0, 0.0, m_on["top_plane_z_m"]])
    dist = np.linalg.norm(v)
    v /= dist
    r_ang = np.arcsin(min(1.0, m_on["void_radius_m"] / dist))
    zen_v = np.arccos(v[2])
    print(f"void direction: zenith {np.degrees(zen_v):.1f} deg, slopes ({v[0] / v[2]:.3f}, {v[1] / v[2]:.3f}), "
          f"angular radius {np.degrees(r_ang):.1f} deg")

    def regions(sx, sy):
        u = directions(sx, sy)
        ang = np.arccos(np.clip(u @ v, -1, 1))
        zen = np.arccos(u[:, 2])
        window = ang < r_ang
        control = (np.abs(zen - zen_v) < r_ang) & (ang > 2 * r_ang)
        return window.sum(), control.sum()

    W0, C0 = regions(sx0, sy0)
    W1, C1 = regions(sx1, sy1)
    rW0, rC0, rW1, rC1 = W0 / d_off, C0 / d_off, W1 / d_on, C1 / d_on
    excess = rW1 / rW0 - 1
    err = np.sqrt(1 / W1 + 1 / W0) * (rW1 / rW0)
    print(f"\nvoid window: {W0} -> {W1} muons in the simulation = {rW0:,.0f} -> {rW1:,.0f} per day, "
          f"excess {100 * excess:+.1f} +/- {100 * err:.1f} % (MC statistics)")
    print(f"control ring (same zenith, away from the void): {C0} -> {C1} muons, "
          f"ratio on/off {C1 / C0 * d_off / d_on:.3f}")

    # 1. absolute: reference = flux model (void-off simulation), normalisation error fabs
    delta_a = rW1 - rW0
    # 2. relative: prediction = k * control(on), k from the void-off simulation
    k = W0 / C0
    pred = k * rC1
    delta_r = rW1 - pred
    print("\nexposure for a real telescope (days of data):")
    print(f"{'method':<34}{'3 sigma':>10}{'5 sigma':>10}")
    for label, delta, var, sysr in (
        (f"absolute, flux model +/-{100 * args.fabs:.0f}%", delta_a, rW0, args.fabs * rW0),
        (f"relative to control, +/-{100 * args.frel:.0f}%", delta_r, pred + k * k * rC1, args.frel * pred),
    ):
        cells = []
        for z in (3, 5):
            t = exposure(delta, var, sysr, z)
            cells.append("never" if np.isinf(t) else (f"{t * 24:.1f} h" if t < 1 else f"{t:.1f} d"))
        print(f"{label:<34}{cells[0]:>10}{cells[1]:>10}")

    # figure: rate map, ratio map, Z(T)
    bins = np.linspace(-1.6, 1.6, 17)
    h0, _, _ = np.histogram2d(sx0, sy0, bins=[bins, bins])
    h1, _, _ = np.histogram2d(sx1, sy1, bins=[bins, bins])
    ratio = np.where(h0 >= 20, (h1 / d_on) / np.maximum(h0 / d_off, 1e-9), np.nan)
    fig, ax = plt.subplots(1, 3, figsize=(15, 4.6))
    im = ax[0].imshow((h0 / d_off).T, origin="lower", extent=[-1.6, 1.6, -1.6, 1.6], cmap="viridis")
    fig.colorbar(im, ax=ax[0], label="muons per day per bin")
    ax[0].set_title(f"void off: {m_off['overburden_m']:.0f} m of standard rock")
    im = ax[1].imshow(ratio.T, origin="lower", extent=[-1.6, 1.6, -1.6, 1.6], cmap="RdBu_r", vmin=0.6, vmax=1.4)
    fig.colorbar(im, ax=ax[1], label="rate ratio, void on / off")
    ax[1].add_patch(plt.Circle((v[0] / v[2], v[1] / v[2]), np.tan(r_ang) / v[2] ** 2, fill=False, ls="--", color="k"))
    ax[1].set_title("ratio map (dashed: void outline)")
    for a in ax[:2]:
        a.set_xlabel("slope dx/dz")
        a.set_ylabel("slope dy/dz")
    T = np.logspace(-2, 2, 200)
    ax[2].plot(T, delta_a * T / np.sqrt(rW0 * T + (args.fabs * rW0 * T) ** 2), label=f"absolute, {100 * args.fabs:.0f}% sys")
    ax[2].plot(T, delta_r * T / np.sqrt((pred + k * k * rC1) * T + (args.frel * pred * T) ** 2),
               label=f"relative, {100 * args.frel:.0f}% sys")
    for z in (3, 5):
        ax[2].axhline(z, color="grey", lw=0.8, ls=":")
    ax[2].set_xscale("log")
    ax[2].set_xlabel("exposure [days]")
    ax[2].set_ylabel("significance Z")
    ax[2].legend()
    ax[2].set_title("significance of the void")
    fig.tight_layout()
    fig.savefig("analyse.png", dpi=120)
    print("\nwrote analyse.png")


if __name__ == "__main__":
    main()
