#ifndef TelescopeSD_h
#define TelescopeSD_h 1

#include "TelescopeHit.hh"

#include "G4VSensitiveDetector.hh"

class TelescopeSD : public G4VSensitiveDetector
{
  public:
    TelescopeSD(const G4String& name, const G4String& hitsCollectionName);

    void Initialize(G4HCofThisEvent* hce) override;
    G4bool ProcessHits(G4Step* step, G4TouchableHistory*) override;

  private:
    TelescopeHitsCollection* fHits = nullptr;
    static constexpr G4int kNPlanes = 2;
};

#endif
