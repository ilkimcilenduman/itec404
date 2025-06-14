import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getAllElections = async () => {
  const response = await axios.get(`${API_URL}/elections`);
  return response.data;
};

export const getClubElections = async (clubId: number) => {
  const response = await axios.get(`${API_URL}/elections/club/${clubId}`);
  return response.data;
};

export const getElectionById = async (id: number) => {
  const response = await axios.get(`${API_URL}/elections/${id}`);
  return response.data;
};

export const createElection = async (electionData: {
  club_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
}) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/elections`, electionData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const addElectionCandidate = async (
  electionId: number,
  candidateData: {
    user_id: number;
    position: string;
    statement?: string;
  }
) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/elections/${electionId}/candidates`, candidateData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const voteInElection = async (electionId: number, candidateId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/elections/${electionId}/vote`,
    { candidate_id: candidateId },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

export const getElectionResults = async (electionId: number) => {
  const response = await axios.get(`${API_URL}/elections/${electionId}/results`);
  return response.data;
};

export const checkUserVoted = async (electionId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/elections/${electionId}/has-voted`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getElectionRoles = async (electionId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/elections/${electionId}/roles`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const addElectionRole = async (
  electionId: number,
  roleData: {
    role_name: string;
    description?: string;
  }
) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/elections/${electionId}/roles`, roleData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteElectionRole = async (electionId: number, roleId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/elections/${electionId}/roles/${roleId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const applyForCandidacy = async (
  electionId: number,
  applicationData: {
    role_id: number;
    statement?: string;
  }
) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/elections/${electionId}/apply`, applicationData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getCandidateApplications = async (electionId: number) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/elections/${electionId}/applications`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateCandidateApplication = async (
  electionId: number,
  applicationId: number,
  status: 'approved' | 'rejected'
) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(
    `${API_URL}/elections/${electionId}/applications/${applicationId}`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};
