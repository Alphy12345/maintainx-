import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import Assets from './pages/Assets';
import PreventiveMaintenance from './pages/PreventiveMaintenance';
import Inventory from './pages/Inventory';
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

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
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
          <Route path="/pm" element={<PreventiveMaintenance />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
