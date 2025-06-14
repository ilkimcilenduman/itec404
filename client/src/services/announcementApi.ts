import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getClubAnnouncements = async (clubId: number) => {
  const response = await axios.get(`${API_URL}/announcements/club/${clubId}`);
  return response.data;
};

export const getUserAnnouncements = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/announcements/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createAnnouncement = async (data: {
  title: string;
  content: string;
  clubId: number;
  scheduledDate?: string;
}) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/announcements`, {
    club_id: data.clubId,
    title: data.title,
    content: data.content,
    scheduled_date: data.scheduledDate
  }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteAnnouncement = async (id: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/announcements/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getScheduledAnnouncements = async (clubId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/announcements/club/${clubId}/scheduled`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const publishAnnouncementNow = async (id: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/announcements/${id}/publish`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
