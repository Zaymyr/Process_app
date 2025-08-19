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
