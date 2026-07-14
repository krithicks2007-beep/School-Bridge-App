import { Stack } from 'expo-router'

export default function ParentStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="announcement" />
      <Stack.Screen name="timetable" />
      <Stack.Screen name="homework" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="test" />
      <Stack.Screen name="transport" />
    </Stack>
  )
}
