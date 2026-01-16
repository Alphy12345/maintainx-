import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import useStore from '../../store/useStore';

const Layout = ({ children }) => {
  const { sidebarOpen, darkMode } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  return (
    <div className="h-screen overflow-hidden lg:flex bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
        <TopBar />
        
        <main className="p-6 flex-1 overflow-y-auto text-gray-900 dark:text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
