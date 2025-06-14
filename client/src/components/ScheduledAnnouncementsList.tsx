import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Building, Person, Calendar, Clock, MegaphoneFill, SendFill, Trash } from 'react-bootstrap-icons';
import Button from './ui/Button';

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  scheduled_date: string;
  sender_name: string;
  club_name: string;
}

interface ScheduledAnnouncementsListProps {
  announcements: Announcement[];
  onPublishNow: (id: number) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

const ScheduledAnnouncementsList: React.FC<ScheduledAnnouncementsListProps> = ({
  announcements,
  onPublishNow,
  onDelete,
  isLoading
}) => {
  const [processingId, setProcessingId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MegaphoneFill className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
        <span className="text-neutral-600 dark:text-neutral-400 text-lg">No scheduled announcements</span>
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
          <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col md:flex-row justify-between md:items-center gap-3">
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
                <span className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  <Calendar className="mr-1" size={14} />
                  Scheduled: {format(new Date(announcement.scheduled_date), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  <Clock className="mr-1" size={14} />
                  {format(new Date(announcement.scheduled_date), 'h:mm a')}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProcessingId(announcement.id);
                  onPublishNow(announcement.id);
                }}
                disabled={processingId === announcement.id}
                className="border-primary-500 text-primary-500 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20 flex items-center"
              >
                {processingId === announcement.id ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary-500 dark:border-primary-400 rounded-full border-t-transparent mr-1"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <SendFill size={14} className="mr-1" />
                    Publish Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(announcement.id)}
                disabled={processingId === announcement.id}
                className="border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center"
              >
                <Trash size={14} className="mr-1" />
                Delete
              </Button>
            </div>
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

export default ScheduledAnnouncementsList;
