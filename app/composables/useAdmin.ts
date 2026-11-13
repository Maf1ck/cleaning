interface FetchErr {
  statusCode?: number
  data?: { message?: string }
}

export function adminErrorMessage(e: unknown, fallback = 'Не вдалося виконати дію'): string {
  const err = e as FetchErr
  return err?.data?.message ?? fallback
}

export function useAdminAuth() {
  const state = useState<{ checked: boolean; authenticated: boolean; configured: boolean }>('admin-auth', () => ({
    checked: false,
    authenticated: false,
    configured: true,
  }))

  async function check(): Promise<boolean> {
    try {
      const me = await $fetch<{ authenticated: boolean; configured: boolean }>('/api/admin/me')
      state.value = { checked: true, ...me }
    } catch {
      state.value = { checked: true, authenticated: false, configured: true }
    }
    return state.value.authenticated
  }

  async function logout(): Promise<void> {
    await $fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    state.value = { ...state.value, authenticated: false }
    await navigateTo('/admin')
  }

  return { state, check, logout }
}

/** $fetch for the cabinet: a 401 sends the owner back to the sign-in screen. */
export async function adminFetch<T>(url: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  try {
    return (await $fetch(url, options)) as T
  } catch (e) {
    if ((e as FetchErr).statusCode === 401) {
      useAdminAuth().state.value.authenticated = false
      await navigateTo('/admin')
    }
    throw e
  }
}
