#include "TelescopeSD.hh"

#include "G4HCofThisEvent.hh"
#include "G4SDManager.hh"
#include "G4Step.hh"

TelescopeSD::TelescopeSD(const G4String& name, const G4String& hitsCollectionName)
  : G4VSensitiveDetector(name)
{
  collectionName.insert(hitsCollectionName);
}

void TelescopeSD::Initialize(G4HCofThisEvent* hce)
{
  fHits = new TelescopeHitsCollection(SensitiveDetectorName, collectionName[0]);
  hce->AddHitsCollection(G4SDManager::GetSDMpointer()->GetCollectionID(fHits), fHits);
  for (G4int i = 0; i < kNPlanes; ++i) fHits->insert(new TelescopeHit());
}

G4bool TelescopeSD::ProcessHits(G4Step* step, G4TouchableHistory*)
{
  if (step->GetTrack()->GetTrackID() != 1) return false;   // primary muon only (ideal tracker)
  const auto* pre = step->GetPreStepPoint();
  const G4int copy = pre->GetTouchable()->GetCopyNumber();   // 0 = top, 1 = bottom
  (*fHits)[copy]->Set(pre->GetPosition(), pre->GetGlobalTime(), pre->GetKineticEnergy());
  return true;
}
