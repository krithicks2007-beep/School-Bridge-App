import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL , apiFetch} from '../../../src/services/api';

export default function StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await apiFetch(`${BASE_URL}/api/teachers`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const json = await response.json();
      setStaff(json.data || []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError('Failed to load staff details.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time filtering logic
  const filteredStaff = staff.filter((teacher) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    const nameMatch = teacher.name?.toLowerCase().includes(query);
    const emailMatch = teacher.email?.toLowerCase().includes(query);
    const subjectMatch = teacher.subject?.toLowerCase().includes(query);
    const classTeacherMatch = teacher.class_teacher_of?.toLowerCase().includes(query);
    
    // Check handling classes array if it exists
    let handlingMatch = false;
    if (Array.isArray(teacher.handling_classes)) {
      handlingMatch = teacher.handling_classes.some(c => String(c).toLowerCase().includes(query));
    } else if (typeof teacher.handling_classes === 'string') {
      handlingMatch = teacher.handling_classes.toLowerCase().includes(query);
    }

    return nameMatch || emailMatch || subjectMatch || classTeacherMatch || handlingMatch;
  });

  const renderStaffCard = ({ item }) => {
    const initials = item.name ? item.name.charAt(0).toUpperCase() : 'S';
    
    let handlingClassesText = '';
    if (Array.isArray(item.handling_classes) && item.handling_classes.length > 0) {
      handlingClassesText = item.handling_classes.join(', ');
    } else if (typeof item.handling_classes === 'string' && item.handling_classes.trim() !== '') {
      handlingClassesText = item.handling_classes;
    }

    return (
      <View className="mb-4 mx-5 overflow-hidden rounded-[20px] border border-[#E8EDF5] bg-white shadow-md shadow-blue-900/10">
        <LinearGradient colors={['#FFFFFF', '#F5F3FF']} className="p-4 flex-row" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Profile Picture */}
          <View className="mr-4 mt-1">
            {item.photo_url ? (
              <Image
                source={{ uri: item.photo_url }}
                className="h-[60px] w-[60px] rounded-full border-2 border-indigo-100 bg-gray-100"
              />
            ) : (
              <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-indigo-500 shadow-sm">
                <Text className="text-2xl font-black text-white">{initials}</Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-gray-900 mb-0.5">{item.name}</Text>
            
            <View className="flex-row items-center mb-1.5">
              <Ionicons name="book-outline" size={14} color="#6366F1" className="mr-1" />
              <Text className="text-sm font-medium text-indigo-600 ml-1">
                {item.subject || 'No Subject Assigned'}
              </Text>
            </View>

            {/* Classes Information */}
            {(item.class_teacher_of || handlingClassesText) && (
              <View className="mb-2 rounded-lg bg-white/60 p-2 border border-indigo-50">
                {item.class_teacher_of && (
                  <View className="flex-row items-start mb-1">
                    <MaterialIcons name="star-outline" size={14} color="#F59E0B" className="mt-0.5" />
                    <Text className="text-xs font-bold text-gray-700 ml-1.5 flex-1">
                      Class Teacher: <Text className="font-medium text-gray-600">{item.class_teacher_of}</Text>
                    </Text>
                  </View>
                )}
                {(Array.isArray(item.handling_classes) && item.handling_classes.length > 0 || (typeof item.handling_classes === 'string' && item.handling_classes.trim() !== '')) && (
                  <View className="mt-1.5">
                    <View className="flex-row items-center mb-1.5">
                      <MaterialIcons name="class" size={14} color="#8B5CF6" />
                      <Text className="text-[11px] font-bold text-gray-700 ml-1.5 uppercase tracking-wider">
                        Handling Classes:
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap pl-5 gap-1.5">
                      {Array.isArray(item.handling_classes) 
                        ? item.handling_classes.map((cls, idx) => (
                            <View key={idx} className="bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-md">
                              <Text className="text-[10px] font-bold text-indigo-700">{cls}</Text>
                            </View>
                          ))
                        : (
                            <View className="bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-md">
                              <Text className="text-[10px] font-bold text-indigo-700">{item.handling_classes}</Text>
                            </View>
                          )
                      }
                    </View>
                  </View>
                )}
              </View>
            )}
            
            <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-indigo-50/50">
              {item.phone && (
                <TouchableOpacity 
                  className="flex-row items-center py-1 pr-2 rounded-lg"
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                  activeOpacity={0.6}
                >
                  <Feather name="phone" size={13} color="#4F46E5" />
                  <Text className="text-[11px] font-bold text-indigo-900 ml-1.5">{item.phone}</Text>
                </TouchableOpacity>
              )}
              
              {item.email && (
                <TouchableOpacity 
                  className="flex-row items-center py-1 pl-2 ml-3 flex-1 justify-end rounded-lg"
                  onPress={() => Linking.openURL(`mailto:${item.email}`)}
                  activeOpacity={0.6}
                >
                  <Feather name="mail" size={13} color="#4F46E5" />
                  <Text className="text-[11px] font-bold text-indigo-900 ml-1.5 flex-1 text-right" numberOfLines={1}>{item.email}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 pb-4 pt-4 border-b border-gray-200 bg-white shadow-sm z-10">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-extrabold text-brand-950">Staff Directory</Text>
            <Text className="text-sm font-medium text-gray-500 mt-1">Contact details of your colleagues</Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
            <Ionicons name="people" size={20} color="#4F46E5" />
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center rounded-xl bg-gray-100 px-4 py-2 border border-gray-200">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base font-medium text-gray-800 py-1"
            placeholder="Search by name, email, or class..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <View className="flex-1 pt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-3 font-medium text-slate-500">Loading staff details...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
            <Text className="mt-3 text-center font-bold text-slate-500">{error}</Text>
            <TouchableOpacity 
              className="mt-4 rounded-full bg-indigo-100 px-6 py-2"
              onPress={fetchStaff}
            >
              <Text className="font-bold text-indigo-700">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredStaff.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="search-outline" size={48} color="#CBD5E1" />
            <Text className="mt-3 text-center font-bold text-slate-500">
              {searchQuery ? "No staff members match your search." : "No staff members found."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderStaffCard}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
