

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://school-bridge-app.onrender.com';

export const handleApiResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
};
