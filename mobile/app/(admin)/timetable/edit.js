import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BASE_URL, handleApiResponse } from '../../../src/services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function EditTimetable() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 768;
  const dayColumnWidth = isWideLayout ? 120 : 96;
  const minPeriodColumnWidth = isWideLayout ? 128 : 112;
  const tableWidth = Math.max(width, dayColumnWidth + PERIODS.length * minPeriodColumnWidth);
  const periodColumnWidth = (tableWidth - dayColumnWidth) / PERIODS.length;

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // { id, name, section }
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);

  const [editingCell, setEditingCell] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load real classes from DB
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/classes`);
        const result = await handleApiResponse(response);
        const classList = result.data || [];
        setClasses(classList);
        if (classList.length > 0) setSelectedClass(classList[0]);
      } catch (err) {
        Alert.alert('Error', 'Failed to load classes');
      } finally {
        setClassesLoading(false);
      }
    };
    loadClasses();
  }, []);

  // Load timetable whenever selected class changes
  useEffect(() => {
    if (!selectedClass) return;
    fetchTimetable();
  }, [selectedClass]);

  const fetchTimetable = async () => {
    setLoading(true);
    setTimetableData([]);
    try {
      const response = await fetch(`${BASE_URL}/api/timetable?class_id=${selectedClass.id}`);
      const result = await handleApiResponse(response);
      setTimetableData(result.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  const getCellData = (day, periodNumber) => {
    return timetableData.find(t => t.day_of_week === day && Number(t.period_number) === periodNumber);
  };

  const handleCellClick = (day, periodNumber) => {
    const cell = getCellData(day, periodNumber);
    if (cell) {
      setEditingCell(cell);
      setEditSubject(cell.subject || '');
      setEditTeacher(cell.teacher_id || '');
    } else {
      Alert.alert('Empty Cell', 'No entry exists for this slot. Upload a full timetable first.');
    }
  };

  const handleSave = async () => {
    if (!editingCell) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/api/timetable/${editingCell.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editSubject, teacher_id: editTeacher }),
      });
      await handleApiResponse(response);
      setTimetableData(prev =>
        prev.map(item =>
          item.id === editingCell.id
            ? { ...item, subject: editSubject, teacher_id: editTeacher }
            : item
        )
      );
      setEditingCell(null);
      Alert.alert('Saved', 'Cell updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 20 }}>
      {/* Header */}
      <View className="px-5 pb-4 flex-row items-center border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-brand-950 flex-1">Edit Timetable Grid</Text>
      </View>

      {/* Class Selector */}
      <View className="px-5 py-3 bg-white border-b border-gray-200">
        {classesLoading ? (
          <ActivityIndicator color="#9333EA" />
        ) : (
          <View style={{ height: 44 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  onPress={() => setSelectedClass(cls)}
                  style={{ height: 36 }}
                  className={`mr-3 px-4 rounded-full border items-center justify-center ${
                    selectedClass?.id === cls.id ? 'bg-purple-600 border-purple-600' : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text className={`font-bold text-sm ${
                    selectedClass?.id === cls.id ? 'text-white' : 'text-gray-700'
                  }`}>
                    {cls.name}{cls.section ? ` (${cls.section})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Grid */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#9333EA" />
          <Text className="mt-3 text-gray-500 font-medium">Loading timetable...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" horizontal showsHorizontalScrollIndicator={!isWideLayout}>
          <ScrollView style={{ width: tableWidth }}>
            {/* Header row */}
            <View className="flex-row border-t border-l border-gray-300">
              <View style={{ width: dayColumnWidth, height: 48 }} className="bg-gray-200 border-r border-b border-gray-300 items-center justify-center">
                <Text className="font-bold text-gray-600 text-xs">Day / P</Text>
              </View>
              {PERIODS.map(p => (
                <View key={p} style={{ width: periodColumnWidth, height: 48 }} className="bg-gray-200 border-r border-b border-gray-300 items-center justify-center">
                  <Text className="font-bold text-gray-800">P{p}</Text>
                </View>
              ))}
            </View>

            {/* Day rows */}
            {DAYS.map(day => (
              <View key={day} className="flex-row border-l border-gray-300">
                <View style={{ width: dayColumnWidth, height: 88 }} className="bg-gray-100 border-r border-b border-gray-300 items-center justify-center">
                  <Text className="font-bold text-gray-800 text-xs">{day.substring(0, 3)}</Text>
                </View>
                {PERIODS.map(p => {
                  const cell = getCellData(day, p);
                  return (
                    <TouchableOpacity
                      key={`${day}-${p}`}
                      onPress={() => handleCellClick(day, p)}
                      style={{ width: periodColumnWidth, height: 88 }}
                      className={`border-r border-b border-gray-300 p-1.5 items-center justify-center ${cell ? 'bg-white' : 'bg-gray-50'}`}
                      activeOpacity={0.6}
                    >
                      {cell ? (
                        <>
                          <View className="w-full h-full items-center justify-center rounded-xl bg-purple-50 p-1">
                            <Text className="font-bold text-purple-700 text-center text-xs mb-0.5" numberOfLines={2}>
                              {cell.subject}
                            </Text>
                            <Ionicons name="pencil" size={10} color="#9333EA" style={{ marginTop: 2 }} />
                          </View>
                        </>
                      ) : (
                        <Text className="text-gray-300 text-lg">—</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={!!editingCell} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-5">
          <View className="bg-white w-full rounded-2xl p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Edit Period</Text>
              <TouchableOpacity onPress={() => setEditingCell(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {editingCell && (
              <Text className="text-sm font-medium text-gray-500 mb-4">
                {editingCell.day_of_week} • Period {editingCell.period_number}
              </Text>
            )}

            <Text className="text-sm font-bold text-gray-700 mb-2">Subject</Text>
            <TextInput
              value={editSubject}
              onChangeText={setEditSubject}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 font-medium"
              placeholder="e.g. Mathematics"
            />

            <Text className="text-sm font-bold text-gray-700 mb-2">Teacher Name / ID</Text>
            <TextInput
              value={editTeacher}
              onChangeText={setEditTeacher}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-800 font-medium"
              placeholder="e.g. Mrs. Anitha"
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`h-12 rounded-xl items-center justify-center ${isSaving ? 'bg-purple-400' : 'bg-purple-600'}`}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white font-bold text-lg">Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
