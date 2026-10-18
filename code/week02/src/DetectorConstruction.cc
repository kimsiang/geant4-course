#include "DetectorConstruction.hh"

#include "G4Box.hh"
#include "G4LogicalVolume.hh"
#include "G4NistManager.hh"
#include "G4PVPlacement.hh"
#include "G4SystemOfUnits.hh"

// Week 2: an empty world. Matter arrives in Week 3.
G4VPhysicalVolume* DetectorConstruction::Construct()
{
  auto* vacuum = G4NistManager::Instance()->FindOrBuildMaterial("G4_Galactic");

  const G4double halfWorld = 1.5 * m;  // a 3 m cube: the gun at z = -1 m is inside
  auto* solidWorld = new G4Box("World", halfWorld, halfWorld, halfWorld);
  auto* logicWorld = new G4LogicalVolume(solidWorld, vacuum, "World");

  return new G4PVPlacement(nullptr, G4ThreeVector(), logicWorld, "World",
                           nullptr, false, 0, true);
}
