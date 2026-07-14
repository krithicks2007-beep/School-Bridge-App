import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL, handleApiResponse , apiFetch} from '../../../../src/services/api';

const getClassNumber = (className = '') => {
  const match = String(className).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

const sortClasses = (classList) => [...classList].sort((a, b) => {
  const numberDiff = getClassNumber(a.name) - getClassNumber(b.name);
  if (numberDiff !== 0) return numberDiff;

  return `${a.section || ''}`.localeCompare(`${b.section || ''}`);
});

export default function EditStudentsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiFetch(`${BASE_URL}/api/classes`);
      const result = await handleApiResponse(response);
      const classList = sortClasses(result.data || []);
      setClasses(classList);
      if (classList.length > 0) setSelectedClass(classList[0]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load classes.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiFetch(`${BASE_URL}/api/students`);
      const result = await handleApiResponse(response);
      setStudents(result.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const currentStudents = useMemo(() => {
    if (!selectedClass?.id) return [];

    return students
      .filter((student) => student.class_id === selectedClass.id)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [students, selectedClass]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-5 pb-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-brand-950">Edit Student Details</Text>
      </View>

      <View className="border-b border-gray-100 bg-white px-5 py-4">
        {loadingClasses ? (
          <ActivityIndicator color="#4338CA" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => setSelectedClass(cls)}
                style={[
                  Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined,
                  selectedClass?.id === cls.id ? { backgroundColor: '#4338CA', borderColor: '#4338CA' } : undefined,
                ]}
                className={`mr-3 rounded-full border px-5 py-2 ${
                  selectedClass?.id === cls.id ? 'border-brand-500 bg-brand-500 shadow-md' : 'border-gray-200 bg-gray-100'
                }`}
              >
                <Text className={`font-bold ${selectedClass?.id === cls.id ? 'text-white' : 'text-gray-700'}`}>
                  {cls.name} {cls.section ? `(${cls.section})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View className="flex-1 px-5 pt-4">
        <Text className="mb-3 text-lg font-bold text-gray-800">
          Students in {selectedClass?.name} {selectedClass?.section ? `(${selectedClass.section})` : ''}
        </Text>

        {loadingStudents ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4338CA" />
            <Text className="mt-3 font-medium text-gray-500">Loading students...</Text>
          </View>
        ) : currentStudents.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text className="mt-4 text-center text-lg font-medium text-gray-500">No students found in this class.</Text>
          </View>
        ) : (
          <FlatList
            data={currentStudents}
            keyExtractor={(student) => student.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            renderItem={({ item: student }) => (
              <TouchableOpacity
                onPress={() => router.push(`/(admin)/students/edit/${student.id}`)}
                style={Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined}
                className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                activeOpacity={0.75}
              >
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Text className="text-base font-bold text-blue-700">{(student.name || 'S').charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900">{student.name}</Text>
                  <Text className="mt-1 text-sm text-gray-500">Reg ID: {student.reg_id || 'N/A'}</Text>
                  <Text className="text-xs text-gray-400">ADM: {student.admission_number || 'N/A'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
