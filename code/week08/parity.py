"""Mission 8B: one analysis for simulation and hardware.

A deliberately simple 'laboratory' binary format (one header + two channel records per
event, little-endian) stands in for a real digitizer. The simulated ROOT 'daq' tree is
written into that format, decoded again, and both streams go through the SAME analysis
function, which never asks where the events came from.

    python3 parity.py
"""
import struct

import numpy as np
import uproot

HEADER = struct.Struct("<IQQIH")   # run, event, timestamp_ns, trigger_word, n_channels
CHANNEL = struct.Struct("<Hff")    # channel id, adc, time_ns


def canonical_from_root(path):
    """Decoder 1: the simulation's ROOT tree -> canonical arrays."""
    with uproot.open(path) as f:
        d = f["daq"].arrays(library="np")
    return {"run": d["run"], "event": d["event"], "timestamp_ns": d["timestamp_ns"].astype(np.uint64),
            "trigger_word": d["trigger_word"], "adc": np.stack([d["ch0_adc"], d["ch1_adc"]], axis=1),
            "time_ns": np.stack([d["ch0_time_ns"], d["ch1_time_ns"]], axis=1)}


def write_binary(ev, path):
    """Pack canonical events into the lab-style binary stream (what the digitizer would write)."""
    with open(path, "wb") as out:
        for i in range(len(ev["event"])):
            out.write(HEADER.pack(int(ev["run"][i]), int(ev["event"][i]), int(ev["timestamp_ns"][i]),
                                  int(ev["trigger_word"][i]), 2))
            for ch in range(2):
                out.write(CHANNEL.pack(ch, float(ev["adc"][i, ch]), float(ev["time_ns"][i, ch])))


def canonical_from_binary(path):
    """Decoder 2: the lab binary stream -> the same canonical arrays."""
    rows = {k: [] for k in ("run", "event", "timestamp_ns", "trigger_word", "adc", "time_ns")}
    with open(path, "rb") as f:
        while (head := f.read(HEADER.size)):
            run, evt, ts, tw, nch = HEADER.unpack(head)
            adc, tim = [0.0, 0.0], [0.0, 0.0]
            for _ in range(nch):
                ch, a, t = CHANNEL.unpack(f.read(CHANNEL.size))
                adc[ch], tim[ch] = a, t
            for k, v in (("run", run), ("event", evt), ("timestamp_ns", ts), ("trigger_word", tw), ("adc", adc), ("time_ns", tim)):
                rows[k].append(v)
    return {k: np.array(v) for k, v in rows.items()}


def analysis(ev):
    """The ONE analysis. Selects with the trigger word only."""
    sel = (ev["trigger_word"] & 4) != 0
    adc = ev["adc"][sel]
    dt = ev["time_ns"][sel, 0] - ev["time_ns"][sel, 1]
    return {"n": int(sel.sum()), "mean_adc_top": round(float(adc[:, 0].mean()), 3),
            "mean_adc_bottom": round(float(adc[:, 1].mean()), 3), "rms_dt_ns": round(float(dt.std()), 3)}


sim = canonical_from_root("muons.root")
write_binary(sim, "lab_stream.bin")
lab = canonical_from_binary("lab_stream.bin")
a, b = analysis(sim), analysis(lab)
print("from ROOT  :", a)
print("from binary:", b)
print("identical  :", a == b)
