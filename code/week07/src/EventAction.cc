#include "EventAction.hh"

#include "G4AnalysisManager.hh"
#include "G4Event.hh"
#include "G4PrimaryParticle.hh"
#include "G4PrimaryVertex.hh"
#include "G4SystemOfUnits.hh"

void EventAction::BeginOfEventAction(const G4Event*)
{
  for (G4int i = 0; i < 6; ++i) { fX[i] = 0.; fZ[i] = 0.; fSeen[i] = false; }
}

void EventAction::EndOfEventAction(const G4Event* event)
{
  for (G4int i = 0; i < 6; ++i) if (!fSeen[i]) return;  // keep only tracks that hit all planes

  const G4PrimaryParticle* primary = event->GetPrimaryVertex()->GetPrimary();
  const G4ThreeVector p = primary->GetMomentum();       // truth, at the gun

  auto* am = G4AnalysisManager::Instance();
  am->FillNtupleDColumn(0, p.mag() / GeV);
  am->FillNtupleDColumn(1, p.perp(G4ThreeVector(0., 1., 0.)) / GeV);  // pT w.r.t. the field (y)
  for (G4int i = 0; i < 6; ++i) {
    am->FillNtupleDColumn(2 + i, fX[i] / mm);
    am->FillNtupleDColumn(8 + i, fZ[i] / mm);
  }
  am->AddNtupleRow();
}
