#include "PrimaryGeneratorAction.hh"

#include "G4Event.hh"
#include "G4GenericMessenger.hh"
#include "G4ParticleGun.hh"
#include "G4ParticleTable.hh"
#include "G4PhysicalConstants.hh"
#include "G4SystemOfUnits.hh"
#include "Randomize.hh"

#include <cmath>

PrimaryGeneratorAction::PrimaryGeneratorAction() : fHalfSize(15. * cm)
{
  fParticleGun = new G4ParticleGun(1);
  fParticleGun->SetParticleDefinition(G4ParticleTable::GetParticleTable()->FindParticle("mu-"));
  fParticleGun->SetParticleEnergy(4. * GeV);  // ~ mean sea-level muon energy (PDG); a toy choice

  fMessenger = new G4GenericMessenger(this, "/week08/gun/", "Toy cosmic source");
  fMessenger->DeclareProperty("model", fModel, "vertical | cos2").SetCandidates("vertical cos2");
  fMessenger->DeclarePropertyWithUnit("halfSize", "cm", fHalfSize, "half side of the source plane");
}

PrimaryGeneratorAction::~PrimaryGeneratorAction()
{
  delete fMessenger;
  delete fParticleGun;
}

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
  // Sampled per EVENT, inside GeneratePrimaries (Week 2 lesson).
  G4double cosTheta = 1.;
  if (fModel == "cos2") cosTheta = std::pow(G4UniformRand(), 0.25);
  const G4double sinTheta = std::sqrt(1. - cosTheta * cosTheta);
  const G4double phi = twopi * G4UniformRand();

  const G4double x = (2. * G4UniformRand() - 1.) * fHalfSize;
  const G4double y = (2. * G4UniformRand() - 1.) * fHalfSize;
  fParticleGun->SetParticlePosition(G4ThreeVector(x, y, -20. * cm));  // source plane above the top counter
  fParticleGun->SetParticleMomentumDirection(
    G4ThreeVector(sinTheta * std::cos(phi), sinTheta * std::sin(phi), cosTheta));
  fParticleGun->GeneratePrimaryVertex(event);
}
