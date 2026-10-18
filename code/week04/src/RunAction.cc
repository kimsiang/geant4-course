#include "RunAction.hh"

#include "G4AnalysisManager.hh"
#include "G4Run.hh"
#include "G4ios.hh"

RunAction::RunAction()
{
  auto* analysisManager = G4AnalysisManager::Instance();
  analysisManager->SetDefaultFileType("root");
  analysisManager->SetFileName("edep_scan");  // override per run: /analysis/setFileName
  // Ranges chosen so the whole Landau peak AND its tail fit (10 cm of plastic
  // gives ~20 MeV at the minimum and ~28 MeV at 100 MeV kinetic energy).
  analysisManager->CreateH1("Edep", "Energy deposit per event [MeV]", 200, 0., 80.);
  analysisManager->CreateH1("PrimarydEdx",
                            "Primary muon energy loss per path length [MeV/cm]",
                            200, 0., 10.);
}

void RunAction::BeginOfRunAction(const G4Run*)
{
  G4AnalysisManager::Instance()->OpenFile();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  auto* analysisManager = G4AnalysisManager::Instance();
  auto* hEdep = analysisManager->GetH1(0);
  auto* hdEdx = analysisManager->GetH1(1);

  G4cout << "Run complete: " << run->GetNumberOfEvent() << " events." << G4endl
         << "  Edep in Scintillator : mean " << hEdep->mean() << " MeV, rms "
         << hEdep->rms() << " MeV" << G4endl
         << "  primary -dE/dx       : mean " << hdEdx->mean() << " MeV/cm, rms "
         << hdEdx->rms() << " MeV/cm" << G4endl;

  analysisManager->Write();
  analysisManager->CloseFile();
}
