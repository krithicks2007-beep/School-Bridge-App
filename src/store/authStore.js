import { create } from 'zustand'
import { parentLogin, staffLogin, logout } from '../services/auth'

export const useAuthStore = create((set) => ({
  // State
  user: null,
  role: null,
  student: null,
  loading: false,
  error: null,

  // Parent login
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

  // Teacher / Admin login
  loginAsStaff: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await staffLogin(email, password)
    if (error) {
      set({ error, loading: false })
    } else {
      set({
        user: data.user,
        role: data.role,
        loading: false,
      })
    }
  },

  // Logout
  logoutUser: async () => {
    await logout()
    set({ user: null, role: null, student: null, error: null })
  },

  // Clear errors
  clearError: () => set({ error: null }),
}))