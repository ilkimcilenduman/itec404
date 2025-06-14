import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createEvent } from '../services/eventApi';
import { getUserClubs, checkClubPresidency } from '../services/userApi';
import { XCircle, ExclamationTriangle, CheckCircle, CalendarEvent, GeoAlt, Clock, Building } from 'react-bootstrap-icons';
import Button from './ui/Button';
import Portal from './Portal';

interface Club {
  id: number;
  name: string;
}

interface CreateEventModalProps {
  show: boolean;
  onHide: () => void;
  user: any;
  onEventCreated: () => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ show, onHide, user, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    club_id: ''
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
        description: '',
        date: '',
        time: '',
        location: '',
        club_id: ''
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
      console.log('Fetching user clubs...');

      const presidencyInfo = await checkClubPresidency();
      console.log('Club presidency info:', presidencyInfo);

      const clubs = await getUserClubs();
      console.log('User clubs response:', clubs);

      const presidentClubs = clubs.filter((club: any) =>
        club.member_role === 'president' && club.member_status === 'approved'
      );

      console.log('President clubs:', presidentClubs);

      setUserClubs(presidentClubs);

      if (presidentClubs.length === 1) {
        setFormData(prev => ({ ...prev, club_id: presidentClubs[0].id.toString() }));
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
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.club_id) {
      newErrors.club_id = 'Club is required';
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
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      await createEvent({
        title: formData.title,
        description: formData.description,
        date: dateTime.toISOString(),
        location: formData.location,
        club_id: parseInt(formData.club_id)
      });

      setSuccess('Event created successfully');

      onEventCreated();

      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
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
            <CalendarEvent className="mr-2" />
            Create New Event
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
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                  <Building className="mr-1" size={16} /> Club
                </label>
                <select
                  name="club_id"
                  value={formData.club_id}
                  onChange={handleChange}
                  className={`input w-full ${errors.club_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                >
                  <option value="">Select a club</option>
                  {userClubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
                {errors.club_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.club_id}</p>
                )}
                {userClubs.length === 0 && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    You are not a president of any club. You need to be a club president to create events.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                  <CalendarEvent className="mr-1" size={16} /> Event Title
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                    <Clock className="mr-1" size={16} /> Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`input w-full ${errors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                    <Clock className="mr-1" size={16} /> Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className={`input w-full ${errors.time ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.time && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.time}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center">
                  <GeoAlt className="mr-1" size={16} /> Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`input w-full ${errors.location ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
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
                  {isSubmitting ? 'Creating...' : 'Create Event'}
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

export default CreateEventModal;
