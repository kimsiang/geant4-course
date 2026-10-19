#ifndef CounterSD_h
#define CounterSD_h 1

#include "G4VSensitiveDetector.hh"

#include <map>

// musr/ScintSD analogue: one "hit" per counter per event, keyed by the volume ID (copy number).
class CounterSD : public G4VSensitiveDetector
{
  public:
    explicit CounterSD(const G4String& name) : G4VSensitiveDetector(name) {}
    void Initialize(G4HCofThisEvent*) override { fEdep.clear(); fTime.clear(); }
    G4bool ProcessHits(G4Step* step, G4TouchableHistory*) override;

    const std::map<G4int, G4double>& Edep() const { return fEdep; }   // MeV
    const std::map<G4int, G4double>& Time() const { return fTime; }   // first deposit, ns

  private:
    std::map<G4int, G4double> fEdep;
    std::map<G4int, G4double> fTime;
};

#endif
