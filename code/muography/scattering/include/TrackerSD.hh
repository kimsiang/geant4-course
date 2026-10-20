#ifndef TrackerSD_h
#define TrackerSD_h 1

#include "G4THitsCollection.hh"
#include "G4ThreeVector.hh"
#include "G4VHit.hh"
#include "G4VSensitiveDetector.hh"

// Ideal tracker: the position where the PRIMARY muon first enters each plane.
// No resolution, no noise, 100% efficiency (a real detector adds all three).
class TrackerHit : public G4VHit
{
  public:
    void Set(const G4ThreeVector& p) { if (!fHit) { fHit = true; fPos = p; } }
    G4bool IsHit() const { return fHit; }
    const G4ThreeVector& GetPos() const { return fPos; }

  private:
    G4bool fHit = false;
    G4ThreeVector fPos;
};
using TrackerHitsCollection = G4THitsCollection<TrackerHit>;

class TrackerSD : public G4VSensitiveDetector
{
  public:
    TrackerSD(const G4String& name, const G4String& hcName);
    void Initialize(G4HCofThisEvent* hce) override;
    G4bool ProcessHits(G4Step* step, G4TouchableHistory*) override;

  private:
    TrackerHitsCollection* fHits = nullptr;
};

#endif
