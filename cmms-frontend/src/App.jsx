import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import WorkOrders from './pages/WorkOrders';
import Assets from './pages/Assets';
import Locations from './pages/Locations';
import Settings from './pages/Settings';
import Requests from './pages/Requests.jsx';
import Reporting from './pages/Reporting.jsx';
import Messages from './pages/Messages.jsx';
import Categories from './pages/Categories.jsx';
import PartsInventory from './pages/PartsInventory.jsx';
import AssetPackages from './pages/AssetPackages.jsx';
import WorkOrderTemplates from './pages/WorkOrderTemplates.jsx';
import Procedures from './pages/Procedures.jsx';
import Meters from './pages/Meters.jsx';
import Automations from './pages/Automations.jsx';
import AutomationCreate from './pages/AutomationCreate.jsx';
import LocationCreate from './pages/LocationCreate.jsx';
import TeamsUsers from './pages/TeamsUsers.jsx';
import InviteUsers from './pages/InviteUsers.jsx';
import Vendors from './pages/Vendors.jsx';
import VendorCreate from './pages/VendorCreate.jsx';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/work-orders" replace />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/reports" element={<Reporting />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/parts" element={<PartsInventory />} />
          <Route path="/library/asset-packages" element={<AssetPackages />} />
          <Route path="/library/work-orders" element={<WorkOrderTemplates />} />
          <Route path="/library/procedures" element={<Procedures />} />
          <Route path="/meters" element={<Meters />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/automations/create" element={<AutomationCreate />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/create" element={<LocationCreate />} />
          <Route path="/teams-users" element={<TeamsUsers />} />
          <Route path="/teams-users/invite" element={<InviteUsers />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/vendors/create" element={<VendorCreate />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
