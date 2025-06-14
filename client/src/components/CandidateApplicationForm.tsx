import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext';
import { ExclamationTriangle, CheckCircle, Award, FileText } from 'react-bootstrap-icons';
import Button from './ui/Button';
import { getElectionRoles, applyForCandidacy } from '../services/electionApi';

interface ElectionRole {
  id: number;
  election_id: number;
  role_name: string;
  description: string;
}

interface CandidateApplicationFormProps {
  electionId: number;
  clubId: number;
  onApplicationSubmitted: () => void;
  onCancel: () => void;
}

const CandidateApplicationForm: React.FC<CandidateApplicationFormProps> = ({
  electionId,
  clubId,
  onApplicationSubmitted,
  onCancel
}) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    role_id: '',
    statement: ''
  });
  const [roles, setRoles] = useState<ElectionRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const rolesData = await getElectionRoles(electionId);
        setRoles(rolesData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load election roles');
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [electionId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.role_id) {
      newErrors.role_id = 'Please select a role';
    }

    if (!formData.statement.trim()) {
      newErrors.statement = 'Statement is required';
    } else if (formData.statement.length < 10) {
      newErrors.statement = 'Statement should be at least 10 characters';
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
      await applyForCandidacy(electionId, {
        role_id: parseInt(formData.role_id),
        statement: formData.statement
      });

      setSuccess('Your application has been submitted successfully!');
      setFormData({ role_id: '', statement: '' });

      setTimeout(() => {
        onApplicationSubmitted();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="bg-primary-50 dark:bg-primary-900/30 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
          <Award className="mr-2" />
          Apply for Candidacy
        </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingRoles ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary-500 rounded-full border-t-transparent"></div>
            </div>
          ) : roles.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                <Award className="mr-1" size={16} /> Select a role to apply for*
              </label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className={`input w-full ${errors.role_id ? 'border-red-500 focus:ring-red-500' : ''}`}
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
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg mb-4">
              No roles have been defined for this election yet.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
              <FileText className="mr-1" size={16} /> Statement*
            </label>
            <textarea
              rows={4}
              name="statement"
              value={formData.statement}
              onChange={handleChange}
              placeholder="Explain why you're running and what you hope to accomplish"
              className={`input w-full ${errors.statement ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.statement && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.statement}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateApplicationForm;
