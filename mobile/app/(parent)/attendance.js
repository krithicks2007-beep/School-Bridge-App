import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function AttendanceScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2024, 2025, 2026, 2027];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const getDayStatus = (day) => {
    if (!day) return null;
    
    const dateObj = new Date(currentYear, currentMonth, day);
    const dayOfWeek = dateObj.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'Holiday';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    dateObj.setHours(0,0,0,0);
    
    if (dateObj > today) return 'N/A';
    
    if (day === 5 || day === 15) return 'Absent';
    if (day === 18 && currentMonth === 5) return 'Public Holiday';
    
    return 'Present';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return '#10B981';
      case 'Absent': return '#EF4444';
      case 'Holiday': return '#8B5CF6';
      case 'Public Holiday': return '#F59E0B';
      default: return '#CBD5E1';
    }
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const status = getDayStatus(day);
    setSelectedDate({ day, month: currentMonth, year: currentYear, status });
  };

  const overallAttendance = 87.6;

  let workingDays = 0;
  let presentDays = 0;
  let absentDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const status = getDayStatus(d);
    if (status !== 'N/A') {
      if (status !== 'Holiday' && status !== 'Public Holiday') {
        workingDays++;
        if (status === 'Present') presentDays++;
        if (status === 'Absent') absentDays++;
      }
    }
  }

  const renderCalendar = () => {
    const grid = [];
    let currentWeek = [];
    
    for (let i = 0; i < firstDayOffset; i++) {
      currentWeek.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      grid.push(currentWeek);
    }

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <View className="mb-5 overflow-hidden rounded-[24px] bg-white shadow-lg shadow-slate-300/30 border border-slate-100">
        <LinearGradient
          colors={['#4F46E5', '#3730A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 py-4 flex-row items-center justify-between"
        >
          <TouchableOpacity onPress={handlePrevMonth} className="p-2 bg-white/20 rounded-full">
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowPicker(true)} className="flex-row items-center bg-white/10 px-4 py-2 rounded-full">
            <Text className="text-center text-lg font-bold text-white mr-2">
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <Ionicons name="calendar" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNextMonth} className="p-2 bg-white/20 rounded-full">
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <View className="p-5">
          <View className="mb-4 flex-row justify-between">
            {weekDays.map((d, i) => <Text key={i} className="w-[35px] text-center text-[13px] font-bold text-slate-400">{d}</Text>)}
          </View>

          {grid.map((week, rowIndex) => (
            <View key={rowIndex} className="mb-3 flex-row justify-between">
              {week.map((day, colIndex) => {
                const status = getDayStatus(day);
                const isSelected = selectedDate?.day === day && selectedDate?.month === currentMonth && selectedDate?.year === currentYear;

                const cellStyle = day ? {
                  backgroundColor: status === 'N/A' ? '#F1F5F9' : getStatusColor(status) + '15',
                  ...(isSelected ? {
                    borderWidth: 2,
                    borderColor: '#1E293B', // slate-800
                  } : {})
                } : undefined;

                return (
                  <TouchableOpacity 
                    key={colIndex} 
                    className="h-[38px] w-[38px] items-center justify-center rounded-[14px]"
                    style={cellStyle}
                    onPress={() => handleDateClick(day)}
                    disabled={!day}
                  >
                    <Text
                      className="text-[15px]"
                      style={day ? { 
                        color: status === 'N/A' ? '#94A3B8' : getStatusColor(status),
                        fontWeight: isSelected ? '900' : '600'
                      } : undefined}
                    >
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {selectedDate && selectedDate.month === currentMonth && selectedDate.year === currentYear && (
            <View className="mt-3 flex-row items-center justify-between rounded-[16px] bg-slate-50 p-4 border border-slate-100">
              <Text className="text-base font-bold text-slate-700">{monthNames[currentMonth]} {selectedDate.day}, {currentYear}</Text>
              <View className="rounded-xl px-4 py-1.5 shadow-sm" style={{ backgroundColor: getStatusColor(selectedDate.status) }}>
                <Text className="text-[14px] font-black text-white tracking-wide">{selectedDate.status}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Attendance Tracker</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {renderCalendar()}

        <View className="mb-6 mt-2 overflow-hidden rounded-[24px] shadow-md shadow-indigo-300/40">
          <LinearGradient
            colors={['#818CF8', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-row items-center justify-between p-6"
          >
            <View>
              <Text className="mb-1 text-sm font-bold uppercase tracking-wider text-white/80">Overall Attendance</Text>
              <Text className="text-4xl font-black text-white">
                {overallAttendance}%
              </Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="pie-chart" size={32} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </View>

        <Text className="text-lg font-black text-slate-800 mb-4 ml-1">Monthly Overview</Text>
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 mr-2 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200 border border-slate-100 items-center">
            <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mb-2">
              <Ionicons name="briefcase" size={20} color="#3B82F6" />
            </View>
            <Text className="text-3xl font-black text-blue-600 mb-1">{workingDays}</Text>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Working</Text>
          </View>

          <View className="flex-1 mx-1 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200 border border-slate-100 items-center">
             <View className="h-10 w-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            </View>
            <Text className="text-3xl font-black text-emerald-500 mb-1">{presentDays}</Text>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present</Text>
          </View>

          <View className="flex-1 ml-2 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200 border border-slate-100 items-center">
             <View className="h-10 w-10 rounded-full bg-red-100 items-center justify-center mb-2">
              <Ionicons name="close-circle" size={22} color="#EF4444" />
            </View>
            <Text className="text-3xl font-black text-red-500 mb-1">{absentDays}</Text>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absent</Text>
          </View>
        </View>

      </ScrollView>

      {/* Month/Year Picker Custom Modal Overlay */}
      {showPicker && (
        <View className="absolute inset-0 z-[999] justify-end bg-black/60">
          <View className="bg-white rounded-t-[40px] p-6 h-3/5 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-2xl font-black text-slate-800">Select Date</Text>
               <TouchableOpacity onPress={() => setShowPicker(false)} className="bg-slate-100 p-2 rounded-full">
                 <Ionicons name="close" size={24} color="#64748B" />
               </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Month</Text>
              <View className="flex-row flex-wrap justify-between">
                {monthNames.map((m, i) => (
                  <TouchableOpacity 
                     key={m} 
                     className={`w-[31%] p-3 mb-3 rounded-2xl border-2 ${currentMonth === i ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white'}`}
                     onPress={() => {
                       setCurrentDate(new Date(currentYear, i, 1));
                       setSelectedDate(null);
                     }}
                  >
                    <Text className={`text-center font-bold ${currentMonth === i ? 'text-indigo-600' : 'text-slate-600'}`}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-6 mb-4 ml-1">Year</Text>
              <View className="flex-row flex-wrap justify-between pb-10">
                {years.map(y => (
                   <TouchableOpacity 
                     key={y} 
                     className={`w-[23%] p-3 rounded-2xl border-2 ${currentYear === y ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white'}`}
                     onPress={() => {
                       setCurrentDate(new Date(y, currentMonth, 1));
                       setSelectedDate(null);
                     }}
                  >
                    <Text className={`text-center font-bold ${currentYear === y ? 'text-indigo-600' : 'text-slate-600'}`}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}
