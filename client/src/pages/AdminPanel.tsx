import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllClubRequests, processClubRequest } from '../services/clubRequestApi';
import axios from 'axios';
import Button from '../components/ui/Button';
import { XCircle, CheckCircle, ExclamationTriangle, InfoCircle, PlusCircle, Trash, PencilFill, Building, PersonFill, Calendar2, GeoAlt, Award, FileText } from 'react-bootstrap-icons';
import Portal from '../components/Portal';

interface AdminPanelProps {
  user?: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('You do not have permission to access this page.');
    }
  }, [isAdmin]);
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [clubRequests, setClubRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showClubModal, setShowClubModal] = useState(false);
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    category: ''
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [showClubSelection, setShowClubSelection] = useState(false);
  const [clubToRemove, setClubToRemove] = useState('');
  const [showRemoveClubSelection, setShowRemoveClubSelection] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [roleTabActive, setRoleTabActive] = useState('change-role');

  useEffect(() => {
    if (!isAdmin) {
      setError('You do not have permission to access this page.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`
        };

        try {
          const usersResponse = await axios.get('http://localhost:5000/api/users', { headers });
          setUsers(usersResponse.data);
        } catch (userError) {
          console.error('Error fetching users:', userError);
        }

        try {
          const clubsResponse = await axios.get('http://localhost:5000/api/clubs');
          setClubs(clubsResponse.data);
        } catch (clubError) {
          console.error('Error fetching clubs:', clubError);
        }

        try {
          const eventsResponse = await axios.get('http://localhost:5000/api/events');
          setEvents(eventsResponse.data);
        } catch (eventError) {
          console.error('Error fetching events:', eventError);
        }

        try {
          const clubRequestsResponse = await getAllClubRequests();
          setClubRequests(clubRequestsResponse);
        } catch (requestError) {
          console.error('Error fetching club requests:', requestError);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleClubFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClubForm({
      ...clubForm,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/clubs',
        clubForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setClubs([...clubs, response.data]);

      setClubForm({
        name: '',
        description: '',
        category: ''
      });
      setShowClubModal(false);
      setSuccess('Club created successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create club');
    }
  };

  const handleDeleteClub = async (clubId: number) => {
    if (!confirm('Are you sure you want to delete this club?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/clubs/${clubId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setClubs(clubs.filter((club: any) => club.id !== clubId));
      setSuccess('Club deleted successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete club');
    }
  };

  const openRoleModal = (user: any) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowClubSelection(user.role === 'club_president');
    setSelectedClubId('');
    setShowRoleModal(true);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setSelectedRole(role);
    setShowClubSelection(role === 'club_president');
    if (role !== 'club_president') {
      setSelectedClubId('');
    }
  };

  const handleUpdateRole = async () => {
    setError('');
    setSuccess('');

    if (selectedRole === 'club_president' && !selectedClubId) {
      setError('Please select a club for the club president');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${selectedUser.id}/role`,
        {
          role: selectedRole,
          clubId: selectedRole === 'club_president' ? parseInt(selectedClubId) : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const usersResponse = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersResponse.data);

      setShowRoleModal(false);
      setSelectedClubId('');
      setShowClubSelection(false);
      setSuccess('User role updated successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleRemoveRole = async () => {
    setError('');
    setSuccess('');

    if (selectedUser.role === 'student') {
      setError('User already has the basic student role');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${selectedUser.id}/role`,
        {
          role: 'student',
          removeFromClubs: true 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const usersResponse = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersResponse.data);

      setShowRoleModal(false);
      setSelectedClubId('');
      setShowClubSelection(false);
      setSuccess('User role removed successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove user role');
    }
  };

  const handleRemoveClubRole = async () => {
    setError('');
    setSuccess('');

    if (!clubToRemove) {
      setError('Please select a club');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/users/${selectedUser.id}/clubs/${clubToRemove}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const usersResponse = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersResponse.data);

      setShowRoleModal(false);
      setClubToRemove('');
      setShowRemoveClubSelection(false);
      setSuccess('Club role removed successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove club role');
    }
  };

  const toggleRemoveClubSelection = () => {
    setShowRemoveClubSelection(!showRemoveClubSelection);
    setClubToRemove('');
  };

  const handleProcessClubRequest = async (requestId: number, status: 'approved' | 'rejected') => {
    setError('');
    setSuccess('');

    try {
      let adminFeedback = '';
      if (status === 'rejected') {
        adminFeedback = prompt('Please provide a reason for rejection:') || '';
      }

      await processClubRequest(requestId, { status, admin_feedback: adminFeedback });

      const clubRequestsResponse = await getAllClubRequests();
      setClubRequests(clubRequestsResponse);

      if (status === 'approved') {
        const token = localStorage.getItem('token');
        const clubsResponse = await axios.get('http://localhost:5000/api/clubs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClubs(clubsResponse.data);
      }

      setSuccess(`Club request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      setError(error.response?.data?.message || `Failed to ${status} club request`);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <motion.div
        className="flex items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
          <Award className="text-primary-600 dark:text-primary-400" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Admin Panel</h1>
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-4 flex items-center">
          <CheckCircle className="mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'users' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('clubs')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'clubs' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Clubs
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'events' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('clubRequests')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'clubRequests' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Club Requests
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <PersonFill className="mr-2" size={18} />
                User Management
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Student ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Club Permissions</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {users.map((user: any) => (
                      <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{user.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                          {user.clubs && user.clubs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.clubs.map((club: any) => (
                                <span
                                  key={club.club_id}
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${club.member_role === 'president' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}
                                >
                                  {club.member_role === 'president' ? 'President of: ' : 'Member of: '}
                                  {club.club_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500">No club memberships</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleModal(user)}
                            className="flex items-center"
                          >
                            <PencilFill className="mr-1" size={12} />
                            Change Role
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clubs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <Building className="mr-2" size={18} />
                  Club Management
                </h3>
                <Button
                  onClick={() => setShowClubModal(true)}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                >
                  <PlusCircle className="mr-2" size={16} />
                  Create New Club
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {clubs.map((club: any) => (
                      <tr key={club.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{club.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{club.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{club.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClub(club.id)}
                            className="flex items-center text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 border-red-300 hover:border-red-500 dark:border-red-800"
                          >
                            <Trash className="mr-1" size={12} />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <Calendar2 className="mr-2" size={18} />
                Event Monitoring
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Club</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {events.map((event: any) => (
                      <tr key={event.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{event.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{new Date(event.date).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{event.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{event.club_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clubRequests' && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <Building className="mr-2" size={18} />
                Club Creation Requests
              </h3>

              {clubRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                    <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Club Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Requester</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                      {clubRequests.map((request: any) => (
                        <tr key={request.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{request.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">{request.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{request.category || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{request.requester_name} ({request.requester_email})</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${request.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                              {request.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{new Date(request.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProcessClubRequest(request.id, 'approved')}
                                  className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="mr-1" size={12} />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProcessClubRequest(request.id, 'rejected')}
                                  className="flex items-center bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <XCircle className="mr-1" size={12} />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-neutral-400 dark:text-neutral-500">Already processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg flex items-center">
                  <InfoCircle className="mr-2" />
                  No club requests found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Club Modal */}
      {showClubModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-lg overflow-hidden my-20"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <Building className="mr-2" />
                  Create New Club
                </h3>
                <button
                  onClick={() => setShowClubModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleCreateClub} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                      <Building className="mr-1" size={16} /> Club Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={clubForm.name}
                      onChange={handleClubFormChange}
                      required
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                      <Award className="mr-1" size={16} /> Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={clubForm.category}
                      onChange={handleClubFormChange}
                      required
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                      <FileText className="mr-1" size={16} /> Description
                    </label>
                    <textarea
                      rows={3}
                      name="description"
                      value={clubForm.description}
                      onChange={handleClubFormChange}
                      required
                      className="input w-full"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowClubModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Club
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-2xl overflow-hidden my-20"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <PersonFill className="mr-2" />
                  Change User Role
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 bg-neutral-50 dark:bg-neutral-900/30 p-4 rounded-lg">
                  <p className="text-neutral-700 dark:text-neutral-300 mb-1">
                    <strong>User:</strong> {selectedUser.name} ({selectedUser.email})
                  </p>
                  <p className="text-neutral-700 dark:text-neutral-300">
                    <strong>Current Role:</strong>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 ml-2">
                      {selectedUser.role}
                    </span>
                  </p>
                </div>

                <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => setRoleTabActive('change-role')}
                      className={`px-4 py-2 text-sm font-medium ${roleTabActive === 'change-role' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => setRoleTabActive('remove-club')}
                      className={`px-4 py-2 text-sm font-medium ${roleTabActive === 'remove-club' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                    >
                      Remove Club Role
                    </button>
                  </div>
                </div>

                {roleTabActive === 'change-role' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                        <PersonFill className="mr-1" size={16} /> New Role
                      </label>
                      <select
                        value={selectedRole}
                        onChange={handleRoleChange}
                        className="input w-full"
                      >
                        <option value="student">Student</option>
                        <option value="club_president">Club President</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {showClubSelection && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                          <Building className="mr-1" size={16} /> Select Club
                        </label>
                        <select
                          value={selectedClubId}
                          onChange={(e) => setSelectedClubId(e.target.value)}
                          className={`input w-full ${selectedRole === 'club_president' && !selectedClubId ? 'border-red-500 focus:ring-red-500' : ''}`}
                        >
                          <option value="">Select a club</option>
                          {clubs.map((club: any) => (
                            <option key={club.id} value={club.id}>
                              {club.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          The user will be assigned as president of this club.
                        </p>
                        {selectedRole === 'club_president' && !selectedClubId && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            Please select a club for the club president
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {roleTabActive === 'remove-club' && (
                  <div>
                    {selectedUser.clubs && selectedUser.clubs.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                          <Building className="mr-1" size={16} /> Select Club to Remove Role
                        </label>
                        <select
                          value={clubToRemove}
                          onChange={(e) => setClubToRemove(e.target.value)}
                          className="input w-full"
                        >
                          <option value="">Select a club</option>
                          {selectedUser.clubs.map((club: any) => (
                            <option key={club.club_id} value={club.club_id}>
                              {club.club_name} - Role: {club.member_role}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          The user will be removed from this club.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg flex items-center">
                        <InfoCircle className="mr-2" />
                        This user is not a member of any clubs.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="space-x-2">
                    {selectedUser?.role !== 'student' && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveRole}
                        disabled={selectedUser?.role === 'student'}
                        className="flex items-center text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 border-red-300 hover:border-red-500 dark:border-red-800"
                      >
                        <Trash className="mr-1" size={14} />
                        Remove All Roles
                      </Button>
                    )}
                    {roleTabActive === 'remove-club' && selectedUser?.clubs?.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveClubRole}
                        disabled={!clubToRemove}
                        className="flex items-center text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 border-yellow-300 hover:border-yellow-500 dark:border-yellow-800"
                      >
                        <Trash className="mr-1" size={14} />
                        Remove Club Role
                      </Button>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRoleModal(false)}
                    >
                      Cancel
                    </Button>
                    {roleTabActive === 'change-role' && (
                      <Button onClick={handleUpdateRole}>
                        Update Role
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default AdminPanel;
