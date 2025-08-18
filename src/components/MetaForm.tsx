import React from 'react';

type Props = {
  processName: string;
  setProcessName: (v: string) => void;
  goal: string;
  setGoal: (v: string) => void;
  trigger: string;
  setTrigger: (v: string) => void;
  touched: Record<string, boolean>;
  markTouched: (k: string) => void;
};

export function MetaForm({
  processName, setProcessName,
  goal, setGoal,
  trigger, setTrigger,
  touched, markTouched
}: Props) {
  return (
    <section className="card grid2">
      <div className={!processName && touched.processName ? "field error" : "field"}>
        <label className="required">Process name</label>
        <input
          value={processName}
          onChange={e => setProcessName(e.target.value)}
          onBlur={() => markTouched("processName")}
          placeholder="e.g., Customer Onboarding"
        />
      </div>
      <div className={!goal && touched.goal ? "field error" : "field"}>
        <label className="required">Goal (Sortie)</label>
        <input
          value={goal}
          onChange={e => setGoal(e.target.value)}
          onBlur={() => markTouched("goal")}
          placeholder="e.g., Account activated"
        />
      </div>
      <div className={!trigger && touched.trigger ? "field error" : "field full"}>
        <label className="required">Trigger (Déclencheur)</label>
        <input
          value={trigger}
          onChange={e => setTrigger(e.target.value)}
          onBlur={() => markTouched("trigger")}
          placeholder="e.g., Signed contract received"
        />
      </div>
    </section>
  );
}