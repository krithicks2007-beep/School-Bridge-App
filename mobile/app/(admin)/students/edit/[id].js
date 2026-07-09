import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL, handleApiResponse } from '../../../../src/services/api';

const emptyForm = {
  name: '',
  initial: '',
  reg_id: '',
  pin: '',
  class_id: '',
  date_of_birth: '',
  blood_group: '',
  father_name: '',
  mother_name: '',
  address: '',
  contact_phone: '',
  admission_number: '',
  photo_url: '',
};

const getClassNumber = (className = '') => {
  const match = String(className).match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

const sortClasses = (classList) => [...classList].sort((a, b) => {
  const numberDiff = getClassNumber(a.name) - getClassNumber(b.name);
  if (numberDiff !== 0) return numberDiff;

  return `${a.section || ''}`.localeCompare(`${b.section || ''}`);
});

function InputField({ label, value, onChangeText, placeholder, keyboardType = 'default', maxLength, multiline = false }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-semibold text-gray-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined}
        className={`rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 ${multiline ? 'min-h-[92px] py-3' : 'py-3'}`}
      />
    </View>
  );
}

export default function EditStudentDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [classTeacher, setClassTeacher] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [classesResponse, studentResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/classes`),
        fetch(`${BASE_URL}/api/students/${id}`),
      ]);

      const classesResult = await handleApiResponse(classesResponse);
      const studentResult = await handleApiResponse(studentResponse);
      const classList = sortClasses(classesResult.data || []);
      const student = studentResult.data || {};

      setClasses(classList);
      setFormData({
        name: student.name || '',
        initial: student.initial || '',
        reg_id: student.reg_id || '',
        pin: student.pin || '',
        class_id: student.class_id || '',
        date_of_birth: student.date_of_birth || '',
        blood_group: student.blood_group || '',
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',
        address: student.address || '',
        contact_phone: student.contact_phone || '',
        admission_number: student.admission_number || '',
        photo_url: student.photo_url || '',
      });

      const selectedClass = classList.find((cls) => cls.id === student.class_id);
      setClassTeacher(selectedClass?.Teacher?.name || student.Class?.Teacher?.name || 'Not Assigned');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClassChange = (classId) => {
    updateField('class_id', classId);
    const selectedClass = classes.find((cls) => cls.id === classId);
    setClassTeacher(selectedClass?.Teacher?.name || 'Not Assigned');
  };

  const validateForm = () => {
    if (!formData.name || !formData.reg_id || !formData.pin || !formData.class_id) {
      Alert.alert('Validation Error', 'Name, Reg ID, PIN, and Class are required fields.');
      return false;
    }

    if (!/^[A-Za-z0-9]+$/.test(formData.reg_id)) {
      Alert.alert('Validation Error', 'Registration ID must be alphanumeric.');
      return false;
    }

    if (!/^\d{6}$/.test(formData.pin)) {
      Alert.alert('Validation Error', 'PIN must be exactly 6 digits.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      await handleApiResponse(response);
      Alert.alert('Success', 'Student details updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update student details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white" style={{ paddingTop: insets.top + 20 }}>
        <ActivityIndicator size="large" color="#4338CA" />
        <Text className="mt-3 font-medium text-gray-500">Loading student details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-5 pb-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-brand-950">Edit Student</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>
          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Academic Information</Text>

            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Class *</Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Picker
                  selectedValue={formData.class_id}
                  onValueChange={handleClassChange}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="Select Class" value="" color="#9CA3AF" />
                  {classes.map((cls) => (
                    <Picker.Item key={cls.id} label={`${cls.name} ${cls.section ? `- ${cls.section}` : ''}`} value={cls.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Class Teacher</Text>
              <View className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3">
                <Text className="text-sm text-gray-500">{classTeacher || 'Not Assigned'}</Text>
              </View>
            </View>

            <InputField label="Registration ID *" value={formData.reg_id} onChangeText={(text) => updateField('reg_id', text)} placeholder="e.g. STU123456" />
            <InputField label="Login PIN (6 Digits) *" value={formData.pin} onChangeText={(text) => updateField('pin', text)} placeholder="e.g. 123456" keyboardType="number-pad" maxLength={6} />
            <InputField label="Admission Number" value={formData.admission_number} onChangeText={(text) => updateField('admission_number', text)} placeholder="e.g. ADM-2024-001" />
          </View>

          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Personal Information</Text>

            <InputField label="Full Name *" value={formData.name} onChangeText={(text) => updateField('name', text)} placeholder="Student Name" />
            <InputField label="Initial" value={formData.initial} onChangeText={(text) => updateField('initial', text)} placeholder="e.g. K" maxLength={5} />
            <InputField label="Date of Birth (YYYY-MM-DD)" value={formData.date_of_birth} onChangeText={(text) => updateField('date_of_birth', text)} placeholder="2010-05-15" />
            <InputField label="Blood Group" value={formData.blood_group} onChangeText={(text) => updateField('blood_group', text)} placeholder="e.g. O+" />
            <InputField label="Father's Name" value={formData.father_name} onChangeText={(text) => updateField('father_name', text)} placeholder="Father's Full Name" />
            <InputField label="Mother's Name" value={formData.mother_name} onChangeText={(text) => updateField('mother_name', text)} placeholder="Mother's Full Name" />
            <InputField label="Contact Phone" value={formData.contact_phone} onChangeText={(text) => updateField('contact_phone', text)} placeholder="Parent Contact Number" keyboardType="phone-pad" />
            <InputField label="Address" value={formData.address} onChangeText={(text) => updateField('address', text)} placeholder="Full Address" multiline />
            <InputField label="Photo URL (Cloudinary)" value={formData.photo_url} onChangeText={(text) => updateField('photo_url', text)} placeholder="https://res.cloudinary.com/..." />
          </View>

          <TouchableOpacity
            className="mb-10 items-center justify-center rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: saving ? '#818CF8' : '#4338CA' }}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-base font-bold text-white">Save Student Details</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
