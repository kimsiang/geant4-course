#include "SteppingAction.hh"

#include "EventAction.hh"

#include "G4Step.hh"

void SteppingAction::UserSteppingAction(const G4Step* step)
{
  const auto* preVolume =
    step->GetPreStepPoint()->GetTouchableHandle()->GetVolume();
  if (!preVolume || preVolume->GetName() != "Scintillator") return;

  const G4double edep = step->GetTotalEnergyDeposit();
  if (edep > 0.) fEventAction->AddEdep(edep);

  // For the primary muon, track the energy lost by the primary itself.
  // This is closer to a stopping-power observable than Edep, because a
  // delta ray may carry energy out of the scoring volume.
  const auto* track = step->GetTrack();
  if (track->GetParentID() == 0) {
    const G4double dEprimary =
      step->GetPreStepPoint()->GetKineticEnergy() -
      step->GetPostStepPoint()->GetKineticEnergy();
    if (dEprimary > 0.) fEventAction->AddPrimaryLoss(dEprimary);
    fEventAction->AddPrimaryPath(step->GetStepLength());
  }
}
