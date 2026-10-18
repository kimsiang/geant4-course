#include "SteppingAction.hh"

#include "EventAction.hh"

#include "G4Step.hh"
#include "G4VPhysicalVolume.hh"

void SteppingAction::UserSteppingAction(const G4Step* step)
{
  if (step->GetTrack()->GetParentID() != 0) return;  // primary muon only

  const G4StepPoint* pre = step->GetPreStepPoint();
  if (pre->GetStepStatus() != fGeomBoundary) return; // the step that ENTERS a volume
  const G4VPhysicalVolume* vol = pre->GetPhysicalVolume();
  if (!vol || vol->GetName() != "Plane") return;

  const G4ThreeVector& pos = pre->GetPosition();
  fEventAction->SetHit(vol->GetCopyNo(), pos.x(), pos.z());
}
