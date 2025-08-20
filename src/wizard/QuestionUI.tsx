import React, { useState } from "react";
import type { Question } from "./questions";

type QuestionUIProps = {
  q: Question;
  onNext: (value: any) => void;
  lanes: string[];
  error?: string;
};

export function QuestionUI({ q, onNext, lanes, error }: QuestionUIProps) {
  const [value, setValue] = useState<any>("");
  const [multiValues, setMultiValues] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<Record<string, string>[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (q.kind === "input") {
      onNext(value);
    } else if (q.kind === "multi") {
      onNext(multiValues);
    } else if (q.kind === "table") {
      onNext(tableRows);
    } else if (q.kind === "select") {
      onNext(value);
    }
  };

  const addMultiValue = () => {
    const input = document.querySelector(`#multi-input-${q.id}`) as HTMLInputElement;
    if (input && input.value.trim()) {
      setMultiValues(prev => [...prev, input.value.trim()]);
      input.value = "";
    }
  };

  const removeMultiValue = (index: number) => {
    setMultiValues(prev => prev.filter((_, i) => i !== index));
  };

  const addTableRow = () => {
    if (q.kind === "table") {
      const newRow: Record<string, string> = {};
      q.columns.forEach(col => {
        newRow[col] = "";
      });
      setTableRows(prev => [...prev, newRow]);
    }
  };

  const updateTableRow = (rowIndex: number, column: string, value: string) => {
    setTableRows(prev => 
      prev.map((row, i) => 
        i === rowIndex ? { ...row, [column]: value } : row
      )
    );
  };

  const removeTableRow = (index: number) => {
    setTableRows(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "1.1em", fontWeight: 600 }}>
        {q.prompt}
      </h4>

      {q.kind === "input" && (
        <div className="field">
          <input
            className="ctl"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={q.help || "Enter your answer..."}
            autoFocus
          />
        </div>
      )}

      {q.kind === "select" && (
        <div className="field">
          <select
            className="ctl"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
          >
            <option value="">-- Select an option --</option>
            {q.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {q.kind === "multi" && (
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <input
              id={`multi-input-${q.id}`}
              className="ctl"
              placeholder="Add item..."
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMultiValue();
                }
              }}
              autoFocus
            />
            <button type="button" className="btn primary" onClick={addMultiValue}>
              Add
            </button>
          </div>
          {multiValues.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {multiValues.map((item, i) => (
                <div key={i} className="chip" style={{ margin: "4px 8px 4px 0" }}>
                  {item}
                  <button type="button" onClick={() => removeMultiValue(i)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {q.kind === "table" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <button type="button" className="btn primary" onClick={addTableRow}>
              Add Row
            </button>
          </div>
          {tableRows.length > 0 && (
            <div className="table">
              <div className="thead">
                {q.columns.map(col => (
                  <div key={col} style={{ fontWeight: 600 }}>{col}</div>
                ))}
                <div></div>
              </div>
              {tableRows.map((row, i) => (
                <div key={i} className="trow">
                  {q.columns.map(col => (
                    <input
                      key={col}
                      className="ctl"
                      value={row[col] || ""}
                      onChange={e => updateTableRow(i, col, e.target.value)}
                      placeholder={col === "Lane" ? "Select lane..." : `Enter ${col.toLowerCase()}...`}
                      list={col === "Lane" ? `lanes-${q.id}` : undefined}
                    />
                  ))}
                  <button 
                    type="button" 
                    className="btn ghost danger" 
                    onClick={() => removeTableRow(i)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {q.columns.includes("Lane") && (
                <datalist id={`lanes-${q.id}`}>
                  {lanes.map(lane => (
                    <option key={lane} value={lane} />
                  ))}
                </datalist>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: "#dc2626", fontSize: "0.9em", marginTop: 8 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button type="submit" className="btn primary">
          Next
        </button>
      </div>
    </form>
  );
}