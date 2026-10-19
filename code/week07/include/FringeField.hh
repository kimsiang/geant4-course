#ifndef FringeField_h
#define FringeField_h 1

#include "G4MagneticField.hh"
#include "G4SystemOfUnits.hh"

#include <cmath>

// Lab 7.2: a synthetic 1D field map. By(z) falls off at both magnet ends with a
// Fermi-function edge of width a. Its field integral equals the uniform 1.5 T x 1 m
// (to 0.1%), but the field now leaks into the trackers. Units: Geant4 internal.
class FringeField : public G4MagneticField
{
  public:
    FringeField(G4double b0 = 1.5 * tesla, G4double halfLength = 0.5 * m, G4double edge = 5. * cm)
      : fB0(b0), fHalf(halfLength), fEdge(edge) {}

    void GetFieldValue(const G4double point[4], G4double* field) const override
    {
      const G4double z = point[2];
      field[0] = 0.;
      field[1] = fB0 / (1. + std::exp((std::abs(z) - fHalf) / fEdge));
      field[2] = 0.;
    }

  private:
    G4double fB0, fHalf, fEdge;
};

#endif
