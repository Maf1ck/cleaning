export interface Toast {
  id: number
  text: string
  tone: 'info' | 'success' | 'error'
  action?: { label: string; run: () => void }
}

let seq = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
  }

  function show(text: string, options: { tone?: Toast['tone']; action?: Toast['action']; duration?: number } = {}): number {
    const id = ++seq
    toasts.value = [...toasts.value.slice(-2), { id, text, tone: options.tone ?? 'info', action: options.action }]
    if (import.meta.client) timers.set(id, setTimeout(() => dismiss(id), options.duration ?? (options.action ? 7000 : 4000)))
    return id
  }

  return { toasts, show, dismiss }
}
