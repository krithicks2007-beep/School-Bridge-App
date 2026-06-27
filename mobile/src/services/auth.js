import { BASE_URL, handleApiResponse } from './api';

export const parentLogin = async (name, initial, pin) => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/parent-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, initial, pin }),
    });

    const data = await handleApiResponse(response);
    return data;
  } catch (error) {
    return { error: error.message };
  }
};

export const staffLogin = async (name, password) => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/staff-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, password }),
    });

    const data = await handleApiResponse(response);
    return data;
  } catch (error) {
    return { error: error.message };
  }
};

export const logout = async () => {

};
