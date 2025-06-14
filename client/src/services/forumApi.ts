import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getClubForumPosts = async (clubId: number) => {
  const response = await axios.get(`${API_URL}/forum/club/${clubId}`);
  return response.data;
};

export const getForumPost = async (postId: number) => {
  const response = await axios.get(`${API_URL}/forum/${postId}`);
  return response.data;
};

export const createForumPost = async (data: { club_id: number; forum_title: string; forum_content: string }) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/forum`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const addForumComment = async (postId: number, comment_content: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/forum/${postId}/comments`, { comment_content }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteForumPost = async (postId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/forum/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteForumComment = async (postId: number, commentId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/forum/${postId}/comments/${commentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
