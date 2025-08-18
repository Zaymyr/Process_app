import React, { useEffect, useRef, useState } from "react";

// --- Types ---
type Lane = { id: string; name: string };
type Step = { id: string; label: string; laneId: string };

// --- Utils ---
const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 8)}`;
const esc = (x: string) =>
  (x ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, " ")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();

export default function App() {
  // Meta
  const [processName, setProcessName] = useState("");
  const [goal, setGoal] = useState("");
  const [trigger, setTrigger] = useState("");

  // Lanes & Steps
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [newLaneName, setNewLaneName] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { id: uid("step"), label: "", laneId: "" },
  ]);

  // Diagram
  const [mermaidSrc, setMermaidSrc] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const mmRef = useRef<HTMLDivElement>(null);

  // UX helpers
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  // Drag & Drop state
const [dragIndex, setDragIndex] = useState<number | null>(null);
const [overIndex, setOverIndex] = useState<number | null>(null);

// Reorder helper
function move<T>(arr: T[], from: number, to: number) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// DnD handlers
const handleDragStart = (i: number) => () => {
  setDragIndex(i);
  setOverIndex(i);
};

const handleDragOver = (i: number) => (e: React.DragEvent) => {
  e.preventDefault(); // allow drop
  if (overIndex !== i) setOverIndex(i);
};

const handleDrop = (i: number) => (e: React.DragEvent) => {
  e.preventDefault();
  if (dragIndex === null) return;
  if (dragIndex !== i) {
    setSteps((ss) => move(ss, dragIndex, i));
    // also update touched keys so validation styles stick with fields
    setTouched((t) => {
      const remap = (prefix: string) => {
        const keys = Object.keys(t).filter((k) => k.startsWith(prefix));
        const vals = keys.map((k) => t[k]);
        const reordered = move(vals, dragIndex, i);
        const out = { ...t };
        keys.forEach((k) => delete out[k]);
        reordered.forEach((v, idx) => (out[`${prefix}${idx}`] = v));
        return out;
      };
      const base = { ...t };
      return {
        ...remap("step_label_"),
        ...remap("step_lane_"),
        processName: base.processName,
        goal: base.goal,
        trigger: base.trigger,
        lanes: base.lanes,
      };
    });
  }
  setDragIndex(null);
  setOverIndex(null);
};

const handleDragEnd = () => {
  setDragIndex(null);
  setOverIndex(null);
};


  // Lane CRUD
  const addLane = () => {
    const name = newLaneName.trim();
    const errs: string[] = [];
    if (!name) errs.push("Lane name is required.");
    if (lanes.some((l) => l.name.toLowerCase() === name.toLowerCase()))
      errs.push(`Lane "${name}" already exists.`);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setLanes((ls) => [...ls, { id: uid("lane"), name }]);
    setNewLaneName("");
    setErrors([]);
  };

  const removeLane = (laneId: string) => {
    if (steps.some((s) => s.laneId === laneId)) {
      setErrors([
        "This lane is used by one or more steps. Move those steps first.",
      ]);
      return;
    }
    setLanes((ls) => ls.filter((l) => l.id !== laneId));
  };

  // Step CRUD
  const addStep = () =>
    setSteps((ss) => [
      ...ss,
      { id: uid("step"), label: "", laneId: lanes[0]?.id ?? "" },
    ]);

  const updateStep = (i: number, patch: Partial<Step>) =>
    setSteps((ss) => {
      const next = [...ss];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  // Build Mermaid (flowchart with swimlanes via subgraphs)
  const buildDiagram = () => {
    const errs: string[] = [];
    if (!processName.trim()) errs.push("Process name is required.");
    if (!goal.trim()) errs.push("Goal (Sortie) is required.");
    if (!trigger.trim()) errs.push("Trigger (Déclencheur) is required.");
    if (!lanes.length) errs.push("Add at least one lane.");
    steps.forEach((s, i) => {
      if (!s.label.trim()) errs.push(`Step ${i + 1}: label is required.`);
      if (!s.laneId) errs.push(`Step ${i + 1}: lane is required.`);
    });
    setErrors(errs);
    if (errs.length) {
      setTouched({
        processName: true,
        goal: true,
        trigger: true,
        lanes: true,
        ...Object.fromEntries(steps.map((_, i) => [`step_label_${i}`, true])),
        ...Object.fromEntries(steps.map((_, i) => [`step_lane_${i}`, true])),
      });
      return;
    }

    const startId = "start";
    const endId = "end_node";
    const lines: string[] = [];
    lines.push("flowchart LR");
    lines.push(`%% Process: ${esc(processName)}`);
    lines.push(`${startId}([\"Déclencheur: ${esc(trigger)}\"])`);
    lines.push(`${endId}([\"Sortie: ${esc(goal)}\"])`);

    // Nodes
    steps.forEach((s) => lines.push(`${s.id}([\"${esc(s.label)}\"])`));

    // Edges (linear for now)
    let prev = startId;
    steps.forEach((s) => {
      lines.push(`${prev} --> ${s.id}`);
      prev = s.id;
    });
    lines.push(`${prev} --> ${endId}`);

    // Lanes as subgraphs
    lanes.forEach((lane) => {
      lines.push(`subgraph ${esc(lane.name)}`);
      lines.push("direction TB");
      const idsInLane = steps
        .filter((s) => s.laneId === lane.id)
        .map((s) => s.id);
      if (!idsInLane.length) {
        const ph = uid("ph");
        lines.push(`${ph}([\" \"])`);
      } else {
        idsInLane.forEach((id) => lines.push(id));
      }
      lines.push("end");
    });

    setMermaidSrc(lines.join("\n"));
  };

  // Render Mermaid (dynamic import for Vite/StackBlitz)
  useEffect(() => {
    if (!mermaidSrc || !mmRef.current) return;

    const render = async () => {
      const mermaid = await import("mermaid/dist/mermaid.esm.mjs").catch(() =>
        import("mermaid")
      );
      const api = (mermaid as any).default ?? mermaid;
      api.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        htmlLabels: true,
      });
      const id = "mermaid-diagram";
      mmRef.current!.innerHTML = `<div id="${id}"></div>`;
      api
        .render(id + "-svg", mermaidSrc)
        .then(({ svg }: { svg: string }) => {
          const target = document.getElementById(id);
          if (target) target.innerHTML = svg;
        })
        .catch((e: any) => {
          setErrors([`Mermaid error: ${e?.message ?? String(e)}`]);
        });
    };

    render();
  }, [mermaidSrc]);

  // --- UI ---
  return (
    <div className="wrap">
      <header className="hdr">
        <h1>Process Mapper — POC</h1>
        <p className="hdr-sub">Friendly, structured, and ready for swimlanes.</p>
      </header>

      {!!errors.length && (
        <div className="alert">
          <strong>We need a few tweaks:</strong>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* Meta */}
      <section className="card grid2">
        <div className={!processName && touched.processName ? "field error" : "field"}>
          <label className="required">Process name</label>
          <input
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
            onBlur={() => markTouched("processName")}
            placeholder="e.g., Customer Onboarding"
          />
        </div>
        <div className={!goal && touched.goal ? "field error" : "field"}>
          <label className="required">Goal (Sortie)</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onBlur={() => markTouched("goal")}
            placeholder="e.g., Account activated"
          />
        </div>
        <div className={!trigger && touched.trigger ? "field error" : "field full"}>
          <label className="required">Trigger (Déclencheur)</label>
          <input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            onBlur={() => markTouched("trigger")}
            placeholder="e.g., Signed contract received"
          />
        </div>
      </section>

      {/* Lanes */}
      <section className="card">
        <div className="sec-hdr">
          <h3>Swimlanes</h3>
          <span className="hint">Group steps by responsibilities (HR, IT, Finance…)</span>
        </div>
        <div className="lane-add">
          <div className={!lanes.length && touched.lanes ? "field error" : "field"}>
            <label className="required">Lane name</label>
            <input
              value={newLaneName}
              onChange={(e) => setNewLaneName(e.target.value)}
              onBlur={() => markTouched("lanes")}
              placeholder="e.g., Sales"
            />
          </div>
          <button className="btn" onClick={addLane}>Add lane</button>
        </div>
        {lanes.length > 0 && (
          <ul className="lanes">
            {lanes.map((l) => (
              <li key={l.id}>
                <span className="pill">{l.name}</span>
                <button className="btn ghost" onClick={() => removeLane(l.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Steps */}
      <section className="card">
  <div className="sec-hdr">
    <h3>Steps</h3>
    <span className="hint">Drag the handle to reorder. Keep labels action‑oriented.</span>
  </div>

  {steps.map((s, i) => {
    const labelErr = !s.label && touched[`step_label_${i}`];
    const laneErr = !s.laneId && touched[`step_lane_${i}`];
    const isDragging = i === dragIndex;
    const isOver = i === overIndex && dragIndex !== null && dragIndex !== i;

    return (
      <div
        key={s.id}
        className={`row dnd ${isDragging ? "dragging" : ""} ${isOver ? "over" : ""}`}
        draggable
        onDragStart={handleDragStart(i)}
        onDragOver={handleDragOver(i)}
        onDrop={handleDrop(i)}
        onDragEnd={handleDragEnd}
      >
        <span className="grab" title="Drag to reorder" aria-label="Drag to reorder" role="button" tabIndex={0}>
          ≡
        </span>

        <div className={labelErr ? "field error" : "field"}>
          <label className="required">Label</label>
          <input
            value={s.label}
            onChange={(e) => updateStep(i, { label: e.target.value })}
            onBlur={() => markTouched(`step_label_${i}`)}
            placeholder={`Step ${i + 1}`}
          />
        </div>

        <div className={laneErr ? "field error" : "field"}>
          <label className="required">Lane</label>
          <select
            value={s.laneId}
            onChange={(e) => updateStep(i, { laneId: e.target.value })}
            onBlur={() => markTouched(`step_lane_${i}`)}
          >
            <option value="">— Select a lane —</option>
            {lanes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn ghost danger"
          onClick={() => setSteps((ss) => ss.filter((x) => x.id !== s.id))}
        >
          Delete
        </button>
      </div>
    );
  })}

  <button
    className="btn"
    onClick={addStep}
    disabled={!lanes.length}
    title={!lanes.length ? "Add a lane first" : ""}
  >
    + Add step
  </button>
</section>


      {/* Generate (at the very end, primary style) */}
      <section className="actions">
        <button className="btn primary" onClick={buildDiagram}>
          Générer le diagramme
        </button>
      </section>

      {/* Preview */}
      <section className="card">
        <div ref={mmRef} style={{ minHeight: 140 }}>
          {!mermaidSrc && <em>The diagram will render here…</em>}
        </div>
      </section>

      {!!mermaidSrc && (
        <details className="src">
          <summary>Show Mermaid source</summary>
          <pre>{mermaidSrc}</pre>
        </details>
      )}

      {/* Styles */}
      <style>{`
     /* ===== Consistent control sizing & alignment ===== */
        :root {
          --control-h: 40px;           /* single source of truth for height */
          --control-r: 10px;           /* same radius for all */
        }
        
        /* Grid row for steps */
        .row.dnd {
          display: grid;
          grid-template-columns: 40px 1fr 220px auto; /* handle | label | lane | delete */
          gap: 12px;
          align-items: center;          /* vertical centering */
          margin-bottom: 12px;
        }
        
        /* Inputs & selects: exact same height */
        input, select {
          height: var(--control-h);
          line-height: var(--control-h);
          padding: 0 12px;             /* vertical padding = 0 so height is exact */
          border-radius: var(--control-r);
          border: 1px solid var(--line);
          box-sizing: border-box;
          font-size: 14px;
        }
        
        /* Normalize select rendering across browsers */
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-color: #fff;
          background-image: linear-gradient(45deg, transparent 50%, #94a3b8 50%),
                            linear-gradient(135deg, #94a3b8 50%, transparent 50%);
          background-position: right 12px center, right 6px center;
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
          padding-right: 28px;         /* room for the arrow */
        }
        
        /* Buttons: same height */
        .btn {
          height: var(--control-h);
          line-height: var(--control-h);
          padding: 0 14px;
          border-radius: var(--control-r);
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Primary & ghost keep the same box model */
        .btn.primary { color: #fff; }
        .btn.ghost { background: transparent; }
        
        /* Drag handle: same height & width, perfectly centered */
        .grab {
          height: var(--control-h);
          width:  var(--control-h);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed var(--line);
          border-radius: var(--control-r);
          box-sizing: border-box;
          user-select: none;
          cursor: grab;
          color: var(--muted);
          font-size: 18px;             /* ≡ size */
        }
        
        /* Optional: subtle hover states to feel cohesive */
        input:hover, select:hover { border-color: #cbd5e1; }
        .grab:hover { background: #f8fafc; }
        
        /* When dragging */
        .row.dnd.dragging { opacity: 0.7; background: #f8fafc; border-radius: var(--control-r); }
        .row.dnd.over { outline: 2px dashed var(--pri); outline-offset: 2px; }

      `}</style>
    </div>
  );
}
