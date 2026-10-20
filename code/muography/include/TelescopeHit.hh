#ifndef TelescopeHit_h
#define TelescopeHit_h 1

#include "G4THitsCollection.hh"
#include "G4ThreeVector.hh"
#include "G4VHit.hh"

// One hit = where the PRIMARY muon first crossed one tracker plane in one event.
// A real plane measures every charged particle; keeping the primary only is the
// "ideal tracker" approximation of this starter (no noise, 100% efficiency,
// no position resolution). Adding those is part of a good capstone.
class TelescopeHit : public G4VHit
{
  public:
    void Set(const G4ThreeVector& p, G4double t, G4double ekin)
    {
      if (fHit) return;   // keep the first crossing
      fHit = true; fPos = p; fTime = t; fEkin = ekin;
    }
    G4bool IsHit() const { return fHit; }
    const G4ThreeVector& GetPos() const { return fPos; }
    G4double GetTime() const { return fTime; }
    G4double GetEkin() const { return fEkin; }

  private:
    G4bool fHit = false;
    G4ThreeVector fPos;
    G4double fTime = 0.;
    G4double fEkin = 0.;
};

using TelescopeHitsCollection = G4THitsCollection<TelescopeHit>;

#endif
