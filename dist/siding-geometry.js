import * as THREE from 'three';

// Normalized clapboard: the lower edge projects farther than the upper edge.
// Instances scale this cross-section to a single lap siding course.
export function createLapBoardGeometry() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setZ(i, p.getZ(i) > 0 ? .55 - p.getY(i) * .50 : -.3);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function clipPolygon(polygon, signedDistance) {
  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = signedDistance(a), db = signedDistance(b);
    if (da >= 0) result.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return result;
}

// Straight-edge shingle courses with varied widths and staggered vertical joints.
// Edge shingles are clipped to the actual gable slopes instead of protruding
// through the rake trim. All shingles on one gable share a single mesh.
export function createGableShingles(width, rise) {
  const vertices = [];
  const course = .215, joint = .013, widths = [.19, .24, .165, .22, .18, .255];
  const half = width / 2, slope = half / rise;
  let shingleCount = 0;
  const triangle = (a, b, c) => vertices.push(...a, ...b, ...c);
  for (let row = 0, y = 0; y < rise; row++, y += course) {
    let x = -half - (row % 3) * .091;
    let column = 0;
    while (x < half) {
      const tileWidth = widths[(column + row * 2) % widths.length];
      let polygon = [[x + joint / 2, y + .012], [x + tileWidth - joint / 2, y + .012],
        [x + tileWidth - joint / 2, Math.min(rise, y + course)], [x + joint / 2, Math.min(rise, y + course)]];
      polygon = clipPolygon(polygon, p => p[0] - slope * p[1] + half);
      polygon = clipPolygon(polygon, p => half - slope * p[1] - p[0]);
      if (polygon.length >= 3) {
        const front = polygon.map(([px, py]) => [px, py, .080 + .037 * (1 - (py - y) / course)]);
        const back = polygon.map(([px, py]) => [px, py, .066]);
        for (let i = 1; i < front.length - 1; i++) triangle(front[0], front[i], front[i + 1]);
        for (let i = 0; i < front.length; i++) {
          const next = (i + 1) % front.length;
          triangle(front[i], back[i], back[next]);
          triangle(front[i], back[next], front[next]);
        }
        shingleCount++;
      }
      x += tileWidth;column++;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.userData.shingleCount = shingleCount;
  return geometry;
}
