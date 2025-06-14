import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ChatLeftText, PlusCircle, ExclamationTriangle, ArrowLeft } from 'react-bootstrap-icons';
import Button from '../components/ui/Button';
import ForumPostsList from '../components/ForumPostsList';
import CreateForumPostModal from '../components/CreateForumPostModal';
import { AuthContext } from '../contexts/AuthContext';

interface ClubForumProps {
  isAuthenticated: boolean;
}

const ClubForum: React.FC<ClubForumProps> = ({ isAuthenticated }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user } = useContext(AuthContext);
  const [club, setClub] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (clubId) {
      fetchClubDetails();
      fetchForumPosts();
      if (isAuthenticated && user) {
        checkMembership();
      }
    }
  }, [clubId, isAuthenticated, user]);

  const fetchClubDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/clubs/${clubId}`);
      setClub(response.data);
    } catch (err: any) {
      console.error('Error fetching club details:', err);
      setError('Failed to load club details');
    }
  };

  const fetchForumPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/forum/club/${clubId}`);
      setPosts(response.data);
    } catch (err: any) {
      console.error('Error fetching forum posts:', err);
      setError('Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/clubs/${clubId}/membership`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Membership response:', response.data);
      if (response.data && response.data.isMember && response.data.status === 'approved') {
        setIsMember(true);
        console.log('User is a member of this club');
      } else {
        setIsMember(false);
        console.log('User is not a member of this club or membership not approved');
      }
    } catch (err) {
      console.error('Error checking membership:', err);
      setIsMember(false);
    }
  };

  const handlePostCreated = () => {
    fetchForumPosts();
  };

  const isAdmin = user?.role === 'admin';
  const canCreatePost = isAuthenticated && (isMember || isAdmin);

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <Link
            to={`/clubs/${clubId}`}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-2"
          >
            <ArrowLeft className="mr-1" />
            Back to Club
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
            <ChatLeftText className="mr-2" size={28} />
            {club?.name} Forum
          </h1>
        </div>

        {canCreatePost && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <PlusCircle className="mr-2" />
            New Post
          </Button>
        )}
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      {!canCreatePost && isAuthenticated && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg mb-4">
          You need to be a member of this club to create forum posts.
          <Link to={`/clubs/${clubId}`} className="ml-2 underline">
            Join this club
          </Link>
        </div>
      )}

      <ForumPostsList
        posts={posts}
        clubId={parseInt(clubId || '0')}
        isLoading={loading}
      />

      <CreateForumPostModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        clubId={parseInt(clubId || '0')}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default ClubForum;
