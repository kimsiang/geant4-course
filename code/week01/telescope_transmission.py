import numpy as np


def sample_directions(N, rng):
    """Sample N directions uniformly in solid angle over the downward hemisphere.

    This is a toy directional model. It is not the cosine-weighted
    crossing distribution of an isotropic flux through a plane, and it is
    not a sea-level cosmic-ray muon spectrum.
    """
    # Isotropic direction sampling over a hemisphere: cos(theta) is uniform.
    cos_theta = rng.uniform(0.0, 1.0, N)
    theta = np.arccos(cos_theta)
    phi = rng.uniform(0.0, 2 * np.pi, N)
    return theta, phi


def transmission_probability(N, L, d, seed=0):
    """Monte Carlo estimate of a two-layer telescope's conditional transmission
    probability.

    L : side length of each square layer [m]
    d : vertical separation between the two layers [m]
    The upper-layer impact point is sampled uniformly in the square.
    """
    rng = np.random.default_rng(seed)
    theta, phi = sample_directions(N, rng)

    # Sample the impact point uniformly across the upper square.
    x0 = rng.uniform(-L / 2, L / 2, N)
    y0 = rng.uniform(-L / 2, L / 2, N)

    # Straight-line propagation to the lower layer.
    x1 = x0 + d * np.tan(theta) * np.cos(phi)
    y1 = y0 + d * np.tan(theta) * np.sin(phi)

    hit = (np.abs(x1) < L / 2) & (np.abs(y1) < L / 2)
    k = hit.sum()
    eps = k / N
    sigma = np.sqrt(eps * (1 - eps) / N)
    return eps, sigma


if __name__ == "__main__":
    for N in [1_000, 10_000, 100_000]:
        eps, sigma = transmission_probability(N, L=0.3, d=0.5)
        print(f"N={N:>7d} eps={eps:.4f} sigma={sigma:.4f} "
              f"rel.unc.={sigma/eps:.2%}")
