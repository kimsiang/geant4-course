#ifndef SkyFlux_h
#define SkyFlux_h 1

// Sea-level cosmic-muon intensity: the Gaisser parametrisation with the
// Guan et al. (2015) correction for low energies and large zenith angles
// (M. Guan et al., arXiv:1509.06176, Eq. 3; the cos(theta*) curvature
// correction of D. Chirkin, hep-ph/0407078).
//
//   dI/dE dOmega = 0.14 [E (1 + 3.64 GeV / (E cos^1.29 th*))]^-2.7
//                  x [ 1/(1 + 1.1 E cos th*/115 GeV) + 0.054/(1 + 1.1 E cos th*/850 GeV) ]
//                  in cm^-2 s^-1 sr^-1 GeV^-1, E in GeV
//
// Approximations (state them in any result you quote):
//  - one intensity for mu+ and mu-; the charge is drawn with mu+/mu- = 1.27
//    (a typical sea-level value; it depends on energy and site)
//  - sea level, no altitude, geomagnetic or seasonal correction
//  - above ~100 TeV, prompt muons and the knee are ignored (irrelevant here)
//  - the parametrisation is good to roughly 10-20% in absolute flux: this is
//    the "flux-model systematic" of the analysis.

#include <cmath>

namespace SkyFlux
{
// cos(theta*) of the curved atmosphere (Chirkin), from the geometric cos(theta)
inline double CosThetaStar(double c)
{
  const double P1 = 0.102573, P2 = -0.068287, P3 = 0.958633, P4 = 0.0407253, P5 = 0.817285;
  const double num = c * c + P1 * P1 + P2 * std::pow(c, P3) + P4 * std::pow(c, P5);
  const double den = 1. + P1 * P1 + P2 + P4;
  return std::sqrt(num / den);
}

// differential intensity, cm^-2 s^-1 sr^-1 GeV^-1; E in GeV, c = cos(zenith)
inline double Intensity(double E, double c)
{
  const double cs = CosThetaStar(c);
  const double Eeff = E * (1. + 3.64 / (E * std::pow(cs, 1.29)));
  return 0.14 * std::pow(Eeff, -2.7) *
         (1. / (1. + 1.1 * E * cs / 115.) + 0.054 / (1. + 1.1 * E * cs / 850.));
}

// Upper bound used by the rejection sampler: Eeff >= E and the bracket <= 1.054,
// so Intensity(E, c) * c <= 0.14 * 1.054 * E^-2.7 for every c in [0, 1].
inline double Envelope(double E) { return 0.14 * 1.054 * std::pow(E, -2.7); }

// Flux through a HORIZONTAL plane, integrated over E in [emin, emax] GeV and
// cos(theta) in [cmin, 1], all azimuths: cm^-2 s^-1. Midpoint rule in log E and cos.
inline double PlaneFlux(double emin, double emax, double cmin)
{
  const int nE = 1200, nC = 200;
  const double lmin = std::log(emin), lmax = std::log(emax);
  double sum = 0.;
  for (int i = 0; i < nE; ++i) {
    const double E = std::exp(lmin + (i + 0.5) * (lmax - lmin) / nE);
    double inner = 0.;
    for (int j = 0; j < nC; ++j) {
      const double c = cmin + (j + 0.5) * (1. - cmin) / nC;
      inner += Intensity(E, c) * c;
    }
    sum += inner * (1. - cmin) / nC * E * (lmax - lmin) / nE;   // dE = E dlnE
  }
  return 2. * M_PI * sum;
}
}  // namespace SkyFlux

#endif
