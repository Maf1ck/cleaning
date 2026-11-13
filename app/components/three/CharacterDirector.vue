<template lang="pug">
primitive(:object="world")
</template>

<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { Box3, CircleGeometry, Color, DirectionalLight, Group, HemisphereLight, Mesh, MeshStandardMaterial, PMREMGenerator, ShadowMaterial, Vector3 } from 'three'
import type { Material, WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { CharacterId } from '#shared/content/services'
import { CHARACTER_IDS, buildCharacter } from '~/three/characters'
import type { CharacterRig } from '~/three/characters'

export interface BubblePoint {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
}

const props = defineProps<{
  active: CharacterId
  faces: boolean
  amp: number
  reduced: boolean
  paused: boolean
  groundColor: string
  onBubble: (p: BubblePoint) => void
}>()

const { camera, sizes, invalidate, renderer, scene } = useTres()
const { onBeforeRender, stop, start } = useLoop()

// --- World: lights, ground, all characters prepared up-front so switching is instant.
const world = new Group()
world.name = 'stage'

const hemi = new HemisphereLight('#ffffff', '#b9b2a2', 1.1)
world.add(hemi)
const sun = new DirectionalLight('#ffffff', 2.1)
sun.position.set(2.6, 6, 4)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.camera.left = -2.4
sun.shadow.camera.right = 2.4
sun.shadow.camera.top = 2.4
sun.shadow.camera.bottom = -2.4
sun.shadow.camera.near = 1
sun.shadow.camera.far = 14
sun.shadow.bias = -0.0005
sun.shadow.normalBias = 0.02
world.add(sun)

const podiumMat = new MeshStandardMaterial({ color: new Color(props.groundColor), roughness: 0.95 })
const podium = new Mesh(new CircleGeometry(1.55, 64), podiumMat)
podium.rotation.x = -Math.PI / 2
podium.position.y = -0.002
podium.receiveShadow = true
world.add(podium)
const shadowCatcher = new Mesh(new CircleGeometry(3, 48), new ShadowMaterial({ opacity: 0.18 }))
shadowCatcher.rotation.x = -Math.PI / 2
shadowCatcher.receiveShadow = true
world.add(shadowCatcher)

interface RigState {
  rig: CharacterRig
  x: number
  v: number
  greetAt: number
  nextBlink: number
  blinkUntil: number
}

const states: RigState[] = CHARACTER_IDS.map((id) => {
  const rig = buildCharacter(id)
  // Centre each character on the podium by its own bounding box.
  rig.root.updateMatrixWorld(true)
  const box = new Box3().setFromObject(rig.body)
  rig.body.position.x = -(box.min.x + box.max.x) / 2
  rig.root.visible = false
  rig.root.scale.setScalar(0.0001)
  world.add(rig.root)
  return { rig, x: 0, v: 0, greetAt: -10, nextBlink: 2 + Math.random() * 3, blinkUntil: 0 }
})

let clock = 0
const tmp = new Vector3()
const toCam = new Vector3()
let lastBubble: BubblePoint = { x: 0, y: 0, width: 0, height: 0, visible: false }

function applyFaces(): void {
  for (const s of states) s.rig.face.visible = props.faces
  invalidate()
}
applyFaces()
watch(() => props.faces, applyFaces)

watch(
  () => props.active,
  () => {
    const s = states.find((st) => st.rig.id === props.active)
    if (s) s.greetAt = clock
    invalidate()
  },
)

watch(
  () => props.groundColor,
  (c) => {
    podiumMat.color.set(c)
    invalidate()
  },
)

watch(
  () => props.paused,
  (p) => (p ? stop() : start()),
)

// Image-based lighting from a procedural room (no external HDR files).
if (!scene.value.environment) {
  const pmrem = new PMREMGenerator(renderer as WebGLRenderer)
  scene.value.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.value.environmentIntensity = 0.55
  pmrem.dispose()
}

function step(s: RigState, dt: number): void {
  const target = s.rig.id === props.active ? 1 : 0
  if (props.reduced) {
    s.x = target
    s.v = 0
  } else {
    // Critically-damped-ish spring: interrupt-safe for fast repeated switching.
    const k = 140
    const c = 16
    s.v += (k * (target - s.x) - c * s.v) * dt
    s.x += s.v * dt
    if (target === 0 && s.x < 0.002 && Math.abs(s.v) < 0.01) s.x = 0
  }
  const root = s.rig.root
  const visible = s.x > 0.002
  root.visible = visible
  if (!visible) return
  const scale = Math.max(0.0001, s.x)
  root.scale.setScalar(scale)
  root.position.y = (1 - Math.min(1, s.x)) * -0.25
  root.rotation.y = (1 - Math.min(1, s.x)) * 0.9

  const amp = props.reduced ? 0 : props.amp
  const body = s.rig.body
  const breath = Math.sin(clock * 2.1) * 0.012 * amp
  body.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5)
  body.rotation.z = Math.sin(clock * 0.8) * 0.02 * amp

  // Greeting wave, ~1.8 s after the character appears.
  const since = clock - s.greetAt
  const arm = s.rig.waveArm
  if (amp > 0 && since >= 0 && since < 1.8) {
    const env = Math.sin((Math.PI * since) / 1.8)
    arm.rotation.z = -env * (1.15 + Math.sin(since * 10) * 0.3)
  } else {
    arm.rotation.z += (0 - arm.rotation.z) * Math.min(1, dt * 8)
  }

  // Rare blink
  if (props.faces && amp > 0) {
    if (clock > s.nextBlink) {
      s.blinkUntil = clock + 0.13
      s.nextBlink = clock + 3 + Math.random() * 5
    }
    const closed = clock < s.blinkUntil
    for (const eye of s.rig.eyes) eye.scale.y = closed ? 0.15 : 1.25
  }
  s.rig.idle?.(clock, amp)
}

function reportBubble(): void {
  const active = states.find((s) => s.rig.id === props.active)
  const cam = camera.value
  if (!active || !cam) return
  active.rig.anchor.getWorldPosition(tmp)
  // Hide the line when the character faces away from the camera.
  toCam.copy(cam.position).sub(active.rig.root.position).setY(0).normalize()
  const facing = toCam.z > 0.15
  tmp.project(cam)
  const width = sizes.width.value
  const height = sizes.height.value
  const next: BubblePoint = {
    x: ((tmp.x + 1) / 2) * width,
    y: ((1 - tmp.y) / 2) * height,
    width,
    height,
    visible: facing && active.x > 0.85,
  }
  if (Math.abs(next.x - lastBubble.x) > 0.5 || Math.abs(next.y - lastBubble.y) > 0.5 || next.visible !== lastBubble.visible || next.width !== lastBubble.width) {
    lastBubble = next
    props.onBubble(next)
  }
}

onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, 1 / 20)
  clock += dt
  for (const s of states) step(s, dt)
  reportBubble()
})

onBeforeUnmount(() => {
  world.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.geometry.dispose()
      const m = obj.material as Material | Material[]
      if (Array.isArray(m)) m.forEach((x) => x.dispose())
      else m.dispose()
    }
  })
  scene.value.environment?.dispose()
})
</script>
