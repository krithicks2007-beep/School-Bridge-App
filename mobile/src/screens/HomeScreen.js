import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL , apiFetch} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { countUnreadSince, getExamMarkAlertItems, getLastReadAt } from '../services/readAlerts';

export default function HomeScreen({ onNavigate }) {
  const [logoError, setLogoError] = useState(false);
  const insets = useSafeAreaInsets();
  const { student } = useAuthStore();
  const [alertCounts, setAlertCounts] = useState({
    announcements: 0,
    homework: 0,
    testMarks: 0,
  });

  useEffect(() => {
    const fetchAlertCounts = async () => {
      if (!student?.id && !student?.class_id) {
        setAlertCounts({ announcements: 0, homework: 0, testMarks: 0 });
        return;
      }

      try {
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

        setAlertCounts({
          announcements: countUnreadSince(announcementData.announcements, lastReadAnnouncements),
          homework: countUnreadSince(homeworkData.data, lastReadHomework),
          testMarks: countUnreadSince(getExamMarkAlertItems(testMarksData.data), lastReadTestMarks),
        });
      } catch (error) {
        console.error('Failed to fetch home alert counts:', error);
        setAlertCounts({ announcements: 0, homework: 0, testMarks: 0 });
      }
    };

    fetchAlertCounts();
  }, [student?.id, student?.class_id]);

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
      onPress={() => onNavigate && onNavigate(id)}
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
                source={require('../../assets/pictures/school_logo.png')}
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
              <Text className="mb-2.5 text-[26px] font-black leading-8 text-white" numberOfLines={2}>Mr. Dominic.</Text>
            </View>

            <Image
              source={require('../../assets/pictures/pic.jpg')}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-white shadow-md"
              resizeMode="cover"
            />
          </LinearGradient>
        </View>

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
            subtitle: alertCounts.homework > 0 ? 'pending tasks' : 'No pending tasks',
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
            boldSubtitle: '10m',
            subtitle: 'Bus arrives in',
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
