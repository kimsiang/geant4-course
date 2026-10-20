#ifndef PrimaryGeneratorAction_h
#define PrimaryGeneratorAction_h 1

#include "G4String.hh"
#include "G4VUserPrimaryGeneratorAction.hh"

class G4ParticleGun;
class G4Event;
class G4GenericMessenger;

// A documented toy cosmic source: mu- of fixed energy, entering through a horizontal
// square plane above the telescope. Two angular models, chosen by /week05/gun/model:
//   vertical : every muon along +z
//   cos2     : sea-level intensity ~ cos^2(theta) per solid angle, crossing a plane,
//              so the sampled density of cos(theta) is ~ cos^3: cos(theta) = u^(1/4).
//              This is the Week 1 toy's "crossing a horizontal plane" model; Week 1
//              step 5 samples cos^2 per solid angle, cos(theta) = u^(1/3).
class PrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    PrimaryGeneratorAction();
    ~PrimaryGeneratorAction() override;
    void GeneratePrimaries(G4Event* event) override;

  private:
    G4ParticleGun* fParticleGun = nullptr;
    G4GenericMessenger* fMessenger = nullptr;
    G4String fModel = "cos2";
    G4double fHalfSize;   // half side of the source plane
};

#endif
