import React, { useState, useEffect, useRef } from 'react';
import { BellFill, X } from 'react-bootstrap-icons';
import { formatDistanceToNow } from 'date-fns';
import { getUserAnnouncements } from '../services/announcementApi';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: number;
  title: string;
  content: string;
  created_at: string;
  sender_name: string;
  club_name: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  isAuthenticated: boolean;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isAuthenticated }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [show, setShow] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [lastCheckTime, setLastCheckTime] = useState<Date>(() => {
    const stored = localStorage.getItem('lastNotificationCheck');
    return stored ? new Date(stored) : new Date();
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (show) {
        fetchNotifications();
      }

      if (!show) {
        const now = new Date();
        localStorage.setItem('lastNotificationCheck', now.toISOString());
        setLastCheckTime(now);
      }
    }
  }, [isAuthenticated, show]);

  useEffect(() => {
    if (!isAuthenticated) return;

    checkUnreadCount();

    const intervalId = setInterval(() => {
      checkUnreadCount();
    }, 10000); 

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    if (notifications.length > 0) {
      const count = notifications.filter(notification => !notification.read).length;
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);

  const checkUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/announcements/me/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      } else {
        console.log(`Unread count endpoint returned status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error checking unread count:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError('');
      const announcements = await getUserAnnouncements();

      const storedReadStatus = localStorage.getItem('readNotifications');
      const readNotifications = storedReadStatus ? JSON.parse(storedReadStatus) : {};

      const notificationsWithReadStatus = announcements.map((announcement: any) => ({
        ...announcement,
        read: readNotifications[announcement.id] || false
      }));

      setNotifications(notificationsWithReadStatus);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (isOpen: boolean) => {
    setShow(isOpen);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    const storedReadStatus = localStorage.getItem('readNotifications');
    const readNotifications = storedReadStatus ? JSON.parse(storedReadStatus) : {};
    readNotifications[id] = true;
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));

    checkUnreadCount();
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    const readNotifications = notifications.reduce((acc, notification) => {
      acc[notification.id] = true;
      return acc;
    }, {} as Record<number, boolean>);

    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));

    setUnreadCount(0);

    const now = new Date();
    localStorage.setItem('lastNotificationCheck', now.toISOString());
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShow(!show)}
        className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200 relative"
        aria-label="Notifications"
      >
        <BellFill size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-h-[500px] overflow-y-auto bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 z-50"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h6 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 m-0">Notifications</h6>
              {notifications.length > 0 && (
                <button
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShow(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-1">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-8">
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200 ${notification.read ? '' : 'bg-primary-50 dark:bg-primary-900/20'}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{notification.title}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 ml-2 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2 mb-1">
                        {notification.content}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                        <span>From: {notification.club_name} • By: {notification.sender_name}</span>
                        {!notification.read && (
                          <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-300">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 p-3 text-center">
              <Link
                to="/announcements"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                onClick={() => setShow(false)}
              >
                View all announcements
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
