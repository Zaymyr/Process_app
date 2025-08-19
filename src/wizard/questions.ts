import { uid } from "../utils";
import type { ProcessModel, Lane, Step } from "../types";

export type Ctx = { m: ProcessModel; answers: Record<string, any> };
// type
export type Question = {
  id: string;
  kind: "input" | "multi" | "table" | "select";
  prompt: string;
  help?: string;
  options?: string[];
  columns?: string[];
  validate?: (value: any, ctx: Ctx) => string | undefined; // <-- ctx added
  onAnswer?: (value: any, ctx: Ctx) => void;
  next: string | ((value: any, ctx: Ctx) => string);
};


export const questions: Question[] = [
  { id: "name", kind: "input",
    prompt: "Process name",
    help: "e.g., Customer Onboarding",
    validate: v => v?.trim() ? undefined : "Required",
    onAnswer: (v, ctx) => ctx.m.name = v.trim(),
    next: "goal"
  },
  { id: "goal", kind: "input",
    prompt: "What outcome should be guaranteed?",
    help: "e.g., Account activated",
    validate: v => v?.trim() ? undefined : "Required",
    onAnswer: (v, ctx) => ctx.m.goal = v.trim(),
    next: "trigger"
  },
  { id: "trigger", kind: "input",
    prompt: "What starts the process?",
    help: "e.g., Signed contract received",
    validate: v => v?.trim() ? undefined : "Required",
    onAnswer: (v, ctx) => ctx.m.trigger = v.trim(),
    next: "lanes"
  },
  { id: "lanes", kind: "multi",
    prompt: "Who is involved? (teams/roles → lanes)",
    help: "Add 1–6 lanes",
    validate: (arr:string[]) => (arr?.length ? undefined : "Add at least one lane"),
    onAnswer: (arr:string[], ctx) => {
      ctx.m.lanes = (arr || []).map(n => ({ id: uid("lane"), name: String(n).trim() } as Lane));
    },
    next: "happy"
  },
  { id: "happy", kind: "table",
    prompt: "Happy path — actions to reach the goal (verb‑first)",
    help: "Add 5–9 actions. Map each action to a lane.",
    columns: ["Action", "Lane"],
    validate: (rows: any[], ctx: Ctx) => {
  if (!rows?.length) return "Add at least one step";
  const laneNames = new Set((ctx.m.lanes || []).map(l => l.name));
  for (const r of rows) {
    if (!String(r?.Action || "").trim()) return "Each step needs an Action label";
    if (!laneNames.has(String(r?.Lane || ""))) return "Each step must be mapped to an existing lane";
  }
  return undefined;


},
    onAnswer: (rows: any[], ctx) => {
        // No lanes? Create a default one to avoid crashes.
        if (!ctx.m.lanes?.length) {
          ctx.m.lanes = [{ id: uid("lane"), name: "General" }];
        }
        const byName = new Map(ctx.m.lanes.map((l: any) => [l.name, l.id]));
        const fallbackLaneId = ctx.m.lanes[0].id;
      
        ctx.m.steps = (rows || []).map((r: any) => {
          const name = String(r?.Lane || "");
          const laneId = byName.get(name) || fallbackLaneId; // robust fallback
          return {
            id: uid("step"),
            label: String(r?.Action || "").trim(),
            laneId,
          };
        });
    },
    next: "metrics"
  },
  { id: "metrics", kind: "multi",
    prompt: "What will you measure? (optional)",
    help: "e.g., Lead time, First-pass yield",
    onAnswer: (arr, ctx) => (ctx.m.metrics = arr || []),
    next: "review"
  },
  { id: "review", kind: "select",
    prompt: "Ready to generate and fine‑tune?",
    options: ["Yes — continue", "No — restart"],
    next: (v) => v.startsWith("Yes") ? "generate" : "name"
  }
];
