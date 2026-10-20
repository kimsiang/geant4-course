#ifndef PrimaryGeneratorAction_h
#define PrimaryGeneratorAction_h 1

#include "G4VUserPrimaryGeneratorAction.hh"
#include "globals.hh"

class G4ParticleGun;
class G4GenericMessenger;

// Monoenergetic mu- (energy with /gun/energy) starting at z = +80 cm, going down.
// /scat/gun/halfSize spreads the start point over a square; /scat/gun/maxAngle
// tilts the direction (cos theta uniform up to that angle, phi uniform).
// Defaults (0, 0) give a pencil beam at normal incidence for the Highland test.
class PrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    PrimaryGeneratorAction();
    ~PrimaryGeneratorAction() override;
    void GeneratePrimaries(G4Event* event) override;

  private:
    G4ParticleGun* fGun = nullptr;
    G4GenericMessenger* fMessenger = nullptr;
    G4double fHalfSize = 0.;
    G4double fMaxAngle = 0.;
};

#endif
