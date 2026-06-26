import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TransportScreen({ onBack }) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] bg-app-primary px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20">
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Transport</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerClassName="p-6 pb-12" showsVerticalScrollIndicator={false}>
        
        <View className="mb-6 overflow-hidden rounded-[24px] shadow-md shadow-indigo-200">
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6 items-center"
          >
            <View className="h-20 w-20 bg-white/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="bus" size={40} color="#FFFFFF" />
            </View>
            <View className="bg-emerald-500/20 border border-emerald-400 px-4 py-1.5 rounded-full mb-3">
              <Text className="text-emerald-100 font-bold text-sm tracking-widest uppercase">On Time</Text>
            </View>
            <Text className="text-white font-black text-3xl mb-1">Bus No. 12</Text>
            <Text className="text-blue-100 font-medium text-base">Arriving at your stop in 10 mins</Text>
          </LinearGradient>
        </View>

        <Text className="text-lg font-black text-slate-800 mb-4 ml-1">Bus Details</Text>

        <View className="bg-white rounded-[24px] p-5 shadow-sm shadow-slate-200 border border-slate-100 mb-5">
          <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100">
            <View className="h-11 w-11 bg-blue-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="bus" size={22} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route</Text>
              <Text className="text-base font-black text-slate-800">Route 12 — Sathy Road</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100">
            <View className="h-11 w-11 bg-indigo-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="location" size={22} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pick-up Stop</Text>
              <Text className="text-base font-black text-slate-800">MG Road Junction</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="h-11 w-11 bg-emerald-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="time" size={22} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pick-up Time</Text>
              <Text className="text-base font-black text-slate-800">7:30 AM</Text>
            </View>
          </View>
        </View>

        <Text className="text-lg font-black text-slate-800 mb-4 ml-1">Driver Details</Text>

        <View className="bg-white rounded-[24px] p-4 shadow-sm shadow-slate-200 border border-slate-100 flex-row items-center">
          <View className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 items-center justify-center mr-4">
            <Ionicons name="person" size={24} color="#4F46E5" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800 mb-1">Ramesh Kumar</Text>
            <View className="flex-row items-center">
              <Ionicons name="call" size={14} color="#64748B" />
              <Text className="text-sm font-medium text-slate-500 ml-1.5">+91 9876543210</Text>
            </View>
          </View>
          <TouchableOpacity className="h-10 w-10 bg-emerald-50 rounded-full items-center justify-center">
            <Ionicons name="call" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
