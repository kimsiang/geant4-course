#include "RunAction.hh"

#include "G4AnalysisManager.hh"
#include "G4Run.hh"
#include "G4ios.hh"

#include <cmath>
#include <iomanip>

RunAction::RunAction()
{
  auto* analysis = G4AnalysisManager::Instance();
  analysis->SetDefaultFileType("root");
  analysis->SetFileName("muons");
  analysis->CreateNtuple("Muons", "Two-layer counter, one row per event");
  analysis->CreateNtupleDColumn("Edep0");   // MeV, truth
  analysis->CreateNtupleDColumn("Edep1");
  analysis->CreateNtupleDColumn("Evis0");   // MeV, after Birks
  analysis->CreateNtupleDColumn("Evis1");
  analysis->CreateNtupleDColumn("ADC0");    // counts, digitized
  analysis->CreateNtupleDColumn("ADC1");
  analysis->CreateNtupleDColumn("dt");      // ns, t0 - t1
  analysis->CreateNtupleIColumn("trigger");
  analysis->FinishNtuple();
}

void RunAction::BeginOfRunAction(const G4Run*)
{
  fN0 = fN1 = fBoth = fAbove = fTrig = 0;
  G4AnalysisManager::Instance()->OpenFile();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  const G4int n = run->GetNumberOfEvent();
  if (n > 0) {
    auto line = [n](const char* label, G4int k) {
      const G4double e = static_cast<G4double>(k) / n;
      G4cout << "  " << std::left << std::setw(34) << label << std::right << std::setw(6) << k
             << "  eff = " << std::fixed << std::setprecision(4) << e
             << " +/- " << std::sqrt(e * (1 - e) / n) << std::defaultfloat << G4endl;
    };
    G4cout << "Run complete: " << n << " events." << G4endl;
    line("top counter fired (Edep > thr)", fN0);
    line("bottom counter fired", fN1);
    line("both fired (truth level)", fBoth);
    line("both ADC above threshold", fAbove);
    line("trigger (both + |dt|<20 ns)", fTrig);
  }
  auto* analysis = G4AnalysisManager::Instance();
  analysis->Write();
  analysis->CloseFile();
}
