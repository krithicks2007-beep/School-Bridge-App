import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { loginAPI, logout, savePushTokenAPI } from '../services/auth'
import NotificationService from '../services/NotificationService'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      user: null,
  role: null,
  student: null,
  profile: null,
  token: null,
  loading: false,
  error: null,
  loginUser: async (reg_id, password) => {
    set({ loading: true, error: null })
    const { data, error } = await loginAPI(reg_id, password)
    
    if (error) {
      set({ error, loading: false })
    } else {
      let userId;
      if (data.role === 'parent') {
        userId = data.id;
        set({
          student: data,
          role: 'parent',
          token: data.token,
          loading: false,
        })
      } else {
        userId = data.profile?.id || data.user?.id;
        set({
          user: data.user,
          role: data.role,
          profile: data.profile || null,
          token: data.token,
          loading: false,
        })
      }

      // Register and save push token asynchronously
      if (userId) {
        try {
          const pushToken = await NotificationService.registerForPushNotificationsAsync();
          if (pushToken) {
            await savePushTokenAPI(userId, data.role, pushToken);
          }
        } catch (pushErr) {
          console.log('Failed to save push token', pushErr);
        }
      }
    }
  },
  logoutUser: async () => {
    const { user, student, profile, role } = get();
    const userId = student?.id || profile?.id || user?.id;
    if (userId && role) {
      try {
        await savePushTokenAPI(userId, role, null);
      } catch (err) {
        console.log('Failed to clear push token', err);
      }
    }
    await logout();
    set({ user: null, role: null, student: null, profile: null, token: null, error: null })
  },
  clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({ 
        user: state.user, 
        role: state.role, 
        student: state.student, 
        profile: state.profile, 
        token: state.token 
      }),
    }
  )
)
