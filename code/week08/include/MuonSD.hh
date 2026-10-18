#ifndef MuonSD_h
#define MuonSD_h 1

#include "MuonHit.hh"

#include "G4VSensitiveDetector.hh"

class MuonSD : public G4VSensitiveDetector
{
  public:
    MuonSD(const G4String& name, const G4String& hitsCollectionName);

    void Initialize(G4HCofThisEvent* hce) override;
    G4bool ProcessHits(G4Step* step, G4TouchableHistory*) override;

  private:
    MuonHitsCollection* fHitsCollection = nullptr;
    static constexpr G4int kNCounters = 2;
};

#endif
