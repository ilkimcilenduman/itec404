import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getUserAnnouncements, deleteAnnouncement, getScheduledAnnouncements, publishAnnouncementNow } from '../services/announcementApi';
import AnnouncementsList from '../components/AnnouncementsList';
import ScheduledAnnouncementsList from '../components/ScheduledAnnouncementsList';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import Button from '../components/ui/Button';
import { PlusCircle, XCircle, ExclamationTriangle, CheckCircle, MegaphoneFill, Calendar, Clock } from 'react-bootstrap-icons';
import Portal from '../components/Portal';

interface AnnouncementsProps {
  isAuthenticated: boolean;
  user: any;
}

const Announcements: React.FC<AnnouncementsProps> = ({ isAuthenticated, user }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [scheduledAnnouncements, setScheduledAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'published' | 'scheduled'>('published');
  const [userClubs, setUserClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnnouncements();

      const isPresident = user?.role === 'club_president';

      if (isPresident) {
        const fetchUserClubs = async () => {
          try {
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

            if (presidentClubs.length > 0) {
              setSelectedClub(presidentClubs[0].id);
              fetchScheduledAnnouncements(presidentClubs[0].id);
            }
          } catch (error) {
            console.error('Error fetching user clubs:', error);
          }
        };

        fetchUserClubs();
      }
    }
  }, [isAuthenticated, user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError(err.response?.data?.message || 'Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledAnnouncements = async (clubId: number) => {
    if (!clubId) return;

    try {
      setScheduledLoading(true);
      const data = await getScheduledAnnouncements(clubId);
      setScheduledAnnouncements(data);
    } catch (err: any) {
      console.error('Error fetching scheduled announcements:', err);
    } finally {
      setScheduledLoading(false);
    }
  };

  const handleClubChange = (clubId: number) => {
    setSelectedClub(clubId);
    fetchScheduledAnnouncements(clubId);
  };

  const handlePublishNow = async (id: number) => {
    try {
      setPublishingId(id);
      setError('');
      setSuccess('');

      const response = await publishAnnouncementNow(id);

      setScheduledAnnouncements(prev => prev.filter(a => a.id !== id));

      fetchAnnouncements();

      setSuccess(response.message || 'Announcement published successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error publishing announcement:', err);
      setError(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setPublishingId(null);
    }
  };

  const handleAnnouncementCreated = () => {
    fetchAnnouncements();
    setSuccess('Announcement created successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteClick = (id: number) => {
    setAnnouncementToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    try {
      setDeleteLoading(true);
      setError('');
      await deleteAnnouncement(announcementToDelete);

      setAnnouncements(prev => prev.filter(a => a.id !== announcementToDelete));

      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
      setSuccess('Announcement deleted successfully');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      setError(err.response?.data?.message || 'Failed to delete announcement. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAnnouncementToDelete(null);
  };

  const isClubPresident = user?.role === 'club_president';

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
            <MegaphoneFill className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Announcements</h1>
        </div>
        {isAuthenticated && isClubPresident && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <PlusCircle className="mr-2" />
            Create Announcement
          </Button>
        )}
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <ExclamationTriangle className="mr-2" />
            {error}
          </div>
          <button
            type="button"
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            aria-label="Close"
            onClick={() => setError('')}
          >
            <XCircle size={20} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle className="mr-2" />
            {success}
          </div>
          <button
            type="button"
            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            aria-label="Close"
            onClick={() => setSuccess('')}
          >
            <XCircle size={20} />
          </button>
        </div>
      )}

      {isClubPresident && userClubs.length > 0 && (
        <div className="mb-6">
          <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-4">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'published'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'}`}
              onClick={() => setActiveTab('published')}
            >
              Published Announcements
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'scheduled'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'}`}
              onClick={() => setActiveTab('scheduled')}
            >
              Scheduled Announcements
            </button>
          </div>

          {activeTab === 'scheduled' && (
            <div className="mb-4">
              <div className="flex items-center mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mr-2">
                  Select Club:
                </label>
                <select
                  value={selectedClub || ''}
                  onChange={(e) => handleClubChange(Number(e.target.value))}
                  className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 text-sm"
                >
                  {userClubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'published' ? (
        <motion.div
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="bg-primary-50/50 dark:bg-primary-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
            <MegaphoneFill className="text-primary-600 dark:text-primary-400 mr-2" size={18} />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Your Announcements</h2>
          </div>

          {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <AnnouncementsList
              announcements={announcements}
              emptyMessage={
                isAuthenticated
                  ? "You don't have any announcements yet. Join clubs to receive their announcements."
                  : "Please log in to view announcements."
              }
              canDelete={isAuthenticated && (user?.role === 'admin' || user?.role === 'club_president')}
              onDelete={handleDeleteClick}
            />
          </div>
        )}
      </motion.div>) : (
        <motion.div
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
            <Calendar className="text-yellow-600 dark:text-yellow-400 mr-2" size={18} />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Scheduled Announcements</h2>
          </div>

          <div className="p-6">
            <ScheduledAnnouncementsList
              announcements={scheduledAnnouncements}
              onPublishNow={handlePublishNow}
              onDelete={handleDeleteClick}
              isLoading={scheduledLoading}
            />
          </div>
        </motion.div>
      )}

      {isAuthenticated && (
        <motion.div
          className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4 mt-1">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">About Announcements</h2>
              <p className="text-neutral-700 dark:text-neutral-300 mb-6 leading-relaxed">
                Announcements are messages sent by club presidents to all members of their club.
                {isClubPresident
                  ? " As a club president, you can create announcements for your club members."
                  : " Join clubs to receive their announcements."}
              </p>
              {isClubPresident && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center"
                >
                  <PlusCircle className="mr-2" />
                  Create New Announcement
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Announcement Modal */}
      <CreateAnnouncementModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        user={user}
        onAnnouncementCreated={handleAnnouncementCreated}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <Portal>
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
              <motion.div
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-md overflow-hidden my-20"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: 'spring', damping: 20 }}
              >
              <div className="bg-red-50 dark:bg-red-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Confirm Deletion</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                  Are you sure you want to delete this announcement? This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleDeleteCancel}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Announcements;
