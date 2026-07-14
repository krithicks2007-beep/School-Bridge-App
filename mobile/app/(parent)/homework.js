import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BASE_URL , apiFetch} from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { markReadNow } from '../../src/services/readAlerts';

export default function HomeworkScreen() {
  const router = useRouter();
  const { student } = useAuthStore();
  const [homeworkData, setHomeworkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        if (!student?.class_id) {
          setError('No class assigned.');
          setLoading(false);
          return;
        }

        const response = await apiFetch(`${BASE_URL}/api/homework/class/${student.class_id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch homework');
        }

        setHomeworkData(result.data || []);
        await markReadNow('parent-homework', student?.id);
      } catch (err) {
        console.error(err);
        setError('Could not load homework.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [student?.class_id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No Time Limit';
    const d = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Due: Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Due: Tomorrow';
    
    return `Due: ${d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}`;
  };

  const dueSoonCount = homeworkData.filter(hw => {
    if (!hw.expires_at) return false;
    const expires = new Date(hw.expires_at);
    const diffDays = (expires - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 2;
  }).length;

  const getSubjectIcon = (subject) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('math')) return { name: 'calculator', color: '#3B82F6', bg: 'bg-blue-100', border: 'border-blue-500' };
    if (s.includes('sci')) return { name: 'flask', color: '#10B981', bg: 'bg-emerald-100', border: 'border-emerald-500' };
    if (s.includes('eng')) return { name: 'book', color: '#F59E0B', bg: 'bg-amber-100', border: 'border-amber-500' };
    return { name: 'document-text', color: '#8B5CF6', bg: 'bg-violet-100', border: 'border-violet-500' };
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Homework</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-lg font-black text-slate-800 ml-1">Pending Tasks</Text>
          {dueSoonCount > 0 && (
            <View className="bg-rose-100 px-3 py-1 rounded-full">
              <Text className="text-rose-600 font-bold text-xs">{dueSoonCount} Due Soon</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-4 text-slate-500 font-medium">Loading homework...</Text>
          </View>
        ) : error ? (
          <View className="py-20 items-center">
            <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
            <Text className="mt-4 text-slate-500 font-medium">{error}</Text>
          </View>
        ) : homeworkData.length === 0 ? (
          <View className="py-20 items-center">
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#10B981" />
            <Text className="mt-4 text-slate-500 font-medium text-lg">No pending homework!</Text>
            <Text className="text-slate-400 text-sm mt-1">Enjoy your free time.</Text>
          </View>
        ) : (
          homeworkData.map((hw) => {
            const style = getSubjectIcon(hw.subject);
            return (
              <TouchableOpacity key={hw.id} activeOpacity={0.8} className="mb-5 overflow-hidden rounded-[24px] shadow-sm shadow-slate-200">
                <LinearGradient colors={['#ffffff', '#f8fafc']} className={`p-5 border-l-4 ${style.border}`}>
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center">
                      <View className={`h-10 w-10 ${style.bg} rounded-full items-center justify-center mr-3`}>
                        <Ionicons name={style.name} size={20} color={style.color} />
                      </View>
                      <View>
                        <Text className="text-lg font-black text-slate-800">{hw.subject || 'General'}</Text>
                        <Text className="text-xs font-bold text-slate-400">{hw.Teacher?.name || 'Teacher'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </View>
                  <Text className="mb-2 text-[15px] font-bold text-slate-700">{hw.title}</Text>
                  <Text className="mb-4 text-[14px] leading-5 text-slate-500 font-medium">{hw.description}</Text>
                  
                  {hw.expires_at && (
                    <View className="flex-row items-center bg-rose-50 self-start px-3 py-1.5 rounded-xl border border-rose-100">
                      <Ionicons name="time" size={14} color="#E11D48" />
                      <Text className="text-[13px] font-bold text-rose-600 ml-1.5">{formatDate(hw.expires_at)}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
