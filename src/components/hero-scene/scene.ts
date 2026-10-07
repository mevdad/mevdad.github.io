import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SkinnedMesh,
  Sprite,
  Texture,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { heroScene } from "@/content/hero-scene";
import { Character, type Move } from "./character";
import { Ball, createBallKit, Fx } from "./effects";

/*
 * The hero's 3D scene. This module (and `three` with it) is only ever loaded through
 * `import("./scene")` from the client island, so webpack puts it in its own async chunk:
 * nothing here is in the page's first-load JavaScript.
 *
 * Lifecycle contract: `mountScene` creates its own <canvas>, appends it to `container`, and
 * `dispose()` removes it and releases every GPU object. The canvas is not React's, so a React
 * remount (StrictMode, Fast Refresh) can never hand a lost WebGL context to a new renderer.
 */

export interface SceneOptions {
  /** Full-bleed layer (the whole hero): the canvas fills it, so balls can fly in from the screen edge. */
  container: HTMLElement;
  /** The box where the character stands. The camera frames exactly this box; everything else is overflow. */
  slot: HTMLElement;
  signal: AbortSignal;
  /** Called once, after the first frame is on the canvas. */
  onFirstFrame: () => void;
  /** The browser took the GPU context away (memory pressure, driver reset). */
  onContextLost: () => void;
  /** The device can't keep up (see the frame-time guard in the loop): the caller should drop back to the poster. */
  onSlow: () => void;
}

export interface SceneHandle {
  dispose: () => void;
}

// The order of a round. Fist Fight's first frame is the fighting stance; Headbutt ends in the pose
// closest to it, so the return to the stance is nearly invisible.
const ORDER = ["Fist Fight", "Jab & Kick", "Chapa Giratoria", "Headbutt"];
const TRAVEL = 2.2; // s a ball flies before the hit
const REST = 3.0; // s pause in the stance after a round
const MAX_DPR = 1.5;
// Frame-time guard: a scene that renders at under ~25 fps on this device is worse than a still poster.
const GUARD_SKIP_FRAMES = 6; // shader compiles and texture uploads make the first frames slow on any machine
const GUARD_WINDOW_FRAMES = 45; // ~1-2 s of frames per verdict
const SLOW_FRAME_MS = 40;
const PIXEL_BUDGET = 1_800_000; // the canvas is as big as the hero; cap its backing store (~1.25x at 1440x800, 1x at 1080p)
const FOV = 35;
const REVEAL_AFTER_FRAMES = 4;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

interface Scheduled {
  playAt: number;
  move: Move;
  pre: number;
}

/** Frees geometries, materials, textures and skeletons under `root`. */
function disposeTree(root: Scene): void {
  root.traverse((object) => {
    if (object instanceof SkinnedMesh) object.skeleton.dispose();
    if (object instanceof Mesh || object instanceof Sprite) {
      if (object instanceof Mesh) object.geometry.dispose();
      const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) if (value instanceof Texture) value.dispose();
        material.dispose();
      }
    }
  });
}

export async function mountScene({ container, slot, signal, onFirstFrame, onContextLost, onSlow }: SceneOptions): Promise<SceneHandle> {
  signal.throwIfAborted();

  // ---- renderer first: if WebGL is unavailable we fail before downloading the model ----
  const canvas = document.createElement("canvas");
  canvas.className = "scene-canvas";
  const renderer = new WebGLRenderer({
    canvas,
    // Transparent: the hero's gradient mesh and the light/dark theme show through, so nothing to re-tint.
    alpha: true,
    // MSAA is on: the canvas is small (~480 px), so its cost is negligible, while an aliased character
    // silhouette against a transparent background looks cheap.
    antialias: true,
    // Decorative scene: never wake the discrete GPU for it.
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  const cameraTarget = new Vector3(0, 0.95, 0.5); // target left of the character => character right of the slot centre
  // Side view from +X: screen-left is +Z. The character faces +Z, i.e. LEFT, toward the text column;
  // balls fly in from the left screen edge across the whole hero to reach it on the right.
  camera.position.set(4.7, 1.5, 1.0);
  camera.lookAt(cameraTarget);

  // ---- lights and a floor that only catches the character's shadow ----
  scene.add(new HemisphereLight(0x9db8ff, 0x1a1c2a, 0.75));
  const key = new DirectionalLight(0xfff1e0, 2.6);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.target.position.set(0, 0, 2);
  scene.add(key, key.target);
  const rim = new DirectionalLight(0x6a7bff, 2.2);
  rim.position.set(-5, 3, -4);
  const rim2 = new DirectionalLight(0xff4fd8, 1.2);
  rim2.position.set(5, 2, -5);
  scene.add(rim, rim2);

  // ShadowMaterial draws nothing but the shadow, so the floor works on any page background.
  const floor = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const kit = createBallKit(scene, heroScene.labels);
  const fx = new Fx(kit);

  let disposed = false;
  let raf = 0;
  const cleanups: (() => void)[] = [];

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    for (const cleanup of cleanups) cleanup();
    fx.dispose();
    kit.dispose();
    disposeTree(scene);
    key.dispose();
    renderer.dispose();
    renderer.forceContextLoss(); // release the GL context now, not whenever the GC gets to it
    canvas.remove();
  }

  try {
    // ---- the model: a plain fetch (so it can be aborted), parsed by GLTFLoader ----
    const response = await fetch(heroScene.model, { signal });
    if (!response.ok) throw new Error(`Failed to load ${heroScene.model}: ${response.status}`);
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(await response.arrayBuffer(), "");
    signal.throwIfAborted();

    const character = new Character(scene, gltf);
    const clips = gltf.animations
      .slice()
      .sort((a, b) => rank(a.name) - rank(b.name));
    const [stanceClip] = clips;
    if (!stanceClip) throw new Error("Model has no animations");
    character.setStance(stanceClip);
    // Hit analysis samples each clip 60 times a second; one clip per task keeps every task short
    // (no long task for the main thread) instead of one ~100 ms block.
    for (const clip of clips) {
      await yieldToMain();
      signal.throwIfAborted();
      character.addMove(clip, clip.name);
    }

    // ---- sizing ----
    // The canvas fills the whole hero, but the camera is framed for the slot box only:
    // `setViewOffset` says "the full view is the slot (aspect 1:1); render the window of it that the
    // canvas covers". The slot is inside that window, so the character looks exactly as in a square
    // frame, while everything around the slot (the rest of the hero) is rendered too.
    let dprCap = MAX_DPR; // the frame-time guard lowers this to 1
    const resize = () => {
      const area = container.getBoundingClientRect();
      const box = slot.getBoundingClientRect();
      if (!area.width || !area.height || !box.width || !box.height) return;
      const dpr = Math.max(1, Math.min(window.devicePixelRatio, dprCap, Math.sqrt(PIXEL_BUDGET / (area.width * area.height))));
      renderer.setPixelRatio(dpr);
      renderer.setSize(area.width, area.height, false);
      camera.aspect = box.width / box.height;
      camera.fov = FOV;
      camera.setViewOffset(box.width, box.height, area.left - box.left, area.top - box.top, area.width, area.height);
      // CSS dims the canvas where it overlaps the text column (see .scene-layer).
      container.style.setProperty("--slot-x", `${box.left - area.left}px`);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resizeObserver.observe(slot);
    cleanups.push(() => resizeObserver.disconnect());
    container.append(canvas);
    resize();

    // Compile shaders off the main thread (KHR_parallel_shader_compile) before the first frame, and
    // include the materials the first shatter will need, or it would hitch mid-animation.
    const [warmLabel] = heroScene.labels;
    const warm = new Mesh(kit.shardGeo, kit.assetsFor(warmLabel).shard);
    const warmBall = new Mesh(kit.ballGeo, kit.assetsFor(warmLabel).ball);
    const warmGlow = new Sprite(kit.assetsFor(warmLabel).glow);
    scene.add(warm, warmBall, warmGlow);
    await renderer.compileAsync(scene, camera);
    scene.remove(warm, warmBall, warmGlow);
    signal.throwIfAborted();

    // ---- game logic ----
    let time = 0;
    const balls: Ball[] = [];
    const schedule: Scheduled[] = [];
    let lastEnd = 0; // when the current move ends
    let moveIdx = 0;
    let labelBag: (typeof heroScene.labels)[number][] = [];
    let stopLeft = 0;
    let lastStop = -1; // "hit-stop": for a split second everything slows down at the moment of impact
    let prevMove: Move | null = null; // last scheduled move (null = in the stance)

    /** Walks back from `end` along `run` until the point is projected beyond the left edge of the canvas. */
    const probe = new Vector3();
    const offscreenStart = (end: Vector3, run: Vector3): Vector3 => {
      camera.updateMatrixWorld();
      const start = end.clone();
      for (let distance = 4; distance <= 60; distance += 1) {
        start.copy(end).addScaledVector(run, distance);
        probe.copy(start).project(camera);
        if (probe.x < -1.25) break;
      }
      return start;
    };

    const nextLabel = () => {
      if (!labelBag.length) labelBag = heroScene.labels.slice().sort(() => Math.random() - 0.5);
      const label = labelBag.pop();
      if (!label) throw new Error("No ball labels");
      return label;
    };

    const spawnMove = () => {
      // moves without reachable hits (all of them "behind the back") are skipped
      const playable = character.moves.filter((m) => m.hits.length);
      const move = playable[moveIdx % playable.length];
      const firstHit = move?.hits[0];
      if (!move || !firstHit) return;
      // How smooth a transition is depends on how different the end of the previous move and the start of this one are;
      // the previous tail is overlapped without touching its last hit, and the rest is padded with a pause.
      const pre = character.blendBetween(prevMove, move);
      const overlap = prevMove ? Math.min(pre, character.tailRoom(prevMove)) : pre;
      const strikeStart = Math.max(time + Math.max(pre, TRAVEL - firstHit.time) + 0.1, lastEnd + (pre - overlap));
      lastEnd = strikeStart + move.duration;
      prevMove = move;
      schedule.push({ playAt: strikeStart - pre, move, pre });
      for (const hit of move.hits) {
        const hitAt = strikeStart + hit.time;
        // The ball arrives exactly where the fist/foot/head will be at that moment. Its approach for the
        // last stretch is the analysed one (clear of the torso); before that it runs almost parallel to
        // the screen, from beyond the left edge of the canvas, so the whole flight is on screen.
        const jitter = MathUtils.clamp(rnd(-0.25, 0.25), -0.25, 0.25);
        const approach = hit.approach.clone().applyAxisAngle(new Vector3(0, 1, 0), jitter);
        if (approach.z < 0.17) approach.copy(hit.approach); // don't turn toward the body
        const end = hit.point.clone().addScaledVector(approach, 0.32 * 0.85);
        const run = new Vector3(approach.x * 0.15, 0, approach.z).normalize();
        const start = offscreenStart(end, run);
        start.y = Math.max(0.5, hit.point.y + rnd(-0.2, 1.2));
        const ball = new Ball(kit, nextLabel(), start, end, hitAt - TRAVEL, hitAt, hit.dir);
        scene.add(ball.mesh);
        balls.push(ball);
      }
      if (++moveIdx >= playable.length) {
        moveIdx = 0;
        lastEnd += REST;
        prevMove = null; // after the pause the character is in the stance
      }
    };

    const step = (dt: number) => {
      time += dt;
      if (character.moves.length && lastEnd - time < 2.0) spawnMove();
      for (let i = schedule.length - 1; i >= 0; i--) {
        const s = schedule[i];
        if (s && time >= s.playAt) {
          character.play(s.move, s.pre);
          schedule.splice(i, 1);
        }
      }
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        if (!ball) continue;
        ball.update(time, camera);
        if (time >= ball.hitAt) {
          fx.shatter(ball);
          if (time - lastStop > 0.35) {
            stopLeft = 0.06;
            lastStop = time;
          }
          scene.remove(ball.mesh);
          balls.splice(i, 1);
        }
      }
      character.update(dt);
      fx.update(dt);
    };

    // ---- render loop: runs only while the scene is on screen AND the tab is visible ----
    let last = 0;
    let running = false;
    let frames = 0;
    let inView = true;
    const shakeOffset = new Vector3();

    // Frame-time guard. Verdict 1 (average frame > 40 ms): drop the backing store to 1x. Verdict 2 (still > 40 ms):
    // give up and hand the hero back to the poster. A machine that passes the first window is never judged again.
    let guardSeen = 0;
    let guardSum = 0;
    let guardLowered = false;
    let guardDone = false;
    const guard = (elapsed: number) => {
      if (guardDone || ++guardSeen <= GUARD_SKIP_FRAMES) return;
      guardSum += elapsed;
      if (guardSeen < GUARD_SKIP_FRAMES + GUARD_WINDOW_FRAMES) return;
      const average = guardSum / GUARD_WINDOW_FRAMES;
      guardSeen = GUARD_SKIP_FRAMES;
      guardSum = 0;
      if (average <= SLOW_FRAME_MS) guardDone = true;
      else if (!guardLowered) {
        guardLowered = true;
        dprCap = 1;
        resize();
      } else onSlow();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const elapsed = now - last;
      const dt = Math.min(elapsed / 1000, 0.05);
      last = now;
      const slow = stopLeft > 0;
      if (slow) stopLeft -= dt;
      step(slow ? dt * 0.12 : dt); // the whole world slows down together
      shakeOffset.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(fx.shake);
      camera.position.add(shakeOffset);
      renderer.render(scene, camera);
      camera.position.sub(shakeOffset);
      // Reveal only after a few frames: the first ones are slow (textures and shaders upload), and fading
      // in over them would stutter. By frame 4 the GPU work is done and the fade runs on a steady loop.
      if (frames <= REVEAL_AFTER_FRAMES && ++frames > REVEAL_AFTER_FRAMES) {
        canvas.dataset.ready = "";
        onFirstFrame();
      }
      guard(elapsed);
    };
    const sync = () => {
      const shouldRun = inView && !document.hidden && !disposed;
      if (shouldRun && !running) {
        running = true;
        last = performance.now(); // no catch-up jump after a pause
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const intersection = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      inView = entry.isIntersecting;
      sync();
    });
    intersection.observe(container);
    document.addEventListener("visibilitychange", sync);
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", lost);
    cleanups.push(() => {
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", lost);
    });

    sync();
    return { dispose };
  } catch (error) {
    dispose(); // aborted or failed half-way: leave nothing behind
    throw error;
  }
}

function rank(name: string): number {
  const index = ORDER.indexOf(name);
  return index < 0 ? ORDER.length : index;
}
