import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_SIZE_CHARTS } from '../demo/demoData';

function calculateRecommendedSize(categoryId: string, h: number, w: number, fit: 'slim' | 'regular' | 'loose'): string {
  const charts = DEMO_SIZE_CHARTS.filter((s) => s.category_id === categoryId);
  const activeCharts = charts.length > 0 ? charts : DEMO_SIZE_CHARTS.slice(0, 5);

  let matched = activeCharts.find(
    (c) =>
      c.height_min_cm &&
      c.height_max_cm &&
      h >= c.height_min_cm &&
      h <= c.height_max_cm &&
      c.weight_min_kg &&
      c.weight_max_kg &&
      w >= c.weight_min_kg &&
      w <= c.weight_max_kg
  );

  let chosenSize = matched ? matched.size_label : 'M';
  if (fit === 'loose' && chosenSize === 'M') {
    chosenSize = 'L';
  } else if (fit === 'loose' && chosenSize === 'L') {
    chosenSize = 'XL';
  } else if (fit === 'slim' && chosenSize === 'L' && w < 75) {
    chosenSize = 'M';
  }
  return chosenSize;
}

test('calculateRecommendedSize returns accurate sizing', () => {
  // Height 165cm, weight 60kg for Shalwar Kameez -> S
  assert.equal(calculateRecommendedSize('cat-1', 165, 60, 'regular'), 'S');
  // Height 170cm, weight 70kg -> M
  assert.equal(calculateRecommendedSize('cat-1', 170, 70, 'regular'), 'M');
  // Loose fit preference shifts M to L
  assert.equal(calculateRecommendedSize('cat-1', 170, 70, 'loose'), 'L');
});
