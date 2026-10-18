#ifndef EventAction_h
#define EventAction_h 1

#include "G4UserEventAction.hh"
#include "globals.hh"

class EventAction : public G4UserEventAction
{
  public:
    void BeginOfEventAction(const G4Event*) override
    {
      fEdep = 0.;
      fPrimaryLoss = 0.;
      fPrimaryPath = 0.;
    }
    void EndOfEventAction(const G4Event*) override;

    void AddEdep(G4double edep) { fEdep += edep; }
    void AddPrimaryLoss(G4double loss) { fPrimaryLoss += loss; }
    void AddPrimaryPath(G4double length) { fPrimaryPath += length; }

  private:
    G4double fEdep = 0.;
    G4double fPrimaryLoss = 0.;
    G4double fPrimaryPath = 0.;
};

#endif
