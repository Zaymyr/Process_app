export type Lane = { id: string; name: string };\nexport type Step = { id: string; label: string; laneId: string };
export type ProcessModel = {
  name: string;
  goal: string;
  trigger: string;
  lanes: Lane[];
  steps: Step[];
  metrics?: string[];
};
