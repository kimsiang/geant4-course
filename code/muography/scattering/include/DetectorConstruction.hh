#ifndef DetectorConstruction_h
#define DetectorConstruction_h 1

#include "G4SystemOfUnits.hh"
#include "G4VUserDetectorConstruction.hh"
#include "globals.hh"

class G4Box;
class G4GenericMessenger;

// Scattering muography, no magnet (z points UP, muons travel down):
//   four ideal tracker planes at z = +60, +40, -40, -60 cm (300 um silicon, 1.2 m wide)
//   and between them either a steel SLAB (1 m x 1 m, thickness set by command)
//   or a steel BLOCK (20 cm cube) for the PoCA image.
// The two upper planes measure the incoming line, the two lower planes the outgoing line.
class DetectorConstruction : public G4VUserDetectorConstruction
{
  public:
    DetectorConstruction();
    ~DetectorConstruction() override;
    G4VPhysicalVolume* Construct() override;
    void ConstructSDandField() override;

    static constexpr G4double kPlaneZ[4] = {60. * cm, 40. * cm, -40. * cm, -60. * cm};

    // /scat/det/thickness: resizes the slab between runs (no rebuild needed)
    void SetThickness(G4double t);

  private:
    G4Box* fSlab = nullptr;
    G4GenericMessenger* fMessenger = nullptr;
    G4String fShape = "slab";
    G4String fMaterial = "G4_Fe";
    G4double fThickness = 5. * cm;
};

#endif
