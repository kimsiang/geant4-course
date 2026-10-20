#ifndef EventAction_h
#define EventAction_h 1

#include "G4UserEventAction.hh"
#include "globals.hh"

class RunAction;

class EventAction : public G4UserEventAction
{
  public:
    explicit EventAction(RunAction* runAction) : fRunAction(runAction) {}
    void EndOfEventAction(const G4Event* event) override;

  private:
    RunAction* fRunAction = nullptr;
    G4int fHitsID = -1;
};

#endif
