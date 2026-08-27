import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneState } from '../js/scroll-model.js';

test('sceneState maps start progress to abundant compute', () => {
  assert.deepEqual(sceneState(0), { stage:0, label:'AVAILABLE', utilization:96, bandwidth:100 });
});

test('sceneState maps congestion progress to lower bandwidth before utilization bottoms out', () => {
  const state = sceneState(0.7);
  assert.equal(state.stage, 3);
  assert.equal(state.label, 'CONGESTED');
  assert.ok(state.bandwidth < state.utilization);
});

test('sceneState clamps end progress and represents waiting workers', () => {
  const state = sceneState(4);
  assert.equal(state.stage, 4);
  assert.equal(state.label, 'WAITING');
  assert.equal(state.utilization, 34);
});
