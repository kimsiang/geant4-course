#include "EventAction.hh"

#include "RunAction.hh"
#include "TelescopeHit.hh"

#include "G4AnalysisManager.hh"
#include "G4Event.hh"
#include "G4HCofThisEvent.hh"
#include "G4PrimaryParticle.hh"
#include "G4PrimaryVertex.hh"
#include "G4SDManager.hh"
#include "G4SystemOfUnits.hh"

#include <cmath>

void EventAction::EndOfEventAction(const G4Event* event)
{
  if (fHitsID < 0) fHitsID = G4SDManager::GetSDMpointer()->GetCollectionID("PlaneHits");
  auto* hce = event->GetHCofThisEvent();
  if (!hce) return;
  auto* hits = static_cast<TelescopeHitsCollection*>(hce->GetHC(fHitsID));
  if (!hits || hits->entries() < 2) return;

  const TelescopeHit* top = (*hits)[0];
  const TelescopeHit* bot = (*hits)[1];
  const G4bool both = top->IsHit() && bot->IsHit();
  fRunAction->Count(top->IsHit(), both);
  if (!both) return;

  const G4PrimaryParticle* mu = event->GetPrimaryVertex()->GetPrimary();
  const G4ThreeVector d = mu->GetMomentumDirection();   // downward
  const G4ThreeVector p0 = top->GetPos(), p1 = bot->GetPos();
  const G4double dz = p0.z() - p1.z();                  // > 0

  auto* a = G4AnalysisManager::Instance();
  a->FillNtupleDColumn(0, 0, (mu->GetKineticEnergy() + mu->GetMass()) / GeV);
  a->FillNtupleDColumn(0, 1, -d.z());
  a->FillNtupleDColumn(0, 2, std::atan2(d.y(), d.x()));
  a->FillNtupleIColumn(0, 3, static_cast<G4int>(mu->GetCharge()));
  a->FillNtupleDColumn(0, 4, top->GetEkin() / GeV);
  a->FillNtupleDColumn(0, 5, p0.x() / m);
  a->FillNtupleDColumn(0, 6, p0.y() / m);
  a->FillNtupleDColumn(0, 7, p1.x() / m);
  a->FillNtupleDColumn(0, 8, p1.y() / m);
  a->FillNtupleDColumn(0, 9, (p0.x() - p1.x()) / dz);
  a->FillNtupleDColumn(0, 10, (p0.y() - p1.y()) / dz);
  a->FillNtupleDColumn(0, 11, d.x() / d.z());           // upward slope = (-d.x)/(-d.z)
  a->FillNtupleDColumn(0, 12, d.y() / d.z());
  a->AddNtupleRow(0);
}
