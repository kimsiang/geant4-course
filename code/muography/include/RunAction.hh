#ifndef RunAction_h
#define RunAction_h 1

#include "G4Accumulable.hh"
#include "G4UserRunAction.hh"
#include "globals.hh"

class G4Run;

// Counts and the run summary. The master also writes <file>_run.json with the
// exposure per event, so analyse.py can turn counts into rates per day.
class RunAction : public G4UserRunAction
{
  public:
    RunAction();
    void BeginOfRunAction(const G4Run*) override;
    void EndOfRunAction(const G4Run* run) override;

    void Count(G4bool top, G4bool both)
    {
      fTop += top ? 1 : 0;
      fBoth += both ? 1 : 0;
    }

  private:
    G4Accumulable<G4int> fTop{0};
    G4Accumulable<G4int> fBoth{0};
};

#endif
