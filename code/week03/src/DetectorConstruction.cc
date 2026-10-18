#include "DetectorConstruction.hh"

#include "G4Box.hh"
#include "G4LogicalVolume.hh"
#include "G4NistManager.hh"
#include "G4PVPlacement.hh"
#include "G4SystemOfUnits.hh"

G4VPhysicalVolume* DetectorConstruction::Construct()
{
  G4NistManager* nist = G4NistManager::Instance();
  G4Material* worldMat = nist->FindOrBuildMaterial("G4_AIR");
  G4Material* blockMat = nist->FindOrBuildMaterial("G4_CONCRETE");  // Mission 2: the only line that changes

  // --- World ---
  G4double worldSize = 1.0 * m;
  G4VSolid* solidWorld =
    new G4Box("World", 0.5 * worldSize, 0.5 * worldSize, 0.5 * worldSize);
  auto* logicWorld = new G4LogicalVolume(solidWorld, worldMat, "World");
  auto* physWorld = new G4PVPlacement(
    nullptr, G4ThreeVector(), logicWorld, "World",
    nullptr, false, 0, true);

  // --- Block: 10x10x10 cm, centred on the world ---
  G4double blockSide = 10.0 * cm;
  G4VSolid* solidBlock = new G4Box("Block", 0.5 * blockSide,
                                   0.5 * blockSide, 0.5 * blockSide);
  auto* logicBlock = new G4LogicalVolume(solidBlock, blockMat, "Block");
  new G4PVPlacement(
    nullptr, G4ThreeVector(), logicBlock, "Block",
    logicWorld, false, 0, true);  // last argument: check overlaps at placement

  return physWorld;
}
