#include "EventAction.hh"

#include "MuonHit.hh"
#include "RunAction.hh"

#include "G4AnalysisManager.hh"
#include "G4Event.hh"
#include "G4HCofThisEvent.hh"
#include "G4PrimaryParticle.hh"
#include "G4PrimaryVertex.hh"
#include "G4Run.hh"
#include "G4RunManager.hh"
#include "G4SDManager.hh"
#include "G4SystemOfUnits.hh"

#include <cmath>

void EventAction::EndOfEventAction(const G4Event* event)
{
  if (fHitsCollectionID < 0)
    fHitsCollectionID = G4SDManager::GetSDMpointer()->GetCollectionID("MuonHitsCollection");
  auto* hce = event->GetHCofThisEvent();
  if (!hce) return;
  auto* hits = static_cast<MuonHitsCollection*>(hce->GetHC(fHitsCollectionID));
  if (!hits || hits->entries() < 2) return;

  // truth
  const G4double edep[2] = {(*hits)[0]->GetEdep(), (*hits)[1]->GetEdep()};
  const G4PrimaryParticle* primary = event->GetPrimaryVertex()->GetPrimary();
  const G4double e0 = primary->GetKineticEnergy();
  const G4double cosTheta = primary->GetMomentumDirection().z();

  // detector response -> digitization -> trigger (Week 5 chain)
  Signal sig[2];
  for (G4int i = 0; i < 2; ++i) sig[i] = fDigitizer.Digitize((*hits)[i]->GetEvis(), (*hits)[i]->GetTime());
  const G4bool above0 = sig[0].adc > fAdcThreshold, above1 = sig[1].adc > fAdcThreshold;
  const G4bool coinc = above0 && above1 && std::abs(sig[0].time - sig[1].time) < fCoincidenceWindow;
  const G4int triggerWord = (above0 ? 1 : 0) | (above1 ? 2 : 0) | (coinc ? 4 : 0);

  fRunAction->Count(edep[0] >= fEdepThreshold * MeV, edep[1] >= fEdepThreshold * MeV, coinc);

  auto* analysis = G4AnalysisManager::Instance();
  const G4int evt = event->GetEventID();
  if (coinc) {   // the DAQ only writes what the trigger accepts
    const G4int run = G4RunManager::GetRunManager()->GetCurrentRun()->GetRunID();
    analysis->FillNtupleIColumn(0, 0, run);
    analysis->FillNtupleIColumn(0, 1, evt);
    analysis->FillNtupleDColumn(0, 2, evt * 1.0e6);
    analysis->FillNtupleIColumn(0, 3, triggerWord);
    analysis->FillNtupleIColumn(0, 4, 2);
    analysis->FillNtupleDColumn(0, 5, sig[0].adc);
    analysis->FillNtupleDColumn(0, 6, sig[1].adc);
    analysis->FillNtupleDColumn(0, 7, sig[0].time);
    analysis->FillNtupleDColumn(0, 8, sig[1].time);
    analysis->AddNtupleRow(0);
  }
  analysis->FillNtupleIColumn(1, 0, evt);
  analysis->FillNtupleDColumn(1, 1, e0 / MeV);
  analysis->FillNtupleDColumn(1, 2, cosTheta);
  analysis->FillNtupleDColumn(1, 3, edep[0] / MeV);
  analysis->FillNtupleDColumn(1, 4, edep[1] / MeV);
  analysis->FillNtupleIColumn(1, 5, coinc ? 1 : 0);
  analysis->AddNtupleRow(1);
}
