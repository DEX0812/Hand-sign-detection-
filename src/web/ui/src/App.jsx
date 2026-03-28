import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import DetectorPage from './pages/DetectorPage';
import LoginPage from './pages/LoginPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

// Higher Order Component for Protected Routes
const AdminGuard = ({ children }) => {
  const isAdmin = localStorage.getItem('adminToken') === 'true';
  return isAdmin ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/detector" element={<DetectorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Private Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
