import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL } from '../../src/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TeacherAttendance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [studentsData, setStudentsData] = useState({});
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' or 'calendar'
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      try {
        if (!profile?.id) return;
        
        // Fetch only the class where the teacher is the class teacher
        const response = await fetch(`${BASE_URL}/api/attendance/teacher/${profile.id}`);
        const data = await response.json();
        
        if (data.classes && data.classes.length > 0) {
          setClasses(data.classes);
          setActiveClassId(data.classes[0].id);
          setStudentsData(data.students || {});
        } else {
          setClasses([]);
          setActiveClassId(null);
          setStudentsData({});
        }
      } catch (error) {
        console.error('Failed to fetch classes data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassesAndStudents();
  }, [profile?.id]);

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      if (!activeClassId) return;
      
      try {
        setLoading(true);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`${BASE_URL}/api/attendance/records/${activeClassId}/${dateStr}`);
        const result = await response.json();
        
        const currentStudents = studentsData[activeClassId] || [];
        const newAttendanceData = {};
        
        // Initialize all to null (unmarked)
        currentStudents.forEach(student => {
          newAttendanceData[student.id] = null; // default to nil
        });

        if (result.data && result.data.length > 0) {
          result.data.forEach(record => {
            // map 'Present' -> 'P', 'Absent' -> 'A', 'Late' -> 'L'
            let mappedStatus = 'P';
            if (record.status === 'Absent') mappedStatus = 'A';
            if (record.status === 'Late') mappedStatus = 'L';
            newAttendanceData[record.student_id] = mappedStatus;
          });
        }
        
        setAttendanceData(newAttendanceData);
      } catch (error) {
        console.error('Failed to fetch attendance records:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeClassId && Object.keys(studentsData).length > 0) {
      fetchAttendanceRecords();
    }
  }, [activeClassId, selectedDate, studentsData]);
  
  const handleMark = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    // Disabled as requested: do nothing, just trigger touch effect
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const currentStudents = activeClassId ? (studentsData[activeClassId] || []) : [];
  const currentClassName = activeClassId ? classes.find(c => c.id === activeClassId)?.name : '';

  const getStats = () => {
    let present = 0;
    let absent = 0;
    let late = 0;
    
    currentStudents.forEach(student => {
      const status = attendanceData[student.id];
      if (status === 'P') present++;
      if (status === 'A') absent++;
      if (status === 'L') late++;
    });
    return { present, absent, late };
  };

  const stats = getStats();
  
  const dateString = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />
      
      {/* Header Section */}
      <LinearGradient
        colors={['#4F46E5', '#3730A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top || 40 }}
        className="pb-4 rounded-b-[24px] shadow-lg shadow-indigo-600/20 z-10"
      >
        <View className="flex-row items-center px-4 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/20"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Attendance</Text>
        </View>

        {/* Classes Horizontal Scroll */}
        {classes.length > 0 && (
          <View className="px-4 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  onPress={() => setActiveClassId(cls.id)}
                  className={`mr-3 px-5 py-2.5 rounded-full border border-white/30 ${
                    activeClassId === cls.id ? 'bg-white' : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-semibold ${activeClassId === cls.id ? 'text-indigo-700' : 'text-white'}`}>
                    {cls.name} {cls.section ? ` - ${cls.section}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tabs: Mark vs Calendar */}
        <View className="flex-row mx-4 bg-black/20 rounded-xl p-1">
          <TouchableOpacity 
            onPress={() => { setActiveTab('mark'); setShowDatePicker(false); }}
            className={`flex-1 items-center py-2.5 rounded-lg ${activeTab === 'mark' ? 'bg-white' : 'bg-transparent'}`}
          >
            <Text className={`font-bold ${activeTab === 'mark' ? 'text-indigo-700' : 'text-white/80'}`}>Mark attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setActiveTab('calendar'); setShowDatePicker(true); }}
            className={`flex-1 items-center py-2.5 rounded-lg ${activeTab === 'calendar' ? 'bg-white' : 'bg-transparent'}`}
          >
            <Text className={`font-bold ${activeTab === 'calendar' ? 'text-indigo-700' : 'text-white/80'}`}>Calendar view</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {/* Main Content */}
      <View className="flex-1 px-4 pt-4">
        {loading && classes.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : classes.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="school-outline" size={64} color="#E5E7EB" />
            <Text className="mt-4 text-gray-500 font-medium text-center px-6">
              You haven't been assigned any classes yet.
            </Text>
          </View>
        ) : (
          <>
            {/* Date Row */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-gray-500 font-semibold text-base">Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text className="text-indigo-600 font-bold text-base border-b border-indigo-600/30">{dateString}</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-between mb-6 space-x-3">
              <View className="flex-1 bg-green-50 rounded-2xl p-4 items-center justify-center border border-green-100 shadow-sm shadow-green-100">
                <Text className="text-2xl font-black text-green-600 mb-1">{stats.present}</Text>
                <Text className="text-xs font-semibold text-gray-500">Present</Text>
              </View>
              <View className="flex-1 bg-red-50 rounded-2xl p-4 items-center justify-center border border-red-100 shadow-sm shadow-red-100">
                <Text className="text-2xl font-black text-red-600 mb-1">{stats.absent}</Text>
                <Text className="text-xs font-semibold text-gray-500">Absent</Text>
              </View>
              <View className="flex-1 bg-orange-50 rounded-2xl p-4 items-center justify-center border border-orange-100 shadow-sm shadow-orange-100">
                <Text className="text-2xl font-black text-orange-500 mb-1">{stats.late}</Text>
                <Text className="text-xs font-semibold text-gray-500">Late</Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-gray-400 mb-3 tracking-wider uppercase">
              {currentClassName} — {currentStudents.length} STUDENTS
            </Text>

            {/* Students List */}
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#4F46E5" />
              </View>
            ) : currentStudents.length === 0 ? (
              <View className="flex-1 justify-center items-center py-10">
                <Text className="text-gray-400 font-medium">No students found in this class.</Text>
              </View>
            ) : (
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {currentStudents.map((student, index) => {
                  const status = attendanceData[student.id];
                  const rollNo = index + 1; // Sequential numbers as requested
                  
                  return (
                    <View key={student.id} className="flex-row items-center bg-white p-3 mb-3 rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/50">
                      {/* Avatar */}
                      <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mr-3">
                        <Text className="text-indigo-700 font-bold text-base">{getInitials(student.name)}</Text>
                      </View>
                      
                      {/* Info */}
                      <View className="flex-1 justify-center">
                        <Text className="font-bold text-gray-800 text-[15px] mb-0.5">{student.name}</Text>
                        <Text className="text-gray-400 text-xs font-medium">Roll No. {rollNo}</Text>
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row items-center space-x-2">
                        <TouchableOpacity 
                          onPress={() => handleMark(student.id, 'P')}
                          className={`w-10 h-10 rounded-xl items-center justify-center border ${
                            status === 'P' ? 'bg-green-600 border-green-600' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Text className={`font-bold ${status === 'P' ? 'text-white' : 'text-gray-400'}`}>P</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => handleMark(student.id, 'A')}
                          className={`w-10 h-10 rounded-xl items-center justify-center border ${
                            status === 'A' ? 'bg-red-600 border-red-600' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Text className={`font-bold ${status === 'A' ? 'text-white' : 'text-gray-400'}`}>A</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => handleMark(student.id, 'L')}
                          className={`w-10 h-10 rounded-xl items-center justify-center border ${
                            status === 'L' ? 'bg-orange-500 border-orange-500' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Text className={`font-bold ${status === 'L' ? 'text-white' : 'text-gray-400'}`}>L</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Floating Save Button */}
      {!loading && classes.length > 0 && currentStudents.length > 0 && (
        <View className="absolute bottom-6 left-5 right-5">
          <TouchableOpacity 
            onPress={handleSaveAttendance}
            disabled={saving}
            className={`w-full ${saving ? 'bg-indigo-400' : 'bg-indigo-600'} py-4 rounded-2xl shadow-lg shadow-indigo-600/40 items-center flex-row justify-center`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">Save Attendance</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
