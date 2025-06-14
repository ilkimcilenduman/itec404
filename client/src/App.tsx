import { useState, useEffect, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { subscribeToNotifications, showNotification } from './services/notificationService'

import Layout from './components/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, AuthContext } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ClubList from './pages/ClubList'
import ClubDetail from './pages/ClubDetail'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'

import ManageMembers from './pages/ManageMembers'
import CalendarView from './pages/CalendarView'
import Announcements from './pages/Announcements'
import Elections from './pages/Elections'
import ElectionDetail from './pages/ElectionDetail'
import DebugPage from './pages/DebugPage'
import ClubForum from './pages/ClubForum'
import ForumPostPage from './pages/ForumPostPage'

function App() {
  const { isAuthenticated, user, loading, login, logout } = useContext(AuthContext);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (isAuthenticated && user) {
      if (!localStorage.getItem('lastNotificationCheck')) {
        localStorage.setItem('lastNotificationCheck', new Date().toISOString());
      }

      unsubscribe = subscribeToNotifications(user.id, (notifications) => {
        if (notifications.length > 0) {
          const newest = notifications[0];

          try {
            showNotification(newest.title, {
              body: `${newest.club_name}: ${newest.content.substring(0, 100)}${newest.content.length > 100 ? '...' : ''}`,
              data: {
                url: '/announcements',
                notification: newest
              }
            });
          } catch (error) {
            console.error('Error showing notification:', error);
          }
        }

        console.log(`Received ${notifications.length} new notifications`);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated, user])


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Layout isAuthenticated={isAuthenticated} user={user} logout={logout}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!isAuthenticated ? <Login login={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register login={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/clubs" element={<ClubList />} />
            <Route path="/clubs/:id" element={<ClubDetail isAuthenticated={isAuthenticated} user={user} />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/calendar-view" element={<CalendarView isAuthenticated={isAuthenticated} user={user} />} />
            <Route path="/events/:id" element={<EventDetail isAuthenticated={isAuthenticated} user={user} />} />
            <Route path="/dashboard" element={isAuthenticated && (user?.role === 'admin' || user?.role === 'club_president') ? <Dashboard user={user} /> : <Navigate to="/" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/" />} />

            <Route path="/clubs/:clubId/members" element={isAuthenticated && (user?.role === 'admin' || user?.role === 'club_president') ? <ManageMembers user={user} /> : <Navigate to="/" />} />
            <Route path="/announcements" element={
              <PrivateRoute>
                <Announcements isAuthenticated={isAuthenticated} user={user} />
              </PrivateRoute>
            } />
            <Route path="/elections" element={
              <PrivateRoute>
                <Elections />
              </PrivateRoute>
            } />
            <Route path="/elections/:id" element={
              <PrivateRoute>
                <ElectionDetail isAuthenticated={isAuthenticated} user={user} />
              </PrivateRoute>
            } />
            <Route path="/debug" element={
              <PrivateRoute>
                <DebugPage />
              </PrivateRoute>
            } />
            <Route path="/clubs/:clubId/forum" element={
              <PrivateRoute>
                <ClubForum isAuthenticated={isAuthenticated} />
              </PrivateRoute>
            } />
            <Route path="/clubs/:clubId/forum/:postId" element={
              <PrivateRoute>
                <ForumPostPage isAuthenticated={isAuthenticated} />
              </PrivateRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App
