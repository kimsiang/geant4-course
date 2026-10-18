#include "ToyScintillatorDigitizer.hh"

#include "G4Poisson.hh"
#include "G4SystemOfUnits.hh"
#include "Randomize.hh"

Signal ToyScintillatorDigitizer::Digitize(G4double evis, G4double trueTime) const
{
  Signal s;
  s.adc = fPedestal + G4RandGauss::shoot(0., fElectronicNoiseSigma);
  if (evis <= 0.) return s;  // no light: pedestal + noise only

  const G4double meanPE = fLightYield * evis / MeV;
  const G4int npe = static_cast<G4int>(G4Poisson(meanPE));
  s.adc += fGain * npe;
  s.time = trueTime / ns + G4RandGauss::shoot(0., fTimeResolution);
  s.hasPulse = npe > 0;
  return s;
}

Signal ToyScintillatorDigitizer::NoisePulse() const
{
  Signal s;
  const G4int npe = 1 + static_cast<G4int>(G4Poisson(fNoiseMeanPE * G4UniformRand() * 2.));
  s.adc = fPedestal + fGain * npe + G4RandGauss::shoot(0., fElectronicNoiseSigma);
  s.time = (G4UniformRand() - 0.5) * fWindow;
  s.hasPulse = true;
  return s;
}
