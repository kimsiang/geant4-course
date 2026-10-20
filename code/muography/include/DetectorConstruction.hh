#ifndef DetectorConstruction_h
#define DetectorConstruction_h 1

#include "G4SystemOfUnits.hh"
#include "G4VUserDetectorConstruction.hh"
#include "globals.hh"

class G4GenericMessenger;

// Muography starter geometry (z points UP; ground surface at z = 0):
//
//   z = 0        +-------------------------------------------+  flat ground, sky above
//                |  standard rock (2.65 g/cm3)               |
//                |        ( void: optional air sphere )      |
//   z = -T       |      +------ tunnel (air) ------+         |  T = overburden
//                |      |   == top plane ==        |         |
//                |      |   == bottom plane ==     |         |
//                +------+--------------------------+---------+  2 m of rock under the floor
//
// All settings are UI commands (/muo/det/..., /muo/sky/...) and must be given
// BEFORE /run/initialize. The sky settings live here, not in the generator,
// because the master thread (which writes the run summary) has no generator.
class DetectorConstruction : public G4VUserDetectorConstruction
{
  public:
    DetectorConstruction();
    ~DetectorConstruction() override;

    G4VPhysicalVolume* Construct() override;
    void ConstructSDandField() override;

    // geometry, read by the generator and the run summary
    G4double Overburden() const { return fOverburden; }
    G4double RockHalfXY() const { return fRockHalfXY; }
    G4double TopPlaneZ() const { return TunnelCentreZ() + 0.5 * fPlaneSep; }
    G4double BottomPlaneZ() const { return TunnelCentreZ() - 0.5 * fPlaneSep; }
    G4double PlaneHalf() const { return fPlaneHalf; }
    G4double PlaneSep() const { return fPlaneSep; }
    G4bool VoidOn() const { return fVoidOn; }
    G4double VoidRadius() const { return fVoidR; }
    G4double VoidX() const { return fVoidX; }
    G4double VoidY() const { return fVoidY; }
    G4double VoidZ() const { return fVoidZ; }

    // sky (generator) settings
    G4double EMin() const { return fEmin; }
    G4double EMax() const { return fEmax; }
    G4double ThetaMax() const { return fThetaMax; }
    G4double AimHalf() const { return fPlaneHalf + fAimMargin; }

    G4double TunnelCentreZ() const { return -fOverburden - kTunnelHalf; }
    static constexpr G4double kTunnelHalf = 2. * m;   // tunnel is 4 m x 4 m in cross-section
    static constexpr G4double kFloorRock = 2. * m;    // rock under the tunnel floor

  private:
    G4GenericMessenger* fDetMessenger = nullptr;
    G4GenericMessenger* fSkyMessenger = nullptr;

    G4double fOverburden = 30. * m;
    G4double fRockHalfXY = 150. * m;   // wide enough that every sampled track enters through the top
    G4double fPlaneHalf = 0.5 * m;     // 1 m x 1 m scintillator planes
    G4double fPlaneSep = 0.5 * m;      // centre-to-centre distance of the two planes
    G4bool fVoidOn = false;
    G4double fVoidR = 4. * m;
    G4double fVoidX = 10. * m, fVoidY = 0., fVoidZ = -15. * m;   // world coordinates

    G4double fEmin = 10. * GeV;        // below ~18 GeV no muon crosses 30 m of rock (range table)
    G4double fEmax = 10. * TeV;
    G4double fThetaMax = 60. * deg;
    G4double fAimMargin = 0.5 * m;     // aim plane = planes + margin for scattering in the rock
};

#endif
