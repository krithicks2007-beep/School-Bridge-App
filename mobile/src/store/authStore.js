import { create } from 'zustand'
import { loginAPI, logout } from '../services/auth'

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  student: null,
  profile: null,
  loading: false,
  error: null,
  loginUser: async (reg_id, password) => {
    set({ loading: true, error: null })
    const { data, error } = await loginAPI(reg_id, password)
    
    if (error) {
      set({ error, loading: false })
    } else {
      if (data.role === 'parent') {
        set({
          student: data,
          role: 'parent',
          loading: false,
        })
      } else {
        set({
          user: data.user,
          role: data.role,
          profile: data.profile || null,
          loading: false,
        })
      }
    }
  },
  logoutUser: async () => {
    await logout()
    set({ user: null, role: null, student: null, profile: null, error: null })
  },
  clearError: () => set({ error: null }),
}))
