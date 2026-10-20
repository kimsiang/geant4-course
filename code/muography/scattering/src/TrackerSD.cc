#include "TrackerSD.hh"

#include "G4HCofThisEvent.hh"
#include "G4SDManager.hh"
#include "G4Step.hh"

TrackerSD::TrackerSD(const G4String& name, const G4String& hcName) : G4VSensitiveDetector(name)
{
  collectionName.insert(hcName);
}

void TrackerSD::Initialize(G4HCofThisEvent* hce)
{
  fHits = new TrackerHitsCollection(SensitiveDetectorName, collectionName[0]);
  hce->AddHitsCollection(G4SDManager::GetSDMpointer()->GetCollectionID(fHits), fHits);
  for (G4int i = 0; i < 4; ++i) fHits->insert(new TrackerHit());
}

G4bool TrackerSD::ProcessHits(G4Step* step, G4TouchableHistory*)
{
  if (step->GetTrack()->GetTrackID() != 1) return false;
  const auto* pre = step->GetPreStepPoint();
  (*fHits)[pre->GetTouchable()->GetCopyNumber()]->Set(pre->GetPosition());
  return true;
}
