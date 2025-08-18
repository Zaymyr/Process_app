import React from 'react';
import { Lane } from '../types';

type Props = {
  lanes: Lane[];
  newLaneName: string;
  setNewLaneName: (v: string) => void;
  touched: Record<string, boolean>;
  markTouched: (key: string) => void;
  addLane: () => void;
  removeLane: (id: string) => void;
};

export function LaneList({
  lanes, newLaneName, setNewLaneName, touched, markTouched, addLane, removeLane
}: Props) {
  return (
    <section className="card">
      <div className="sec-hdr">
        <h3>Swimlanes</h3>
        <span className="hint">Group steps by responsibilities (HR, IT, Finance…)</span>
      </div>
      <div className="lane-add">
        <div className={!lanes.length && touched.lanes ? "field error" : "field"}>
          <label className="required">Lane name</label>
          <input
            className="ctl"
            value={newLaneName}
            onChange={e => setNewLaneName(e.target.value)}
            onBlur={() => markTouched("lanes")}
            placeholder="e.g., Sales"
          />
        </div>
        <button className="btn" onClick={addLane}>Add lane</button>
      </div>
      {lanes.length > 0 && (
        <ul className="lanes">
          {lanes.map(l => (
            <li key={l.id}>
              <span className="pill">{l.name}</span>
              <button className="btn ghost" onClick={() => removeLane(l.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
