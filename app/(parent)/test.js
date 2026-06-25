import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function TestMarkScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Test Marks</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        
        <View className="mb-6 overflow-hidden rounded-[24px] shadow-md shadow-indigo-200/50">
          <LinearGradient
            colors={['#818CF8', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-black text-xl">Mid-Term Exam</Text>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white font-bold text-xs tracking-wider">A GRADE</Text>
              </View>
            </View>
            <View className="flex-row items-end">
              <Text className="text-5xl font-black text-white">85</Text>
              <Text className="text-lg font-bold text-white/70 mb-1 ml-1">%</Text>
            </View>
            <Text className="text-white/80 font-medium text-sm mt-1">Overall Class Rank: 4th</Text>
          </LinearGradient>
        </View>

        <Text className="text-lg font-black text-slate-800 mb-4 ml-1">Subject Breakdown</Text>

        <View className="bg-white rounded-[24px] p-2 shadow-sm shadow-slate-200 border border-slate-100 mb-4">
          
          <View className="p-4 border-b border-slate-100 flex-row items-center">
            <View className="h-12 w-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
              <Text className="text-xl font-black text-blue-600">M</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-800 mb-1">Mathematics</Text>
              <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full w-[92%] bg-blue-500 rounded-full" />
              </View>
            </View>
            <Text className="text-lg font-black text-slate-800 ml-4">92</Text>
          </View>

          <View className="p-4 border-b border-slate-100 flex-row items-center">
            <View className="h-12 w-12 bg-emerald-50 rounded-2xl items-center justify-center mr-4">
              <Text className="text-xl font-black text-emerald-600">S</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-800 mb-1">Science</Text>
              <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full w-[88%] bg-emerald-500 rounded-full" />
              </View>
            </View>
            <Text className="text-lg font-black text-slate-800 ml-4">88</Text>
          </View>

          <View className="p-4 flex-row items-center">
            <View className="h-12 w-12 bg-amber-50 rounded-2xl items-center justify-center mr-4">
              <Text className="text-xl font-black text-amber-600">E</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-800 mb-1">English</Text>
              <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <View className="h-full w-[75%] bg-amber-500 rounded-full" />
              </View>
            </View>
            <Text className="text-lg font-black text-slate-800 ml-4">75</Text>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
