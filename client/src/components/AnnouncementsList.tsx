import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { TrashFill, Building, Person, Clock, MegaphoneFill } from 'react-bootstrap-icons';
import Button from './ui/Button';

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  sender_name: string;
  club_name: string;
}

interface AnnouncementsListProps {
  announcements: Announcement[];
  emptyMessage?: string;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
}

const AnnouncementsList: React.FC<AnnouncementsListProps> = ({
  announcements,
  emptyMessage = 'No announcements available',
  canDelete = false,
  onDelete
}) => {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <svg
          className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 9l-7 7-7-7"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 3v14"
          />
        </svg>
        <span className="text-neutral-600 dark:text-neutral-400 text-lg">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {announcements.map((announcement, index) => (
        <motion.div
          key={announcement.id}
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <div className="bg-primary-50/50 dark:bg-primary-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{announcement.title}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                  <Building className="mr-1" size={14} />
                  {announcement.club_name}
                </span>
                <span className="flex items-center bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  <Person className="mr-1" size={14} />
                  {announcement.sender_name}
                </span>
                <span className="flex items-center bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  <Clock className="mr-1" size={14} />
                  {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            {canDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(announcement.id)}
                title="Delete announcement"
                className="border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center self-end md:self-auto"
              >
                <TrashFill size={14} className="mr-1" />
                Delete
              </Button>
            )}
          </div>
          <div className="p-6">
            <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
              {announcement.content}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AnnouncementsList;
