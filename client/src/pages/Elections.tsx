import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllElections, getClubElections } from '../services/electionApi';
import { Award, Calendar2, Clock, Filter, ExclamationTriangle, Building } from 'react-bootstrap-icons';
import Button from '../components/ui/Button';

interface Election {
  id: number;
  club_id: number;
  club_name: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

const Elections: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [filteredElections, setFilteredElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // Default to active elections

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        const data = await getAllElections();
        setElections(data);
        setFilteredElections(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load elections');
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  useEffect(() => {
    let filtered = [...elections];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(election => election.status === statusFilter);
    }

    setFilteredElections(filtered);
  }, [statusFilter, elections]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">Upcoming</span>;
      case 'active':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Active</span>;
      case 'completed':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300">Completed</span>;
      default:
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300">Unknown</span>;
    }
  };

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
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
            <Award className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Club Elections</h1>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      <motion.div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-primary-50/50 dark:bg-primary-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === 'all' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              All Elections
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === 'active' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Active Elections
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === 'upcoming' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Upcoming Elections
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 text-sm font-medium ${statusFilter === 'completed' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Completed Elections
            </button>
          </div>
        </div>
      </motion.div>

      {filteredElections.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredElections.map((election, index) => (
            <motion.div
              key={election.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{election.title}</h3>
                    {getStatusBadge(election.status)}
                  </div>
                  <p className="text-primary-600 dark:text-primary-400 flex items-center text-sm">
                    <Building className="mr-1" size={14} />
                    {election.club_name}
                  </p>
                </div>

                <div className="p-4 flex-grow">
                  <div className="flex flex-col space-y-2 mb-3">
                    <div className="flex items-center text-neutral-600 dark:text-neutral-400 text-sm">
                      <Calendar2 className="mr-2" size={14} />
                      <span className="font-medium">Start:</span>&nbsp;{new Date(election.start_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-neutral-600 dark:text-neutral-400 text-sm">
                      <Clock className="mr-2" size={14} />
                      <span className="font-medium">End:</span>&nbsp;{new Date(election.end_date).toLocaleDateString()}
                    </div>
                  </div>

                  {election.description && (
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      {election.description.substring(0, 100)}
                      {election.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>

                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 mt-auto">
                  <Link to={`/elections/${election.id}`} className="block w-full">
                    <Button className={`w-full ${election.status === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                      {election.status === 'active' ? 'Vote Now' : 'View Details'}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-6 rounded-lg text-center">
          {statusFilter === 'all'
            ? 'No elections found.'
            : `No ${statusFilter} elections found.`}
        </div>
      )}
    </div>
  );
};

export default Elections;
