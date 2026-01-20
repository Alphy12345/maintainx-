import React from 'react';
import { Menu } from 'lucide-react';
import useStore from '../../store/useStore';

const TopBar = () => {
  const { toggleSidebar } = useStore();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Right side */}
        <div />
      </div>
    </header>
  );
};

export default TopBar;
