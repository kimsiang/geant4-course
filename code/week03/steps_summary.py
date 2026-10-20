"""Summarise the SteppingAction printout of week03: per event, count the primary
muon's steps inside the Block (by process) and sum the energy deposited in the Block.

Usage: ./week03 run1000.mac > concrete.log && python3 steps_summary.py concrete.log
"""
import collections
import math
import re
import sys

PAT = re.compile(r" step ends via (\S+) in (\S+) trk (\d+) edep=(\S+) keV "
                 r"stepLen=(\S+) mm at \((\S+),(\S+),(\S+)\) cm")


def events(lines):
    """A new event starts when the primary (trk 1) reappears after other tracks,
    or when its z coordinate jumps back (an event with no secondaries)."""
    cur, prev_trk, last_z = None, None, None
    for line in lines:
        m = PAT.match(line)
        if not m:
            continue
        proc, vol, trk, edep, _, _, _, z = m.groups()
        trk, edep, z = int(trk), float(edep), float(z)
        if trk == 1 and (cur is None or prev_trk != 1 or z < last_z - 1e-6):
            if cur is not None:
                yield cur
            cur = {"steps": collections.Counter(), "edep_MeV": 0.0}
        if trk == 1:
            last_z = z
        prev_trk = trk
        if vol == "Block":
            cur["edep_MeV"] += edep / 1000.0
            if trk == 1:
                cur["steps"][proc] += 1
    if cur is not None:
        yield cur


def main(path):
    evs = list(events(open(path)))
    n = len(evs)
    if n == 0:
        sys.exit(f"no events found in {path}: did the run abort? Check the log for a G4Exception "
                 "(for example missing datasets) and that SteppingAction prints its step lines.")
    steps = [sum(e["steps"].values()) for e in evs]
    edep = [e["edep_MeV"] for e in evs]
    procs = collections.Counter()
    for e in evs:
        procs.update(e["steps"])

    def mean_err(a):
        m = sum(a) / len(a)
        sd = math.sqrt(sum((v - m) ** 2 for v in a) / len(a))
        return m, sd / math.sqrt(len(a))

    m_s, e_s = mean_err(steps)
    m_e, e_e = mean_err(edep)
    print(f"events                  {n}")
    print(f"primary steps in Block  {m_s:.2f} +/- {e_s:.2f}")
    for proc, c in procs.most_common():
        print(f"   {proc:<20s} {c / n:.2f} per event")
    print(f"Edep in Block [MeV]     {m_e:.2f} +/- {e_e:.2f}")


if __name__ == "__main__":
    main(sys.argv[1])
