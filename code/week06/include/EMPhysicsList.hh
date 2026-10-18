#ifndef EMPhysicsList_h
#define EMPhysicsList_h 1

#include "G4DecayPhysics.hh"
#include "G4EmStandardPhysics.hh"
#include "G4SystemOfUnits.hh"
#include "G4VModularPhysicsList.hh"

// Mission 6B: a deliberately stripped physics list.
class EMPhysicsList : public G4VModularPhysicsList
{
  public:
    EMPhysicsList()
    {
      SetDefaultCutValue(0.7 * mm);  // same default as FTFP_BERT, so only the physics differs
      RegisterPhysics(new G4EmStandardPhysics());
      RegisterPhysics(new G4DecayPhysics());
      // deliberately no G4HadronPhysicsFTFP_BERT, no G4EmExtraPhysics:
      // any hadronic secondary is now simply absent, not an error
    }
};

#endif
