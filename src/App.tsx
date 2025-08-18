import "./App.css";
import React, { useState } from "react";
import { MetaForm } from "./components/MetaForm";
import { LaneList } from "./components/LaneList";
import { StepList } from "./components/StepList";
import { MermaidDiagram } from "./components/MermaidDiagram";
import { Lane, Step } from "./types";
import { uid, esc } from "./utils";

export default function App() {
  // Meta information
  const [processName, setProcessName] = useState("");
  const [goal, setGoal] = useState("");
  const [trigger, setTrigger] = useState("");

  const [lanes, setLanes] = useState<Lane[]>([]);
  const [newLaneName, setNewLaneName] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [mermaidSrc, setMermaidSrc] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);

  // Lane Handlers
  const addLane = () => {
    if (newLaneName.trim()) {
      setLanes((prev) => [...prev, { id: uid("lane"), name: newLaneName.trim() }]);
      setNewLaneName("");
    }
  };

  // ⬅️ FIX: also remove steps belonging to that lane
  const removeLane = (id: string) => {
    setLanes((prev) => prev.filter((l) => l.id !== id));
    setSteps((prev) => prev.filter((s) => s.laneId !== id));
  };

  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  // Step Handlers
  const addStep = () => {
    if (lanes.length) {
      setSteps((prev) => [...prev, { id: uid("step"), label: "", laneId: lanes[0].id }]);
    }
  };

  const updateStep = (i: number, patch: Partial<Step>) => {
    setSteps((ss) => ss.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  // Drag & drop logic for steps
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const handleDragStart = (i: number) => () => setDragIndex(i);
  const handleDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverIndex(i);
  };
  const handleDrop = (i: number) => () => {
    if (dragIndex !== null && dragIndex !== i) {
      const updated = [...steps];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(i, 0, removed);
      setSteps(updated);
    }
    setDragIndex(null);
    setOverIndex(null);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  // Generate diagram
  const generateDiagram = () => {
    const newTouched = { ...touched };
    const errs: string[] = [];

    if (!processName) {
      newTouched.processName = true;
      errs.push("Process name is required.");
    }
    if (!goal) {
      newTouched.goal = true;
      errs.push("Goal is required.");
    }
    if (!trigger) {
      newTouched.trigger = true;
      errs.push("Trigger is required.");
    }
    if (lanes.length === 0) {
      newTouched.lanes = true;
      errs.push("Add at least one lane.");
    }
    if (steps.length === 0) {
      errs.push("Add at least one step.");
    }

    // ⬅️ FIX: ensure steps are valid (label + existing lane)
    const laneIds = new Set(lanes.map((l) => l.id));
    const emptyLabels = steps.filter((s) => !s.label?.trim()).length;
    const badLaneRefs = steps.filter((s) => !laneIds.has(s.laneId)).length;
    if (emptyLabels > 0) errs.push("All steps need a non-empty label.");
    if (badLaneRefs > 0) errs.push("Some steps reference a removed lane.");

    setTouched(newTouched);

    if (errs.length) {
      setErrors(errs);
      setIsGenerated(false);
      setMermaidSrc("");
      return;
    }

    setErrors([]);

    // ✅ Build valid Mermaid with lanes as subgraphs
    // We’ll:
    // 1) Create subgraph per lane
    // 2) Put each step as a node inside its lane:   stepId["Label"]
    // 3) Link steps in their current order:         prevId --> currId
    const stepsByLane = new Map<string, Step[]>();
    lanes.forEach((l) => stepsByLane.set(l.id, []));
    steps.forEach((s) => stepsByLane.get(s.laneId)?.push(s));

    const lines: string[] = [];
    lines.push("flowchart TD"); // you can switch to LR if you prefer

    // Optional: title as comment
    lines.push(`%% ${esc(processName)} | Goal: ${esc(goal)} | Trigger: ${esc(trigger)}`);

    // 1) Subgraphs / lanes
    for (const lane of lanes) {
      lines.push(`subgraph ${lane.id}["${esc(lane.name)}"]`);
      const laneSteps = stepsByLane.get(lane.id) ?? [];
      for (const s of laneSteps) {
        lines.push(`${s.id}["${esc(s.label)}"]`);
      }
      lines.push("end");
    }

    // 2) Connect steps in current list order (global flow)
    // If you prefer per-lane flow only, change to link within each laneSteps instead.
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const curr = steps[i];
      lines.push(`${prev.id} --> ${curr.id}`);
    }

    setMermaidSrc(lines.join("\n"));
    setIsGenerated(true);
  };

  return (
    <div className="wrap">
      <header className="header">
        <h1>Process Designer</h1>
        <p>Create beautiful process diagrams with swimlanes</p>
      </header>

      <MetaForm
        processName={processName}
        setProcessName={setProcessName}
        goal={goal}
        setGoal={setGoal}
        trigger={trigger}
        setTrigger={setTrigger}
        touched={touched}
        markTouched={markTouched}
      />

      <LaneList
        lanes={lanes}
        newLaneName={newLaneName}
        setNewLaneName={setNewLaneName}
        touched={touched}
        markTouched={markTouched}
        addLane={addLane}
        removeLane={removeLane}
      />

      <StepList
        steps={steps}
        lanes={lanes}
        touched={touched}
        markTouched={markTouched}
        updateStep={updateStep}
        setSteps={setSteps}
        addStep={addStep}
        dragIndex={dragIndex}
        overIndex={overIndex}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        handleDragEnd={handleDragEnd}
      />

      <section className="card generate-section">
        <button
          className="btn generate-btn"
          onClick={generateDiagram}
          disabled={
            !processName ||
            !goal ||
            !trigger ||
            lanes.length === 0 ||
            steps.length === 0 ||
            steps.some((s) => !s.label.trim())
          }
        >
          Generate Process Diagram
        </button>
      </section>

      {isGenerated && <MermaidDiagram mermaidSrc={mermaidSrc} setErrors={setErrors} />}

      {errors.length > 0 && (
        <div className="error-list">
          {errors.map((err, i) => (
            <div key={i} className="error">
              {err}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
