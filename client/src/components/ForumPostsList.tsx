import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ChatLeftText, Person } from 'react-bootstrap-icons';

interface ForumPost {
  post_id: number;
  forum_title: string;
  forum_content: string;
  forum_timestamp: string;
  author_name: string;
  profile_image_url?: string;
  comment_count: number;
}

interface ForumPostsListProps {
  posts: ForumPost[];
  clubId: number;
  isLoading: boolean;
}

const ForumPostsList: React.FC<ForumPostsListProps> = ({ posts, clubId, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <ChatLeftText className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
        <span className="text-neutral-600 dark:text-neutral-400 text-lg">No forum posts yet</span>
        <p className="text-neutral-500 dark:text-neutral-500 mt-2 max-w-md">
          Be the first to start a discussion in this club's forum!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <motion.div
          key={post.post_id}
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Link to={`/clubs/${clubId}/forum/${post.post_id}`} className="block p-6">
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
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                  {post.forum_title}
                </h3>
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                  <span>{post.author_name}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDistanceToNow(new Date(post.forum_timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 line-clamp-2 mb-3">
              {post.forum_content}
            </p>
            <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
              <ChatLeftText className="mr-1" size={14} />
              <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default ForumPostsList;
