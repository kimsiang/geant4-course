#ifndef RunAction_h
#define RunAction_h 1

#include "G4Accumulable.hh"
#include "G4UserRunAction.hh"
#include "globals.hh"

class G4Run;

// In a multithreaded run every worker has its own RunAction. Plain member counters
// would only see that worker's events; G4Accumulable values are summed into the
// master's copy by G4AccumulableManager::Merge().
class RunAction : public G4UserRunAction
{
  public:
    RunAction();
    void BeginOfRunAction(const G4Run*) override;
    void EndOfRunAction(const G4Run* run) override;

    void Count(G4bool fired0, G4bool fired1, G4bool trigger)
    {
      fN0 += fired0 ? 1 : 0;
      fN1 += fired1 ? 1 : 0;
      fTrig += trigger ? 1 : 0;
    }

  private:
    G4Accumulable<G4int> fN0{0};
    G4Accumulable<G4int> fN1{0};
    G4Accumulable<G4int> fTrig{0};
};

#endif
