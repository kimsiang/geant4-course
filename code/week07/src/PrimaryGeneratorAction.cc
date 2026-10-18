#include "PrimaryGeneratorAction.hh"

#include "G4Event.hh"
#include "G4ParticleGun.hh"
#include "G4ParticleTable.hh"
#include "G4SystemOfUnits.hh"

PrimaryGeneratorAction::PrimaryGeneratorAction()
{
  fParticleGun = new G4ParticleGun(1);
  fParticleGun->SetParticleDefinition(G4ParticleTable::GetParticleTable()->FindParticle("mu-"));
  fParticleGun->SetParticleMomentumDirection(G4ThreeVector(0., 0., 1.));
  fParticleGun->SetParticleEnergy(1. * GeV);                          // changed per run by /gun/energy
  fParticleGun->SetParticlePosition(G4ThreeVector(0., 0., -1.2 * m)); // upstream of tracker 1
}

PrimaryGeneratorAction::~PrimaryGeneratorAction()
{
  delete fParticleGun;
}

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
  fParticleGun->GeneratePrimaryVertex(event);
}
