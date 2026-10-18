#ifndef DetectorConstruction_h
#define DetectorConstruction_h 1

#include "G4VUserDetectorConstruction.hh"

class G4LogicalVolume;

class DetectorConstruction : public G4VUserDetectorConstruction
{
  public:
    G4VPhysicalVolume* Construct() override;
    void ConstructSDandField() override;

  private:
    G4LogicalVolume* fLogicMagnet = nullptr;
};

#endif
