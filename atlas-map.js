import {places, arrivalHeading} from './landmarks.js';

const labelPositions = [
  {labelX:-22, labelY:33, align:'end'},
  {labelX:20, labelY:-12, align:'start'},
  {labelX:21, labelY:16, align:'start'}
];
// The same affine projection is used for the street plan, the stops, and the walker.
const projection = [3.3, 0.85, -0.86, 2.5, 300, 200];
function project(x, z) {
  return [projection[0] * x + projection[2] * z + projection[4],
          projection[1] * x + projection[3] * z + projection[5]];
}
const shoreX = z => 30 + Math.sin(z * 0.046) * 2.2 + Math.cos(z * 0.084) * 1.1;
const rounded = value => Number(value.toFixed(2));
const line = points => 'M' + points.map(([x, y]) => rounded(x) + ',' + rounded(y)).join(' L');
let mapCount = 0;

function makeTerrain(id) {
  let seed = 6209;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const coast = [];
  for (let z = -200; z <= 180; z += 2.5) coast.push([shoreX(z), z]);
  const coastline = line(coast);
  const mask = coastline + ' L-220,180 L-220,-200 Z';
  const contours = [];
  for (let i = 1; i < 16; i++) {
    const profile = coast.map(([x, z]) => [
      x + i * 3.25 + Math.sin(z * 0.052 + i * 0.42) * (0.4 + i * 0.17)
        + Math.cos(z * 0.14 + i * 0.2) * i * 0.06, z
    ]);
    contours.push(line(profile));
  }

  const streetsX = [-158, -131, -108, -85, -61, -42, -24, -6, 23];
  const streetsZ = [-145, -120, -99, -76, -55, -33, -12, 4, 26, 49, 75, 98, 128];
  const gridX = (x, z) => x === -6 ? x : x + Math.sin(z * 0.047 + x * 0.086) * 1.9;
  const gridZ = (x, z) => z + Math.sin(x * 0.051 + z * 0.04) * (z === 4 ? 0.4 : 1.9);
  const roads = [];
  const paths = [];
  const sample = (start, end, step, fn) => {
    const points = [];
    for (let n = start; n <= end; n += step) points.push(fn(n));
    return line(points);
  };
  for (const x of streetsX) roads.push(sample(-145, 128, 3, z => [gridX(x, z), z]));
  for (const z of streetsZ) roads.push(sample(-160, 24, 3, x => [x, gridZ(x, z)]));
  paths.push(sample(-145, 128, 2, z => [shoreX(z) - 2.7, z]));

  const buildings = [];
  const gardens = [];
  const treetops = [];
  for (let i = 1; i < streetsX.length; i++) {
    for (let j = 1; j < streetsZ.length; j++) {
      const left = streetsX[i - 1] + 3.6, top = streetsZ[j - 1] + 3.4;
      const width = streetsX[i] - left - 3.5, depth = streetsZ[j] - top - 3.1;
      gardens.push(`M${rounded(left)},${rounded(top)}l${rounded(width)},-0.3 0.5,${rounded(depth)} -${rounded(width + 0.2)},0.3Z`);
      const count = random() > 0.2 ? 3 : 1;
      for (let n = 0; n < count; n++) {
        const w = 2.3 + random() * 3.1, h = 3 + random() * 3.6;
        const x = left + 0.8 + (width - w - 1.5) * random();
        const z = top + 0.6 + (depth - h - 1) * random();
        buildings.push(`M${rounded(x)},${rounded(z)}l${rounded(w)},0.2 -0.15,${rounded(h)} -${rounded(w)},-0.25Z`);
      }
      for (let n = 0; n < 8; n++) {
        const x = rounded(left + width * random()), z = rounded(top + depth * random());
        treetops.push(`M${x},${z}l0.3,0.14`);
      }
    }
  }
  // Small irregular dashes retain the grain of a printed chart at thumbnail scale.
  const texture = [];
  for (let i = 0; i < 1800; i++) {
    texture.push(`M${rounded(random() * 600)},${rounded(random() * 350)}l${rounded(0.75 + random() * 1.5)},0.15`);
  }
  const roadLines = roads.join(' ');
  return `
    <defs><clipPath id="${id}-land"><path d="${mask}"/></clipPath></defs>
    <rect width="600" height="350" fill="#29322e"/>
    <g transform="matrix(${projection.join(' ')})" stroke-linejoin="round">
      <path d="${contours.join(' ')}" fill="none" stroke="#768174" stroke-width="0.36" opacity=".46"/>
      <path d="${mask}" fill="#363b31"/>
      <g clip-path="url(#${id}-land)">
        <path d="${gardens.join(' ')}" fill="#3e4337" stroke="#5c604e" stroke-width=".37"/>
        <path d="${treetops.join(' ')}" fill="none" stroke="#69725c" stroke-linecap="round" stroke-width="1.14" opacity=".57"/>
        <path d="${buildings.join(' ')}" fill="#535348" stroke="#686755" stroke-width=".3"/>
        <path d="${roadLines}" stroke="#72705b" stroke-width="2.25" fill="none"/>
        <path d="${roadLines}" stroke="#424438" stroke-width="1.28" fill="none"/>
        <path d="${paths.join(' ')}" stroke="#92927a" stroke-width=".55" fill="none"/>
        <path d="M3.8,-30h14.4v9.9H15a2.7,2.7 0 0 1 -5.4,0H7.1a1.8,1.8 0 0 1 -3.6,0Z" fill="#827a60" stroke="#aaa083" stroke-width=".35"/>
        <path d="M-6,-29V4Q-6,5 -4,5L0,7 M-6,4Q1,3 9,4T22,4Q24,4 28,0" fill="none" stroke="#d9b779" stroke-width=".85" stroke-dasharray="1.4 1.1" opacity=".85"/>
      </g>
      <path d="${coastline}" stroke="#9b9d83" stroke-width=".83" fill="none"/>
    </g>
    <path d="${texture.join(' ')}" stroke="#d3ceb8" stroke-opacity=".095" fill="none"/>`;
}

export function createAtlasMap(container, { onSelect, interactive = false } = {}) {
  const id = 'badaguan-atlas-' + ++mapCount;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 600 350');
  svg.setAttribute('preserveAspectRatio', interactive ? 'xMidYMid meet' : 'xMidYMid slice');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('role', interactive ? 'group' : 'img');
  svg.setAttribute('aria-label', '八大關景點導覽圖');
  svg.style.display = 'block';
  svg.style.background = '#29322e';
  const stops = places.map((stop, index) => {
    const [px, py] = project(stop.x, stop.z);
    const name = interactive
      ? `<text x="${labelPositions[index].labelX}" y="${labelPositions[index].labelY}" text-anchor="${labelPositions[index].align}" class="atlas-name">${stop.name}</text>`
      : '';
    const access = interactive
      ? `tabindex="0" role="button" aria-label="前往${stop.name}" aria-pressed="false"`
      : 'aria-hidden="true"';
    return `<g data-stop="${index}" transform="translate(${px} ${py})" ${access}>
      <circle r="21" fill="transparent"/>
      <circle class="atlas-halo" r="16.5"/>
      <circle class="atlas-pin" r="10.8"/>
      <text class="atlas-number" y="4.7" text-anchor="middle">${index + 1}</text>${name}
    </g>`;
  }).join('');
  svg.innerHTML = `
    <style>
      #${id} .atlas-halo {fill:none;stroke:#eec886;stroke-width:1.4;opacity:0}
      #${id} .atlas-pin {fill:#353a31;stroke:#d9cca8;stroke-width:2.4}
      #${id} .atlas-number {font:600 15px ui-monospace,monospace;fill:#ece5d0}
      #${id} .atlas-name {font:500 14px system-ui,sans-serif;fill:#eae5d3;paint-order:stroke;stroke:#33392f;stroke-width:4;stroke-linejoin:round;letter-spacing:1px}
      #${id} .selected .atlas-halo {opacity:.72}
      #${id} .selected .atlas-pin {fill:#edc783;stroke:#f5d499}
      #${id} .selected .atlas-number {fill:#302c21}
      #${id} [role="button"] {cursor:pointer;outline:none;pointer-events:bounding-box}
      #${id} [role="button"]:is(:hover,:focus-visible) .atlas-halo {opacity:1;stroke:#fff0cd;stroke-width:2.5}
    </style>
    ${makeTerrain(id)}
    <g data-walker aria-hidden="true">
      <path d="M0,0 L-14,-29 Q0,-35 14,-29 Z" fill="#edc783" opacity=".37"/>
      <path d="M-4,-21 0,-29 4,-21Z" fill="#f5d499"/>
      <circle r="4.8" fill="#f2d398" stroke="#34382d" stroke-width="2"/>
    </g>
    ${stops}
    <g transform="translate(567 32)" aria-hidden="true">
      <text y="-9" text-anchor="middle" fill="#e6dfbe" font-size="14" font-family="ui-monospace,monospace">N</text>
      <g transform="rotate(19)"><path d="M0,-3 5,16 0,12Z" fill="#acae97"/><path d="M0,-3 -5,16 0,12Z" fill="#e2dfc8"/></g>
    </g>`;
  svg.id = id;
  container.replaceChildren(svg);
  const pins = Array.from(svg.querySelectorAll('[data-stop]'));
  const player = svg.querySelector('[data-walker]');
  let bearing = 0;
  function setPose(x, z, heading = bearing) {
    if (![x, z, heading].every(Number.isFinite)) return;
    bearing = heading;
    const [px, py] = project(x, z);
    const rad = heading * Math.PI / 180;
    const [tx, ty] = project(x + Math.sin(rad), z - Math.cos(rad));
    const angle = Math.atan2(tx - px, py - ty) * 180 / Math.PI;
    player.setAttribute('transform', `translate(${px} ${py}) rotate(${angle})`);
  }
  function setScene(index) {
    const stop = places[index];
    if (!stop) return;
    pins.forEach((pin, i) => {
      pin.classList.toggle('selected', i === index);
      if (interactive) pin.setAttribute('aria-pressed', String(i === index));
    });
    setPose(stop.x, stop.z, arrivalHeading(stop));
  }
  if (interactive) {
    pins.forEach((pin, i) => {
      pin.addEventListener('click', () => onSelect?.(i));
      pin.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!event.repeat) onSelect?.(i);
      });
    });
  }
  setScene(0);
  return { setScene, setPose };
}
