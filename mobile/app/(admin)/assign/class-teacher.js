import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL , apiFetch} from '../../../src/services/api';

export default function AssignClassTeacher() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    teacherId: '',
    classId: ''
  });

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

  const handleSubmit = async () => {
    if (!formData.teacherId || !formData.classId) {
      Alert.alert('Validation Error', 'Please select both a teacher and a class.');
      return;
    }
    
    setSaving(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/teachers/assign-class-teacher`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: formData.teacherId,
          classId: formData.classId
        }),
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        setFormData({ teacherId: '', classId: '' });
        if (Platform.OS === 'web') {
          window.alert('Class teacher assigned successfully!');
        } else {
          Alert.alert('Success', 'Class teacher assigned successfully!');
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || 'Failed to assign class teacher.');
        } else {
          Alert.alert('Error', result.error || 'Failed to assign class teacher.');
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
        <Text className="text-xl font-bold text-brand-950">Assign Class Teacher</Text>
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
              Select a teacher and a class. Any previous class teacher for the selected class will automatically be unassigned from that role.
            </Text>

            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Select Teacher *</Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Picker
                  selectedValue={formData.teacherId}
                  onValueChange={(val) => setFormData(prev => ({...prev, teacherId: val}))}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="-- Choose Teacher --" value="" color="#9CA3AF" />
                  {teachers.map(t => (
                    <Picker.Item key={t.id} label={`${t.name} (${t.reg_id})`} value={t.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Select Class *</Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Picker
                  selectedValue={formData.classId}
                  onValueChange={(val) => setFormData(prev => ({...prev, classId: val}))}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="-- Choose Class --" value="" color="#9CA3AF" />
                  {classes.map(c => (
                    <Picker.Item key={c.id} label={`${c.name} - ${c.section || ''}`} value={c.id} />
                  ))}
                </Picker>
              </View>
            </View>

          </View>

          <TouchableOpacity
            className={`items-center justify-center rounded-xl p-4 shadow-sm ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
            onPress={handleSubmit}
            disabled={saving}
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
