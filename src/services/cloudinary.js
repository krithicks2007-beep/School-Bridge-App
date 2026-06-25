const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export const uploadToCloudinary = async (imageUri) => {
  try {
    const formData = new FormData()

    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    })
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'school_app/students')

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await response.json()

    if (data.secure_url) {
      return { url: data.secure_url, error: null }
    } else {
      return { url: null, error: 'Upload failed' }
    }
  } catch (error) {
    return { url: null, error: error.message }
  }
}