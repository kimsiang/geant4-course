#include "SteppingAction.hh"

#include "EventAction.hh"

#include "G4Step.hh"
#include "G4VProcess.hh"

void SteppingAction::UserSteppingAction(const G4Step* step)
{
  const auto* track = step->GetTrack();
  if (track->GetParentID() != 0) return;                  // primary muon only
  const auto* proc = step->GetPostStepPoint()->GetProcessDefinedStep();
  if (!proc) return;
  const G4String& name = proc->GetProcessName();          // "DecayWithSpin" or plain "Decay"
  if (name != "DecayWithSpin" && name != "Decay") return;
  const G4int id = step->GetPreStepPoint()->GetTouchable()->GetCopyNumber();
  fEvent->SetDecay(step->GetPostStepPoint()->GetGlobalTime(), id,
                   step->GetPostStepPoint()->GetPolarization());
}
