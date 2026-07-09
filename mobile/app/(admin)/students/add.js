import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../../../src/services/api';

function InputField({ label, value, onChangeText, placeholder, keyboardType = "default", maxLength }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-semibold text-gray-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800"
      />
    </View>
  );
}

export default function AddStudent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
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
    photo_url: ''
  });
  const [classTeacher, setClassTeacher] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/classes`);
      const result = await response.json();
      if (result.data) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes', error);
      Alert.alert('Error', 'Failed to load classes.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleClassChange = (classId) => {
    setFormData(prev => ({ ...prev, class_id: classId }));
    const selectedClass = classes.find(c => c.id === classId);
    if (selectedClass && selectedClass.Teacher) {
      setClassTeacher(selectedClass.Teacher.name || 'Not Assigned');
    } else {
      setClassTeacher('Not Assigned');
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.reg_id || !formData.pin || !formData.class_id) {
      Alert.alert('Validation Error', 'Name, Reg ID, PIN, and Class are required fields.');
      return false;
    }
    
    // Reg ID Alphanumeric validation
    const regIdRegex = /^[A-Za-z0-9]+$/;
    if (!regIdRegex.test(formData.reg_id)) {
      Alert.alert('Validation Error', 'Registration ID must be alphanumeric.');
      return false;
    }
    
    // PIN 6 digits validation
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(formData.pin)) {
      Alert.alert('Validation Error', 'PIN must be exactly 6 digits.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // Find the grade name from the class
      const selectedClass = classes.find(c => c.id === formData.class_id);
      const submitData = { ...formData, grade: selectedClass?.name };

      const response = await fetch(`${BASE_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        // Clear form immediately
        setFormData({
          name: '', initial: '', reg_id: '', pin: '', class_id: '', date_of_birth: '',
          blood_group: '', father_name: '', mother_name: '', address: '', contact_phone: '',
          admission_number: '', photo_url: ''
        });
        setClassTeacher('');
        
        // Show success message
        if (Platform.OS === 'web') {
          window.alert('Student added successfully!');
        } else {
          Alert.alert('Success', 'Student added successfully!');
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || 'Failed to add student.');
        } else {
          Alert.alert('Error', result.error || 'Failed to add student.');
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
        <Text className="text-xl font-bold text-brand-950">Add Student</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Academic Information</Text>
            
            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Class *</Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {loadingClasses ? (
                  <ActivityIndicator size="small" color="#4338CA" className="p-4" />
                ) : (
                  <Picker
                    selectedValue={formData.class_id}
                    onValueChange={handleClassChange}
                    style={{ height: 50, width: '100%' }}
                  >
                    <Picker.Item label="Select Class" value="" color="#9CA3AF" />
                    {classes.map(c => (
                      <Picker.Item key={c.id} label={`${c.name} - ${c.section}`} value={c.id} />
                    ))}
                  </Picker>
                )}
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Class Teacher</Text>
              <View className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3">
                <Text className="text-sm text-gray-500">{classTeacher || 'Select a class to see teacher'}</Text>
              </View>
            </View>

            <InputField 
              label="Registration ID *" 
              value={formData.reg_id} 
              onChangeText={(t) => setFormData(prev => ({...prev, reg_id: t}))} 
              placeholder="e.g. STU123456" 
            />
            
            <InputField 
              label="Login PIN (6 Digits) *" 
              value={formData.pin} 
              onChangeText={(t) => setFormData(prev => ({...prev, pin: t}))} 
              placeholder="e.g. 123456" 
              keyboardType="number-pad"
              maxLength={6}
            />

            <InputField 
              label="Admission Number" 
              value={formData.admission_number} 
              onChangeText={(t) => setFormData(prev => ({...prev, admission_number: t}))} 
              placeholder="e.g. ADM-2024-001" 
            />
          </View>

          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Personal Information</Text>
            
            <InputField 
              label="Full Name *" 
              value={formData.name} 
              onChangeText={(t) => setFormData(prev => ({...prev, name: t}))} 
              placeholder="Student Name" 
            />
            
            <InputField 
              label="Initial" 
              value={formData.initial} 
              onChangeText={(t) => setFormData(prev => ({...prev, initial: t}))} 
              placeholder="e.g. K" 
              maxLength={5}
            />

            <InputField 
              label="Date of Birth (YYYY-MM-DD)" 
              value={formData.date_of_birth} 
              onChangeText={(t) => setFormData(prev => ({...prev, date_of_birth: t}))} 
              placeholder="2010-05-15" 
            />

            <InputField 
              label="Blood Group" 
              value={formData.blood_group} 
              onChangeText={(t) => setFormData(prev => ({...prev, blood_group: t}))} 
              placeholder="e.g. O+" 
            />

            <InputField 
              label="Father's Name" 
              value={formData.father_name} 
              onChangeText={(t) => setFormData(prev => ({...prev, father_name: t}))} 
              placeholder="Father's Full Name" 
            />

            <InputField 
              label="Mother's Name" 
              value={formData.mother_name} 
              onChangeText={(t) => setFormData(prev => ({...prev, mother_name: t}))} 
              placeholder="Mother's Full Name" 
            />

            <InputField 
              label="Contact Phone" 
              value={formData.contact_phone} 
              onChangeText={(t) => setFormData(prev => ({...prev, contact_phone: t}))} 
              placeholder="Parent Contact Number" 
              keyboardType="phone-pad"
            />

            <InputField 
              label="Address" 
              value={formData.address} 
              onChangeText={(t) => setFormData(prev => ({...prev, address: t}))} 
              placeholder="Full Address" 
            />

            <InputField 
              label="Photo URL (Cloudinary)" 
              value={formData.photo_url} 
              onChangeText={(t) => setFormData(prev => ({...prev, photo_url: t}))} 
              placeholder="https://res.cloudinary.com/..." 
            />
          </View>

          <TouchableOpacity
            className={`mb-10 items-center justify-center rounded-xl p-4 shadow-sm ${saving ? 'bg-indigo-400' : 'bg-indigo-600'}`}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-base font-bold text-white">Save Student</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
