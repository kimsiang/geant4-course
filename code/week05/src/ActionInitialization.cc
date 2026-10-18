#include "ActionInitialization.hh"

#include "EventAction.hh"
#include "PrimaryGeneratorAction.hh"
#include "RunAction.hh"

void ActionInitialization::Build() const
{
  SetUserAction(new PrimaryGeneratorAction());
  auto* runAction = new RunAction();
  SetUserAction(runAction);
  SetUserAction(new EventAction(runAction));
}
