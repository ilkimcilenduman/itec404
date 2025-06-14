import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import './EventCalendar.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, GeoAlt, Calendar2, Clock, InfoCircle } from 'react-bootstrap-icons';
import Button from './ui/Button';

import { format } from 'date-fns';

interface EventCalendarProps {}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  club_name?: string;
  location?: string;
  description?: string;
  status?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: any;
}

const EventCalendar: React.FC<EventCalendarProps> = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/events');

      const calendarEvents = response.data.map((event: any) => {
        let backgroundColor = '#3174ad';
        if (event.club_name) {
          const hash = event.club_name.split('').reduce((acc: number, char: string) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
          }, 0);
          backgroundColor = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
        }

        const opacity = event.status === 'cancelled' ? 0.5 : 0.8;
        const rgbaColor = backgroundColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba');

        return {
          id: String(event.id),
          title: event.title,
          start: new Date(event.date),
          end: new Date(new Date(event.date).getTime() + (event.duration || 2) * 60 * 60 * 1000),
          backgroundColor: rgbaColor,
          borderColor: backgroundColor,
          textColor: 'white',
          extendedProps: {
            club_name: event.club_name,
            location: event.location,
            description: event.description,
            status: event.status
          }
        };
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);



  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventClick = useCallback((info: any) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      club_name: event.extendedProps.club_name,
      location: event.extendedProps.location,
      description: event.extendedProps.description,
      status: event.extendedProps.status
    });
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedEvent(null);
    setError('');
    setSuccess('');
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedEvent) {
      navigate(`/events/${selectedEvent.id}`);
    }
  }, [selectedEvent, navigate]);



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="event-calendar bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <InfoCircle className="mr-2" />
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
            <InfoCircle className="mr-2" />
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

      <div className="mb-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          events={events}
          eventClick={handleEventClick}
          height="600px"
          locale="en" 
          firstDay={1} 
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List'
          }}
        />
      </div>

      {/* Event Details Modal - Custom Implementation */}
      <AnimatePresence>
        {showModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-md overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {/* Header */}
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{selectedEvent.title}</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-start">
                  <Calendar2 className="text-primary-500 dark:text-primary-400 mt-1 mr-3" size={18} />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">Date</div>
                    <div className="text-neutral-600 dark:text-neutral-400">
                      {format(selectedEvent.start, 'PPPP')}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="text-primary-500 dark:text-primary-400 mt-1 mr-3" size={18} />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">Time</div>
                    <div className="text-neutral-600 dark:text-neutral-400">
                      {format(selectedEvent.start, 'p')} - {format(selectedEvent.end, 'p')}
                    </div>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-start">
                    <GeoAlt className="text-primary-500 dark:text-primary-400 mt-1 mr-3" size={18} />
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">Location</div>
                      <div className="text-neutral-600 dark:text-neutral-400">{selectedEvent.location}</div>
                    </div>
                  </div>
                )}

                {selectedEvent.club_name && (
                  <div className="flex items-start">
                    <InfoCircle className="text-primary-500 dark:text-primary-400 mt-1 mr-3" size={18} />
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">Club</div>
                      <div>
                        <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-300">
                          {selectedEvent.club_name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.status && selectedEvent.status !== 'active' && (
                  <div className="flex items-start">
                    <InfoCircle className="text-primary-500 dark:text-primary-400 mt-1 mr-3" size={18} />
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">Status</div>
                      <div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedEvent.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'}`}>
                          {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Description</div>
                    <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700 flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseModal}>Close</Button>
                <Button onClick={handleViewDetails}>View Details</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventCalendar;