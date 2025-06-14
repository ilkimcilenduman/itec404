import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationsDropdown from './NotificationsDropdown';
import { useTheme } from '../context/ThemeContext';
import { SunFill, MoonFill, List, X } from 'react-bootstrap-icons';

interface NavbarProps {
  isAuthenticated: boolean;
  user: any;
  logout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Clubs', path: '/clubs' },
    { name: 'Events', path: '/events' },
    { name: 'Calendar', path: '/calendar-view' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Elections', path: '/elections' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-heading font-bold text-primary-600 dark:text-primary-400"
          >
            EMU Club Management
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${location.pathname === link.path ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right side - Auth & Theme */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <MoonFill size={18} /> : <SunFill size={18} />}
            </button>

            {/* Auth Buttons or User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <NotificationsDropdown isAuthenticated={isAuthenticated} />

                <div className="relative group">
                  <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200">
                    <span>{user?.name || 'User'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                    {(user?.role === 'admin' || user?.role === 'club_president') && (
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        Dashboard
                      </Link>
                    )}
                    <Link to="/profile" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700">
                      Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700">
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-neutral-200 dark:border-neutral-700"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <MoonFill size={18} /> : <SunFill size={18} />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800"
          >
            <div className="container mx-auto px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${location.pathname === link.path ? 'text-primary-600 dark:text-primary-400 bg-neutral-100 dark:bg-neutral-800' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="border-t border-neutral-200 dark:border-neutral-800 my-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {user?.name || 'User'}
                      </span>
                      <NotificationsDropdown isAuthenticated={isAuthenticated} />
                    </div>

                    {(user?.role === 'admin' || user?.role === 'club_president') && (
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200"
                      >
                        Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200"
                    >
                      Profile
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200"
                      >
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-800 transition-colors duration-200 mt-2"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 px-3 py-2">
                    <Link
                      to="/login"
                      className="block px-3 py-2 rounded-lg text-center text-base font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors duration-200 border border-neutral-300 dark:border-neutral-700"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-3 py-2 rounded-lg text-center text-base font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
