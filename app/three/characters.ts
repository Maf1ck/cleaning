import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import type { Mesh } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { CharacterId } from '#shared/content/services'
import { PALETTE, at, makeArm, makeFace, makeFoot, mat, mesh } from './parts'

export interface CharacterRig {
  id: CharacterId
  root: Group
  /** Squashes gently for the idle "breathing" */
  body: Group
  /** Arm that waves on greeting */
  waveArm: Group
  face: Group
  eyes: Mesh[]
  /** Point above the head the speech bubble is attached to */
  anchor: Object3D
  /** Extra idle motion (bubbles, hose sway); t in seconds */
  idle?: (t: number, amp: number) => void
}

function finish(id: CharacterId, body: Group, waveArm: Group, face: ReturnType<typeof makeFace>, anchorPos: [number, number, number], idle?: CharacterRig['idle']): CharacterRig {
  const root = new Group()
  root.name = `character-${id}`
  root.add(body)
  const anchor = new Object3D()
  anchor.position.set(...anchorPos)
  root.add(anchor)
  return { id, root, body, waveArm, face: face.group, eyes: face.eyes, anchor, idle }
}

/** Гудзя — canister vacuum: round body, bumper, lid with handle, hose and wand with a floor nozzle. */
function vacuum(): CharacterRig {
  const body = new Group()
  body.add(at(mesh(new CylinderGeometry(0.62, 0.66, 0.84, 56), mat(PALETTE.coral, 0.45)), 0, 0.6, 0))
  const lid = mesh(new SphereGeometry(0.62, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat(PALETTE.graphite, 0.4))
  lid.scale.y = 0.42
  body.add(at(lid, 0, 1.02, 0))
  const handle = mesh(new TorusGeometry(0.2, 0.045, 12, 32, Math.PI), mat(PALETTE.charcoal, 0.5))
  body.add(at(handle, 0, 1.2, 0))
  body.add(at(mesh(new TorusGeometry(0.665, 0.07, 14, 64), mat(PALETTE.charcoal, 0.7)), 0, 0.22, 0))
  body.children.at(-1)!.rotation.x = Math.PI / 2
  for (const [x, z] of [[0.42, 0.42], [-0.42, 0.42], [0.42, -0.42], [-0.42, -0.42]] as const) {
    body.add(at(mesh(new SphereGeometry(0.09, 16, 12), mat(PALETTE.charcoal, 0.6)), x, 0.09, z))
  }
  // Hose: from the side port up and over into the hand, then the metal wand to the floor nozzle.
  const port = at(mesh(new CylinderGeometry(0.09, 0.09, 0.1, 20), mat(PALETTE.charcoal)), 0.6, 0.86, 0.22)
  port.rotation.z = Math.PI / 2
  body.add(port)
  const hoseCurve = new CatmullRomCurve3([new Vector3(0.64, 0.86, 0.22), new Vector3(0.95, 1.15, 0.3), new Vector3(1.12, 0.98, 0.5), new Vector3(1.04, 0.78, 0.62)])
  body.add(mesh(new TubeGeometry(hoseCurve, 40, 0.055, 12, false), mat(PALETTE.graphite, 0.75)))
  const wandStart = new Vector3(1.04, 0.78, 0.62)
  const wandEnd = new Vector3(1.12, 0.13, 0.78)
  const wandLen = wandStart.distanceTo(wandEnd)
  const wand = mesh(new CylinderGeometry(0.032, 0.032, wandLen, 14), mat(PALETTE.steel, 0.25, 0.8))
  wand.position.copy(wandStart).add(wandEnd).multiplyScalar(0.5)
  wand.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), wandEnd.clone().sub(wandStart).normalize())
  body.add(wand)
  body.add(at(mesh(new RoundedBoxGeometry(0.46, 0.08, 0.2, 3, 0.03), mat(PALETTE.charcoal, 0.6)), 1.13, 0.06, 0.8))

  const face = makeFace(0.24, 1.15)
  at(face.group, 0, 0.72, 0.665)
  body.add(face.group)

  // Right arm holds the wand (static), left arm waves.
  body.add(makeArm([[0.6, 0.7, 0.18], [0.82, 0.62, 0.42], [0.98, 0.7, 0.6]]).pivot)
  const left = makeArm([[0, 0, 0], [-0.22, -0.12, 0.08], [-0.36, 0.02, 0.18]])
  at(left.pivot, -0.62, 0.74, 0.1)
  body.add(left.pivot)

  return finish('vacuum', body, left.pivot, face, [0.35, 1.55, 0.3])
}

/** Мопик — bucket with water, wire handle and a mop leaning in it. */
function bucket(): CharacterRig {
  const body = new Group()
  const h = 0.86
  const bucketMat = mat(PALETTE.sky, 0.4)
  const shell = mesh(new CylinderGeometry(0.62, 0.5, h, 56, 1, true), bucketMat)
  bucketMat.side = DoubleSide
  body.add(at(shell, 0, 0.12 + h / 2, 0))
  const bottom = mesh(new CircleGeometry(0.5, 40), bucketMat)
  bottom.rotation.x = -Math.PI / 2
  body.add(at(bottom, 0, 0.12, 0))
  const rim = mesh(new TorusGeometry(0.62, 0.04, 12, 64), mat('#e9f4fb', 0.4))
  rim.rotation.x = Math.PI / 2
  body.add(at(rim, 0, 0.12 + h, 0))
  const water = mesh(new CircleGeometry(0.6, 40), mat(PALETTE.water, 0.15, 0, { transparent: true, opacity: 0.9 }), false)
  water.rotation.x = -Math.PI / 2
  body.add(at(water, 0, 0.12 + h - 0.1, 0))
  for (const [x, z, r] of [[0.2, 0.15, 0.07], [0.3, 0.05, 0.05], [-0.25, -0.2, 0.06], [-0.1, 0.3, 0.045]] as const) {
    body.add(at(mesh(new SphereGeometry(r, 14, 10), mat('#ffffff', 0.2, 0, { transparent: true, opacity: 0.85 }), false), x, 0.12 + h - 0.08, z))
  }
  // Wire handle tilted back so it never covers the face.
  const handleGroup = new Group()
  const handle = mesh(new TorusGeometry(0.6, 0.02, 8, 48, Math.PI), mat(PALETTE.steel, 0.3, 0.7))
  handleGroup.add(handle)
  handleGroup.rotation.x = -0.95
  body.add(at(handleGroup, 0, 0.12 + h - 0.05, 0))
  // Mop: stick and strands spilling over the rim on the right.
  const stick = mesh(new CylinderGeometry(0.035, 0.035, 1.75, 14), mat(PALETTE.wood, 0.6))
  stick.rotation.z = -0.32
  stick.rotation.x = -0.12
  body.add(at(stick, 0.38, 1.25, -0.12))
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.22
    const strand = mesh(new CapsuleGeometry(0.04, 0.26, 4, 8), mat('#e8e4da', 0.9))
    strand.position.set(Math.cos(a) * 0.6, 0.12 + h - 0.06, Math.sin(a) * 0.6)
    strand.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9)
    if (Math.cos(a) > 0.2) body.add(strand)
  }

  const face = makeFace(0.24, 1.15)
  face.group.rotation.x = 0.13
  at(face.group, 0, 0.56, 0.565)
  body.add(face.group)

  body.add(makeFoot(-0.22, 0.32))
  body.add(makeFoot(0.22, 0.32))

  const right = makeArm([[0.54, 0.62, 0.12], [0.7, 0.72, 0.18], [0.66, 0.98, 0.06]], PALETTE.graphite)
  body.add(right.pivot)
  const left = makeArm([[0, 0, 0], [-0.22, -0.1, 0.08], [-0.34, 0.04, 0.18]])
  at(left.pivot, -0.55, 0.62, 0.1)
  body.add(left.pivot)

  return finish('bucket', body, left.pivot, face, [0.1, 1.45, 0.3])
}

/** Пшик — spray bottle: lathe bottle, label, trigger head with nozzle and trigger. */
function spray(): CharacterRig {
  const body = new Group()
  const profile = [
    [0, 0.08],
    [0.42, 0.08],
    [0.47, 0.14],
    [0.48, 0.86],
    [0.42, 1.0],
    [0.24, 1.12],
    [0.2, 1.18],
    [0.2, 1.24],
    [0, 1.24],
  ].map(([x, y]) => new Vector2(x, y))
  body.add(mesh(new LatheGeometry(profile, 56), mat(PALETTE.mint, 0.35)))
  body.add(at(mesh(new CylinderGeometry(0.485, 0.485, 0.42, 56, 1, true), mat(PALETTE.label, 0.7)), 0, 0.5, 0))
  // Trigger head
  const head = new Group()
  head.add(at(mesh(new RoundedBoxGeometry(0.62, 0.26, 0.3, 4, 0.08), mat(PALETTE.coral, 0.45)), 0.1, 0, 0))
  const nozzle = mesh(new CylinderGeometry(0.05, 0.06, 0.16, 16), mat(PALETTE.charcoal, 0.5))
  nozzle.rotation.z = Math.PI / 2
  head.add(at(nozzle, 0.47, 0.02, 0))
  const tip = mesh(new TorusGeometry(0.05, 0.015, 8, 20), mat(PALETTE.charcoal))
  tip.rotation.y = Math.PI / 2
  head.add(at(tip, 0.555, 0.02, 0))
  const trigger = mesh(new RoundedBoxGeometry(0.07, 0.3, 0.14, 3, 0.03), mat(PALETTE.coral, 0.5))
  trigger.rotation.z = 0.35
  head.add(at(trigger, 0.3, -0.2, 0))
  body.add(at(head, 0, 1.36, 0))
  body.add(at(mesh(new CylinderGeometry(0.22, 0.22, 0.1, 32), mat(PALETTE.charcoal, 0.5)), 0, 1.24, 0))

  const face = makeFace(0.24, 1.1)
  at(face.group, 0, 0.52, 0.49)
  body.add(face.group)
  body.add(makeFoot(-0.2, 0.28))
  body.add(makeFoot(0.2, 0.28))

  const right = makeArm([[0.46, 0.7, 0.1], [0.62, 0.55, 0.2], [0.66, 0.38, 0.28]])
  body.add(right.pivot)
  const left = makeArm([[0, 0, 0], [-0.2, -0.1, 0.08], [-0.32, 0.04, 0.18]])
  at(left.pivot, -0.47, 0.72, 0.08)
  body.add(left.pivot)

  return finish('spray', body, left.pivot, face, [0.55, 1.6, 0.2])
}

/** Скрипик — window squeegee: chunky grip body, metal neck, T-shaped blade on top. */
function squeegee(): CharacterRig {
  const body = new Group()
  body.add(at(mesh(new CapsuleGeometry(0.34, 0.66, 8, 40), mat(PALETTE.sun, 0.45)), 0, 0.78, 0))
  for (const y of [0.42, 1.14]) {
    const ring = mesh(new TorusGeometry(0.335, 0.035, 10, 48), mat(PALETTE.charcoal, 0.7))
    ring.rotation.x = Math.PI / 2
    body.add(at(ring, 0, y, 0))
  }
  body.add(at(mesh(new CylinderGeometry(0.06, 0.08, 0.3, 16), mat(PALETTE.steel, 0.25, 0.8)), 0, 1.42, 0))
  body.add(at(mesh(new RoundedBoxGeometry(1.5, 0.14, 0.16, 3, 0.05), mat(PALETTE.steel, 0.25, 0.8)), 0, 1.6, 0))
  body.add(at(mesh(new RoundedBoxGeometry(1.46, 0.08, 0.05, 2, 0.02), mat(PALETTE.charcoal, 0.8)), 0, 1.7, 0))

  const face = makeFace(0.22, 1.05)
  at(face.group, 0, 0.86, 0.345)
  body.add(face.group)
  body.add(makeFoot(-0.17, 0.2))
  body.add(makeFoot(0.17, 0.2))

  const right = makeArm([[0.33, 0.78, 0.06], [0.52, 0.66, 0.14], [0.6, 0.48, 0.22]])
  body.add(right.pivot)
  const left = makeArm([[0, 0, 0], [-0.2, -0.1, 0.08], [-0.32, 0.04, 0.16]])
  at(left.pivot, -0.33, 0.8, 0.06)
  body.add(left.pivot)

  return finish('squeegee', body, left.pivot, face, [0.62, 1.85, 0.1])
}

/** Пухлик — two-layer kitchen sponge with pores and floating soap bubbles. */
function sponge(): CharacterRig {
  const body = new Group()
  body.add(at(mesh(new RoundedBoxGeometry(1.12, 0.76, 0.62, 5, 0.14), mat(PALETTE.sponge, 0.85)), 0, 0.5, 0))
  body.add(at(mesh(new RoundedBoxGeometry(1.12, 0.18, 0.62, 4, 0.07), mat(PALETTE.scrub, 0.95)), 0, 0.96, 0))
  // Pores away from the face area
  const pore = new CircleGeometry(1, 16)
  const poreMat = mat('#d9a52f', 0.9)
  const pores: [number, number, number][] = [[-0.42, 0.75, 0.05], [-0.38, 0.3, 0.04], [0.4, 0.28, 0.05], [0.44, 0.72, 0.035], [-0.2, 0.2, 0.03], [0.22, 0.18, 0.035], [-0.47, 0.52, 0.03]]
  for (const [x, y, r] of pores) {
    const p = mesh(pore, poreMat, false)
    p.scale.setScalar(r)
    body.add(at(p, x, y, 0.311))
  }
  const face = makeFace(0.26, 1.2)
  at(face.group, 0, 0.56, 0.315)
  body.add(face.group)
  body.add(makeFoot(-0.25, 0.22))
  body.add(makeFoot(0.25, 0.22))

  const right = makeArm([[0.56, 0.5, 0.05], [0.74, 0.42, 0.14], [0.8, 0.28, 0.22]])
  body.add(right.pivot)
  const left = makeArm([[0, 0, 0], [-0.2, -0.1, 0.08], [-0.32, 0.04, 0.18]])
  at(left.pivot, -0.56, 0.55, 0.05)
  body.add(left.pivot)

  const bubbles = new Group()
  const bubbleMat = new MeshStandardMaterial({ color: '#f2fbff', emissive: '#bfe6ff', emissiveIntensity: 0.35, roughness: 0.05, transparent: true, opacity: 0.55 })
  const bubbleData: [number, number, number, number][] = [[0.75, 1.25, 0.1, 0.09], [0.95, 1.05, -0.1, 0.06], [-0.8, 1.2, 0.05, 0.07], [0.6, 1.5, -0.15, 0.05]]
  for (const [x, y, z, r] of bubbleData) bubbles.add(at(mesh(new SphereGeometry(r, 20, 14), bubbleMat, false), x, y, z))
  body.add(bubbles)

  const idle = (t: number, amp: number): void => {
    bubbles.children.forEach((b, i) => {
      const base = bubbleData[i]
      if (base) b.position.y = base[1] + Math.sin(t * 1.3 + i * 1.7) * 0.06 * amp
    })
  }

  return finish('sponge', body, left.pivot, face, [0.25, 1.3, 0.3], idle)
}

const BUILDERS: Record<CharacterId, () => CharacterRig> = { vacuum, bucket, spray, squeegee, sponge }

export function buildCharacter(id: CharacterId): CharacterRig {
  return BUILDERS[id]()
}

export const CHARACTER_IDS: CharacterId[] = ['vacuum', 'bucket', 'spray', 'squeegee', 'sponge']
