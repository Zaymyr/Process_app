import { uid } from "../utils";
import type { ProcessModel, Lane, Step } from "../types";

export type Ctx = { m: ProcessModel; answers: Record<string, any> };
export type Question =
  | { id: string; kind: "input";  prompt: string; help?: string; validate?: (v:any)=>string|undefined; onAnswer?: (v:any,ctx:Ctx)=>void; next: string }
  | { id: string; kind: "multi";  prompt: string; help?: string; validate?: (v:any)=>string|undefined; onAnswer?: (v:any,ctx:Ctx)=>void; next: string }
  | { id: string; kind: "table";  prompt: string; help?: string; columns: string[]; validate?: (v:any)=>string|undefined; onAnswer?: (v:any,ctx:Ctx)=>void; next: string }
  | { id: string; kind: "select"; prompt: string; help?: string; options: string[]; next: (v:any)=>string };

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
    validate: (rows:any[]) => rows?.length ? undefined : "Add at least one step",
    onAnswer: (rows:any[], ctx) => {
      const byName = new Map(ctx.m.lanes.map(l => [l.name, l.id]));
      ctx.m.steps = (rows || []).map(r => ({
        id: uid("step"),
        label: String(r["Action"] || "").trim(),
        laneId: byName.get(String(r["Lane"])) || ctx.m.lanes[0].id
      } as Step));
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
