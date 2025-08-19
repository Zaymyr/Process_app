import { uid } from "../utils";
import type { Lane, Step, ProcessModel } from "../types";

export type Ctx = { m: ProcessModel; answers: Record<string, any> };

export type Question =
  | {
      id: string;
      kind: "input";
      prompt: string;
      help?: string;
      validate?: (value: any, ctx: Ctx) => string | undefined;
      onAnswer?: (value: any, ctx: Ctx) => void;
      next: string | ((value: any, ctx: Ctx) => string);
    }
  | {
      id: string;
      kind: "multi";
      prompt: string;
      help?: string;
      validate?: (value: any, ctx: Ctx) => string | undefined;
      onAnswer?: (value: any, ctx: Ctx) => void;
      next: string | ((value: any, ctx: Ctx) => string);
    }
  | {
      id: string;
      kind: "table";
      prompt: string;
      help?: string;
      columns: string[];
      validate?: (value: any, ctx: Ctx) => string | undefined;
      onAnswer?: (value: any, ctx: Ctx) => void;
      next: string | ((value: any, ctx: Ctx) => string);
    }
  | {
      id: string;
      kind: "select";
      prompt: string;
      help?: string;
      options: string[];
      validate?: (value: any, ctx: Ctx) => string | undefined;
      onAnswer?: (value: any, ctx: Ctx) => void;
      next: string | ((value: any, ctx: Ctx) => string);
    };

export const questions: Question[] = [
  {
    id: "name",
    kind: "input",
    prompt: "Process name",
    help: "e.g., Customer Onboarding",
    validate: (v) => (String(v || "").trim() ? undefined : "Required"),
    onAnswer: (v, ctx) => {
      ctx.m.name = String(v || "").trim();
    },
    next: "goal",
  },
  {
    id: "goal",
    kind: "input",
    prompt: "What outcome should be guaranteed?",
    help: "e.g., Account activated",
    validate: (v) => (String(v || "").trim() ? undefined : "Required"),
    onAnswer: (v, ctx) => {
      ctx.m.goal = String(v || "").trim();
    },
    next: "trigger",
  },
  {
    id: "trigger",
    kind: "input",
    prompt: "What starts the process?",
    help: "e.g., Signed contract received",
    validate: (v) => (String(v || "").trim() ? undefined : "Required"),
    onAnswer: (v, ctx) => {
      ctx.m.trigger = String(v || "").trim();
    },
    next: "lanes",
  },
  {
    id: "lanes",
    kind: "multi",
    prompt: "Who is involved? (teams/roles → lanes)",
    help: "Add 1–6 lanes",
    validate: (arr) =>
      Array.isArray(arr) && arr.length > 0 ? undefined : "Add at least one lane",
    onAnswer: (arr, ctx) => {
      const names = (Array.isArray(arr) ? arr : []).map((x) => String(x || "").trim()).filter(Boolean);
      ctx.m.lanes = names.map((n) => ({ id: uid("lane"), name: n } as Lane));
    },
    next: "happy",
  },
  {
    id: "happy",
    kind: "table",
    prompt: "Happy path — actions to reach the goal (verb‑first)",
    help: "Add actions and map each to a lane.",
    columns: ["Action", "Lane"],
    validate: (rows, ctx) => {
      const list = Array.isArray(rows) ? rows : [];
      if (list.length === 0) return "Add at least one step";
      const laneNames = new Set((ctx.m.lanes || []).map((l) => l.name));
      for (const r of list) {
        const action = String(r?.Action || "").trim();
        const lane = String(r?.Lane || "");
        if (!action) return "Each step needs an Action label";
        if (!laneNames.has(lane)) return "Each step must be mapped to an existing lane";
      }
      return undefined;
    },
    onAnswer: (rows, ctx) => {
      if (!ctx.m.lanes?.length) {
        ctx.m.lanes = [{ id: uid("lane"), name: "General" }];
      }
      const byName = new Map(ctx.m.lanes.map((l) => [l.name, l.id]));
      const fallbackLaneId = ctx.m.lanes[0].id;
      const list = Array.isArray(rows) ? rows : [];
      ctx.m.steps = list.map((r) => {
        const laneName = String(r?.Lane || "");
        const laneId = byName.get(laneName) || fallbackLaneId;
        return {
          id: uid("step"),
          label: String(r?.Action || "").trim(),
          laneId,
        } as Step;
      });
    },
    next: "metrics",
  },
  {
    id: "metrics",
    kind: "multi",
    prompt: "What will you measure? (optional)",
    help: "e.g., Lead time, First‑pass yield",
    onAnswer: (arr, ctx) => {
      ctx.m.metrics = Array.isArray(arr) ? arr : [];
    },
    next: "review",
  },
  {
    id: "review",
    kind: "select",
    prompt: "Ready to generate and fine‑tune?",
    help: "You can still edit after",
    options: ["Yes — continue", "No — restart"],
    next: (v) => (String(v).startsWith("Yes") ? "generate" : "name"),
  },
];
