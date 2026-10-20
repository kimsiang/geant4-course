#include "Actions.hh"

#include "PrimaryGeneratorAction.hh"
#include "TrackerSD.hh"

#include "G4AccumulableManager.hh"
#include "G4AnalysisManager.hh"
#include "G4Event.hh"
#include "G4HCofThisEvent.hh"
#include "G4PrimaryParticle.hh"
#include "G4PrimaryVertex.hh"
#include "G4Run.hh"
#include "G4SDManager.hh"
#include "G4SystemOfUnits.hh"

RunAction::RunAction()
{
  G4AccumulableManager::Instance()->Register(fAll4);
  auto* a = G4AnalysisManager::Instance();
  a->SetDefaultFileType("root");
  a->SetFileName("scattering");
  a->SetNtupleMerging(true);
  // one row per muon seen by all four planes; positions in cm, planes at
  // z = +60, +40, -40, -60 cm (DetectorConstruction::kPlaneZ)
  a->CreateNtuple("trk", "Muon positions on the four tracker planes");
  a->CreateNtupleDColumn("Ekin_GeV");
  for (const char* c : {"x0", "y0", "x1", "y1", "x2", "y2", "x3", "y3"}) a->CreateNtupleDColumn(c);
  a->FinishNtuple();
}

void RunAction::BeginOfRunAction(const G4Run*)
{
  G4AccumulableManager::Instance()->Reset();
  G4AnalysisManager::Instance()->OpenFile();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  G4AccumulableManager::Instance()->Merge();
  if (IsMaster())
    G4cout << "Run " << run->GetRunID() << ": " << run->GetNumberOfEvent() << " muons, "
           << fAll4.GetValue() << " seen by all four planes" << G4endl;
  auto* a = G4AnalysisManager::Instance();
  a->Write();
  a->CloseFile();
}

void EventAction::EndOfEventAction(const G4Event* event)
{
  if (fHitsID < 0) fHitsID = G4SDManager::GetSDMpointer()->GetCollectionID("TrackerHits");
  auto* hce = event->GetHCofThisEvent();
  if (!hce) return;
  auto* hits = static_cast<TrackerHitsCollection*>(hce->GetHC(fHitsID));
  G4bool all4 = hits && hits->entries() == 4;
  for (G4int i = 0; all4 && i < 4; ++i) all4 = (*hits)[i]->IsHit();
  fRun->Count(all4);
  if (!all4) return;

  auto* a = G4AnalysisManager::Instance();
  a->FillNtupleDColumn(0, 0, event->GetPrimaryVertex()->GetPrimary()->GetKineticEnergy() / GeV);
  for (G4int i = 0; i < 4; ++i) {
    a->FillNtupleDColumn(0, 1 + 2 * i, (*hits)[i]->GetPos().x() / cm);
    a->FillNtupleDColumn(0, 2 + 2 * i, (*hits)[i]->GetPos().y() / cm);
  }
  a->AddNtupleRow(0);
}

void ActionInitialization::BuildForMaster() const { SetUserAction(new RunAction()); }

void ActionInitialization::Build() const
{
  SetUserAction(new PrimaryGeneratorAction());
  auto* r = new RunAction();
  SetUserAction(r);
  SetUserAction(new EventAction(r));
}
