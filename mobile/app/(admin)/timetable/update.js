import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { BASE_URL, handleApiResponse , apiFetch} from '../../../src/services/api';

export default function UpdateTimetable() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // { id, name, section }
  const [classesLoading, setClassesLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load real classes from DB
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await apiFetch(`${BASE_URL}/api/classes`);
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

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('No File', 'Please select an Excel file first.');
      return;
    }
    if (!selectedClass) {
      Alert.alert('No Class', 'Please select a class first.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('class_id', selectedClass.id); // Use UUID, not name
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const response = await apiFetch(`${BASE_URL}/api/timetable/upload`, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', `Timetable for ${selectedClass.name} uploaded successfully!`);
        setFile(null);
      } else {
        Alert.alert('Upload Failed', data.error || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 20 }}>
      {/* Header */}
      <View className="px-5 pb-5 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-brand-950">Update Timetable</Text>
      </View>

      <View className="px-5 flex-1 pt-5">
        <Text className="text-sm font-bold text-gray-700 mb-3">Select Class</Text>

        {classesLoading ? (
          <ActivityIndicator color="#3B82F6" className="mb-6" />
        ) : (
        <View style={{ height: 44 }} className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => setSelectedClass(cls)}
                style={{ height: 36 }}
                className={`mr-3 px-4 rounded-full border items-center justify-center ${
                  selectedClass?.id === cls.id ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-200'
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

        <View className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text className="text-blue-800 font-bold ml-2">Expected File Format</Text>
          </View>
          <Text className="text-sm text-blue-700/80 mb-2">
            Your Excel file (.xlsx or .xls) should have the following column headers exactly as spelled below:
          </Text>
          <View className="bg-white rounded-lg p-3 border border-blue-100/50 shadow-sm">
            <Text className="text-xs text-gray-600 font-medium leading-5">
              <Text className="font-bold text-gray-800">Day</Text> (e.g. Monday), <Text className="font-bold text-gray-800">Period</Text> (e.g. 1), <Text className="font-bold text-gray-800">Subject</Text>, <Text className="font-bold text-gray-800">Teacher</Text> (Teacher ID or Name), <Text className="font-bold text-gray-800">Start</Text> (e.g. 09:00:00), and <Text className="font-bold text-gray-800">End</Text> (e.g. 09:45:00).
            </Text>
            <Text className="text-xs text-gray-500 mt-2">
              Optional columns: <Text className="font-bold text-gray-700">Room</Text>, <Text className="font-bold text-gray-700">Is_break</Text> (true/false), <Text className="font-bold text-gray-700">Break_label</Text>.
            </Text>
          </View>
        </View>

        <Text className="text-sm font-bold text-gray-700 mb-2">Upload Excel File</Text>
        <TouchableOpacity
          onPress={handleSelectFile}
          className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-8 items-center justify-center mb-6"
        >
          <Feather name="file-plus" size={40} color="#3B82F6" />
          <Text className="text-blue-600 font-bold text-lg mt-3 mb-1">
            {file ? file.name : 'Tap to select file'}
          </Text>
          <Text className="text-gray-500 text-sm">
            {file ? `Size: ${(file.size / 1024).toFixed(1)} KB` : 'Supports .xlsx, .xls'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={!file || isUploading || !selectedClass}
          className={`h-14 rounded-xl flex-row items-center justify-center gap-x-2 ${!file || isUploading || !selectedClass ? 'bg-gray-300' : 'bg-blue-600 shadow-lg shadow-blue-500/30'}`}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Feather name="upload-cloud" size={20} color="#FFF" />
              <Text className="text-white font-bold text-lg">Upload to Database</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
