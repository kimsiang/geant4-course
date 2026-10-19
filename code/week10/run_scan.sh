#!/bin/bash
# run_scan.sh -- Mission 12: the same experiment at several fields, plus the "no spin" control.
# Run from the build directory, next to ./week10 and tf.mac.
set -e
mkdir -p data
for B in 0.005 0.010 0.020 0.030; do
  mT=$(python3 -c "print(round($B*1000))")
  sed "s|^/tf/B .*|/tf/B $B T|; s|data/tf_10mT|data/tf_${mT}mT|" tf.mac > tf_${mT}mT.mac
  ./week10 tf_${mT}mT.mac > tf_${mT}mT.log
  echo "B = ${mT} mT -> data/tf_${mT}mT.root"
done
# Control: identical macro, stock decay physics (no G4SpinDecayPhysics).
sed "s|data/tf_10mT|data/tf_10mT_nospin|" tf.mac > tf_nospin.mac
./week10 tf_nospin.mac nospin > tf_nospin.log
echo "no-spin control -> data/tf_10mT_nospin.root"
