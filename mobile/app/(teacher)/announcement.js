import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Modal, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL } from '../../src/services/api';
import { markReadNow } from '../../src/services/readAlerts';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Announcement() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentsData, setStudentsData] = useState({});

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState(new Date(Date.now() + 86400000 * 7)); // Default: 7 days
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    markReadNow('staff-announcements', profile?.id).catch((error) => {
      console.error('Failed to mark staff announcements as read:', error);
    });

    const fetchClassesAndStudents = async () => {
      try {
        if (!profile?.id) return;
        
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

  const handlePostAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please enter a title and content.');
      return;
    }
    if (!activeClassId) {
      Alert.alert('Error', 'Please select a class.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        target_audience: `class:${activeClassId}`,
        author_id: profile?.id,
        expires_at: expiresAt.toISOString()
      };

      const response = await fetch(`${BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send announcement');
      }

      setTitle('');
      setContent('');
      
      if (Platform.OS === 'web') {
        alert('Announcement sent successfully!');
        router.back();
      } else {
        Alert.alert('Success', 'Announcement sent successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || expiresAt;
    setShowDatePicker(Platform.OS === 'ios');
    setExpiresAt(currentDate);
  };

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
          <Text className="text-white text-xl font-bold ml-4">Announcements</Text>
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
            <View className="flex-row items-center bg-indigo-50 rounded-2xl p-4 border border-indigo-100 mb-6">
              <View className="w-12 h-12 rounded-full bg-indigo-200 items-center justify-center mr-3">
                <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="text-indigo-900 font-bold text-base">Broadcast Message</Text>
                <Text className="text-indigo-700/80 text-xs mt-0.5">Reach out to parents instantly</Text>
              </View>
            </View>
            
            <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Target Audience</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 opacity-70">
                <Ionicons name="people-circle-outline" size={20} color="#6B7280" />
                <Text className="ml-3 text-gray-700 font-medium">All Parents ({currentClassName})</Text>
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Title</Text>
              <TextInput 
                placeholder="e.g. Field Trip Tomorrow"
                value={title}
                onChangeText={setTitle}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 text-gray-800 font-medium"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Message Content</Text>
              <TextInput 
                placeholder="Type your important announcement here..."
                multiline
                numberOfLines={5}
                value={content}
                onChangeText={setContent}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 text-gray-800 font-medium h-32 text-top"
                style={{ textAlignVertical: 'top' }}
              />

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Valid Until</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="datetime-local"
                  value={expiresAt instanceof Date && !isNaN(expiresAt) ? expiresAt.toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setExpiresAt(newDate);
                    }
                  }}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    color: '#1F2937',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 flex-row justify-between items-center"
                  >
                    <Text className="text-gray-800 font-medium">
                      {expiresAt.toLocaleString()}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={expiresAt}
                      mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                      display="default"
                      onChange={onChangeDate}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>

            <TouchableOpacity 
              onPress={handlePostAnnouncement}
              disabled={submitting}
              className={`w-full py-4 rounded-2xl shadow-lg items-center flex-row justify-center mb-10 mt-2 ${submitting ? 'bg-indigo-400 shadow-indigo-400/40' : 'bg-indigo-600 shadow-indigo-600/40'}`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={20} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-lg ml-2">Send Announcement</Text>
                </>
              )}
            </TouchableOpacity>

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
            
            <View className="h-10" />
          </ScrollView>
        )}
      </View>
    </View>
  );
}
