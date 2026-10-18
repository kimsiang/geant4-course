#include "EventAction.hh"

#include "G4AnalysisManager.hh"
#include "G4SystemOfUnits.hh"

void EventAction::EndOfEventAction(const G4Event*)
{
  auto* analysisManager = G4AnalysisManager::Instance();
  // Fill in explicit units so the ROOT axes read MeV and MeV/cm.
  analysisManager->FillH1(0, fEdep / MeV);
  if (fPrimaryPath > 0.)
    analysisManager->FillH1(1, (fPrimaryLoss / fPrimaryPath) / (MeV / cm));
}
