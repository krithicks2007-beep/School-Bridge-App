import * as ImageManipulator from 'expo-image-manipulator'

export const compressImage = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],   // resize width to 800px
    {
      compress: 0.7,                  // 70% quality
      format: ImageManipulator.SaveFormat.JPEG,
    }
  )

  return result.uri
}