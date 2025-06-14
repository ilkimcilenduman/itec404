import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getAllEvents = async () => {
  const response = await axios.get(`${API_URL}/events`);
  return response.data;
};

export const getClubEvents = async (clubId: number) => {
  const response = await axios.get(`${API_URL}/events/club/${clubId}`);
  return response.data;
};

export const getEventById = async (id: number) => {
  const response = await axios.get(`${API_URL}/events/${id}`);
  return response.data;
};

export const createEvent = async (eventData: {
  title: string;
  description: string;
  date: string;
  location: string;
  club_id: number;
}) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/events`, eventData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateEvent = async (
  id: number,
  eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
  }
) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/events/${id}`, eventData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteEvent = async (id: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/events/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const registerForEvent = async (id: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/events/${id}/register`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getEventRegistrations = async (id: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/events/${id}/registrations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
