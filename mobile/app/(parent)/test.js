import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { BASE_URL } from '../../src/services/api';
import { markReadNow } from '../../src/services/readAlerts';

export default function TestMarkScreen() {
  const router = useRouter();
  const { student } = useAuthStore();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExam, setExpandedExam] = useState(null);
  const [expectedSubjects, setExpectedSubjects] = useState(['Tamil', 'English', 'Mathematics', 'Science', 'Social Studies']);

  useEffect(() => {
    const fetchMarksAndSubjects = async () => {
      try {
        const studentId = student?.student_id || student?.id;
        if (!studentId) return;

        // Fetch dynamic subjects if class_id is available
        if (student?.class_id) {
          try {
            const subjRes = await fetch(`${BASE_URL}/api/timetable/subjects/${student.class_id}`);
            if (subjRes.ok) {
              const subjData = await subjRes.json();
              if (subjData.subjects && subjData.subjects.length > 0) {
                setExpectedSubjects(subjData.subjects);
              }
            }
          } catch (err) {
            console.error('Error fetching subjects:', err);
          }
        }

        const res = await fetch(`${BASE_URL}/api/marks/parent/${studentId}`);
        const data = await res.json();
        
        if (data.data) {
          setExams(data.data);
        }
        await markReadNow('parent-test-marks', student?.id);
      } catch (err) {
        console.error('Error fetching marks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarksAndSubjects();
  }, [student]);

  const toggleExpand = (examName) => {
    if (expandedExam === examName) {
      setExpandedExam(null);
    } else {
      setExpandedExam(examName);
    }
  };

  const renderSubjects = (examSubjects) => {
    // Collect all subjects that have been uploaded for this exam
    const uploadedSubjectNames = examSubjects.map(s => s.subject);
    
    // Combine expected subjects with any extra subjects uploaded
    const allSubjects = [...new Set([...expectedSubjects, ...uploadedSubjectNames])];
    
    let totalObtained = 0;
    let totalMax = 0;
    let allUploaded = true;

    const subjectRows = allSubjects.map(subjName => {
      const markObj = examSubjects.find(s => s.subject === subjName);
      
      let initial = subjName.substring(0, 1).toUpperCase();
      
      if (markObj && markObj.marks_obtained !== null) {
        totalObtained += Number(markObj.marks_obtained);
        totalMax += Number(markObj.max_marks || 100);
      } else {
        allUploaded = false;
      }

      return (
        <View key={subjName} className="p-4 border-b border-slate-100 flex-row items-center">
          <View className="h-12 w-12 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
            <Text className="text-xl font-black text-indigo-600">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800 mb-1">{subjName}</Text>
            {markObj ? (
              <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${Math.min(100, (Number(markObj.marks_obtained) / Number(markObj.max_marks || 100)) * 100)}%` }} 
                />
              </View>
            ) : (
              <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden" />
            )}
          </View>
          <View className="ml-4 items-end">
            <Text className="text-lg font-black text-slate-800">
              {markObj ? markObj.marks_obtained : '-'}
            </Text>
            <Text className="text-xs text-slate-400 font-medium">
              / {markObj ? (markObj.max_marks || 100) : '-'}
            </Text>
          </View>
        </View>
      );
    });

    return { subjectRows, totalObtained, totalMax, allUploaded };
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-6 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Test Marks</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : exams.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
          <Text className="text-slate-400 font-medium text-lg mt-4 text-center">No exams found for your child yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          {exams.map((exam) => {
            const isExpanded = expandedExam === exam.exam_name;
            const { subjectRows, totalObtained, totalMax, allUploaded } = renderSubjects(exam.subjects);
            
            let percentage = 0;
            if (allUploaded && totalMax > 0) {
              percentage = Math.round((totalObtained / totalMax) * 100);
            }

            return (
              <View key={exam.exam_name} className="mb-6">
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={() => toggleExpand(exam.exam_name)}
                  className="overflow-hidden rounded-[24px] shadow-md shadow-indigo-200/50"
                >
                  <LinearGradient
                    colors={['#818CF8', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-6 flex-row justify-between items-center"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-black text-xl mb-1">{exam.exam_name}</Text>
                      <Text className="text-indigo-100 font-medium text-sm">
                        {new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    
                    {allUploaded ? (
                      <View className="items-end bg-white/20 px-4 py-2 rounded-2xl">
                        <Text className="text-white font-black text-2xl">{percentage}%</Text>
                        <Text className="text-indigo-100 font-bold text-xs uppercase tracking-wider">Overall</Text>
                      </View>
                    ) : (
                      <View className="items-end bg-white/20 px-4 py-2 rounded-2xl">
                        <Text className="text-white font-bold text-sm">Pending</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {isExpanded && (
                  <View className="bg-white rounded-[24px] p-2 mt-4 shadow-sm shadow-slate-200 border border-slate-100">
                    <Text className="text-lg font-black text-slate-800 mb-2 mt-2 ml-4">Subject Breakdown</Text>
                    {subjectRows}
                    
                    {allUploaded && (
                      <View className="p-4 bg-indigo-50 rounded-xl mt-2 flex-row justify-between items-center">
                        <Text className="text-indigo-900 font-black text-lg">Total Marks</Text>
                        <View className="items-end">
                          <Text className="text-indigo-900 font-black text-xl">{totalObtained} / {totalMax}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
