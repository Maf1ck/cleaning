import {
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import type { BufferGeometry, Material, Object3D } from 'three'

/** Palette of the characters. Chosen to read well on light and dark backgrounds. */
export const PALETTE = {
  coral: '#ee8366',
  sun: '#f2b33d',
  sponge: '#f6c453',
  mint: '#8fd3b5',
  sky: '#5ba4d9',
  water: '#9fd6f2',
  scrub: '#3e9c6e',
  charcoal: '#2d3532',
  graphite: '#46524d',
  steel: '#c9d1ce',
  wood: '#c89b6d',
  glove: '#f7f5ef',
  label: '#fbfaf6',
  eye: '#1d2320',
  cheek: '#f29c8a',
} as const

const materialCache = new Map<string, MeshStandardMaterial>()

export function mat(color: string, roughness = 0.55, metalness = 0, extra: { transparent?: boolean; opacity?: number } = {}): MeshStandardMaterial {
  const key = `${color}|${roughness}|${metalness}|${extra.opacity ?? 1}`
  let m = materialCache.get(key)
  if (!m) {
    m = new MeshStandardMaterial({ color: new Color(color), roughness, metalness, ...extra })
    materialCache.set(key, m)
  }
  return m
}

export function mesh(geometry: BufferGeometry, material: Material, shadow = true): Mesh {
  const m = new Mesh(geometry, material)
  m.castShadow = shadow
  m.receiveShadow = shadow
  return m
}

export function at<T extends Object3D>(obj: T, x: number, y: number, z: number): T {
  obj.position.set(x, y, z)
  return obj
}

export interface Face {
  group: Group
  eyes: Mesh[]
}

/** Friendly, low-detail face: small round eyes with glints, a soft smile, cheeks. */
export function makeFace(spacing = 0.2, scale = 1): Face {
  const group = new Group()
  group.name = 'face'
  const eyes: Mesh[] = []
  const eyeGeo = new SphereGeometry(0.055 * scale, 20, 16)
  const glintGeo = new SphereGeometry(0.016 * scale, 10, 8)
  for (const side of [-1, 1]) {
    const eye = mesh(eyeGeo, mat(PALETTE.eye, 0.25), false)
    eye.scale.set(1, 1.25, 0.55)
    at(eye, (side * spacing) / 2, 0.04 * scale, 0)
    const glint = mesh(glintGeo, mat('#ffffff', 0.2), false)
    at(glint, 0.018 * scale, 0.024 * scale, 0.03 * scale)
    eye.add(glint)
    group.add(eye)
    eyes.push(eye)

    const cheek = mesh(new CircleGeometry(0.045 * scale, 20), mat(PALETTE.cheek, 0.8, 0, { transparent: true, opacity: 0.55 }), false)
    at(cheek, side * (spacing / 2 + 0.06 * scale), -0.05 * scale, 0.002)
    group.add(cheek)
  }
  const arc = Math.PI * 0.62
  const smile = mesh(new TorusGeometry(0.06 * scale, 0.012 * scale, 8, 24, arc), mat(PALETTE.eye, 0.4), false)
  smile.rotation.z = -Math.PI / 2 - arc / 2
  at(smile, 0, -0.03 * scale, 0)
  smile.scale.set(1, 0.8, 0.5)
  group.add(smile)
  return { group, eyes }
}

export interface Arm {
  pivot: Group
  hand: Mesh
}

/**
 * Arm as a tube from the shoulder pivot outward, ending in a mitten. The pivot sits on
 * the body surface and every control point lies outside the body, so rotating the
 * pivot up for a wave keeps the arm clear of the body.
 */
export function makeArm(points: [number, number, number][], color: string = PALETTE.graphite, radius = 0.045): Arm {
  const pivot = new Group()
  pivot.name = 'arm'
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)))
  const tube = mesh(new TubeGeometry(curve, 24, radius, 10, false), mat(color, 0.5))
  pivot.add(tube)
  const end = curve.getPoint(1)
  const hand = mesh(new SphereGeometry(radius * 2.3, 20, 16), mat(PALETTE.glove, 0.6))
  hand.scale.set(1, 0.9, 0.85)
  hand.position.copy(end)
  pivot.add(hand)
  const shoulder = mesh(new SphereGeometry(radius * 1.2, 12, 10), mat(color, 0.5))
  pivot.add(shoulder)
  return { pivot, hand }
}

export function makeFoot(x: number, z: number, color: string = PALETTE.charcoal): Mesh {
  const foot = mesh(new SphereGeometry(0.13, 20, 14), mat(color, 0.6))
  foot.scale.set(1, 0.5, 1.35)
  return at(foot, x, 0.06, z)
}
