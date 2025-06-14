import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createAnnouncement } from '../services/announcementApi';
import axios from 'axios';
import { XCircle, ExclamationTriangle, CheckCircle, MegaphoneFill } from 'react-bootstrap-icons';
import Button from './ui/Button';
import Portal from './Portal';

interface Club {
  id: number;
  name: string;
}

interface CreateAnnouncementModalProps {
  show: boolean;
  onHide: () => void;
  user: any;
  onAnnouncementCreated: () => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  show,
  onHide,
  user,
  onAnnouncementCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    clubId: '',
    scheduledDate: '',
    isScheduled: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setFormData({
        title: '',
        content: '',
        clubId: '',
        scheduledDate: '',
        isScheduled: false
      });
      setErrors({});
      setError('');
      setSuccess('');
      fetchUserClubs();
    }
  }, [show, user]);

  const fetchUserClubs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/me/clubs', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const presidentClubs = response.data.filter((club: any) =>
        club.member_role === 'president' && club.member_status === 'approved'
      );

      setUserClubs(presidentClubs);

      if (presidentClubs.length === 1) {
        setFormData(prev => ({ ...prev, clubId: presidentClubs[0].id.toString() }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user clubs:', error);
      setLoading(false);
    }
  };

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
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.clubId) {
      newErrors.clubId = 'Club is required';
    }

    if (formData.isScheduled && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    if (formData.isScheduled && formData.scheduledDate) {
      const scheduledDateTime = new Date(formData.scheduledDate);
      const now = new Date();

      if (scheduledDateTime <= now) {
        newErrors.scheduledDate = 'Scheduled date must be in the future';
      }
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
      const announcementData = {
        title: formData.title,
        content: formData.content,
        clubId: parseInt(formData.clubId),
        scheduledDate: formData.isScheduled ? formData.scheduledDate : undefined
      };

      const response = await createAnnouncement(announcementData);

      setSuccess(response.message);

      onAnnouncementCreated();

      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      setError(err.response?.data?.message || 'Failed to create announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
        <motion.div
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-md overflow-hidden my-20"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', damping: 20 }}
        >
        {/* Header */}
        <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
            <MegaphoneFill className="mr-2" />
            Create Announcement
          </h3>
          <button
            onClick={onHide}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
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

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Club
                </label>
                <select
                  name="clubId"
                  value={formData.clubId}
                  onChange={handleChange}
                  className={`input w-full ${errors.clubId ? 'border-red-500 focus:ring-red-500' : ''}`}
                >
                  <option value="">Select a club</option>
                  {userClubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
                {errors.clubId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clubId}</p>
                )}
                {userClubs.length === 0 && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    You are not a president of any club. You need to be a club president to create announcements.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`input w-full ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Content
                </label>
                <textarea
                  rows={5}
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className={`input w-full ${errors.content ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="isScheduled"
                    checked={formData.isScheduled}
                    onChange={(e) => setFormData(prev => ({ ...prev, isScheduled: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label htmlFor="isScheduled" className="ml-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Schedule for later
                  </label>
                </div>

                {formData.isScheduled && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Scheduled Date and Time
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      className={`input w-full ${errors.scheduledDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.scheduledDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scheduledDate}</p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      The announcement will be automatically published at the scheduled time.
                    </p>
                  </div>
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
                  disabled={isSubmitting || userClubs.length === 0}
                >
                  {isSubmitting ? 'Sending...' :
                   formData.isScheduled ? 'Schedule Announcement' : 'Send Announcement'}
                </Button>
              </div>
            </form>
          )}
        </div>
        </motion.div>
      </div>
    </Portal>
  );
};

export default CreateAnnouncementModal;
