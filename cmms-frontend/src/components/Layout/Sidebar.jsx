import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  MessageSquare,
  Tags,
  Boxes,
  BookOpen,
  ChevronDown,
  Calendar, 
  Archive, 
  MapPin, 
  ClipboardList,
  BarChart3, 
  Settings,
  Menu,
  X,
  Gauge,
  Zap,
  Users,
  Truck
} from 'lucide-react';
import useStore from '../../store/useStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Work Orders', href: '/work-orders', icon: Wrench },
  { name: 'Reporting', href: '/reporting', icon: BarChart3 },
  { name: 'Requests', href: '/requests', icon: ClipboardList },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Parts Inventory', href: '/parts', icon: Boxes },
  {
    name: 'Library',
    icon: BookOpen,
    children: [
      { name: 'Asset Packages', href: '/library/asset-packages' },
      { name: 'Work Orders', href: '/library/work-orders' },
      { name: 'Procedures', href: '/library/procedures' },
    ],
  },
  { name: 'Meters', href: '/meters', icon: Gauge },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Preventive Maintenance', href: '/pm', icon: Calendar },
  { name: 'Inventory', href: '/inventory', icon: Archive },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Teams / Users', href: '/teams-users', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Truck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, currentUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isLibraryRoute = useMemo(() => location.pathname.startsWith('/library'), [location.pathname]);
  const [libraryOpen, setLibraryOpen] = useState(isLibraryRoute);

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">CMMS Pro</h1>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.children && item.children.length) {
                const parentActive = isLibraryRoute;
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      className={`
                        w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                        ${parentActive
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                      onClick={() => {
                        setLibraryOpen((v) => !v);
                        if (!isLibraryRoute) {
                          navigate(item.children[0].href);
                        }
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
                    >
                      <span className="flex items-center">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${libraryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {libraryOpen && (
                      <div className="mt-1 ml-8 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.name}
                            to={child.href}
                            className={({ isActive }) => `
                              block px-3 py-2 text-sm rounded-md transition-colors duration-200
                              ${isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                toggleSidebar();
                              }
                            }}
                          >
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) => `
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    onClick={() => {
                      // Close mobile sidebar after navigation
                      if (window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
              {(currentUser?.name || 'U').trim().slice(0, 1).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'Account'}</p>
              <p className="text-xs text-gray-500">{currentUser?.email || ''}</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
