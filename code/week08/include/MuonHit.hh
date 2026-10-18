#ifndef MuonHit_h
#define MuonHit_h 1

#include "G4THitsCollection.hh"
#include "G4ThreeVector.hh"
#include "G4VHit.hh"

// One hit = the accumulated response of ONE counter in ONE event.
class MuonHit : public G4VHit
{
  public:
    void AddEdep(G4double e) { fEdep += e; }
    void AddEvis(G4double e) { fEvis += e; }
    void SetTimeIfEarlier(G4double t) { if (t < fTime) fTime = t; }
    void SetPos(const G4ThreeVector& p) { fPos = p; }

    G4double GetEdep() const { return fEdep; }
    G4double GetEvis() const { return fEvis; }   // after Birks quenching
    G4double GetTime() const { return fTime; }   // earliest deposit, global time
    const G4ThreeVector& GetPos() const { return fPos; }

  private:
    G4double fEdep = 0.;
    G4double fEvis = 0.;
    G4double fTime = 1e30;
    G4ThreeVector fPos;
};

using MuonHitsCollection = G4THitsCollection<MuonHit>;

#endif
