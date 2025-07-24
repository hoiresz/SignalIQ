import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Dashboard } from './components/dashboard/Dashboard';

function App() {
  const AppContent: React.FC = () => {
    const { isAuthenticated, userProfile, refreshProfile } = useAuth();
    
    if (!isAuthenticated) {
      return <AuthPage />;
    }

    // Show onboarding if user has no profile or hasn't completed onboarding
    if (!userProfile || !userProfile.onboarding_completed) {
      return <OnboardingFlow onComplete={refreshProfile} />;
    }

    return <Dashboard />;
  };

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;