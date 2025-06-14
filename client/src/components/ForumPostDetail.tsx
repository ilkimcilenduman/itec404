import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { Person, ChatLeftText, ArrowLeft, Send, Trash } from 'react-bootstrap-icons';
import Button from './ui/Button';
import axios from 'axios';

interface ForumPost {
  post_id: number;
  club_id: number;
  user_id: number;
  forum_title: string;
  forum_content: string;
  forum_timestamp: string;
  author_name: string;
  profile_image_url?: string;
}

interface ForumComment {
  comment_id: number;
  post_id: number;
  user_id: number;
  comment_content: string;
  comment_timestamp: string;
  author_name: string;
  profile_image_url?: string;
}

interface ForumPostDetailProps {
  post: ForumPost;
  comments: ForumComment[];
  currentUserId: number;
  isAdmin: boolean;
  isClubPresident: boolean;
  onCommentAdded: (comment: ForumComment) => void;
  onCommentDeleted: (commentId: number) => void;
  onPostDeleted: () => void;
}

const ForumPostDetail: React.FC<ForumPostDetailProps> = ({
  post,
  comments,
  currentUserId,
  isAdmin,
  isClubPresident,
  onCommentAdded,
  onCommentDeleted,
  onPostDeleted
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/forum/${post.post_id}/comments`,
        { comment_content: newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      onCommentAdded(response.data.comment);
      setNewComment('');
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.message || 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setDeletingCommentId(commentId);
      
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/forum/${post.post_id}/comments/${commentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        onCommentDeleted(commentId);
      } catch (err: any) {
        console.error('Error deleting comment:', err);
        alert(err.response?.data?.message || 'Failed to delete comment');
      } finally {
        setDeletingCommentId(null);
      }
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setIsDeletingPost(true);
      
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/forum/${post.post_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        onPostDeleted();
      } catch (err: any) {
        console.error('Error deleting post:', err);
        alert(err.response?.data?.message || 'Failed to delete post');
        setIsDeletingPost(false);
      }
    }
  };

  const canDeletePost = isAdmin || isClubPresident || post.user_id === currentUserId;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <Link
          to={`/clubs/${post.club_id}/forum`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
        >
          <ArrowLeft className="mr-1" />
          Back to Forum
        </Link>
        
        {canDeletePost && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeletePost}
            disabled={isDeletingPost}
            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
          >
            <Trash className="mr-1" size={14} />
            {isDeletingPost ? 'Deleting...' : 'Delete Post'}
          </Button>
        )}
      </div>
      
      <motion.div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 mr-3">
              {post.profile_image_url ? (
                <img
                  src={post.profile_image_url}
                  alt={post.author_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Person className="text-primary-600 dark:text-primary-400" size={20} />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {post.forum_title}
              </h1>
              <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                <span className="font-medium">{post.author_name}</span>
                <span className="mx-2">•</span>
                <span title={format(new Date(post.forum_timestamp), 'PPpp')}>
                  {formatDistanceToNow(new Date(post.forum_timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed mt-6">
            {post.forum_content}
          </div>
        </div>
      </motion.div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <ChatLeftText className="mr-2" size={18} />
          Comments ({comments.length})
        </h2>
        
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="input w-full"
                rows={3}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="mt-1"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
              ) : (
                <>
                  <Send className="mr-1" size={14} />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
        
        {comments.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.comment_id}
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {comment.profile_image_url ? (
                      <img
                        src={comment.profile_image_url}
                        alt={comment.author_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Person className="text-primary-600 dark:text-primary-400" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {comment.author_name}
                        </span>
                        <span className="mx-2 text-xs text-neutral-500 dark:text-neutral-400">•</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400" title={format(new Date(comment.comment_timestamp), 'PPpp')}>
                          {formatDistanceToNow(new Date(comment.comment_timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {(isAdmin || isClubPresident || comment.user_id === currentUserId) && (
                        <button
                          onClick={() => handleDeleteComment(comment.comment_id)}
                          disabled={deletingCommentId === comment.comment_id}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete comment"
                        >
                          {deletingCommentId === comment.comment_id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-500 rounded-full border-t-transparent"></div>
                          ) : (
                            <Trash size={14} />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="text-neutral-700 dark:text-neutral-300 mt-1 whitespace-pre-line">
                      {comment.comment_content}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPostDetail;
