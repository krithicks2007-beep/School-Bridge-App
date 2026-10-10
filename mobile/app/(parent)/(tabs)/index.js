import React, { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View, ActivityIndicator, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const isLaptop = width >= 768;
  const router = useRouter();
  const [alertCounts, setAlertCounts] = useState({
    announcements: 0,
    homework: 0,
    testMarks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const studentName = student?.name || 'Rahul Dominic';
  const studentGrade = student?.grade || student?.class?.name || '10th Standard';

  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchAlertCounts = async () => {
        if (!student?.id && !student?.class_id) {
          setAlertCounts({ announcements: 0, homework: 0, testMarks: 0 });
          setLatestAnnouncement(null);
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

          if (announcementData.announcements && announcementData.announcements.length > 0) {
            setLatestAnnouncement(announcementData.announcements[0]);
          } else {
            setLatestAnnouncement(null);
          }

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

  // -------------------------------------------------------------
  // 1. LAPTOP DESKTOP PORTAL VIEW (For Width >= 768px)
  // -------------------------------------------------------------
  if (isLaptop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F1F5F9' }}>
        {/* Left Sidebar Navigation */}
        <View style={{ width: 260, backgroundColor: '#1E1B4B', padding: 20, flexDirection: 'column', justifyContent: 'space-between' }}>
          <View>
            {/* School Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(99, 102, 241, 0.2)' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
                <Image
                  source={require('../../../assets/pictures/school_logo.png')}
                  style={{ width: 26, height: 26 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF' }} numberOfLines={1}>Einstein School</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#A5B4FC' }}>Parent Portal</Text>
              </View>
            </View>

            {/* Nav Menu Header */}
            <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(165, 180, 252, 0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 8 }}>Navigation</Text>
            
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#4F46E5', marginBottom: 6 }} onPress={() => router.push('/(parent)')}>
              <Ionicons name="grid" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginLeft: 12 }}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/announcement')}>
              <Ionicons name="megaphone-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Announcements</Text>
              {alertCounts.announcements > 0 && (
                <View style={{ marginLeft: 'auto', backgroundColor: '#F43F5E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>{alertCounts.announcements}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/homework')}>
              <Ionicons name="book-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Homework</Text>
              {alertCounts.homework > 0 && (
                <View style={{ marginLeft: 'auto', backgroundColor: '#F43F5E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>{alertCounts.homework}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/timetable')}>
              <Ionicons name="calendar-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Timetable</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/attendance')}>
              <Ionicons name="stats-chart-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/test')}>
              <Ionicons name="school-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Test Marks</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/transport')}>
              <Ionicons name="bus-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Transport</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/(tabs)/chat')}>
              <Ionicons name="chatbubbles-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 6 }} onPress={() => router.push('/(parent)/(tabs)/profile')}>
              <Ionicons name="person-outline" size={18} color="#A5B4FC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#E0E7FF', marginLeft: 12 }}>Student Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Student Profile Card at Sidebar Bottom */}
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: 'rgba(30, 27, 75, 0.8)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' }} onPress={() => logoutUser()}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF' }}>{studentName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>{studentName}</Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#A5B4FC' }}>Sign Out</Text>
            </View>
            <Ionicons name="log-out-outline" size={18} color="#A5B4FC" />
          </TouchableOpacity>
        </View>

        {/* Laptop Main Workspace */}
        <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 28 }} showsVerticalScrollIndicator={false}>
          {/* Top Desktop Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>Parent Dashboard</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2 }}>Einstein Higher Secondary School • School Bridge Portal</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#F1F5F9', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications-outline" size={20} color="#1E1B4B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2-Column Laptop Dashboard Layout */}
          <View style={{ flexDirection: 'row', gap: 24 }}>
            {/* Main Center Column (68%) */}
            <View style={{ flex: 0.68 }}>
              {/* Hero Banner */}
              <View style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden' }}>
                <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 }}>
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#BFDBFE', marginBottom: 2 }}>{getGreeting()}</Text>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 }}>{studentName}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#DBEAFE' }}>Class: {studentGrade} • Section A</Text>
                  </View>
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.25)', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF' }}>{studentName.charAt(0)}</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Quick Actions Grid (3 columns) */}
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 12, marginLeft: 4 }}>Quick Access</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
                
                {/* Announcement Card */}
                <TouchableOpacity
                  style={{ width: '31%', height: 120, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 16, justifyContent: 'space-between' }}
                  onPress={() => router.push('/(parent)/announcement')}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Ionicons name="megaphone" size={26} color="#2563EB" />
                    {alertCounts.announcements > 0 && (
                      <View style={{ backgroundColor: '#F43F5E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>{alertCounts.announcements}</Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Announcement</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }} numberOfLines={1}>
                      {alertCounts.announcements > 0 ? 'New updates' : 'No new updates'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Timetable Card */}
                <TouchableOpacity
                  style={{ width: '31%', height: 120, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 16, justifyContent: 'space-between' }}
                  onPress={() => router.push('/(parent)/timetable')}
                >
                  <Feather name="clock" size={26} color="#2563EB" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Timetable</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }} numberOfLines={1}>View daily schedule</Text>
                  </View>
                </TouchableOpacity>

                {/* Homework Card */}
                <TouchableOpacity
                  style={{ width: '31%', height: 120, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 16, justifyContent: 'space-between' }}
                  onPress={() => router.push('/(parent)/homework')}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Ionicons name="book" size={26} color="#2563EB" />
                    {alertCounts.homework > 0 && (
                      <View style={{ backgroundColor: '#F43F5E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>{alertCounts.homework}</Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Homework</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }} numberOfLines={1}>
                      {alertCounts.homework > 0 ? `${alertCounts.homework} pending` : 'Check pending tasks'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Attendance Card */}
                <TouchableOpacity
                  style={{ width: '31%', height: 120, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 16, justifyContent: 'space-between' }}
                  onPress={() => router.push('/(parent)/attendance')}
                >
                  <MaterialCommunityIcons name="calendar-check" size={26} color="#2563EB" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Attendance</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }} numberOfLines={1}>87.6% overall</Text>
                  </View>
                </TouchableOpacity>

                {/* Test Marks Card */}
                <TouchableOpacity
                  style={{ width: '31%', height: 120, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 16, justifyContent: 'space-between' }}
                  onPress={() => router.push('/(parent)/test')}
                >
                  <Ionicons name="school" size={26} color="#2563EB" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Test Marks</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }} numberOfLines={1}>View report card</Text>
                  </View>
                </TouchableOpacity>

                {/* Transport Card */}
                <TouchableOpacity
                  style={{ width: '31%', height: 120, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 16, justifyContent: 'space-between' }}
                  onPress={() => router.push('/(parent)/transport')}
                >
                  <Ionicons name="bus" size={26} color="#2563EB" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Transport</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }} numberOfLines={1}>View bus details</Text>
                  </View>
                </TouchableOpacity>

              </View>

              {/* Feed Card: Announcements & Updates */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>Latest School Announcement</Text>
                  <TouchableOpacity onPress={() => router.push('/(parent)/announcement')}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>View All</Text>
                  </TouchableOpacity>
                </View>

                {latestAnnouncement ? (
                  <View style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}>
                          {latestAnnouncement.target_audience?.startsWith('student:') ? 'Direct' : 'School Notice'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#94A3B8' }}>
                        {latestAnnouncement.created_at ? new Date(latestAnnouncement.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>{latestAnnouncement.title}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 20 }} numberOfLines={3}>{latestAnnouncement.content}</Text>
                  </View>
                ) : (
                  <View style={{ padding: 24, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B', marginTop: 8 }}>No announcements published yet.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Right Sidebar Widgets (32%) */}
            <View style={{ flex: 0.32 }}>
              
              {/* Attendance Widget */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>Attendance Summary</Text>
                  <Ionicons name="pie-chart-outline" size={18} color="#4F46E5" />
                </View>
                <View style={{ alignItems: 'center', paddingVertical: 16, backgroundColor: 'rgba(79, 70, 229, 0.05)', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.1)' }}>
                  <Text style={{ fontSize: 30, fontWeight: '900', color: '#4F46E5' }}>87.6%</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4 }}>Overall Attendance</Text>
                </View>
                <TouchableOpacity style={{ paddingVertical: 10, alignItems: 'center', backgroundColor: '#4F46E5', borderRadius: 12 }} onPress={() => router.push('/(parent)/attendance')}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>View Full Calendar</Text>
                </TouchableOpacity>
              </View>

              {/* Live Bus Tracker Widget */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>Live Transport</Text>
                  <Ionicons name="bus-outline" size={18} color="#2563EB" />
                </View>
                <View style={{ padding: 14, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Bus No. 12</Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>Arrives in 10 mins</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Pickup: MG Road Junction</Text>
                </View>
                <TouchableOpacity style={{ paddingVertical: 10, alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 12 }} onPress={() => router.push('/(parent)/transport')}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Track Transport</Text>
                </TouchableOpacity>
              </View>

              {/* Today's Timetable Widget */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>Today's Schedule</Text>
                  <Ionicons name="time-outline" size={18} color="#D97706" />
                </View>
                <View style={{ padding: 14, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FEF3C7', marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Mathematics</Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>09:00 AM • Room 101</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Prof. Sharma</Text>
                </View>
                <TouchableOpacity style={{ paddingVertical: 10, alignItems: 'center', backgroundColor: '#D97706', borderRadius: 12 }} onPress={() => router.push('/(parent)/timetable')}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>View Full Schedule</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 2. MOBILE PHONE VIEW (For Width < 768px - Native Mobile View)
  // -------------------------------------------------------------
  const renderCard = ({ id, title, subtitle, boldSubtitle, iconLib: IconLib, icon, iconColor, gradient, badgeCount }) => (
    <TouchableOpacity
      key={id}
      style={{
        width: '48%',
        height: 124,
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8EDF5',
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
      }}
      activeOpacity={0.85}
      onPress={() => router.push(`/(parent)/${id}`)}
    >
      <LinearGradient
        colors={gradient}
        style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top Card Row: Icon & Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(37, 99, 235, 0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <IconLib name={icon} size={22} color={iconColor} />
          </View>

          {badgeCount ? (
            <View style={{ height: 22, minWidth: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>{badgeCount}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Card Content: Title & Subtitle with Chevron */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 }} numberOfLines={1}>{title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {boldSubtitle ? (
              <Text style={{ flex: 1, fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                <Text style={{ fontWeight: '700', color: '#2563EB' }}>{boldSubtitle}</Text>
                {' '}{subtitle}
              </Text>
            ) : (
              <Text style={{ flex: 1, fontSize: 12, color: '#64748B' }} numberOfLines={1}>{subtitle}</Text>
            )}
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <LinearGradient
        colors={['#E8F0FE', '#FDF2F8', '#FFF8EC']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Top Navigation Bar */}
      <View style={{ backgroundColor: '#FFFFFF', paddingTop: insets.top || StatusBar.currentHeight || 40, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#D4AF37', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {logoError ? (
              <Ionicons name="school" size={22} color="#D4AF37" />
            ) : (
              <Image
                source={require('../../../assets/pictures/school_logo.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
                onError={() => setLogoError(true)}
              />
            )}
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>Einstein Higher Secondary School</Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 }}>School Bridge App</Text>
          </View>
          <TouchableOpacity style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={20} color="#1E1B4B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: (insets.bottom || 20) + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Card */}
        <View style={{ marginBottom: 20, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 }}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255, 255, 255, 0.85)', marginBottom: 2 }}>{getGreeting()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginRight: 8 }} numberOfLines={1}>{studentName}</Text>
                {isLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.75)' }}>{studentGrade}</Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setProfileModalVisible(true)}>
              {student?.photo_url ? (
                <Image
                  source={{ uri: student.photo_url }}
                  style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#FFFFFF' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.25)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF' }}>{studentName.charAt(0)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Profile Modal */}
        <Modal visible={profileModalVisible} transparent animationType="fade" onRequestClose={() => setProfileModalVisible(false)}>
          <TouchableOpacity 
            activeOpacity={1} 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }} 
            onPress={() => setProfileModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center' }}>
                {student?.photo_url ? (
                  <Image 
                    source={{ uri: student.photo_url }} 
                    style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#DBEAFE', marginBottom: 16 }}
                  />
                ) : (
                  <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#DBEAFE', marginBottom: 16 }}>
                    <Text style={{ fontSize: 44, fontWeight: '900', color: '#FFFFFF' }}>{studentName.charAt(0)}</Text>
                  </View>
                )}
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4, textAlign: 'center' }}>{studentName}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563EB', marginBottom: 20 }}>Grade {studentGrade}</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#F1F5F9', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} 
                  onPress={() => setProfileModalVisible(false)}
                >
                  <Text style={{ fontWeight: '700', color: '#334155' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Grid Cards Container */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {renderCard({
            id: 'announcement',
            title: 'Announcement',
            subtitle: alertCounts.announcements > 0 ? 'New updates' : 'No new updates',
            iconLib: Ionicons,
            icon: 'megaphone',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F8FAFC'],
            badgeCount: alertCounts.announcements || undefined,
          })}
          {renderCard({
            id: 'timetable',
            title: 'Timetable',
            subtitle: 'View daily schedule',
            iconLib: Feather,
            icon: 'clock',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F8FAFC'],
          })}
          {renderCard({
            id: 'homework',
            title: 'Homework',
            boldSubtitle: alertCounts.homework > 0 ? String(alertCounts.homework) : undefined,
            subtitle: alertCounts.homework > 0 ? 'New pending tasks' : 'Check pending tasks',
            iconLib: Ionicons,
            icon: 'book',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F8FAFC'],
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
            gradient: ['#FFFFFF', '#F8FAFC'],
          })}
          {renderCard({
            id: 'test',
            title: 'Test Mark',
            subtitle: alertCounts.testMarks > 0 ? 'New marks posted' : 'No new marks',
            iconLib: Ionicons,
            icon: 'school',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F8FAFC'],
            badgeCount: alertCounts.testMarks || undefined,
          })}
          {renderCard({
            id: 'transport',
            title: 'Transport',
            subtitle: 'View bus details',
            iconLib: Ionicons,
            icon: 'bus',
            iconColor: '#2563EB',
            gradient: ['#FFFFFF', '#F8FAFC'],
          })}
        </View>
      </ScrollView>
    </View>
  );
}
