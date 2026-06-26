import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function AnnouncementScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Announcements</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        <TouchableOpacity activeOpacity={0.8} className="mb-5 overflow-hidden rounded-[24px] shadow-sm shadow-blue-200">
          <LinearGradient colors={['#ffffff', '#f8fafc']} className="p-5 border-l-4 border-blue-600">
            <View className="flex-row justify-between items-start mb-3">
              <View className="bg-blue-600 px-3 py-1 rounded-full shadow-sm shadow-blue-500/30">
                <Text className="text-white font-bold text-xs tracking-wider uppercase">New</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                <Text className="text-xs font-bold text-slate-400 ml-1.5">14 Jun 2026</Text>
              </View>
            </View>
            <Text className="mb-2 text-xl font-black text-slate-800">Annual Sports Day</Text>
            <Text className="text-[15px] leading-6 text-slate-600 font-medium">The Annual Sports Day will be held on 25th June. All students must wear their respective house uniforms.</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} className="mb-5 overflow-hidden rounded-[24px] shadow-sm shadow-amber-200">
          <LinearGradient colors={['#ffffff', '#fcf6f0']} className="p-5 border-l-4 border-amber-500">
            <View className="flex-row justify-between items-start mb-3">
              <View className="bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                <Text className="text-amber-700 font-bold text-xs tracking-wider uppercase">Notice</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                <Text className="text-xs font-bold text-slate-400 ml-1.5">12 Jun 2026</Text>
              </View>
            </View>
            <Text className="mb-2 text-xl font-black text-slate-800">Holiday Notice</Text>
            <Text className="text-[15px] leading-6 text-slate-600 font-medium">School will remain closed on 18th June on account of a public holiday. Classes will resume as normal the following day.</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
