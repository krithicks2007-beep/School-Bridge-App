import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../../../../src/services/api';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Tamil', 'Hindi', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Other'];

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

export default function EditTeacher() {
  const router = useRouter();
  const { id: reg_id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    reg_id: '',
    staff_id: '',
    subject: SUBJECTS[0],
    customSubject: '',
    email: '',
    phone: '',
    address: '',
    photo_url: '',
    class_teacher_of: '',
    handling_classes: []
  });

  useEffect(() => {
    fetchClasses();
    fetchTeacher();
  }, [reg_id]);

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/classes`);
      const result = await response.json();
      if (result.data) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch classes', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchTeacher = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/teachers/${reg_id}`);
      const result = await response.json();
      if (response.ok && result.data) {
        setTeacherId(result.data.id);
        const dbSubject = result.data.subject || SUBJECTS[0];
        const isStandardSubject = SUBJECTS.includes(dbSubject);
        
        setFormData({
          name: result.data.name || '',
          reg_id: result.data.reg_id || '',
          staff_id: result.data.staff_id || '',
          subject: isStandardSubject ? dbSubject : 'Other',
          customSubject: isStandardSubject ? '' : dbSubject,
          email: result.data.email || '',
          phone: result.data.phone || '',
          address: result.data.address || '',
          photo_url: result.data.photo_url || '',
          class_teacher_of: result.data.class_teacher_of || '',
          handling_classes: result.data.handling_classes || []
        });
      } else {
        Alert.alert('Error', 'Failed to fetch teacher details.');
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.reg_id || !formData.staff_id) {
      Alert.alert('Validation Error', 'Name, Registration ID, and Password (staff_id) are required fields.');
      return false;
    }
    
    // Reg ID Alphanumeric validation
    const regIdRegex = /^[A-Za-z0-9]+$/;
    if (!regIdRegex.test(formData.reg_id)) {
      Alert.alert('Validation Error', 'Registration ID must be alphanumeric.');
      return false;
    }

    return true;
  };

  const toggleHandlingClass = (classId) => {
    setFormData(prev => {
      const isSelected = prev.handling_classes.includes(classId);
      if (isSelected) {
        return { ...prev, handling_classes: prev.handling_classes.filter(id => id !== classId) };
      } else {
        return { ...prev, handling_classes: [...prev.handling_classes, classId] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!validateForm() || !teacherId) return;
    
    setSaving(true);
    try {
      const finalSubject = formData.subject === 'Other' ? formData.customSubject : formData.subject;

      const submitData = {
        name: formData.name,
        reg_id: formData.reg_id,
        staff_id: formData.staff_id,
        subject: finalSubject,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        photo_url: formData.photo_url,
        class_teacher_of: formData.class_teacher_of,
        handling_classes: formData.handling_classes
      };

      const response = await fetch(`${BASE_URL}/api/teachers/update/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        if (Platform.OS === 'web') {
          window.alert('Teacher updated successfully!');
        } else {
          Alert.alert('Success', 'Teacher updated successfully!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || 'Failed to update teacher.');
        } else {
          Alert.alert('Error', result.error || 'Failed to update teacher.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-5 pb-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-brand-950">Edit Teacher</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Professional Information</Text>
            
            <InputField 
              label="Registration ID *" 
              value={formData.reg_id} 
              onChangeText={(t) => setFormData(prev => ({...prev, reg_id: t}))} 
              placeholder="e.g. TCH123456" 
            />
            
            <InputField 
              label="Password (Staff ID) *" 
              value={formData.staff_id} 
              onChangeText={(t) => setFormData(prev => ({...prev, staff_id: t}))} 
              placeholder="e.g. password123" 
            />

            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Primary Subject</Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Picker
                  selectedValue={formData.subject}
                  onValueChange={(val) => setFormData(prev => ({...prev, subject: val}))}
                  style={{ height: 50, width: '100%' }}
                >
                  {SUBJECTS.map(sub => (
                    <Picker.Item key={sub} label={sub} value={sub} />
                  ))}
                </Picker>
              </View>
            </View>

            {formData.subject === 'Other' && (
              <InputField 
                label="Enter Subject *" 
                value={formData.customSubject} 
                onChangeText={(t) => setFormData(prev => ({...prev, customSubject: t}))} 
                placeholder="e.g. Physical Education" 
              />
            )}
          </View>

          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Class Assignments</Text>

            <View className="mb-6">
              <Text className="mb-1 text-sm font-semibold text-gray-700">Class Teacher Of</Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {loadingClasses ? (
                  <ActivityIndicator size="small" color="#4338CA" className="p-4" />
                ) : (
                  <Picker
                    selectedValue={formData.class_teacher_of}
                    onValueChange={(val) => setFormData(prev => ({...prev, class_teacher_of: val}))}
                    style={{ height: 50, width: '100%' }}
                  >
                    <Picker.Item label="Not a Class Teacher" value="" color="#9CA3AF" />
                    {classes.map(c => (
                      <Picker.Item key={c.id} label={`${c.name} - ${c.section}`} value={c.id} />
                    ))}
                  </Picker>
                )}
              </View>
            </View>

            <View className="mb-2">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Classes Handled (Tap to select multiple)</Text>
              {loadingClasses ? (
                <ActivityIndicator size="small" color="#4338CA" />
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {classes.map(c => {
                    const isSelected = formData.handling_classes.includes(c.id);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => toggleHandlingClass(c.id)}
                        className={`rounded-full px-4 py-2 border ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                          {c.name} - {c.section}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-bold text-gray-800">Personal Information</Text>
            
            <InputField 
              label="Full Name *" 
              value={formData.name} 
              onChangeText={(t) => setFormData(prev => ({...prev, name: t}))} 
              placeholder="Teacher Name" 
            />
            
            <InputField 
              label="Email Address" 
              value={formData.email} 
              onChangeText={(t) => setFormData(prev => ({...prev, email: t}))} 
              placeholder="e.g. teacher@school.com" 
              keyboardType="email-address"
            />

            <InputField 
              label="Phone" 
              value={formData.phone} 
              onChangeText={(t) => setFormData(prev => ({...prev, phone: t}))} 
              placeholder="Contact Number" 
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
              <Text className="text-base font-bold text-white">Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
