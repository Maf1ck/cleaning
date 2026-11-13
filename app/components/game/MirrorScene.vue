<template lang="pug">
primitive(:object="group")
</template>

<script setup lang="ts">
import { useTres } from '@tresjs/core'
import {
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  Raycaster,
  SRGBColorSpace,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from 'three'
import type { Material, WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const props = defineProps<{
  mode: 'clean' | 'rotate'
  onProgress: (value: number) => void
}>()

const { camera, renderer, scene, invalidate } = useTres()

// --- Stain mask: a canvas mapped onto the glass by UV. Erasing paints alpha out.
const SIZE = 512
const stainCanvas = document.createElement('canvas')
stainCanvas.width = SIZE
stainCanvas.height = SIZE
const ctx = stainCanvas.getContext('2d', { willReadFrequently: false })
const probe = document.createElement('canvas')
probe.width = 64
probe.height = 64
const probeCtx = probe.getContext('2d', { willReadFrequently: true })
const texture = new CanvasTexture(stainCanvas)
texture.colorSpace = SRGBColorSpace

let initialAlpha = 1

function alphaSum(): number {
  if (!probeCtx) return 0
  probeCtx.clearRect(0, 0, 64, 64)
  probeCtx.drawImage(stainCanvas, 0, 0, 64, 64)
  const data = probeCtx.getImageData(0, 0, 64, 64).data
  let sum = 0
  for (let i = 3; i < data.length; i += 4) sum += data[i] ?? 0
  return sum
}

function paintStains(): void {
  if (!ctx) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, SIZE, SIZE)
  const colors = ['rgba(120, 96, 64, ', 'rgba(150, 140, 120, ', 'rgba(96, 110, 100, ', 'rgba(170, 150, 110, ']
  for (let i = 0; i < 16; i++) {
    // Keep stains inside the round glass (UV circle centred at 0.5).
    const a = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * SIZE * 0.36
    const x = SIZE / 2 + Math.cos(a) * r
    const y = SIZE / 2 + Math.sin(a) * r
    const radius = 22 + Math.random() * 46
    const color = colors[i % colors.length] ?? colors[0]!
    const g = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius)
    g.addColorStop(0, `${color}0.85)`)
    g.addColorStop(0.6, `${color}0.55)`)
    g.addColorStop(1, `${color}0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(x, y, radius, radius * (0.6 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  // A few drips
  for (let i = 0; i < 5; i++) {
    const x = SIZE * (0.25 + Math.random() * 0.5)
    const y = SIZE * (0.2 + Math.random() * 0.3)
    ctx.fillStyle = 'rgba(110, 120, 110, 0.45)'
    ctx.fillRect(x, y, 6 + Math.random() * 4, 60 + Math.random() * 80)
  }
  texture.needsUpdate = true
  initialAlpha = Math.max(1, alphaSum())
  props.onProgress(0)
  invalidate()
}

// --- Object: round bathroom mirror with a wooden frame and a back plate.
const group = new Group()
const mirror = new Group()
mirror.position.y = 1.05
group.add(mirror)

const glassMat = new MeshStandardMaterial({ color: '#dfe9ee', metalness: 1, roughness: 0.06 })
const glass = new Mesh(new CircleGeometry(0.96, 96), glassMat)
mirror.add(glass)

const stainMat = new MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.9, depthWrite: false })
const stains = new Mesh(new CircleGeometry(0.96, 96), stainMat)
stains.position.z = 0.004
stains.renderOrder = 1
mirror.add(stains)

const frameMat = new MeshStandardMaterial({ color: '#c89b6d', roughness: 0.55 })
const frame = new Mesh(new TorusGeometry(1, 0.085, 24, 96), frameMat)
frame.castShadow = true
mirror.add(frame)

const back = new Mesh(new CylinderGeometry(1.02, 1.02, 0.06, 64), new MeshStandardMaterial({ color: '#46524d', roughness: 0.7 }))
back.rotation.x = Math.PI / 2
back.position.z = -0.045
mirror.add(back)

const hook = new Mesh(new SphereGeometry(0.06, 16, 12), new MeshStandardMaterial({ color: '#c9d1ce', metalness: 0.8, roughness: 0.3 }))
hook.position.set(0, 1.12, -0.03)
mirror.add(hook)

group.add(new HemisphereLight('#ffffff', '#b9b2a2', 1))
const light = new DirectionalLight('#ffffff', 1.8)
light.position.set(2, 4, 5)
group.add(light)

if (!scene.value.environment) {
  const pmrem = new PMREMGenerator(renderer as WebGLRenderer)
  scene.value.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
}

paintStains()

// --- Input: raycast pointer → UV on the stain layer, but only if the stain layer is the
// first hit (the frame and the back plate occlude it when the mirror is rotated).
const raycaster = new Raycaster()
const ndc = new Vector2()
const occluders = [frame, back, stains]
let drawing = false
let lastProbe = 0
let done = false

function eraseAt(clientX: number, clientY: number): void {
  const cam = camera.value
  const el = (renderer as WebGLRenderer).domElement
  if (!cam || !ctx) return
  const rect = el.getBoundingClientRect()
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(ndc, cam)
  const hit = raycaster.intersectObjects(occluders, false)[0]
  if (!hit || hit.object !== stains || !hit.uv) return
  const x = hit.uv.x * SIZE
  const y = (1 - hit.uv.y) * SIZE
  const brush = 28
  ctx.globalCompositeOperation = 'destination-out'
  const g = ctx.createRadialGradient(x, y, 0, x, y, brush)
  g.addColorStop(0, 'rgba(0,0,0,0.9)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, brush, 0, Math.PI * 2)
  ctx.fill()
  texture.needsUpdate = true
  invalidate()
  const now = performance.now()
  if (now - lastProbe > 120) {
    lastProbe = now
    reportProgress()
  }
}

function reportProgress(): void {
  const p = Math.min(1, Math.max(0, 1 - alphaSum() / initialAlpha))
  props.onProgress(p)
  if (p >= 0.9 && !done && ctx) {
    done = true
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, SIZE, SIZE)
    texture.needsUpdate = true
    props.onProgress(1)
    invalidate()
  }
}

function onDown(e: PointerEvent): void {
  if (props.mode !== 'clean' || done) return
  drawing = true
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  eraseAt(e.clientX, e.clientY)
}

function onMove(e: PointerEvent): void {
  if (!drawing || props.mode !== 'clean') return
  eraseAt(e.clientX, e.clientY)
}

function onUp(): void {
  if (drawing) reportProgress()
  drawing = false
}

const dom = (renderer as WebGLRenderer).domElement
dom.addEventListener('pointerdown', onDown)
dom.addEventListener('pointermove', onMove)
dom.addEventListener('pointerup', onUp)
dom.addEventListener('pointercancel', onUp)

watch(
  () => props.mode,
  (m) => {
    dom.style.touchAction = 'none'
    dom.style.cursor = m === 'clean' ? 'crosshair' : 'grab'
  },
  { immediate: true },
)

function reset(): void {
  done = false
  paintStains()
}

defineExpose({ reset })

onBeforeUnmount(() => {
  dom.removeEventListener('pointerdown', onDown)
  dom.removeEventListener('pointermove', onMove)
  dom.removeEventListener('pointerup', onUp)
  dom.removeEventListener('pointercancel', onUp)
  group.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.geometry.dispose()
      ;(obj.material as Material).dispose()
    }
  })
  texture.dispose()
})
</script>
