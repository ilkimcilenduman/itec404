import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar2, GeoAlt, Clock, Building } from 'react-bootstrap-icons';
import Card, { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  club_name: string;
  club_id: number;
}

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [clubs, setClubs] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsResponse = await axios.get('http://localhost:5000/api/events');
        setEvents(eventsResponse.data);
        setFilteredEvents(eventsResponse.data);

        const clubsResponse = await axios.get('http://localhost:5000/api/clubs');
        setClubs(clubsResponse.data.map((club: any) => ({
          id: club.id,
          name: club.name
        })));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = events;

    if (searchTerm) {
      result = result.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClub) {
      result = result.filter(event => event.club_id.toString() === selectedClub);
    }

    setFilteredEvents(result);
  }, [searchTerm, selectedClub, events]);

  const sortedEvents = [...filteredEvents].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Upcoming Events</h1>
        <Link to="/calendar-view">
          <Button variant="outline" className="flex items-center">
            <Calendar2 className="mr-2" />
            Calendar View
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-neutral-500 dark:text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="text-neutral-500 dark:text-neutral-400" />
            </div>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="input pl-10 w-full appearance-none"
            >
              <option value="">All Clubs</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Event List */}
      {sortedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card hover>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription className="space-y-1">
                    <span className="flex items-center text-neutral-500 dark:text-neutral-400">
                      <Clock className="mr-2" size={14} />
                      {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center text-neutral-500 dark:text-neutral-400">
                      <GeoAlt className="mr-2" size={14} />
                      {event.location}
                    </span>
                    <span className="flex items-center text-primary-600 dark:text-primary-400">
                      <Building className="mr-2" size={14} />
                      {event.club_name}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {event.description?.substring(0, 100)}
                    {event.description?.length > 100 ? '...' : ''}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link to={`/events/${event.id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">No events found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default EventList;
