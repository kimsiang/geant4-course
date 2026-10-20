#include "RunAction.hh"

#include "DetectorConstruction.hh"
#include "SkyFlux.hh"

#include "G4AccumulableManager.hh"
#include "G4AnalysisManager.hh"
#include "G4Run.hh"
#include "G4RunManager.hh"
#include "G4SystemOfUnits.hh"
#include "G4ios.hh"

#include <cmath>
#include <fstream>

RunAction::RunAction()
{
  G4AccumulableManager::Instance()->Register(fTop);
  G4AccumulableManager::Instance()->Register(fBoth);

  auto* analysis = G4AnalysisManager::Instance();
  analysis->SetDefaultFileType("root");
  analysis->SetFileName("muography");
  analysis->SetNtupleMerging(true);

  // One row per muon that crossed BOTH planes (what a two-plane telescope records).
  analysis->CreateNtuple("tel", "Muons through both tracker planes");
  analysis->CreateNtupleDColumn("E0_GeV");       // total energy at the ground (generated)
  analysis->CreateNtupleDColumn("cos_theta");    // generated zenith angle
  analysis->CreateNtupleDColumn("phi");          // generated azimuth (rad)
  analysis->CreateNtupleIColumn("charge");
  analysis->CreateNtupleDColumn("Etel_GeV");     // kinetic energy at the top plane
  analysis->CreateNtupleDColumn("x0_m");         // top plane hit
  analysis->CreateNtupleDColumn("y0_m");
  analysis->CreateNtupleDColumn("x1_m");         // bottom plane hit
  analysis->CreateNtupleDColumn("y1_m");
  analysis->CreateNtupleDColumn("sx_rec");       // reconstructed slopes of the upward direction:
  analysis->CreateNtupleDColumn("sy_rec");       //   sx = dx/dz, sy = dy/dz (tan of projected angles)
  analysis->CreateNtupleDColumn("sx_true");      // the same from the generated direction
  analysis->CreateNtupleDColumn("sy_true");
  analysis->FinishNtuple();
}

void RunAction::BeginOfRunAction(const G4Run*)
{
  G4AccumulableManager::Instance()->Reset();
  G4AnalysisManager::Instance()->OpenFile();
}

void RunAction::EndOfRunAction(const G4Run* run)
{
  G4AccumulableManager::Instance()->Merge();
  auto* analysis = G4AnalysisManager::Instance();

  if (IsMaster() && run->GetNumberOfEvent() > 0) {
    const auto* det =
      static_cast<const DetectorConstruction*>(G4RunManager::GetRunManager()->GetUserDetectorConstruction());
    const G4int n = run->GetNumberOfEvent();
    const G4double emin = det->EMin() / GeV, emax = det->EMax() / GeV, cmin = std::cos(det->ThetaMax());
    const G4double thetaDeg = std::round(det->ThetaMax() / deg * 1000.) / 1000.;   // 60, not 60.0001
    const G4double phi = SkyFlux::PlaneFlux(emin, emax, cmin);                  // cm^-2 s^-1
    const G4double aim = std::pow(2. * det->AimHalf() / cm, 2);                 // cm^2
    const G4double dt = 1. / (phi * aim);                                       // s per generated muon
    const G4double live = n * dt;
    const G4int both = fBoth.GetValue();

    G4cout << "Run " << run->GetRunID() << ": " << n << " sky muons, E " << emin << "-" << emax
           << " GeV, theta < " << thetaDeg << " deg" << G4endl
           << "  flux through a horizontal plane in that range = " << phi << " cm^-2 s^-1" << G4endl
           << "  aim square " << 2. * det->AimHalf() / m << " m x " << 2. * det->AimHalf() / m
           << " m  ->  exposure " << live << " s (" << live / 3600. << " h)" << G4endl
           << "  top plane hit " << fTop.GetValue() << ", both planes " << both << "  ->  "
           << both / live * 86400. << " +/- " << std::sqrt(static_cast<G4double>(both)) / live * 86400.
           << " telescope muons per day" << G4endl;

    G4String base = analysis->GetFileName();
    if (base.size() > 5 && base.substr(base.size() - 5) == ".root") base = base.substr(0, base.size() - 5);
    std::ofstream js(base + "_run.json");
    js << "{\n  \"n_generated\": " << n << ",\n  \"n_top\": " << fTop.GetValue() << ",\n  \"n_both\": " << both
       << ",\n  \"seconds_per_event\": " << dt << ",\n  \"plane_flux_cm2_s\": " << phi
       << ",\n  \"aim_area_cm2\": " << aim << ",\n  \"emin_GeV\": " << emin << ",\n  \"emax_GeV\": " << emax
       << ",\n  \"theta_max_deg\": " << thetaDeg << ",\n  \"overburden_m\": " << det->Overburden() / m
       << ",\n  \"plane_side_m\": " << 2. * det->PlaneHalf() / m << ",\n  \"plane_sep_m\": " << det->PlaneSep() / m
       << ",\n  \"top_plane_z_m\": " << det->TopPlaneZ() / m << ",\n  \"void_on\": " << (det->VoidOn() ? "true" : "false")
       << ",\n  \"void_xyz_m\": [" << det->VoidX() / m << ", " << det->VoidY() / m << ", " << det->VoidZ() / m
       << "],\n  \"void_radius_m\": " << det->VoidRadius() / m << "\n}\n";
  }
  analysis->Write();
  analysis->CloseFile();
}
