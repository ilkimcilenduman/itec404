import React from 'react';
import { Link } from 'react-router-dom';
import EventCalendar from '../components/EventCalendar';
import Button from '../components/ui/Button';
import { Calendar2, ListUl } from 'react-bootstrap-icons';

interface CalendarViewProps {
  isAuthenticated: boolean;
  user: any;
}

const CalendarView: React.FC<CalendarViewProps> = ({ isAuthenticated, user }) => {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Event Calendar</h1>
        <Link to="/events">
          <Button variant="outline" className="flex items-center">
            <ListUl className="mr-2" />
            List View
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
          <p className="text-neutral-600 dark:text-neutral-400">
            This calendar shows all events in the club management system.
          </p>
          <div className="text-sm text-neutral-500 dark:text-neutral-500 flex items-center">
            <Calendar2 className="mr-1" />
            Tip: Click on an event to see its details.
          </div>
        </div>
        <EventCalendar />
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Upcoming Events</h2>
        <p className="text-neutral-700 dark:text-neutral-300 mb-4">
          View and manage all club events in one place. You can:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-neutral-700 dark:text-neutral-300 mb-6">
          <li>See all events in calendar view</li>
          <li>Click on an event to see details</li>
          <li>Register for events you are interested in</li>
        </ul>

        {isAuthenticated && user?.role === 'club_president' && (
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Club President Tools</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">As a club president, you can create and manage events for your club.</p>
            <Link to="/dashboard">
              <Button>
                Go to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;