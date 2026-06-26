

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.133.26.243:3000';

export const handleApiResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
};
