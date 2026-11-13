<template lang="pug">
TresCanvas(
  alpha
  :clear-alpha="0"
  clear-color="#000000"
  shadows
  :dpr="[1, 1.75]"
  :render-mode="reduced ? 'on-demand' : 'always'"
  @ready="emit('ready')"
  @error="onError"
)
  TresPerspectiveCamera(:position="[0, 1.35, 4.9]" :fov="32" :near="0.1" :far="40")
  OrbitControls(
    ref="controls"
    make-default
    :target="[0, 0.8, 0]"
    :enable-pan="false"
    :enable-damping="!reduced"
    :damping-factor="0.08"
    :min-distance="3.2"
    :max-distance="7.5"
    :min-polar-angle="0.6"
    :max-polar-angle="1.5"
    :rotate-speed="0.8"
    @start="emit('drag', true)"
    @end="emit('drag', false)"
  )
  CharacterDirector(
    :active="active"
    :faces="faces"
    :amp="amp"
    :reduced="reduced"
    :paused="paused"
    :ground-color="groundColor"
    :on-bubble="onBubble"
  )
</template>

<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import type { CharacterId } from '#shared/content/services'
import type { BubblePoint } from './CharacterDirector.vue'

defineProps<{
  active: CharacterId
  faces: boolean
  amp: number
  reduced: boolean
  paused: boolean
  groundColor: string
  onBubble: (p: BubblePoint) => void
}>()

const emit = defineEmits<{ ready: []; error: [message: string]; drag: [active: boolean] }>()

const controls = ref<InstanceType<typeof OrbitControls> | null>(null)

function onError(error: Error): void {
  emit('error', error.message)
}

function resetView(): void {
  controls.value?.instance?.reset()
}

defineExpose({ resetView })
</script>
