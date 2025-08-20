import React, { useMemo, useState, useEffect } from "react";
import type { ProcessModel } from "../types";
import { questions, type Question, type Ctx } from "./questions";
import { QuestionUI } from "./QuestionUI";

type WizardProps = { onDone: (model: ProcessModel) => void };

const emptyModel: ProcessModel = { name:"", goal:"", trigger:"", lanes:[], steps:[], metrics:[] };

export default function Wizard({ onDone }: WizardProps) {
  const [ctx, setCtx] = useState<Ctx>({ m: { ...emptyModel }, answers: {} });
  const [qId, setQId] = useState<string>("name");
  const [error, setError] = useState<string | undefined>();
  const [hist, setHist] = useState<string[]>(["name"]); // history stack

  const q = useMemo(() => questions.find(x => x.id === qId) || null, [qId]);

  // If a bad id ever slips in, show a helpful fallback instead of blank screen
  if (!q) {
    return (
      <section className="card" style={{ minHeight: 200 }}>
        <h3 style={{ marginTop: 0 }}>Wizard problem</h3>
        <p className="error">Unknown step id: <code>{qId}</code></p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost" onClick={() => setQId(hist[hist.length - 2] || "name")}>Go back</button>
          <button className="btn" onClick={() => { setQId("name"); setHist(["name"]); }}>Restart</button>
        </div>
      </section>
    );
  }

  const goTo = (nextId: string) => {
    setHist(h => [...h, nextId]);
    setQId(nextId);
  };

  const handleNext = (value: any) => {
    // validate WITH context so lane checks work
    const err = q.validate?.(value, ctx);
    if (err) { setError(err); return; }
    setError(undefined);

    // apply answer -> next context
    const nextCtx: Ctx = { m: { ...ctx.m }, answers: { ...ctx.answers } };
    q.onAnswer?.(value, nextCtx);
    setCtx(nextCtx);

    // compute next id
    const dest = typeof q.next === "function" ? (q.next as any)(value, nextCtx) : q.next;

    // Defensive: ensure next exists
    const exists = questions.some(x => x.id === dest) || (q.id === "review" && dest === "generate");
    if (!exists) {
      setError(`Wizard misconfigured: next step "${dest}" not found`);
      return;
    }

    if (q.id === "review" && dest === "generate") {
      onDone(nextCtx.m);
      return;
    }
    goTo(dest);
  };

  const handleBack = () => {
    setError(undefined);
    setHist(h => {
      if (h.length <= 1) return h;
      const copy = h.slice(0, -1);
      setQId(copy[copy.length - 1]);
      return copy;
    });
  };

  return (
    <section className="card" style={{ minHeight: 260 }}>
      <h3 style={{ margin: 0 }}>Setup wizard</h3>

      <QuestionUI q={q} onNext={handleNext} lanes={ctx.m.lanes.map(l => l.name)} error={error} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, gap: "12px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button className="btn ghost" type="button" onClick={handleBack} disabled={hist.length <= 1}>Back</button>
          <button type="submit" form={`question-form-${q.id}`} className="btn primary">Next</button>
        </div>
        <span className="hint">Step {questions.findIndex(x => x.id === qId) + 1} / {questions.length}</span>
      </div>
    </section>
  );
}
