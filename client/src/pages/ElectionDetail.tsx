import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getElectionById, voteInElection, getElectionResults, checkUserVoted, applyForCandidacy, getCandidateApplications, updateCandidateApplication } from '../services/electionApi';
import { Award, Calendar2, Clock, Building, ArrowLeft, CheckCircle, ExclamationTriangle, InfoCircle, PersonFill, XCircle } from 'react-bootstrap-icons';
import Button from '../components/ui/Button';
import CandidateApplicationForm from '../components/CandidateApplicationForm';
import ManageCandidatesPanel from '../components/ManageCandidatesPanel';
import Portal from '../components/Portal';

interface ElectionDetailProps {
  isAuthenticated: boolean;
  user: any;
}

interface Candidate {
  id: number;
  user_id: number;
  name: string;
  email: string;
  student_id: string;
  position: string;
  statement?: string;
  vote_count?: number;
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
  candidates: Candidate[];
}

interface ElectionResults {
  results: Candidate[];
  total_votes: number;
}

const ElectionDetail: React.FC<ElectionDetailProps> = ({ isAuthenticated, user }) => {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showManageCandidates, setShowManageCandidates] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  useEffect(() => {
    const fetchElectionData = async () => {
      try {
        setLoading(true);
        setError('');

        const electionData = await getElectionById(parseInt(id!));
        setElection(electionData);

        if (isAuthenticated) {
          const votedResponse = await checkUserVoted(parseInt(id!));
          setHasVoted(votedResponse.hasVoted);
        }

        if (electionData.status === 'completed') {
          const resultsData = await getElectionResults(parseInt(id!));
          setResults(resultsData);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load election details');
        setLoading(false);
      }
    };

    if (id) {
      fetchElectionData();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && election && (user?.role === 'club_president' || user?.role === 'admin')) {
      const fetchApplications = async () => {
        try {
          setLoadingApplications(true);
          const data = await getCandidateApplications(parseInt(id!));
          setApplications(data);
        } catch (err) {
          console.error('Error fetching applications:', err);
        } finally {
          setLoadingApplications(false);
        }
      };

      fetchApplications();
    }
  }, [id, isAuthenticated, election, user]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      setError('You must be logged in to vote');
      return;
    }

    if (!selectedCandidate) {
      setError('Please select a candidate to vote for');
      return;
    }

    try {
      setVotingInProgress(true);
      setError('');
      setSuccess('');

      await voteInElection(parseInt(id!), selectedCandidate);

      setSuccess('Your vote has been recorded successfully');
      setHasVoted(true);
      setVotingInProgress(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record your vote');
      setVotingInProgress(false);
    }
  };

  const handleApplicationSubmitted = () => {
    setShowApplyForm(false);
    if (id) {
      const fetchElectionData = async () => {
        try {
          const electionData = await getElectionById(parseInt(id));
          setElection(electionData);
        } catch (err) {
          console.error('Error refreshing election data:', err);
        }
      };
      fetchElectionData();
    }
  };

  const handleCandidateAdded = () => {
    if (id) {
      const fetchElectionData = async () => {
        try {
          const electionData = await getElectionById(parseInt(id));
          setElection(electionData);
        } catch (err) {
          console.error('Error refreshing election data:', err);
        }
      };
      fetchElectionData();
    }

    if (isAuthenticated && (user?.role === 'club_president' || user?.role === 'admin') && id) {
      getCandidateApplications(parseInt(id))
        .then(data => setApplications(data))
        .catch(err => console.error('Error fetching applications:', err));
    }
  };

  const isClubPresident = user?.role === 'club_president' && election?.club_id === parseInt(id!);

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

  if (!election) {
    return (
      <div className="space-y-6 pb-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          Election not found
        </div>
        <Link to="/elections">
          <Button className="flex items-center">
            <ArrowLeft className="mr-2" />
            Back to Elections
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        className="flex items-center mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/elections">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2" />
            Back to Elections
          </Button>
        </Link>
      </motion.div>

      <motion.div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="bg-primary-50/50 dark:bg-primary-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
          <div className="flex items-center">
            <Award className="text-primary-600 dark:text-primary-400 mr-2" size={20} />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{election.title}</h2>
          </div>
          {getStatusBadge(election.status)}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {election.description && (
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">{election.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center text-neutral-700 dark:text-neutral-300">
                  <Building className="mr-2" size={16} />
                  <span className="font-medium">Club:</span>&nbsp;{election.club_name}
                </div>
                <div className="flex items-center text-neutral-700 dark:text-neutral-300">
                  <Calendar2 className="mr-2" size={16} />
                  <span className="font-medium">Start Date:</span>&nbsp;{new Date(election.start_date).toLocaleString()}
                </div>
                <div className="flex items-center text-neutral-700 dark:text-neutral-300">
                  <Clock className="mr-2" size={16} />
                  <span className="font-medium">End Date:</span>&nbsp;{new Date(election.end_date).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-primary-50/30 dark:bg-primary-900/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center">
                <InfoCircle className="mr-2" size={18} />
                Election Status
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                This election is currently <span className="font-medium">{election.status}</span>.
                {election.status === 'upcoming' && (
                  <span> Voting will begin on {new Date(election.start_date).toLocaleDateString()}.</span>
                )}
                {election.status === 'active' && (
                  <span> Voting is open until {new Date(election.end_date).toLocaleDateString()}.</span>
                )}
                {election.status === 'completed' && (
                  <span> Voting has ended. Results are available below.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-4 flex items-center">
          <CheckCircle className="mr-2" />
          {success}
        </div>
      )}

      {/* Candidates Section */}
      <motion.div
        className="flex items-center mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <PersonFill className="text-primary-600 dark:text-primary-400 mr-2" size={20} />
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Candidates</h3>
      </motion.div>

      {election.candidates.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg">
          <InfoCircle className="mr-2 inline-block" />
          No candidates have been added to this election yet.
        </div>
      ) : (
        <>
          {/* Active Election - Voting Interface */}
          {election.status === 'active' && isAuthenticated && !hasVoted && (
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="bg-green-50/50 dark:bg-green-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700">
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Cast Your Vote</h4>
              </div>

              <div className="p-6">
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">Select a candidate and click "Submit Vote" to cast your vote in this election.</p>

                <div className="space-y-3 mb-6">
                  {election.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors duration-200 ${selectedCandidate === candidate.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{candidate.name}</h5>
                          <div className="text-neutral-700 dark:text-neutral-300 mt-1"><span className="font-medium">Position:</span> {candidate.position}</div>
                          {candidate.statement && <div className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm">{candidate.statement}</div>}
                        </div>
                        {selectedCandidate === candidate.id && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleVote}
                  disabled={!selectedCandidate || votingInProgress}
                >
                  {votingInProgress ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Vote'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Already Voted Message */}
          {election.status === 'active' && isAuthenticated && hasVoted && (
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg mb-6 flex items-center">
              <InfoCircle className="mr-2" />
              You have already cast your vote in this election. Results will be available once the election is completed.
            </div>
          )}

          {/* Login to Vote Message */}
          {election.status === 'active' && !isAuthenticated && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg mb-6 flex items-center">
              <ExclamationTriangle className="mr-2" />
              Please <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mx-1">log in</Link> to vote in this election.
            </div>
          )}

          {/* Completed Election - Results */}
          {election.status === 'completed' && results && (
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="bg-primary-50/50 dark:bg-primary-900/10 p-4 border-b border-neutral-200 dark:border-neutral-700">
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Election Results</h4>
              </div>

              <div className="p-6">
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">Total votes cast: <span className="font-medium">{results.total_votes}</span></p>

                <div className="space-y-3">
                  {results.results.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex justify-between items-center"
                    >
                      <div>
                        <h5 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{candidate.name}</h5>
                        <div className="text-neutral-700 dark:text-neutral-300"><span className="font-medium">Position:</span> {candidate.position}</div>
                      </div>
                      <div>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                          {candidate.vote_count} votes
                          {results.total_votes > 0 && (
                            <span className="ml-1">({Math.round((candidate.vote_count! / results.total_votes) * 100)}%)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* List of Candidates (for upcoming elections or when not showing voting interface) */}
          {(election.status === 'upcoming' || (election.status === 'active' && (!isAuthenticated || hasVoted))) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {election.candidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + (index * 0.05) }}
                >
                  <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden h-full flex flex-col">
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 border-b border-neutral-200 dark:border-neutral-700">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300">
                        {candidate.position}
                      </span>
                    </div>

                    <div className="p-4 flex-grow">
                      <h5 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{candidate.name}</h5>
                      <p className="text-neutral-500 dark:text-neutral-500 text-sm mb-3">{candidate.student_id}</p>
                      {candidate.statement && (
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm">{candidate.statement}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Apply for Candidacy Button - Only for members who are not candidates */}
      {isAuthenticated && election &&
       (election.status === 'upcoming' || election.status === 'active') &&
       !election.candidates.some(c => c.user_id === user?.id) &&
       !isClubPresident &&
       user?.role !== 'admin' && (
        <div className="mb-6">
          <Button
            onClick={() => setShowApplyForm(true)}
            className="flex items-center"
          >
            <Award className="mr-2" />
            Apply for Candidacy
          </Button>
        </div>
      )}

      {/* Manage Candidates Button - Only for club president */}
      {isAuthenticated && election && isClubPresident && (
        <div className="mb-6">
          <Button
            onClick={() => setShowManageCandidates(true)}
            className="flex items-center"
          >
            <PersonFill className="mr-2" />
            Manage Candidates
          </Button>
        </div>
      )}

      {/* Apply for Candidacy Modal */}
      {showApplyForm && election && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-lg overflow-hidden my-20"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <Award className="mr-2" />
                  Apply for Candidacy
                </h3>
                <button
                  onClick={() => setShowApplyForm(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6">
                <CandidateApplicationForm
                  electionId={parseInt(id!)}
                  clubId={election.club_id}
                  onApplicationSubmitted={handleApplicationSubmitted}
                  onCancel={() => setShowApplyForm(false)}
                />
              </div>
            </motion.div>
          </div>
        </Portal>
      )}

      {/* Manage Candidates Modal */}
      {showManageCandidates && election && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center z-[1000] p-4 overflow-y-auto">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-3xl overflow-hidden my-20"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <PersonFill className="mr-2" />
                  Manage Candidates
                </h3>
                <button
                  onClick={() => setShowManageCandidates(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6">
                <ManageCandidatesPanel
                  electionId={parseInt(id!)}
                  clubId={election.club_id}
                  candidates={election.candidates}
                  onCandidateAdded={handleCandidateAdded}
                />
              </div>
            </motion.div>
          </div>
        </Portal>
      )}

      <div className="mt-6">
        <Link to="/elections">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2" />
            Back to Elections
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ElectionDetail;
