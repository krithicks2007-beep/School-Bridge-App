import { supabase } from './supabase'
import { compressImage } from '../utils/imageCompressor'
import { uploadToCloudinary } from './cloudinary'
import * as ImagePicker from 'expo-image-picker'

// Pick image from gallery or camera
export const pickStudentPhoto = async () => {
  // Ask permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    return { uri: null, error: 'Permission denied' }
  }

  // Open picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],       // square crop
    quality: 1,
  })

  if (result.canceled) return { uri: null, error: null }

  return { uri: result.assets[0].uri, error: null }
}

// Full flow: pick → compress → upload → save to Supabase
export const uploadStudentPhoto = async (studentId) => {
  try {
    // Step 1 - Pick photo
    const { uri, error: pickError } = await pickStudentPhoto()
    if (pickError) return { error: pickError }
    if (!uri) return { error: null }  // user cancelled

    // Step 2 - Compress photo
    const compressedUri = await compressImage(uri)

    // Step 3 - Upload to Cloudinary
    const { url, error: uploadError } = await uploadToCloudinary(compressedUri)
    if (uploadError) return { error: uploadError }

    // Step 4 - Save URL to Supabase
    const { error: dbError } = await supabase
      .from('"Student"')
      .update({ photo_url: url })
      .eq('id', studentId)

    if (dbError) return { error: dbError.message }

    return { url, error: null }

  } catch (err) {
    return { error: err.message }
  }
}