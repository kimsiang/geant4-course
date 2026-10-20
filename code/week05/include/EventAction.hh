#ifndef EventAction_h
#define EventAction_h 1

#include "ToyScintillatorDigitizer.hh"

#include "G4UserEventAction.hh"
#include "globals.hh"

class RunAction;
class G4GenericMessenger;

class EventAction : public G4UserEventAction
{
  public:
    explicit EventAction(RunAction* runAction);
    ~EventAction() override;
    void EndOfEventAction(const G4Event* event) override;

  private:
    RunAction* fRunAction = nullptr;
    G4int fHitsCollectionID = -1;  // looked up lazily: the SD does not exist yet in the constructor
    G4GenericMessenger* fMessenger = nullptr;
    ToyScintillatorDigitizer fDigitizer;
    G4double fEdepThreshold;       // Example 5.1: 0.1 MeV on the event-level deposit
    G4double fAdcThreshold;        // trigger threshold, ADC counts above zero
    G4double fCoincidenceWindow;   // ns
    G4double fNoiseProbability;    // per counter per event, set by /week05/noise
};

#endif
