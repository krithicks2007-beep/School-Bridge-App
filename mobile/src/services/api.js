import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHostIp = () => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost || Constants.manifest?.debuggerHost;
    if (hostUri) {
      return hostUri.split(':')[0];
    }
  } catch (e) {}
  return null;
};

const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const hostIp = getHostIp();

  // On physical mobile device, replace localhost/127.0.0.1 with host PC IP address
  if (Platform.OS !== 'web' && hostIp) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return `http://${hostIp}:3000`;
    }
  }

  return envUrl || 'http://localhost:3000';
};

export const BASE_URL = getBaseUrl();

export const handleApiResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
};

export const apiFetch = async (url, options = {}) => {
  let token = null;
  try {
    const { useAuthStore } = require('../store/authStore');
    token = useAuthStore.getState().token;
  } catch (e) {
    // Auth store might not be instantiated yet
  }
  const headers = { ...options.headers };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await fetch(url, { ...options, headers });
  } catch (err) {
    if (Platform.OS === 'web' && url.includes(':3000')) {
      const fallbackUrl = url.replace(/http:\/\/[^:]+:3000/, 'http://localhost:3000');
      if (fallbackUrl !== url) {
        return await fetch(fallbackUrl, { ...options, headers });
      }
    }
    throw err;
  }
};

