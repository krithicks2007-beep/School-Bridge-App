import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Modal, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL , apiFetch} from '../../src/services/api';
import { markReadNow } from '../../src/services/readAlerts';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Announcement() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'sent'
  const [sendMode, setSendMode] = useState('whole_class'); // 'whole_class' | 'specific_students'

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentsData, setStudentsData] = useState({});

  // Specific Students Flow State
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState(new Date(Date.now() + 86400000 * 7)); // Default: 7 days
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Recently Sent State
  const [sentAnnouncements, setSentAnnouncements] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchSentQuery, setSearchSentQuery] = useState('');

  useEffect(() => {
    markReadNow('staff-announcements', profile?.id).catch((error) => {
      console.error('Failed to mark staff announcements as read:', error);
    });

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
      fetchSentAnnouncements();
    }
  }, [activeTab]);

  // Reset selection when changing class or mode
  useEffect(() => {
    setSelectedStudents([]);
    setShowComposeForm(false);
    setStudentSearchQuery('');
  }, [activeClassId, sendMode]);

  const fetchSentAnnouncements = async () => {
    if (!profile?.id) return;
    setLoadingSent(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/announcements/sent/${profile.id}`);
      const data = await response.json();
      if (response.ok) {
        setSentAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Failed to fetch sent announcements', error);
    } finally {
      setLoadingSent(false);
    }
  };

  const currentClassName = activeClassId ? classes.find(c => c.id === activeClassId)?.name : 'Select Class';
  const currentStudents = activeClassId ? (studentsData[activeClassId] || []) : [];
  
  const filteredStudents = currentStudents.filter(student => 
    student.name?.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const filteredSentAnnouncements = sentAnnouncements.filter(ann => 
    ann.title?.toLowerCase().includes(searchSentQuery.toLowerCase()) || 
    ann.content?.toLowerCase().includes(searchSentQuery.toLowerCase())
  );

  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    } else {
      setSelectedStudents(prev => [...prev, studentId]);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please enter a title and content.');
      return;
    }
    if (!activeClassId) {
      Alert.alert('Error', 'Please select a class.');
      return;
    }
    if (sendMode === 'specific_students' && selectedStudents.length === 0) {
      Alert.alert('Error', 'Please select at least one student.');
      return;
    }

    setSubmitting(true);
    try {
      let targetAudience = `class:${activeClassId}`;
      if (sendMode === 'specific_students') {
        targetAudience = `student:${selectedStudents.join(',')}`;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        target_audience: targetAudience,
        author_id: profile?.id,
        expires_at: expiresAt.toISOString()
      };

      const response = await apiFetch(`${BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send announcement');
      }

      // Reset everything
      setTitle('');
      setContent('');
      setSelectedStudents([]);
      setShowComposeForm(false);
      
      if (Platform.OS === 'web') {
        alert('Announcement sent successfully!');
      } else {
        Alert.alert('Success', 'Announcement sent successfully!');
      }
      setActiveTab('sent');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const executeDelete = async () => {
      try {
        const res = await apiFetch(`${BASE_URL}/api/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSentAnnouncements(prev => prev.filter(a => a.id !== id));
          if (Platform.OS === 'web') window.alert('Announcement deleted successfully.');
        } else {
          if (Platform.OS === 'web') window.alert('Failed to delete announcement');
          else Alert.alert('Error', 'Failed to delete announcement');
        }
      } catch (error) {
        console.error(error);
        if (Platform.OS === 'web') window.alert('Failed to delete announcement');
        else Alert.alert('Error', 'Failed to delete announcement');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this announcement?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this announcement?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement.title.trim() || !editingAnnouncement.content.trim()) {
      Alert.alert('Error', 'Please enter a title and content.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`${BASE_URL}/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          expires_at: editingAnnouncement.expires_at
        })
      });
      if (res.ok) {
        if (Platform.OS === 'web') alert('Announcement updated');
        else Alert.alert('Success', 'Announcement updated');
        setEditingAnnouncement(null);
        fetchSentAnnouncements();
      } else {
        Alert.alert('Error', 'Failed to update announcement');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update announcement');
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

  const renderForm = (audienceLabel) => (
    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5">
      <Text className="text-sm font-semibold text-gray-700 mb-1.5">Target Audience</Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 opacity-70">
        <Ionicons name="people-circle-outline" size={20} color="#6B7280" />
        <Text className="ml-3 text-gray-700 font-medium">{audienceLabel}</Text>
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

      <TouchableOpacity 
        onPress={handlePostAnnouncement}
        disabled={submitting}
        className={`w-full py-4 rounded-2xl shadow-lg items-center flex-row justify-center mt-2 ${submitting ? 'bg-indigo-400 shadow-indigo-400/40' : 'bg-indigo-600 shadow-indigo-600/40'}`}
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
    </View>
  );

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

        {activeTab === 'create' && (!showComposeForm) && (
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
          onPress={() => {
            setActiveTab('create');
            setShowComposeForm(false);
          }}
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
      <View className="flex-1 px-5 pt-5 z-10">
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
          ) : showComposeForm ? (
             <ScrollView showsVerticalScrollIndicator={false}>
               <TouchableOpacity onPress={() => setShowComposeForm(false)} className="flex-row items-center mb-4">
                 <Ionicons name="arrow-back" size={20} color="#4F46E5" />
                 <Text className="ml-1 text-indigo-600 font-bold">Back to Student Selection</Text>
               </TouchableOpacity>
               {renderForm(`${selectedStudents.length} Students from ${currentClassName}`)}
             </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <View className="flex-row mb-6 bg-gray-100 p-1 rounded-xl">
                <TouchableOpacity 
                  className={`flex-1 py-2 rounded-lg items-center ${sendMode === 'whole_class' ? 'bg-white shadow-sm' : ''}`}
                  onPress={() => setSendMode('whole_class')}
                >
                  <Text className={`font-bold ${sendMode === 'whole_class' ? 'text-indigo-600' : 'text-gray-500'}`}>Whole Class</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 py-2 rounded-lg items-center ${sendMode === 'specific_students' ? 'bg-white shadow-sm' : ''}`}
                  onPress={() => setSendMode('specific_students')}
                >
                  <Text className={`font-bold ${sendMode === 'specific_students' ? 'text-indigo-600' : 'text-gray-500'}`}>Specific Students</Text>
                </TouchableOpacity>
              </View>

              {sendMode === 'whole_class' ? (
                <>
                  <View className="flex-row items-center bg-indigo-50 rounded-2xl p-4 border border-indigo-100 mb-6">
                    <View className="w-12 h-12 rounded-full bg-indigo-200 items-center justify-center mr-3">
                      <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-indigo-900 font-bold text-base">Broadcast Message</Text>
                      <Text className="text-indigo-700/80 text-xs mt-0.5">Reach out to parents instantly</Text>
                    </View>
                  </View>
                  {renderForm(`All Parents (${currentClassName})`)}
                </>
              ) : (
                <>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-sm font-bold text-gray-700">Select Students</Text>
                    {selectedStudents.length > 0 && (
                       <TouchableOpacity onPress={() => setSelectedStudents([])}>
                         <Text className="text-xs font-bold text-red-500">Clear Selection</Text>
                       </TouchableOpacity>
                    )}
                  </View>

                  {/* Student Search Bar */}
                  <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-2 mb-4 shadow-sm">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-gray-800 py-1"
                      placeholder="Search students..."
                      placeholderTextColor="#9CA3AF"
                      value={studentSearchQuery}
                      onChangeText={setStudentSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {studentSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setStudentSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Student List */}
                  {filteredStudents.length === 0 ? (
                    <View className="py-10 items-center">
                      <Text className="text-gray-400 font-medium">No students match your search.</Text>
                    </View>
                  ) : (
                    filteredStudents.map((student, index) => {
                      const isSelected = selectedStudents.includes(student.id);
                      return (
                        <TouchableOpacity 
                          key={student.id} 
                          onPress={() => toggleStudentSelection(student.id)}
                          activeOpacity={0.7}
                          className={`flex-row items-center bg-white p-3 mb-3 rounded-2xl border ${isSelected ? 'border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-200/50' : 'border-gray-100 shadow-sm shadow-gray-200/50'}`}
                        >
                          {/* Selection Round / Radio Button */}
                          <View className="mr-3">
                             <Ionicons 
                               name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                               size={26} 
                               color={isSelected ? "#4F46E5" : "#CBD5E1"} 
                             />
                          </View>

                          {/* Avatar */}
                          {student.photo_url ? (
                            <Image
                              source={{ uri: student.photo_url }}
                              style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
                            />
                          ) : (
                            <View className="w-11 h-11 rounded-full bg-indigo-100 items-center justify-center mr-3">
                              <Text className="text-indigo-700 font-bold text-[15px]">{getInitials(student.name)}</Text>
                            </View>
                          )}

                          {/* Info */}
                          <View className="flex-1 justify-center">
                            <Text className={`font-bold text-[15px] mb-0.5 ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>{student.name}</Text>
                            <Text className="text-gray-400 text-xs font-medium">Roll No. {index + 1}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                  <View className="h-24" />
                </>
              )}
            </ScrollView>
          )
        ) : (
          <View className="flex-1">
            {/* Sent Announcements Search Bar */}
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-2 mb-4 shadow-sm">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800 py-1"
                placeholder="Search sent announcements..."
                placeholderTextColor="#9CA3AF"
                value={searchSentQuery}
                onChangeText={setSearchSentQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchSentQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchSentQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {loadingSent ? (
              <ActivityIndicator size="large" color="#4F46E5" className="mt-10" />
            ) : filteredSentAnnouncements.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Ionicons name="document-text-outline" size={64} color="#E5E7EB" />
                <Text className="mt-4 text-gray-500 font-medium text-center px-6">
                  {searchSentQuery ? "No announcements match your search." : "You haven't sent any announcements yet."}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredSentAnnouncements.map((ann) => (
                  <View key={ann.id} className="bg-white p-4 mb-4 rounded-2xl border border-gray-100 shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="font-bold text-lg text-gray-800 flex-1 pr-2">{ann.title}</Text>
                      <View className="flex-row">
                        <TouchableOpacity 
                          onPress={() => setEditingAnnouncement({
                            ...ann, 
                            expires_at: ann.expires_at ? new Date(ann.expires_at) : new Date(Date.now() + 86400000 * 7)
                          })}
                          className="mr-3"
                        >
                          <Ionicons name="pencil" size={20} color="#4F46E5" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteAnnouncement(ann.id)}>
                          <Ionicons name="trash" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-gray-600 mb-2">{ann.content}</Text>
                    <Text className="text-xs font-bold text-indigo-500">
                      Target: {ann.target_audience.startsWith('student:') ? 'Specific Students' : 'Whole Class'}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">Sent: {new Date(ann.created_at).toLocaleString()}</Text>
                  </View>
                ))}
                <View className="h-10" />
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Floating Action Button for Specific Students Compose */}
      {activeTab === 'create' && sendMode === 'specific_students' && selectedStudents.length > 0 && !showComposeForm && (
        <View className="absolute bottom-6 left-0 right-0 items-center px-5 z-50">
          <TouchableOpacity 
            onPress={() => setShowComposeForm(true)}
            className="w-full bg-indigo-600 py-4 rounded-full shadow-lg shadow-indigo-600/40 flex-row items-center justify-center"
          >
            <Ionicons name="create-outline" size={22} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Compose ({selectedStudents.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Modal */}
      {editingAnnouncement && (
        <Modal transparent visible animationType="fade">
          <View className="flex-1 justify-center bg-black/50 px-4">
            <View className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <Text className="text-xl font-bold text-gray-800 mb-4">Edit Announcement</Text>
              <TextInput
                value={editingAnnouncement.title}
                onChangeText={(text) => setEditingAnnouncement({...editingAnnouncement, title: text})}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 font-medium"
                placeholder="Title"
              />
              <TextInput
                value={editingAnnouncement.content}
                onChangeText={(text) => setEditingAnnouncement({...editingAnnouncement, content: text})}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 h-32 text-top font-medium"
                multiline
                style={{ textAlignVertical: 'top' }}
                placeholder="Content"
              />
              
              <View className="flex-row justify-end mt-2">
                <TouchableOpacity 
                  onPress={() => setEditingAnnouncement(null)}
                  className="px-5 py-3 rounded-xl border border-gray-200 mr-3"
                >
                  <Text className="text-gray-600 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleUpdateAnnouncement}
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
