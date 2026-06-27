import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL } from '../../src/services/api';

export default function Homework() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentsData, setStudentsData] = useState({});

  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      try {
        if (!profile?.id) return;
        
        // Fetch classes handled by the teacher for the dropdown
        const response = await fetch(`${BASE_URL}/api/attendance/classes/teacher-handled`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId: profile.id,
            handlingClasses: profile.handling_classes || []
          })
        });
        const data = await response.json();
        
        if (data.classes && data.classes.length > 0) {
          setClasses(data.classes);
          setActiveClassId(data.classes[0].id);
        }

        // Fetch students for all teacher-handled classes
        const studentsRes = await fetch(`${BASE_URL}/api/attendance/students/teacher-handled`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId: profile.id,
            handlingClasses: profile.handling_classes || []
          })
        });
        const studentsResult = await studentsRes.json();
        setStudentsData(studentsResult.students || {});
      } catch (error) {
        console.error('Failed to fetch classes data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassesAndStudents();
  }, [profile?.id]);

  const currentClassName = activeClassId ? classes.find(c => c.id === activeClassId)?.name : 'Select Class';
  const currentStudents = activeClassId ? (studentsData[activeClassId] || []) : [];

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
      <View className="rounded-b-[30px] shadow-lg pb-6 pt-6 z-20 relative" style={{ backgroundColor: '#4F46E5', paddingTop: insets.top || 40 }}>
        <View className="flex-row items-center px-4 mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/20"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Assign Homework</Text>
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
          
          <Modal visible={dropdownOpen} transparent animationType="none" onRequestClose={() => setDropdownOpen(false)}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDropdownOpen(false)}>
              <View style={{ position: 'absolute', top: 160, left: 24, right: 24, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10, borderWidth: 1, borderColor: '#F1F5F9', maxHeight: 320 }}>
                <ScrollView nestedScrollEnabled bounces={false}>
                  {classes.map(cls => (
                    <TouchableOpacity
                      key={cls.id}
                      style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', backgroundColor: activeClassId === cls.id ? '#EEF2FF' : 'white' }}
                      onPress={() => {
                        setActiveClassId(cls.id);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text style={{ fontWeight: '600', color: activeClassId === cls.id ? '#4F46E5' : '#475569' }}>
                        {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-5 pt-6 z-10">
        {loading ? (
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">New Assignment</Text>
            
            <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Class & Section</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 opacity-70">
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <Text className="ml-3 text-gray-700 font-medium">{classes.find(c => c.id === activeClassId)?.name || 'Select Class'}</Text>
              </View>
              
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Topic / Title</Text>
              <TextInput 
                placeholder={`e.g. ${profile?.subject || 'General'} Practice Set 1`}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 text-gray-800 font-medium"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Description</Text>
              <TextInput 
                placeholder="Describe the homework details..."
                multiline
                numberOfLines={4}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 text-gray-800 font-medium h-28 text-top"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <Text className="text-xs font-bold text-gray-400 mb-3 tracking-wider uppercase">
              {currentClassName} — {currentStudents.length} STUDENTS
            </Text>

            {currentStudents.length === 0 ? (
              <View className="py-10 items-center mb-5">
                <Text className="text-gray-400 font-medium">No students found in this class.</Text>
              </View>
            ) : (
              currentStudents.map((student, index) => (
                <View key={student.id} className="flex-row items-center bg-white p-3 mb-3 rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/50">
                  {/* Avatar */}
                  {student.photo_url ? (
                    <Image
                      source={{ uri: student.photo_url }}
                      style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mr-3">
                      <Text className="text-indigo-700 font-bold text-base">{getInitials(student.name)}</Text>
                    </View>
                  )}

                  {/* Info */}
                  <View className="flex-1 justify-center">
                    <Text className="font-bold text-gray-800 text-[15px] mb-0.5">{student.name}</Text>
                    <Text className="text-gray-400 text-xs font-medium">Roll No. {index + 1}</Text>
                  </View>
                </View>
              ))
            )}
            
            <TouchableOpacity className="w-full bg-indigo-600 py-4 rounded-2xl shadow-lg shadow-indigo-600/40 items-center flex-row justify-center mb-10 mt-2">
              <Ionicons name="send" size={20} color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg ml-2">Post Homework</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
