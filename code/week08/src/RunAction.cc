#include "RunAction.hh"

#include "G4AccumulableManager.hh"
#include "G4AnalysisManager.hh"
#include "G4Run.hh"
#include "G4ios.hh"

#include <cmath>

RunAction::RunAction()
{
  G4AccumulableManager::Instance()->Register(fN0);
  G4AccumulableManager::Instance()->Register(fN1);
  G4AccumulableManager::Instance()->Register(fTrig);

  auto* analysis = G4AnalysisManager::Instance();
  analysis->SetDefaultFileType("root");
  analysis->SetFileName("muons");
  // In a multithreaded run, merge ROOT ntuples into one output file.
  // Histograms are merged automatically; ntuples require this explicit opt-in.
  analysis->SetNtupleMerging(true);

  // Ntuple 0: what the DAQ would write. Detector-facing names, units in the names,
  // and only TRIGGERED events, exactly like the hardware stream.
  analysis->CreateNtuple("daq", "DAQ-like event record (triggered events only)");
  analysis->CreateNtupleIColumn("run");
  analysis->CreateNtupleIColumn("event");
  analysis->CreateNtupleDColumn("timestamp_ns");   // synthetic 1 kHz clock: event x 1e6 ns
  analysis->CreateNtupleIColumn("trigger_word");   // bit0 ch0 > thr, bit1 ch1 > thr, bit2 coincidence
  analysis->CreateNtupleIColumn("n_channels");
  analysis->CreateNtupleDColumn("ch0_adc");        // ADC counts
  analysis->CreateNtupleDColumn("ch1_adc");
  analysis->CreateNtupleDColumn("ch0_time_ns");
  analysis->CreateNtupleDColumn("ch1_time_ns");
  analysis->FinishNtuple();

  // Ntuple 1: simulation truth, kept OUT of the detector-facing record. Every event.
  analysis->CreateNtuple("truth", "Monte Carlo truth (all events)");
  analysis->CreateNtupleIColumn("event");
  analysis->CreateNtupleDColumn("E0_MeV");
  analysis->CreateNtupleDColumn("cos_theta");
  analysis->CreateNtupleDColumn("Edep0_MeV");
  analysis->CreateNtupleDColumn("Edep1_MeV");
  analysis->CreateNtupleIColumn("triggered");
  analysis->FinishNtuple();
}

void RunAction::BeginOfRunAction(const G4Run*)
{
  G4AccumulableManager::Instance()->Reset();
  G4AnalysisManager::Instance()->OpenFile();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  auto* accumulables = G4AccumulableManager::Instance();
  accumulables->Merge();   // on the master: sum of all workers

  if (IsMaster()) {
    const G4int n = run->GetNumberOfEvent();
    if (n > 0) {
      const G4double e = static_cast<G4double>(fTrig.GetValue()) / n;
      G4cout << "Run " << run->GetRunID() << " complete: " << n << " events (all threads)" << G4endl
             << "  top fired " << fN0.GetValue() << ", bottom fired " << fN1.GetValue()
             << ", triggered " << fTrig.GetValue() << G4endl
             << "  trigger efficiency = " << e << " +/- " << std::sqrt(e * (1 - e) / n) << G4endl;
    }
  }
  auto* analysis = G4AnalysisManager::Instance();
  analysis->Write();
  analysis->CloseFile();
}
