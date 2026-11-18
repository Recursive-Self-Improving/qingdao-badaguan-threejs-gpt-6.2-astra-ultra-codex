import * as THREE from 'three';
import { buildWorld } from './world.js';
import { places as views } from './landmarks.js';

const eyeHeight = 1.8;
const movementKeys = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyQ', 'KeyE', 'KeyR', 'KeyF'
]);

function addSky(scene, sunDirection) {
  // A periodic noise texture keeps the high cloud strands continuous in every direction.
  const size = 128;
  const data = new Uint8Array(size * size);
  let seed = 7199;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    data[i] = seed >>> 24;
  }
  const noise = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.magFilter = noise.minFilter = THREE.LinearFilter;
  noise.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      horizon: { value: new THREE.Color(0xf2d5a9) },
      zenith: { value: new THREE.Color(0x609bd4) },
      sunDirection: { value: sunDirection },
      clouds: { value: noise },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 horizon, zenith, sunDirection;
      uniform float time;
      uniform sampler2D clouds;
      varying vec3 vDirection;
      void main() {
        vec3 d = normalize(vDirection);
        float height = max(0.0, d.y);
        vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.72, pow(height, 0.47)));
        vec2 p = d.xz / (0.10 + height);
        p = p * vec2(0.023, 0.061) + vec2(time * 0.00007, 0.);
        float n = texture2D(clouds, p).r * 0.62 +
                  texture2D(clouds, p * 2.15).r * 0.26 +
                  texture2D(clouds, p * 4.9).r * 0.12;
        float cloud = smoothstep(0.54, 0.78, n) * smoothstep(0.01, 0.20, height);
        color = mix(color, vec3(0.94, 0.90, 0.82), cloud * 0.19);
        float facingSun = max(0., dot(d, sunDirection));
        color += vec3(0.38, 0.20, 0.075) * pow(facingSun, 6.);
        color += vec3(1.2, 0.81, 0.42) * pow(facingSun, 120.);
        color += vec3(2.8, 2.15, 1.5) * smoothstep(0.99984, 0.99997, facingSun);
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 40, 20), material);
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  scene.add(sky);
  return { sky, noise };
}

function addLight(scene) {
  scene.add(new THREE.HemisphereLight(0xdeebfc, 0x9f886e, 1.18));
  const sun = new THREE.DirectionalLight(0xffdb9c, 3.25);
  sun.target.position.set(-1, 0, -28);
  sun.position.copy(sun.target.position).add(new THREE.Vector3(-46, 30, 32));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    near: 0.5, far: 178, left: -68, right: 68, top: 63, bottom: -63
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00018;
  scene.add(sun, sun.target);
  return sun.position.clone().sub(sun.target.position).normalize();
}

function addDriftingLeaves(scene) {
  // A folded leaf catches the low light as the wind turns it.
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, .015, 0, .075, 0, .024, .037, 0, .047, .047, -.004,
    .036, .013, 0, .06, .008, -.008, .022, -.02, 0, 0, -.045, .001,
    -.024, -.017, 0, -.052, .007, -.006, -.028, .02, 0, -.043, .046, -.004, -.013, .037, 0
  ], 3));
  const triangles = [];
  for (let i = 1; i < 13; i++) triangles.push(0, i, i % 12 + 1);
  geo.setIndex(triangles);
  geo.computeVertexNormals();
  const material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const leaves = new THREE.InstancedMesh(geo, material, 60);
  const frame = new THREE.Object3D();
  const tones = [0xf1ba56, 0xcf782b, 0xdbab41, 0xe3ca78];
  const seeds = Array.from({ length: leaves.count }, (_, i) => {
    leaves.setColorAt(i, new THREE.Color(tones[i % tones.length]));
    return {
      x: -15 + ((i * 13.17) % 34), z: -81 + ((i * 9.54) % 109),
      angle: i * 4.13, speed: .38 + (i * .17 % .27)
    };
  });
  leaves.frustumCulled = false;
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(leaves);
  return (t) => {
    for (const [i, seed] of seeds.entries()) {
      const drop = (t * seed.speed + i * 2.3) % 7.5;
      const spin = t + seed.angle;
      frame.position.set(seed.x + drop * .48 + .43 * Math.cos(spin), 7.6 - drop, seed.z + .44 * Math.sin(spin));
      frame.rotation.set(spin * 1.21, spin * .7, .65 * Math.sin(spin * 1.8));
      frame.updateMatrix();
      leaves.setMatrixAt(i, frame.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;
  };
}

export function createExplorer(canvas, { onHeading, onWalk, onReady, onPosition } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2d5a9);
  scene.fog = new THREE.FogExp2(0xe9d8bd, 0.0078);
  const camera = new THREE.PerspectiveCamera(64, 1, 0.06, 600);
  camera.rotation.order = 'YXZ';
  const { sky, noise } = addSky(scene, addLight(scene));
  const world = buildWorld(THREE, scene);
  const driftLeaves = addDriftingLeaves(scene);
  const keys = new Set();
  const joystick = new THREE.Vector2();
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let index = 0;
  let active = false;
  let paused = false;
  let disposed = false;
  let lostContext = false;
  let drag = null;
  let yaw = 0;
  let pitch = 0;
  let previousTime = 0;
  let elapsed = 0;
  let frameId = 0;
  let lastHeading;
  let lastX;
  let lastZ;

  function publishPose(force = false) {
    const heading = (Math.round(THREE.MathUtils.radToDeg(yaw)) % 360 + 360) % 360;
    if (force || heading !== lastHeading) {
      lastHeading = heading;
      onHeading?.(heading);
    }
    const { x, z } = camera.position;
    if (force || Math.hypot(x - lastX, z - lastZ) > 0.12) {
      lastX = x;
      lastZ = z;
      onPosition?.(x, z);
    }
  }

  function orient() {
    pitch = THREE.MathUtils.clamp(pitch, -1.40, 1.40);
    camera.rotation.set(pitch, -yaw, 0, 'YXZ');
  }

  function placeCamera() {
    const view = views[index];
    const y = world.heightAt(view.x, view.z) + eyeHeight;
    camera.position.set(view.x, y, view.z);
    let [tx, ty, tz] = view.target;
    if (index === 0 && canvas.clientWidth < canvas.clientHeight) tx = 9;
    yaw = Math.atan2(tx - view.x, -(tz - view.z));
    pitch = Math.atan2(ty - y, Math.hypot(tx - view.x, tz - view.z));
    orient();
    camera.fov = view.fov;
    camera.updateProjectionMatrix();
    publishPose(true);
  }

  function resize() {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function advance(dt) {
    const pressed = (...codes) => Number(codes.some(code => keys.has(code)));
    let right = joystick.x + pressed('KeyD', 'ArrowRight') - pressed('KeyA', 'ArrowLeft');
    let ahead = joystick.y + pressed('KeyW', 'ArrowUp') - pressed('KeyS', 'ArrowDown');
    const magnitude = Math.hypot(right, ahead);
    if (magnitude > 1) {
      right /= magnitude;
      ahead /= magnitude;
    }
    yaw += (pressed('KeyE') - pressed('KeyQ')) * 1.45 * dt;
    pitch += (pressed('KeyR') - pressed('KeyF')) * 0.95 * dt;
    orient();
    if (magnitude > 0) {
      const speed = pressed('ShiftLeft', 'ShiftRight') ? 8 : 4.3;
      const stride = dt * speed;
      const dx = (Math.cos(yaw) * right + Math.sin(yaw) * ahead) * stride;
      const dz = (Math.sin(yaw) * right - Math.cos(yaw) * ahead) * stride;
      const p = camera.position;
      if (world.canWalk(p.x + dx, p.z)) p.x += dx;
      if (world.canWalk(p.x, p.z + dz)) p.z += dz;
      const desiredY = world.heightAt(p.x, p.z) + eyeHeight;
      p.y = THREE.MathUtils.damp(p.y, desiredY, 17, dt);
    }
    publishPose();
  }

  function draw(time) {
    frameId = 0;
    if (!active || paused || disposed || lostContext || document.hidden) return;
    const dt = previousTime ? THREE.MathUtils.clamp((time - previousTime) / 1000, 0, 0.065) : 0;
    previousTime = time;
    elapsed += dt;
    advance(dt);
    sky.position.copy(camera.position);
    sky.material.uniforms.time.value = elapsed;
    world.update?.(elapsed);
    driftLeaves(elapsed);
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(draw);
  }

  function restart() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    previousTime = 0;
    draw(performance.now());
  }

  function clearInput() {
    keys.clear();
    joystick.set(0, 0);
    const id = drag?.id;
    drag = null;
    if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    canvas.classList.remove('dragging');
  }

  function setActive(next) {
    if (disposed || next === active) return;
    if (next && (paused || lostContext)) return;
    active = next;
    if (active) {
      resize();
      onWalk?.();
    } else {
      clearInput();
    }
    restart();
  }

  function setScene(next) {
    if (!Number.isInteger(next) || !views[next]) return;
    setActive(false);
    clearInput();
    index = next;
    placeCamera();
  }

  function pause(next) {
    paused = Boolean(next);
    if (paused) clearInput();
    restart();
  }

  function move(x, y) {
    if (paused || disposed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x || y) setActive(true);
    joystick.set(x, y).clampLength(0, 1);
  }

  function onKeyDown(event) {
    if (paused || disposed || event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
    if (event.target instanceof Element &&
        event.target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="dialog"], dialog')) return;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      keys.add(event.code);
      return;
    }
    if (!movementKeys.has(event.code)) return;
    event.preventDefault();
    keys.add(event.code);
    setActive(true);
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || paused || disposed || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, started: false };
    canvas.setPointerCapture(event.pointerId);
  }, options);
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== drag?.id || paused) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.started && Math.hypot(dx, dy) < 3) return;
    drag.started = true;
    canvas.classList.add('dragging');
    setActive(true);
    const sensitivity = (event.pointerType === 'touch' ? 0.0043 : 0.0035) * camera.fov / 64;
    yaw += dx * sensitivity;
    pitch -= dy * sensitivity;
    drag.x = event.clientX;
    drag.y = event.clientY;
    orient();
    publishPose();
  }, options);
  function finishDrag(event) {
    if (event.pointerId !== drag?.id) return;
    drag = null;
    canvas.classList.remove('dragging');
  }
  canvas.addEventListener('pointerup', finishDrag, options);
  canvas.addEventListener('lostpointercapture', finishDrag, options);
  canvas.addEventListener('pointercancel', finishDrag, options);
  canvas.addEventListener('wheel', event => {
    if (paused || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    setActive(true);
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
    camera.fov = THREE.MathUtils.clamp(camera.fov + pixels * 0.026, 37, 83);
    camera.updateProjectionMatrix();
  }, { ...options, passive: false });

  window.addEventListener('keydown', onKeyDown, options);
  window.addEventListener('keyup', event => keys.delete(event.code), options);
  window.addEventListener('blur', clearInput, options);
  document.addEventListener('visibilitychange', () => {
    clearInput();
    restart();
  }, options);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lostContext = true;
    clearInput();
    restart();
  }, options);
  canvas.addEventListener('webglcontextrestored', () => {
    lostContext = false;
    renderer.shadowMap.needsUpdate = true;
    restart();
  }, options);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  placeCamera();
  onReady?.();

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearInput();
    abort.abort();
    observer.disconnect();
    cancelAnimationFrame(frameId);
    const resources = new Set([noise]);
    scene.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      if (object.shadow?.map) resources.add(object.shadow.map);
      if (object.isInstancedMesh) resources.add(object);
      for (const material of [object.material].flat().filter(Boolean)) {
        resources.add(material);
        for (const value of Object.values(material)) {
          if (value?.isTexture) resources.add(value);
        }
      }
    });
    for (const resource of resources) resource.dispose();
    renderer.dispose();
  }
  return { setScene, setActive, move, reset: () => setScene(index), pause, dispose };
}
