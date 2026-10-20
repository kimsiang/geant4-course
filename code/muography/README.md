# Muography starter (Week 12 capstone, muography track) and scattering add-on (Week 7, Lab 7.3)

`code/muography/` — cosmic muons (Guan et al. 2015 sea-level spectrum) through 30 m of
PDG standard rock with a tunnel, an optional air void and a two-plane telescope.
Every simulated muon stands for the same exposure, so counts become rates per day.

    mkdir build && cd build && cmake .. && make -j
    ./muography quick.mac                 # seconds
    ./muography void_off.mac              # 1 000 000 sky muons, ~1.5 min on 2 threads
    ./muography void_on.mac
    python3 analyse.py void_off void_on   # rates, void excess, exposure for 3 and 5 sigma, analyse.png

`code/muography/scattering/` — a separate small app: four ideal tracker planes, no field,
a steel slab or cube in between.

    ./scattering slab_scan.mac            # 1, 2, 5, 10 cm of steel at 1, 3, 10 GeV
    python3 highland.py                   # simulated theta0 vs PDG Eq. 34.16
    ./scattering poca.mac                 # 20 cm steel cube, 200 000 muons
    python3 poca.py poca.root             # PoCA image, poca.png

Expected outputs on the course pages come from Geant4 11.4.p01 runs of these files with
the course's dataset-free test physics list (standard EM processes, muon ionisation,
bremsstrahlung, pair production and multiple scattering, decay). Students build with
FTFP_BERT, which adds muon-nuclear interactions (about a tenth of the high-energy energy
loss in rock): expect its telescope rates a few percent lower. The scattering results
(multiple scattering) should agree within the statistical errors.
