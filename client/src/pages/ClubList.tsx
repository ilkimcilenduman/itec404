import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, PlusCircle, XCircle, Filter } from 'react-bootstrap-icons';
import Card, { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ClubRequestForm from '../components/ClubRequestForm';
import Portal from '../components/Portal';

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
}

const ClubList: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    const fetchClubs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/clubs');
        setClubs(response.data);
        setFilteredClubs(response.data);

        const uniqueCategories = [...new Set(response.data.map((club: Club) => club.category))];
        setCategories(uniqueCategories.filter(Boolean));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  useEffect(() => {
    let result = clubs;

    if (searchTerm) {
      result = result.filter(club =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter(club => club.category === selectedCategory);
    }

    setFilteredClubs(result);
  }, [searchTerm, selectedCategory, clubs]);

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
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">University Clubs</h1>
        {isAuthenticated && (
          <Button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center"
          >
            <PlusCircle className="mr-2" />
            Request New Club
          </Button>
        )}
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
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="text-neutral-500 dark:text-neutral-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input pl-10 w-full appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Club List */}
      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
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
                    {club.description?.substring(0, 150)}
                    {club.description?.length > 150 ? '...' : ''}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link to={`/clubs/${club.id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">No clubs found matching your criteria.</p>
        </div>
      )}

      {/* Club Request Modal */}
      {showRequestModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-3xl overflow-hidden my-20"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
            <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Request a New Club</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-4">
              <ClubRequestForm
                onRequestSubmitted={() => {
                  setShowRequestModal(false);
                }}
                onCancel={() => setShowRequestModal(false)}
              />
            </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default ClubList;
