#include "DetectorConstruction.hh"

#include "MuonSD.hh"

#include "G4Box.hh"
#include "G4LogicalVolume.hh"
#include "G4NistManager.hh"
#include "G4PVPlacement.hh"
#include "G4SDManager.hh"
#include "G4SystemOfUnits.hh"

// Mission 5 / 5C: two 10 x 10 x 1 cm3 plastic counters, 20 cm apart along z.
// One logical volume "Counter", placed twice with copy numbers 0 (top) and 1 (bottom).
// The world is 3 m wide so the toy cosmic source plane (up to +-1.5 m) stays inside it.
G4VPhysicalVolume* DetectorConstruction::Construct()
{
  auto* nist = G4NistManager::Instance();
  auto* air = nist->FindOrBuildMaterial("G4_AIR");
  auto* scint = nist->FindOrBuildMaterial("G4_PLASTIC_SC_VINYLTOLUENE");

  auto* logicWorld = new G4LogicalVolume(new G4Box("World", 1.5 * m, 1.5 * m, 0.5 * m), air, "World");
  auto* physWorld = new G4PVPlacement(nullptr, {}, logicWorld, "World", nullptr, false, 0, true);

  auto* logicCounter =
    new G4LogicalVolume(new G4Box("Counter", 5. * cm, 5. * cm, 0.5 * cm), scint, "Counter");
  new G4PVPlacement(nullptr, G4ThreeVector(0, 0, -10. * cm), logicCounter, "Counter", logicWorld, false, 0, true);
  new G4PVPlacement(nullptr, G4ThreeVector(0, 0, +10. * cm), logicCounter, "Counter", logicWorld, false, 1, true);

  return physWorld;
}

void DetectorConstruction::ConstructSDandField()
{
  auto* sdManager = G4SDManager::GetSDMpointer();
  auto* muonSD = new MuonSD("MuonCounter/MuonSD", "MuonHitsCollection");
  sdManager->AddNewDetector(muonSD);
  // "Counter" must match the logical volume's name from Construct()
  SetSensitiveDetector("Counter", muonSD);
}
