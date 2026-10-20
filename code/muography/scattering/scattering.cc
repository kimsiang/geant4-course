// Scattering muography without a magnet: how much does steel bend a muon?
//   ./scattering slab_scan.mac   Highland test: 1, 2, 5, 10 cm of steel at 1, 3, 10 GeV
//   ./scattering poca.mac        a 20 cm steel cube for the PoCA image
#include "Actions.hh"
#include "DetectorConstruction.hh"

#include "FTFP_BERT.hh"
#include "G4RunManagerFactory.hh"
#include "G4UImanager.hh"

int main(int argc, char** argv)
{
  auto* runManager = G4RunManagerFactory::CreateRunManager(G4RunManagerType::Default);
  runManager->SetNumberOfThreads(2);
  runManager->SetUserInitialization(new DetectorConstruction());
  runManager->SetUserInitialization(new FTFP_BERT());
  runManager->SetUserInitialization(new ActionInitialization());
  if (argc > 1) G4UImanager::GetUIpointer()->ApplyCommand("/control/execute " + G4String(argv[1]));
  delete runManager;
  return 0;
}
