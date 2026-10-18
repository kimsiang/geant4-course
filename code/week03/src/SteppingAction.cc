#include "SteppingAction.hh"

#include "G4Step.hh"
#include "G4SystemOfUnits.hh"
#include "G4VProcess.hh"
#include "G4ios.hh"

void SteppingAction::UserSteppingAction(const G4Step* step)
{
  G4StepPoint* postStepPoint = step->GetPostStepPoint();

  // the process that ended THIS step (transportation counts too)
  const G4VProcess* process = postStepPoint->GetProcessDefinedStep();
  G4String processName = process ? process->GetProcessName() : "none";

  G4double edep = step->GetTotalEnergyDeposit();
  G4double stepLen = step->GetStepLength();
  G4ThreeVector pos = postStepPoint->GetPosition();

  // Two additions to the textbook listing, so the output can be filtered:
  // the volume the step happened in, and the track ID (1 = the primary).
  const G4String& volume = step->GetPreStepPoint()->GetPhysicalVolume()->GetName();
  G4int trackID = step->GetTrack()->GetTrackID();

  G4cout << " step ends via " << processName
         << " in " << volume << " trk " << trackID
         << " edep=" << edep / keV << " keV"
         << " stepLen=" << stepLen / mm << " mm"
         << " at " << pos / cm << " cm" << G4endl;
}
