import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import useStore from '../../store/useStore';

const Layout = ({ children }) => {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <TopBar />
        
        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
