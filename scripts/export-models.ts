/**
 * Exports the procedural characters to binary glTF (models/*.glb) so a designer can
 * open them in Blender, refine them and save a .blend. The site itself builds the
 * characters from code and does not load these files.
 * Run: pnpm export:models
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { test } from 'vitest'
import { Scene } from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { CHARACTER_IDS, buildCharacter } from '~/three/characters'

// Minimal FileReader for GLTFExporter in Node (Blob exists natively since Node 18).
class NodeFileReader {
  result: ArrayBuffer | string | null = null
  onloadend: (() => void) | null = null
  readAsArrayBuffer(blob: Blob): void {
    void blob.arrayBuffer().then((buf) => {
      this.result = buf
      this.onloadend?.()
    })
  }
  readAsDataURL(blob: Blob): void {
    void blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buf).toString('base64')}`
      this.onloadend?.()
    })
  }
}

test('export characters to GLB', async () => {
  ;(globalThis as unknown as { FileReader: typeof NodeFileReader }).FileReader = NodeFileReader
  const out = new URL('../models/', import.meta.url)
  mkdirSync(out, { recursive: true })
  const exporter = new GLTFExporter()
  for (const id of CHARACTER_IDS) {
    const rig = buildCharacter(id)
    rig.root.name = id
    const scene = new Scene()
    scene.add(rig.root)
    const glb = (await exporter.parseAsync(scene, { binary: true, onlyVisible: false })) as ArrayBuffer
    writeFileSync(new URL(`${id}.glb`, out), Buffer.from(glb))
    console.log(`models/${id}.glb  ${(glb.byteLength / 1024).toFixed(1)} KB`)
  }
}, 60000)
