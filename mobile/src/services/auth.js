import { BASE_URL, handleApiResponse , apiFetch} from './api';

export const loginAPI = async (reg_id, password) => {
  try {
    const response = await apiFetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reg_id, password }),
    });

    const data = await handleApiResponse(response);
    return data;
  } catch (error) {
    return { error: error.message };
  }
};

export const logout = async () => {

};

export const savePushTokenAPI = async (userId, role, token) => {
  try {
    const response = await apiFetch(`${BASE_URL}/api/auth/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: userId, role, token }),
    });

    const data = await handleApiResponse(response);
    return data;
  } catch (error) {
    return { error: error.message };
  }
};
