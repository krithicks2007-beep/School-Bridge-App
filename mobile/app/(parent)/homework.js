import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HomeworkScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Homework</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-lg font-black text-slate-800 ml-1">Pending Tasks</Text>
          <View className="bg-rose-100 px-3 py-1 rounded-full">
            <Text className="text-rose-600 font-bold text-xs">2 Due Soon</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} className="mb-5 overflow-hidden rounded-[24px] shadow-sm shadow-blue-200">
          <LinearGradient colors={['#ffffff', '#f8fafc']} className="p-5 border-l-4 border-blue-500">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-row items-center">
                <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="calculator" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text className="text-lg font-black text-slate-800">Mathematics</Text>
                  <Text className="text-xs font-bold text-slate-400">Prof. Sharma</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </View>
            <Text className="mb-4 text-[15px] leading-6 text-slate-600 font-medium">Complete algebra exercises 5.1 and 5.2 from the workbook.</Text>
            <View className="flex-row items-center bg-rose-50 self-start px-3 py-1.5 rounded-xl border border-rose-100">
              <Ionicons name="time" size={14} color="#E11D48" />
              <Text className="text-[13px] font-bold text-rose-600 ml-1.5">Due: Tomorrow</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} className="mb-5 overflow-hidden rounded-[24px] shadow-sm shadow-emerald-200">
          <LinearGradient colors={['#ffffff', '#f8fafc']} className="p-5 border-l-4 border-emerald-500">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-row items-center">
                <View className="h-10 w-10 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="flask" size={20} color="#10B981" />
                </View>
                <View>
                  <Text className="text-lg font-black text-slate-800">Science</Text>
                  <Text className="text-xs font-bold text-slate-400">Mrs. Gupta</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </View>
            <Text className="mb-4 text-[15px] leading-6 text-slate-600 font-medium">Read chapter 4 on Ecosystems and answer the review questions.</Text>
            <View className="flex-row items-center bg-emerald-50 self-start px-3 py-1.5 rounded-xl border border-emerald-100">
              <Ionicons name="calendar" size={14} color="#059669" />
              <Text className="text-[13px] font-bold text-emerald-600 ml-1.5">Due: Wed, 18 Jun</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
