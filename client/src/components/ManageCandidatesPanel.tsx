import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { addElectionCandidate, getElectionRoles } from '../services/electionApi';
import { ExclamationTriangle, CheckCircle, PersonFill, Award, FileText } from 'react-bootstrap-icons';
import Button from './ui/Button';

interface ClubMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  student_id: string;
  role: string;
}

interface ElectionRole {
  id: number;
  election_id: number;
  role_name: string;
  description: string;
}

interface Candidate {
  id: number;
  user_id: number;
  name: string;
  position: string;
  role_id?: number;
  statement: string;
}

interface ManageCandidatesPanelProps {
  electionId: number;
  clubId: number;
  candidates: Candidate[];
  onCandidateAdded: () => void;
}

const ManageCandidatesPanel: React.FC<ManageCandidatesPanelProps> = ({
  electionId,
  clubId,
  candidates,
  onCandidateAdded
}) => {
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [roles, setRoles] = useState<ElectionRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    role_id: '',
    statement: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingMembers(true);
        setLoadingRoles(true);
        const token = localStorage.getItem('token');

        const membersResponse = await fetch(`http://localhost:5000/api/clubs/${clubId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!membersResponse.ok) {
          throw new Error('Failed to fetch club members');
        }

        const membersData = await membersResponse.json();

        const existingCandidateUserIds = candidates.map(c => c.user_id);
        const filteredMembers = membersData.filter((member: any) =>
          member.status === 'approved' &&
          !existingCandidateUserIds.includes(member.user_id)
        );

        setClubMembers(filteredMembers);

        const rolesData = await getElectionRoles(electionId);
        setRoles(rolesData);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoadingMembers(false);
        setLoadingRoles(false);
      }
    };

    fetchData();
  }, [clubId, electionId, candidates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_id) {
      newErrors.user_id = 'Please select a member';
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addElectionCandidate(electionId, {
        user_id: parseInt(formData.user_id),
        role_id: parseInt(formData.role_id),
        statement: formData.statement
      });

      setSuccess('Candidate added successfully!');
      setFormData({ user_id: '', role_id: '', statement: '' });

      setTimeout(() => {
        onCandidateAdded();
        setShowAddForm(false);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="bg-primary-50 dark:bg-primary-900/30 p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
          <Award className="mr-2" />
          Manage Candidates
        </h3>

        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
          >
            Add Candidate
          </Button>
        )}
      </div>

      <div className="p-6">
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

        {showAddForm ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                  <PersonFill className="mr-1" size={16} /> Select Member*
                </label>
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  className={`input w-full ${errors.user_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={loadingMembers}
                >
                  <option value="">Select a member</option>
                  {clubMembers.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name} ({member.student_id})
                    </option>
                  ))}
                </select>
                {errors.user_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.user_id}</p>
                )}
                {clubMembers.length === 0 && !loadingMembers && (
                  <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                    No eligible members available to add as candidates.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                  <Award className="mr-1" size={16} /> Role*
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className={`input w-full ${errors.role_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={loadingRoles}
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}{role.description ? ` - ${role.description}` : ''}
                    </option>
                  ))}
                </select>
                {errors.role_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role_id}</p>
                )}
                {roles.length === 0 && !loadingRoles && (
                  <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                    No roles available. Please add roles to the election first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                  <FileText className="mr-1" size={16} /> Statement (Optional)
                </label>
                <textarea
                  rows={3}
                  name="statement"
                  value={formData.statement}
                  onChange={handleChange}
                  placeholder="Candidate's statement or platform"
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || clubMembers.length === 0}
                >
                  {loading ? 'Adding...' : 'Add Candidate'}
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <div>
            <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">Current Candidates</h4>

            {candidates.length === 0 ? (
              <p className="text-neutral-600 dark:text-neutral-400 text-center py-4">
                No candidates have been added to this election yet.
              </p>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{candidate.name}</h5>
                        <p className="text-primary-600 dark:text-primary-400 text-sm font-medium mt-1">
                          Position: {candidate.position}
                        </p>
                        {candidate.statement && (
                          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
                            {candidate.statement}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCandidatesPanel;
