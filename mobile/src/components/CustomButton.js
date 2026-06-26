import React from 'react';
import { Pressable, Text } from 'react-native';

export default function CustomButton({ title, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressed && { transform: [{ translateY: 2 }] },
      ]}
      className="mb-6 h-12 items-center justify-center rounded-lg bg-brand-500 active:bg-app-primaryDark"
    >
      <Text className="text-base font-bold text-white">{title}</Text>
    </Pressable>
  );
}
