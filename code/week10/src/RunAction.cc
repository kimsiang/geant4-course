#include "RunAction.hh"

#include "G4AnalysisManager.hh"
#include "G4Run.hh"

RunAction::RunAction()
{
  auto* analysis = G4AnalysisManager::Instance();
  analysis->SetDefaultFileType("root");
  analysis->SetFileName("data/tf");            // override in the macro: /analysis/setFileName
  analysis->SetNtupleMerging(true);

  analysis->CreateNtuple("t1", "TF-muSR, musrSim branch names and units");
  analysis->CreateNtupleDColumn("muDecayTime");      // us; -1000 if the muon did not decay
  analysis->CreateNtupleIColumn("muDecayDetID");     // volume ID where it decayed; -1000 if none
  analysis->CreateNtupleDColumn("muDecayPolY");      // TRUTH spin at decay (not observable)
  analysis->CreateNtupleDColumn("muDecayPolZ");
  analysis->CreateNtupleIColumn("det_n");
  analysis->CreateNtupleIColumn("det_ID", detID);
  analysis->CreateNtupleDColumn("det_edep", detEdep);
  analysis->CreateNtupleDColumn("det_time_start", detTimeStart);
  analysis->FinishNtuple();
}

void RunAction::BeginOfRunAction(const G4Run*)
{
  G4AnalysisManager::Instance()->OpenFile();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  if (IsMaster()) G4cout << "Run complete: " << run->GetNumberOfEvent() << " muons" << G4endl;
  auto* analysis = G4AnalysisManager::Instance();
  analysis->Write();
  analysis->CloseFile();
}
