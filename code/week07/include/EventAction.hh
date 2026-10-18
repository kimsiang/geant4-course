#ifndef EventAction_h
#define EventAction_h 1

#include "G4UserEventAction.hh"
#include "globals.hh"

// One row per event: true momentum at the gun, and the true x, z where the
// primary enters each of the six planes (truth; smearing happens in Python).
class EventAction : public G4UserEventAction
{
  public:
    void BeginOfEventAction(const G4Event*) override;
    void EndOfEventAction(const G4Event*) override;
    void SetHit(G4int plane, G4double x, G4double z)
    {
      if (plane >= 0 && plane < 6 && !fSeen[plane]) { fX[plane] = x; fZ[plane] = z; fSeen[plane] = true; }
    }

  private:
    G4double fX[6] = {0.};
    G4double fZ[6] = {0.};
    G4bool fSeen[6] = {false};
};

#endif
