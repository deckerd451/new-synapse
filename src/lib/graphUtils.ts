// src/lib/graphUtils.ts
export type CameraState = { x: number; y: number; k: number };

const CAM_KEY = "synapse_cam_v1";
const POS_KEY = "synapse_pos_v1"; // stores { [nodeId]: {x,y} }

export function parseSkills(skills: unknown): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map(s => String(s).trim()).filter(Boolean);
  if (typeof skills === "string") {
    // normalize things like "{python, js}" or "python, js"
    const clean = skills.replace(/[{}]/g, "");
    return clean.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

const PALETTE = [
  "#7DF9FF", // electric cyan
  "#FFD700", // gold
  "#ADFF2F", // lime
  "#B388FF", // violet
  "#FFA500", // orange
  "#00E5FF"  // bright azure
];

export function colorForGroup(group: string): string {
  if (!group) return "#9CA3AF"; // gray
  const hash = [...group].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

/** Camera persistence */
export function saveCamera(cam: CameraState) {
  localStorage.setItem(CAM_KEY, JSON.stringify(cam));
}
export function loadCamera(): CameraState | null {
  const raw = localStorage.getItem(CAM_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Node position persistence */
export function savePositions(pos: Record<string, { x: number; y: number }>) {
  localStorage.setItem(POS_KEY, JSON.stringify(pos));
}
export function loadPositions(): Record<string, { x: number; y: number }> {
  const raw = localStorage.getItem(POS_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
