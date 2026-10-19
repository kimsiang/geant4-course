"""field_scan.py -- Mission 12: fitted precession frequency versus configured field.
Usage: python3 field_scan.py data/tf_5mT.root data/tf_10mT.root data/tf_20mT.root data/tf_30mT.root
The configured field is read from the file name (tf_<B>mT.root).
"""
import re
import subprocess
import sys

import numpy as np

GAMMA_MU = 135.5388   # MHz/T

B, F, dF = [], [], []
for fn in sys.argv[1:]:
    out = subprocess.run([sys.executable, "asymmetry.py", fn], capture_output=True, text=True, check=True).stdout
    f, df = map(float, re.search(r"f   = ([\d.]+) \+/- ([\d.]+)", out).groups())
    b = float(re.search(r"tf_(\d+)mT", fn).group(1)) / 1000.0
    B.append(b); F.append(f); dF.append(df)
    print(f"B = {b*1000:5.1f} mT   f = {f:.4f} +/- {df:.4f} MHz   expected {GAMMA_MU*b:.4f}   pull {(f-GAMMA_MU*b)/df:+.2f}")

B, F, dF = map(np.asarray, (B, F, dF))
w = 1 / dF**2
# weighted straight line through the origin: f = k B
k = np.sum(w * B * F) / np.sum(w * B * B)
dk = 1 / np.sqrt(np.sum(w * B * B))
chi2 = np.sum(w * (F - k * B) ** 2)
print(f"slope k = {k:.3f} +/- {dk:.3f} MHz/T   (gamma_mu/2pi = {GAMMA_MU})   chi2/ndf = {chi2:.2f}/{len(B)-1}")
