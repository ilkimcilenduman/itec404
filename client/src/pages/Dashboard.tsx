import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PlusCircle, XCircle, ExclamationTriangle, PersonFill, CalendarEvent, Building, MegaphoneFill, Award, GeoAlt, Clock } from 'react-bootstrap-icons';
import Button from '../components/ui/Button';
import CreateEventModal from '../components/CreateEventModal';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import ElectionForm from '../components/ElectionForm';
import ActiveElectionsList from '../components/ActiveElectionsList';
import { getClubElections } from '../services/electionApi';
import Portal from '../components/Portal';

interface DashboardProps {
  user: any;
}

interface Club {
  id: number;
  name: string;
  description: string;
  member_role: string;
  member_status: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  club_name: string;
}

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

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myElections, setMyElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('clubs'); // Default active tab
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [showCreateElectionModal, setShowCreateElectionModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setError('');
        const token = localStorage.getItem('token');

        const clubsResponse = await axios.get('http://localhost:5000/api/users/me/clubs', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMyClubs(clubsResponse.data);

        const eventsResponse = await axios.get('http://localhost:5000/api/users/me/events', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMyEvents(eventsResponse.data);

        const presidentClubs = clubsResponse.data.filter(
          (club: Club) => club.member_role === 'president' && club.member_status === 'approved'
        );

        if (presidentClubs.length > 0) {
          try {
            const electionsPromises = presidentClubs.map((club: Club) =>
              getClubElections(club.id)
            );
            const electionsResults = await Promise.all(electionsPromises);

            const allElections = electionsResults.flat();
            setMyElections(allElections);
          } catch (err) {
            console.error('Error fetching elections:', err);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load your data. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const sortedEvents = [...myEvents].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleEventCreated = () => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const eventsResponse = await axios.get('http://localhost:5000/api/users/me/events', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMyEvents(eventsResponse.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  };

  const handleElectionCreated = () => {
    const fetchElections = async () => {
      try {
        const token = localStorage.getItem('token');
        const clubsResponse = await axios.get('http://localhost:5000/api/users/me/clubs', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const presidentClubs = clubsResponse.data.filter(
          (club: Club) => club.member_role === 'president' && club.member_status === 'approved'
        );

        if (presidentClubs.length > 0) {
          const electionsPromises = presidentClubs.map((club: Club) =>
            getClubElections(club.id)
          );
          const electionsResults = await Promise.all(electionsPromises);

          const allElections = electionsResults.flat();
          setMyElections(allElections);
        }
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    };

    fetchElections();
    setShowCreateElectionModal(false);
  };

  const openCreateElectionModal = (club: Club) => {
    setSelectedClub(club);
    setShowCreateElectionModal(true);
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
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Dashboard</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Welcome, {user.name}!</h2>
            <div className="mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
              <p className="flex items-center"><PersonFill className="mr-2" size={14} /> Student ID: {user.student_id}</p>
              <p className="flex items-center"><PersonFill className="mr-2" size={14} /> Email: {user.email}</p>
              <p className="flex items-center"><PersonFill className="mr-2" size={14} /> Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            </div>
          </div>
          <Link to="/profile">
            <Button variant="outline" className="flex items-center">
              <PersonFill className="mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Elections Section - Only for regular members */}
      {user.role !== 'club_president' && user.role !== 'admin' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 mt-6">
          <ActiveElectionsList userId={user?.id} />
        </div>
      )}

      {/* Tabs Component */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('clubs')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'clubs' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              My Clubs
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'events' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
            >
              My Events
            </button>
            {user.role === 'club_president' && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'manage' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
              >
                Manage Club
              </button>
            )}
            {(user.role === 'club_president' || user.role === 'admin') && (
              <button
                onClick={() => setActiveTab('elections')}
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'elections' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
              >
                Elections
              </button>
            )}
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'admin' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
              >
                Admin
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* My Clubs Tab Content */}
          {activeTab === 'clubs' && (
            <div>
              {myClubs.length > 0 ? (
                <div className="space-y-4">
                  {myClubs.map((club) => (
                    <div key={club.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{club.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${club.member_role === 'president' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'}`}>
                            {club.member_role.charAt(0).toUpperCase() + club.member_role.slice(1)}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${club.member_status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : club.member_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                            {club.member_status.charAt(0).toUpperCase() + club.member_status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <Link to={`/clubs/${club.id}`} className="mt-3 md:mt-0">
                        <Button variant="outline" className="flex items-center">
                          <Building className="mr-2" size={16} />
                          View Club
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                  <p>You haven't joined any clubs yet.</p>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link to="/clubs">
                  <Button className="flex items-center mx-auto">
                    <Building className="mr-2" />
                    Browse Clubs
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* My Events Tab Content */}
          {activeTab === 'events' && (
            <div>
              {sortedEvents.length > 0 ? (
                <div className="space-y-4">
                  {sortedEvents.map((event) => (
                    <div key={event.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{event.title}</h3>
                        <div className="mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
                          <p className="flex items-center text-sm">
                            <Clock className="mr-2" size={14} />
                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="flex items-center text-sm">
                            <GeoAlt className="mr-2" size={14} />
                            {event.location || 'No location specified'}
                          </p>
                          <p className="flex items-center text-sm text-primary-600 dark:text-primary-400">
                            <Building className="mr-2" size={14} />
                            {event.club_name}
                          </p>
                        </div>
                      </div>
                      <Link to={`/events/${event.id}`} className="mt-3 md:mt-0">
                        <Button variant="outline" className="flex items-center">
                          <CalendarEvent className="mr-2" size={16} />
                          View Event
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                  <p>You haven't registered for any events yet.</p>
                </div>
              )}

              <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-4">
                <Link to="/events">
                  <Button className="flex items-center">
                    <CalendarEvent className="mr-2" />
                    Browse Events
                  </Button>
                </Link>
                {user.role === 'club_president' && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowCreateEventModal(true)}
                    className="flex items-center"
                  >
                    <PlusCircle className="mr-2" />
                    Create New Event
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Manage Club Tab Content */}
          {activeTab === 'manage' && user.role === 'club_president' && (
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Club Management</h2>
              <p className="text-neutral-700 dark:text-neutral-300 mb-6">As a club president, you can manage your club's details, events, and members.</p>

              {myClubs
                .filter(club => club.member_role === 'president' && club.member_status === 'approved')
                .map(club => (
                  <div key={club.id} className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{club.name}</h3>
                    <div className="flex flex-wrap gap-3">
                      <Link to={`/clubs/${club.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <Building className="mr-2" size={14} />
                          View Club
                        </Button>
                      </Link>
                      <Link to={`/clubs/${club.id}/members`}>
                        <Button variant="outline" size="sm" className="flex items-center">
                          <PersonFill className="mr-2" size={14} />
                          Manage Members
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateEventModal(true)}
                        className="flex items-center"
                      >
                        <CalendarEvent className="mr-2" size={14} />
                        Create Event
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateAnnouncementModal(true)}
                        className="flex items-center"
                      >
                        <MegaphoneFill className="mr-2" size={14} />
                        Send Announcement
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCreateElectionModal(club)}
                        className="flex items-center"
                      >
                        <Award className="mr-2" size={14} />
                        Create Election
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Elections Tab Content */}
          {activeTab === 'elections' && (user.role === 'club_president' || user.role === 'admin') && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Club Elections</h2>
                <Link to="/elections">
                  <Button variant="outline" className="flex items-center mt-2 md:mt-0">
                    <Award className="mr-2" />
                    View All Elections
                  </Button>
                </Link>
              </div>

              {myElections.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {myElections.map((election) => (
                    <div key={election.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{election.title}</h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${election.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : election.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300'}`}>
                              {election.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-primary-600 dark:text-primary-400">
                            Club: {election.club_name}
                          </p>
                        </div>
                      </div>
                      <Link to={`/elections/${election.id}`} className="mt-3 md:mt-0">
                        <Button variant="outline" className="flex items-center">
                          <Award className="mr-2" size={16} />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg mb-6">
                  No elections found for your clubs.
                </div>
              )}

              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Create New Election</h3>
                <p className="text-neutral-700 dark:text-neutral-300 mb-6">As a club president, you can create elections for your club members to vote for new leadership positions.</p>

                {myClubs.filter(club => club.member_role === 'president' && club.member_status === 'approved').length > 0 ? (
                  <div>
                    <p className="text-neutral-700 dark:text-neutral-300 mb-4">Select a club to create an election for:</p>
                    <div className="space-y-3">
                      {myClubs
                        .filter(club => club.member_role === 'president' && club.member_status === 'approved')
                        .map(club => (
                          <Button
                            key={club.id}
                            variant="outline"
                            onClick={() => openCreateElectionModal(club)}
                            className="flex items-center w-full md:w-auto"
                          >
                            <Award className="mr-2" />
                            Create Election for {club.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg">
                    You are not a president of any clubs. You need to be a club president to create elections.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Tab Content */}
          {activeTab === 'admin' && user.role === 'admin' && (
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Admin Panel</h2>
              <p className="text-neutral-700 dark:text-neutral-300 mb-6">As an administrator, you have access to additional management features.</p>

              <Link to="/admin">
                <Button className="flex items-center bg-red-600 hover:bg-red-700 text-white">
                  <PersonFill className="mr-2" />
                  Go to Admin Panel
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        show={showCreateEventModal}
        onHide={() => setShowCreateEventModal(false)}
        user={user}
        onEventCreated={handleEventCreated}
      />

      {/* Create Announcement Modal */}
      <CreateAnnouncementModal
        show={showCreateAnnouncementModal}
        onHide={() => setShowCreateAnnouncementModal(false)}
        user={user}
        onAnnouncementCreated={() => {}}
      />

      {/* Create Election Modal - Custom Implementation */}
      {showCreateElectionModal && selectedClub && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-3xl overflow-hidden my-20"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
            <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Create New Election for {selectedClub.name}</h3>
              <button
                onClick={() => setShowCreateElectionModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              <ElectionForm
                user={user}
                onElectionCreated={handleElectionCreated}
                onCancel={() => setShowCreateElectionModal(false)}
              />
            </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default Dashboard;
