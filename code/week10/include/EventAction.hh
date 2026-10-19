#ifndef EventAction_h
#define EventAction_h 1

#include "G4ThreeVector.hh"
#include "G4UserEventAction.hh"
#include "globals.hh"

class RunAction;

class EventAction : public G4UserEventAction
{
  public:
    explicit EventAction(RunAction* run) : fRun(run) {}
    void BeginOfEventAction(const G4Event*) override;
    void EndOfEventAction(const G4Event*) override;

    void SetDecay(G4double t, G4int volumeID, const G4ThreeVector& spin)
    {
      fDecayTime = t; fDecayDetID = volumeID; fSpin = spin;
    }

  private:
    RunAction* fRun;
    G4double fDecayTime = -1000.;   // musrSim sentinel
    G4int fDecayDetID = -1000;
    G4ThreeVector fSpin;
};

#endif
