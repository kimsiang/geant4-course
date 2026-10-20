#include "PrimaryGeneratorAction.hh"

#include "DetectorConstruction.hh"
#include "SkyFlux.hh"

#include "G4Event.hh"
#include "G4ParticleGun.hh"
#include "G4ParticleTable.hh"
#include "G4PhysicalConstants.hh"
#include "G4RunManager.hh"
#include "G4SystemOfUnits.hh"
#include "Randomize.hh"

#include <cmath>

PrimaryGeneratorAction::PrimaryGeneratorAction()
{
  fGun = new G4ParticleGun(1);
  fDet = static_cast<const DetectorConstruction*>(G4RunManager::GetRunManager()->GetUserDetectorConstruction());
}

PrimaryGeneratorAction::~PrimaryGeneratorAction() { delete fGun; }

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
  const G4double emin = fDet->EMin() / GeV, emax = fDet->EMax() / GeV;
  const G4double cmin = std::cos(fDet->ThetaMax());
  const G4double a = 2.7, p = 1. - a;
  const G4double lo = std::pow(emin, p), hi = std::pow(emax, p);

  // 1. (E, cos theta) by rejection: proposal E^-2.7 x uniform cos theta,
  //    accepted with probability I(E,c) c / envelope(E) <= 1
  G4double E = 0., c = 1.;
  do {
    E = std::pow(lo + G4UniformRand() * (hi - lo), 1. / p);
    c = cmin + (1. - cmin) * G4UniformRand();
  } while (G4UniformRand() * SkyFlux::Envelope(E) > SkyFlux::Intensity(E, c) * c);
  const G4double s = std::sqrt(1. - c * c), phi = twopi * G4UniformRand();
  const G4ThreeVector dir(s * std::cos(phi), s * std::sin(phi), -c);   // downwards

  // 2. aim point on the square around the top plane
  const G4double h = fDet->AimHalf();
  const G4ThreeVector aim((2. * G4UniformRand() - 1.) * h, (2. * G4UniformRand() - 1.) * h, fDet->TopPlaneZ());

  // 3. back along the line to 0.5 m above the ground
  const G4double zStart = 0.5 * m;
  const G4ThreeVector start = aim - dir * ((zStart - aim.z()) / c);

  // charge: mu+/mu- = 1.27 (approximate sea-level ratio)
  const char* name = (G4UniformRand() < 1.27 / 2.27) ? "mu+" : "mu-";
  fGun->SetParticleDefinition(G4ParticleTable::GetParticleTable()->FindParticle(name));
  fGun->SetParticleEnergy(E * GeV - 105.658 * MeV);   // E is the total energy; the gun takes kinetic energy
  fGun->SetParticleMomentumDirection(dir);
  fGun->SetParticlePosition(start);
  fGun->GeneratePrimaryVertex(event);
}
