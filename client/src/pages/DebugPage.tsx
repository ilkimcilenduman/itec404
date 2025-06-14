import React, { useState, useEffect } from 'react';
import { checkClubPresidency, getUserClubs } from '../services/userApi';

const DebugPage: React.FC = () => {
  const [presidencyInfo, setPresidencyInfo] = useState<any>(null);
  const [userClubs, setUserClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      setError('');

      const presidencyData = await checkClubPresidency();
      setPresidencyInfo(presidencyData);

      const clubsData = await getUserClubs();
      setUserClubs(clubsData);

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching debug info:', err);
      setError(err.response?.data?.message || 'Failed to fetch debug information');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            {presidencyInfo?.user && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <p><strong>ID:</strong> {presidencyInfo.user.id}</p>
                <p><strong>Name:</strong> {presidencyInfo.user.name}</p>
                <p><strong>Email:</strong> {presidencyInfo.user.email}</p>
                <p><strong>Role:</strong> {presidencyInfo.user.role}</p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Club Presidencies</h2>
            {presidencyInfo?.presidencies && presidencyInfo.presidencies.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <ul className="space-y-2">
                  {presidencyInfo.presidencies.map((presidency: any) => (
                    <li key={presidency.id} className="border-b pb-2">
                      <p><strong>Club ID:</strong> {presidency.club_id}</p>
                      <p><strong>Club Name:</strong> {presidency.club_name}</p>
                      <p><strong>Role:</strong> {presidency.role}</p>
                      <p><strong>Status:</strong> {presidency.status}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-red-500">You are not a president of any club</p>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">All User Clubs</h2>
            {userClubs.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <ul className="space-y-2">
                  {userClubs.map((club: any) => (
                    <li key={club.id} className="border-b pb-2">
                      <p><strong>Club ID:</strong> {club.id}</p>
                      <p><strong>Club Name:</strong> {club.name}</p>
                      <p><strong>Role:</strong> {club.member_role}</p>
                      <p><strong>Status:</strong> {club.member_status}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-red-500">You are not a member of any club</p>
            )}
          </div>
          
          <button
            onClick={fetchDebugInfo}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
};

export default DebugPage;
