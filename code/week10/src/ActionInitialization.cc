#include "ActionInitialization.hh"

#include "EventAction.hh"
#include "PrimaryGeneratorAction.hh"
#include "RunAction.hh"
#include "SteppingAction.hh"

void ActionInitialization::BuildForMaster() const
{
  SetUserAction(new RunAction());
}

void ActionInitialization::Build() const
{
  SetUserAction(new PrimaryGeneratorAction());
  auto* run = new RunAction();
  SetUserAction(run);
  auto* event = new EventAction(run);
  SetUserAction(event);
  SetUserAction(new SteppingAction(event));
}
