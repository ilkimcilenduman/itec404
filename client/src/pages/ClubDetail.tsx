import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import EditClubModal from '../components/EditClubModal';
import axios from 'axios';
import { Building, CalendarEvent, PeopleFill, ArrowLeft, PencilFill, ExclamationTriangle, CheckCircle, InfoCircle, GeoAlt, Clock, ArrowRight, ChatLeftText } from 'react-bootstrap-icons';
import Button from '../components/ui/Button';

interface ClubDetailProps {
  isAuthenticated: boolean;
  user: any;
}

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
  status: string;
}

const ClubDetail: React.FC<ClubDetailProps> = ({ isAuthenticated, user }) => {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClubPresident, setIsClubPresident] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const clubResponse = await axios.get(`http://localhost:5000/api/clubs/${id}`);
        setClub(clubResponse.data);

        const eventsResponse = await axios.get(`http://localhost:5000/api/events/club/${id}`);
        setEvents(eventsResponse.data);

        const membersResponse = await axios.get(`http://localhost:5000/api/clubs/${id}/members`);
        setMembers(membersResponse.data);

        if (isAuthenticated && user) {
          const userMember = membersResponse.data.find((member: any) => member.user_id === user.id);
          if (userMember) {
            setJoinStatus(userMember.status);

            if (userMember.role === 'president' && userMember.status === 'approved') {
              setIsClubPresident(true);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching club details:', error);
        setError('Failed to load club details. Please try again later.');
        setLoading(false);
      }
    };

    fetchClubDetails();
  }, [id, isAuthenticated, user]);

  const handleJoinClub = async () => {
    if (!isAuthenticated) {
      setError('Please log in to join this club');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/clubs/${id}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setJoinStatus('pending');
      setSuccessMessage('Your request to join has been submitted and is pending approval.');
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to join club. Please try again.');
    }
  };

  const handleClubUpdate = (updatedClub: Club) => {
    setClub(updatedClub);
    setSuccessMessage('Club details updated successfully');
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

  if (!club) {
    return (
      <div className="space-y-6 pb-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          Club not found
        </div>
        <Link to="/clubs">
          <Button className="flex items-center">
            <ArrowLeft className="mr-2" />
            Back to Clubs
          </Button>
        </Link>
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
        <div>
          <div className="flex items-center">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
              <Building className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{club.name}</h1>
          </div>

          {club.category && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 mt-2">
              {club.category}
            </span>
          )}
        </div>

        {(isClubPresident || user?.role === 'admin') && (
          <Button
            variant="outline"
            onClick={() => setShowEditModal(true)}
            className="flex items-center"
          >
            <PencilFill className="mr-2" size={16} />
            Edit Club Details
          </Button>
        )}
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-4 flex items-center">
          <CheckCircle className="mr-2" />
          {successMessage}
        </div>
      )}

      {isAuthenticated && !joinStatus && (
        <Button
          onClick={handleJoinClub}
          className="flex items-center mb-4"
        >
          <PeopleFill className="mr-2" />
          Join Club
        </Button>
      )}

      {joinStatus === 'pending' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg mb-4 flex items-center">
          <InfoCircle className="mr-2" />
          Your membership request is pending approval
        </div>
      )}

      {joinStatus === 'approved' && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-4 flex items-center">
          <CheckCircle className="mr-2" />
          {isClubPresident ? 'You are the president of this club' : 'You are a member of this club'}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'about' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'events' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'members' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('forum')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'forum' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              Forum
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* About Tab Content */}
          {activeTab === 'about' && (
            <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {club.description}
            </div>
          )}

          {/* Events Tab Content */}
          {activeTab === 'events' && (
            <div>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{event.title}</h3>
                        </div>

                        <div className="p-4 flex-grow">
                          <div className="flex flex-col space-y-2 mb-3">
                            <div className="flex items-center text-neutral-600 dark:text-neutral-400 text-sm">
                              <Clock className="mr-2" size={14} />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-neutral-600 dark:text-neutral-400 text-sm">
                              <GeoAlt className="mr-2" size={14} />
                              {event.location}
                            </div>
                          </div>

                          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                            {event.description}
                          </p>
                        </div>

                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 mt-auto">
                          <Link to={`/events/${event.id}`} className="block w-full">
                            <Button variant="outline" className="w-full flex items-center justify-center">
                              <CalendarEvent className="mr-2" size={16} />
                              View Event
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                  <p>No upcoming events for this club</p>
                </div>
              )}
            </div>
          )}

          {/* Members Tab Content */}
          {activeTab === 'members' && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <PeopleFill className="mr-2" size={18} />
                Club Members
              </h3>

              {members.filter(member => member.status === 'approved').length > 0 ? (
                <div className="space-y-2">
                  {members
                    .filter(member => member.status === 'approved')
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex justify-between items-center p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      >
                        <span className="text-neutral-700 dark:text-neutral-300">{member.name}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${member.role === 'president' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-neutral-600 dark:text-neutral-400 text-center py-4">No members found</p>
              )}
            </div>
          )}

          {/* Forum Tab Content */}
          {activeTab === 'forum' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Club Forum</h3>
                <Link to={`/clubs/${id}/forum`} className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
                  View All Posts
                  <ArrowRight className="ml-1" size={16} />
                </Link>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                Join the conversation in our club forum! Discuss club activities, share ideas, and connect with other members.
              </p>
              <Link to={`/clubs/${id}/forum`}>
                <Button className="w-full flex justify-center items-center">
                  <ChatLeftText className="mr-2" size={16} />
                  Go to Forum
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link to="/clubs">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2" />
            Back to Clubs
          </Button>
        </Link>
      </div>

      {/* Edit Club Modal */}
      {club && (
        <EditClubModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          club={club}
          onClubUpdated={handleClubUpdate}
        />
      )}
    </div>
  );
};

export default ClubDetail;
