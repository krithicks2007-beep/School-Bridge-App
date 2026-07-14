import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { BASE_URL , apiFetch} from '../../../src/services/api';
import { useFocusEffect } from 'expo-router';

export default function TeacherProfile() {
  const { profile, logoutUser } = useAuthStore();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch updated teacher data with mapped class names from the search endpoint
  const fetchProfileData = async () => {
    try {
      if (!profile?.reg_id) return;
      const response = await apiFetch(`${BASE_URL}/api/teachers?q=${profile.reg_id}`);
      if (response.ok) {
        const json = await response.json();
        // search returns an array, find the exact match
        const exactMatch = json.data?.find(t => t.reg_id === profile.reg_id);
        if (exactMatch) {
          setTeacherData(exactMatch);
        } else {
          setTeacherData(profile);
        }
      } else {
        setTeacherData(profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile details:', error);
      setTeacherData(profile);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [profile?.reg_id])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const displayData = teacherData || profile;
  if (!displayData) return null;

  const initials = displayData.name ? displayData.name.charAt(0).toUpperCase() : 'T';

  // Format classes
  let handlingClassesText = '';
  if (Array.isArray(displayData.handling_classes) && displayData.handling_classes.length > 0) {
    handlingClassesText = displayData.handling_classes.join(', ');
  } else if (typeof displayData.handling_classes === 'string' && displayData.handling_classes.trim() !== '') {
    handlingClassesText = displayData.handling_classes;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 pb-4 pt-4 border-b border-gray-200 bg-white shadow-sm flex-row justify-between items-center z-10">
        <View>
          <Text className="text-2xl font-extrabold text-brand-950">My Profile</Text>
          <Text className="text-sm font-medium text-gray-500 mt-1">Manage your account details</Text>
        </View>
        <TouchableOpacity 
          onPress={logoutUser}
          className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
        >
          <Feather name="log-out" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Card Container */}
        <View className="px-5 pt-6 pb-2">
          <View className="w-full overflow-hidden rounded-[24px] shadow-xl shadow-indigo-600/20 bg-white">
            <LinearGradient
              colors={['#4F46E5', '#3730A3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="items-center px-6 py-8"
            >
              {displayData.photo_url ? (
                <Image
                  source={{ uri: displayData.photo_url }}
                  className="h-[100px] w-[100px] rounded-full border-4 border-white bg-indigo-200 shadow-md mb-4"
                />
              ) : (
                <View className="h-[100px] w-[100px] items-center justify-center rounded-full border-4 border-white bg-indigo-400 shadow-md mb-4">
                  <Text className="text-4xl font-black text-white">{initials}</Text>
                </View>
              )}
              
              <Text className="text-2xl font-black text-white text-center mb-1">
                {displayData.name}
              </Text>
              
              <View className="rounded-full bg-white/20 px-4 py-1.5 flex-row items-center mt-1">
                <Ionicons name="book" size={14} color="#FFF" />
                <Text className="ml-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  {displayData.subject || 'Teacher'}
                </Text>
              </View>
            </LinearGradient>

            {/* Quick Stats / Classes Bar */}
            <View className="bg-white px-4 py-4 flex-row border-t border-indigo-50">
              <View className="flex-1 items-center border-r border-gray-100 px-2">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-center">Class Teacher</Text>
                <Text className="text-base font-black text-gray-800 text-center">
                  {displayData.class_teacher_of || 'None'}
                </Text>
              </View>
              <View className="flex-1 items-center px-2">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-center">Handling</Text>
                <Text className="text-base font-black text-gray-800 text-center">
                  {handlingClassesText || 'None'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Information Section */}
        <View className="px-5 mt-6">
          <Text className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Personal Details</Text>
          
          <View className="rounded-[20px] bg-white border border-gray-100 shadow-sm overflow-hidden">
            
            {/* Phone */}
            <TouchableOpacity 
              className="flex-row items-center px-5 py-4 border-b border-gray-50"
              onPress={() => displayData.phone && Linking.openURL(`tel:${displayData.phone}`)}
              activeOpacity={displayData.phone ? 0.6 : 1}
            >
              <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center mr-4">
                <Feather name="phone" size={18} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</Text>
                <Text className="text-[15px] font-semibold text-gray-800">
                  {displayData.phone || 'Not provided'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity 
              className="flex-row items-center px-5 py-4 border-b border-gray-50"
              onPress={() => displayData.email && Linking.openURL(`mailto:${displayData.email}`)}
              activeOpacity={displayData.email ? 0.6 : 1}
            >
              <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center mr-4">
                <Feather name="mail" size={18} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email Address</Text>
                <Text className="text-[15px] font-semibold text-gray-800">
                  {displayData.email || 'Not provided'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Address */}
            <View className="flex-row items-center px-5 py-4 border-b border-gray-50">
              <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center mr-4">
                <Feather name="map-pin" size={18} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Address</Text>
                <Text className="text-[15px] font-semibold text-gray-800 leading-5">
                  {displayData.address || 'Not provided'}
                </Text>
              </View>
            </View>

            {/* Registration ID */}
            <View className="flex-row items-center px-5 py-4">
              <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center mr-4">
                <Feather name="hash" size={18} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Registration ID</Text>
                <Text className="text-[15px] font-semibold text-gray-800">
                  {displayData.reg_id}
                </Text>
              </View>
            </View>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
