import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { XCircle, ExclamationTriangle, CheckCircle, Building, Tag, FileText } from 'react-bootstrap-icons';
import Button from './ui/Button';
import Portal from './Portal';

interface EditClubModalProps {
  show: boolean;
  onHide: () => void;
  club: {
    id: number;
    name: string;
    description: string;
    category: string;
  };
  onClubUpdated: (updatedClub: any) => void;
}

const EditClubModal: React.FC<EditClubModalProps> = ({ show, onHide, club, onClubUpdated }) => {
  const [formData, setFormData] = useState({
    name: club.name,
    description: club.description,
    category: club.category
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (show) {
      setFormData({
        name: club.name,
        description: club.description,
        category: club.category
      });
      setErrors({});
      setError('');
      setSuccess('');
    }
  }, [show, club]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Club name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/clubs/${club.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess('Club details updated successfully');

      onClubUpdated({
        ...club,
        ...formData
      });

      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating club:', err);
      setError(err.response?.data?.message || 'Failed to update club details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
        <motion.div
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-lg overflow-hidden my-20"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Header */}
          <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
              <Building className="mr-2" />
              Edit Club Details
            </h3>
            <button
              onClick={onHide}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <XCircle size={20} />
            </button>
          </div>

          {/* Body */}
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
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                  <Building className="mr-1" size={16} /> Club Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input w-full ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
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
                  className={`input w-full ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
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
                  className={`input w-full ${errors.category ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onHide}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
};

export default EditClubModal;
