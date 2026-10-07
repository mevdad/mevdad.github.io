import {
  AnimationClip,
  AnimationMixer,
  AnimationUtils,
  Box3,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  Mesh,
  Quaternion,
  SkinnedMesh,
  Vector3,
  type AnimationAction,
  type KeyframeTrack,
  type Object3D,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

/*
 * A Mixamo-rigged character: a fighting stance plus "moves" (animation clips).
 * Hits inside each move are found automatically (fast thrusts of a hand, foot or
 * head away from the body), and the character returns to the same point after
 * every move, so moves chain without drift.
 */

const HEIGHT = 1.8; // m, final character height
const ROOT_MOTION = 1; // share of hip travel along the floor kept (lunges); 0 = stand still
const MIN_REACH = 0.25; // m, a strike must reach this far in front of the hips (+Z)
const BODY_R = 0.3; // m, torso "thickness": a ball must not fly through the body
const Y_AXIS = new Vector3(0, 1, 0);

type EffectorKind = "hand" | "foot" | "head";

interface EffectorSpec {
  name: string;
  kind: EffectorKind;
  /** Bone that, together with `k`, shifts the contact point past the wrist/ankle. */
  tip?: string;
  k?: number;
  /** Head only: contact point offset along the bone's local Y, in metres. */
  up?: number;
}

interface Effector extends EffectorSpec {
  bone: Object3D;
  tipBone: Object3D | undefined;
}

// Contact point: fist = a bit past the wrist toward the knuckles, foot = toe, head = centre of the head.
const EFFECTORS: readonly EffectorSpec[] = [
  { name: "LeftHand", kind: "hand", tip: "LeftHandMiddle1", k: 1.3 },
  { name: "RightHand", kind: "hand", tip: "RightHandMiddle1", k: 1.3 },
  { name: "LeftFoot", kind: "foot", tip: "LeftToeBase", k: 1.0 },
  { name: "RightFoot", kind: "foot", tip: "RightToeBase", k: 1.0 },
  { name: "Head", kind: "head", up: 0.1 },
];

// Directions (angle from +Z in plan) a ball may come from: front and sides only, never from behind.
const APPROACH = [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80].map((d) => (d * Math.PI) / 180);
const FINGERS = /Thumb|Index|Middle|Ring|Pinky/;
const smooth = (k: number) => k * k * k * (k * (k * 6 - 15) + 10); // smootherstep: soft in, soft out

/** `noUncheckedIndexedAccess` makes every `a[i]` possibly undefined; this states the invariant once and fails loudly. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new RangeError(`Index ${index} out of range (length ${items.length})`);
  return item;
}
const num = (values: ArrayLike<number>, index: number): number => values[index] ?? 0;

export interface Hit {
  /** Seconds from the start of the move. */
  time: number;
  point: Vector3;
  dir: Vector3;
  approach: Vector3;
}

export interface Move {
  clip: AnimationClip;
  hits: Hit[];
  duration: number;
  name: string;
}

interface Crossfade {
  to: AnimationAction;
  from: { action: AnimationAction; w0: number }[];
  t: number;
  dur: number;
}

interface Candidate {
  i: number;
  k: number;
  prom: number;
  vmax: number;
  score: number;
}

/**
 * Value of a keyframe track at `time` (linear for vectors, slerp for quaternions; the clips are
 * linearly interpolated glTF). Not `track.createInterpolant()`: it exists at runtime but is missing
 * from the published typings.
 */
function sampleTrack(track: KeyframeTrack, time: number): number[] {
  const size = track.getValueSize();
  const { times, values } = track;
  const last = times.length - 1;
  const read = (frame: number) => Array.from({ length: size }, (_, k) => num(values, frame * size + k));
  if (time <= num(times, 0)) return read(0);
  if (time >= num(times, last)) return read(last);
  let hi = 1;
  while (num(times, hi) < time) hi++;
  const t0 = num(times, hi - 1);
  const k = (time - t0) / (num(times, hi) - t0);
  const a = read(hi - 1);
  if (size === 4 && track.name.endsWith(".quaternion")) {
    const out = [0, 0, 0, 0];
    Quaternion.slerpFlat(out, 0, a, 0, read(hi), 0, k);
    return out;
  }
  const b = read(hi);
  return a.map((v, i) => v + (num(b, i) - v) * k);
}

const angDiff = (a: number, b: number): number => {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};
const angDiffRad = (a: number, b: number): number => {
  let d = (a - b) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

export class Character {
  readonly moves: Move[] = [];
  readonly model: Object3D;
  private readonly skinned: SkinnedMesh;
  private readonly hips: Object3D;
  private readonly effectors: Effector[];
  private readonly mixer: AnimationMixer;
  private readonly baseScaleY: number;
  private stanceYaw = 0;
  private stanceClip: AnimationClip | null = null;
  private idleAction: AnimationAction | null = null;
  private current: { action: AnimationAction; move: Move } | null = null;
  private pending: { action: AnimationAction; left: number } | null = null;
  private readonly live = new Set<AnimationAction>(); // actions with non-zero weight
  private xf: Crossfade | null = null;
  private t = 0;

  constructor(parent: Object3D, gltf: GLTF) {
    this.model = gltf.scene;
    parent.add(this.model);

    const skinnedMeshes: SkinnedMesh[] = [];
    this.model.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.frustumCulled = false; // animated bounds are not tracked; the model is always on screen anyway
      if (o instanceof SkinnedMesh) skinnedMeshes.push(o);
    });
    const [skinned] = skinnedMeshes;
    if (!skinned) throw new Error("Model has no skinned mesh");
    this.skinned = skinned;

    this.mixer = new AnimationMixer(this.model);
    this.mixer.addEventListener("finished", (e) => this.onFinished(e.action));

    const hips = this.model.getObjectByName("mixamorigHips");
    if (!hips) throw new Error("Model has no mixamorigHips bone");
    this.hips = hips;

    this.effectors = EFFECTORS.flatMap((spec) => {
      const bone = this.model.getObjectByName(`mixamorig${spec.name}`);
      if (!bone) return [];
      const tipBone = spec.tip ? this.model.getObjectByName(`mixamorig${spec.tip}`) : undefined;
      return [{ ...spec, bone, tipBone }];
    });

    // scale by height in the bind pose
    this.model.updateMatrixWorld(true);
    const bind = new Box3().setFromObject(this.skinned, true);
    this.model.scale.setScalar(HEIGHT / bind.getSize(new Vector3()).y);
    this.baseScaleY = this.model.scale.y;
  }

  /** Stance = the first frame of this clip. All moves are turned to start facing the same way and return to it. */
  setStance(clip: AnimationClip): void {
    const base = this.bake(clip, 0);
    this.stanceYaw = this.yawAtStart(base);
    this.ground(base);
    // A one-frame clip of its own: it can't share an action with the move itself (Fist Fight's stance
    // equals its first frame) because loop mode and weight differ.
    this.stanceClip = AnimationUtils.subclip(base, "stance", 0, 1, 30);
    const idle = this.mixer.clipAction(this.stanceClip);
    idle.setLoop(LoopRepeat, Infinity);
    this.idleAction = idle;
    this.restoreIdle();
  }

  addMove(clip: AnimationClip, name: string): Move {
    const yaw0 = this.yawAtStart(clip);
    let baked = this.bake(clip, angDiff(this.stanceYaw, yaw0));
    baked = this.trimDead(baked); // no "dead" time at the start and end
    const move: Move = { clip: baked, hits: this.analyze(baked), duration: baked.duration, name };
    this.moves.push(move);
    this.restoreIdle(); // analysis reset the mixer
    return move;
  }

  // ---------- transitions ----------

  /** Cross-fade time between the end of `from` (null = stance) and the start of `to`: the more the poses differ, the longer (0.3-0.75 s). */
  blendBetween(from: Move | null, to: Move | null): number {
    const a = from ? from.clip : this.stanceClip;
    const b = to ? to.clip : this.stanceClip;
    if (!a || !b) return 0.3;
    const d = this.poseDist(a, from ? a.duration : 0, b, 0);
    return MathUtils.clamp(0.3 + d * 0.011, 0.3, 0.75);
  }

  /** How many seconds of a move's tail can be given to the next transition without touching its last hit. */
  tailRoom(move: Move): number {
    const last = move.hits[move.hits.length - 1];
    return Math.max(0.12, move.duration - (last ? last.time : 0) - 0.08);
  }

  /** Mean angle between two poses over all bones except fingers, degrees. */
  private poseDist(clipA: AnimationClip, tA: number, clipB: AnimationClip, tB: number): number {
    const other = new Map(clipB.tracks.filter((t) => t.name.endsWith(".quaternion")).map((t) => [t.name, t]));
    let sum = 0;
    let n = 0;
    for (const track of clipA.tracks) {
      const match = other.get(track.name);
      if (!match || FINGERS.test(track.name)) continue;
      const va = sampleTrack(track, tA);
      const vb = sampleTrack(match, tB);
      const dot = Math.min(
        1,
        Math.abs(num(va, 0) * num(vb, 0) + num(va, 1) * num(vb, 1) + num(va, 2) * num(vb, 2) + num(va, 3) * num(vb, 3)),
      );
      sum += (2 * Math.acos(dot) * 180) / Math.PI;
      n++;
    }
    return n ? sum / n : 0;
  }

  // ---------- preparing clips ----------

  /** A copy of the clip turned by `yawDeg` (and with floor lunges scaled, see ROOT_MOTION). */
  private bake(clip: AnimationClip, yawDeg: number): AnimationClip {
    const q = new Quaternion().setFromAxisAngle(Y_AXIS, (yawDeg * Math.PI) / 180);
    const tmp = new Quaternion();
    const tracks = clip.tracks.map((source) => {
      const track = source.clone();
      if (track.name === "mixamorigHips.position") {
        // Hip travel along the floor (lunges) is scaled and rotated with the body; clips return to the
        // start point, so the character stands in the same place between moves.
        const v = track.values;
        const d = new Vector3();
        for (let i = 3; i < v.length; i += 3) {
          d.set(num(v, i) - num(v, 0), 0, num(v, i + 2) - num(v, 2))
            .multiplyScalar(ROOT_MOTION)
            .applyQuaternion(q);
          v[i] = num(v, 0) + d.x;
          v[i + 2] = num(v, 2) + d.z;
        }
      } else if (track.name === "mixamorigHips.quaternion" && yawDeg) {
        const v = track.values;
        for (let i = 0; i < v.length; i += 4) tmp.fromArray(v, i).premultiply(q).toArray(v, i);
      }
      return track;
    });
    return new AnimationClip(clip.name, clip.duration, tracks);
  }

  /** Cuts the sluggish start and end where the body barely moves (keeping a 0.12 s run-up). */
  private trimDead(clip: AnimationClip): AnimationClip {
    const dur = clip.duration;
    const steps = Math.ceil(dur * 60);
    const dt = dur / steps;
    const action = this.pose(clip, 0);
    const prev = this.effectors.map(() => new Vector3());
    const cur = this.effectors.map(() => new Vector3());
    const speed: number[] = [];
    for (let i = 0; i <= steps; i++) {
      this.mixer.setTime(i * dt);
      this.model.updateMatrixWorld(true);
      let sum = 0;
      this.effectors.forEach((e, k) => {
        const c = at(cur, k);
        const p = at(prev, k);
        this.contact(e, c);
        if (i) sum += c.distanceTo(p) / dt;
        p.copy(c);
      });
      speed.push(sum);
    }
    action.stop();
    this.mixer.stopAllAction();

    const threshold = 0.9; // m/s summed over the limbs
    const first = speed.findIndex((v, i) => i > 0 && v > threshold);
    const last = speed.length - 1 - [...speed].reverse().findIndex((v) => v > threshold);
    if (first < 0) return clip;
    const t0 = Math.max(0, first * dt - 0.12);
    const t1 = Math.min(dur, last * dt + 0.12);
    if (t0 < 0.15 && dur - t1 < 0.15) return clip; // nothing to cut
    return this.cut(clip, t0 < 0.15 ? 0 : t0, dur - t1 < 0.15 ? dur : t1);
  }

  private cut(clip: AnimationClip, t0: number, t1: number): AnimationClip {
    const tracks = clip.tracks.map((source) => {
      const size = source.getValueSize();
      const times = [0];
      const values = sampleTrack(source, t0);
      for (let i = 0; i < source.times.length; i++) {
        const t = num(source.times, i);
        if (t > t0 + 1e-4 && t < t1 - 1e-4) {
          times.push(t - t0);
          for (let k = 0; k < size; k++) values.push(num(source.values, i * size + k));
        }
      }
      times.push(t1 - t0);
      values.push(...sampleTrack(source, t1));
      const track = source.clone(); // keeps the track type and interpolation mode
      track.times = new Float32Array(times);
      track.values = new Float32Array(values);
      return track;
    });
    return new AnimationClip(clip.name, t1 - t0, tracks);
  }

  private pose(clip: AnimationClip, time: number): AnimationAction {
    this.clearAll();
    const action = this.mixer.clipAction(clip).play();
    this.mixer.setTime(time);
    this.model.updateMatrixWorld(true);
    return action;
  }

  private yawAtStart(clip: AnimationClip): number {
    const action = this.pose(clip, 0);
    const forward = new Vector3(0, 0, 1).applyQuaternion(this.hips.getWorldQuaternion(new Quaternion()));
    action.stop();
    this.mixer.stopAllAction();
    return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
  }

  /** Puts the feet on the floor using the pose of the first frame. */
  private ground(clip: AnimationClip): void {
    const action = this.pose(clip, 0);
    const box = new Box3().setFromObject(this.skinned, true);
    this.model.position.y -= box.min.y;
    action.stop();
    this.mixer.stopAllAction();
  }

  /** World position of a limb's contact point. */
  private contact(e: Effector, out: Vector3): Vector3 {
    e.bone.getWorldPosition(out);
    if (e.tipBone) {
      out.lerp(e.tipBone.getWorldPosition(new Vector3()), e.k ?? 1);
    } else if (e.up) {
      out.copy(e.bone.localToWorld(new Vector3(0, e.up / this.model.scale.x, 0)));
    }
    return out;
  }

  // ---------- playback ----------

  private clearAll(): void {
    this.mixer.stopAllAction();
    this.live.clear();
    this.xf = null;
  }

  private restoreIdle(): void {
    this.clearAll();
    this.current = null;
    this.pending = null;
    if (!this.idleAction) return;
    this.showIdle(this.idleAction);
    this.idleAction.setEffectiveWeight(1);
  }

  private showIdle(idle: AnimationAction): void {
    idle.reset();
    idle.paused = true; // the stance is a frozen frame
    idle.setEffectiveWeight(0);
    idle.play();
    this.live.add(idle);
  }

  /** Smoothly (smootherstep) moves the weight of all live actions to `to`. Weights always sum to 1, so the pose never dips into the bind pose mid-transition. */
  private fadeTo(to: AnimationAction, dur: number): void {
    const from = [...this.live].filter((a) => a !== to).map((action) => ({ action, w0: action.getEffectiveWeight() }));
    to.setEffectiveWeight(0);
    to.play();
    this.live.add(to);
    this.xf = { to, from, t: 0, dur };
  }

  /**
   * Start `pre` seconds before the first frame of motion (possibly during the previous move's tail):
   * the pose blends in while time stands still, then the clip runs, so every hit lands on schedule.
   */
  play(move: Move, pre: number): void {
    const action = this.mixer.clipAction(move.clip);
    action.reset();
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.paused = true;
    this.current = { action, move };
    this.pending = { action, left: pre };
    this.fadeTo(action, pre);
  }

  private onFinished(action: AnimationAction): void {
    if (this.current?.action !== action || !this.idleAction) return; // the next move already started and blends on its own
    const move = this.current.move;
    this.current = null;
    this.showIdle(this.idleAction);
    this.fadeTo(this.idleAction, this.blendBetween(move, null));
  }

  update(dt: number): void {
    this.t += dt;
    if (this.pending) {
      this.pending.left -= dt;
      if (this.pending.left <= 0) {
        this.pending.action.paused = false;
        this.pending = null;
      }
    }
    const x = this.xf;
    if (x) {
      x.t += dt;
      const k = Math.min(1, x.t / x.dur);
      const s = smooth(k);
      x.to.setEffectiveWeight(s);
      for (const f of x.from) f.action.setEffectiveWeight(f.w0 * (1 - s));
      if (k >= 1) {
        for (const f of x.from) {
          f.action.stop();
          this.live.delete(f.action);
        }
        this.xf = null;
      }
    }
    this.mixer.update(dt);
    this.model.scale.y = this.baseScaleY * (1 + 0.005 * Math.sin(this.t * 2.2)); // breathing
  }

  // ---------- finding hits ----------

  /**
   * Samples a clip and finds the hits: fast thrusts of a hand / foot / head away from the body.
   * For each hit a direction is chosen that a ball can arrive from (front or side, not through the
   * torso); a hit with no such direction is dropped.
   */
  private analyze(clip: AnimationClip): Hit[] {
    const dur = clip.duration;
    const N = Math.max(8, Math.ceil(dur * 60));
    const dt = dur / N;
    const action = this.pose(clip, 0);
    const pos: Vector3[][] = this.effectors.map(() => []);
    const hipsPos: Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      this.mixer.setTime(i * dt);
      this.model.updateMatrixWorld(true);
      this.effectors.forEach((e, k) => at(pos, k).push(this.contact(e, new Vector3())));
      hipsPos.push(this.hips.getWorldPosition(new Vector3()));
    }
    action.stop();
    this.mixer.stopAllAction();

    const W = Math.max(2, Math.round(0.1 / dt)); // speed window +-0.1 s
    const PW = Math.max(3, Math.round(0.3 / dt)); // peak window +-0.3 s
    const anchor = at(hipsPos, 0);
    const candidates: Candidate[] = [];
    this.effectors.forEach((e, k) => {
      const p = at(pos, k);
      const r = p.map((v) => v.distanceTo(anchor)); // distance from the starting point of the body
      for (let i = W; i <= N - W; i++) {
        let top = true;
        for (let d = -PW; d <= PW && top; d++) {
          const j = i + d;
          if (j >= 0 && j <= N && at(r, j) > at(r, i) + 1e-9) top = false;
        }
        if (!top) continue;
        let min = Infinity;
        for (let j = Math.max(0, i - PW); j <= i; j++) min = Math.min(min, at(r, j));
        const prom = at(r, i) - min; // how far it was thrown from the body
        let vmax = 0;
        for (let j = Math.max(1, i - PW); j <= i; j++) vmax = Math.max(vmax, at(p, j).distanceTo(at(p, j - 1)) / dt);
        const y = at(p, i).y;
        if (e.kind === "foot" && y < 0.3) continue; // a step, not a kick
        if (e.kind === "head" && y < 1.0) continue;
        if (!((prom >= 0.2 && vmax >= 2.4) || (prom >= 0.15 && vmax >= 6))) continue;
        candidates.push({ i, k, prom, vmax, score: vmax * (1 + prom) * (e.kind === "foot" ? 1.3 : 1) });
      }
    });
    candidates.sort((a, b) => b.score - a.score);
    const picked: { i: number; k: number }[] = [];
    for (const c of candidates) if (picked.every((p) => Math.abs(p.i - c.i) * dt >= 0.12)) picked.push(c);

    if (!picked.length) {
      // No obvious strikes (e.g. a headbutt on the spot): take the moment the head is farthest from the
      // start point; with no head, the fastest point of the clip.
      let best: { i: number; k: number; v: number } | null = null;
      const headIndex = this.effectors.findIndex((e) => e.kind === "head");
      if (headIndex >= 0) {
        const p = at(pos, headIndex);
        for (let i = 1; i < N; i++) {
          const point = at(p, i);
          const v = point.distanceTo(anchor);
          if (point.y >= 1.0 && (!best || v > best.v)) best = { i, k: headIndex, v };
        }
      }
      if (!best) {
        for (let k = 0; k < pos.length; k++) {
          const p = at(pos, k);
          for (let i = 1; i < N; i++) {
            const v = at(p, i - 1).distanceTo(at(p, i + 1));
            if (!best || v > best.v) best = { i, k, v };
          }
        }
      }
      if (best) picked.push(best);
    }
    picked.sort((a, b) => a.i - b.i);

    const hits: Hit[] = [];
    const back = Math.round(0.08 / dt);
    for (const c of picked) {
      const p = at(pos, c.k);
      const point = at(p, c.i);
      const hip = at(hipsPos, c.i);
      if (point.z - hip.z < MIN_REACH) continue; // back swing / strike behind: a ball can't honestly hit it
      const approach = this.pickApproach(point, hip);
      if (!approach) continue;
      const dir = point.clone().sub(at(p, Math.max(0, c.i - back)));
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
      hits.push({
        // the ball touches when the limb is almost at full extension
        time: Math.max(0, c.i * dt - 0.015),
        point: point.clone(),
        dir: dir.normalize(),
        approach,
      });
    }
    return hits;
  }

  /** Picks the approach direction in plan (unit vector from the hit point outward): closest to "away from the body", front half only, not crossing the torso. */
  private pickApproach(point: Vector3, hips: Vector3): Vector3 | null {
    const out = new Vector3(point.x - hips.x, 0, point.z - hips.z);
    const outAng = out.lengthSq() < 1e-4 ? 0 : Math.atan2(out.x, out.z);
    let best: { th: number; diff: number } | null = null;
    for (const th of APPROACH) {
      const dx = Math.sin(th);
      const dz = Math.cos(th);
      let ok = true;
      for (let s = 0.25; s <= 3 && ok; s += 0.1) {
        const x = point.x + dx * s - hips.x;
        const z = point.z + dz * s - hips.z;
        if (x * x + z * z < BODY_R * BODY_R) ok = false;
      }
      if (!ok) continue;
      const diff = Math.abs(angDiffRad(th, outAng));
      if (!best || diff < best.diff) best = { th, diff };
    }
    return best ? new Vector3(Math.sin(best.th), 0, Math.cos(best.th)) : null;
  }
}
