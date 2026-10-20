// Muography starter: cosmic muons through rock with a tunnel, an optional void,
// and a two-plane telescope in the tunnel. Start from this for a muography capstone.
//
//   ./muography void_off.mac      headless run (the macro sets geometry, then /run/initialize)
//   ./muography                   viewer with vis.mac
#include "ActionInitialization.hh"
#include "DetectorConstruction.hh"

#include "FTFP_BERT.hh"
#include "G4RunManagerFactory.hh"
#include "G4UIExecutive.hh"
#include "G4UImanager.hh"
#include "G4VisExecutive.hh"

int main(int argc, char** argv)
{
  auto* runManager = G4RunManagerFactory::CreateRunManager(G4RunManagerType::Default);
  runManager->SetNumberOfThreads(2);

  runManager->SetUserInitialization(new DetectorConstruction());
  runManager->SetUserInitialization(new FTFP_BERT());
  runManager->SetUserInitialization(new ActionInitialization());
  // No Initialize() here: the macros set /muo/det/... first, then call /run/initialize.

  auto* uiManager = G4UImanager::GetUIpointer();
  if (argc > 1) {
    uiManager->ApplyCommand("/control/execute " + G4String(argv[1]));
  } else {
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
