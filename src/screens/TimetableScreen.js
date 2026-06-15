import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TimetableScreen({ onBack }) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] bg-app-primary px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20">
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Timetable</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false}>
        
        <View className="flex-row justify-between items-end mb-6">
          <Text className="text-xl font-black text-slate-800 ml-1">Today's Schedule</Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text className="text-slate-500 font-bold ml-1.5">Mon, 15 Jun</Text>
          </View>
        </View>

        <View className="ml-2">
          
          {/* Timeline Item 1 */}
          <View className="flex-row mb-6 relative">
            <View className="items-center mr-4 w-[60px]">
              <Text className="text-sm font-black text-indigo-600 mb-1">09:00</Text>
              <Text className="text-[10px] font-bold text-slate-400">AM</Text>
            </View>
            <View className="absolute left-[62px] top-1.5 bottom-[-35px] w-0.5 bg-indigo-100 z-0" />
            <View className="absolute left-[59px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 z-10 shadow-sm shadow-indigo-500/50" />
            <View className="flex-1 ml-4 bg-white rounded-[20px] p-4 shadow-sm shadow-slate-200 border border-slate-100">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-lg font-black text-slate-800">Mathematics</Text>
                <View className="bg-indigo-50 px-2 py-0.5 rounded-full"><Text className="text-[10px] font-bold text-indigo-500">45m</Text></View>
              </View>
              <Text className="text-sm font-medium text-slate-500">Mr. Sharma • Room 101</Text>
            </View>
          </View>

          {/* Timeline Item 2 */}
          <View className="flex-row mb-6 relative">
            <View className="items-center mr-4 w-[60px]">
              <Text className="text-sm font-black text-indigo-600 mb-1">10:00</Text>
              <Text className="text-[10px] font-bold text-slate-400">AM</Text>
            </View>
            <View className="absolute left-[62px] top-1.5 bottom-[-35px] w-0.5 bg-indigo-100 z-0" />
            <View className="absolute left-[59px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 z-10 shadow-sm shadow-indigo-500/50" />
            <View className="flex-1 ml-4 bg-white rounded-[20px] p-4 shadow-sm shadow-slate-200 border border-slate-100">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-lg font-black text-slate-800">Science</Text>
                <View className="bg-indigo-50 px-2 py-0.5 rounded-full"><Text className="text-[10px] font-bold text-indigo-500">45m</Text></View>
              </View>
              <Text className="text-sm font-medium text-slate-500">Mrs. Gupta • Lab 2</Text>
            </View>
          </View>

          {/* Break Item */}
          <View className="flex-row mb-6 relative">
            <View className="items-center mr-4 w-[60px]">
              <Text className="text-sm font-black text-slate-400 mb-1">11:00</Text>
              <Text className="text-[10px] font-bold text-slate-400">AM</Text>
            </View>
            <View className="absolute left-[62px] top-1.5 bottom-[-35px] w-0.5 bg-indigo-100 z-0" />
            <View className="absolute left-[59px] top-1.5 h-2 w-2 rounded-full bg-amber-400 z-10 border-2 border-white" />
            <View className="flex-1 ml-4 bg-amber-50 rounded-[20px] p-4 border border-amber-100">
              <View className="flex-row items-center">
                <Ionicons name="fast-food" size={18} color="#D97706" />
                <Text className="text-base font-black text-amber-700 ml-2">Short Break</Text>
              </View>
            </View>
          </View>

          {/* Timeline Item 3 */}
          <View className="flex-row mb-6 relative">
            <View className="items-center mr-4 w-[60px]">
              <Text className="text-sm font-black text-indigo-600 mb-1">11:30</Text>
              <Text className="text-[10px] font-bold text-slate-400">AM</Text>
            </View>
            <View className="absolute left-[59px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 z-10 shadow-sm shadow-indigo-500/50" />
            <View className="flex-1 ml-4 bg-white rounded-[20px] p-4 shadow-sm shadow-slate-200 border border-slate-100">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-lg font-black text-slate-800">English</Text>
                <View className="bg-indigo-50 px-2 py-0.5 rounded-full"><Text className="text-[10px] font-bold text-indigo-500">45m</Text></View>
              </View>
              <Text className="text-sm font-medium text-slate-500">Ms. D'Souza • Room 101</Text>
            </View>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
