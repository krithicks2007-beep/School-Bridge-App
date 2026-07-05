import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TimetableOptions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-5 pb-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-brand-950">Timetable Management</Text>
      </View>

      <View className="px-5">
        <TouchableOpacity
          className="mb-4 h-32 w-full overflow-hidden rounded-[20px] border border-blue-100 bg-white shadow-md shadow-blue-900/10"
          activeOpacity={0.85}
          onPress={() => router.push('/(admin)/timetable/update')}
        >
          <LinearGradient colors={['#EFF6FF', '#DBEAFE']} className="flex-1 p-5 flex-row items-center" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-sm mr-4">
              <Feather name="upload-cloud" size={28} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Update Timetable</Text>
              <Text className="text-sm text-gray-600 mt-1">Bulk upload an Excel file to replace or add a class timetable.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 h-32 w-full overflow-hidden rounded-[20px] border border-purple-100 bg-white shadow-md shadow-purple-900/10"
          activeOpacity={0.85}
          onPress={() => router.push('/(admin)/timetable/edit')}
        >
          <LinearGradient colors={['#F5F3FF', '#EDE9FE']} className="flex-1 p-5 flex-row items-center" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-purple-500 shadow-sm mr-4">
              <Feather name="edit-2" size={28} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Edit Single Cell</Text>
              <Text className="text-sm text-gray-600 mt-1">Manually modify individual periods, subjects, or teachers.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9333EA" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
