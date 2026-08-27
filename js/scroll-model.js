import { clamp01, focusStage } from './utils.js';

const STATES = [
  { label:'AVAILABLE', utilization:96, bandwidth:100 },
  { label:'CONNECTING', utilization:92, bandwidth:88 },
  { label:'COMMUNICATING', utilization:82, bandwidth:74 },
  { label:'CONGESTED', utilization:58, bandwidth:34 },
  { label:'WAITING', utilization:34, bandwidth:22 }
];

export function sceneState(progress) {
  const p = clamp01(progress);
  const stage = focusStage(p);
  return { stage, ...STATES[stage] };
}
