import './App.css';
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
      setLanes([...lanes, { id: uid("lane"), name: newLaneName }]);
      setNewLaneName("");
    }
  };
  const removeLane = (id: string) => setLanes(lanes.filter((l) => l.id !== id));
  const markTouched = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  // Step Handlers
  const addStep = () => {
    if (lanes.length)
      setSteps([...steps, { id: uid("step"), label: "", laneId: lanes[0].id }]);
  };
  const updateStep = (i: number, patch: Partial<Step>) => {
    setSteps((ss) =>
      ss.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    );
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
    // Validate required fields
    const newTouched = { ...touched };
    let hasErrors = false;

    if (!processName) {
      newTouched.processName = true;
      hasErrors = true;
    }
    if (!goal) {
      newTouched.goal = true;
      hasErrors = true;
    }
    if (!trigger) {
      newTouched.trigger = true;
      hasErrors = true;
    }
    if (lanes.length === 0) {
      newTouched.lanes = true;
      hasErrors = true;
    }
    if (steps.length === 0) {
      hasErrors = true;
    }

    setTouched(newTouched);

    if (hasErrors) {
      setErrors(["Please fill in all required fields and add at least one lane and one step."]);
      return;
    }

    setErrors([]);

    if (lanes.length && steps.length) {
      const rows = steps.map(
        (step) =>
          `${esc(lanes.find((l) => l.id === step.laneId)?.name || "")}: ${esc(
            step.label
          )}`
      );
      setMermaidSrc(`graph TD\n${rows.join("\n")}`);
    } else {
      setMermaidSrc("");
    }
    
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
          disabled={!processName || !goal || !trigger || lanes.length === 0 || steps.length === 0}
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
