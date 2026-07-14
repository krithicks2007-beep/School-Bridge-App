import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/store/authStore';
import { BASE_URL , apiFetch} from '../../../src/services/api';

export default function AdminSentAnnouncements() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const [sentAnnouncements, setSentAnnouncements] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSentAnnouncements();
  }, []);

  const fetchSentAnnouncements = async () => {
    if (!profile?.id) return;
    setLoadingSent(true);
    try {
      const response = await apiFetch(`${BASE_URL}/api/announcements/sent/${profile.id}`);
      const data = await response.json();
      if (response.ok) {
        setSentAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Failed to fetch sent announcements', error);
    } finally {
      setLoadingSent(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const executeDelete = async () => {
      try {
        const res = await apiFetch(`${BASE_URL}/api/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSentAnnouncements(prev => prev.filter(a => a.id !== id));
          if (Platform.OS === 'web') window.alert('Announcement deleted successfully.');
        } else {
          if (Platform.OS === 'web') window.alert('Failed to delete announcement');
          else Alert.alert('Error', 'Failed to delete announcement');
        }
      } catch (error) {
        console.error(error);
        if (Platform.OS === 'web') window.alert('Failed to delete announcement');
        else Alert.alert('Error', 'Failed to delete announcement');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this announcement?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this announcement?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement.title.trim() || !editingAnnouncement.content.trim()) {
      if (Platform.OS === 'web') window.alert('Error: Please enter a title and content.');
      else Alert.alert('Error', 'Please enter a title and content.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`${BASE_URL}/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          expires_at: editingAnnouncement.expires_at
        })
      });
      if (res.ok) {
        if (Platform.OS === 'web') window.alert('Announcement updated successfully!');
        else Alert.alert('Success', 'Announcement updated successfully!');
        setEditingAnnouncement(null);
        fetchSentAnnouncements();
      } else {
        if (Platform.OS === 'web') window.alert('Failed to update announcement');
        else Alert.alert('Error', 'Failed to update announcement');
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') window.alert('Failed to update announcement');
      else Alert.alert('Error', 'Failed to update announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAnnouncements = sentAnnouncements.filter(ann => 
    ann.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ann.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 20 }}>
      <StatusBar barStyle="dark-content" />
      
      <View className="px-5 pb-6 flex-row items-center bg-gray-50 z-10 relative shadow-sm border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-brand-950">Recently Sent</Text>
      </View>

      <View className="flex-1 px-5 pt-6">
        {/* Search Bar */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-2 mb-4 shadow-sm">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800 py-1"
            placeholder="Search sent announcements..."
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

        {loadingSent ? (
          <ActivityIndicator size="large" color="#4F46E5" className="mt-10" />
        ) : filteredAnnouncements.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="document-text-outline" size={64} color="#E5E7EB" />
            <Text className="mt-4 text-gray-500 font-medium text-center px-6">
              {searchQuery ? "No announcements match your search." : "You haven't sent any announcements yet."}
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredAnnouncements.map((ann) => {
              const isSpecific = ann.target_audience.startsWith('student:');
              const isClass = ann.target_audience.startsWith('class:');
              let targetLabel = 'All Students';
              if (isSpecific) targetLabel = 'Specific Students';
              if (isClass) targetLabel = 'Specific Class';
              
              return (
                <View key={ann.id} className="bg-white p-4 mb-4 rounded-2xl border border-gray-100 shadow-sm">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-bold text-lg text-gray-800 flex-1 pr-2">{ann.title}</Text>
                    <View className="flex-row">
                      <TouchableOpacity 
                        onPress={() => setEditingAnnouncement({
                          ...ann, 
                          expires_at: ann.expires_at ? new Date(ann.expires_at) : new Date(Date.now() + 86400000 * 7)
                        })}
                        className="mr-3"
                      >
                        <Ionicons name="pencil" size={20} color="#4F46E5" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteAnnouncement(ann.id)}>
                        <Ionicons name="trash" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text className="text-gray-600 mb-2">{ann.content}</Text>
                  <Text className={`text-xs font-bold ${isSpecific ? 'text-purple-500' : isClass ? 'text-green-500' : 'text-blue-500'}`}>
                    Target: {targetLabel}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">Sent: {new Date(ann.created_at).toLocaleString()}</Text>
                </View>
              );
            })}
            <View className="h-10" />
          </ScrollView>
        )}
      </View>

      {/* Edit Modal */}
      {editingAnnouncement && (
        <Modal transparent visible animationType="fade">
          <View className="flex-1 justify-center bg-black/50 px-4">
            <View className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <Text className="text-xl font-bold text-gray-800 mb-4">Edit Announcement</Text>
              <TextInput
                value={editingAnnouncement.title}
                onChangeText={(text) => setEditingAnnouncement({...editingAnnouncement, title: text})}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 font-medium"
                placeholder="Title"
              />
              <TextInput
                value={editingAnnouncement.content}
                onChangeText={(text) => setEditingAnnouncement({...editingAnnouncement, content: text})}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 h-32 text-top font-medium"
                multiline
                style={{ textAlignVertical: 'top' }}
                placeholder="Content"
              />
              
              <View className="flex-row justify-end mt-2">
                <TouchableOpacity 
                  onPress={() => setEditingAnnouncement(null)}
                  className="px-5 py-3 rounded-xl border border-gray-200 mr-3"
                >
                  <Text className="text-gray-600 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleUpdateAnnouncement}
                  className="px-5 py-3 rounded-xl bg-indigo-600 flex-row items-center justify-center min-w-[120px]"
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
