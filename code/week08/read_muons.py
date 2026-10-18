"""Mission 8: read the merged ROOT file without Geant4 and redo the Week 5 numbers.

The file holds two trees: 'daq' (detector-facing, triggered events only) and
'truth' (Monte Carlo truth, every event). Only column names connect this script
to the simulation.      pip install uproot numpy;  python3 read_muons.py
"""
import numpy as np
import uproot

with uproot.open("muons.root") as f:
    daq = f["daq"].arrays(library="np")
    truth = f["truth"].arrays(library="np")

n_gen = len(truth["event"])
n_trig = len(daq["event"])
eff = n_trig / n_gen
print(f"events generated (truth rows)   {n_gen}")
print(f"events recorded  (daq rows)     {n_trig}")
print(f"trigger efficiency              {eff:.4f} +/- {np.sqrt(eff * (1 - eff) / n_gen):.4f}")

# The DAQ selection uses ONLY the trigger word, as the analysis of real data must.
coinc = (daq["trigger_word"] & 4) != 0
print(f"daq rows with coincidence bit   {coinc.sum()} of {n_trig}")

# Cross-check: the truth flag must agree event by event (a test of the CHAIN, not of physics).
trig_truth = set(truth["event"][truth["triggered"] == 1].tolist())
trig_daq = set(daq["event"].tolist())
print(f"truth/daq event lists identical {trig_truth == trig_daq}")
print(f"mean ADC, top / bottom          {daq['ch0_adc'].mean():.1f} / {daq['ch1_adc'].mean():.1f}")
print(f"mean Edep top, triggered [MeV]  {truth['Edep0_MeV'][truth['triggered'] == 1].mean():.3f}")
