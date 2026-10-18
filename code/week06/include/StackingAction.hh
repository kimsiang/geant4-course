#ifndef StackingAction_h
#define StackingAction_h 1

#include "G4UserStackingAction.hh"

class RunAction;

// Called for every new track: the natural place for a census of secondaries.
class StackingAction : public G4UserStackingAction
{
  public:
    explicit StackingAction(RunAction* runAction) : fRunAction(runAction) {}
    G4ClassificationOfNewTrack ClassifyNewTrack(const G4Track* track) override;

  private:
    RunAction* fRunAction = nullptr;
};

#endif
