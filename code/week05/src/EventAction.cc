#include "EventAction.hh"

#include "MuonHit.hh"
#include "RunAction.hh"

#include "G4AnalysisManager.hh"
#include "G4Event.hh"
#include "G4GenericMessenger.hh"
#include "G4HCofThisEvent.hh"
#include "G4SDManager.hh"
#include "G4SystemOfUnits.hh"
#include "Randomize.hh"

#include <cmath>

EventAction::EventAction(RunAction* runAction)
  : fRunAction(runAction),
    fEdepThreshold(0.1 * MeV),
    fAdcThreshold(70.),          // pedestal 50 + 5 photoelectrons x 4 counts
    fCoincidenceWindow(20.),     // ns, as on the bench
    fNoiseProbability(0.)
{
  // /week05/noise 0.3  -> each counter gets a background pulse in 30% of events
  fMessenger = new G4GenericMessenger(this, "/week05/", "Week 5 trigger study");
  fMessenger->DeclareProperty("noise", fNoiseProbability,
                             "probability of a background pulse per counter per event");
  // /week05/edepThreshold 1 MeV  -> the Think-about-it question of section 6.1
  fMessenger->DeclarePropertyWithUnit("edepThreshold", "MeV", fEdepThreshold,
                                      "event-level Edep threshold per counter");
}

void EventAction::EndOfEventAction(const G4Event* event)
{
  if (fHitsCollectionID < 0)
    fHitsCollectionID = G4SDManager::GetSDMpointer()->GetCollectionID("MuonHitsCollection");
  auto* hce = event->GetHCofThisEvent();
  if (!hce) return;
  auto* hits = static_cast<MuonHitsCollection*>(hce->GetHC(fHitsCollectionID));
  if (!hits || hits->entries() < 2) return;

  // 1. Truth-level detector response and the Example 6.1 threshold (event level!)
  const G4double edep[2] = {(*hits)[0]->GetEdep(), (*hits)[1]->GetEdep()};
  const G4bool fired[2] = {edep[0] >= fEdepThreshold, edep[1] >= fEdepThreshold};

  // 2. Digitization: per counter, muon pulse if light was produced, else maybe noise
  Signal sig[2];
  for (G4int i = 0; i < 2; ++i) {
    sig[i] = fDigitizer.Digitize((*hits)[i]->GetEvis(), (*hits)[i]->GetTime());
    if (!sig[i].hasPulse && G4UniformRand() < fNoiseProbability) sig[i] = fDigitizer.NoisePulse();
  }

  // 3. Trigger: both above threshold AND inside the coincidence window
  const G4bool bothAbove = (sig[0].adc > fAdcThreshold) && (sig[1].adc > fAdcThreshold);
  const G4bool trigger = bothAbove && std::abs(sig[0].time - sig[1].time) < fCoincidenceWindow;

  fRunAction->Count(fired[0], fired[1], bothAbove, trigger);

  auto* analysis = G4AnalysisManager::Instance();
  analysis->FillNtupleDColumn(0, edep[0] / MeV);
  analysis->FillNtupleDColumn(1, edep[1] / MeV);
  analysis->FillNtupleDColumn(2, (*hits)[0]->GetEvis() / MeV);
  analysis->FillNtupleDColumn(3, (*hits)[1]->GetEvis() / MeV);
  analysis->FillNtupleDColumn(4, sig[0].adc);
  analysis->FillNtupleDColumn(5, sig[1].adc);
  analysis->FillNtupleDColumn(6, sig[0].time - sig[1].time);
  analysis->FillNtupleIColumn(7, trigger ? 1 : 0);
  analysis->AddNtupleRow();
}
