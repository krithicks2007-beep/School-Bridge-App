import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BASE_URL, handleApiResponse } from '../../../src/services/api';

export default function TransportManagement() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    driver_name: '',
    route_name: '',
    bus_number: '',
    pickup_stop: '',
    pickup_time: '',
    driver_phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/classes`);
      const result = await handleApiResponse(response);
      const classList = result.data || [];
      setClasses(classList);
      if (classList.length > 0) setSelectedClass(classList[0]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    setStudents([]);
    try {
      const response = await fetch(`${BASE_URL}/api/transport?class_id=${selectedClass.id}`);
      const result = await handleApiResponse(response);
      setStudents(result.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    if (student.transport) {
      setFormData({
        driver_name: student.transport.driver_name || '',
        route_name: student.transport.route_name || '',
        bus_number: student.transport.bus_number || '',
        pickup_stop: student.transport.pickup_stop || '',
        pickup_time: student.transport.pickup_time ? student.transport.pickup_time.substring(0, 5) : '', // Assuming HH:MM:SS
        drop_time: student.transport.drop_time ? student.transport.drop_time.substring(0, 5) : '',
        driver_phone: student.transport.driver_phone || '',
      });
    } else {
      setFormData({
        driver_name: '',
        route_name: '',
        bus_number: '',
        pickup_stop: '',
        pickup_time: '',
        drop_time: '',
        driver_phone: '',
      });
    }
  };

  const handleSave = async () => {
    if (!editingStudent) return;
    setIsSaving(true);
    try {
      // Add seconds back to times if provided
      let finalPickupTime = formData.pickup_time;
      if (finalPickupTime && finalPickupTime.length === 5) {
        finalPickupTime += ':00';
      }
      
      let finalDropTime = formData.drop_time;
      if (finalDropTime && finalDropTime.length === 5) {
        finalDropTime += ':00';
      }

      const response = await fetch(`${BASE_URL}/api/transport/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, pickup_time: finalPickupTime, drop_time: finalDropTime }),
      });
      const result = await handleApiResponse(response);

      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id ? { ...s, transport: result.data } : s
        )
      );

      Alert.alert('Success', 'Transport details updated successfully');
      setEditingStudent(null);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 20 }}>
      {/* Header */}
      <View className="flex-row items-center border-b border-gray-200 bg-white px-5 pb-4 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 rounded-full bg-gray-100 p-2">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="flex-1 text-2xl font-extrabold text-brand-950">Transport Management</Text>
      </View>

      {/* Class Selector */}
      <View className="border-b border-gray-200 bg-white px-5 py-4">
        {loadingClasses ? (
          <ActivityIndicator color="#3B82F6" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => setSelectedClass(cls)}
                className={`mr-3 rounded-full border px-5 py-2 ${
                  selectedClass?.id === cls.id ? 'border-blue-600 bg-blue-600 shadow-md' : 'border-gray-200 bg-gray-100'
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

      {/* Student List */}
      <View className="flex-1 px-5 pt-4">
        <Text className="mb-3 text-lg font-bold text-gray-800">
          Students in {selectedClass?.name} {selectedClass?.section ? `(${selectedClass?.section})` : ''}
        </Text>

        {loadingStudents ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-3 font-medium text-gray-500">Loading students...</Text>
          </View>
        ) : students.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text className="mt-4 text-center text-lg font-medium text-gray-500">No students found in this class.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                onPress={() => openEditModal(student)}
                className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                activeOpacity={0.7}
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-100 mr-4">
                  <Text className="text-lg font-bold text-blue-600">{student.name.charAt(0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900">{student.name}</Text>
                  <Text className="text-sm font-medium text-gray-500">{student.reg_id}</Text>
                  
                  {student.transport ? (
                    <View className="mt-1 flex-row items-center">
                      <Ionicons name="bus" size={14} color="#10B981" />
                      <Text className="ml-1 text-xs font-bold text-emerald-600">
                        {student.transport.bus_number} • {student.transport.route_name}
                      </Text>
                    </View>
                  ) : (
                    <View className="mt-1 flex-row items-center">
                      <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                      <Text className="ml-1 text-xs font-bold text-amber-500">No transport assigned</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Edit Modal */}
      <Modal visible={!!editingStudent} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="rounded-t-3xl bg-white p-6 shadow-2xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-extrabold text-gray-900">Transport Details</Text>
                <Text className="text-sm font-medium text-gray-500">{editingStudent?.name} ({editingStudent?.reg_id})</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingStudent(null)} className="rounded-full bg-gray-100 p-2">
                <Ionicons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '60%' }}>
              <Text className="mb-1.5 text-sm font-bold text-gray-700">Bus Route</Text>
              <TextInput
                value={formData.route_name}
                onChangeText={(text) => setFormData({ ...formData, route_name: text })}
                placeholder="e.g. Route 12 - Sathy Road"
                className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
              />

              <View className="mb-4 flex-row justify-between">
                <View className="w-[48%]">
                  <Text className="mb-1.5 text-sm font-bold text-gray-700">Bus Number</Text>
                  <TextInput
                    value={formData.bus_number}
                    onChangeText={(text) => setFormData({ ...formData, bus_number: text })}
                    placeholder="e.g. Bus 12"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="mb-1.5 text-sm font-bold text-gray-700">Pickup Time</Text>
                  <TextInput
                    value={formData.pickup_time}
                    onChangeText={(text) => setFormData({ ...formData, pickup_time: text })}
                    placeholder="HH:MM (e.g. 07:30)"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
                  />
                </View>
              </View>

              <View className="mb-4 flex-row justify-between">
                <View className="w-[48%]">
                  <Text className="mb-1.5 text-sm font-bold text-gray-700">Drop Time</Text>
                  <TextInput
                    value={formData.drop_time}
                    onChangeText={(text) => setFormData({ ...formData, drop_time: text })}
                    placeholder="HH:MM (e.g. 16:30)"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="mb-1.5 text-sm font-bold text-gray-700">Pickup Stop</Text>
                  <TextInput
                    value={formData.pickup_stop}
                    onChangeText={(text) => setFormData({ ...formData, pickup_stop: text })}
                    placeholder="e.g. MG Road Junction"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
                  />
                </View>
              </View>

              <Text className="mb-1.5 text-sm font-bold text-gray-700">Driver Name</Text>
              <TextInput
                value={formData.driver_name}
                onChangeText={(text) => setFormData({ ...formData, driver_name: text })}
                placeholder="e.g. Ramesh Kumar"
                className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
              />

              <Text className="mb-1.5 text-sm font-bold text-gray-700">Driver Phone</Text>
              <TextInput
                value={formData.driver_phone}
                onChangeText={(text) => setFormData({ ...formData, driver_phone: text })}
                placeholder="e.g. +91 9876543210"
                keyboardType="phone-pad"
                className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900"
              />

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className={`mb-2 h-14 flex-row items-center justify-center rounded-xl ${isSaving ? 'bg-blue-400' : 'bg-blue-600 shadow-lg shadow-blue-500/30'}`}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#FFF" />
                    <Text className="ml-2 text-lg font-bold text-white">Save Transport Details</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
