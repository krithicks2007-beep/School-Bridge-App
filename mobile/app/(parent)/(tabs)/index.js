import React, { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, Text, TouchableOpacity, TouchableWithoutFeedback, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { BASE_URL , apiFetch} from '../../../src/services/api';
import { countUnreadSince, getExamMarkAlertItems, getLastReadAt } from '../../../src/services/readAlerts';

export default function ParentHome() {
  const [logoError, setLogoError] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { student, logoutUser } = useAuthStore();
  const router = useRouter();
  const [alertCounts, setAlertCounts] = useState({
    announcements: 0,
    homework: 0,
    testMarks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const studentName = student?.name || 'Student';

  useFocusEffect(
    useCallback(() => {
      const fetchAlertCounts = async () => {
        if (!student?.id && !student?.class_id) {
          setAlertCounts({ announcements: 0, homework: 0, testMarks: 0 });
          setIsLoading(false);
          return;
        }

        const cacheKey = `parent-dashboard-alerts-${student.id}`;

        try {
          const cachedData = await AsyncStorage.getItem(cacheKey);
          if (cachedData) {
            setAlertCounts(JSON.parse(cachedData));
            setIsLoading(false);
          }

          const studentId = student?.student_id || student?.id;
          const announcementUrl = `${BASE_URL}/api/announcements?studentId=${student?.id || ''}&classId=${student?.class_id || ''}`;
          const homeworkUrl = student?.class_id ? `${BASE_URL}/api/homework/class/${student.class_id}` : null;
          const testMarksUrl = studentId ? `${BASE_URL}/api/marks/parent/${studentId}` : null;

          const [announcementResponse, homeworkResponse, testMarksResponse] = await Promise.all([
            apiFetch(announcementUrl),
            homeworkUrl ? apiFetch(homeworkUrl) : Promise.resolve(null),
            testMarksUrl ? apiFetch(testMarksUrl) : Promise.resolve(null),
          ]);

          const announcementData = announcementResponse.ok ? await announcementResponse.json() : {};
          const homeworkData = homeworkResponse?.ok ? await homeworkResponse.json() : {};
          const testMarksData = testMarksResponse?.ok ? await testMarksResponse.json() : {};
          const [lastReadAnnouncements, lastReadHomework, lastReadTestMarks] = await Promise.all([
            getLastReadAt('parent-announcements', student?.id),
            getLastReadAt('parent-homework', student?.id),
            getLastReadAt('parent-test-marks', student?.id),
          ]);

          const newAlertCounts = {
            announcements: countUnreadSince(announcementData.announcements, lastReadAnnouncements),
            homework: countUnreadSince(homeworkData.data, lastReadHomework),
            testMarks: countUnreadSince(getExamMarkAlertItems(testMarksData.data), lastReadTestMarks),
          };

          setAlertCounts(newAlertCounts);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(newAlertCounts));
        } catch (error) {
          console.error('Failed to fetch parent home alert counts:', error);
          if (isLoading) {
            setAlertCounts({ announcements: 0, homework: 0, testMarks: 0 });
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchAlertCounts();
    }, [student?.id, student?.class_id])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const renderCard = ({ id, title, subtitle, boldSubtitle, iconLib: IconLib, icon, iconColor, gradient, badgeCount }) => (
    <TouchableOpacity
      key={id}
      className="mb-4 h-[128px] w-[48%] overflow-hidden rounded-[20px] border border-[#E8EDF5] bg-white shadow-md shadow-blue-900/10"
      activeOpacity={0.85}
      onPress={() => router.push(`/(parent)/${id}`)}
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
        <View className="mb-6 w-full overflow-hidden rounded-[24px] shadow-xl shadow-blue-600/25">
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-row items-center justify-between p-6"
          >
            <View className="flex-1 pr-3">
              <Text className="mb-0.5 text-sm font-medium text-white/85">{getGreeting()}</Text>
              <View className="flex-row items-center">
                <Text className="mb-2.5 text-[26px] font-black leading-8 text-white mr-2" numberOfLines={2}>{studentName}</Text>
                {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
              </View>
              <Text className="text-xs font-medium text-white/70">{student?.grade || ''}</Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setProfileModalVisible(true)}>
              {student?.photo_url ? (
                <Image
                  source={{ uri: student.photo_url }}
                  style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-blue-400 shadow-md">
                  <Text className="text-[22px] font-black text-white">{studentName.charAt(0)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Modal visible={profileModalVisible} transparent animationType="fade" onRequestClose={() => setProfileModalVisible(false)}>
          <TouchableOpacity 
            activeOpacity={1} 
            className="flex-1 bg-black/60 items-center justify-center px-6" 
            onPress={() => setProfileModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1}>
              <View className="bg-white w-full rounded-[24px] overflow-hidden items-center p-6 shadow-2xl">
                {student?.photo_url ? (
                  <Image 
                    source={{ uri: student.photo_url }} 
                    className="h-32 w-32 rounded-full border-4 border-blue-100 mb-4"
                  />
                ) : (
                  <View className="h-32 w-32 rounded-full bg-blue-400 items-center justify-center border-4 border-blue-100 mb-4">
                    <Text className="text-5xl font-black text-white">{studentName.charAt(0)}</Text>
                  </View>
                )}
                <Text className="text-2xl font-black text-gray-900 mb-1 text-center">{studentName}</Text>
                <Text className="text-sm font-medium text-blue-600 mb-4">Grade {student?.grade || ''}</Text>
                <TouchableOpacity 
                  className="bg-gray-100 w-full py-3 rounded-xl items-center" 
                  onPress={() => setProfileModalVisible(false)}
                >
                  <Text className="font-bold text-gray-700">Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <View className="w-full flex-row flex-wrap justify-between">
          {renderCard({
            id: 'announcement',
            title: 'Announcement',
            subtitle: alertCounts.announcements > 0 ? 'New updates' : 'No new updates',
            iconLib: Ionicons,
            icon: 'megaphone',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F0F6FF'],
            badgeCount: alertCounts.announcements || undefined,
          })}
          {renderCard({
            id: 'timetable',
            title: 'Timetable',
            subtitle: 'View daily schedule',
            iconLib: Feather,
            icon: 'clock',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F0F6FF'],
          })}
          {renderCard({
            id: 'homework',
            title: 'Homework',
            boldSubtitle: alertCounts.homework > 0 ? String(alertCounts.homework) : undefined,
            subtitle: alertCounts.homework > 0 ? 'New pending tasks' : 'Check pending tasks',
            iconLib: Ionicons,
            icon: 'book',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F0F6FF'],
            badgeCount: alertCounts.homework || undefined,
          })}
          {renderCard({
            id: 'attendance',
            title: 'Attendance',
            boldSubtitle: '87.6%',
            subtitle: 'overall',
            iconLib: MaterialCommunityIcons,
            icon: 'calendar-check',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F0F6FF'],
          })}
          {renderCard({
            id: 'test',
            title: 'Test Mark',
            subtitle: alertCounts.testMarks > 0 ? 'New marks posted' : 'No new marks',
            iconLib: Ionicons,
            icon: 'school',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F0F6FF'],
            badgeCount: alertCounts.testMarks || undefined,
          })}
          {renderCard({
            id: 'transport',
            title: 'Transport',
            subtitle: 'View bus details',
            iconLib: Ionicons,
            icon: 'bus',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F0F6FF'],
          })}
        </View>
      </ScrollView>
    </View>
  );
}
