import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TetrahedronGeometry,
  Vector3,
  type Camera,
  type Object3D,
} from "three";
import type { BallLabel } from "@/content/types";

/*
 * Balls, shards, shock rings and "+1" pops.
 *
 * Everything that owns GPU memory (geometries, canvas textures, materials) is
 * created by `createBallKit` and released by `kit.dispose()` — nothing lives at
 * module level. The module stays cached after the first load, so a module-level
 * texture would outlive a disposed renderer (StrictMode remount, theme switch,
 * reduced-motion toggle) and silently point at freed GPU objects.
 */

const RADIUS = 0.32;
const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3(0, 0, 1);

interface LabelAssets {
  ball: MeshStandardMaterial;
  shard: MeshStandardMaterial;
  glow: SpriteMaterial;
}

export interface BallKit {
  scene: Object3D;
  ballGeo: SphereGeometry;
  shardGeo: TetrahedronGeometry;
  ringGeo: RingGeometry;
  glowMap: CanvasTexture;
  assetsFor(label: BallLabel): LabelAssets;
  dispose(): void;
}

function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return { canvas, ctx };
}

function shade(hex: string, lightness: number): string {
  const color = new Color(hex);
  color.offsetHSL(0, 0, lightness);
  return `#${color.getHexString()}`;
}

/** 512x256 is enough: a ball is ~60 CSS px on screen, and the caption covers half the sphere. */
function ballTexture(label: BallLabel): CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 256);
  // +Z of a three.js sphere faces u = 0.25, so the caption is drawn at x = 128.
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, label.background);
  gradient.addColorStop(1, shade(label.background, -0.35));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);
  const size = label.text.length <= 2 ? 95 : label.text.length <= 4 ? 70 : 54;
  ctx.font = `800 ${size}px system-ui, "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = label.foreground;
  ctx.fillText(label.text, 128, 131);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function glowTexture(): CanvasTexture {
  const { canvas, ctx } = makeCanvas(64, 64);
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,.9)");
  gradient.addColorStop(0.35, "rgba(255,255,255,.25)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

function popSprite(text: string, color: string): Sprite {
  const { canvas, ctx } = makeCanvas(256, 64);
  ctx.font = "800 36px system-ui, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.strokeText(text, 128, 32);
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 32);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return new Sprite(new SpriteMaterial({ map, transparent: true, depthTest: false }));
}

export function createBallKit(scene: Object3D, labels: readonly BallLabel[]): BallKit {
  // Geometry detail is tuned for a ~60 px ball: 24x16 segments look identical to 40x28 there.
  const ballGeo = new SphereGeometry(RADIUS, 24, 16);
  const shardGeo = new TetrahedronGeometry(1, 0);
  const ringGeo = new RingGeometry(0.85, 1, 32);
  const glowMap = glowTexture();
  const byLabel = new Map<string, LabelAssets>();

  for (const label of labels) {
    const map = ballTexture(label);
    byLabel.set(label.text, {
      ball: new MeshStandardMaterial({
        map,
        roughness: 0.32,
        metalness: 0.05,
        emissive: 0xffffff,
        emissiveMap: map,
        emissiveIntensity: 0.35,
      }),
      shard: new MeshStandardMaterial({
        color: label.background,
        roughness: 0.4,
        emissive: label.background,
        emissiveIntensity: 0.4,
        flatShading: true,
      }),
      glow: new SpriteMaterial({
        map: glowMap,
        color: label.background,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    });
  }

  return {
    scene,
    ballGeo,
    shardGeo,
    ringGeo,
    glowMap,
    assetsFor(label) {
      const assets = byLabel.get(label.text);
      if (!assets) throw new Error(`No assets for label "${label.text}"`);
      return assets;
    },
    dispose() {
      ballGeo.dispose();
      shardGeo.dispose();
      ringGeo.dispose();
      glowMap.dispose();
      for (const assets of byLabel.values()) {
        assets.ball.map?.dispose(); // emissiveMap is the same texture
        assets.ball.dispose();
        assets.shard.dispose();
        assets.glow.dispose();
      }
      byLabel.clear();
    },
  };
}

/** A flying ball. The path is deterministic: `start` to `end` during [t0, hitAt]; hidden before t0. */
export class Ball {
  readonly mesh = new Group();
  private readonly body: Mesh;
  private readonly inCamera = new Vector3();

  constructor(
    kit: BallKit,
    readonly label: BallLabel,
    private readonly start: Vector3,
    private readonly end: Vector3,
    private readonly t0: number,
    readonly hitAt: number,
    readonly dir: Vector3,
  ) {
    const assets = kit.assetsFor(label);
    this.body = new Mesh(kit.ballGeo, assets.ball);
    const glow = new Sprite(assets.glow);
    glow.scale.setScalar(RADIUS * 5);
    this.mesh.add(this.body, glow);
    this.mesh.position.copy(start);
    this.mesh.visible = false;
  }

  update(now: number, camera: Camera): void {
    this.mesh.visible = now >= this.t0;
    const k = MathUtils.clamp((now - this.t0) / (this.hitAt - this.t0), 0, 1);
    this.mesh.position.lerpVectors(this.start, this.end, k);
    this.mesh.position.y += Math.sin(k * Math.PI) * 0.35; // slight arc, zero at the end
    this.body.lookAt(camera.position); // the caption always faces the viewer
    this.body.rotateZ(Math.sin(now * 2 + this.t0) * 0.25);
    // Far from the optical axis (balls start at the screen edge, ~60 deg off-axis) perspective stretches a
    // sphere into an ellipse along the radius by 1/cos(angle). Squashing it by cos(angle) cancels that.
    this.inCamera.copy(this.mesh.position).applyMatrix4(camera.matrixWorldInverse);
    this.body.scale.x = Math.max(0.45, Math.cos(Math.atan2(Math.abs(this.inCamera.x), Math.abs(this.inCamera.z))));
  }
}

interface Shard {
  mesh: Mesh;
  velocity: Vector3;
  base: number;
  stretch: number;
  life: number;
  age: number;
  spin: Vector3;
}

interface Ring {
  object: Mesh<RingGeometry, MeshBasicMaterial> | Sprite;
  age: number;
  flash: boolean;
}

interface Pop {
  sprite: Sprite;
  age: number;
}

/** Shards, shock wave, flash and the floating "+1 JS" text. */
export class Fx {
  private readonly shards: Shard[] = [];
  private readonly rings: Ring[] = [];
  private readonly pops: Pop[] = [];
  /** Camera-shake amplitude; decays exponentially. */
  shake = 0;

  constructor(private readonly kit: BallKit) {}

  shatter(ball: Ball): void {
    const { kit } = this;
    const { scene } = kit;
    const assets = kit.assetsFor(ball.label);
    const dir = ball.dir;
    const origin = ball.mesh.position.clone();

    // 24 shards (was 34): the burst reads the same, and it is 30% fewer draw calls while it lasts.
    for (let i = 0; i < 24; i++) {
      const mesh = new Mesh(kit.shardGeo, assets.shard);
      const size = RADIUS * (0.18 + Math.random() * 0.32);
      const stretch = 0.5 + Math.random();
      mesh.scale.set(size, size * stretch, size);
      mesh.position.copy(origin).addScaledVector(new Vector3().randomDirection(), RADIUS * 0.5);
      const velocity = new Vector3()
        .randomDirection()
        .multiplyScalar(2.2)
        .addScaledVector(dir, 2.5 + Math.random() * 3.5)
        .add(new Vector3(0, 1.8, 0));
      // The camera looks along X: a shard flying toward it would balloon on screen, so damp that axis.
      velocity.x *= 0.3;
      this.shards.push({
        mesh,
        velocity,
        base: size,
        stretch,
        life: 1.3 + Math.random() * 0.9,
        age: 0,
        spin: new Vector3().randomDirection().multiplyScalar(6 + Math.random() * 10),
      });
      scene.add(mesh);
    }

    // shock wave
    const ring = new Mesh(
      kit.ringGeo,
      new MeshBasicMaterial({
        color: ball.label.background,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    ring.position.copy(origin);
    ring.quaternion.setFromUnitVectors(FORWARD, dir.lengthSq() ? dir.clone().normalize() : UP);
    scene.add(ring);
    this.rings.push({ object: ring, age: 0, flash: false });

    // flash (own material: its opacity is animated; the glow texture stays shared)
    const flash = new Sprite(assets.glow.clone());
    flash.position.copy(origin);
    flash.scale.setScalar(0.1);
    flash.material.color.set("#ffffff");
    scene.add(flash);
    this.rings.push({ object: flash, age: 0, flash: true });

    // "+1 JS"
    const sprite = popSprite(`+1 ${ball.label.text}`, ball.label.background);
    sprite.position.copy(origin).add(new Vector3(0, 0.5, 0));
    sprite.scale.set(1.4, 0.35, 1);
    sprite.renderOrder = 10;
    scene.add(sprite);
    this.pops.push({ sprite, age: 0 });

    this.shake = Math.min(0.07, this.shake + 0.045);
  }

  update(dt: number): void {
    const { scene } = this.kit;

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      if (!s) continue;
      s.age += dt;
      s.velocity.y -= 9.8 * dt;
      s.mesh.position.addScaledVector(s.velocity, dt);
      if (s.mesh.position.y < 0.03) {
        // bounce off the floor
        s.mesh.position.y = 0.03;
        s.velocity.y *= -0.35;
        s.velocity.x *= 0.7;
        s.velocity.z *= 0.7;
        s.spin.multiplyScalar(0.6);
      }
      s.mesh.rotation.x += s.spin.x * dt;
      s.mesh.rotation.y += s.spin.y * dt;
      s.mesh.rotation.z += s.spin.z * dt;
      const fade = MathUtils.clamp((s.life - s.age) / 0.45, 0, 1);
      s.mesh.scale.set(s.base * fade, s.base * fade * s.stretch, s.base * fade); // shrink before vanishing
      if (s.age >= s.life) {
        scene.remove(s.mesh);
        this.shards.splice(i, 1);
      }
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      if (!r) continue;
      r.age += dt;
      const k = r.age / (r.flash ? 0.22 : 0.5);
      r.object.scale.setScalar(r.flash ? 0.1 + k * 1.6 : 0.2 + k * 1.5);
      r.object.material.opacity = r.flash ? 1 - k : 0.9 * (1 - k);
      if (k >= 1) {
        scene.remove(r.object);
        r.object.material.dispose();
        this.rings.splice(i, 1);
      }
    }

    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      if (!p) continue;
      p.age += dt;
      p.sprite.position.y += dt * 0.8;
      p.sprite.material.opacity = 1 - MathUtils.smoothstep(p.age, 0.5, 1.1);
      if (p.age > 1.1) {
        scene.remove(p.sprite);
        p.sprite.material.map?.dispose();
        p.sprite.material.dispose();
        this.pops.splice(i, 1);
      }
    }

    this.shake *= Math.exp(-dt * 9);
  }

  /** Frees what only live effects own (their own materials and caption textures). */
  dispose(): void {
    for (const r of this.rings) r.object.material.dispose();
    for (const p of this.pops) {
      p.sprite.material.map?.dispose();
      p.sprite.material.dispose();
    }
    this.shards.length = 0;
    this.rings.length = 0;
    this.pops.length = 0;
  }
}
