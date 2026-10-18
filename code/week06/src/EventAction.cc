#include "EventAction.hh"

#include "RunAction.hh"

void EventAction::EndOfEventAction(const G4Event*)
{
  fRunAction->AddEventEdep(fEdep);
}
