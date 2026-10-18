#include "RunAction.hh"

#include "G4AnalysisManager.hh"
#include "G4Run.hh"
#include "G4ios.hh"

RunAction::RunAction()
{
  auto* am = G4AnalysisManager::Instance();
  am->SetDefaultFileType("csv");     // plain text: numpy can read it without ROOT
  am->SetFileName("tracks");         // per run: /analysis/setFileName
  am->CreateNtuple("tracks", "true momentum and true plane crossings");
  am->CreateNtupleDColumn("p_GeV");
  am->CreateNtupleDColumn("pT_GeV");
  for (int i = 0; i < 6; ++i) am->CreateNtupleDColumn("x" + std::to_string(i) + "_mm");
  for (int i = 0; i < 6; ++i) am->CreateNtupleDColumn("z" + std::to_string(i) + "_mm");
  am->FinishNtuple();
}

void RunAction::BeginOfRunAction(const G4Run*)
{
  G4AnalysisManager::Instance()->OpenFile();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  auto* am = G4AnalysisManager::Instance();
  G4cout << "Run " << run->GetRunID() << ": " << run->GetNumberOfEvent()
         << " events written to " << am->GetFileName() << G4endl;
  am->Write();
  am->CloseFile();
}
