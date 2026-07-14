import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL, handleApiResponse , apiFetch} from '../../src/services/api';

export default function TransportScreen() {
  const router = useRouter();
  const { student } = useAuthStore();
  
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student?.id) {
      fetchTransportData();
    }
  }, [student]);

  const fetchTransportData = async () => {
    try {
      const response = await apiFetch(`${BASE_URL}/api/transport/${student.id}`);
      const result = await handleApiResponse(response);
      setTransport(result.data);
    } catch (error) {
      console.log('Error fetching transport:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  if (!transport) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20" style={{ backgroundColor: '#4F46E5' }}>
          <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-white tracking-wide">Transport</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="bus-outline" size={64} color="#CBD5E1" />
          <Text className="text-lg font-bold text-slate-500 mt-4 text-center">No transport details assigned yet.</Text>
          <Text className="text-sm text-slate-400 mt-2 text-center">Please contact the administration for bus assignment.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Transport</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        
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
              <Text className="text-emerald-100 font-bold text-sm tracking-widest uppercase">{transport.status || 'Scheduled'}</Text>
            </View>
            <Text className="text-white font-black text-3xl mb-1">{transport.bus_number || 'N/A'}</Text>
            <Text className="text-blue-100 font-medium text-base">Your daily commute</Text>
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
              <Text className="text-base font-black text-slate-800">{transport.route_name || 'N/A'}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100">
            <View className="h-11 w-11 bg-indigo-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="location" size={22} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pick-up Stop</Text>
              <Text className="text-base font-black text-slate-800">{transport.pickup_stop || 'N/A'}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100">
            <View className="h-11 w-11 bg-emerald-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="time" size={22} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pick-up Time</Text>
              <Text className="text-base font-black text-slate-800">{formatTime(transport.pickup_time)}</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="h-11 w-11 bg-orange-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="time-outline" size={22} color="#F97316" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drop Time</Text>
              <Text className="text-base font-black text-slate-800">{formatTime(transport.drop_time)}</Text>
            </View>
          </View>
        </View>

        <Text className="text-lg font-black text-slate-800 mb-4 ml-1">Driver Details</Text>

        <View className="bg-white rounded-[24px] p-4 shadow-sm shadow-slate-200 border border-slate-100 flex-row items-center">
          <View className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 items-center justify-center mr-4">
            <Ionicons name="person" size={24} color="#4F46E5" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-800">{transport.driver_name || 'N/A'}</Text>
            <Text className="text-sm font-medium text-slate-500">{transport.driver_phone || 'No phone number'}</Text>
          </View>
          {transport.driver_phone && (
            <TouchableOpacity 
              className="h-10 w-10 bg-emerald-50 rounded-full items-center justify-center"
              onPress={() => Linking.openURL(`tel:${transport.driver_phone}`)}
            >
              <Ionicons name="call" size={20} color="#10B981" />
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
