#include "DetectorConstruction.hh"

#include "CounterSD.hh"

#include "G4Box.hh"
#include "G4ChordFinder.hh"
#include "G4ClassicalRK4.hh"
#include "G4FieldManager.hh"
#include "G4GenericMessenger.hh"
#include "G4LogicalVolume.hh"
#include "G4Mag_SpinEqRhs.hh"
#include "G4NistManager.hh"
#include "G4PVPlacement.hh"
#include "G4SDManager.hh"
#include "G4SystemOfUnits.hh"
#include "G4TransportationManager.hh"
#include "G4UniformMagField.hh"

DetectorConstruction::DetectorConstruction() : fB(0.010 * tesla)
{
  fMessenger = new G4GenericMessenger(this, "/tf/", "Week 10 TF-muSR controls");
  fMessenger->DeclarePropertyWithUnit("B", "tesla", fB,
                                      "Transverse field along +x, e.g. /tf/B 0.010 T (before /run/initialize)");
}

DetectorConstruction::~DetectorConstruction() { delete fMessenger; }

G4VPhysicalVolume* DetectorConstruction::Construct()
{
  auto* nist = G4NistManager::Instance();
  auto* air = nist->FindOrBuildMaterial("G4_AIR");
  auto* cu = nist->FindOrBuildMaterial("G4_Cu");
  auto* scint = nist->FindOrBuildMaterial("G4_PLASTIC_SC_VINYLTOLUENE");

  // construct box World 400 400 400 ... (half-lengths, mm)
  auto* logicWorld = new G4LogicalVolume(new G4Box("World", 400 * mm, 400 * mm, 400 * mm), air, "World");
  auto* physWorld = new G4PVPlacement(nullptr, {}, logicWorld, "World", nullptr, false, -1, true);

  // construct box Target 15 15 3 G4_Cu 0 0 0 ... dead 5   -> 30 x 30 x 6 mm copper
  auto* logicTarget = new G4LogicalVolume(new G4Box("Target", 15 * mm, 15 * mm, 3 * mm), cu, "Target");
  new G4PVPlacement(nullptr, {}, logicTarget, "Target", logicWorld, false, 5, true);

  // construct box CounterU/CounterD 40 3 40 ... at y = +45 / -45 mm, IDs 11 / 1
  fLogicCounter = new G4LogicalVolume(new G4Box("Counter", 40 * mm, 3 * mm, 40 * mm), scint, "Counter");
  new G4PVPlacement(nullptr, {0, +45 * mm, 0}, fLogicCounter, "CounterU", logicWorld, false, 11, true);
  new G4PVPlacement(nullptr, {0, -45 * mm, 0}, fLogicCounter, "CounterD", logicWorld, false, 1, true);

  return physWorld;
}

void DetectorConstruction::ConstructSDandField()
{
  auto* sd = new CounterSD("TF/CounterSD");
  G4SDManager::GetSDMpointer()->AddNewDetector(sd);
  SetSensitiveDetector(fLogicCounter, sd);

  // globalfield TF 400 400 400 uniform 0 0 0 log_World 0.01 0 0  ->  Bx = 10 mT everywhere
  auto* field = new G4UniformMagField(G4ThreeVector(fB, 0., 0.));
  // Spin-aware equation of motion: 12 variables (x, p, t, ..., spin). Precession IN FLIGHT.
  // (Precession AT REST is done by G4DecayWithSpin, which reads this same field.)
  auto* equation = new G4Mag_SpinEqRhs(field);
  auto* stepper = new G4ClassicalRK4(equation, 12);
  auto* fieldManager = G4TransportationManager::GetTransportationManager()->GetFieldManager();
  fieldManager->SetDetectorField(field);
  fieldManager->SetChordFinder(new G4ChordFinder(field, 0.01 * mm, stepper));

  G4cout << "Field at (0,0,0): Bx = " << fB / tesla * 1000. << " mT  (printFieldValueAtPoint analogue)" << G4endl;
}
