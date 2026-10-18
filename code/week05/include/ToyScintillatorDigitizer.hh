#ifndef ToyScintillatorDigitizer_h
#define ToyScintillatorDigitizer_h 1

#include "globals.hh"

// Mission 6: deposited energy -> photoelectrons -> ADC number and a pulse time.
// Every number below is a TOY assumption, not a property of a real product.
struct Signal
{
  G4double adc = 0.;     // ADC counts
  G4double time = 0.;    // ns
  G4bool hasPulse = false;
};

class ToyScintillatorDigitizer
{
  public:
    // evis: Birks-quenched visible energy (already applied per step in MuonSD)
    Signal Digitize(G4double evis, G4double trueTime) const;
    Signal NoisePulse() const;  // a random background pulse in the readout window

    G4double fPedestal = 50.;           // ADC counts
    G4double fLightYield = 25.;         // photoelectrons per MeV visible (collected)
    G4double fGain = 4.;                // ADC counts per photoelectron
    G4double fElectronicNoiseSigma = 3.;// ADC counts
    G4double fTimeResolution = 0.5;     // ns, Gaussian
    G4double fWindow = 1000.;           // ns, readout window for noise pulses
    G4double fNoiseMeanPE = 15.;        // mean amplitude of a background pulse
};

#endif
