<template lang="pug">
TresCanvas(alpha :clear-alpha="0" clear-color="#000000" :dpr="[1, 1.75]" render-mode="on-demand" @ready="emit('ready')" @error="emit('error')")
  TresPerspectiveCamera(:position="[0, 1.05, 3.6]" :fov="40")
  OrbitControls(
    ref="controls"
    make-default
    :target="[0, 1.05, 0]"
    :enable-pan="false"
    :enable-zoom="false"
    :enable-rotate="mode === 'rotate'"
    :min-polar-angle="0.9"
    :max-polar-angle="2.2"
  )
  MirrorScene(ref="scene" :mode="mode" :on-progress="onProgress")
</template>

<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import MirrorScene from './MirrorScene.vue'

defineProps<{ mode: 'clean' | 'rotate'; onProgress: (v: number) => void }>()
const emit = defineEmits<{ ready: []; error: [] }>()

const scene = ref<{ reset: () => void } | null>(null)
const controls = ref<InstanceType<typeof OrbitControls> | null>(null)

function reset(): void {
  controls.value?.instance?.reset()
  scene.value?.reset()
}

defineExpose({ reset })
</script>
