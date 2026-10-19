#include "DetectorConstruction.hh"

#include "G4Box.hh"
#include "G4FieldManager.hh"
#include "G4LogicalVolume.hh"
#include "G4NistManager.hh"
#include "G4PVPlacement.hh"
#include "G4SystemOfUnits.hh"
#include "G4TransportationManager.hh"
#include "G4UniformMagField.hh"

#include "FringeField.hh"

// Lab 7.1: tracker 1 (3 Si planes) -- 1 m dipole, By = 1.5 T -- tracker 2 (3 Si planes)
//
//   z [m]:  -1.0 -0.8 -0.6 | -0.5 ... magnet ... +0.5 | +0.6 +0.8 +1.0
//
G4VPhysicalVolume* DetectorConstruction::Construct()
{
  auto* nist = G4NistManager::Instance();
  auto* air = nist->FindOrBuildMaterial("G4_AIR");
  auto* si = nist->FindOrBuildMaterial("G4_Si");

  auto* logicWorld = new G4LogicalVolume(new G4Box("World", 1.5 * m, 1.5 * m, 1.5 * m), air, "World");
  auto* physWorld = new G4PVPlacement(nullptr, {}, logicWorld, "World", nullptr, false, 0, true);

  // Field region: an air box 1 m long in z. The field is attached to it below.
  fLogicMagnet = new G4LogicalVolume(new G4Box("Magnet", 0.5 * m, 0.5 * m, 0.5 * m), air, "Magnet");
  new G4PVPlacement(nullptr, {}, fLogicMagnet, "Magnet", logicWorld, false, 0, true);

  // Six 300 um silicon planes, 1 x 1 m (a 1 GeV muon is bent 0.44 m sideways by plane 5).
  // The copy number is the plane index 0..5.
  auto* logicPlane = new G4LogicalVolume(new G4Box("Plane", 50 * cm, 50 * cm, 150 * um), si, "Plane");
  const G4double zPlane[6] = {-1.0 * m, -0.8 * m, -0.6 * m, 0.6 * m, 0.8 * m, 1.0 * m};
  for (G4int i = 0; i < 6; ++i) {
    new G4PVPlacement(nullptr, G4ThreeVector(0., 0., zPlane[i]), logicPlane, "Plane",
                      logicWorld, false, i, true);
  }
  return physWorld;
}

void DetectorConstruction::ConstructSDandField()
{
  // (sensitive detectors would be registered here too; Week 5)
  const G4bool useFringeMap = false;   // Lab 7.2: set true, rebuild, rerun

  if (!useFringeMap) {
    // Lab 7.1: ideal uniform field inside the magnet box only
    G4ThreeVector fieldValue(0., 1.5 * tesla, 0.);
    auto* magField = new G4UniformMagField(fieldValue);
    auto* fieldMgr = new G4FieldManager();
    fieldMgr->SetDetectorField(magField);
    fieldMgr->CreateChordFinder(magField);   // Geant4 11.4 default: templated Dormand-Prince 4/5
    // attach the field to the magnet volume only (and its daughters)
    fLogicMagnet->SetFieldManager(fieldMgr, true);
  } else {
    // Lab 7.2: a field "map" defined everywhere, so it goes on the global field manager
    auto* magField = new FringeField();
    auto* fieldMgr = G4TransportationManager::GetTransportationManager()->GetFieldManager();
    fieldMgr->SetDetectorField(magField);
    fieldMgr->CreateChordFinder(magField);
  }
}
