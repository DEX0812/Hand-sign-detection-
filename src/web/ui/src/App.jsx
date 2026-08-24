import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import DetectorPage from './pages/DetectorPage';
import LoginPage from './pages/LoginPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : 'https://hand-sign-detection-4pz0.onrender.com');

// Admin Auth Guard
const AdminGuard = ({ children }) => {
  const isAdmin = localStorage.getItem('adminToken') === 'true';
  return isAdmin ? children : <Navigate to="/login" replace />;
};

// User Auth Guard (Ensures logged in)
const UserAuthGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  const userToken = localStorage.getItem('userToken') === 'true';
  return (userToken && token) ? children : <Navigate to="/login" replace />;
};

// User Auth and Subscription Guard (Ensures active trial or premium sub)
const SubscriptionGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  const userToken = localStorage.getItem('userToken') === 'true';
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!userToken || !token) {
      setChecking(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.status === 'success' && data.userStatus.has_access) {
          setHasAccess(true);
        }
      } catch (err) {
        console.error("Error checking access status:", err);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [token, userToken]);

  if (!userToken || !token) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50 font-mono text-xs uppercase tracking-widest gap-3 bg-black">
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-emerald-500 animate-spin" /> Synchronizing neural clearance...
      </div>
    );
  }

  return hasAccess ? children : <Navigate to="/pricing" replace />;
};

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Subscription-Protected Routes */}
        <Route 
          path="/detector" 
          element={
            <SubscriptionGuard>
              <DetectorPage />
            </SubscriptionGuard>
          } 
        />

        {/* Member Private Routes */}
        <Route 
          path="/pricing" 
          element={
            <UserAuthGuard>
              <PricingPage />
            </UserAuthGuard>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <UserAuthGuard>
              <CheckoutPage />
            </UserAuthGuard>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <UserAuthGuard>
              <ProfilePage />
            </UserAuthGuard>
          } 
        />
        
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
