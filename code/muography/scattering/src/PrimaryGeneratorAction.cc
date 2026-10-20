#include "PrimaryGeneratorAction.hh"

#include "G4Event.hh"
#include "G4GenericMessenger.hh"
#include "G4ParticleGun.hh"
#include "G4ParticleTable.hh"
#include "G4PhysicalConstants.hh"
#include "G4SystemOfUnits.hh"
#include "Randomize.hh"

#include <cmath>

PrimaryGeneratorAction::PrimaryGeneratorAction()
{
  fGun = new G4ParticleGun(1);
  fGun->SetParticleDefinition(G4ParticleTable::GetParticleTable()->FindParticle("mu-"));
  fGun->SetParticleEnergy(3. * GeV);
  fMessenger = new G4GenericMessenger(this, "/scat/gun/", "Muon source");
  fMessenger->DeclarePropertyWithUnit("halfSize", "cm", fHalfSize, "half side of the start square");
  fMessenger->DeclarePropertyWithUnit("maxAngle", "deg", fMaxAngle, "largest zenith angle");
}

PrimaryGeneratorAction::~PrimaryGeneratorAction()
{
  delete fMessenger;
  delete fGun;
}

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
  const G4double cmin = std::cos(fMaxAngle);
  const G4double c = 1. - (1. - cmin) * G4UniformRand(), s = std::sqrt(1. - c * c), phi = twopi * G4UniformRand();
  const G4ThreeVector dir(s * std::cos(phi), s * std::sin(phi), -c);
  // place the start so the line crosses z = 0 at a uniform point of the square
  const G4ThreeVector atZero((2. * G4UniformRand() - 1.) * fHalfSize, (2. * G4UniformRand() - 1.) * fHalfSize, 0.);
  fGun->SetParticlePosition(atZero - dir * (80. * cm / c));
  fGun->SetParticleMomentumDirection(dir);
  fGun->GeneratePrimaryVertex(event);
}
