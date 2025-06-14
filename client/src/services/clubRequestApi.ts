import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getAllClubRequests = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/club-requests`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getClubRequestsByStatus = async (status: 'pending' | 'approved' | 'rejected') => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/club-requests/status/${status}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getClubRequestById = async (id: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/club-requests/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getUserClubRequests = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/club-requests/user/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createClubRequest = async (requestData: { name: string; description?: string; category?: string }) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/club-requests`, requestData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateClubRequest = async (id: number, requestData: { name: string; description?: string; category?: string }) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/club-requests/${id}`, requestData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const processClubRequest = async (id: number, data: { status: 'approved' | 'rejected'; admin_feedback?: string }) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/club-requests/${id}/process`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteClubRequest = async (id: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/club-requests/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
