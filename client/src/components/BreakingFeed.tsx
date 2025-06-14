import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'react-bootstrap-icons';
import Button from './ui/Button';

interface Notification {
  id: number;
  title: string;
  content: string;
  created_at: string;
  sender_name: string;
  club_name: string;
}

type FeedEvent = {
  type: 'add';
  notification: Notification;
};

class BreakingFeedManager {
  private listeners: ((event: FeedEvent) => void)[] = [];

  addListener(listener: (event: FeedEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  dispatch(event: FeedEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  addFeed(notification: Notification) {
    this.dispatch({ type: 'add', notification });
  }
}

export const feedManager = new BreakingFeedManager();

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);

  if (diffSec < 60) {
    return `${diffSec} seconds ago`;
  } else if (diffMin < 60) {
    return `${diffMin} minutes ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hours ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const BreakingFeed: React.FC = () => {
  const [currentFeed, setCurrentFeed] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [feedQueue, setFeedQueue] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = feedManager.addListener(event => {
      if (event.type === 'add') {
        setFeedQueue(prev => [...prev, event.notification]);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (feedQueue.length > 0 && !isVisible) {
      const nextFeed = feedQueue[0];
      setCurrentFeed(nextFeed);
      setIsVisible(true);

      setFeedQueue(prev => prev.slice(1));

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [feedQueue, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!currentFeed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && currentFeed && (
        <motion.div
          className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[450px] z-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="bg-primary-50 dark:bg-primary-900/30 p-3 flex justify-between items-center">
              <div className="flex items-center">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded mr-2 uppercase">Breaking</span>
                <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 m-0">{currentFeed.title}</h4>
              </div>
              <button
                onClick={handleClose}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">{currentFeed.content}</p>

              <div className="flex justify-between items-center">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  From: {currentFeed.club_name} • By: {currentFeed.sender_name}
                  <div className="mt-1">{formatTimeAgo(new Date(currentFeed.created_at))}</div>
                </div>

                <Link to="/announcements" onClick={handleClose}>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BreakingFeed;
