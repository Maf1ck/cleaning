import type { PublicSettings } from '#shared/types'

type Key = keyof PublicSettings

/** Local editable copy of one settings section with save/reset. */
export function useSettingsForm<K extends Key>(key: K) {
  const settings = useSettings()
  const { show } = useToast()
  const form = ref(structuredClone(toRaw(settings.value[key]))) as Ref<PublicSettings[K]>
  const saving = ref(false)
  const error = ref('')

  const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(settings.value[key]))

  onMounted(async () => {
    await refreshSettings()
    form.value = structuredClone(toRaw(settings.value[key]))
  })

  async function save(): Promise<void> {
    saving.value = true
    error.value = ''
    try {
      const saved = await adminFetch<PublicSettings[K]>(`/api/admin/settings/${key}`, { method: 'PUT', body: form.value })
      settings.value = { ...settings.value, [key]: saved }
      form.value = structuredClone(saved)
      show('Збережено', { tone: 'success' })
    } catch (e) {
      error.value = adminErrorMessage(e, 'Не вдалося зберегти')
    } finally {
      saving.value = false
    }
  }

  function reset(): void {
    form.value = structuredClone(toRaw(settings.value[key]))
    error.value = ''
  }

  return { form, saving, error, dirty, save, reset }
}
