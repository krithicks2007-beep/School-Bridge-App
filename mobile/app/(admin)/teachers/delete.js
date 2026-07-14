import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL , apiFetch} from '../../../src/services/api';

export default function DeleteTeacher() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = async (queryArg) => {
    const query = typeof queryArg === 'string' ? queryArg : searchQuery;
    setLoading(true);
    try {
      const url = query.trim() 
        ? `${BASE_URL}/api/teachers?q=${encodeURIComponent(query)}`
        : `${BASE_URL}/api/teachers`;
        
      const response = await apiFetch(url);
      const result = await response.json();
      if (result.data) {
        setTeachers(result.data);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert('Failed to search teachers.');
      } else {
        Alert.alert('Error', 'Failed to search teachers.');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (teacher) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to permanently delete teacher ${teacher.name} (${teacher.reg_id})?`);
      if (confirmed) {
        handleDelete(teacher.id);
      }
    } else {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to permanently delete teacher ${teacher.name} (${teacher.reg_id})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => handleDelete(teacher.id)
          }
        ]
      );
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const response = await apiFetch(`${BASE_URL}/api/teachers/delete/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok && !result.error) {
        if (Platform.OS === 'web') {
          window.alert('Teacher deleted successfully.');
        } else {
          Alert.alert('Success', 'Teacher deleted successfully.');
        }
        setTeachers(prev => prev.filter(t => t.id !== id));
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || 'Failed to delete teacher.');
        } else {
          Alert.alert('Error', result.error || 'Failed to delete teacher.');
        }
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert('An unexpected error occurred.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const renderTeacherItem = ({ item }) => (
    <View className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <View className="flex-1 pr-3">
        <Text className="text-base font-bold text-gray-900">{item.name}</Text>
        <Text className="mt-1 text-sm text-gray-500">Reg ID: {item.reg_id}</Text>
        <Text className="text-xs text-gray-400">Subject: {item.subject || 'N/A'}</Text>
      </View>
      <TouchableOpacity
        className={`items-center justify-center rounded-lg p-3 ${deletingId === item.id ? 'bg-red-300' : 'bg-red-50'}`}
        onPress={() => confirmDelete(item)}
        disabled={deletingId === item.id}
      >
        {deletingId === item.id ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <Feather name="trash-2" size={20} color="#EF4444" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-5 pb-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-brand-950">Delete Teacher</Text>
      </View>

      <View className="flex-1 px-5 pt-4">
        <View className="mb-4 flex-row items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="h-12 flex-1 px-3 text-sm text-gray-800"
            style={Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined}
            placeholder="Search by Name or Reg ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-2">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          className="mb-6 items-center justify-center rounded-xl bg-indigo-600 p-3 shadow-sm"
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="font-bold text-white">Search</Text>
          )}
        </TouchableOpacity>

        {teachers.length === 0 && !loading && searchQuery !== '' && (
          <View className="mt-10 items-center justify-center">
            <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
            <Text className="mt-4 text-center text-gray-500">No teachers found matching "{searchQuery}"</Text>
          </View>
        )}

        <FlatList
          data={teachers}
          keyExtractor={(item) => item.id}
          renderItem={renderTeacherItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}
