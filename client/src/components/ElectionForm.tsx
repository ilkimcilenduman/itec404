import React, { useState, useEffect } from 'react';
import { createElection, addElectionRole } from '../services/electionApi';
import axios from 'axios';
import { ExclamationTriangle, CheckCircle, Building, Calendar2, FileText, Award } from 'react-bootstrap-icons';
import Button from './ui/Button';

interface ElectionFormProps {
  user: any;
  onElectionCreated?: () => void;
  onCancel?: () => void;
}

interface Club {
  id: number;
  name: string;
}

const ElectionForm: React.FC<ElectionFormProps> = ({ user, onElectionCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    club_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  const [roles, setRoles] = useState<{role_name: string, description: string}[]>([]);
  const [newRole, setNewRole] = useState({ role_name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  useEffect(() => {
    const fetchUserClubs = async () => {
      try {
        setLoadingClubs(true);
        const token = localStorage.getItem('token');

        if (user?.role === 'admin') {
          const response = await axios.get('http://localhost:5000/api/clubs', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserClubs(response.data);
        } else {
          const response = await axios.get('http://localhost:5000/api/users/me/clubs', {
            headers: { Authorization: `Bearer ${token}` }
          });

          const presidentClubs = response.data
            .filter((club: any) => club.member_role === 'president' && club.member_status === 'approved')
            .map((club: any) => ({
              id: club.id,
              name: club.name
            }));

          setUserClubs(presidentClubs);
        }

        setLoadingClubs(false);
      } catch (error) {
        console.error('Error fetching user clubs:', error);
        setLoadingClubs(false);
      }
    };

    fetchUserClubs();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.club_id || !formData.title || !formData.start_date || !formData.end_date) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }

      const electionResponse = await createElection({
        ...formData,
        club_id: parseInt(formData.club_id)
      });

      if (roles.length > 0) {
        const electionId = electionResponse.id;

        for (const role of roles) {
          await addElectionRole(electionId, role);
        }
      }

      setSuccess('Election created successfully');
      setFormData({
        club_id: '',
        title: '',
        description: '',
        start_date: '',
        end_date: ''
      });
      setRoles([]);
      setNewRole({ role_name: '', description: '' });

      if (onElectionCreated) {
        onElectionCreated();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create election. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingClubs) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading your clubs...</p>
      </div>
    );
  }

  if (userClubs.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg">
        You are not a president of any clubs. You need to be a club president to create elections.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
        <Award className="mr-2" />
        Create New Election
      </h3>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg mb-4 flex items-center">
          <CheckCircle className="mr-2" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
            <Building className="mr-1" size={16} /> Club*
          </label>
          <select
            name="club_id"
            value={formData.club_id}
            onChange={handleChange}
            required
            className="input w-full"
          >
            <option value="">Select a club</option>
            {userClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
            <Award className="mr-1" size={16} /> Election Title*
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Spring 2023 Board Elections"
            required
            className="input w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
              <Calendar2 className="mr-1" size={16} /> Start Date*
            </label>
            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
              <Calendar2 className="mr-1" size={16} /> End Date*
            </label>
            <input
              type="datetime-local"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
            <FileText className="mr-1" size={16} /> Description
          </label>
          <textarea
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide details about this election"
            className="input w-full"
          />
        </div>

        {/* Election Roles Section */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
          <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3 flex items-center">
            <Award className="mr-2" size={18} />
            Election Roles
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Define the roles that candidates can apply for in this election.
          </p>

          {/* Add Role Form */}
          <div className="bg-neutral-50 dark:bg-neutral-900/30 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Role Name*
                </label>
                <input
                  type="text"
                  value={newRole.role_name}
                  onChange={(e) => setNewRole({...newRole, role_name: e.target.value})}
                  placeholder="e.g., President"
                  className="input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Brief description of this role"
                  className="input w-full"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newRole.role_name.trim()) {
                    setRoles([...roles, {...newRole}]);
                    setNewRole({ role_name: '', description: '' });
                  }
                }}
                disabled={!newRole.role_name.trim()}
              >
                Add Role
              </Button>
            </div>
          </div>

          {/* Roles List */}
          {roles.length > 0 ? (
            <div className="space-y-2 mb-4">
              <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Added Roles:</h5>
              {roles.map((role, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{role.role_name}</div>
                    {role.description && (
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">{role.description}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => {
                      setRoles(roles.filter((_, i) => i !== index));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 italic mb-4">
              No roles added yet. Add at least one role for candidates to apply for.
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Election'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ElectionForm;
