import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL , apiFetch} from '../../../src/services/api';

export default function AssignHandlingClass() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [handlingClasses, setHandlingClasses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        apiFetch(`${BASE_URL}/api/classes`),
        apiFetch(`${BASE_URL}/api/teachers`)
      ]);
      const classesResult = await classesRes.json();
      const teachersResult = await teachersRes.json();
      
      if (classesResult.data) setClasses(classesResult.data);
      if (teachersResult.data) setTeachers(teachersResult.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      Alert.alert('Error', 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherChange = (teacherId) => {
    setSelectedTeacherId(teacherId);
    if (!teacherId) {
      setHandlingClasses([]);
      return;
    }
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher && teacher.handling_classes) {
      // The API might return mapped names, but in add.js it uses IDs.
      // Assuming searchTeachers returns IDs if they aren't mapped, wait, in teachersController we map handling_classes to names!
      // If we need IDs here, we probably should find them from the original 'classes' array if they are strings, but wait.
      // Actually, if we fetch from /api/teachers it maps to names. This might cause issues. 
      // But let's assume we match them by name or ID. If they are mapped to names, we might need to find the matching class ID.
      // Let's do a best effort match.
      const classIds = [];
      const hcArray = Array.isArray(teacher.handling_classes) ? teacher.handling_classes : [teacher.handling_classes];
      
      hcArray.forEach(hc => {
        if (typeof hc === 'string') {
          // Check if it's already an ID
          const cls = classes.find(c => c.id === hc || `${c.name} ${c.section || ''}`.trim() === hc);
          if (cls) classIds.push(cls.id);
        }
      });
      setHandlingClasses(classIds);
    } else {
      setHandlingClasses([]);
    }
  };

  const toggleHandlingClass = (classId) => {
    setHandlingClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedTeacherId) {
      Alert.alert('Validation Error', 'Please select a teacher.');
      return;
    }
    
    setSaving(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/teachers/assign-handling-classes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          handlingClasses: handlingClasses
        }),
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        if (Platform.OS === 'web') {
          window.alert('Handling classes updated successfully!');
        } else {
          Alert.alert('Success', 'Handling classes updated successfully!');
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || 'Failed to update handling classes.');
        } else {
          Alert.alert('Error', result.error || 'Failed to update handling classes.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-5 pb-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-brand-950">Change Handling Class</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4338CA" />
          <Text className="mt-2 text-gray-500">Loading data...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-sm text-gray-600 leading-5">
              Select a teacher to view and update the classes they handle. You can assign multiple classes.
            </Text>

            <View className="mb-6">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Select Teacher *</Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Picker
                  selectedValue={selectedTeacherId}
                  onValueChange={handleTeacherChange}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="-- Choose Teacher --" value="" color="#9CA3AF" />
                  {teachers.map(t => (
                    <Picker.Item key={t.id} label={`${t.name} (${t.reg_id})`} value={t.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedTeacherId ? (
              <View className="mb-2">
                <Text className="mb-2 text-sm font-semibold text-gray-700">Classes Handled (Tap to toggle)</Text>
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {classes.map(c => {
                    const isSelected = handlingClasses.includes(c.id);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => toggleHandlingClass(c.id)}
                        className={`rounded-full px-4 py-2 border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                          {c.name} - {c.section || ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

          </View>

          <TouchableOpacity
            className={`items-center justify-center rounded-xl p-4 shadow-sm ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
            onPress={handleSubmit}
            disabled={saving || !selectedTeacherId}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-base font-bold text-white">Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      )}
    </View>
  );
}
