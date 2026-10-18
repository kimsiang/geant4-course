#include "RunAction.hh"

#include "G4Run.hh"
#include "G4RunManager.hh"
#include "G4SystemOfUnits.hh"
#include "G4VUserPhysicsList.hh"
#include "G4ios.hh"

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <vector>

void RunAction::BeginOfRunAction(const G4Run*)
{
  fBySpecies.clear();
  fByCreator.clear();
  fSumE = fSumE2 = 0.;
  fTimer.Start();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  fTimer.Stop();
  const G4int n = run->GetNumberOfEvent();
  if (n == 0) return;
  const G4double mean = fSumE / n;
  const G4double rms = std::sqrt(std::max(0., fSumE2 / n - mean * mean));

  auto sorted = [](const std::map<std::string, G4int>& m) {
    std::vector<std::pair<std::string, G4int>> v(m.begin(), m.end());
    std::sort(v.begin(), v.end(), [](auto& a, auto& b) { return a.second > b.second; });
    return v;
  };

  G4cout << std::fixed << std::setprecision(3)
         << "=== Census: " << n << " events, cut " << G4RunManager::GetRunManager()
              ->GetUserPhysicsList()->GetDefaultCutValue() / mm << " mm ===" << G4endl
         << "  Edep in Block      : " << mean / MeV << " +/- " << rms / std::sqrt(n) / MeV
         << " MeV (rms " << rms / MeV << ")" << G4endl
         << "  CPU time per event : " << 1000. * fTimer.GetUserElapsed() / n << " ms" << G4endl
         << "  secondaries per event, by particle:" << G4endl;
  for (const auto& [name, k] : sorted(fBySpecies))
    G4cout << "    " << std::left << std::setw(14) << name << std::right << std::setw(10)
           << static_cast<G4double>(k) / n << G4endl;
  G4cout << "  secondaries per event, by creator process:" << G4endl;
  for (const auto& [name, k] : sorted(fByCreator))
    G4cout << "    " << std::left << std::setw(14) << name << std::right << std::setw(10)
           << static_cast<G4double>(k) / n << G4endl;
  G4cout << std::defaultfloat;
}
