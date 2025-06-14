import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllElections } from '../services/electionApi';
import { Award, Calendar2, Clock, Building, ExclamationTriangle } from 'react-bootstrap-icons';
import Button from './ui/Button';

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

interface ActiveElectionsListProps {
  userId?: number;
  clubId?: number;
  limit?: number;
  showTitle?: boolean;
}

const ActiveElectionsList: React.FC<ActiveElectionsListProps> = ({
  userId,
  clubId,
  limit = 3,
  showTitle = true
}) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        const data = await getAllElections();

        let filteredElections = data.filter((election: Election) =>
          election.status === 'active'
        );

        if (clubId) {
          filteredElections = filteredElections.filter((election: Election) =>
            election.club_id === clubId
          );
        }

        if (limit > 0) {
          filteredElections = filteredElections.slice(0, limit);
        }

        setElections(filteredElections);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load elections');
        setLoading(false);
      }
    };

    fetchElections();
  }, [clubId, limit]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
        <ExclamationTriangle className="mr-2 inline-block" />
        {error}
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg text-center">
        No active elections at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center mb-4">
          <Award className="text-primary-600 dark:text-primary-400 mr-2" size={20} />
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Active Elections</h3>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {elections.map((election, index) => (
          <motion.div
            key={election.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{election.title}</h3>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    Active
                  </span>
                </div>
                <p className="text-primary-600 dark:text-primary-400 flex items-center text-sm mt-1">
                  <Building className="mr-1" size={14} />
                  {election.club_name}
                </p>
              </div>

              <div className="p-4">
                <div className="flex flex-col space-y-2 mb-3">
                  <div className="flex items-center text-neutral-600 dark:text-neutral-400 text-sm">
                    <Calendar2 className="mr-2" size={14} />
                    <span className="font-medium">Ends:</span>&nbsp;
                    {new Date(election.end_date).toLocaleDateString()}
                  </div>
                </div>

                {election.description && (
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4 line-clamp-2">
                    {election.description}
                  </p>
                )}

                <Link to={`/elections/${election.id}`} className="block w-full">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center">
                    <Award className="mr-2" size={16} />
                    Vote Now
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {elections.length > 0 && (
        <div className="text-center mt-4">
          <Link to="/elections" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            View All Elections
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActiveElectionsList;
