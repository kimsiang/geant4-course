#ifndef SteppingAction_h
#define SteppingAction_h 1

#include "G4UserSteppingAction.hh"

class EventAction;

// Records where and when the primary muon decayed, and its spin at that moment.
class SteppingAction : public G4UserSteppingAction
{
  public:
    explicit SteppingAction(EventAction* ev) : fEvent(ev) {}
    void UserSteppingAction(const G4Step* step) override;

  private:
    EventAction* fEvent;
};

#endif
