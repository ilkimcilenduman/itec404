import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XCircle, ExclamationTriangle, CheckCircle, ChatLeftText } from 'react-bootstrap-icons';
import Button from './ui/Button';
import Portal from './Portal';
import axios from 'axios';

interface CreateForumPostModalProps {
  show: boolean;
  onHide: () => void;
  clubId: number;
  onPostCreated: () => void;
}

const CreateForumPostModal: React.FC<CreateForumPostModalProps> = ({
  show,
  onHide,
  clubId,
  onPostCreated
}) => {
  const [formData, setFormData] = useState({
    forum_title: '',
    forum_content: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setFormData({
        forum_title: '',
        forum_content: ''
      });
      setErrors({});
      setError('');
      setSuccess('');
    }
  }, [show]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

    if (!formData.forum_title.trim()) {
      newErrors.forum_title = 'Title is required';
    }

    if (!formData.forum_content.trim()) {
      newErrors.forum_content = 'Content is required';
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
      const response = await axios.post(
        'http://localhost:5000/api/forum',
        {
          club_id: clubId,
          forum_title: formData.forum_title,
          forum_content: formData.forum_content
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(response.data.message || 'Forum post created successfully');
      onPostCreated();

      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating forum post:', err);
      setError(err.response?.data?.message || 'Failed to create forum post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] p-4">
        <motion.div
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-2xl overflow-hidden"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
              <ChatLeftText className="mr-2" size={18} />
              Create New Forum Post
            </h3>
            <button
              onClick={onHide}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <XCircle size={20} />
            </button>
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
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="forum_title"
                  value={formData.forum_title}
                  onChange={handleChange}
                  className={`input w-full ${errors.forum_title ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter a title for your post"
                />
                {errors.forum_title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.forum_title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Content
                </label>
                <textarea
                  rows={8}
                  name="forum_content"
                  value={formData.forum_content}
                  onChange={handleChange}
                  className={`input w-full ${errors.forum_content ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Write your post content here..."
                />
                {errors.forum_content && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.forum_content}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onHide}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Post'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
};

export default CreateForumPostModal;
