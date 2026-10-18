#ifndef ActionInitialization_h
#define ActionInitialization_h 1

#include "G4VUserActionInitialization.hh"

class ActionInitialization : public G4VUserActionInitialization
{
  public:
    void BuildForMaster() const override;  // the master's RunAction merges the workers
    void Build() const override;           // one set of actions per worker thread
};

#endif
