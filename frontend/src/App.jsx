import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AnalyzerPage from './pages/AnalyzerPage';
import ReportPage from './pages/ReportPage';
import MyRoutinePage from './pages/MyRoutinePage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import ProfilePage from './pages/ProfilePage';

function MainApp() {
  const { user, isAuthenticated, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  // Load dashboard / twin state whenever user logs in or assessment completes
  const refreshDashboard = async () => {
    if (isAuthenticated) {
      setDashLoading(true);
      try {
        const res = await api.dashboard.get();
        setDashboardData(res);
      } catch (err) {
        console.error('Error refreshing dashboard:', err);
      } finally {
        setDashLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshDashboard();
      if (activeTab === 'landing') {
        setActiveTab('dashboard');
      }
    } else {
      if (activeTab === 'dashboard' || activeTab === 'profile') {
        setActiveTab('landing');
      }
    }
  }, [isAuthenticated]);

  const handleAssessmentComplete = (newAssessmentRes) => {
    refreshDashboard();
    setActiveTab('report'); // Navigate immediately to report as requested!
  };

  const isRecoveryActive = dashboardData?.operating_mode === 'RECOVERY_MODE';
  const barrierIndex = dashboardData?.digital_twin?.barrier_health_index;

  const pageTitles = {
    landing: 'Welcome to DermaTwin',
    dashboard: 'Daily Dashboard',
    analyzer: 'Skin Analysis',
    report: 'My Reports',
    'my-routine': 'My Routine',
    twin: 'Skin History',
    profile: 'My Profile'
  };

  const handleStartCheck = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setActiveTab('analyzer');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar (Desktop and Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setMobileSidebarOpen(false);
        }}
        user={user}
        logout={logout}
        isRecoveryActive={isRecoveryActive}
        onOpenAuth={() => setShowAuthModal(true)}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          activeTab={activeTab}
          onNavigate={(tab) => setActiveTab(tab)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          currentTitle={pageTitles[activeTab] || 'DermaTwin'}
          operatingMode={dashboardData?.operating_mode || 'NORMAL'}
          barrierIndex={barrierIndex}
          onNewAssessment={handleStartCheck}
          onOpenReport={() => setActiveTab('report')}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        <main className="page-wrapper">
          {activeTab === 'landing' && (
            <LandingPage
              onStartAnalysis={handleStartCheck}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              dashboardData={dashboardData}
              onNavigate={(tab) => setActiveTab(tab)}
              onNewAssessment={handleStartCheck}
              loading={dashLoading}
            />
          )}

          {activeTab === 'analyzer' && (
            <AnalyzerPage
              onComplete={handleAssessmentComplete}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'report' && (
            <ReportPage
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'my-routine' && (
            <MyRoutinePage
              onNewAssessment={handleStartCheck}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'twin' && (
            <DigitalTwinPage
              onNavigate={(tab) => setActiveTab(tab)}
              onNewAssessment={handleStartCheck}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
        </main>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthPage
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            setActiveTab('dashboard');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
