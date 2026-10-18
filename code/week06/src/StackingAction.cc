#include "StackingAction.hh"

#include "RunAction.hh"

#include "G4Track.hh"
#include "G4VProcess.hh"

G4ClassificationOfNewTrack StackingAction::ClassifyNewTrack(const G4Track* track)
{
  if (track->GetParentID() > 0) {
    const auto* creator = track->GetCreatorProcess();
    fRunAction->CountSecondary(track->GetDefinition()->GetParticleName(),
                               creator ? creator->GetProcessName() : "unknown");
  }
  return fUrgent;  // track everything: we only count
}
