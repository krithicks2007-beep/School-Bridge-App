import React, { useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

export default function AdminHome() {
  const [logoError, setLogoError] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, logoutUser } = useAuthStore();
  const router = useRouter();

  const adminName = user?.name || 'Administrator';
  const isWideLayout = width >= 768;
  const headerLogoSize = isWideLayout ? 44 : 48;
  const headerLogoImageSize = isWideLayout ? 28 : 32;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const renderCard = ({ id, title, subtitle, iconLib: IconLib, icon, iconColor, gradient, route, customWidth, customHeight }) => {
    const widthClass = customWidth || 'w-[48%]';
    const heightClass = customHeight || 'h-[128px]';
    return (
      <TouchableOpacity
        key={id}
        className={`mb-4 overflow-hidden rounded-[20px] border border-[#E8EDF5] bg-white shadow-md shadow-blue-900/10 ${widthClass} ${heightClass}`}
        activeOpacity={0.85}
        onPress={() => router.push(route || `/(admin)/${id}`)}
      >
        <LinearGradient colors={gradient} className="flex-1 p-4" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View className="mb-2 items-start justify-start flex-1">
            <IconLib name={icon} size={32} color={iconColor} />
          </View>
          <View>
            <Text className="mb-1 text-[16px] font-bold text-gray-900">{title}</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] text-[#595959]" numberOfLines={1}>{subtitle}</Text>
              <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#E8F0FE', '#FDF2F8', '#FFF8EC']}
        className="absolute inset-0"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View className="z-[100] bg-white shadow-md shadow-black/5" style={{ paddingTop: insets.top || StatusBar.currentHeight || 24 }}>
        <View
          className="mx-auto w-full flex-row items-center px-5 pb-3.5 pt-2.5"
          style={{ maxWidth: isWideLayout ? 980 : undefined }}
        >
          <View
            className="shrink-0 items-center justify-center rounded-full border-2 border-school-gold bg-white shadow-md shadow-school-gold/25"
            style={{ height: headerLogoSize, width: headerLogoSize }}
          >
            {logoError ? (
              <Ionicons name="school" size={headerLogoImageSize - 4} color="#D4AF37" />
            ) : (
              <Image
                source={require('../../assets/pictures/school_logo.png')}
                style={{ height: headerLogoImageSize, width: headerLogoImageSize }}
                resizeMode="contain"
                onError={() => setLogoError(true)}
              />
            )}
          </View>
          <View className="flex-1 px-3">
            <Text className="text-[15px] font-extrabold leading-[19px] text-brand-950" numberOfLines={1}>Einstein Higher Secondary School</Text>
            <Text className="mt-0.5 text-[11px] font-medium text-gray-500">Admin Portal</Text>
          </View>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-gray-100" onPress={logoutUser}>
            <Ionicons name="log-out-outline" size={22} color="#1E1B4B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5"
        contentContainerStyle={{
          alignSelf: 'center',
          maxWidth: isWideLayout ? 980 : undefined,
          paddingBottom: insets.bottom + 20,
          width: '100%',
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full overflow-hidden rounded-[24px] shadow-xl shadow-purple-600/25">
          <LinearGradient
            colors={['#9333EA', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-row items-center justify-between p-6"
          >
            <View className="flex-1 pr-3">
              <Text className="mb-0.5 text-sm font-medium text-white/85">{getGreeting()}</Text>
              <Text className="mb-2.5 text-[26px] font-black leading-8 text-white" numberOfLines={2}>{adminName}</Text>
              <Text className="text-xs font-medium text-white/70">System Administrator</Text>
            </View>

            <View className="h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-purple-400 shadow-md">
              <Text className="text-[22px] font-black text-white">{adminName.charAt(0)}</Text>
            </View>
          </LinearGradient>
        </View>

        <View className="flex-1 w-full justify-center py-6">
          <View className="w-full flex-row justify-between mb-4">
            {renderCard({
              id: 'announcement',
              title: 'Announcements',
              subtitle: 'Manage notices',
              iconLib: Ionicons,
              icon: 'megaphone',
              iconColor: '#9333EA',
              gradient: ['#FFFFFF', '#F5F3FF'],
              customWidth: 'w-[48%]',
              customHeight: 'h-[140px]',
            })}
            {renderCard({
              id: 'transport',
              title: 'Transport',
              subtitle: 'Bus management',
              iconLib: Ionicons,
              icon: 'bus',
              iconColor: '#9333EA',
              gradient: ['#FFFFFF', '#F5F3FF'],
              customWidth: 'w-[48%]',
              customHeight: 'h-[140px]',
            })}
          </View>

          <View className="w-full">
            {renderCard({
              id: 'timetable',
              title: 'Timetable',
              subtitle: 'Upload & Edit',
              iconLib: Feather,
              icon: 'clock',
              iconColor: '#9333EA',
              gradient: ['#FFFFFF', '#F5F3FF'],
              route: '/(admin)/timetable',
              customWidth: 'w-full',
              customHeight: 'h-[140px]', 
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
