#include "PrimaryGeneratorAction.hh"

#include "G4ParticleGun.hh"
#include "G4ParticleTable.hh"
#include "G4SystemOfUnits.hh"
#include "Randomize.hh"

PrimaryGeneratorAction::PrimaryGeneratorAction() : fGun(new G4ParticleGun(1))
{
  fGun->SetParticleDefinition(G4ParticleTable::GetParticleTable()->FindParticle("mu+"));  // /gun/primaryparticle mu+
  fGun->SetParticleMomentumDirection({0., 0., 1.});
  fGun->SetParticleMomentum(29.8 * MeV);                // /gun/momentum 29.8 MeV  (|p| = 29.8 MeV/c)
  fGun->SetParticlePolarization({0., 0., -1.});         // /gun/muonPolarizVector 0 0 -1, fraction 1
}

PrimaryGeneratorAction::~PrimaryGeneratorAction() { delete fGun; }

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
  // /gun/vertex 0 0 -80 mm   /gun/vertexsigma 3 3 0 mm (positive sigma = Gaussian)
  fGun->SetParticlePosition({G4RandGauss::shoot(0., 3. * mm), G4RandGauss::shoot(0., 3. * mm), -80. * mm});
  fGun->GeneratePrimaryVertex(event);
}
