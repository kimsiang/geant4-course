#include "DetectorConstruction.hh"

#include "TrackerSD.hh"

#include "G4Box.hh"
#include "G4GenericMessenger.hh"
#include "G4LogicalVolume.hh"
#include "G4NistManager.hh"
#include "G4PVPlacement.hh"
#include "G4SDManager.hh"
#include "G4RunManager.hh"

DetectorConstruction::DetectorConstruction()
{
  fMessenger = new G4GenericMessenger(this, "/scat/det/", "Scattering muography geometry");
  auto& shape = fMessenger->DeclareProperty("shape", fShape, "slab | block");
  shape.SetCandidates("slab block");
  shape.command->SetToBeBroadcasted(false);
  fMessenger->DeclareProperty("material", fMaterial, "NIST material of the object").command->SetToBeBroadcasted(false);
  fMessenger->DeclareMethodWithUnit("thickness", "cm", &DetectorConstruction::SetThickness, "slab thickness")
    .command->SetToBeBroadcasted(false);
}

DetectorConstruction::~DetectorConstruction() { delete fMessenger; }

G4VPhysicalVolume* DetectorConstruction::Construct()
{
  auto* nist = G4NistManager::Instance();
  auto* air = nist->FindOrBuildMaterial("G4_AIR");
  auto* si = nist->FindOrBuildMaterial("G4_Si");
  auto* obj = nist->FindOrBuildMaterial(fMaterial);

  auto* logicWorld = new G4LogicalVolume(new G4Box("World", 1. * m, 1. * m, 1. * m), air, "World");
  auto* physWorld = new G4PVPlacement(nullptr, {}, logicWorld, "World", nullptr, false, 0, true);

  auto* logicPlane = new G4LogicalVolume(new G4Box("Plane", 60. * cm, 60. * cm, 150. * um), si, "Plane");
  for (G4int i = 0; i < 4; ++i)
    new G4PVPlacement(nullptr, G4ThreeVector(0, 0, kPlaneZ[i]), logicPlane, "Plane", logicWorld, false, i, true);

  G4Box* box = (fShape == "block") ? new G4Box("Object", 10. * cm, 10. * cm, 10. * cm)
                                   : new G4Box("Object", 50. * cm, 50. * cm, 0.5 * fThickness);
  if (fShape == "slab") fSlab = box;
  new G4PVPlacement(nullptr, {}, new G4LogicalVolume(box, obj, "Object"), "Object", logicWorld, false, 0, true);

  G4cout << "Scattering setup: " << fShape << " of " << fMaterial << " ("
         << obj->GetRadlen() / cm << " cm radiation length)"
         << (fShape == "slab" ? ", thickness " + std::to_string(fThickness / cm) + " cm" : G4String(", 20 cm cube"))
         << G4endl;
  return physWorld;
}

void DetectorConstruction::SetThickness(G4double t)
{
  fThickness = t;
  if (fSlab) {   // after /run/initialize: change the existing solid, then tell the kernel
    fSlab->SetZHalfLength(0.5 * t);
    G4RunManager::GetRunManager()->GeometryHasBeenModified();
    G4cout << "Slab thickness now " << t / cm << " cm" << G4endl;
  }
}

void DetectorConstruction::ConstructSDandField()
{
  auto* sd = new TrackerSD("Tracker/PlaneSD", "TrackerHits");
  G4SDManager::GetSDMpointer()->AddNewDetector(sd);
  SetSensitiveDetector("Plane", sd);
}
