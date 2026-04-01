import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import DailyEntriesPage from './pages/DailyEntriesPage';
import MonthlySettlementsPage from './pages/MonthlySettlementsPage';
import ReportsPage from './pages/ReportsPage';
import MonthlyReportsPage from './pages/MonthlyReportsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import StakeholderEarningsPage from './pages/StakeholderEarningsPage';
import FundDisbursementsPage from './pages/FundDisbursementsPage';
import ProfilePage from './pages/ProfilePage';

// Layout
import DashboardLayout from './components/DashboardLayout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Format API error
const formatApiErrorDetail = (detail) => {
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
};

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AAF35]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route — redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6AAF35]"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CampaignsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CampaignDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-entries"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DailyEntriesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-settlements"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <MonthlySettlementsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MonthlyReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stakeholder-earnings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StakeholderEarningsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fund-disbursements"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FundDisbursementsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { API, formatApiErrorDetail };
