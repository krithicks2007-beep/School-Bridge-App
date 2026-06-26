import * as ImagePicker from 'expo-image-picker';
import { compressImage } from '../utils/imageCompressor';
import { BASE_URL, handleApiResponse } from './api';

export const pickStudentPhoto = async () => {

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return { uri: null, error: 'Permission denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],       // square crop
    quality: 1,
  });

  if (result.canceled) return { uri: null, error: null };

  return { uri: result.assets[0].uri, error: null };
};

export const uploadStudentPhoto = async (studentId) => {
  try {

    const { uri, error: pickError } = await pickStudentPhoto();
    if (pickError) return { error: pickError };
    if (!uri) return { error: null };  // user cancelled

    const compressedUri = await compressImage(uri);

    const formData = new FormData();
    formData.append('file', {
      uri: compressedUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    const response = await fetch(`${BASE_URL}/api/students/${studentId}/photo`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await handleApiResponse(response);
    return { url: data.url, error: null };

  } catch (err) {
    return { error: err.message };
  }
};