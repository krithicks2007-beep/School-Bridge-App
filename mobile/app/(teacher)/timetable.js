import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BASE_URL, handleApiResponse } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SUBJECT_COLORS = {
  English: { dot: '#4F46E5', bg: '#EEF2FF', text: '#4F46E5' },
  Social: { dot: '#0891B2', bg: '#ECFEFF', text: '#0891B2' },
  Tamil: { dot: '#BE185D', bg: '#FDF2F8', text: '#BE185D' },
  Maths: { dot: '#059669', bg: '#ECFDF5', text: '#059669' },
  Mathematics: { dot: '#059669', bg: '#ECFDF5', text: '#059669' },
  Science: { dot: '#D97706', bg: '#FFFBEB', text: '#D97706' },
  default: { dot: '#7C3AED', bg: '#F5F3FF', text: '#7C3AED' },
};

function getSubjectColor(subject) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
}

function formatTime(timeStr) {
  if (!timeStr) return { time: '--:--', ampm: '' };
  const [h, m = '00'] = String(timeStr).split(':');
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return { time: '--:--', ampm: '' };
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return { time: `${displayHour}:${m}`, ampm };
}

function calcDuration(start, end) {
  if (!start || !end) return '';
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return '';
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? `${mins}m` : '';
}

export default function TeacherTimetableScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const today = new Date();
  const todayLabel = `${SHORT_DAYS[today.getDay()]}, ${today.getDate()} ${SHORT_MONTHS[today.getMonth()]}`;

  const [classes, setClasses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(today.getDay());

  const dayName = DAY_NAMES[selectedDay];
  const isWeekend = selectedDay === 0 || selectedDay === 6;

  const fetchTimetable = async (dayIndex) => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/timetable/teacher-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: profile.id,
          day_of_week: DAY_NAMES[dayIndex],
          handlingClasses: profile.handling_classes || [],
          teacherProfile: profile,
        }),
      });
      const result = await handleApiResponse(response);
      const schedulePeriods = result.data || [];

      if (schedulePeriods.length > 0) {
        schedulePeriods.push(
          {
            id: 'break_short',
            is_break: true,
            break_label: 'Short Break',
            start_time: '10:30:00',
            end_time: '10:45:00',
            period_number: 2.5,
          },
          {
            id: 'break_lunch',
            is_break: true,
            break_label: 'Lunch Break',
            start_time: '12:15:00',
            end_time: '13:00:00',
            period_number: 4.5,
          }
        );
      }

      schedulePeriods.sort((a, b) => Number(a.period_number) - Number(b.period_number));
      setClasses(result.classes || []);
      setPeriods(schedulePeriods);
    } catch (err) {
      console.error('Failed to load teacher schedule:', err);
      setError('Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable(selectedDay);
  }, [selectedDay, profile?.id, profile?.handling_classes]);

  const weekDays = [
    { index: 1, label: 'Mon' },
    { index: 2, label: 'Tue' },
    { index: 3, label: 'Wed' },
    { index: 4, label: 'Thu' },
    { index: 5, label: 'Fri' },
    { index: 6, label: 'Sat' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="relative z-20 rounded-b-[30px] pb-6 pt-6 shadow-lg" style={{ backgroundColor: '#4F46E5' }}>
        <View className="mb-4 flex-row items-center justify-between px-6">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-black tracking-wide text-white">Timetable</Text>
          <View className="w-10" />
        </View>

        <View className="mx-6 rounded-xl bg-white/15 px-4 py-3">
          <View className="flex-row items-center">
            <Ionicons name="briefcase" size={18} color="#FFFFFF" />
            <Text className="ml-2 text-sm font-bold text-white">
              {classes.length > 0 ? `${classes.length} handled class${classes.length > 1 ? 'es' : ''}` : 'Teacher schedule'}
            </Text>
          </View>
          <Text className="mt-1 text-xs font-medium text-white/75">
            Showing each period with class and subject
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, zIndex: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {weekDays.map(({ index, label }) => {
              const isActive = selectedDay === index;
              const isToday = today.getDay() === index;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDay(index)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive ? '#4F46E5' : '#F1F5F9',
                    borderWidth: isToday && !isActive ? 1.5 : 0,
                    borderColor: '#4F46E5',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '700',
                      fontSize: 13,
                      color: isActive ? '#FFFFFF' : isToday ? '#4F46E5' : '#64748B',
                    }}
                  >
                    {label}{isToday ? ' *' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} className="z-10">
        <View className="mb-6 flex-row items-end justify-between">
          <Text className="ml-1 text-xl font-black text-slate-800">Your {dayName} Schedule</Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text className="ml-1.5 font-bold text-slate-500">
              {selectedDay === today.getDay() ? todayLabel : `${SHORT_DAYS[selectedDay]}`}
            </Text>
          </View>
        </View>

        {loading && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-3 font-medium text-slate-400">Loading timetable...</Text>
          </View>
        )}

        {!loading && error && (
          <View className="items-center py-10">
            <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
            <Text className="mt-3 font-bold text-slate-400">{error}</Text>
          </View>
        )}

        {!loading && !error && isWeekend && (
          <View className="items-center py-10">
            <Ionicons name="sunny-outline" size={48} color="#F59E0B" />
            <Text className="mt-3 text-lg font-black text-slate-700">It's the Weekend!</Text>
            <Text className="mt-1 font-medium text-slate-400">No classes scheduled.</Text>
          </View>
        )}

        {!loading && !error && !isWeekend && periods.length === 0 && (
          <View className="items-center py-10">
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text className="mt-3 text-center font-bold text-slate-400">No handled periods found for {dayName}.</Text>
          </View>
        )}

        {!loading && !error && periods.length > 0 && (
          <View className="ml-2">
            {periods.map((period, idx) => {
              const { time, ampm } = formatTime(period.start_time);
              const duration = calcDuration(period.start_time, period.end_time);
              const subject = period.subject || period.subject_name || 'Subject';
              const classLabel = `${period.class_name || 'Class'}${period.class_section ? ` ${period.class_section}` : ''}`;
              const color = getSubjectColor(subject);
              const isBreak = period.is_break;
              const isLast = idx === periods.length - 1;

              if (isBreak) {
                return (
                  <View key={period.id} className="relative mb-6 flex-row">
                    <View className="mr-4 w-[60px] items-center">
                      <Text className="mb-1 text-sm font-black text-slate-400">{time}</Text>
                      <Text className="text-[10px] font-bold text-slate-400">{ampm}</Text>
                    </View>
                    {!isLast && <View className="absolute bottom-[-35px] left-[62px] top-1.5 z-0 w-0.5 bg-indigo-100" />}
                    <View className="absolute left-[59px] top-1.5 z-10 h-2 w-2 rounded-full border-2 border-white bg-amber-400" />
                    <View className="ml-4 flex-1 rounded-[20px] border border-amber-100 bg-amber-50 p-4">
                      <View className="flex-row items-center">
                        <Ionicons name="fast-food" size={18} color="#D97706" />
                        <Text className="ml-2 text-base font-black text-amber-700">{period.break_label}</Text>
                      </View>
                    </View>
                  </View>
                );
              }

              return (
                <View key={period.id} className="relative mb-6 flex-row">
                  <View className="mr-4 w-[60px] items-center">
                    <Text style={{ fontSize: 13, fontWeight: '900', color: color.dot, marginBottom: 2 }}>{time}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>{ampm}</Text>
                  </View>
                  {!isLast && <View className="absolute bottom-[-35px] left-[62px] top-1.5 z-0 w-0.5 bg-indigo-100" />}
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.dot, position: 'absolute', left: 59, top: 6, zIndex: 10 }} />
                  <View style={{ flex: 1, marginLeft: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' }}>
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E293B' }}>{classLabel}</Text>
                      {!!duration && (
                        <View style={{ backgroundColor: color.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: color.text }}>{duration}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 14, color: color.text, fontWeight: '900', marginBottom: 3 }}>
                      {subject}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
                      Period {period.period_number}
                      {period.room ? ` - ${period.room}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
