#include "CounterSD.hh"

#include "G4Step.hh"
#include "G4TouchableHistory.hh"

G4bool CounterSD::ProcessHits(G4Step* step, G4TouchableHistory*)
{
  const G4double edep = step->GetTotalEnergyDeposit();
  if (edep <= 0.) return false;
  const auto* pre = step->GetPreStepPoint();
  const G4int id = pre->GetTouchable()->GetCopyNumber();   // 11 = up, 1 = down
  const G4double t = pre->GetGlobalTime();
  fEdep[id] += edep;
  auto it = fTime.find(id);
  if (it == fTime.end() || t < it->second) fTime[id] = t;
  return true;
}
