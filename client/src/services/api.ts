import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }
};

export const clubService = {
  getAllClubs: async () => {
    const response = await api.get('/clubs');
    return response.data;
  },

  getClubById: async (id: string) => {
    const response = await api.get(`/clubs/${id}`);
    return response.data;
  },

  getClubMembers: async (id: string) => {
    const response = await api.get(`/clubs/${id}/members`);
    return response.data;
  },

  joinClub: async (id: string) => {
    const response = await api.post(`/clubs/${id}/join`);
    return response.data;
  },

  createClub: async (clubData: any) => {
    const response = await api.post('/clubs', clubData);
    return response.data;
  },

  updateClub: async (id: string, clubData: any) => {
    const response = await api.put(`/clubs/${id}`, clubData);
    return response.data;
  },

  deleteClub: async (id: string) => {
    const response = await api.delete(`/clubs/${id}`);
    return response.data;
  },

  updateMemberStatus: async (clubId: string, userId: string, status: string) => {
    const response = await api.put(`/clubs/${clubId}/members/${userId}`, { status });
    return response.data;
  }
};

export const eventService = {
  getAllEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getEventById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getClubEvents: async (clubId: string) => {
    const response = await api.get(`/events/club/${clubId}`);
    return response.data;
  },

  registerForEvent: async (id: string) => {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
  },

  createEvent: async (eventData: any) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id: string, eventData: any) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  getEventRegistrations: async (id: string) => {
    const response = await api.get(`/events/${id}/registrations`);
    return response.data;
  }
};

export const userService = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getUserClubs: async () => {
    const response = await api.get('/users/me/clubs');
    return response.data;
  },

  getUserEvents: async () => {
    const response = await api.get('/users/me/events');
    return response.data;
  },

  updateProfile: async (userData: any) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  }
};

export default {
  auth: authService,
  clubs: clubService,
  events: eventService,
  users: userService
};
