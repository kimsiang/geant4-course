"""A first scattering-muography image: Point of Closest Approach (PoCA).

    python3 poca.py poca.root

For each muon: the incoming line (planes 0, 1) and the outgoing line (planes 2, 3)
are straight lines in 3D. If the muon scattered once, the two lines meet where it
scattered. PoCA puts the whole deflection at the point where the two lines come
closest, and weights it by the squared scattering angle. Dense, high-Z material
lights up. Real muography adds detector resolution, a momentum estimate and
iterative methods (e.g. maximum likelihood); PoCA is the 10-line baseline.
"""
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import uproot

Z = np.array([60.0, 40.0, -40.0, -60.0])   # cm, plane positions
t = uproot.open(sys.argv[1] if len(sys.argv) > 1 else "poca.root")["trk"].arrays(library="np")

P = [np.stack([t[f"x{i}"], t[f"y{i}"], np.full_like(t["x0"], Z[i])], axis=1) for i in range(4)]
a0, u = P[1], P[0] - P[1]                 # incoming line: point on plane 1, direction
b0, v = P[2], P[2] - P[3]                 # outgoing line: point on plane 2, direction
u /= np.linalg.norm(u, axis=1)[:, None]
v /= np.linalg.norm(v, axis=1)[:, None]
theta = np.arccos(np.clip(np.sum(u * v, axis=1), -1, 1))     # 3D scattering angle

# closest points of the two lines: minimise |a0 + s u - (b0 + r v)|
w = a0 - b0
uv = np.sum(u * v, axis=1)
den = np.maximum(1 - uv**2, 1e-12)
s = (uv * np.sum(w * v, axis=1) - np.sum(w * u, axis=1)) / den
r = (np.sum(w * v, axis=1) - uv * np.sum(w * u, axis=1)) / den
poca = 0.5 * ((a0 + s[:, None] * u) + (b0 + r[:, None] * v))

sel = (theta > 2e-3) & (np.abs(poca[:, 2]) < 35)               # scattered, between the trackers
inside = (np.abs(poca[:, 0]) < 10) & (np.abs(poca[:, 1]) < 10) & (np.abs(poca[:, 2]) < 10)
big = theta > 20e-3
print(f"{len(theta)} muons; median scattering angle {1e3 * np.median(theta):.1f} mrad")
print(f"PoCA inside the cube: {inside.sum()} muons; {np.sum(inside & big)} of them "
      f"({100 * np.mean(big[inside]):.0f}%) scattered by more than 20 mrad")
print(f"PoCA outside the cube: {np.sum(~inside)} muons; {np.sum(~inside & big)} "
      f"({100 * np.mean(big[~inside]):.1f}%) scattered by more than 20 mrad")

fig, ax = plt.subplots(1, 2, figsize=(11, 4.8))
edges = np.linspace(-40, 40, 41)
img, _, _ = np.histogram2d(poca[sel, 0], poca[sel, 1], bins=[edges, edges], weights=(1e3 * theta[sel]) ** 2)
cnt, _, _ = np.histogram2d(poca[sel, 0], poca[sel, 1], bins=[edges, edges])
im = ax[0].imshow((img / np.maximum(cnt, 1)).T, origin="lower", extent=[-40, 40, -40, 40], cmap="magma")
fig.colorbar(im, ax=ax[0], label="mean theta^2 [mrad^2]")
ax[0].add_patch(plt.Rectangle((-10, -10), 20, 20, fill=False, ls="--", color="w"))
ax[0].set(title="PoCA image, top view (dashed: 20 cm steel cube)", xlabel="x [cm]", ylabel="y [cm]")
img2, _, _ = np.histogram2d(poca[sel, 0], poca[sel, 2], bins=[edges, np.linspace(-35, 35, 36)],
                            weights=(1e3 * theta[sel]) ** 2)
cnt2, _, _ = np.histogram2d(poca[sel, 0], poca[sel, 2], bins=[edges, np.linspace(-35, 35, 36)])
im = ax[1].imshow((img2 / np.maximum(cnt2, 1)).T, origin="lower", extent=[-40, 40, -35, 35], cmap="magma")
fig.colorbar(im, ax=ax[1], label="mean theta^2 [mrad^2]")
ax[1].add_patch(plt.Rectangle((-10, -10), 20, 20, fill=False, ls="--", color="w"))
ax[1].set(title="side view: PoCA smears the cube along z", xlabel="x [cm]", ylabel="z [cm]")
fig.tight_layout()
fig.savefig("poca.png", dpi=120)
print("wrote poca.png")
