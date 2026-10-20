#include "ActionInitialization.hh"
#include "DetectorConstruction.hh"
#include "EMPhysicsList.hh"

#include "FTFP_BERT.hh"
#include "G4RunManagerFactory.hh"
#include "G4UImanager.hh"

#include <string>

// Usage: ./week06 FTFP_BERT census.mac      (run A: full reference list)
//        ./week06 EM        census.mac      (run B: electromagnetic + decay only)
int main(int argc, char** argv)
{
  if (argc < 3) {
    G4cout << "usage: week06 FTFP_BERT|EM macro.mac" << G4endl;
    return 1;
  }
  const std::string list = argv[1];
  if (list != "EM" && list != "FTFP_BERT") {
    // never fall back silently to a physics list the user did not ask for
    G4cerr << "week06: unknown physics list '" << list << "'; use FTFP_BERT or EM" << G4endl;
    return 1;
  }
  auto* runManager = G4RunManagerFactory::CreateRunManager(G4RunManagerType::Serial);
  runManager->SetUserInitialization(new DetectorConstruction());

  if (list == "EM")
    runManager->SetUserInitialization(new EMPhysicsList());   // run B
  else
    runManager->SetUserInitialization(new FTFP_BERT());       // run A

  runManager->SetUserInitialization(new ActionInitialization());
  runManager->Initialize();
  G4UImanager::GetUIpointer()->ApplyCommand("/control/execute " + G4String(argv[2]));
  delete runManager;
  return 0;
}
