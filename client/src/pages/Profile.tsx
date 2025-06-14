import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { ExclamationTriangle, CheckCircle, Person, Envelope, CardText, Award } from 'react-bootstrap-icons';

const Profile: React.FC = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/me',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      await refreshUser();

      setSuccess('Profile updated successfully');
      setLoading(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Profile</h1>

      <motion.div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-primary-50 dark:bg-primary-900/30 p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Edit Profile</h2>
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
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Person className="text-neutral-500 dark:text-neutral-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Envelope className="text-neutral-500 dark:text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="student_id">
                Student ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CardText className="text-neutral-500 dark:text-neutral-400" />
                </div>
                <input
                  id="student_id"
                  type="text"
                  value={user?.student_id || ''}
                  disabled
                  className="input pl-10 w-full bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                Student ID cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="role">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Award className="text-neutral-500 dark:text-neutral-400" />
                </div>
                <input
                  id="role"
                  type="text"
                  value={user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : ''}
                  disabled
                  className="input pl-10 w-full bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                Role cannot be changed
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-primary-50 dark:bg-primary-900/30 p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Change Password</h2>
        </div>

        <div className="p-6">
          <p className="text-neutral-600 dark:text-neutral-400">
            Password change functionality will be implemented in a future update.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
