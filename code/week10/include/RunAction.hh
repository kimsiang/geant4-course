#ifndef RunAction_h
#define RunAction_h 1

#include "G4UserRunAction.hh"
#include "globals.hh"

#include <vector>

// Books a "t1" ntuple with musrSim branch names, so the textbook's asymmetry.py reads it unchanged.
class RunAction : public G4UserRunAction
{
  public:
    RunAction();
    void BeginOfRunAction(const G4Run*) override;
    void EndOfRunAction(const G4Run*) override;

    // jagged hit columns: one entry per counter that fired in this event
    std::vector<G4int> detID;
    std::vector<G4double> detEdep;        // MeV
    std::vector<G4double> detTimeStart;   // us
};

#endif
