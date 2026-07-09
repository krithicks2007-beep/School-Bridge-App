import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { BASE_URL } from '../../../src/services/api';
import { countUnreadSince, getLastReadAt } from '../../../src/services/readAlerts';

export default function TeacherHome() {
  const [logoError, setLogoError] = useState(false);
  const insets = useSafeAreaInsets();
  const { user, profile, logoutUser } = useAuthStore();
  const router = useRouter();
  const [announcementCount, setAnnouncementCount] = useState(0);

  // Use name from the User table profile row, fallback to email prefix
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Teacher';

  console.log('[TeacherHome] Full profile object:', JSON.stringify(profile));

  useFocusEffect(
    useCallback(() => {
      const fetchAnnouncementCount = async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/announcements`);
          const data = response.ok ? await response.json() : {};
          const lastReadAnnouncements = await getLastReadAt('staff-announcements', profile?.id || user?.id || user?.email);
          setAnnouncementCount(countUnreadSince(data.announcements, lastReadAnnouncements));
        } catch (error) {
          console.error('Failed to fetch staff home announcement count:', error);
          setAnnouncementCount(0);
        }
      };

      fetchAnnouncementCount();
    }, [profile?.id, user?.id, user?.email])
  );

  // Build the subtitle from profile fields
  const classLabel = (() => {
    const parts = [];
    if (profile?.role) parts.push(profile.role.charAt(0).toUpperCase() + profile.role.slice(1));
    if (profile?.subject) parts.push(`• ${profile.subject}`);
    return parts.length ? parts.join(' ') : 'Staff Member';
  })();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const renderCard = ({ id, title, subtitle, boldSubtitle, iconLib: IconLib, icon, iconColor, gradient, badgeCount, fullWidth }) => (
    <TouchableOpacity
      key={id}
      className={`mb-4 h-[128px] ${fullWidth ? 'w-full' : 'w-[48%]'} overflow-hidden rounded-[20px] border border-[#E8EDF5] bg-white shadow-md shadow-blue-900/10`}
      activeOpacity={0.85}
      onPress={() => router.push(`/(teacher)/${id}`)}
    >
      <LinearGradient colors={gradient} className="flex-1 p-3" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {badgeCount && (
          <View className="absolute right-2.5 top-2.5 z-10 h-[22px] w-[22px] items-center justify-center rounded-full bg-rose-600 shadow-md shadow-rose-600/40">
            <Text className="text-[11px] font-extrabold text-white">{badgeCount}</Text>
          </View>
        )}

        <View className="mb-1.5 h-[30px] items-start justify-start">
          <IconLib name={icon} size={28} color={iconColor} />
        </View>

        <Text className="mb-1 text-[15px] font-bold text-gray-900">{title}</Text>

        <View className="flex-row items-center justify-between">
          {boldSubtitle ? (
            <Text className="flex-1 text-xs text-[#595959]" numberOfLines={1}>
              <Text className="font-bold text-blue-700">{boldSubtitle}</Text>
              {' '}{subtitle}
            </Text>
          ) : (
            <Text className="flex-1 text-xs text-[#595959]" numberOfLines={1}>{subtitle}</Text>
          )}
          <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#E8F0FE', '#FDF2F8', '#FFF8EC']}
        className="absolute inset-0"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View className="z-[100] bg-white shadow-md shadow-black/5" style={{ paddingTop: insets.top || StatusBar.currentHeight || 40 }}>
        <View className="flex-row items-center px-5 pb-3.5 pt-2.5">
          <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-school-gold bg-white shadow-md shadow-school-gold/25">
            {logoError ? (
              <Ionicons name="school" size={24} color="#D4AF37" />
            ) : (
              <Image
                source={require('../../../assets/pictures/school_logo.png')}
                className="h-8 w-8"
                resizeMode="contain"
                onError={() => setLogoError(true)}
              />
            )}
          </View>
          <View className="flex-1 px-3">
            <Text className="text-[15px] font-extrabold leading-[19px] text-brand-950" numberOfLines={1}>Einstein Higher Secondary School</Text>
            <Text className="mt-0.5 text-[11px] font-medium text-gray-500">School Bridge App</Text>
          </View>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="notifications-outline" size={22} color="#1E1B4B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-5 pt-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 w-full overflow-hidden rounded-[24px] shadow-xl shadow-indigo-600/25">
          <LinearGradient
            colors={['#4F46E5', '#3730A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-row items-center justify-between p-6"
          >
            <View className="flex-1 pr-3">
              <Text className="mb-0.5 text-sm font-medium text-white/85">{getGreeting()}</Text>
              <Text className="mb-2.5 text-[26px] font-black leading-8 text-white" numberOfLines={2}>{displayName}</Text>
              <Text className="text-xs font-medium text-white/70">{classLabel}</Text>
            </View>

            {profile?.photo_url ? (
              <Image
                source={{ uri: profile.photo_url }}
                style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff' }}
                resizeMode="cover"
              />
            ) : (
              <View className="h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-indigo-400 shadow-md">
                <Text className="text-[22px] font-black text-white">{displayName.charAt(0)}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        <View className="w-full flex-row flex-wrap justify-between">
          {renderCard({
            id: 'attendance',
            title: 'Attendance',
            subtitle: "Mark today's roll",
            iconLib: MaterialCommunityIcons,
            icon: 'calendar-check',
            iconColor: '#4F46E5',
            gradient: ['#FFFFFF', '#F5F3FF'],
          })}
          {renderCard({
            id: 'homework',
            title: 'Homework',
            subtitle: 'Assign tasks',
            iconLib: Ionicons,
            icon: 'book',
            iconColor: '#4F46E5',
            gradient: ['#FFFFFF', '#F5F3FF'],
          })}
          {renderCard({
            id: 'announcement',
            title: 'Announcements',
            subtitle: announcementCount > 0 ? 'New updates' : 'Post to parents',
            iconLib: Ionicons,
            icon: 'megaphone',
            iconColor: '#4F46E5',
            gradient: ['#FFFFFF', '#F5F3FF'],
            badgeCount: announcementCount || undefined,
          })}
          {renderCard({
            id: 'test',
            title: 'Test Marks',
            subtitle: 'Enter scores',
            iconLib: Ionicons,
            icon: 'school',
            iconColor: '#4F46E5',
            gradient: ['#FFFFFF', '#F5F3FF'],
          })}
          
          {/* Full Width Timetable */}
          {renderCard({
            id: 'timetable',
            title: 'Timetable',
            subtitle: 'View schedule',
            iconLib: Feather,
            icon: 'clock',
            iconColor: '#4F46E5',
            gradient: ['#FFFFFF', '#F5F3FF'],
            fullWidth: true,
          })}
        </View>
      </ScrollView>
    </View>
  );
}
