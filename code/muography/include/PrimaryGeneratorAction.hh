#ifndef PrimaryGeneratorAction_h
#define PrimaryGeneratorAction_h 1

#include "G4VUserPrimaryGeneratorAction.hh"
#include "globals.hh"

class G4ParticleGun;
class G4Event;
class DetectorConstruction;

// Cosmic muons from the sky, aimed at the telescope ("importance region").
// For each event:
//   1. draw (E, cos theta) with density  I(E, theta) * cos theta  (flux through a
//      horizontal plane, Guan et al. 2015), and phi uniform;
//   2. draw an AIM POINT uniformly on a horizontal square around the top plane
//      (plane + margin);
//   3. start the muon on the straight line through the aim point, 0.5 m above
//      the ground, travelling downwards.
// Because the aim points are uniform and the directions follow the plane flux,
// every event represents the same exposure time:
//   dt = 1 / (Phi * A_aim),  Phi = flux through a horizontal plane in the sampled
//   E and theta ranges [cm^-2 s^-1], A_aim = aim-square area [cm^2].
// Muons that would reach the telescope from OUTSIDE the aim square after
// scattering in the rock are missed: keep the margin larger than the lateral
// spread (about 0.2 m for 20 GeV muons through 30 m of rock).
class PrimaryGeneratorAction : public G4VUserPrimaryGeneratorAction
{
  public:
    PrimaryGeneratorAction();
    ~PrimaryGeneratorAction() override;
    void GeneratePrimaries(G4Event* event) override;

  private:
    G4ParticleGun* fGun = nullptr;
    const DetectorConstruction* fDet = nullptr;
};

#endif
