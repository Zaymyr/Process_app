import React from 'react';
import { Lane, Step } from '../types';

type Props = {
  steps: Step[];
  lanes: Lane[];
  touched: Record<string, boolean>;
  markTouched: (k: string) => void;
  updateStep: (i: number, patch: Partial<Step>) => void;
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>;
  addStep: () => void;
  dragIndex: number | null;
  overIndex: number | null;
  handleDragStart: (i: number) => () => void;
  handleDragOver: (i: number) => (e: React.DragEvent) => void;
  handleDrop: (i: number) => (e: React.DragEvent) => void;
  handleDragEnd: () => void;
};

export function StepList({
  steps, lanes, touched, markTouched, updateStep, setSteps, addStep,
  dragIndex, overIndex, handleDragStart, handleDragOver, handleDrop, handleDragEnd
}: Props) {
  return (
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
            <span className="grab" title="Drag to reorder" aria-label="Drag to reorder" role="button" tabIndex={0}>≡</span>
            <div className={labelErr ? "field error" : "field"}>
              <label className="required">Label</label>
              <input
                className="ctl"
                value={s.label}
                onChange={e => updateStep(i, { label: e.target.value })}
                onBlur={() => markTouched(`step_label_${i}`)}
                placeholder={`Step ${i + 1}`}
              />
            </div>
            <div className={laneErr ? "field error" : "field"}>
              <label className="required">Lane</label>
              <select
                className="ctl"
                value={s.laneId}
                onChange={e => updateStep(i, { laneId: e.target.value })}
                onBlur={() => markTouched(`step_lane_${i}`)}
              >
                <option value="">— Select a lane —</option>
                {lanes.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <button className="btn ghost danger" onClick={() => setSteps(ss => ss.filter(x => x.id !== s.id))}>Remove</button>
          </div>
        );
      })}
      <button className="btn" onClick={addStep} disabled={!lanes.length} title={!lanes.length ? "Add a lane first" : ""}>
        + Add step
      </button>
    </section>
  );
}
