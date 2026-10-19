#include "PrimaryGeneratorAction.hh"

#include "G4Event.hh"
#include "G4ParticleGun.hh"
#include "G4ParticleTable.hh"
#include "G4SystemOfUnits.hh"

PrimaryGeneratorAction::PrimaryGeneratorAction()
{
  G4int n_particle = 1;
  fParticleGun = new G4ParticleGun(n_particle);

  // The four choices that define the experiment (as in Week 2):
  G4ParticleTable* particleTable = G4ParticleTable::GetParticleTable();
  G4ParticleDefinition* particle = particleTable->FindParticle("mu-");
  fParticleGun->SetParticleDefinition(particle);                          // 1. species
  fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0., 0., 1.));  // 2. direction
  fParticleGun->SetParticleEnergy(1. * GeV);                              // 3. kinetic energy
  fParticleGun->SetParticlePosition(G4ThreeVector(0., 0., -0.4 * m));     // 4. position: inside the 1 m world
}

PrimaryGeneratorAction::~PrimaryGeneratorAction()
{
  delete fParticleGun;
}

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
  // Called once per Event; this is where the primary vertex
  // and the primary particle's Track are actually created.
  fParticleGun->GeneratePrimaryVertex(event);
}
