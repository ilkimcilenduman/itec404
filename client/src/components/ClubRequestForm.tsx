import React, { useState } from 'react';
import { createClubRequest } from '../services/clubRequestApi';
import { ExclamationTriangle, CheckCircle, Building, Tag, FileText } from 'react-bootstrap-icons';
import Button from './ui/Button';

interface ClubRequestFormProps {
  onRequestSubmitted?: () => void;
  onCancel?: () => void;
}

const ClubRequestForm: React.FC<ClubRequestFormProps> = ({ onRequestSubmitted, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      if (!formData.name.trim()) {
        setError('Club name is required');
        setLoading(false);
        return;
      }

      await createClubRequest(formData);
      setSuccess('Your club request has been submitted successfully and is pending approval.');
      setFormData({
        name: '',
        description: '',
        category: ''
      });

      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit club request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
        <Building className="mr-2" />
        Request a New Club
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
            <Building className="mr-1" size={16} /> Club Name*
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter club name"
            required
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
            <Tag className="mr-1" size={16} /> Category
          </label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., Sports, Academic, Cultural"
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
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the purpose and activities of your club"
            className="input w-full"
          />
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
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClubRequestForm;
