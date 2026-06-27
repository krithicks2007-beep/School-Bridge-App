import { create } from 'zustand'
import { parentLogin, staffLogin, logout } from '../services/auth'

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  student: null,
  profile: null,
  loading: false,
  error: null,
  loginAsParent: async (name, initial, pin) => {
    set({ loading: true, error: null })
    const { data, error } = await parentLogin(name, initial, pin)
    if (error) {
      set({ error, loading: false })
    } else {
      set({
        student: data,
        role: 'parent',
        loading: false,
      })
    }
  },
  loginAsStaff: async (name, password) => {
    set({ loading: true, error: null })
    const { data, error } = await staffLogin(name, password)
    console.log('[authStore] staffLogin response:', JSON.stringify({ data, error }, null, 2))
    if (error) {
      set({ error, loading: false })
    } else {
      console.log('[authStore] profile received:', data?.profile)
      set({
        user: data.user,
        role: data.role,
        profile: data.profile || null,
        loading: false,
      })
    }
  },
  logoutUser: async () => {
    await logout()
    set({ user: null, role: null, student: null, error: null })
  },
  clearError: () => set({ error: null }),
}))
