import React, { useMemo, useState, useEffect } from "react";
import type { ProcessModel } from "../types";
import { questions, type Question, type Ctx } from "./questions";

type WizardProps = {
  onDone: (model: ProcessModel) => void;
};

const emptyModel: ProcessModel = { name:"", goal:"", trigger:"", lanes:[], steps:[], metrics:[] };

export default function Wizard({ onDone }: WizardProps) {
  const [ctx, setCtx] = useState<Ctx>({ m: { ...emptyModel }, answers: {} });
  const [qId, setQId] = useState<string>("name");
  const [error, setError] = useState<string | undefined>();
  const q = useMemo(() => questions.find(x => x.id === qId)!, [qId]);

  const handleNext = (value: any) => {
    // validate
    const err = q.validate?.(value);
    if (err) { setError(err); return; }
    setError(undefined);

    // apply
    const nextCtx: Ctx = { m: { ...ctx.m }, answers: { ...ctx.answers } };
    q.onAnswer?.(value, nextCtx);
    setCtx(nextCtx);

    // next step
    if (q.id === "review" && (q as any).next(value) === "generate") {
      onDone(nextCtx.m);
      return;
    }
    const next = typeof q.next === "function" ? (q.next as any)(value, nextCtx) : q.next;
    setQId(next);
  };

  return (
    <section className="card" style={{ minHeight: 260 }}>
      <h3 style={{ marginTop: 0 }}>Setup wizard</h3>
      <p className="hint" style={{ marginTop: -8 }}>{q.help}</p>

      <QuestionUI q={q} onNext={handleNext} lanes={ctx.m.lanes.map(l=>l.name)} error={error} />

      <p className="hint" style={{ marginTop: 12 }}>
        Step {questions.findIndex(x=>x.id===qId)+1} / {questions.length}
      </p>
    </section>
  );
}

/* ---- minimal renderer ---- */
function QuestionUI({
  q,
  onNext,
  lanes,
  error,
}: {
  q: Question;
  onNext: (v: any) => void;
  lanes: string[];
  error?: string;
}) {
  // default value per kind
  const defaultValueFor = (q: Question) =>
    q.kind === "multi" || q.kind === "table" ? [] : "";

  const [v, setV] = useState<any>(defaultValueFor(q));

  // 🔧 Reset value when the question changes (prevents type mismatch)
  useEffect(() => {
    setV(defaultValueFor(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(v);
  };

  return (
    <form onSubmit={onSubmit} className="wizard">
      {q.kind === "input" && (
        <input
          className="ctl"
          placeholder={q.help}
          value={typeof v === "string" ? v : ""}
          onChange={(e) => setV(e.target.value)}
        />
      )}

      {q.kind === "multi" && (
        <TagInput
          // robust cast: always pass an array
          value={Array.isArray(v) ? v : []}
          onChange={setV}
          placeholder="Type and press Enter"
        />
      )}


      {q.kind === "table" && (
        <TableInput
          // robust cast: always pass an array
          value={Array.isArray(v) ? v : []}
          onChange={setV}
          lanes={lanes}
        />
      )}

      {q.kind === "select" && (
        <select
          className="ctl"
          value={typeof v === "string" ? v : ""}
          onChange={(e) => setV(e.target.value)}
        >
          <option value="" disabled>
            Select…
          </option>
          {(q.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 12 }}>
        <button className="btn primary" type="submit">
          Next
        </button>
      </div>
    </form>
  );
}


/* ---- Simple chips input for multi ---- */
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const items = Array.isArray(value) ? value : [];     // safety
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (!t) return;
    onChange([...items, t]);
    setInput("");
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {items.map((t, i) => (
          <span key={i} className="chip">
            {t}
            <button onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="remove">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="row">
        <input
          className="ctl"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button type="button" className="btn ghost" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

function TableInput({
  value,
  onChange,
  lanes,
}: {
  value: any[];
  onChange: (v: any[]) => void;
  lanes: string[];
}) {
  const rows = Array.isArray(value) ? value : [];
  const safeLane = lanes[0] || "";

  // If the lane list changes and some rows have a lane not in the list,
  // auto-correct them to the first lane (or empty string if none)
  React.useEffect(() => {
    if (!lanes.length) return;
    const set = new Set(lanes);
    const fixed = rows.map((r) => ({
      ...r,
      Lane: set.has(r?.Lane) ? r.Lane : safeLane,
    }));
    // Only update if something changed to avoid loops
    if (JSON.stringify(fixed) !== JSON.stringify(rows)) onChange(fixed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes.join("|")]); // join→primitive dep, avoids stale refs

  const add = () =>
    onChange([
      ...rows,
      { Action: "", Lane: safeLane }, // always start with a valid lane
    ]);

  const upd = (i: number, key: "Action" | "Lane", val: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const del = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="table">
        <div className="thead">
          <div>Action</div>
          <div>Lane</div>
          <div></div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="trow">
            <input
              className="ctl"
              placeholder="e.g., Validate request"
              value={r?.Action || ""}
              onChange={(e) => upd(i, "Action", e.target.value)}
            />
            <select
              className="ctl"
              value={r?.Lane ?? safeLane}
              onChange={(e) => upd(i, "Lane", e.target.value)}
              disabled={!lanes.length}
            >
              {lanes.length
                ? lanes.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))
                : <option value="">No lanes</option>}
            </select>
            <button type="button" className="btn danger" onClick={() => del(i)}>
              Delete
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn ghost"
        onClick={add}
        style={{ marginTop: 8 }}
        disabled={!lanes.length}
        title={lanes.length ? "Add action" : "Add some lanes first"}
      >
        + Add action
      </button>
    </div>
  );
}

