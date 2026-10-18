#ifndef EventAction_h
#define EventAction_h 1

#include "G4UserEventAction.hh"
#include "globals.hh"

class RunAction;

class EventAction : public G4UserEventAction
{
  public:
    explicit EventAction(RunAction* runAction) : fRunAction(runAction) {}
    void BeginOfEventAction(const G4Event*) override { fEdep = 0.; }
    void EndOfEventAction(const G4Event*) override;
    void AddEdep(G4double e) { fEdep += e; }

  private:
    RunAction* fRunAction = nullptr;
    G4double fEdep = 0.;
};

#endif
