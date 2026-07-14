import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Modal, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL , apiFetch} from '../../src/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Homework() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'sent'

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentsData, setStudentsData] = useState({});

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState(null); // No default expiration
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [sentHomework, setSentHomework] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);

  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      try {
        if (!profile?.id) return;
        
        const response = await apiFetch(`${BASE_URL}/api/attendance/classes/teacher-handled`, {
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

        const studentsRes = await apiFetch(`${BASE_URL}/api/attendance/students/teacher-handled`, {
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

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentHomework();
    }
  }, [activeTab]);

  const fetchSentHomework = async () => {
    if (!profile?.id) return;
    setLoadingSent(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/homework/teacher/${profile.id}`);
      const data = await response.json();
      if (response.ok) {
        // Sort by created_at desc
        const hwList = data.data || [];
        hwList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSentHomework(hwList);
      }
    } catch (error) {
      console.error('Failed to fetch sent homework', error);
    } finally {
      setLoadingSent(false);
    }
  };

  const currentClassName = activeClassId ? classes.find(c => c.id === activeClassId)?.name : 'Select Class';
  const currentStudents = activeClassId ? (studentsData[activeClassId] || []) : [];

  const handlePostHomework = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please enter a title and description.');
      return;
    }
    if (!activeClassId) {
      Alert.alert('Error', 'Please select a class.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/homework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: activeClassId,
          teacher_id: profile.id,
          subject: profile.subject || 'General',
          title,
          description,
          expires_at: expiresAt ? expiresAt.toISOString() : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post homework');
      }

      setTitle('');
      setDescription('');
      
      if (Platform.OS === 'web') {
        alert('Homework posted successfully!');
      } else {
        Alert.alert('Success', 'Homework posted successfully!');
      }
      setActiveTab('sent');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHomework = async (id) => {
    const executeDelete = async () => {
      try {
        const res = await apiFetch(`${BASE_URL}/api/homework/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSentHomework(prev => prev.filter(h => h.id !== id));
          if (Platform.OS === 'web') window.alert('Homework deleted successfully.');
        } else {
          if (Platform.OS === 'web') window.alert('Failed to delete homework');
          else Alert.alert('Error', 'Failed to delete homework');
        }
      } catch (error) {
        console.error(error);
        if (Platform.OS === 'web') window.alert('Failed to delete homework');
        else Alert.alert('Error', 'Failed to delete homework');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this homework?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this homework?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleUpdateHomework = async () => {
    if (!editingHomework.title.trim() || !editingHomework.description.trim()) {
      Alert.alert('Error', 'Please enter a title and description.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`${BASE_URL}/api/homework/${editingHomework.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingHomework.title,
          description: editingHomework.description,
          expires_at: editingHomework.expires_at
        })
      });
      if (res.ok) {
        if (Platform.OS === 'web') alert('Homework updated');
        else Alert.alert('Success', 'Homework updated');
        setEditingHomework(null);
        fetchSentHomework();
      } else {
        Alert.alert('Error', 'Failed to update homework');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update homework');
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpiresAt(selectedDate);
    }
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
          <Text className="text-white text-xl font-bold ml-4">Assign Homework</Text>
        </View>

        {activeTab === 'create' && (
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
        )}
      </View>

      <View className="flex-row mt-4 px-5 justify-between">
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-l-xl border ${activeTab === 'create' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
          onPress={() => setActiveTab('create')}
        >
          <Text className={`text-center font-bold ${activeTab === 'create' ? 'text-white' : 'text-gray-500'}`}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 rounded-r-xl border ${activeTab === 'sent' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
          onPress={() => setActiveTab('sent')}
        >
          <Text className={`text-center font-bold ${activeTab === 'sent' ? 'text-white' : 'text-gray-500'}`}>Recently Sent</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-5 pt-6 z-10">
        {activeTab === 'create' ? (
          loading ? (
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
                  value={title}
                  onChangeText={setTitle}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 text-gray-800 font-medium"
                />

                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Description</Text>
                <TextInput 
                  placeholder="Describe the homework details..."
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 text-gray-800 font-medium h-28 text-top"
                  style={{ textAlignVertical: 'top' }}
                />

                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-sm font-semibold text-gray-700">Valid Until</Text>
                  {expiresAt && (
                    <TouchableOpacity onPress={() => setExpiresAt(null)}>
                      <Text className="text-xs font-bold text-rose-500">Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {Platform.OS === 'web' ? (
                  <input
                    type="datetime-local"
                    value={expiresAt instanceof Date && !isNaN(expiresAt) ? expiresAt.toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setExpiresAt(null);
                        return;
                      }
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
                      <Text className={`font-medium ${expiresAt ? 'text-gray-800' : 'text-gray-400'}`}>
                        {expiresAt ? expiresAt.toLocaleString() : 'No Time Limit (Tap to set)'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={expiresAt || new Date()}
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
                onPress={handlePostHomework}
                disabled={submitting}
                className={`w-full py-4 rounded-2xl shadow-lg items-center flex-row justify-center mb-10 mt-2 ${submitting ? 'bg-indigo-400 shadow-indigo-400/40' : 'bg-indigo-600 shadow-indigo-600/40'}`}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-lg ml-2">Post Homework</Text>
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

                    <View className="flex-1 justify-center">
                      <Text className="font-bold text-gray-800 text-[15px] mb-0.5">{student.name}</Text>
                      <Text className="text-gray-400 text-xs font-medium">Roll No. {index + 1}</Text>
                    </View>
                  </View>
                ))
              )}
              
              {/* Added padding for bottom scrolling */}
              <View className="h-10" />
            </ScrollView>
          )
        ) : (
          <View className="flex-1">
            {loadingSent ? (
              <ActivityIndicator size="large" color="#4F46E5" className="mt-10" />
            ) : sentHomework.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Ionicons name="document-text-outline" size={64} color="#E5E7EB" />
                <Text className="mt-4 text-gray-500 font-medium text-center px-6">
                  You haven't assigned any homework yet.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {sentHomework.map((hw) => (
                  <View key={hw.id} className="bg-white p-4 mb-4 rounded-2xl border border-gray-100 shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 pr-2">
                        <Text className="font-bold text-lg text-gray-800">{hw.title}</Text>
                        <Text className="text-xs text-indigo-600 font-bold mb-1">{hw.Class?.name} {hw.Class?.section}</Text>
                      </View>
                      <View className="flex-row">
                        <TouchableOpacity 
                          onPress={() => setEditingHomework({
                            ...hw, 
                            expires_at: hw.expires_at ? new Date(hw.expires_at) : null
                          })}
                          className="mr-3"
                        >
                          <Ionicons name="pencil" size={20} color="#4F46E5" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteHomework(hw.id)}>
                          <Ionicons name="trash" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-gray-600 mb-2">{hw.description}</Text>
                    {hw.expires_at && (
                      <Text className="text-xs text-rose-500 font-medium mb-1">Due: {new Date(hw.expires_at).toLocaleString()}</Text>
                    )}
                    <Text className="text-xs text-gray-400">Assigned: {new Date(hw.created_at).toLocaleString()}</Text>
                  </View>
                ))}
                <View className="h-10" />
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Edit Modal */}
      {editingHomework && (
        <Modal transparent visible animationType="fade">
          <View className="flex-1 justify-center bg-black/50 px-4">
            <View className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <Text className="text-xl font-bold text-gray-800 mb-4">Edit Homework</Text>
              <TextInput
                value={editingHomework.title}
                onChangeText={(text) => setEditingHomework({...editingHomework, title: text})}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 font-medium"
                placeholder="Title"
              />
              <TextInput
                value={editingHomework.description}
                onChangeText={(text) => setEditingHomework({...editingHomework, description: text})}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 h-32 text-top font-medium"
                multiline
                style={{ textAlignVertical: 'top' }}
                placeholder="Description"
              />
              
              <View className="flex-row justify-end mt-2">
                <TouchableOpacity 
                  onPress={() => setEditingHomework(null)}
                  className="px-5 py-3 rounded-xl border border-gray-200 mr-3"
                >
                  <Text className="text-gray-600 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleUpdateHomework}
                  className="px-5 py-3 rounded-xl bg-indigo-600 flex-row items-center justify-center min-w-[120px]"
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}
