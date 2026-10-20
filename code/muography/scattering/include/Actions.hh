#ifndef Actions_h
#define Actions_h 1

#include "G4Accumulable.hh"
#include "G4UserEventAction.hh"
#include "G4UserRunAction.hh"
#include "G4VUserActionInitialization.hh"
#include "globals.hh"

class RunAction : public G4UserRunAction
{
  public:
    RunAction();
    void BeginOfRunAction(const G4Run*) override;
    void EndOfRunAction(const G4Run* run) override;
    void Count(G4bool all4) { fAll4 += all4 ? 1 : 0; }

  private:
    G4Accumulable<G4int> fAll4{0};
};

class EventAction : public G4UserEventAction
{
  public:
    explicit EventAction(RunAction* r) : fRun(r) {}
    void EndOfEventAction(const G4Event* event) override;

  private:
    RunAction* fRun = nullptr;
    G4int fHitsID = -1;
};

class ActionInitialization : public G4VUserActionInitialization
{
  public:
    void BuildForMaster() const override;
    void Build() const override;
};

#endif
