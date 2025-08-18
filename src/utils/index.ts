export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 8)}`;
export const esc = (x: string) =>
  (x ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, " ")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
