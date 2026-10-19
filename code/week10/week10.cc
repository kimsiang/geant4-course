// Week 10: transverse-field muSR in plain Geant4 11.4, using the geometry of the textbook's tf_musr.mac.
// Usage:  ./week10 tf.mac            spin-aware muon decay (the physics a muSR study needs)
//         ./week10 tf.mac nospin     stock decay only: what an application gets if nobody adds spin
#include "ActionInitialization.hh"
#include "DetectorConstruction.hh"

#include "FTFP_BERT.hh"
#include "G4RunManagerFactory.hh"
#include "G4SpinDecayPhysics.hh"
#include "G4UIExecutive.hh"
#include "G4UImanager.hh"
#include "G4VisExecutive.hh"

#include <cstring>

int main(int argc, char** argv)
{
  auto* runManager =
    G4RunManagerFactory::CreateRunManager(G4RunManagerType::Default);
  runManager->SetNumberOfThreads(2);

  runManager->SetUserInitialization(new DetectorConstruction());

  auto* physics = new FTFP_BERT();
  const bool withSpin = !(argc > 2 && std::strcmp(argv[2], "nospin") == 0);
  if (withSpin) {
    // THE line of this week. FTFP_BERT's G4DecayPhysics uses G4Decay + G4MuonDecayChannel,
    // which "neglects muon polarization": no precession at rest, isotropic positrons, no asymmetry.
    // G4SpinDecayPhysics swaps in G4DecayWithSpin and G4MuonDecayChannelWithSpin.
    // Register it AFTER G4DecayPhysics (FTFP_BERT already contains it): it replaces "Decay".
    physics->RegisterPhysics(new G4SpinDecayPhysics());
  }
  runManager->SetUserInitialization(physics);
  runManager->SetUserInitialization(new ActionInitialization());
  // No Initialize() here: the macro sets /tf/B first, then calls /run/initialize.

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
