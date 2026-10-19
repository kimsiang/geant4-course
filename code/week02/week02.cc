#include "ActionInitialization.hh"
#include "DetectorConstruction.hh"

#include "FTFP_BERT.hh"
#include "G4RunManagerFactory.hh"
#include "G4UIExecutive.hh"
#include "G4UImanager.hh"
#include "G4VisExecutive.hh"

int main(int argc, char** argv)
{
  // Week 2 runs single-threaded so /tracking/verbose output is not
  // interleaved between worker threads. The usual main() uses
  // G4RunManagerType::Default; we switch to it when we merge MT output.
  auto* runManager =
    G4RunManagerFactory::CreateRunManager(G4RunManagerType::Serial);

  runManager->SetUserInitialization(new DetectorConstruction());
  runManager->SetUserInitialization(new FTFP_BERT());
  runManager->SetUserInitialization(new ActionInitialization());
  runManager->Initialize();

  auto* uiManager = G4UImanager::GetUIpointer();
  if (argc > 1) {
    // batch mode: ./week02 run1.mac
    uiManager->ApplyCommand("/control/execute " + G4String(argv[1]));
  } else {
    // interactive mode: open the viewer
    auto* ui = new G4UIExecutive(argc, argv);
    auto* visManager = new G4VisExecutive();
    visManager->Initialize();
    uiManager->ApplyCommand("/control/execute vis.mac");
    ui->SessionStart();
    delete visManager;
    delete ui;
  }

  delete runManager;
  return 0;
}
