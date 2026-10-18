#ifndef EventAction_h
#define EventAction_h 1

#include "ToyScintillatorDigitizer.hh"

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
    G4int fHitsCollectionID = -1;
    ToyScintillatorDigitizer fDigitizer;
    G4double fEdepThreshold = 0.1;     // MeV, event level (Week 5)
    G4double fAdcThreshold = 70.;      // ADC counts
    G4double fCoincidenceWindow = 20.; // ns
};

#endif
