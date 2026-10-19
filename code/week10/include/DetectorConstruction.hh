#ifndef DetectorConstruction_h
#define DetectorConstruction_h 1

#include "G4VUserDetectorConstruction.hh"
#include "globals.hh"

class G4GenericMessenger;
class G4LogicalVolume;

// Geometry of tf_musr.mac, built in C++.
// Copy numbers play the role of musrSim volume IDs: World -1, Target 5, CounterU 11, CounterD 1.
class DetectorConstruction : public G4VUserDetectorConstruction
{
  public:
    DetectorConstruction();
    ~DetectorConstruction() override;
    G4VPhysicalVolume* Construct() override;
    void ConstructSDandField() override;

  private:
    G4double fB;                       // transverse field along +x, set with /tf/B before /run/initialize
    G4LogicalVolume* fLogicCounter = nullptr;
    G4GenericMessenger* fMessenger = nullptr;
};

#endif
