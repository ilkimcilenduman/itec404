import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ExclamationTriangle, CheckCircle, ArrowLeft, CheckCircleFill, XCircleFill, PencilFill, Trash } from 'react-bootstrap-icons';
import Button from '../components/ui/Button';
import Portal from '../components/Portal';

interface ManageMembersProps {
  user: any;
}

interface Member {
  id: number;
  user_id: number;
  name: string;
  email: string;
  student_id: string;
  role: string;
  status: string;
}

const ManageMembers: React.FC<ManageMembersProps> = ({ user }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingMember, setProcessingMember] = useState<number | null>(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const userClubsResponse = await axios.get('http://localhost:5000/api/users/me/clubs', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const userClubs = userClubsResponse.data;
        const isPresident = userClubs.some((c: any) =>
          c.id.toString() === clubId &&
          c.member_role === 'president' &&
          c.member_status === 'approved'
        );

        if (!isPresident && user.role !== 'admin') {
          navigate('/dashboard');
          return;
        }

        const clubResponse = await axios.get(`http://localhost:5000/api/clubs/${clubId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setClub(clubResponse.data);

        const membersResponse = await axios.get(`http://localhost:5000/api/clubs/${clubId}/members`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const allMembers = membersResponse.data;
        setMembers(allMembers.filter((m: Member) => m.status === 'approved'));
        setPendingRequests(allMembers.filter((m: Member) => m.status === 'pending'));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, user, navigate]);

  const handleMembershipRequest = async (memberId: number, status: 'approved' | 'rejected') => {
    try {
      setProcessingMember(memberId);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/clubs/${clubId}/members/${memberId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (status === 'approved') {
        const approvedMember = pendingRequests.find(m => m.user_id === memberId);
        if (approvedMember) {
          approvedMember.status = 'approved';
          setMembers([...members, approvedMember]);
          setPendingRequests(pendingRequests.filter(m => m.user_id !== memberId));
        }
        setSuccess(`Membership request approved successfully`);
      } else {
        setPendingRequests(pendingRequests.filter(m => m.user_id !== memberId));
        setSuccess(`Membership request rejected successfully`);
      }

      setProcessingMember(null);
    } catch (error: any) {
      console.error('Error processing membership request:', error);
      setError(error.response?.data?.message || 'Failed to process membership request');
      setProcessingMember(null);
    }
  };

  const openRoleModal = (member: Member) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setShowRoleModal(true);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
  };

  const updateMemberRole = async () => {
    if (!selectedMember || !selectedRole) return;

    try {
      setError('');
      setSuccess('');
      setRemovingMember(true);

      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/clubs/${clubId}/members/${selectedMember.user_id}/role`,
        { role: selectedRole },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedMembers = members.map(member => {
        if (member.user_id === selectedMember.user_id) {
          return { ...member, role: selectedRole };
        }
        return member;
      });

      setMembers(updatedMembers);
      setSuccess(`Member role updated successfully`);
      setShowRoleModal(false);
      setRemovingMember(false);
    } catch (error: any) {
      console.error('Error updating member role:', error);
      setError(error.response?.data?.message || 'Failed to update member role');
      setRemovingMember(false);
    }
  };

  const openRemoveModal = (member: Member) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const removeMember = async () => {
    if (!selectedMember) return;

    try {
      setError('');
      setSuccess('');
      setRemovingMember(true);

      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/clubs/${clubId}/members/${selectedMember.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMembers(members.filter(member => member.user_id !== selectedMember.user_id));
      setSuccess(`Member removed successfully`);
      setShowRemoveModal(false);
      setRemovingMember(false);
    } catch (error: any) {
      console.error('Error removing member:', error);
      setError(error.response?.data?.message || 'Failed to remove member');
      setRemovingMember(false);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Manage Members: {club?.name}</h1>
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

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

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6">
        <div className="bg-primary-50 dark:bg-primary-900/30 p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Pending Membership Requests</h2>
        </div>

        <div className="p-4">
          {pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Student ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {pendingRequests.map((member) => (
                    <tr key={member.user_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{member.email}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{member.student_id}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                            onClick={() => handleMembershipRequest(member.user_id, 'approved')}
                            disabled={processingMember === member.user_id}
                          >
                            {processingMember === member.user_id ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-1"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircleFill className="mr-1" size={14} />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center"
                            onClick={() => handleMembershipRequest(member.user_id, 'rejected')}
                            disabled={processingMember === member.user_id}
                          >
                            {processingMember === member.user_id ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-red-500 dark:border-red-400 rounded-full border-t-transparent mr-1"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <XCircleFill className="mr-1" size={14} />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-neutral-600 dark:text-neutral-400 text-center py-6">No pending membership requests</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="bg-primary-50 dark:bg-primary-900/30 p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Current Members</h2>
        </div>

        <div className="p-4">
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Student ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {members.map((member) => (
                    <tr key={member.user_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-150">
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{member.email}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{member.student_id}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${member.role === 'president' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {member.role !== 'president' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 border-primary-200 hover:border-primary-300 dark:border-primary-800"
                              onClick={() => openRoleModal(member)}
                            >
                              <PencilFill className="mr-1" size={12} />
                              Change Role
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 hover:border-red-300 dark:border-red-800"
                              onClick={() => openRemoveModal(member)}
                            >
                              <Trash className="mr-1" size={12} />
                              Remove
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-neutral-600 dark:text-neutral-400 text-center py-6">No members found</p>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedMember && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] p-4">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-md overflow-hidden"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <PencilFill className="mr-2" size={16} />
                  Change Member Role
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircleFill size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                  Change role for <span className="font-semibold">{selectedMember.name}</span>
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Current Role
                  </label>
                  <div className="text-neutral-900 dark:text-neutral-100 font-semibold">
                    {selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1)}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    New Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={handleRoleChange}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="member">Member</option>
                    <option value="vice_president">Vice President</option>
                    <option value="secretary">Secretary</option>
                    <option value="treasurer">Treasurer</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRoleModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateMemberRole}
                    disabled={removingMember}
                  >
                    {removingMember ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Role'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}

      {/* Remove Member Modal */}
      {showRemoveModal && selectedMember && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[1000] p-4">
            <motion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg w-full max-w-md overflow-hidden"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="bg-red-50 dark:bg-red-900/30 p-4 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <Trash className="mr-2" size={16} />
                  Remove Member
                </h3>
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XCircleFill size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg mb-4 flex items-center">
                  <ExclamationTriangle className="mr-2" />
                  This action cannot be undone.
                </div>

                <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                  Are you sure you want to remove <span className="font-semibold">{selectedMember.name}</span> from this club?
                </p>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRemoveModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={removeMember}
                    disabled={removingMember}
                  >
                    {removingMember ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                        Removing...
                      </>
                    ) : (
                      'Remove Member'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default ManageMembers;
