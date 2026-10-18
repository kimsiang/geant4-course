#include "DetectorConstruction.hh"

#include "G4Box.hh"
#include "G4LogicalVolume.hh"
#include "G4NistManager.hh"
#include "G4PVPlacement.hh"
#include "G4SystemOfUnits.hh"

// Mission 4: a 50 x 50 x 10 cm3 plastic scintillator slab in air,
// the bench counter of the course front matter (Example 0.2).
G4VPhysicalVolume* DetectorConstruction::Construct()
{
  G4NistManager* nist = G4NistManager::Instance();
  G4Material* air = nist->FindOrBuildMaterial("G4_AIR");
  G4Material* scint = nist->FindOrBuildMaterial("G4_PLASTIC_SC_VINYLTOLUENE");

  auto* solidWorld = new G4Box("World", 1. * m, 1. * m, 1. * m);  // half-lengths: a 2 m cube
  auto* logicWorld = new G4LogicalVolume(solidWorld, air, "World");
  auto* physWorld = new G4PVPlacement(nullptr, G4ThreeVector(), logicWorld, "World",
                                      nullptr, false, 0, true);

  // 10 cm thick along the beam (z), 50 cm wide so few delta-rays leave sideways
  auto* solidScint = new G4Box("Scintillator", 25. * cm, 25. * cm, 5. * cm);
  auto* logicScint = new G4LogicalVolume(solidScint, scint, "Scintillator");
  new G4PVPlacement(nullptr, G4ThreeVector(), logicScint, "Scintillator",
                    logicWorld, false, 0, true);

  return physWorld;
}
