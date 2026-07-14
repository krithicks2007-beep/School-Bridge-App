import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, FlatList, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL, handleApiResponse , apiFetch} from '../../../src/services/api';
import { useAuthStore } from '../../../src/store/authStore';

export default function CreateAnnouncement() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  
  const type = params?.type || 'all'; // 'all', 'specific', 'class'
  const isSpecific = type === 'specific';
  const isClass = type === 'class';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState(new Date(Date.now() + 86400000 * 7)); // Default: 7 days
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Specific Students (Multi-select)
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isSpecific) {
      fetchStudents();
    } else if (isClass) {
      fetchClasses();
    }
  }, [isSpecific, isClass]);

  const fetchStudents = async () => {
    try {
      setLoadingData(true);
      const response = await apiFetch(`${BASE_URL}/api/announcements/students`);
      const data = await handleApiResponse(response);
      setStudents(data.students || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch students. ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoadingData(true);
      const response = await apiFetch(`${BASE_URL}/api/classes`);
      const data = await handleApiResponse(response);
      setClasses(data.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch classes. ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      if (Platform.OS === 'web') window.alert('Validation Error: Title and Content are required.');
      else Alert.alert('Validation Error', 'Title and Content are required.');
      return;
    }

    if (isSpecific && selectedStudents.length === 0) {
      if (Platform.OS === 'web') window.alert('Validation Error: Please select at least one student.');
      else Alert.alert('Validation Error', 'Please select at least one student.');
      return;
    }

    if (isClass && selectedClasses.length === 0) {
      if (Platform.OS === 'web') window.alert('Validation Error: Please select at least one class.');
      else Alert.alert('Validation Error', 'Please select at least one class.');
      return;
    }

    try {
      setSubmitting(true);
      
      let audience = 'all';
      if (isSpecific) {
        audience = `student:${selectedStudents.map(s => s.id).join(',')}`;
      } else if (isClass) {
        audience = `class:${selectedClasses.join(',')}`;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        target_audience: audience,
        author_id: profile?.id,
        expires_at: expiresAt.toISOString()
      };

      const response = await apiFetch(`${BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await handleApiResponse(response);

      if (Platform.OS === 'web') {
        window.alert('Announcement sent successfully!');
        router.back();
      } else {
        Alert.alert('Success', 'Announcement sent successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Error: Failed to send announcement. ' + error.message);
      } else {
        Alert.alert('Error', 'Failed to send announcement. ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase();
    const name = (s.name || '').toLowerCase();
    return name.includes(term) || (s.admission_number && s.admission_number.toLowerCase().includes(term));
  });

  const toggleClass = (classId) => {
    setSelectedClasses(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const toggleStudent = (student) => {
    setSelectedStudents(prev => 
      prev.find(s => s.id === student.id) 
        ? prev.filter(s => s.id !== student.id) 
        : [...prev, student]
    );
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      {/* Header */}
      <View className="px-5 pb-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-brand-950">New Announcement</Text>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
          Audience: {isSpecific ? 'Specific Students' : isClass ? 'Specific Class' : 'All Students'}
        </Text>

        {isSpecific && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-gray-800">Select Students</Text>
              {selectedStudents.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedStudents([])}>
                  <Text className="text-xs font-bold text-red-500">Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
              onPress={() => setModalVisible(true)}
            >
              <Text className={`text-base ${selectedStudents.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {selectedStudents.length > 0 
                  ? `${selectedStudents.length} Student(s) Selected` 
                  : 'Tap to select students'}
              </Text>
              {loadingData ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {isClass && (
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-800 mb-2">Select Class(es)</Text>
            {loadingData ? (
              <ActivityIndicator size="small" color="#3B82F6" className="self-start mt-2" />
            ) : (
              <View className="flex-row flex-wrap gap-2 mt-1">
                {classes.map((cls) => {
                  const isSelected = selectedClasses.includes(cls.id);
                  return (
                    <TouchableOpacity
                      key={cls.id}
                      className={`flex-row items-center px-4 py-2 rounded-full border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                      onPress={() => toggleClass(cls.id)}
                    >
                      <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                        {cls.name} {cls.section}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View className="mb-5">
          <Text className="text-sm font-bold text-gray-800 mb-2">Title</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900"
            placeholder="e.g. Tomorrow is a holiday"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View className="mb-5">
          <Text className="text-sm font-bold text-gray-800 mb-2">Valid Until</Text>
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
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '1rem',
                padding: '1rem',
                color: '#111827',
                fontWeight: '500',
                fontFamily: 'inherit',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row justify-between items-center"
              >
                <Text className="text-gray-900 text-base">
                  {expiresAt.toLocaleString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expiresAt}
                  mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    setExpiresAt(selectedDate || expiresAt);
                  }}
                  minimumDate={new Date()}
                />
              )}
            </>
          )}
        </View>

        <View className="mb-8">
          <Text className="text-sm font-bold text-gray-800 mb-2">Message Content</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900 h-40"
            placeholder="Type your announcement here..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
          />
        </View>

        <TouchableOpacity 
          className={`flex-row items-center justify-center rounded-2xl py-4 mb-10 ${submitting ? 'bg-blue-300' : 'bg-blue-600'}`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFF" className="mr-2" />
              <Text className="text-white text-lg font-bold ml-2">Send Announcement</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Student Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">Select Students</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-blue-600 px-4 py-1.5 rounded-full">
              <Text className="text-white font-bold">Done</Text>
            </TouchableOpacity>
          </View>
          
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput 
                className="flex-1 ml-2 text-base text-gray-900 h-10"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList 
            data={filteredStudents}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              const isSelected = selectedStudents.some(s => s.id === item.id);
              return (
                <TouchableOpacity 
                  className={`flex-row items-center py-4 px-5 border-b border-gray-50 ${isSelected ? 'bg-blue-50/30' : ''}`}
                  onPress={() => toggleStudent(item)}
                  activeOpacity={0.7}
                >
                  <View className="mr-3">
                     <Ionicons 
                       name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                       size={24} 
                       color={isSelected ? "#2563EB" : "#CBD5E1"} 
                     />
                  </View>
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                    <Text className="text-blue-600 font-bold text-lg">{(item.name || 'U').charAt(0)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{item.name}</Text>
                    <Text className="text-sm text-gray-500">Admn No: {item.admission_number || 'N/A'}</Text>
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500">No students found.</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}
