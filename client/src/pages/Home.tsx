import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Card, { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';

const Home: React.FC = () => {
  const [featuredClubs, setFeaturedClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubsResponse = await axios.get('http://localhost:5000/api/clubs');
        setFeaturedClubs(clubsResponse.data); // Get all clubs

        const eventsResponse = await axios.get('http://localhost:5000/api/events');
        const sortedEvents = eventsResponse.data.sort((a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setUpcomingEvents(sortedEvents);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    <div className="space-y-16 pb-8">
      {/* Hero Section */}
      <motion.div
        className="relative bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="relative z-10 px-6 py-16 md:py-24 md:px-12 max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Welcome to EMU Club Management
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-8 text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Discover, join, and participate in university clubs and events. Enhance your university experience!
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link to="/clubs">
              <Button size="lg" className="px-8 py-3 text-base">
                Explore Clubs
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Featured Clubs */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Clubs</h2>
          <Link to="/clubs">
            <Button variant="outline">View All Clubs</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredClubs.slice(0, 6).map((club: any, index: number) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card hover>
                <CardHeader>
                  <CardTitle>{club.name}</CardTitle>
                  {club.category && (
                    <CardDescription className="text-sm text-neutral-500 dark:text-neutral-400">
                      {club.category}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {club.description?.substring(0, 100)}{club.description?.length > 100 ? '...' : ''}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link to={`/clubs/${club.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {featuredClubs.length > 6 && (
          <div className="text-center mt-8">
            <Link to="/clubs">
              <Button>See More Clubs</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Upcoming Events</h2>
          <Link to="/events">
            <Button variant="outline">View All Events</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.slice(0, 6).map((event: any, index: number) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card hover>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription className="text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(event.date).toLocaleDateString()} - {event.club_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {event.description?.substring(0, 100)}{event.description?.length > 100 ? '...' : ''}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link to={`/events/${event.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {upcomingEvents.length > 6 && (
          <div className="text-center mt-8">
            <Link to="/events">
              <Button>See More Events</Button>
            </Link>
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <h2 className="text-3xl font-bold mb-6">About Digital Club Management</h2>
        <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
          <p>
            The Digital Club Management Application is designed to address challenges in traditional club management by creating a centralized digital platform that simplifies club operations, improves communication, and fosters greater engagement among students.
          </p>
          <p>
            Students can register for clubs, participate in events, and connect with other members more effectively. Key features like voting for club presidents, discussion forums, and event management tools ensure that the application meets the practical and modern needs of both club leaders and members.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
