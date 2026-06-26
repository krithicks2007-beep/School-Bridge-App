import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top || 44 }}
      >
        <View className="px-5 pb-4 pt-3">
          <Text className="text-xl font-black text-white">Messages</Text>
          <Text className="mt-0.5 text-xs text-white/60">All caught up ✓</Text>
        </View>
      </LinearGradient>

      <View className="flex-1 items-center justify-center px-10">
        <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-blue-50">
          <Ionicons name="chatbubbles-outline" size={48} color="#93C5FD" />
        </View>
        <Text className="text-center text-xl font-black text-slate-700">No Messages Yet</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-slate-400">
          Your conversations with teachers and school staff will appear here.
        </Text>
      </View>
    </View>
  );
}
