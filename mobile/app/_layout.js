import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'
import '../global.css'

export default function RootLayout() {
  const { role, student, user } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return;

    const currentGroup = segments[0]

    if (!role && currentGroup !== '(auth)') {
      router.replace('/(auth)/parent-login')
    } else if (role === 'parent' && student && currentGroup !== '(parent)') {
      router.replace('/(parent)')
    } else if (role === 'teacher' && currentGroup !== '(teacher)') {
      router.replace('/(teacher)')
    } else if (role === 'admin' && currentGroup !== '(admin)') {
      router.replace('/(admin)')
    }
  }, [role, student, user, segments, isMounted])

  return <Slot />
}