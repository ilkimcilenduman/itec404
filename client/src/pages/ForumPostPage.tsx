import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ExclamationTriangle } from 'react-bootstrap-icons';
import ForumPostDetail from '../components/ForumPostDetail';
import { AuthContext } from '../contexts/AuthContext';

interface ForumPostPageProps {
  isAuthenticated: boolean;
}

const ForumPostPage: React.FC<ForumPostPageProps> = ({ isAuthenticated }) => {
  const { clubId, postId } = useParams<{ clubId: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClubPresident, setIsClubPresident] = useState(false);

  useEffect(() => {
    if (clubId && postId) {
      fetchPostDetails();
      if (isAuthenticated && user) {
        checkClubRole();
      }
    }
  }, [clubId, postId, isAuthenticated, user]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/forum/${postId}`);
      setPost(response.data.post);
      setComments(response.data.comments);
    } catch (err: any) {
      console.error('Error fetching post details:', err);
      setError('Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const checkClubRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/clubs/${clubId}/membership`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Club role response:', response.data);
      setIsClubPresident(response.data.isMember && response.data.role === 'president' && response.data.status === 'approved');
    } catch (err) {
      console.error('Error checking club role:', err);
      setIsClubPresident(false);
    }
  };

  const handleCommentAdded = (newComment: any) => {
    setComments([...comments, newComment]);
  };

  const handleCommentDeleted = (commentId: number) => {
    setComments(comments.filter(comment => comment.comment_id !== commentId));
  };

  const handlePostDeleted = () => {
    navigate(`/clubs/${clubId}/forum`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
        <ExclamationTriangle className="mr-2" />
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Post not found</h2>
        <p className="text-neutral-600 dark:text-neutral-400">The post you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ForumPostDetail
        post={post}
        comments={comments}
        currentUserId={user?.id || 0}
        isAdmin={user?.role === 'admin'}
        isClubPresident={isClubPresident}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
        onPostDeleted={handlePostDeleted}
      />
    </motion.div>
  );
};

export default ForumPostPage;
