#ifndef RunAction_h
#define RunAction_h 1

#include "G4UserRunAction.hh"
#include "globals.hh"

class G4Run;

class RunAction : public G4UserRunAction
{
  public:
    RunAction();
    void BeginOfRunAction(const G4Run*) override;
    void EndOfRunAction(const G4Run* run) override;

    void Count(G4bool fired0, G4bool fired1, G4bool bothAbove, G4bool trigger)
    {
      fN0 += fired0; fN1 += fired1; fBoth += (fired0 && fired1);
      fAbove += bothAbove; fTrig += trigger;
    }

  private:
    G4int fN0 = 0, fN1 = 0, fBoth = 0, fAbove = 0, fTrig = 0;
};

#endif
