#include "MuonSD.hh"

#include "G4HCofThisEvent.hh"
#include "G4SDManager.hh"
#include "G4Step.hh"
#include "G4SystemOfUnits.hh"

namespace {
// Birks' law per STEP: dEvis = dE / (1 + kB * dE/dx).
// kB = 0.126 mm/MeV is a typical value for polyvinyltoluene scintillator
// (Birks 1964 and later fits; it depends on the product, so calibrate it).
constexpr G4double kBirks = 0.126 * mm / MeV;
}

MuonSD::MuonSD(const G4String& name, const G4String& hitsCollectionName)
  : G4VSensitiveDetector(name)
{
  collectionName.insert(hitsCollectionName);
}

void MuonSD::Initialize(G4HCofThisEvent* hce)
{
  fHitsCollection = new MuonHitsCollection(SensitiveDetectorName, collectionName[0]);
  G4int hcID = G4SDManager::GetSDMpointer()->GetCollectionID(fHitsCollection);
  hce->AddHitsCollection(hcID, fHitsCollection);

  // One hit object per counter for this event. The threshold is deliberately
  // NOT applied here: Geant4 may split one physical traversal into many steps.
  for (G4int i = 0; i < kNCounters; ++i) fHitsCollection->insert(new MuonHit());
}

G4bool MuonSD::ProcessHits(G4Step* step, G4TouchableHistory*)
{
  const G4double edep = step->GetTotalEnergyDeposit();
  if (edep <= 0.) return false;

  const G4int copy = step->GetPreStepPoint()->GetTouchable()->GetCopyNumber();
  auto* hit = (*fHitsCollection)[copy];

  const G4double length = step->GetStepLength();
  const G4double evis = (length > 0.) ? edep / (1. + kBirks * edep / length) : edep;

  hit->AddEdep(edep);
  hit->AddEvis(evis);
  hit->SetTimeIfEarlier(step->GetPreStepPoint()->GetGlobalTime());
  hit->SetPos(step->GetPreStepPoint()->GetPosition());
  return true;
}
