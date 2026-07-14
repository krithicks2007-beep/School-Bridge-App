import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL, handleApiResponse , apiFetch} from '../../src/services/api';
import { markReadNow } from '../../src/services/readAlerts';

export default function AnnouncementScreen() {
  const router = useRouter();
  const { student } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // We assume student has id and class_id
      const studentId = student?.id || '';
      const classId = student?.class_id || '';
      
      const response = await apiFetch(`${BASE_URL}/api/announcements?studentId=${studentId}&classId=${classId}`);
      const data = await handleApiResponse(response);
      setAnnouncements(data.announcements || []);
      await markReadNow('parent-announcements', student?.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch announcements. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const getCardStyles = (audience) => {
    if (audience && audience.startsWith('student:')) {
      // Personal message style
      return {
        gradient: ['#ffffff', '#fdf4ff'],
        border: 'border-fuchsia-500',
        badgeBg: 'bg-fuchsia-100 border border-fuchsia-200',
        badgeText: 'text-fuchsia-700',
        label: 'Direct'
      };
    } else if (audience && audience.startsWith('class:')) {
      // Class message style
      return {
        gradient: ['#ffffff', '#f0fdf4'],
        border: 'border-green-500',
        badgeBg: 'bg-green-100 border border-green-200',
        badgeText: 'text-green-700',
        label: 'Class'
      };
    }
    // All message style
    return {
      gradient: ['#ffffff', '#f8fafc'],
      border: 'border-blue-600',
      badgeBg: 'bg-blue-600 shadow-sm shadow-blue-500/30',
      badgeText: 'text-white',
      label: 'School'
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Announcements</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        
        {loading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-slate-500 mt-4 font-medium">Checking for updates...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <Ionicons name="notifications-off-outline" size={60} color="#CBD5E1" />
            <Text className="text-slate-400 mt-4 text-lg font-bold">No announcements yet.</Text>
          </View>
        ) : (
          announcements.map((item) => {
            const styles = getCardStyles(item.target_audience);
            return (
              <TouchableOpacity key={item.id} activeOpacity={0.8} className="mb-5 overflow-hidden rounded-[24px] shadow-sm shadow-slate-200">
                <LinearGradient colors={styles.gradient} className={`p-5 border-l-4 ${styles.border}`}>
                  <View className="flex-row justify-between items-start mb-3">
                    <View className={`px-3 py-1 rounded-full ${styles.badgeBg}`}>
                      <Text className={`font-bold text-[10px] tracking-wider uppercase ${styles.badgeText}`}>
                        {styles.label}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                      <Text className="text-xs font-bold text-slate-400 ml-1.5">{formatDate(item.created_at)}</Text>
                    </View>
                  </View>
                  <Text className="mb-2 text-xl font-black text-slate-800">{item.title}</Text>
                  <Text className="text-[15px] leading-6 text-slate-600 font-medium">{item.content}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
