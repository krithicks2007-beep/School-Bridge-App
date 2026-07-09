import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Modal, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL } from '../../src/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Tamil', 'Hindi', 'Computer Science', 'Physics', 'Chemistry', 'Biology'];

export default function TestMarks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [examName, setExamName] = useState('');
  const [subjectsList, setSubjectsList] = useState(['Mathematics', 'Science', 'English', 'Social Studies', 'Tamil']);
  const [subject, setSubject] = useState(profile?.subject || subjectsList[0]);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [maxMarks, setMaxMarks] = useState('100');
  
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (!profile?.id) return;
        const classesRes = await fetch(`${BASE_URL}/api/attendance/classes/teacher-handled`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId: profile.id,
            handlingClasses: profile.handling_classes || []
          })
        });
        const classesData = await classesRes.json();
        
        if (classesData.classes && classesData.classes.length > 0) {
          setClasses(classesData.classes);
          setActiveClassId(classesData.classes[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [profile?.id]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!activeClassId) return;
      try {
        const res = await fetch(`${BASE_URL}/api/timetable/subjects/${activeClassId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.subjects && data.subjects.length > 0) {
            setSubjectsList(data.subjects);
            if (!data.subjects.includes(subject)) {
              setSubject(data.subjects[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    fetchSubjects();
  }, [activeClassId]);

  useEffect(() => {
    if (activeClassId && examName && subject) {
      fetchStudentsAndMarks();
    } else if (activeClassId) {
      fetchStudentsOnly();
    }
  }, [activeClassId, examName, subject]);

  const fetchStudentsOnly = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/attendance/students/teacher-handled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: profile.id,
          handlingClasses: [activeClassId]
        })
      });
      const data = await res.json();
      const classStudents = data.students?.[activeClassId] || [];
      setStudents(classStudents);
      
      // Initialize marks
      const initialMarks = {};
      classStudents.forEach(s => {
        initialMarks[s.id] = '';
      });
      setMarksData(initialMarks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndMarks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/marks/teacher?class_id=${activeClassId}&exam_name=${encodeURIComponent(examName)}&subject=${encodeURIComponent(subject)}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
        
        const newMarksData = {};
        let fetchedMaxMarks = maxMarks;
        data.data?.forEach(s => {
          newMarksData[s.id] = s.marks_obtained !== null ? String(s.marks_obtained) : '';
          if (s.max_marks) fetchedMaxMarks = String(s.max_marks);
        });
        setMarksData(newMarksData);
        setMaxMarks(fetchedMaxMarks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentClassName = activeClassId ? classes.find(c => c.id === activeClassId)?.name : 'Select Class';
  const activeClass = classes.find(c => c.id === activeClassId);
  const isClassTeacher = activeClass && activeClass.teacher_id === profile?.id;

  const handleMarkChange = (studentId, value) => {
    setMarksData(prev => ({ ...prev, [studentId]: value }));
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const submitMarks = async () => {
    if (!examName || !subject || !maxMarks) {
      showAlert('Error', 'Please fill all fields');
      return;
    }

    const marksPayload = students.map(s => ({
      student_id: s.id,
      marks_obtained: marksData[s.id]
    })).filter(m => m.marks_obtained !== undefined && m.marks_obtained !== '');

    if (marksPayload.length === 0) {
      showAlert('Error', 'Please enter marks for at least one student');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/marks/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_name: examName,
          subject,
          class_id: activeClassId,
          max_marks: parseFloat(maxMarks),
          date: date.toISOString(),
          marks: marksPayload
        })
      });

      const result = await res.json();
      if (result.success) {
        showAlert('Success', 'Marks saved successfully');
      } else {
        showAlert('Error', result.error || 'Failed to save marks');
      }
    } catch (err) {
      showAlert('Error', 'An error occurred while saving marks');
    } finally {
      setSaving(false);
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
          <Text className="text-white text-xl font-bold ml-4">Test Marks</Text>
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
        {loading && students.length === 0 ? (
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Subject & Test Info */}
            <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5 relative z-20">
              
              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Test Name (e.g. Mid-Term Exam)</Text>
              <TextInput
                value={examName}
                onChangeText={setExamName}
                placeholder="Enter Test Name"
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 text-gray-800 font-medium"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-1.5">Subject</Text>
              {isClassTeacher ? (
                <>
                  <TouchableOpacity 
                    onPress={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                    className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 mb-4 justify-between"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="book-outline" size={20} color="#6B7280" />
                      <Text className="ml-3 text-gray-700 font-medium">{subject}</Text>
                    </View>
                    <Ionicons name={subjectDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                  </TouchableOpacity>
                  
                  <Modal visible={subjectDropdownOpen} transparent animationType="none" onRequestClose={() => setSubjectDropdownOpen(false)}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSubjectDropdownOpen(false)}>
                      <View style={{ position: 'absolute', top: 320, left: 40, right: 40, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10, borderWidth: 1, borderColor: '#F1F5F9', maxHeight: 200 }}>
                        <ScrollView nestedScrollEnabled bounces={false}>
                          {subjectsList.map(sub => (
                            <TouchableOpacity
                              key={sub}
                              style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', backgroundColor: subject === sub ? '#EEF2FF' : 'white' }}
                              onPress={() => {
                                setSubject(sub);
                                setSubjectDropdownOpen(false);
                              }}
                            >
                              <Text style={{ fontWeight: '600', color: subject === sub ? '#4F46E5' : '#475569' }}>
                                {sub}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </>
              ) : (
                <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 mb-4 opacity-70">
                  <Ionicons name="book-outline" size={20} color="#6B7280" />
                  <Text className="ml-3 text-gray-700 font-medium">{profile?.subject || 'General'}</Text>
                </View>
              )}

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-1.5">Max Marks</Text>
                  <TextInput
                    value={maxMarks}
                    onChangeText={setMaxMarks}
                    placeholder="100"
                    keyboardType="numeric"
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50 text-gray-800 font-medium"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-1.5">Date</Text>
                  {Platform.OS === 'web' ? (
                    <View className="bg-white border border-gray-200 rounded-xl px-4 py-[9px] shadow-sm shadow-gray-200/50">
                      {React.createElement('input', {
                        type: 'date',
                        value: date.toISOString().split('T')[0],
                        onChange: (e) => {
                          const d = new Date(e.target.value);
                          if (!isNaN(d.getTime())) setDate(d);
                        },
                        style: { border: 'none', outline: 'none', background: 'transparent', width: '100%', color: '#374151', fontFamily: 'inherit', fontSize: '14px', padding: '2px 0' }
                      })}
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shadow-gray-200/50">
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text className="ml-2 text-gray-700 font-medium text-sm">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                      </TouchableOpacity>
                      
                      {showDatePicker && (
                        <DateTimePicker
                          value={date}
                          mode="date"
                          display="calendar"
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) setDate(selectedDate);
                          }}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Students Marks Entry */}
            <Text className="text-xs font-bold text-gray-400 mb-3 tracking-wider uppercase">
              {currentClassName} — {students.length} STUDENTS
            </Text>

            {students.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-gray-400 font-medium">No students found in this class.</Text>
              </View>
            ) : (
              students.map((student, index) => (
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

                  {/* Score Input */}
                  <View className="w-20">
                    <TextInput
                      value={marksData[student.id] || ''}
                      onChangeText={(val) => handleMarkChange(student.id, val)}
                      placeholder="—"
                      keyboardType="numeric"
                      className="text-center bg-indigo-50 border border-indigo-200 rounded-xl py-2.5 text-indigo-800 font-black text-base"
                    />
                  </View>
                </View>
              ))
            )}

            {/* Submit Button */}
            {students.length > 0 && (
              <TouchableOpacity 
                onPress={submitMarks}
                disabled={saving}
                className={`w-full ${saving ? 'bg-indigo-400' : 'bg-indigo-600'} py-4 rounded-2xl shadow-lg shadow-indigo-600/40 items-center flex-row justify-center mt-4`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">Save Marks</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
