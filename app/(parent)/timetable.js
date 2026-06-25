import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Map subject names to colors for visual variety
const SUBJECT_COLORS = {
  'English':   { dot: '#4F46E5', bg: '#EEF2FF', text: '#4F46E5' },
  'Social':    { dot: '#0891B2', bg: '#ECFEFF', text: '#0891B2' },
  'Tamil':     { dot: '#BE185D', bg: '#FDF2F8', text: '#BE185D' },
  'Maths':     { dot: '#059669', bg: '#ECFDF5', text: '#059669' },
  'Science':   { dot: '#D97706', bg: '#FFFBEB', text: '#D97706' },
  'default':   { dot: '#7C3AED', bg: '#F5F3FF', text: '#7C3AED' },
};

function getSubjectColor(subject) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS['default'];
}

function formatTime(timeStr) {
  // timeStr like "09:00:00"
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return { time: `${displayHour}:${m}`, ampm };
}

function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return `${mins}m`;
}

export default function TimetableScreen() {
  const router = useRouter();
  const { student } = useAuthStore();

  const today = new Date();
  const todayDayName = DAY_NAMES[today.getDay()];
  const todayLabel = `${SHORT_DAYS[today.getDay()]}, ${today.getDate()} ${SHORT_MONTHS[today.getMonth()]}`;

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(today.getDay()); // 0=Sun

  const dayName = DAY_NAMES[selectedDay];
  const isWeekend = selectedDay === 0 || selectedDay === 6;

  const fetchTimetable = async (dayIndex) => {
    setLoading(true);
    setError(null);
    const classId = student?.class_id;
    if (!classId) {
      setError('No class assigned to this student.');
      setLoading(false);
      return;
    }

    const dayStr = DAY_NAMES[dayIndex];
    const { data, error: fetchError } = await supabase
      .from('Timetable')
      .select('*')
      .eq('class_id', classId)
      .eq('day_of_week', dayStr)
      .order('period_number', { ascending: true });

    if (fetchError) {
      setError('Failed to load timetable.');
    } else {
      // Deduplicate periods by period_number since the database seems to have duplicate entries
      const uniquePeriods = [];
      const seenPeriods = new Set();
      
      if (data) {
        data.forEach(period => {
          if (!seenPeriods.has(period.period_number)) {
            seenPeriods.add(period.period_number);
            uniquePeriods.push(period);
          }
        });
        
        // Inject static breaks
        if (uniquePeriods.length > 0) {
          uniquePeriods.push({
            id: 'break_short',
            is_break: true,
            break_label: 'Short Break',
            start_time: '10:30:00',
            end_time: '10:45:00',
            period_number: 2.5
          });
          uniquePeriods.push({
            id: 'break_lunch',
            is_break: true,
            break_label: 'Lunch Break',
            start_time: '12:15:00',
            end_time: '13:00:00',
            period_number: 4.5
          });
          
          // Sort by period_number to interleave breaks correctly
          uniquePeriods.sort((a, b) => a.period_number - b.period_number);
        }
      }
      
      setPeriods(uniquePeriods);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetable(selectedDay);
  }, [selectedDay]);

  // Day selector pills — Mon through Sat only
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
      {/* Header */}
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center bg-white/20 rounded-full"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Timetable</Text>
        <View className="w-10" />
      </View>

      {/* Day Selector */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
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
                  <Text style={{
                    fontWeight: '700',
                    fontSize: 13,
                    color: isActive ? '#FFFFFF' : isToday ? '#4F46E5' : '#64748B',
                  }}>
                    {label}{isToday ? ' ·' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Date Title */}
        <View className="flex-row justify-between items-end mb-6">
          <Text className="text-xl font-black text-slate-800 ml-1">{dayName}'s Schedule</Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text className="text-slate-500 font-bold ml-1.5">
              {selectedDay === today.getDay()
                ? todayLabel
                : `${SHORT_DAYS[selectedDay]}`}
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-slate-400 font-medium mt-3">Loading timetable...</Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View className="items-center py-10">
            <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 font-bold mt-3">{error}</Text>
          </View>
        )}

        {/* Weekend Message */}
        {!loading && !error && isWeekend && (
          <View className="items-center py-10">
            <Ionicons name="sunny-outline" size={48} color="#F59E0B" />
            <Text className="text-slate-700 font-black text-lg mt-3">It's the Weekend!</Text>
            <Text className="text-slate-400 font-medium mt-1">No classes scheduled.</Text>
          </View>
        )}

        {/* Periods List */}
        {!loading && !error && !isWeekend && periods.length === 0 && (
          <View className="items-center py-10">
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 font-bold mt-3">No periods found for {dayName}.</Text>
          </View>
        )}

        {!loading && !error && periods.length > 0 && (
          <View className="ml-2">
            {periods.map((period, idx) => {
              const { time, ampm } = formatTime(period.start_time);
              const duration = calcDuration(period.start_time, period.end_time);
              const color = getSubjectColor(period.subject);
              const isBreak = period.is_break;
              const isLast = idx === periods.length - 1;

              if (isBreak) {
                return (
                  <View key={period.id} className="flex-row mb-6 relative">
                    <View className="items-center mr-4 w-[60px]">
                      <Text className="text-sm font-black text-slate-400 mb-1">{time}</Text>
                      <Text className="text-[10px] font-bold text-slate-400">{ampm}</Text>
                    </View>
                    {!isLast && <View className="absolute left-[62px] top-1.5 bottom-[-35px] w-0.5 bg-indigo-100 z-0" />}
                    <View className="absolute left-[59px] top-1.5 h-2 w-2 rounded-full bg-amber-400 z-10 border-2 border-white" />
                    <View className="flex-1 ml-4 bg-amber-50 rounded-[20px] p-4 border border-amber-100">
                      <View className="flex-row items-center">
                        <Ionicons name="fast-food" size={18} color="#D97706" />
                        <Text className="text-base font-black text-amber-700 ml-2">{period.break_label}</Text>
                      </View>
                    </View>
                  </View>
                );
              }

              return (
                <View key={period.id} className="flex-row mb-6 relative">
                  <View className="items-center mr-4 w-[60px]">
                    <Text style={{ fontSize: 13, fontWeight: '900', color: color.dot, marginBottom: 2 }}>{time}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>{ampm}</Text>
                  </View>
                  {!isLast && <View className="absolute left-[62px] top-1.5 bottom-[-35px] w-0.5 bg-indigo-100 z-0" />}
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.dot, position: 'absolute', left: 59, top: 6, zIndex: 10 }} />
                  <View style={{ flex: 1, marginLeft: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#F1F5F9' }}>
                    <View className="flex-row justify-between items-center mb-1">
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E293B' }}>{period.subject}</Text>
                      <View style={{ backgroundColor: color.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: color.text }}>{duration}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
                      Period {period.period_number}
                      {period.room ? ` • ${period.room}` : ''}
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
