import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import BreakingFeed from './BreakingFeed';

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  user: any;
  logout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  isAuthenticated, 
  user, 
  logout 
}) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    in: {
      opacity: 1,
      y: 0
    },
    out: {
      opacity: 0,
      y: -20
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar isAuthenticated={isAuthenticated} user={user} logout={logout} />
      <BreakingFeed />
      
      <motion.main 
        className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Layout;
