#ifndef RunAction_h
#define RunAction_h 1

#include "G4Timer.hh"
#include "G4UserRunAction.hh"
#include "globals.hh"

#include <map>
#include <string>

class G4Run;

// Keeps the census of secondaries and the energy deposited in the block.
class RunAction : public G4UserRunAction
{
  public:
    void BeginOfRunAction(const G4Run*) override;
    void EndOfRunAction(const G4Run* run) override;

    void CountSecondary(const std::string& particle, const std::string& creator)
    {
      ++fBySpecies[particle];
      ++fByCreator[creator];
    }
    void AddEventEdep(G4double e) { fSumE += e; fSumE2 += e * e; }

  private:
    std::map<std::string, G4int> fBySpecies, fByCreator;
    G4double fSumE = 0., fSumE2 = 0.;
    G4Timer fTimer;
};

#endif
