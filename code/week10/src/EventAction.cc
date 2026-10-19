#include "EventAction.hh"

#include "CounterSD.hh"
#include "RunAction.hh"

#include "G4AnalysisManager.hh"
#include "G4SDManager.hh"
#include "G4SystemOfUnits.hh"

void EventAction::BeginOfEventAction(const G4Event*)
{
  fDecayTime = -1000.;
  fDecayDetID = -1000;
  fSpin = G4ThreeVector();
}

void EventAction::EndOfEventAction(const G4Event*)
{
  auto* sd = static_cast<CounterSD*>(G4SDManager::GetSDMpointer()->FindSensitiveDetector("TF/CounterSD"));
  fRun->detID.clear();
  fRun->detEdep.clear();
  fRun->detTimeStart.clear();
  for (const auto& [id, e] : sd->Edep()) {
    fRun->detID.push_back(id);
    fRun->detEdep.push_back(e / MeV);
    fRun->detTimeStart.push_back(sd->Time().at(id) / microsecond);
  }

  auto* analysis = G4AnalysisManager::Instance();
  analysis->FillNtupleDColumn(0, fDecayTime > 0. ? fDecayTime / microsecond : -1000.);
  analysis->FillNtupleIColumn(1, fDecayDetID);
  analysis->FillNtupleDColumn(2, fSpin.y());
  analysis->FillNtupleDColumn(3, fSpin.z());
  analysis->FillNtupleIColumn(4, static_cast<G4int>(fRun->detID.size()));
  analysis->AddNtupleRow();   // vector columns are read at this moment
}
