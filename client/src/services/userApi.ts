import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getUserClubs = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/me/clubs`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const checkClubPresidency = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/me/club-presidency`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getUserEvents = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/me/events`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateProfile = async (userData: any) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/users/me`, userData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
