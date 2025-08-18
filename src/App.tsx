import React, { useState } from "react";
import { LaneList } from "./components/LaneList";
import { StepList } from "./components/StepList";
import { MermaidDiagram } from "./components/MermaidDiagram";
import { Lane, Step } from "./types";
import { uid, esc } from "./utils";
import './App.css';

export default function App() {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [newLaneName, setNewLaneName] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [mermaidSrc, setMermaidSrc] = useState("");

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
      setSteps([...steps, { id: uid("step"), label: "", laneId: "" }]);
  };
  const updateStep = (i: number, patch: Partial<Step>) => {
    setSteps((ss) =>
      ss.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    );
  };

  // Drag & drop logic for steps (implement as needed)
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

  // Mermaid diagram generation (implement your logic as needed)
  React.useEffect(() => {
    // Example: Build a mermaid diagram string from steps and lanes
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
  }, [lanes, steps]);

  return (
    <div>
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

      <MermaidDiagram mermaidSrc={mermaidSrc} setErrors={setErrors} />

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
