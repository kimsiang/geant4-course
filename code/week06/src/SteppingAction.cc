#include "SteppingAction.hh"

#include "EventAction.hh"

#include "G4Step.hh"

void SteppingAction::UserSteppingAction(const G4Step* step)
{
  const auto* volume = step->GetPreStepPoint()->GetPhysicalVolume();
  if (volume && volume->GetName() == "Block")
    fEventAction->AddEdep(step->GetTotalEnergyDeposit());
}
