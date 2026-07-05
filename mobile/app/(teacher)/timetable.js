import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { BASE_URL, handleApiResponse } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export default function TeacherTimetableScreen() {
  const router = useRouter();

  const { profile } = useAuthStore();
  const today = new Date();
  const todayLabel = `${SHORT_DAYS[today.getDay()]}, ${today.getDate()} ${SHORT_MONTHS[today.getMonth()]}`;

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(today.getDay()); // 0=Sun

  const dayName = DAY_NAMES[selectedDay];
  const isWeekend = selectedDay === 0 || selectedDay === 6;

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (!profile?.id) return;
        const response = await fetch(`${BASE_URL}/api/attendance/classes/teacher-handled`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ teacherId: profile.id })
        });
        const data = await response.json();
        
        if (data.classes && data.classes.length > 0) {
          setClasses(data.classes);
          setActiveClassId(data.classes[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();
  }, [profile?.id]);

  const fetchTimetable = async (dayIndex, classId) => {
    if (!classId) return;
    
    setLoading(true);
    setError(null);

    const dayStr = DAY_NAMES[dayIndex];
    
    try {
      const response = await fetch(`${BASE_URL}/api/timetable?class_id=${classId}&day_of_week=${dayStr}`);
      const result = await handleApiResponse(response);
      const data = result.data;

      const uniquePeriods = [];
      const seenPeriods = new Set();
      
      if (data) {
        data.forEach(period => {
          if (!seenPeriods.has(period.period_number)) {
            seenPeriods.add(period.period_number);
            uniquePeriods.push(period);
          }
        });

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

          uniquePeriods.sort((a, b) => a.period_number - b.period_number);
        }
      }
      
      setPeriods(uniquePeriods);
    } catch (err) {
      setError('Failed to load timetable.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetable(selectedDay, activeClassId);
  }, [selectedDay, activeClassId]);

  const handleUpdateClick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled) {
        Alert.alert('File Selected', 'Timetable file was selected, but update functionality is currently a placeholder.');
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const weekDays = [
    { index: 1, label: 'Mon' },
    { index: 2, label: 'Tue' },
    { index: 3, label: 'Wed' },
    { index: 4, label: 'Thu' },
    { index: 5, label: 'Fri' },
    { index: 6, label: 'Sat' },
  ];

  const currentClassName = classes.find(c => c.id === activeClassId)?.name || 'Select Class';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="rounded-b-[30px] shadow-lg pb-6 pt-6 z-20 relative" style={{ backgroundColor: '#4F46E5' }}>
        <View className="flex-row items-center justify-between px-6 mb-4">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center bg-white/20 rounded-full"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-white tracking-wide">Timetable</Text>
          <View className="w-10" />
        </View>

        {/* Dropdown for Class Selection */}
        <View className="px-6 relative z-30">
          <TouchableOpacity 
            onPress={() => setDropdownOpen(!dropdownOpen)}
            className="bg-white rounded-xl px-4 py-3 flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-row items-center">
              <Ionicons name="school" size={20} color="#4F46E5" />
              <Text className="ml-3 text-slate-800 font-bold">{currentClassName}</Text>
            </View>
            <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
          </TouchableOpacity>
          
          {dropdownOpen && (
            <View className="absolute top-[52px] left-6 right-6 bg-white rounded-xl shadow-lg border border-slate-100 max-h-48 z-50">
              <ScrollView nestedScrollEnabled={true}>
                {classes.map(cls => (
                  <TouchableOpacity 
                    key={cls.id}
                    className={`px-4 py-3 border-b border-slate-50 ${activeClassId === cls.id ? 'bg-indigo-50' : ''}`}
                    onPress={() => {
                      setActiveClassId(cls.id);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text className={`font-semibold ${activeClassId === cls.id ? 'text-indigo-600' : 'text-slate-600'}`}>
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Day Selector */}
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

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false} className="z-10">

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

        {/* Update Timetable Button (Only for Class Teacher) */}
        {classes.find(c => c.id === activeClassId)?.teacher_id === profile?.id && (
          <TouchableOpacity 
            onPress={handleUpdateClick}
            className="bg-indigo-100 py-4 mt-6 rounded-2xl flex-row items-center justify-center border border-indigo-200"
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#4F46E5" />
            <Text className="ml-2 font-bold text-indigo-700 text-lg">Update Timetable</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
