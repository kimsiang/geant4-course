#include "DetectorConstruction.hh"

#include "TelescopeSD.hh"

#include "G4Box.hh"
#include "G4Exception.hh"
#include "G4GenericMessenger.hh"
#include "G4LogicalVolume.hh"
#include "G4Material.hh"
#include "G4NistManager.hh"
#include "G4Orb.hh"
#include "G4PVPlacement.hh"
#include "G4SDManager.hh"

namespace {
// G4GenericMessenger commands are created once, on the master. Do not broadcast them
// to worker threads: the workers have no DetectorConstruction of their own.
void Local(G4GenericMessenger::Command& c) { c.command->SetToBeBroadcasted(false); }
}

DetectorConstruction::DetectorConstruction()
{
  fDetMessenger = new G4GenericMessenger(this, "/muo/det/", "Muography starter geometry");
  Local(fDetMessenger->DeclarePropertyWithUnit("overburden", "m", fOverburden, "rock above the tunnel ceiling"));
  Local(fDetMessenger->DeclarePropertyWithUnit("planeHalf", "m", fPlaneHalf, "half side of each tracker plane"));
  Local(fDetMessenger->DeclarePropertyWithUnit("planeSep", "m", fPlaneSep, "distance between the two planes"));
  Local(fDetMessenger->DeclareProperty("void", fVoidOn, "place the air void in the rock (true/false)"));
  Local(fDetMessenger->DeclarePropertyWithUnit("voidRadius", "m", fVoidR, "void radius"));
  Local(fDetMessenger->DeclarePropertyWithUnit("voidX", "m", fVoidX, "void centre x (world)"));
  Local(fDetMessenger->DeclarePropertyWithUnit("voidY", "m", fVoidY, "void centre y (world)"));
  Local(fDetMessenger->DeclarePropertyWithUnit("voidZ", "m", fVoidZ, "void centre z (world; ground is z = 0)"));

  fSkyMessenger = new G4GenericMessenger(this, "/muo/sky/", "Cosmic-muon sky (Guan et al. 2015)");
  Local(fSkyMessenger->DeclarePropertyWithUnit("emin", "GeV", fEmin, "lowest sampled energy at the ground"));
  Local(fSkyMessenger->DeclarePropertyWithUnit("emax", "GeV", fEmax, "highest sampled energy"));
  Local(fSkyMessenger->DeclarePropertyWithUnit("thetaMax", "deg", fThetaMax, "largest zenith angle sampled"));
  Local(fSkyMessenger->DeclarePropertyWithUnit("aimMargin", "m", fAimMargin, "aim plane = planes + this margin"));
}

DetectorConstruction::~DetectorConstruction()
{
  delete fDetMessenger;
  delete fSkyMessenger;
}

G4VPhysicalVolume* DetectorConstruction::Construct()
{
  auto* nist = G4NistManager::Instance();
  auto* air = nist->FindOrBuildMaterial("G4_AIR");
  auto* scint = nist->FindOrBuildMaterial("G4_PLASTIC_SC_VINYLTOLUENE");

  // PDG "standard rock": <Z> = 11, <A> = 22, rho = 2.65 g/cm3 (Z/A = 0.5).
  // A single pseudo-element is exactly how the PDG defines it for muon tables.
  auto* rock = G4Material::GetMaterial("StandardRock", false);
  if (!rock) rock = new G4Material("StandardRock", 11., 22. * g / mole, 2.65 * g / cm3);

  const G4double rockHalfZ = 0.5 * (fOverburden + 2. * kTunnelHalf + kFloorRock);
  const G4double rockCentreZ = -rockHalfZ;   // top face at z = 0
  const G4double worldHalfXY = fRockHalfXY + 10. * m;
  const G4double worldHalfZ = 2. * rockHalfZ + 10. * m;

  auto* logicWorld = new G4LogicalVolume(new G4Box("World", worldHalfXY, worldHalfXY, worldHalfZ), air, "World");
  auto* physWorld = new G4PVPlacement(nullptr, {}, logicWorld, "World", nullptr, false, 0, true);

  auto* logicRock = new G4LogicalVolume(new G4Box("Rock", fRockHalfXY, fRockHalfXY, rockHalfZ), rock, "Rock");
  new G4PVPlacement(nullptr, G4ThreeVector(0, 0, rockCentreZ), logicRock, "Rock", logicWorld, false, 0, true);

  // tunnel: an air box inside the rock, running along y
  const G4double tunnelLocalZ = TunnelCentreZ() - rockCentreZ;
  auto* logicTunnel = new G4LogicalVolume(new G4Box("Tunnel", kTunnelHalf, fRockHalfXY, kTunnelHalf), air, "Tunnel");
  new G4PVPlacement(nullptr, G4ThreeVector(0, 0, tunnelLocalZ), logicTunnel, "Tunnel", logicRock, false, 0, true);

  // two 1 cm scintillator planes, copy 0 = top, 1 = bottom (positions in tunnel coordinates)
  auto* logicPlane = new G4LogicalVolume(new G4Box("Plane", fPlaneHalf, fPlaneHalf, 0.5 * cm), scint, "Plane");
  new G4PVPlacement(nullptr, G4ThreeVector(0, 0, +0.5 * fPlaneSep), logicPlane, "Plane", logicTunnel, false, 0, true);
  new G4PVPlacement(nullptr, G4ThreeVector(0, 0, -0.5 * fPlaneSep), logicPlane, "Plane", logicTunnel, false, 1, true);

  // the target: an air-filled void in the rock above the tunnel
  if (fVoidOn) {
    if (fVoidZ + fVoidR > 0. || fVoidZ - fVoidR < -fOverburden)
      G4Exception("DetectorConstruction", "MUO001", FatalException,
                  "The void must lie inside the rock between the ground and the tunnel ceiling.");
    auto* logicVoid = new G4LogicalVolume(new G4Orb("Void", fVoidR), air, "Void");
    new G4PVPlacement(nullptr, G4ThreeVector(fVoidX, fVoidY, fVoidZ - rockCentreZ), logicVoid, "Void", logicRock,
                      false, 0, true);
  }

  G4cout << "Muography starter: overburden " << fOverburden / m << " m, rock to z = " << -2. * rockHalfZ / m
         << " m, planes " << 2. * fPlaneHalf / m << " m x " << 2. * fPlaneHalf / m << " m, " << fPlaneSep / m
         << " m apart, top plane at z = " << TopPlaneZ() / m << " m, void "
         << (fVoidOn ? "ON" : "off") << G4endl;
  return physWorld;
}

void DetectorConstruction::ConstructSDandField()
{
  auto* sd = new TelescopeSD("Telescope/PlaneSD", "PlaneHits");
  G4SDManager::GetSDMpointer()->AddNewDetector(sd);
  SetSensitiveDetector("Plane", sd);
}
